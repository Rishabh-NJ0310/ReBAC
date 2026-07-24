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
import { SubjectResolver } from "./SubjectResolver.js";
import { ExecutionProfiler, ExecutionProfile } from "./ExecutionProfiler.js";
import { ExplainTreeBuilder, ExplainNode } from "./ExplainTree.js";
import { CaveatEvaluator, CaveatContext, globalCaveatEvaluator } from "./CaveatEvaluator.js";
import { ABACContext } from "./ABACEvaluator.js";
import { schema, RebacSchema } from "./Schema.js";
import { globalTenantRegistry } from "../compiler/tenant/TenantRegistry.js";

export interface CheckPermissionParams {
    userId: number;
    resourceId: number;
    permission: string;
    /** Optional tenant ID to load an isolated tenant schema */
    tenantId?: string;
    /** Runtime ABAC attribute context: { user: {...}, patient: {...}, ... } */
    attributes?: ABACContext;
    /** Extra caveat context fields beyond userId/resourceId/attributes */
    caveatContext?: CaveatContext;
}

export interface CheckPermissionResult {
    allowed: boolean;
    trace: TraceStep[];
    profile?: ExecutionProfile;
    explainTree?: ExplainNode | null;
    explainText?: string;
}

export class AuthorizationService {
    constructor(
        private repository: GraphRepository = graphRepository,
        private caveatEvaluator: CaveatEvaluator = globalCaveatEvaluator
    ) {}

    async createUser(data: CreateUserData) {
        return this.repository.createUser(data);
    }

    async createGroup(name: string) {
        return this.repository.createGroup(name);
    }

    async createResource(data: CreateResourceData) {
        return this.repository.createResource(data);
    }

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

    async checkPermission(params: CheckPermissionParams): Promise<CheckPermissionResult> {
        const resource = await this.repository.getResourceById(params.resourceId);
        if (!resource) {
            return { allowed: false, trace: [], explainTree: null, explainText: "✘ Resource not found" };
        }

        // Resolve schema — tenant-specific or default
        let activeSchema: RebacSchema = schema;
        if (params.tenantId) {
            if (globalTenantRegistry.has(params.tenantId)) {
                activeSchema = globalTenantRegistry.getSchema(params.tenantId);
            }
        }

        const ruleEngine = new RuleEngine(this.repository, activeSchema, this.caveatEvaluator);
        const profiler = new ExecutionProfiler();
        const explainBuilder = new ExplainTreeBuilder();
        profiler.start();

        const subjectResolver = new SubjectResolver(this.repository);
        const subjectSet = await subjectResolver.resolveSubjectSet(params.userId);

        const context: EvaluationContext = {
            userId: params.userId,
            subjectSet,
            permission: params.permission,
            processing: new Set<string>(),
            memo: new Map<string, boolean>(),
            trace: [],
            profiler,
            explainTree: explainBuilder,
            attributes: params.attributes,
            caveatContext: params.caveatContext
        };

        const allowed = await ruleEngine.checkPermission(context, resource);
        const explainTree = explainBuilder.getTree();

        return {
            allowed,
            trace: context.trace,
            profile: profiler.getProfile(),
            explainTree,
            explainText: explainBuilder.renderText(explainTree)
        };
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
