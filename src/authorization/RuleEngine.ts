import { GraphRepository } from "./GraphRepository.js";
import { RebacSchema, schema as defaultSchema, RuleGroup, Rule } from "./Schema.js";
import { ExecutionProfiler } from "./ExecutionProfiler.js";
import { CaveatEvaluator, CaveatContext, globalCaveatEvaluator } from "./CaveatEvaluator.js";
import { ABACEvaluator, ABACContext } from "./ABACEvaluator.js";
import { ExplainTreeBuilder } from "./ExplainTree.js";
import { AttributeConditionNode } from "../compiler/ast/Nodes.js";
import prisma from "../prisma/client.js";

export interface TraceStep {
    resourceId: number;
    resourceType: string;
    permission: string;
    rule: string;
    result: boolean;
}

export interface EvaluationContext {
    userId: number;
    subjectSet?: Set<number>;
    permission: string;
    processing: Set<string>;
    memo: Map<string, boolean>;
    trace: TraceStep[];
    profiler?: ExecutionProfiler;
    explainTree?: ExplainTreeBuilder;
    // ABAC runtime attributes: { user: {...}, patient: {...}, ... }
    attributes?: ABACContext;
    // Caveat context passed to CaveatEvaluator
    caveatContext?: CaveatContext;
    caveatEvaluator?: CaveatEvaluator;
    abacEvaluator?: ABACEvaluator;
}

export class RuleEngine {
    private abacEvaluator = new ABACEvaluator();

    constructor(
        private repository: GraphRepository,
        private schema: RebacSchema = defaultSchema,
        private caveatEvaluator: CaveatEvaluator = globalCaveatEvaluator
    ) { }

    async checkPermission(
        context: EvaluationContext,
        resource: { id: number; type: string }
    ): Promise<boolean> {
        context.profiler?.enterDepth();

        const cacheKey = `${context.userId}:${resource.id}:${context.permission}`;

        if (context.processing.has(cacheKey)) {
            context.profiler?.exitDepth();
            return false;
        }

        if (context.memo.has(cacheKey)) {
            context.profiler?.incrementMemoHit();
            context.profiler?.exitDepth();
            return context.memo.get(cacheKey)!;
        }

        context.processing.add(cacheKey);

        const permissionConfig = this.schema[resource.type]?.[context.permission];
        let result = false;

        context.explainTree?.open("Rule", `${resource.type}.${context.permission}`);

        if (permissionConfig) {
            if ("operator" in permissionConfig) {
                result = await this.evaluateOperator(context, resource, permissionConfig);
            } else if (Array.isArray(permissionConfig)) {
                result = await this.evaluateOperator(context, resource, {
                    operator: "OR",
                    rules: permissionConfig
                });
            } else {
                result = await this.evaluateRule(context, resource, permissionConfig);
            }
        }

        context.explainTree?.close(result);
        context.processing.delete(cacheKey);
        context.memo.set(cacheKey, result);

        context.profiler?.exitDepth();
        return result;
    }

    async evaluateOperator(
        context: EvaluationContext,
        resource: { id: number; type: string },
        group: RuleGroup
    ): Promise<boolean> {
        const operator = group.operator;
        context.explainTree?.open(operator as any, operator);

        let result = false;

        if (operator === "OR") {
            for (const item of group.rules) {
                const allowed = await this.evaluateRuleOrGroup(context, resource, item);
                if (allowed) { result = true; break; }
            }
        } else if (operator === "AND") {
            result = group.rules.length > 0;
            for (const item of group.rules) {
                const allowed = await this.evaluateRuleOrGroup(context, resource, item);
                if (!allowed) { result = false; break; }
            }
        } else if (operator === "NOT") {
            if (group.rules.length === 0) {
                result = true;
            } else {
                const allowed = await this.evaluateRuleOrGroup(context, resource, group.rules[0]);
                result = !allowed;
            }
        }

        context.explainTree?.close(result);
        return result;
    }

    async evaluateRuleOrGroup(
        context: EvaluationContext,
        resource: { id: number; type: string },
        item: Rule | RuleGroup
    ): Promise<boolean> {
        if ("operator" in item) {
            return this.evaluateOperator(context, resource, item);
        } else {
            return this.evaluateRule(context, resource, item);
        }
    }

