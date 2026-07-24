import { GraphRepository } from "./GraphRepository.js";
import { RebacSchema, schema as defaultSchema, RuleGroup, Rule } from "./Schema.js";
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
}

export class RuleEngine {
    constructor(
        private repository: GraphRepository,
        private schema: RebacSchema = defaultSchema
    ) { }

    async checkPermission(
        context: EvaluationContext,
        resource: { id: number; type: string }
    ): Promise<boolean> {
        const cacheKey = `${context.userId}:${resource.id}:${context.permission}`;

        if (context.processing.has(cacheKey)) {
            // Cycle detected - abort path
            return false;
        }

        if (context.memo.has(cacheKey)) {
            return context.memo.get(cacheKey)!;
        }

        context.processing.add(cacheKey);

        const permissionConfig = this.schema[resource.type]?.[context.permission];
        let result = false;

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

        context.processing.delete(cacheKey);
        context.memo.set(cacheKey, result);

        return result;
    }

    async evaluateOperator(
        context: EvaluationContext,
        resource: { id: number; type: string },
        group: RuleGroup
    ): Promise<boolean> {
        const operator = group.operator;

        if (operator === "OR") {
            for (const item of group.rules) {
                const allowed = await this.evaluateRuleOrGroup(context, resource, item);
                if (allowed) return true;
            }
            return false;
        }

        if (operator === "AND") {
            for (const item of group.rules) {
                const allowed = await this.evaluateRuleOrGroup(context, resource, item);
                if (!allowed) return false;
            }
            return group.rules.length > 0;
        }

        if (operator === "NOT") {
            if (group.rules.length === 0) return true;
            const allowed = await this.evaluateRuleOrGroup(context, resource, group.rules[0]);
            return !allowed;
        }

        return false;
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
        if (rule.relation && !rule.permission) {
            // Check if rule.relation is a Computed Userset (Permission referencing another Permission in the same resource)
            const targetPermConfig = this.schema[resource.type]?.[rule.relation];
            if (targetPermConfig) {
                const subContext: EvaluationContext = {
                    ...context,
                    permission: rule.relation
                };
                return this.checkPermission(subContext, resource);
            }

            return this.evaluateDirect(context, resource, rule);
        } else if (rule.relation && rule.permission) {
            return this.evaluateRecursive(context, resource, rule);
        }
        return false;
    }

    async evaluateDirect(
        context: EvaluationContext,
        resource: { id: number; type: string },
        rule: Rule
    ): Promise<boolean> {
        const outcome = await this.repository.findDirectRelationship({
            userId: context.userId,
            resourceId: resource.id,
            relation: rule.relation
        });

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
        const parents = await this.repository.findParents({
            resourceId: resource.id,
            relation: rule.relation
        });

        let outcome = false;
        for (const parent of parents) {
            const subContext: EvaluationContext = {
                ...context,
                permission: rule.permission!
            };

            const allowed = await this.checkPermission(subContext, parent);
            if (allowed) {
                outcome = true;
                break;
            }
        }

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
