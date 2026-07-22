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
        console.log("--------------------------------");
        console.log("Checking");

        console.log({
            userId,
            resource,
            permission
        });

        for (const rule of rules) {
            console.log("Rules");
            console.log(rules);
            // Direct relationship check
            if (rule.relation && !rule.permission) {
                console.log("Trying direct relation");
                console.log(rule.relation);
                const isDirect = await this.repository.findDirectRelationship({
                    userSubjectId: userId,
                    objectId: resource.id,
                    relation: rule.relation
                });

                if (isDirect) {
                    return true;
                }
                console.log("Direct =", isDirect);
            }

            // Inherited/parent permission check
            if (rule.relation && rule.permission) {
                const parents: Resource[] = await this.repository.findParents({
                    objectId: resource.id,
                    relation: rule.relation
                });
                
                console.log("Parents");
                console.table(parents);
                for (const parent of parents) {
                    console.log(`DFS -> ${parent.name}`);
                    const allowed = await this.checkPermission(
                        userId,
                        parent,
                        rule.permission,
                        visited
                    );
                    if (allowed) {
                        console.log("ALLOW");
                        return true;
                    }else{
                        console.log("DENY");
                    }

                }
            }
        }

        return false;
    }
}