    async evaluateRule(
        context: EvaluationContext,
        resource: { id: number; type: string },
        rule: Rule
    ): Promise<boolean> {
        // ABAC attribute condition embedded in a Rule (stored as abacCondition)
        if ((rule as any).abacCondition) {
            return this.evaluateABACCondition(context, (rule as any).abacCondition);
        }

        // Caveat: relation with conditional guard
        if ((rule as any).caveat) {
            return this.evaluateCaveatRule(context, resource, rule);
        }

        if (rule.relation && !rule.permission) {
            // Computed Userset: permission referencing another permission in same resource
            const targetPermConfig = this.schema[resource.type]?.[rule.relation];
            if (targetPermConfig) {
                const subContext: EvaluationContext = { ...context, permission: rule.relation };
                return this.checkPermission(subContext, resource);
            }
            return this.evaluateDirect(context, resource, rule);
        } else if (rule.relation && rule.permission) {
            return this.evaluateRecursive(context, resource, rule);
        }
        return false;
    }

    async evaluateCaveatRule(
        context: EvaluationContext,
        resource: { id: number; type: string },
        rule: Rule
    ): Promise<boolean> {
        const startTime = performance.now();
        const caveatName = (rule as any).caveat as string;

        // First check the base relation
        const baseRule: Rule = { relation: rule.relation, permission: rule.permission };
        const baseResult = await this.evaluateDirect(context, resource, baseRule);

        if (!baseResult) {
            context.explainTree?.leaf("Caveat", `${rule.relation} IF ${caveatName}`, false, performance.now() - startTime);
            return false;
        }

        // Then evaluate caveat condition
        const caveatCtx: CaveatContext = {
            userId: context.userId,
            resourceId: resource.id,
            attributes: context.attributes as any,
            ...context.caveatContext
        };

        const caveatResult = await this.caveatEvaluator.evaluate(caveatName, caveatCtx);
        const duration = performance.now() - startTime;
        context.explainTree?.leaf("Caveat", `${rule.relation} IF ${caveatName}`, caveatResult, duration);
        context.profiler?.recordRule(`Caveat: ${rule.relation} IF ${caveatName}`, duration, caveatResult);
        return caveatResult;
    }

    async evaluateABACCondition(
        context: EvaluationContext,
        condition: AttributeConditionNode
    ): Promise<boolean> {
        const startTime = performance.now();
        if (!context.attributes) {
            context.explainTree?.leaf("ABAC", `attribute condition`, false, performance.now() - startTime);
            return false;
        }
        const result = this.abacEvaluator.evaluate(condition, context.attributes);
        const duration = performance.now() - startTime;
        const label = `${(condition.left as any).object ?? condition.left}.${(condition.left as any).field ?? ""} ${condition.operator} ${JSON.stringify(condition.right)}`;
        context.explainTree?.leaf("ABAC", label, result, duration);
        context.profiler?.recordRule(`ABAC: ${label}`, duration, result);
        return result;
    }

    async evaluateDirect(
        context: EvaluationContext,
        resource: { id: number; type: string },
        rule: Rule
    ): Promise<boolean> {
        const startTime = performance.now();
        context.profiler?.incrementDbLookup();

        const outcome = await this.repository.findDirectRelationship({
            userId: context.userId,
            resourceId: resource.id,
            relation: rule.relation
        });

        const duration = performance.now() - startTime;
        context.profiler?.recordRule(`Direct: ${rule.relation}`, duration, outcome);
        context.explainTree?.leaf("Rule", `Direct: ${rule.relation}`, outcome, duration);

        context.trace.push({
            resourceId: resource.id,
            resourceType: resource.type,
            permission: context.permission,
            rule: `Direct: ${rule.relation}`,
            result: outcome
        });

        return outcome;
    }

    async evaluateRecursive(
        context: EvaluationContext,
        resource: { id: number; type: string },
        rule: Rule
    ): Promise<boolean> {
        const startTime = performance.now();
        context.profiler?.incrementDbLookup();
        context.explainTree?.open("Rule", `Recursive: ${rule.relation} → ${rule.permission}`);

        const parents = await this.repository.findParents({
            resourceId: resource.id,
            relation: rule.relation
        });

        let outcome = false;
        for (const parent of parents) {
            const subContext: EvaluationContext = { ...context, permission: rule.permission! };
            const allowed = await this.checkPermission(subContext, parent);
            if (allowed) { outcome = true; break; }
        }

        const duration = performance.now() - startTime;
        context.profiler?.recordRule(`Recursive: ${rule.relation} -> ${rule.permission}`, duration, outcome);
        context.explainTree?.close(outcome, duration);

        context.trace.push({
            resourceId: resource.id,
            resourceType: resource.type,
            permission: context.permission,
            rule: `Recursive: ${rule.relation} -> ${rule.permission}`,
            result: outcome
        });

        return outcome;
    }
}
