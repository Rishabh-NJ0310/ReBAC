import { ResourceNode, ExpressionNode, BinaryExpressionNode, UnaryExpressionNode, RelationNode } from "../ast/Nodes.js";

export class PermissionDependencyGraph {
    public checkCycles(resourceNode: ResourceNode): void {
        const declaredPermissions = new Set(resourceNode.permissions.map(p => p.name));
        const adj = new Map<string, string[]>();

        for (const permNode of resourceNode.permissions) {
            adj.set(permNode.name, []);
            this.collectDependencies(permNode.expression, declaredPermissions, adj.get(permNode.name)!);
        }

        // DFS Cycle Detection (0: unvisited, 1: visiting, 2: visited)
        const visited = new Map<string, number>();
        const path: string[] = [];

        for (const permName of declaredPermissions) {
            visited.set(permName, 0);
        }

        for (const permName of declaredPermissions) {
            if (visited.get(permName) === 0) {
                this.dfs(permName, adj, visited, path, resourceNode.name);
            }
        }
    }

    private dfs(
        node: string,
        adj: Map<string, string[]>,
        visited: Map<string, number>,
        path: string[],
        resourceName: string
    ): void {
        visited.set(node, 1);
        path.push(node);

        const neighbors = adj.get(node) || [];
        for (const neighbor of neighbors) {
            if (visited.get(neighbor) === 1) {
                // Cycle detected!
                const cycleStartIndex = path.indexOf(neighbor);
                const cyclePath = [...path.slice(cycleStartIndex), neighbor].join(" -> ");
                throw new Error(
                    `Semantic Error: Circular permission dependency detected in resource '${resourceName}': ${cyclePath}`
                );
            }

            if (visited.get(neighbor) === 0) {
                this.dfs(neighbor, adj, visited, path, resourceName);
            }
        }

        path.pop();
        visited.set(node, 2);
    }

    private collectDependencies(
        expr: ExpressionNode,
        declaredPermissions: Set<string>,
        dependencies: string[]
    ): void {
        if (expr.nodeType === "Relation") {
            const rel = expr as RelationNode;
            if (!rel.permission && declaredPermissions.has(rel.relation)) {
                dependencies.push(rel.relation);
            }
        } else if (expr.nodeType === "BinaryExpression") {
            const binary = expr as BinaryExpressionNode;
            this.collectDependencies(binary.left, declaredPermissions, dependencies);
            this.collectDependencies(binary.right, declaredPermissions, dependencies);
        } else if (expr.nodeType === "UnaryExpression") {
            const unary = expr as UnaryExpressionNode;
            this.collectDependencies(unary.operand, declaredPermissions, dependencies);
        }
    }
}
