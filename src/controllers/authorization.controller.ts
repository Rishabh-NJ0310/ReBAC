import { Request, Response } from "express";
import * as authorizationService from "../services/authorization.service.js";

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


export const setRelationship = async (req: Request, res: Response) => {
    try {
        const { subjectId, resourceId, objectId, relation } = req.body;
        const actualResourceId = resourceId ?? objectId;

        if (!subjectId || !actualResourceId || !relation) {
            res.status(400).json({ message: "Missing required fields: subjectId, resourceId (or objectId), and relation" });
            return;
        }

        const relationship = await authorizationService.createRelationship({
            subjectId: Number(subjectId),
            resourceId: Number(actualResourceId),
            relation
        });

        res.status(201).json(relationship);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const check = async (req: Request, res: Response) => {
    try {
        const { subjectId, resourceId, objectId, relation } = req.query;
        const actualResourceId = resourceId ?? objectId;

        if (!subjectId || !actualResourceId || !relation) {
            res.status(400).json({ message: "Missing required query parameters: subjectId, resourceId (or objectId), and relation" });
            return;
        }

        const allowed = await authorizationService.checkPermission({
            subjectId: Number(subjectId),
            resourceId: Number(actualResourceId),
            relation: relation as string
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