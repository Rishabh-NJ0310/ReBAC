import {
    ProgramNode,
    ResourceNode,
    PermissionNode,
    ExpressionNode,
    BinaryExpressionNode,
    UnaryExpressionNode,
    RelationNode
} from "../ast/Nodes.js";

export class SemanticAnalyzer {
    public analyze(program: ProgramNode): void {
        const resourceNames = new Set<string>();

        for (const resource of program.resources) {
            // 1. Check duplicate resource names
            if (resourceNames.has(resource.name)) {
                throw new Error(
                    `Semantic Error: Duplicate resource definition '${resource.name}' at line ${resource.line}, column ${resource.column}`
                );
            }
            resourceNames.add(resource.name);

            // Analyze resource contents
            this.analyzeResource(resource);
        }
    }

    private analyzeResource(resource: ResourceNode): void {
        const declaredRelations = new Set<string>();
        const declaredPermissions = new Set<string>();

        // 2. Check duplicate relation declarations
        for (const rel of resource.relations) {
            if (declaredRelations.has(rel.name)) {
                throw new Error(
                    `Semantic Error: Duplicate relation declaration '${rel.name}' in resource '${resource.name}' at line ${rel.line}, column ${rel.column}`
                );
            }
            declaredRelations.add(rel.name);
        }

        // 3. Check duplicate permission definitions
        for (const perm of resource.permissions) {
            if (declaredPermissions.has(perm.name)) {
                throw new Error(
                    `Semantic Error: Duplicate permission definition '${perm.name}' in resource '${resource.name}' at line ${perm.line}, column ${perm.column}`
                );
            }
            declaredPermissions.add(perm.name);
        }

        // 4. Validate that relations used in permission expressions are declared
        for (const perm of resource.permissions) {
            this.validateExpressionRelations(resource.name, perm.name, perm.expression, declaredRelations);
        }
    }

    private validateExpressionRelations(
        resourceName: string,
        permissionName: string,
        expr: ExpressionNode,
        declaredRelations: Set<string>
    ): void {
        if (expr.nodeType === "Relation") {
            const relNode = expr as RelationNode;
            if (!declaredRelations.has(relNode.relation)) {
                throw new Error(
                    `Semantic Error: Undeclared relation '${relNode.relation}' referenced in permission '${permissionName}' of resource '${resourceName}' at line ${relNode.line}, column ${relNode.column}. Add 'relation ${relNode.relation}' to declare it.`
                );
            }
        } else if (expr.nodeType === "BinaryExpression") {
            const binary = expr as BinaryExpressionNode;
            this.validateExpressionRelations(resourceName, permissionName, binary.left, declaredRelations);
            this.validateExpressionRelations(resourceName, permissionName, binary.right, declaredRelations);
        } else if (expr.nodeType === "UnaryExpression") {
            const unary = expr as UnaryExpressionNode;
            this.validateExpressionRelations(resourceName, permissionName, unary.operand, declaredRelations);
        }
    }
}
