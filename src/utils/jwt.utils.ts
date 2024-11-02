import jwt from "jsonwebtoken";

interface DecodedToken {
  userId: string;
}

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: "1h",
  });
};

export const verifyToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as DecodedToken;

    if (typeof decoded !== "object" || !decoded.userId) {
      throw new Error("Invalid token structure");
    }

    return decoded;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      console.error("Token expired:", error.message);
    } else if (error.name === "JsonWebTokenError") {
      console.error("Invalid token:", error.message);
    } else {
      console.error("Token verification error:", error.message);
    }
    return null;
  }
};
