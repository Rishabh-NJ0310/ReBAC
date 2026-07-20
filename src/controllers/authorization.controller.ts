import { Request, Response } from "express";
import { authorizationService } from "../authorization/AuthorizationService.js";

export const setUser = async (req: Request, res: Response) => {
    try {
        const user = await authorizationService.createUser(req.body);
        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const setResource = async (req: Request, res: Response) => {
    try {
        const resource = await authorizationService.createResource(req.body);
        res.status(201).json(resource);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const setObject = setResource;

export const setRelationship = async (req: Request, res: Response) => {
    try {
        const { relation, userSubjectId, subjectId, resourceSubjectId, objectId, resourceId } = req.body;
        const targetResourceId = objectId ?? resourceId;
        const actualUserSubjectId = userSubjectId ?? (resourceSubjectId ? undefined : subjectId);

        if (!relation || (!actualUserSubjectId && !resourceSubjectId) || !targetResourceId) {
            res.status(400).json({
                message: "Missing required fields. Provide relation, objectId/resourceId, and either userSubjectId/subjectId or resourceSubjectId."
            });
            return;
        }

        const relationship = await authorizationService.createRelationship({
            relation,
            userSubjectId: actualUserSubjectId ? Number(actualUserSubjectId) : undefined,
            resourceSubjectId: resourceSubjectId ? Number(resourceSubjectId) : undefined,
            objectId: Number(targetResourceId)
        });

        res.status(201).json(relationship);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const check = async (req: Request, res: Response) => {
    try {
        const { userId, subjectId, resourceId, objectId, permission, relation } = req.query;
        const actualUserId = userId ?? subjectId;
        const actualResourceId = resourceId ?? objectId;
        const actualPermission = (permission ?? relation) as string;

        if (!actualUserId || !actualResourceId || !actualPermission) {
            res.status(400).json({
                message: "Missing required query parameters: userId (or subjectId), resourceId (or objectId), and permission (or relation)."
            });
            return;
        }

        const allowed = await authorizationService.checkPermission({
            userId: Number(actualUserId),
            resourceId: Number(actualResourceId),
            permission: actualPermission
        });

        res.json({ allowed });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await authorizationService.getUsers();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
export const getResources = async (req: Request, res: Response) => {
    try {
        const resources = await authorizationService.getResources();
        res.json(resources);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
export const getRelationships = async (req: Request, res: Response) => {
    try {
        const relationships = await authorizationService.getRelationships();
        res.json(relationships);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
export const allThreeTables = async (req: Request, res: Response) => {
    try {
        const users = await authorizationService.getUsers();
        const resources = await authorizationService.getResources();
        const relationships = await authorizationService.getRelationships();
        printTable(users, "Users");
        printTable(resources, "Resources");
        printTable(relationships, "Relationships");
        res.json({ users, resources, relationships });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
export const deleteRelationship = async (req: Request, res: Response) => {
    try {
        const { id } = req.query;
        if (!id) {
            res.status(400).json({ message: "Missing required query parameter: id" });
            return;
        }
        const result = await authorizationService.deleteRelationship(Number(id));
        res.json({ message: "Relationship deleted successfully", result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
function printTable(data: any, name: string = "Data") {
    console.log(`${name}`)
    console.table(data);
}
export const deleteAll = async (req: Request, res: Response) => {
    try {
        await authorizationService.deleteAll();
        res.json({ message: "All data deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}