import { Router } from "express";
import { CoordinatesLocationController, getTile } from "../controllers";

const CoordinateLocationRoute = Router();
const coordinatesLocationControllerInstance = new CoordinatesLocationController();

CoordinateLocationRoute.get("/:z/:x/:y.png", getTile);
CoordinateLocationRoute.get("/coordinates", coordinatesLocationControllerInstance.findCoordinatesLocation);

export default CoordinateLocationRoute;
