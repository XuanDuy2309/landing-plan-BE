import { Router } from "express";
import { LandingPlanController } from "../controllers";
import { authMiddleware } from "../middleware";

const LandingPlanRoute = Router();
const landingPlanController = new LandingPlanController();

LandingPlanRoute.get("/", landingPlanController.findMapByLatLon);
LandingPlanRoute.get("/change", landingPlanController.findMapChangeByLatLon);
LandingPlanRoute.get("/type", landingPlanController.getListLandType);
LandingPlanRoute.get("/change-list", landingPlanController.getListMapChange);
LandingPlanRoute.get("/list", authMiddleware, landingPlanController.getListMap)
LandingPlanRoute.get("/*/:z/:x/:y.png", landingPlanController.getLandingPlanMaps);
LandingPlanRoute.post("/detect-land-type", landingPlanController.detectLandType)
LandingPlanRoute.post("/change", authMiddleware, landingPlanController.storeLandTypeChange);
LandingPlanRoute.put("/change/:id", authMiddleware, landingPlanController.updateLandTypeChange);
LandingPlanRoute.delete("/change/:id", authMiddleware, landingPlanController.deleteLandTypeChange);
LandingPlanRoute.post("/type", authMiddleware, landingPlanController.addLandType);
LandingPlanRoute.put("/type/:id", authMiddleware, landingPlanController.updateLandType);
LandingPlanRoute.delete("/type/:id", authMiddleware, landingPlanController.deleteLandType);


export default LandingPlanRoute;
