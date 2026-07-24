import prisma from "../prisma/client.js";
import { Resource, User, Group, Subject, SubjectType } from "../generated/prisma/client.js";

export interface CreateUserData {
    name: string;
    email: string;
    password: string;
}

export interface CreateResourceData {
    type: string;
    name: string;
}

export interface CreateSubjectEdgeData {
    relation: string;
    sourceId: number; // Subject ID
    targetId: number; // Subject ID
}

export interface CreateResourceEdgeData {
    relation: string;
    sourceId: number; // Resource ID
    targetId: number; // Resource ID
}

export interface CreatePermissionEdgeData {
    relation: string;
    subjectId: number; // Subject ID (or User ID if mapped)
    resourceId: number; // Resource ID
}

export interface GenericRelationshipData {
    relation: string;
    // For subject-to-subject edge:
    subjectSourceId?: number;
    subjectTargetId?: number;
    // For resource-to-resource edge:
    resourceSourceId?: number;
    resourceTargetId?: number;
    // For permission edge:
    subjectId?: number;
    userSubjectId?: number;
    resourceSubjectId?: number;
    objectId?: number;
    resourceId?: number;
    targetSubjectId?: number;
}

export class GraphRepository {
    async createUser(data: CreateUserData) {
        const subject = await prisma.subject.create({
            data: { type: SubjectType.USER, name: data.name }
        });

        return prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: data.password,
                subjectId: subject.id
            },
            include: { subject: true }
        });
    }

    async createGroup(name: string) {
        const subject = await prisma.subject.create({
            data: { type: SubjectType.GROUP, name }
        });

        return prisma.group.create({
            data: {
                name,
                subjectId: subject.id
            },
            include: { subject: true }
        });
    }

    async createResource(data: CreateResourceData) {
        return prisma.resource.create({ data });
    }

    async createSubjectEdge(data: CreateSubjectEdgeData) {
        return prisma.subjectEdge.create({
            data: {
                relation: data.relation,
                sourceId: data.sourceId,
                targetId: data.targetId
            },
            include: { source: true, target: true }
        });
    }

    async createResourceEdge(data: CreateResourceEdgeData) {
        return prisma.resourceEdge.create({
            data: {
                relation: data.relation,
                sourceId: data.sourceId,
                targetId: data.targetId
            },
            include: { source: true, target: true }
        });
    }

    async createPermissionEdge(data: CreatePermissionEdgeData) {
        // Ensure subjectId is resolved if user ID was passed
        let subjectId = data.subjectId;
        const user = await prisma.user.findUnique({ where: { id: subjectId } });
        if (user) {
            subjectId = user.subjectId;
        }

        return prisma.permissionEdge.create({
            data: {
                relation: data.relation,
                subjectId,
                resourceId: data.resourceId
            },
            include: { subject: true, resource: true }
        });
    }

    // Smart dispatcher for backward compatibility with generic endpoints
    async createRelationship(data: GenericRelationshipData) {
        // 1. Identity Graph Edge (Subject -> Subject)
        const subSrcId = data.subjectSourceId ?? data.subjectId;
        const subTgtId = data.subjectTargetId ?? data.targetSubjectId;

        if (subSrcId && subTgtId) {
            return this.createSubjectEdge({
                relation: data.relation,
                sourceId: subSrcId,
                targetId: subTgtId
            });
        }

        if (data.userSubjectId && subTgtId) {
            const user = await prisma.user.findUnique({ where: { id: data.userSubjectId } });
            const sourceId = user?.subjectId ?? data.userSubjectId;
            return this.createSubjectEdge({
                relation: data.relation,
                sourceId,
                targetId: subTgtId
            });
        }

        // 2. Resource Graph Edge (Resource -> Resource)
        const resSrcId = data.resourceSourceId ?? data.resourceSubjectId;
        const resTgtId = data.resourceTargetId ?? data.objectId ?? data.resourceId;

        if (data.resourceSourceId || data.resourceTargetId) {
            if (resSrcId && resTgtId) {
                return this.createResourceEdge({
                    relation: data.relation,
                    sourceId: resSrcId,
                    targetId: resTgtId
                });
            }
        }

        if (data.resourceSubjectId && (data.objectId || data.resourceId)) {
            const targetId = data.objectId ?? data.resourceId!;
            return this.createResourceEdge({
                relation: data.relation,
                sourceId: data.resourceSubjectId,
                targetId
            });
        }

        // 3. Permission Edge (Subject -> Resource)
        const permSubId = data.subjectId ?? data.userSubjectId;
        const permResId = data.resourceId ?? data.objectId;

        if (permSubId && permResId) {
            return this.createPermissionEdge({
                relation: data.relation,
                subjectId: permSubId,
                resourceId: permResId
            });
        }

        throw new Error("Could not determine edge type from parameters provided.");
    }

    async getResourceById(id: number): Promise<Resource | null> {
        return prisma.resource.findUnique({
            where: { id }
        });
    }

    async getReachableSubjectIds(startSubjectId: number): Promise<number[]> {
        const visited = new Set<number>();
        const queue = [startSubjectId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const memberEdges = await prisma.subjectEdge.findMany({
                where: {
                    sourceId: currentId,
                    relation: "member"
                }
            });

            for (const edge of memberEdges) {
                if (!visited.has(edge.targetId)) {
                    queue.push(edge.targetId);
                }
            }
        }

        return Array.from(visited);
    }

    async findDirectRelationship(params: {
        userId: number;
        resourceId: number;
        relation: string;
    }): Promise<boolean> {
        // Resolve subjectId if a user ID was provided
        const user = await prisma.user.findUnique({ where: { id: params.userId } });
        const startSubjectId = user?.subjectId ?? params.userId;

        // Traverse identity graph to find all subjects (User + Groups) this user belongs to
        const reachableSubjectIds = await this.getReachableSubjectIds(startSubjectId);

        // Check if ANY reachable subject holds the permission edge to target resource
        const edge = await prisma.permissionEdge.findFirst({
            where: {
                relation: params.relation,
                resourceId: params.resourceId,
                subjectId: { in: reachableSubjectIds }
            }
        });

        return edge !== null;
    }

    async findParents(params: {
        resourceId: number;
        relation: string;
    }): Promise<Resource[]> {
        // Find parents in ResourceGraph (e.g. Ward contains Patient -> Ward is parent of Patient)
        // Edge: Ward (sourceId) --contains--> Patient (targetId)
        const edges = await prisma.resourceEdge.findMany({
            where: {
                targetId: params.resourceId,
                relation: params.relation
            },
            include: {
                source: true
            }
        });

        return edges.map((e) => e.source);
    }

    async findChildren(params: {
        resourceId: number;
        relation: string;
    }): Promise<Resource[]> {
        // Find children in ResourceGraph (e.g. Department contains Ward -> Ward is child of Department)
        // Edge: Department (sourceId) --contains--> Ward (targetId)
        const edges = await prisma.resourceEdge.findMany({
            where: {
                sourceId: params.resourceId,
                relation: params.relation
            },
            include: {
                target: true
            }
        });

        return edges.map((e) => e.target);
    }

    async getGraphData() {
        const users = await prisma.user.findMany({ include: { subject: true } });
        const groups = await prisma.group.findMany({ include: { subject: true } });
        const resources = await prisma.resource.findMany();
        const subjectEdges = await prisma.subjectEdge.findMany({ include: { source: true, target: true } });
        const resourceEdges = await prisma.resourceEdge.findMany({ include: { source: true, target: true } });
        const permissionEdges = await prisma.permissionEdge.findMany({ include: { subject: true, resource: true } });

        const nodes = [
            ...users.map((u) => ({
                id: `user:${u.id}`,
                subjectId: u.subjectId,
                label: `User: ${u.name}`,
                type: "user",
                details: { name: u.name, email: u.email }
            })),
            ...groups.map((g) => ({
                id: `group:${g.id}`,
                subjectId: g.subjectId,
                label: `Group: ${g.name}`,
                type: "group",
                details: { name: g.name }
            })),
            ...resources.map((r) => ({
                id: `resource:${r.id}`,
                label: `${r.type.toUpperCase()}: ${r.name}`,
                type: r.type,
                details: { name: r.name, type: r.type }
            }))
        ];

        const edges: any[] = [];

        // 1. Identity Graph Edges
        for (const se of subjectEdges) {
            const sourceUser = users.find((u) => u.subjectId === se.sourceId);
            const sourceGroup = groups.find((g) => g.subjectId === se.sourceId);
            const sourceNodeId = sourceUser ? `user:${sourceUser.id}` : sourceGroup ? `group:${sourceGroup.id}` : `subject:${se.sourceId}`;

            const targetUser = users.find((u) => u.subjectId === se.targetId);
            const targetGroup = groups.find((g) => g.subjectId === se.targetId);
            const targetNodeId = targetUser ? `user:${targetUser.id}` : targetGroup ? `group:${targetGroup.id}` : `subject:${se.targetId}`;

            edges.push({
                id: `subject_edge:${se.id}`,
                source: sourceNodeId,
                target: targetNodeId,
                label: se.relation
            });
        }

        // 2. Resource Graph Edges
        for (const re of resourceEdges) {
            edges.push({
                id: `resource_edge:${re.id}`,
                source: `resource:${re.sourceId}`,
                target: `resource:${re.targetId}`,
                label: re.relation
            });
        }

        // 3. Permission Graph Edges
        for (const pe of permissionEdges) {
            const subUser = users.find((u) => u.subjectId === pe.subjectId);
            const subGroup = groups.find((g) => g.subjectId === pe.subjectId);
            const sourceNodeId = subUser ? `user:${subUser.id}` : subGroup ? `group:${subGroup.id}` : `subject:${pe.subjectId}`;

            edges.push({
                id: `permission_edge:${pe.id}`,
                source: sourceNodeId,
                target: `resource:${pe.resourceId}`,
                label: pe.relation
            });
        }

        return { nodes, edges };
    }

    async getUsers(): Promise<any[]> {
        return prisma.user.findMany({ include: { subject: true } });
    }

    async getGroups(): Promise<any[]> {
        return prisma.group.findMany({ include: { subject: true } });
    }

    async getResources(): Promise<any[]> {
        return prisma.resource.findMany();
    }

    async getRelationships(): Promise<any> {
        const subjectEdges = await prisma.subjectEdge.findMany({ include: { source: true, target: true } });
        const resourceEdges = await prisma.resourceEdge.findMany({ include: { source: true, target: true } });
        const permissionEdges = await prisma.permissionEdge.findMany({ include: { subject: true, resource: true } });
        return { subjectEdges, resourceEdges, permissionEdges };
    }

    async deleteRelationship(id: number): Promise<void> {
        // Try deleting from permission, subject, or resource edges
        try {
            await prisma.permissionEdge.delete({ where: { id } });
            return;
        } catch { /* proceed */ }

        try {
            await prisma.subjectEdge.delete({ where: { id } });
            return;
        } catch { /* proceed */ }

        try {
            await prisma.resourceEdge.delete({ where: { id } });
            return;
        } catch { /* proceed */ }
    }

    async deleteAll(): Promise<void> {
        await prisma.permissionEdge.deleteMany();
        await prisma.subjectEdge.deleteMany();
        await prisma.resourceEdge.deleteMany();
        await prisma.user.deleteMany();
        await prisma.group.deleteMany();
        await prisma.resource.deleteMany();
        await prisma.subject.deleteMany();
    }
}

export const graphRepository = new GraphRepository();
