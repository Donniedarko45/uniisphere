import { verifyToken } from "../utils/jwt.utils";
import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  body: {
    userId?: string;
    [key: string]: any;
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.body.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res
      .status(401)
      .json({ message: "Token verification failed", error: error });
  }
};
