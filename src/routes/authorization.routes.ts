import { Router } from "express";
import * as authorizationController from "../controllers/authorization.controller.js";

const router = Router();

router.post("/users", authorizationController.setUser);
router.post("/resources", authorizationController.setResource);
router.post("/relationships", authorizationController.setRelationship);
router.get("/check", authorizationController.check);


router.get("/users", authorizationController.getUsers);
router.get("/resources", authorizationController.getResources);
router.get("/relationships", authorizationController.getRelationships);


router.get("/health", (req, res) => {
    res.status(200).json({ message: "ReBAC V1 service is healthy" });
});

export default router;
