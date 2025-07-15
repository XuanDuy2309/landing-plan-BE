import express from "express";
import path from "path";
import { AuthRouter } from "./auth";
import { BidsRouter } from "./bids";
import ChatbotRouter from "./chat-bot";
import ConversationRouter from "./conversation";
import CoordinateLocationRoute from "./coordinate-location";
import { DistrictRouter } from "./district";
import { LandZoneRouter } from "./land-zone";
import LandingPlanRoute from "./landing-plan";
import { NotificationRouter } from "./notification";
import { PostRouter } from "./post";
import { ProvinceRouter } from "./province";
import { SiteRouter } from "./site";
import { UserRouter } from "./user";
import { WardRouter } from "./ward";

export const Route = (app: any) => {
    app.use('/', SiteRouter);
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    app.use('/tile-layer', express.static('public/tile-layer'));
    app.use('/user', UserRouter);
    app.use('/auth', AuthRouter);
    app.use('/coordinates', CoordinateLocationRoute);
    app.use('/landing-plan', LandingPlanRoute);
    app.use('/province', ProvinceRouter);
    app.use('/district', DistrictRouter);
    app.use('/ward', WardRouter);
    app.use('/post', PostRouter);
    app.use('/bids', BidsRouter);
    app.use('/notification', NotificationRouter);
    app.use('/conversations', ConversationRouter);
    app.use('/chat-bot', ChatbotRouter);
    app.use('/land-zones', LandZoneRouter)
};
