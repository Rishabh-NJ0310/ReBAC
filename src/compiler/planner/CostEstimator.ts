import { ExpressionNode, BinaryExpressionNode, UnaryExpressionNode, RelationNode, BooleanLiteralNode } from "../ast/Nodes.js";

export class CostEstimator {
    public estimateExpressionCost(expr: ExpressionNode): number {
        if (expr.nodeType === "BooleanLiteral") {
            return 0;
        }

        if (expr.nodeType === "Relation") {
            const rel = expr as RelationNode;
            if (rel.permission) {
                // Recursive traversal (e.g. contains.view) -> Expensive DFS
                return 10;
            }
            // Direct relation lookup or computed userset reference
            return 1;
        }

        if (expr.nodeType === "UnaryExpression") {
            const unary = expr as UnaryExpressionNode;
            return 1 + this.estimateExpressionCost(unary.operand);
        }

        if (expr.nodeType === "BinaryExpression") {
            const binary = expr as BinaryExpressionNode;
            return this.estimateExpressionCost(binary.left) + this.estimateExpressionCost(binary.right);
        }

        return 5;
    }
}
