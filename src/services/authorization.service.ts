import * as authorizationRepository from "../repositories/authorization.repository.js";

export async function createUser(data: {
    name: string;
    email: string;
    password: string;
}) {
    return authorizationRepository.createUser(data);
}

export async function createResource(data: {
    type: string;
    name: string;
}) {
    return authorizationRepository.createResource(data);
}

export async function createRelationship(data: {
    subjectId: number;
    resourceId: number;
    relation: string;
}) {
    return authorizationRepository.createRelationship(data);
}

export async function checkPermission(data: {
    subjectId: number;
    resourceId: number;
    relation: string;
}) {
    return authorizationRepository.checkPermission(data);
}
