import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import nodemailer from "nodemailer";
import passport from "passport";
import prisma from "../config/prisma";
import { generateToken } from "../utils/jwt.utils";

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        error: "Username must be 3-30 characters long and can only contain letters, numbers and underscore"
      });
    }

    // Check for existing verified user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email, verified: true },
          { username }
        ]
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

    // Delete any existing unverified user with this email
    await prisma.user.deleteMany({
      where: {
        email,
        verified: false,
      },
    });

    const otp = crypto.randomInt(100000, 999999).toString();
    const tempUser = await prisma.user.create({
      data: {
        email,
      },
    });

    // Delete any existing OTPs for this user
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

// Update verifyOtp to only handle OTP verification
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Delete expired OTPs
    await prisma.otp.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() }
      }
    });

    const otpRecord = await prisma.otp.findFirst({
      where: { userId: user.id, code: otp },
      orderBy: { createdAt: "desc" }
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ error: "OTP expired. Request a new OTP" });
    }

    await prisma.otp.delete({ where: { id: otpRecord.id } });

    // Return temporary token for completing profile
    const tempToken = generateToken(user.id);
    res.status(200).json({
      message: "OTP verified successfully",
      tempToken
    });

  } catch (error) {
    return next(error);
  }
};

// Add new route to complete profile after OTP verification
export const completeProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const {
      email,
      username,
      firstName,
      lastName,
      password,
      PhoneNumber,
      location,
      profilePictureUrl,
      college,
      headline,
      Gender,
      Skills,
      Interests,
      About,
      degree,
      workorProject,
      startYear,
      endYear,
    } = req.body;

    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character"
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ error: "User already verified" });
    }

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
        About,
        headline,
        Gender,
        workorProject,
        Interests,
        Skills,
        college,
        degree,
        startYear,
        endYear,
        verified: true,
      }
    });

    const token = generateToken(updatedUser.id);
    res.status(200).json({
      message: "Profile completed successfully",
      token,
      user: updatedUser
    });

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


    if (!user.verified) {
      return res.status(403).json({
        message: "Email not verified. Please verify your email first.",
        needsVerification: true
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = generateToken(user.id);



    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
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
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
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
