import cors, { CorsOptions } from "cors";
import express, { Application } from "express";
import { miscConfig } from "../../config";
import { commonConfig } from "../../config";
import { metricsMiddleware } from "./metrics.middleware";
var cookieParser = require("cookie-parser");

export default function (app: Application) {
  app.use(cors({
    origin: ["chrome-extension://gecmgbcingenofgkdcmceooknpefflfd", "http://localhost:3000", "*"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }));  
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(metricsMiddleware);
}
