// In your main app.ts or index.ts

import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import connectDB from "./database/db";
import { ApiErrorType } from "./controller/authController";
import { authRouter } from "./router/auth";
import { orderRouter } from "./router/order";
import cors from "cors";
import cookieParser from "cookie-parser";

const app: express.Express = express();
app.use(cookieParser());

// CORS configuration for all domains
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", async (req, res) => {
  res.send("working");
});

// 2. Mount your routers on specific base paths
app.use("/api/v1/users", authRouter);
app.use("/api/v1/orders", orderRouter);

connectDB()
  .then(() => {
    app.listen(3000, () => {
      console.log("server connected");
    });
  })
  .catch((e) => {
    console.log(e || "Failed to connect Database");
  });

// Your global error handler
app.use(
  (err: ApiErrorType, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
      error: {
        statusCode: statusCode,
        success: false,
        message: err.message,
        errors: err.errors || [],
        data: null,
      },
    });
  }
);
