import {
    ProgramNode,
    ResourceNode,
    PermissionNode,
    ExpressionNode,
    BinaryExpressionNode,
    UnaryExpressionNode,
    BooleanLiteralNode
} from "../ast/Nodes.js";

export class ASTOptimizer {
    public optimize(program: ProgramNode): ProgramNode {
        for (const resource of program.resources) {
            for (const perm of resource.permissions) {
                perm.expression = this.optimizeExpression(perm.expression);
            }
        }
        return program;
    }

    public optimizeExpression(expr: ExpressionNode): ExpressionNode {
        // 1. UnaryExpression Optimizations
        if (expr.nodeType === "UnaryExpression") {
            const unary = expr as UnaryExpressionNode;
            let operand = this.optimizeExpression(unary.operand);

            // Double Negation: NOT (NOT x) -> x
            if (operand.nodeType === "UnaryExpression" && (operand as UnaryExpressionNode).operator === "NOT") {
                return (operand as UnaryExpressionNode).operand;
            }

            // Constant Folding: NOT true -> false, NOT false -> true
            if (operand.nodeType === "BooleanLiteral") {
                const boolNode = operand as BooleanLiteralNode;
                return {
                    nodeType: "BooleanLiteral",
                    value: !boolNode.value,
                    line: unary.line,
                    column: unary.column
                };
            }

            return {
                ...unary,
                operand
            };
        }

        // 2. BinaryExpression Optimizations
        if (expr.nodeType === "BinaryExpression") {
            const binary = expr as BinaryExpressionNode;
            const left = this.optimizeExpression(binary.left);
            const right = this.optimizeExpression(binary.right);

            const leftSig = this.getExpressionSignature(left);
            const rightSig = this.getExpressionSignature(right);

            // Idempotence: A OR A -> A, A AND A -> A
            if (leftSig === rightSig) {
                return left;
            }

            // Constant Folding: OR logic
            if (binary.operator === "OR") {
                if (left.nodeType === "BooleanLiteral" && (left as BooleanLiteralNode).value === true) return left;
                if (right.nodeType === "BooleanLiteral" && (right as BooleanLiteralNode).value === true) return right;

                if (left.nodeType === "BooleanLiteral" && (left as BooleanLiteralNode).value === false) return right;
                if (right.nodeType === "BooleanLiteral" && (right as BooleanLiteralNode).value === false) return left;
            }

            // Constant Folding: AND logic
            if (binary.operator === "AND") {
                if (left.nodeType === "BooleanLiteral" && (left as BooleanLiteralNode).value === false) return left;
                if (right.nodeType === "BooleanLiteral" && (right as BooleanLiteralNode).value === false) return right;

                if (left.nodeType === "BooleanLiteral" && (left as BooleanLiteralNode).value === true) return right;
                if (right.nodeType === "BooleanLiteral" && (right as BooleanLiteralNode).value === true) return left;
            }

            return {
                ...binary,
                left,
                right
            };
        }

        return expr;
    }

    public getExpressionSignature(expr: ExpressionNode): string {
        if (expr.nodeType === "Relation") {
            return `REL:${expr.relation}:${expr.permission || ""}`;
        }
        if (expr.nodeType === "BooleanLiteral") {
            return `BOOL:${expr.value}`;
        }
        if (expr.nodeType === "UnaryExpression") {
            return `UNARY:${expr.operator}:${this.getExpressionSignature(expr.operand)}`;
        }
        if (expr.nodeType === "BinaryExpression") {
            return `BINARY:${expr.operator}:${this.getExpressionSignature(expr.left)}:${this.getExpressionSignature(expr.right)}`;
        }
        return "UNKNOWN";
    }
}
