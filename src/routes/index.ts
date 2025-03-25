import { AuthRouter } from "./auth";
import { SiteRouter } from "./site";
import { UserRouter } from "./user";
import express from "express";
import path from "path";
import LandingPlanRoute from "./landing-plan";

export const Route = (app: any) => {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  app.use('/user', UserRouter);
  app.use('/auth', AuthRouter);
  app.use('/', SiteRouter);
  app.use('/landing-plan', LandingPlanRoute);
};
