import { Request, Response } from "express";
import ApiErrorRes from "../utills/ApiErrorResponse";

import { generateToken } from "../utills/generateToken";
import { constants } from "../utills/constants";
import { CustomRequest } from "../middlewares/auth";
import User from "../database/models/UserSchema";
export interface ApiErrorType extends Error {
  statusCode: number;
  success: boolean;
  message: string;
  errors: string[];
  data: null;
}

export async function signUP_Controller(req: Request, res: Response) {
  const {
    email,
    name,
    password,
  }: { email: string; name: string; password: string } = req.body;
  if (!email || !password || !name) {
    throw new ApiErrorRes(400, "please check the payload");
  }
  const exhistingUser = await User.findOne({ email });
  if (exhistingUser) {
    throw new ApiErrorRes(409, "user is already registed with this email");
  }
  
  const newUser = await User.create({ email, name, password });

  res
    .json({ user: newUser, message: "user is created succesfully" })
    .status(200);
}

export async function loginController(req: Request, res: Response) {
  const { email, password }: { email: string; password: string } = req.body;

  if (!email || !password) {
    throw new ApiErrorRes(400, "please check the payload");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiErrorRes(404, "user not found with this email and password");
  }

  if (!(await user.correctPassword(password))) {
    throw new ApiErrorRes(400, "Incorrect Password");
  }

  const refreshToken = generateToken(
    {
      email: user.email,
      id: user._id as string,
    },
    constants.refresh_Token_Key,
    7 * 24 * 60 * 60
  );

  const accessToken = generateToken(
    {
      email: user.email,
      id: user._id as string,
    },
    constants.access_Token_Key,
    15 * 60
  );

  const userObj = {
    name: user.name,
    email: user.email,
    id: user._id,
    role: user.role,
  };

  user.password = "";

  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 1000,
    httpOnly: true,
    secure: false,
    sameSite: "lax" as const,
    path: "/",
  });

  res
    .json({
      user: userObj,
      message: "User LoggedIN Successfully",
      token: accessToken,
    })
    .status(200);
}

export async function getMeController(req: CustomRequest, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      throw new ApiErrorRes(401, "Not authenticated");
    }

    // Generate new accessToken
    const accessToken = generateToken(
      {
        email: user.email,
        id: user._id as string,
      },
      constants.access_Token_Key,
      15 * 60 * 1000
    );

    // Return user data AND token
    res.status(200).json({
      user,
      accessToken: accessToken,
      message: "User retrieved successfully",
    });
  } catch (error) {
    throw error;
  }
}

// Just refresh the access token (lightweight, no user query needed)
export async function refreshTokenController(
  req: CustomRequest,
  res: Response
) {
  try {
    const user = req.user;

    if (!user) {
      throw new ApiErrorRes(401, "Not authenticated");
    }

    // Generate new accessToken
    const accessToken = generateToken(
      {
        email: user.email,
        id: user._id as string,
      },
      constants.access_Token_Key,
      15 * 60 * 1000
    );

    res.status(200).json({
      accessToken: accessToken,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    throw error;
  }
}

// controller/authController.ts
export async function logoutController(req: Request, res: Response) {
  try {
    // Clear the refreshToken cookie
    res.cookie("refreshToken", "", {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
    });

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    throw new ApiErrorRes(500, "Failed to logout");
  }
}
