import { Router } from "express";
import {  getTile, LandingPlanController } from "../controllers/landing-plan-controller";

const LandingPlanRoute = Router();
const landingPlanController = new LandingPlanController();

LandingPlanRoute.get("/:z/:x/:y.png", getTile);
LandingPlanRoute.get("/coordinates", landingPlanController.findCoordinatesLocation);

export default LandingPlanRoute;
