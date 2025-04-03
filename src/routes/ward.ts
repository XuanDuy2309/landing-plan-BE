import express from "express";
import { DistrictController, ProvinceController, WardController } from "../controllers";

export const WardRouter = express.Router();
const wardController = new WardController();

WardRouter.get("/:id", wardController.getAllByDistrictId);
WardRouter.get("/", wardController.index);