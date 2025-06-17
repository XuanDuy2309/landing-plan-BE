import { Router } from "express";
import { LandingPlanController } from "../controllers";

const LandingPlanRoute = Router();
const landingPlanController = new LandingPlanController();

LandingPlanRoute.get("/", landingPlanController.findMapByLatLon);
LandingPlanRoute.get("/")
LandingPlanRoute.get("/*/:z/:x/:y.png", landingPlanController.getLandingPlanMaps);
LandingPlanRoute.post("/detect-land-type", landingPlanController.detectLandType)
export default LandingPlanRoute;
