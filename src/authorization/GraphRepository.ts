import prisma from "../prisma/client.js";
import { Resource } from "../generated/prisma/client.js";

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
    userSubjectId?: number;
    resourceSubjectId?: number;
    objectId: number;
}

export class GraphRepository {
    async createUser(data: CreateUserData) {
        return prisma.user.create({ data });
    }

    async createResource(data: CreateResourceData) {
        return prisma.resource.create({ data });
    }

    async createRelationship(data: CreateRelationshipData) {
        if (!data.userSubjectId && !data.resourceSubjectId) {
            throw new Error("A relationship must have either a userSubjectId or resourceSubjectId.");
        }

        return prisma.relationship.create({
            data: {
                relation: data.relation,
                userSubjectId: data.userSubjectId ?? null,
                resourceSubjectId: data.resourceSubjectId ?? null,
                objectId: data.objectId
            }
        });
    }

    async getResourceById(id: number): Promise<Resource | null> {
        return prisma.resource.findUnique({
            where: { id }
        });
    }

    async findDirectRelationship(params: {
        userSubjectId: number;
        objectId: number;
        relation: string;
    }): Promise<boolean> {
        console.log("QUERY");
    
        console.log(params);
        const rel = await prisma.relationship.findFirst({
            where: {
                userSubjectId: params.userSubjectId,
                objectId: params.objectId,
                relation: params.relation
            }
        });
        console.log("FOUND");

        console.log(rel);
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

    async findRelationships(filter: {
        userSubjectId?: number;
        resourceSubjectId?: number;
        objectId?: number;
        relation?: string;
    }) {
        return prisma.relationship.findMany({
            where: filter
        });
    }

    async getGraphData() {
        const users = await prisma.user.findMany();
        const resources = await prisma.resource.findMany();
        const relationships = await prisma.relationship.findMany();

        const nodes = [
            ...users.map((u) => ({
                id: `user:${u.id}`,
                label: `User: ${u.name}`,
                type: "user",
                details: { name: u.name, email: u.email }
            })),
            ...resources.map((r) => ({
                id: `resource:${r.id}`,
                label: `${r.type.toUpperCase()}: ${r.name}`,
                type: r.type,
                details: { name: r.name, type: r.type }
            }))
        ];

        const edges = relationships.map((r) => {
            const source = r.userSubjectId ? `user:${r.userSubjectId}` : `resource:${r.resourceSubjectId}`;
            return {
                id: `edge:${r.id}`,
                source,
                target: `resource:${r.objectId}`,
                label: r.relation
            };
        });

        return { nodes, edges };
    }

    async getUsers(): Promise<any[]> {
        return prisma.user.findMany();
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
        await prisma.resource.deleteMany();
    }
}

export const graphRepository = new GraphRepository();
