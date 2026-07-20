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
        const rel = await prisma.relationship.findFirst({
            where: {
                userSubjectId: params.userSubjectId,
                objectId: params.objectId,
                relation: params.relation
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
}

export const graphRepository = new GraphRepository();
