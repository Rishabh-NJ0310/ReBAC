import prisma from "../prisma/client.js";

export async function createUser(data: {
    name: string;
    email: string;
    password: string;
}) {
    return prisma.user.create({
        data
    });
}

export async function createResource(data: {
    type: string;
    name: string;
}) {
    return prisma.resource.create({
        data
    });
}

export async function createRelationship(data: {
    subjectId: number;
    resourceId: number;
    relation: string;
}) {
    return prisma.relationship.create({
        data
    });
}

export async function checkPermission(data: {
    subjectId: number;
    resourceId: number;
    relation: string;
}) {
    const relationship = await prisma.relationship.findUnique({
        where: {
            subjectId_resourceId_relation: {
                subjectId: data.subjectId,
                resourceId: data.resourceId,
                relation: data.relation
            }
        }
    });

    return relationship !== null;
}

export async function getUsers(): Promise<any[]> {
    return prisma.user.findMany();
}

export async function getResources(): Promise<any[]> {
    return prisma.resource.findMany();
}

export async function getRelationships(): Promise<any[]> {
    return prisma.relationship.findMany();
}