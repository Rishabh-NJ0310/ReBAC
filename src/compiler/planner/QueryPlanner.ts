import { ProgramNode, ResourceNode, PermissionNode, ExpressionNode, BinaryExpressionNode, UnaryExpressionNode } from "../ast/Nodes.js";
import { CostEstimator } from "./CostEstimator.js";

export interface ExecutionPlan {
    resourceName: string;
    permissionName: string;
    estimatedCost: number;
    expression: ExpressionNode;
}

export class QueryPlanner {
    private estimator = new CostEstimator();

    public planProgram(program: ProgramNode): Record<string, Record<string, ExecutionPlan>> {
        const plans: Record<string, Record<string, ExecutionPlan>> = {};

        for (const resource of program.resources) {
            plans[resource.name] = {};
            for (const perm of resource.permissions) {
                plans[resource.name][perm.name] = this.planPermission(resource.name, perm.name, perm.expression);
            }
        }

        return plans;
    }

    public planPermission(resourceName: string, permissionName: string, expr: ExpressionNode): ExecutionPlan {
        const optimizedExpr = this.reorderExpression(expr);
        const estimatedCost = this.estimator.estimateExpressionCost(optimizedExpr);

        return {
            resourceName,
            permissionName,
            estimatedCost,
            expression: optimizedExpr
        };
    }

    public reorderExpression(expr: ExpressionNode): ExpressionNode {
        if (expr.nodeType === "BinaryExpression") {
            const binary = expr as BinaryExpressionNode;
            let left = this.reorderExpression(binary.left);
            let right = this.reorderExpression(binary.right);

            const leftCost = this.estimator.estimateExpressionCost(left);
            const rightCost = this.estimator.estimateExpressionCost(right);

            // Cheap-first reordering for short-circuit optimization!
            if (leftCost > rightCost) {
                const temp = left;
                left = right;
                right = temp;
            }

            return {
                ...binary,
                left,
                right
            };
        }

        if (expr.nodeType === "UnaryExpression") {
            const unary = expr as UnaryExpressionNode;
            return {
                ...unary,
                operand: this.reorderExpression(unary.operand)
            };
        }

        return expr;
    }
}
