import {
    ProgramNode,
    ResourceNode,
    PermissionNode,
    ExpressionNode,
    BinaryExpressionNode,
    UnaryExpressionNode,
    RelationNode
} from "../ast/Nodes.js";
import { SymbolTable, ResourceSymbol, RelationSymbol } from "../symbol/SymbolTable.js";

export class SemanticAnalyzer {
    public analyze(program: ProgramNode): SymbolTable {
        const symbolTable = new SymbolTable();

        // Pass 0: Populate Subjects
        for (const subNode of program.subjects) {
            symbolTable.defineSubject(subNode.name);
        }

        // Pass 1: Symbol Table Construction & Local Duplicate Validation
        for (const resourceNode of program.resources) {
            if (symbolTable.hasResource(resourceNode.name)) {
                throw new Error(
                    `Semantic Error: Duplicate resource definition '${resourceNode.name}' at line ${resourceNode.line}, column ${resourceNode.column}`
                );
            }

            const resourceSymbol = symbolTable.defineResource(
                resourceNode.name,
                resourceNode.line,
                resourceNode.column
            );

            // Populate Relations
            for (const rel of resourceNode.relations) {
                if (resourceSymbol.relations.has(rel.name)) {
                    throw new Error(
                        `Semantic Error: Duplicate relation declaration '${rel.name}' in resource '${resourceNode.name}' at line ${rel.line}, column ${rel.column}`
                    );
                }
                resourceSymbol.relations.set(rel.name, {
                    kind: "relation",
                    name: rel.name,
                    targetType: rel.targetType,
                    line: rel.line,
                    column: rel.column
                });
            }

            // Populate Permissions
            for (const perm of resourceNode.permissions) {
                if (resourceSymbol.permissions.has(perm.name)) {
                    throw new Error(
                        `Semantic Error: Duplicate permission definition '${perm.name}' in resource '${resourceNode.name}' at line ${perm.line}, column ${perm.column}`
                    );
                }
                resourceSymbol.permissions.set(perm.name, {
                    kind: "permission",
                    name: perm.name,
                    line: perm.line,
                    column: perm.column
                });
            }
        }

        // Pass 2: Type Checking & Cross-Resource Symbol Resolution
        for (const resourceNode of program.resources) {
            const resourceSymbol = symbolTable.getResource(resourceNode.name)!;

            // 1. Check target resource/subject types on relations
            for (const relSymbol of resourceSymbol.relations.values()) {
                if (relSymbol.targetType) {
                    const isSubject = symbolTable.hasSubject(relSymbol.targetType);
                    const isResource = symbolTable.hasResource(relSymbol.targetType);
                    if (!isSubject && !isResource) {
                        throw new Error(
                            `Type Error: Relation '${relSymbol.name}' in resource '${resourceSymbol.name}' targets unknown type '${relSymbol.targetType}' at line ${relSymbol.line}, column ${relSymbol.column}`
                        );
                    }
                }
            }

            // 2. Check permission expressions
            for (const permNode of resourceNode.permissions) {
                this.validateExpression(resourceSymbol, permNode.name, permNode.expression, symbolTable);
            }
        }

        return symbolTable;
    }

    private validateExpression(
        currentResource: ResourceSymbol,
        permissionName: string,
        expr: ExpressionNode,
        symbolTable: SymbolTable
    ): void {
        if (expr.nodeType === "Relation") {
            const relNode = expr as RelationNode;
            const relSymbol = currentResource.relations.get(relNode.relation);

            if (!relSymbol) {
                throw new Error(
                    `Semantic Error: Undeclared relation '${relNode.relation}' referenced in permission '${permissionName}' of resource '${currentResource.name}' at line ${relNode.line}, column ${relNode.column}. Add 'relation ${relNode.relation}' to declare it.`
                );
            }

            // Recursive relation check: relation -> targetPermission
            if (relNode.permission && relSymbol.targetType && !symbolTable.hasSubject(relSymbol.targetType)) {
                const targetResource = symbolTable.getResource(relSymbol.targetType);
                if (targetResource && !targetResource.permissions.has(relNode.permission)) {
                    throw new Error(
                        `Type Error: Relation '${relNode.relation}' targets type '${relSymbol.targetType}', but '${relSymbol.targetType}' has no permission '${relNode.permission}' referenced at line ${relNode.line}, column ${relNode.column}`
                    );
                }
            }
        } else if (expr.nodeType === "BinaryExpression") {
            const binary = expr as BinaryExpressionNode;
            this.validateExpression(currentResource, permissionName, binary.left, symbolTable);
            this.validateExpression(currentResource, permissionName, binary.right, symbolTable);
        } else if (expr.nodeType === "UnaryExpression") {
            const unary = expr as UnaryExpressionNode;
            this.validateExpression(currentResource, permissionName, unary.operand, symbolTable);
        }
    }
}
