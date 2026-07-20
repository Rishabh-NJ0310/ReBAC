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

    if(!relationship) {
        return false;
    }
    const user = await prisma.user.findUnique({
        where: { id: data.subjectId }
    });

    const resource = await prisma.resource.findUnique({
        where: { id: data.resourceId }
    });
    
    return {
        allowed: true,
        user,
        resource
    }
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

export async function deleteRelationship(id: number): Promise<void> {
    await prisma.relationship.delete({
        where: { id }
    });
}

export async function deleteAll(): Promise<void> {
    await prisma.relationship.deleteMany();
    await prisma.user.deleteMany();
    await prisma.resource.deleteMany();
}