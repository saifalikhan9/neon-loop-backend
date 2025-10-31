// middleware/authMiddleware.ts
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../database/models/UserSchema";
import ApiErrorRes from "../utils/ApiErrorResponse";
import { constants } from "../utils/constants";

interface JwtPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

export interface CustomRequest extends Request {
  user?: IUser;
}

export const authMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;

    // Extract accessToken from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new ApiErrorRes(
          401,
          "You are not logged in! Please log in to get access."
        )
      );
    }

    // Verify accessToken
    const decoded = jwt.verify(token, constants.access_Token_Key) as JwtPayload;

    // Check if user still exists
    const currentUser = await User.findById(decoded.id).select("-password");

    if (!currentUser) {
      return next(
        new ApiErrorRes(
          401,
          "The user belonging to this token does no longer exist."
        )
      );
    }

    // Attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    console.log(error);
    // Handle JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiErrorRes(401, "Invalid token. Please log in again."));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(
        new ApiErrorRes(401, "Your token has expired. Please log in again.")
      );
    }
    return next(error);
  }
};

// Role-based access control
export const restrictTo = (...roles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return next(
        new ApiErrorRes(403, "Authentication error. User role not found.")
      );
    }

    // Allow admin to access all routes
    if (req.user.role === "admin" || roles.includes(req.user.role)) {
      return next();
    }

    return next(
      new ApiErrorRes(403, "You do not have permission to perform this action")
    );
  };
};

// middleware/refreshTokenMiddleware.ts

export const refreshTokenMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      // ✅ Use 403 instead of 401 for refresh token issues
      return next(
        new ApiErrorRes(403, "No refresh token found. Please log in.")
      );
    }

    const decoded = jwt.verify(
      refreshToken,
      constants.refresh_Token_Key
    ) as JwtPayload;

    const currentUser = await User.findById(decoded.id).select("-password");

    if (!currentUser) {
      // ✅ Use 403 instead of 401
      return next(
        new ApiErrorRes(
          403,
          "The user belonging to this token no longer exists."
        )
      );
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      // ✅ Use 403 instead of 401
      return next(
        new ApiErrorRes(403, "Invalid refresh token. Please log in again.")
      );
    }
    if (error instanceof jwt.TokenExpiredError) {
      // ✅ Use 403 instead of 401
      return next(
        new ApiErrorRes(403, "Refresh token expired. Please log in again.")
      );
    }
    return next(error);
  }
};
