import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import { generateToken } from "../utils/jwt.utils";
import { verifyOtp } from "../utils/otp.util";

export const register = async (req: Request, res: Response,next:NextFunction):Promise<any> => {
  const { email, username, password } = req.body;

  const existingUser = await prisma.user.findUnique({
    where : {email}
  });
  if(existingUser){
    return res.status(400).json({
      error: 'email already registered'
    });
  }
  const hashedpassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email,
      username: username,
      passwordHash: hashedpassword,
      profilePictureUrl: "",
    },
  });

  const token = generateToken(user.id);
  res.status(201).json({ token });
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = generateToken(user.id);
    return res.status(200).json({ token });
  } catch (error) {
    return next(error);
  }
};

export const otpLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(404)
        .json({ message: "user with this email not found" });
    }

    const isValidOtp = await verifyOtp(user.id, otp);
    if (!isValidOtp) {
      return res.status(401).json({ message: "Invalid otp" });
    }

    const token = generateToken(user.id);
    return res.status(200).json({ token });
  } catch (error) {
    return next(error);
  }
};

export const googleAuth = async (  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { googleId, email, username, profilePictureUrl } = req.body;

    const user = await prisma.user.findUnique({
      where: { googleId },
    });

    if (user) {
      const token = generateToken(user.id);
      return res.json({ user, token });
    }

    // Create new user with required fields
    const newUser = await prisma.user.create({
      data: {
        googleId,
        email,
        username,
        profilePictureUrl,
        passwordHash: "", // Empty since using OAuth
      },
    });

    if (!newUser) {
      return res.status(400).json({ error: "Failed to create user" });
    }

    const token = generateToken(newUser.id);
    return res.json({ user: newUser, token });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};
