import { GraphRepository } from "./GraphRepository.js";
import { RebacSchema, schema as defaultSchema } from "./Schema.js";
import { Resource } from "../generated/prisma/client.js";

export class RuleEngine {
    constructor(
        private repository: GraphRepository,
        private schema: RebacSchema = defaultSchema
    ) {}

    async checkPermission(
        userId: number,
        resource: { id: number; type: string },
        permission: string,
        visited = new Set<string>()
    ): Promise<boolean> {
        const cacheKey = `${userId}:${resource.id}:${permission}`;
        if (visited.has(cacheKey)) {
            return false;
        }
        visited.add(cacheKey);

        const rules = this.schema[resource.type]?.[permission] || [];

        for (const rule of rules) {
            // Direct relationship check
            if (rule.relation && !rule.permission) {
                const isDirect = await this.repository.findDirectRelationship({
                    userSubjectId: userId,
                    objectId: resource.id,
                    relation: rule.relation
                });

                if (isDirect) {
                    return true;
                }
            }

            // Inherited/parent permission check
            if (rule.relation && rule.permission) {
                const parents: Resource[] = await this.repository.findParents({
                    objectId: resource.id,
                    relation: rule.relation
                });

                for (const parent of parents) {
                    const allowed = await this.checkPermission(
                        userId,
                        parent,
                        rule.permission,
                        visited
                    );

                    if (allowed) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}
