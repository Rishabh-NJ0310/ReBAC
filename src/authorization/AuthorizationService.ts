import {
    GraphRepository,
    graphRepository,
    CreateUserData,
    CreateResourceData,
    CreateSubjectEdgeData,
    CreateResourceEdgeData,
    CreatePermissionEdgeData,
    GenericRelationshipData
} from "./GraphRepository.js";
import { RuleEngine, EvaluationContext, TraceStep } from "./RuleEngine.js";
import { schema } from "./Schema.js";

export class AuthorizationService {
    private ruleEngine: RuleEngine;

    constructor(private repository: GraphRepository = graphRepository) {
        this.ruleEngine = new RuleEngine(this.repository, schema);
    }

    async createUser(data: CreateUserData) {
        return this.repository.createUser(data);
    }

    async createGroup(name: string) {
        return this.repository.createGroup(name);
    }

    async createResource(data: CreateResourceData) {
        return this.repository.createResource(data);
    }

    // Alias for backward compatibility
    async createObject(data: CreateResourceData) {
        return this.createResource(data);
    }

    async createSubjectEdge(data: CreateSubjectEdgeData) {
        return this.repository.createSubjectEdge(data);
    }

    async createResourceEdge(data: CreateResourceEdgeData) {
        return this.repository.createResourceEdge(data);
    }

    async createPermissionEdge(data: CreatePermissionEdgeData) {
        return this.repository.createPermissionEdge(data);
    }

    async createRelationship(data: GenericRelationshipData) {
        return this.repository.createRelationship(data);
    }

    async checkPermission(params: {
        userId: number;
        resourceId: number;
        permission: string;
    }): Promise<{ allowed: boolean; trace: TraceStep[] }> {
        const resource = await this.repository.getResourceById(params.resourceId);
        if (!resource) {
            return { allowed: false, trace: [] };
        }

        const context: EvaluationContext = {
            userId: params.userId,
            permission: params.permission,
            processing: new Set<string>(),
            memo: new Map<string, boolean>(),
            trace: []
        };

        const allowed = await this.ruleEngine.checkPermission(context, resource);

        return { allowed, trace: context.trace };
    }

    async getGraphData() {
        return this.repository.getGraphData();
    }

    async getUsers(): Promise<any[]> {
        return this.repository.getUsers();
    }

    async getGroups(): Promise<any[]> {
        return this.repository.getGroups();
    }

    async getResources(): Promise<any[]> {
        return this.repository.getResources();
    }

    async getRelationships(): Promise<any> {
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
