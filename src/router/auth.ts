import { Router } from "express";
import {
  getMeController,
  loginController,
  refreshTokenController,
  signUP_Controller,
  logoutController
} from "../controller/authController";
import { refreshTokenMiddleware } from "../middlewares/auth";
const router = Router();

router.post("/signUp", signUP_Controller);
router.post("/login", loginController);

router.get("/me", refreshTokenMiddleware, getMeController);
router.post("/refresh", refreshTokenMiddleware, refreshTokenController);
router.post("/logout", logoutController);


export {router as authRouter}