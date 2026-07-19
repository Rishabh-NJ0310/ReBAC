import { prisma } from "./db";

export async function checkPermission(
    userId: number,
    objectId: number,
    relation: string
) {
    const relationship =
        await prisma.relationship.findFirst({
            where: {
                subjectId: userId,
                objectId,
                relation
            }
        });

    return relationship != null;
}