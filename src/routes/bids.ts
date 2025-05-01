import express from "express";
import { DistrictController, ProvinceController } from "../controllers";
import { BidsController } from "../controllers/bids-controller";
import { authMiddleware } from "../middleware";

export const BidsRouter = express.Router();
const bidsController = new BidsController();

BidsRouter.get("/:id", authMiddleware, bidsController.getAllByPostId);
BidsRouter.post("/", authMiddleware, bidsController.create);