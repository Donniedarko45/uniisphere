import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import { generateToken } from "../utils/jwt.utils";
import { verifyOtp } from "../utils/otp.util";

export const register = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  const hashedpassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email,
      username: username,
      passwordHash: hashedpassword,
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

export const clerkOauth = async (req: Request, res: Response) => {
  const { googleId, profilePictureUrl } = req.body;

  let user = await prisma.user.findUnique({ where: { googleId } });
  if (!user) {
    prisma.user.create({
      data: {
        googleId,
        profilePictureUrl,
      },
    });
  }

  const token = generateToken(user.id);
  res.status(200).json({ token });
};
