import prisma from "../prisma/client.js";
import { Resource, User, Group, Subject } from "../generated/prisma/client.js";

export interface CreateUserData {
    name: string;
    email: string;
    password: string;
}

export interface CreateResourceData {
    type: string;
    name: string;
}

export interface CreateRelationshipData {
    relation: string;
    subjectId?: number;
    userSubjectId?: number;
    resourceSubjectId?: number;
    targetSubjectId?: number;
    objectId?: number;
}

export class GraphRepository {
    async createUser(data: CreateUserData) {
        const subject = await prisma.subject.create({
            data: { type: "user", name: data.name }
        });

        return prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: data.password,
                subjectId: subject.id
            }
        });
    }

    async createGroup(name: string) {
        const subject = await prisma.subject.create({
            data: { type: "group", name }
        });

        return prisma.group.create({
            data: {
                name,
                subjectId: subject.id
            }
        });
    }

    async createResource(data: CreateResourceData) {
        return prisma.resource.create({ data });
    }

    async createRelationship(data: CreateRelationshipData) {
        return prisma.relationship.create({
            data: {
                relation: data.relation,
                subjectId: data.subjectId ?? null,
                userSubjectId: data.userSubjectId ?? null,
                resourceSubjectId: data.resourceSubjectId ?? null,
                targetSubjectId: data.targetSubjectId ?? null,
                objectId: data.objectId ?? null
            }
        });
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

            const memberRels = await prisma.relationship.findMany({
                where: {
                    subjectId: currentId,
                    relation: "member",
                    targetSubjectId: { not: null }
                }
            });

            for (const rel of memberRels) {
                if (rel.targetSubjectId && !visited.has(rel.targetSubjectId)) {
                    queue.push(rel.targetSubjectId);
                }
            }
        }

        return Array.from(visited);
    }

    async findDirectRelationship(params: {
        userSubjectId: number;
        objectId: number;
        relation: string;
    }): Promise<boolean> {
        const user = await prisma.user.findUnique({ where: { id: params.userSubjectId } });
        const startSubjectId = user?.subjectId ?? params.userSubjectId;

        const reachableSubjectIds = await this.getReachableSubjectIds(startSubjectId);

        const rel = await prisma.relationship.findFirst({
            where: {
                relation: params.relation,
                objectId: params.objectId,
                OR: [
                    { subjectId: { in: reachableSubjectIds } },
                    { userSubjectId: params.userSubjectId }
                ]
            }
        });

        return rel !== null;
    }

    async findParents(params: {
        objectId: number;
        relation: string;
    }): Promise<Resource[]> {
        const relationships = await prisma.relationship.findMany({
            where: {
                objectId: params.objectId,
                relation: params.relation,
                resourceSubjectId: { not: null }
            },
            include: {
                resourceSubject: true
            }
        });

        return relationships
            .map((r) => r.resourceSubject)
            .filter((res): res is Resource => res !== null);
    }

    async findChildren(params: {
        resourceSubjectId: number;
        relation: string;
    }): Promise<Resource[]> {
        const relationships = await prisma.relationship.findMany({
            where: {
                resourceSubjectId: params.resourceSubjectId,
                relation: params.relation
            },
            include: {
                object: true
            }
        });

        return relationships
            .map((r) => r.object)
            .filter((res): res is Resource => res !== null);
    }

    async findRelationships(filter: any) {
        return prisma.relationship.findMany({
            where: filter
        });
    }

    async getGraphData() {
        const users = await prisma.user.findMany({ include: { subject: true } });
        const groups = await prisma.group.findMany({ include: { subject: true } });
        const resources = await prisma.resource.findMany();
        const relationships = await prisma.relationship.findMany({
            include: {
                subject: true,
                targetSubject: true,
                object: true,
                userSubject: true,
                resourceSubject: true
            }
        });

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

        const edges = relationships.map((r) => {
            let source = `subject:${r.subjectId}`;
            if (r.userSubjectId) source = `user:${r.userSubjectId}`;
            if (r.resourceSubjectId) source = `resource:${r.resourceSubjectId}`;
            if (r.subject) {
                if (r.subject.type === "user") {
                    const u = users.find(usr => usr.subjectId === r.subjectId);
                    if (u) source = `user:${u.id}`;
                } else if (r.subject.type === "group") {
                    const g = groups.find(grp => grp.subjectId === r.subjectId);
                    if (g) source = `group:${g.id}`;
                }
            }

            let target = `resource:${r.objectId}`;
            if (r.targetSubjectId && r.targetSubject) {
                if (r.targetSubject.type === "group") {
                    const g = groups.find(grp => grp.subjectId === r.targetSubjectId);
                    if (g) target = `group:${g?.id}`;
                }
            }

            return {
                id: `edge:${r.id}`,
                source,
                target,
                label: r.relation
            };
        });

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

    async getRelationships(): Promise<any[]> {
        return prisma.relationship.findMany();
    }

    async deleteRelationship(id: number): Promise<void> {
        await prisma.relationship.delete({
            where: { id }
        });
    }

    async deleteAll(): Promise<void> {
        await prisma.relationship.deleteMany();
        await prisma.user.deleteMany();
        await prisma.group.deleteMany();
        await prisma.resource.deleteMany();
        await prisma.subject.deleteMany();
    }
}

export const graphRepository = new GraphRepository();
