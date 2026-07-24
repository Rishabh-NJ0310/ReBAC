import { ProgramNode, ResourceNode, RelationDeclNode, PermissionNode } from "../ast/Nodes.js";

export class InheritanceResolver {
    public resolve(program: ProgramNode): ProgramNode {
        const resourceMap = new Map<string, ResourceNode>();
        for (const res of program.resources) {
            resourceMap.set(res.name, res);
        }

        // 1. Cycle Detection
        for (const res of program.resources) {
            if (res.extends) {
                this.detectInheritanceCycles(res.name, resourceMap, [res.name]);
            }
        }

        // 2. Expand Parent Rules down to Children
        const expandedResources = program.resources.map(res => this.expandResource(res, resourceMap, new Set()));

        return {
            ...program,
            resources: expandedResources
        };
    }

    private detectInheritanceCycles(
        currentName: string,
        resourceMap: Map<string, ResourceNode>,
        path: string[]
    ): void {
        const currentRes = resourceMap.get(currentName);
        if (!currentRes || !currentRes.extends) return;

        const parentName = currentRes.extends;
        if (!resourceMap.has(parentName)) {
            throw new Error(`Semantic Error: Resource '${currentName}' extends unknown resource '${parentName}' at line ${currentRes.line}, column ${currentRes.column}`);
        }

        if (path.includes(parentName)) {
            const cycleStartIndex = path.indexOf(parentName);
            const cyclePath = [...path.slice(cycleStartIndex), parentName].join(" -> ");
            throw new Error(`Semantic Error: Circular inheritance detected: ${cyclePath}`);
        }

        this.detectInheritanceCycles(parentName, resourceMap, [...path, parentName]);
    }

    private expandResource(
        res: ResourceNode,
        resourceMap: Map<string, ResourceNode>,
        visited: Set<string>
    ): ResourceNode {
        if (!res.extends || visited.has(res.name)) {
            return res;
        }

        visited.add(res.name);
        const parentRes = resourceMap.get(res.extends);
        if (!parentRes) return res;

        // Recursively expand parent first
        const expandedParent = this.expandResource(parentRes, resourceMap, visited);

        // Merge Parent Relations into Child (Child relations take precedence)
        const childRelNames = new Set(res.relations.map(r => r.name));
        const inheritedRelations: RelationDeclNode[] = [...res.relations];

        for (const parentRel of expandedParent.relations) {
            if (!childRelNames.has(parentRel.name)) {
                inheritedRelations.push({ ...parentRel });
            }
        }

        // Merge Parent Permissions into Child (Child permissions take precedence)
        const childPermNames = new Set(res.permissions.map(p => p.name));
        const inheritedPermissions: PermissionNode[] = [...res.permissions];

        for (const parentPerm of expandedParent.permissions) {
            if (!childPermNames.has(parentPerm.name)) {
                inheritedPermissions.push({ ...parentPerm });
            }
        }

        return {
            ...res,
            relations: inheritedRelations,
            permissions: inheritedPermissions
        };
    }
}
