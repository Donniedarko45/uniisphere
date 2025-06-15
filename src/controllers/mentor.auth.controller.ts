import dotenv from "dotenv";
import nodemailer from "nodemailer";
import prisma from "../config/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        error:
          "Username must be 3-30 characters long and can only contain letters, numbers and underscore",
      });
    }

    const existingUser = await prisma.mentorship.findFirst({
      where: {
        OR: [{ email, verified: true }, { username }],
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

    await prisma.mentorship.deleteMany({
      where: {
        email,
        verified: false,
      },
    });

    const otp = crypto.randomInt(100000, 999999).toString();
    const tempUser = await prisma.mentorship.create({
      data: {
        username,
        email,
      },
    });

    await prisma.otp.deleteMany({
      where: { userId: tempUser.id },
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
