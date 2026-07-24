import {
    ProgramNode,
    ResourceNode,
    PermissionNode,
    ExpressionNode,
    BinaryExpressionNode,
    UnaryExpressionNode,
    RelationNode
} from "../ast/Nodes.js";
import { SymbolTable, ResourceSymbol } from "../symbol/SymbolTable.js";
import { ASTOptimizer } from "../optimizer/ASTOptimizer.js";

export interface LintDiagnostic {
    code: "UNUSED_RELATION" | "SIMPLIFIABLE_EXPRESSION" | "CONSTANT_EXPRESSION";
    message: string;
    line: number;
    column: number;
}

export class ADSLLinter {
    private optimizer = new ASTOptimizer();

    public lint(program: ProgramNode, symbolTable: SymbolTable): LintDiagnostic[] {
        const diagnostics: LintDiagnostic[] = [];

        for (const resourceNode of program.resources) {
            const resourceSymbol = symbolTable.getResource(resourceNode.name);
            if (!resourceSymbol) continue;

            const referencedRelations = new Set<string>();

            // Inspect expressions
            for (const permNode of resourceNode.permissions) {
                this.collectReferencedRelations(permNode.expression, referencedRelations);
                this.checkSimplifiableExpressions(resourceNode.name, permNode.name, permNode.expression, diagnostics);
            }

            // Check Unused Relations
            for (const relSymbol of resourceSymbol.relations.values()) {
                if (!referencedRelations.has(relSymbol.name)) {
                    diagnostics.push({
                        code: "UNUSED_RELATION",
                        message: `Warning: Relation '${relSymbol.name}' is declared in resource '${resourceNode.name}' but never referenced in any permission definition.`,
                        line: relSymbol.line,
                        column: relSymbol.column
                    });
                }
            }
        }

        return diagnostics;
    }

    private collectReferencedRelations(expr: ExpressionNode, set: Set<string>): void {
        if (expr.nodeType === "Relation") {
            set.add((expr as RelationNode).relation);
        } else if (expr.nodeType === "BinaryExpression") {
            const binary = expr as BinaryExpressionNode;
            this.collectReferencedRelations(binary.left, set);
            this.collectReferencedRelations(binary.right, set);
        } else if (expr.nodeType === "UnaryExpression") {
            const unary = expr as UnaryExpressionNode;
            this.collectReferencedRelations(unary.operand, set);
        }
    }

    private checkSimplifiableExpressions(
        resourceName: string,
        permissionName: string,
        expr: ExpressionNode,
        diagnostics: LintDiagnostic[]
    ): void {
        if (expr.nodeType === "UnaryExpression") {
            const unary = expr as UnaryExpressionNode;
            if (unary.operand.nodeType === "UnaryExpression" && (unary.operand as UnaryExpressionNode).operator === "NOT") {
                diagnostics.push({
                    code: "SIMPLIFIABLE_EXPRESSION",
                    message: `Warning: Double negation 'NOT NOT ...' in permission '${permissionName}' of resource '${resourceName}'. Can be simplified.`,
                    line: unary.line,
                    column: unary.column
                });
            }
            this.checkSimplifiableExpressions(resourceName, permissionName, unary.operand, diagnostics);
        } else if (expr.nodeType === "BinaryExpression") {
            const binary = expr as BinaryExpressionNode;
            const leftSig = this.optimizer.getExpressionSignature(binary.left);
            const rightSig = this.optimizer.getExpressionSignature(binary.right);

            if (leftSig === rightSig) {
                diagnostics.push({
                    code: "SIMPLIFIABLE_EXPRESSION",
                    message: `Warning: Redundant binary operation '${binary.operator}' with identical left and right expressions in permission '${permissionName}' of resource '${resourceName}'.`,
                    line: binary.line,
                    column: binary.column
                });
            }

            this.checkSimplifiableExpressions(resourceName, permissionName, binary.left, diagnostics);
            this.checkSimplifiableExpressions(resourceName, permissionName, binary.right, diagnostics);
        } else if (expr.nodeType === "BooleanLiteral") {
            diagnostics.push({
                code: "CONSTANT_EXPRESSION",
                message: `Warning: Constant boolean literal used in permission '${permissionName}' of resource '${resourceName}'.`,
                line: expr.line,
                column: expr.column
            });
        }
    }
}
