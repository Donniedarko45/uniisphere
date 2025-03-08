import { verifyToken } from "../utils/jwt.utils";
import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new Error("No token provided"));
  }

  const token = authHeader.split(" ")[1];
  console.log("token extraction" + token);
  try {
    const decoded = verifyToken(token);
    console.log("decoded token is " + decoded);
    if (!decoded || !decoded.userId) {
      return next(new Error("Invalid token"));
    }

    req.userId = decoded.userId;
    return next();
  } catch (error) {
    console.error("Token verification error:", error);
    return next(error);
  }
};

export const verifyUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const requestedUserId = req.body.userId || req.params.userId;

  if (requestedUserId && requestedUserId !== req.userId) {
    return next(
      new Error("Unauthorized: Cannot perform actions for other users"),
    );
  }

  return next();
};
