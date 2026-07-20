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

    async getUsers(): Promise<any[]> {
        return this.repository.getUsers();
    }

    async getResources(): Promise<any[]> {
        return this.repository.getResources();
    }

    async getRelationships(): Promise<any[]> {
        return this.repository.getRelationships();
    }

    async deleteRelationship(id: number): Promise<void> {
        return this.repository.deleteRelationship(id);
    }

    async deleteAll(): Promise<void> {
        return this.repository.deleteAll();
    }
}

export const authorizationService = new AuthorizationService();
