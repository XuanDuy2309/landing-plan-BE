import express from "express";
import { ProvinceController } from "../controllers";

export const ProvinceRouter = express.Router();
const provinceController = new ProvinceController();

ProvinceRouter.get("/", provinceController.index);