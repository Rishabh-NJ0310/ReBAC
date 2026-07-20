import { GraphRepository, graphRepository, CreateUserData, CreateResourceData, CreateRelationshipData } from "./GraphRepository.js";
import { RuleEngine } from "./RuleEngine.js";
import { schema } from "./Schema.js";

export class AuthorizationService {
    private ruleEngine: RuleEngine;

    constructor(private repository: GraphRepository = graphRepository) {
        this.ruleEngine = new RuleEngine(this.repository, schema);
    }

    async createUser(data: CreateUserData) {
        return this.repository.createUser(data);
    }

    async createResource(data: CreateResourceData) {
        return this.repository.createResource(data);
    }

    // Alias for backward compatibility
    async createObject(data: CreateResourceData) {
        return this.createResource(data);
    }

    async createRelationship(data: CreateRelationshipData) {
        return this.repository.createRelationship(data);
    }

    async checkPermission(params: {
        userId: number;
        resourceId: number;
        permission: string;
    }): Promise<boolean> {
        const resource = await this.repository.getResourceById(params.resourceId);
        if (!resource) {
            return false;
        }

        return this.ruleEngine.checkPermission(
            params.userId,
            resource,
            params.permission
        );
    }
}

export const authorizationService = new AuthorizationService();
