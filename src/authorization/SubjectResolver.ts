import { GraphRepository } from "./GraphRepository.js";
import prisma from "../prisma/client.js";

export class SubjectResolver {
    constructor(private repository: GraphRepository) {}

    public async resolveSubjectSet(userId: number): Promise<Set<number>> {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const startSubjectId = user?.subjectId ?? userId;

        const reachableArray = await this.repository.getReachableSubjectIds(startSubjectId);
        return new Set(reachableArray);
    }
}
