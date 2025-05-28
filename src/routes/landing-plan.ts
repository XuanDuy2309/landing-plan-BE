import { Router } from "express";
import { LandingPlanController } from "../controllers";

const LandingPlanRoute = Router();
const landingPlanController = new LandingPlanController();

LandingPlanRoute.get("/", landingPlanController.findMapByLatLon);
LandingPlanRoute.get("/")

export default LandingPlanRoute;
