import { Router } from "express";
import * as authorizationController from "../controllers/authorization.controller.js";

const router = Router();

router.post("/users", authorizationController.setUser);
router.post("/resources", authorizationController.setResource);
router.post("/relationships", authorizationController.setRelationship);
router.get("/check", authorizationController.check);

export default router;
