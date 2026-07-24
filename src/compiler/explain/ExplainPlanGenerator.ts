import { ProgramNode, ResourceNode, PermissionNode, ExpressionNode, BinaryExpressionNode, UnaryExpressionNode, RelationNode, BooleanLiteralNode } from "../ast/Nodes.js";

export class ExplainPlanGenerator {
    public generateExplainPlan(program: ProgramNode, resourceName: string, permissionName: string): string {
        const resource = program.resources.find(r => r.name === resourceName);
        if (!resource) {
            return `EXPLAIN PLAN ERROR: Resource '${resourceName}' not found in AST.`;
        }

        const permission = resource.permissions.find(p => p.name === permissionName);
        if (!permission) {
            return `EXPLAIN PLAN ERROR: Permission '${permissionName}' not found in resource '${resourceName}'.`;
        }

        const lines: string[] = [];
        lines.push(`========================= EXPLAIN PLAN =========================`);
        lines.push(`Resource: ${resourceName} | Permission: ${permissionName}`);
        lines.push(``);
        lines.push(this.renderExpressionPlan(permission.expression, ""));
        lines.push(`================================================================`);

        return lines.join("\n");
    }

    private renderExpressionPlan(expr: ExpressionNode, indent: string): string {
        if (expr.nodeType === "Relation") {
            const rel = expr as RelationNode;
            if (rel.permission) {
                return `${indent}├── [Recursive Traversal] via relation '${rel.relation}' ➔ evaluate target permission '${rel.permission}'`;
            }
            return `${indent}├── [Direct Relation Lookup] check graph for edge '${rel.relation}'`;
        }

        if (expr.nodeType === "BooleanLiteral") {
            const bool = expr as BooleanLiteralNode;
            return `${indent}├── [Boolean Constant] ${bool.value ? "TRUE" : "FALSE"}`;
        }

        if (expr.nodeType === "UnaryExpression") {
            const unary = expr as UnaryExpressionNode;
            return `${indent}├── [Logical NOT Operator]\n${this.renderExpressionPlan(unary.operand, indent + "│   ")}`;
        }

        if (expr.nodeType === "BinaryExpression") {
            const binary = expr as BinaryExpressionNode;
            return `${indent}├── [Logical ${binary.operator} Operator]\n${this.renderExpressionPlan(binary.left, indent + "│   ")}\n${this.renderExpressionPlan(binary.right, indent + "│   ")}`;
        }

        return `${indent}├── [Unknown Node]`;
    }
}
