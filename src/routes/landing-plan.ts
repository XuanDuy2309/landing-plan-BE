import { Router } from "express";
import { LandingPlanController } from "../controllers";
import { authMiddleware } from "../middleware";

const LandingPlanRoute = Router();
const landingPlanController = new LandingPlanController();

LandingPlanRoute.get("/", landingPlanController.findMapByLatLon);
LandingPlanRoute.get("/list", authMiddleware, landingPlanController.getListMap)
LandingPlanRoute.get("/*/:z/:x/:y.png", landingPlanController.getLandingPlanMaps);
LandingPlanRoute.post("/detect-land-type", landingPlanController.detectLandType)
export default LandingPlanRoute;
