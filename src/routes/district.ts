import express from "express";
import { DistrictController, ProvinceController } from "../controllers";

export const DistrictRouter = express.Router();
const districtController = new DistrictController();

DistrictRouter.get("/", districtController.index);
DistrictRouter.get("/:id", districtController.getAllByProvinceId);