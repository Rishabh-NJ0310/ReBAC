import {
    ProgramNode,
    ExpressionNode,
    BinaryExpressionNode,
    UnaryExpressionNode,
    RelationNode,
    BooleanLiteralNode
} from "../ast/Nodes.js";
import { RebacSchema, RuleGroup, Rule } from "../../authorization/Schema.js";

export class RuleGroupTransformer {
    public transform(program: ProgramNode): RebacSchema {
        const schema: RebacSchema = {};

        for (const resource of program.resources) {
            schema[resource.name] = {};

            for (const perm of resource.permissions) {
                schema[resource.name][perm.name] = this.transformExpression(perm.expression);
            }
        }

        return schema;
    }

    private transformExpression(expr: ExpressionNode): RuleGroup | Rule {
        if (expr.nodeType === "Relation") {
            const rel = expr as RelationNode;
            const rule: Rule = { relation: rel.relation };
            if (rel.permission) {
                rule.permission = rel.permission;
            }
            return rule;
        }

        if (expr.nodeType === "BinaryExpression") {
            const binary = expr as BinaryExpressionNode;
            const left = this.transformExpression(binary.left);
            const right = this.transformExpression(binary.right);

            const rules: (Rule | RuleGroup)[] = [];

            if (typeof left === "object" && "operator" in left && (left as RuleGroup).operator === binary.operator) {
                rules.push(...(left as RuleGroup).rules);
            } else {
                rules.push(left);
            }

            if (typeof right === "object" && "operator" in right && (right as RuleGroup).operator === binary.operator) {
                rules.push(...(right as RuleGroup).rules);
            } else {
                rules.push(right);
            }

            return {
                operator: binary.operator,
                rules
            };
        }

        if (expr.nodeType === "UnaryExpression") {
            const unary = expr as UnaryExpressionNode;
            const operand = this.transformExpression(unary.operand);
            return {
                operator: "NOT",
                rules: [operand]
            };
        }

        if (expr.nodeType === "BooleanLiteral") {
            const bool = expr as BooleanLiteralNode;
            return { relation: bool.value ? "__TRUE__" : "__FALSE__" };
        }

        throw new Error(`Transformation Error: Unknown AST expression node type`);
    }
}
