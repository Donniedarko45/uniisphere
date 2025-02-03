import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import { generateToken } from "../utils/jwt.utils";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import crypto from "crypto";
import passport from "passport";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

const sendOtp = async (email: string, otp: string) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Email Verification OTP",
      text: `Your OTP for email verification is ${otp}`,
    };

    await transporter.verify();
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error(`Failed to send email: ${error}`);
  }
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { email, username } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        error:
          existingUser.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const tempUser = await prisma.user.create({
      data: {
        email,
        username,
      },
    });
    await prisma.otp.create({
      data: {
        userId: tempUser.id,
        code: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
    await sendOtp(email, otp);
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    return next(error);
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const {
      email,
      otp,
      firstName,
      lastName,
      username,
      password,
      PhoneNumber,
      location,
      bio,
      profilePictureUrl,
      college,
      degree,
      startYear,
      endYear,
    } = req.body;

    const otpRecord = await prisma.otp.findFirst({
      where: { user: { username }, code: otp },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ error: "OTP expired. Request a new OTP" });
    }

    await prisma.otp.delete({ where: { id: otpRecord.id } });
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        username,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        PhoneNumber,
        profilePictureUrl: profilePictureUrl || "",
        location,
        bio,
        college,
        degree,
        startYear,
        endYear,
      },
    });

    const token = generateToken(updatedUser.id);
    res.status(201).json({ token, user: updatedUser });
  } catch (error) {
    return next(error);
  }
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

export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next,
  );
};

export const googleAuthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  passport.authenticate("google", { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    const token = generateToken(user.id);
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  })(req, res, next);
};

export const resendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.otp.deleteMany({
      where: { userId: user.id },
    });

    const otp = crypto.randomInt(100000, 999999).toString();

    await prisma.otp.create({
      data: {
        userId: user.id,
        code: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    await sendOtp(email, otp);

    res.status(200).json({
      message: "New OTP sent successfully",
      expiresIn: "5 minutes",
    });
  } catch (error) {
    next(error);
  }
};
