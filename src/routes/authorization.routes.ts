import { Router } from "express";
import * as authorizationController from "../controllers/authorization.controller.js";

const router = Router();

// HTML view
router.get("/graph", authorizationController.getGraphView);

// API Endpoints
router.get("/v2.1/graph", authorizationController.getGraphData);
router.get("/v3/graph", authorizationController.getGraphData);

router.post("/v2.1/users", authorizationController.setUser);
router.post("/v3/users", authorizationController.setUser);

router.post("/v2.1/groups", authorizationController.setGroup);
router.post("/v3/groups", authorizationController.setGroup);

router.post("/v2.1/resources", authorizationController.setResource);
router.post("/v3/resources", authorizationController.setResource);
router.post("/v2.1/objects", authorizationController.setObject);

router.post("/v2.1/relationships", authorizationController.setRelationship);
router.post("/v3/relationships", authorizationController.setRelationship);

router.all("/check", authorizationController.check);
router.all("/v2.1/check", authorizationController.check);
router.all("/v3/check", authorizationController.check);

router.get("/v2.1/users", authorizationController.getUsers);
router.get("/v2.1/resources", authorizationController.getResources);
router.get("/v2.1/relationships", authorizationController.getRelationships);

router.delete("/v2.1/relationships", authorizationController.deleteRelationship);
router.delete("/v3/relationships", authorizationController.deleteRelationship);

router.post("/v2.1/deleteAll", authorizationController.deleteAll);
router.post("/v3/deleteAll", authorizationController.deleteAll);

router.get("/health", (req, res) => {
    res.status(200).json({ message: "ReBAC V3.4 Enterprise Service is healthy" });
});

router.get("/", authorizationController.allThreeTables);

export default router;
