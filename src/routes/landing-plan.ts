import { Router } from "express";
import { getTile } from "../controllers/landing-plan-controller";

const LandingPlanRoute = Router();

LandingPlanRoute.get("/:z/:x/:y.png", getTile);

export default LandingPlanRoute;
