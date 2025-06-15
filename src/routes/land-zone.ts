import express from "express";
import { LandZoneController } from "../controllers";
import { authMiddleware } from "../middleware";
export const LandZoneRouter = express.Router();
const landZoneController = new LandZoneController();

LandZoneRouter.get("/", authMiddleware, landZoneController.index);
LandZoneRouter.get("/point", authMiddleware, landZoneController.getByPoint);
LandZoneRouter.post("/", authMiddleware, landZoneController.store);
LandZoneRouter.post("/bulk", authMiddleware, landZoneController.storeMany);
LandZoneRouter.put("/:id", authMiddleware, landZoneController.update);
LandZoneRouter.delete("/:id", authMiddleware, landZoneController.delete);