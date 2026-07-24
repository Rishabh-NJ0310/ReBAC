import { Router } from "express";
import * as authorizationController from "../controllers/authorization.controller.js";

const router = Router();

// HTML view
router.get("/graph", authorizationController.getGraphView);

// API Endpoints
router.get("/v2.1/graph", authorizationController.getGraphData);
router.post("/v2.1/users", authorizationController.setUser);
router.post("/v2.1/groups", authorizationController.setGroup);
router.post("/v2.1/resources", authorizationController.setResource);
router.post("/v2.1/objects", authorizationController.setObject);
router.post("/v2.1/relationships", authorizationController.setRelationship);
router.get("/v2.1/check", authorizationController.check);

router.get("/v2.1/users", authorizationController.getUsers);
router.get("/v2.1/resources", authorizationController.getResources);
router.get("/v2.1/relationships", authorizationController.getRelationships);
router.delete("/v2.1/relationships", authorizationController.deleteRelationship);
router.post("/v2.1/deleteAll", authorizationController.deleteAll);

router.get("/health", (req, res) => {
    res.status(200).json({ message: "ReBAC V3 service is healthy" });
});

router.get("/", authorizationController.allThreeTables);

export default router;
