import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import nodemailer from "nodemailer";
import passport from "passport";
import prisma from "../config/prisma";
import { generateToken } from "../utils/jwt.utils";
import cloudinary from "../utils/cloudinary";


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
        error: "Username must be 3-30 characters long and can only contain letters, numbers and underscore"
      });
    }

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

    const tempToken = generateToken(user.id);
    res.status(200).json({
      message: "OTP verified successfully",
      tempToken
    });

  } catch (error) {
    return next(error);
  }
};

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

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ error: "User already verified" });
    }

    let profilePictureUrl = "";

    // Handle profile picture upload if file exists
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "profile_pictures",
          transformation: [
            { width: 500, height: 500, crop: "fill" },
            { quality: "auto" }
          ]
        });
        profilePictureUrl = result.secure_url;

        // Store media info in CloudinaryMedia table
        await prisma.cloudinaryMedia.create({
          data: {
            publicId: result.public_id,
            url: result.secure_url,
            resourceType: 'image',
            userId: user.id
          }
        });
      } catch (error) {
        return res.status(400).json({ error: "Failed to upload profile picture" });
      }
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character"
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (!existingUser) {
      return res.status(400).json({ error: "User not found" });
    }

    if (existingUser.verified) {
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
        profilePictureUrl, // This will now be the Cloudinary URL
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

// Add these new controller functions

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete any existing OTPs
    await prisma.otp.deleteMany({
      where: { userId: user.id }
    });

    const otp = crypto.randomInt(100000, 999999).toString();

    await prisma.otp.create({
      data: {
        userId: user.id,
        code: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
      }
    });

    await sendOtp(email, otp);

    res.status(200).json({
      message: "Password reset OTP sent to your email",
      expiresIn: "5 minutes"
    });

  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { email, otp, newPassword } = req.body;

    // Updated password validation with clearer regex and error messages
    const passwordValidation = {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
      hasSpecial: /[@$!%*?&#]/.test(newPassword)
    };

    if (!Object.values(passwordValidation).every(Boolean)) {
      return res.status(400).json({
        error: "Password requirements not met",
        requirements: {
          minLength: "Minimum 8 characters",
          hasUpper: "At least one uppercase letter",
          hasLower: "At least one lowercase letter",
          hasNumber: "At least one number",
          hasSpecial: "At least one special character (@$!%*?&#)",
        },
        failed: Object.entries(passwordValidation)
          .filter(([_, valid]) => !valid)
          .map(([key]) => key)
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete expired OTPs
    await prisma.otp.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() }
      }
    });

    const otpRecord = await prisma.otp.findFirst({
      where: {
        userId: user.id,
        code: otp
      },
      orderBy: { createdAt: "desc" }
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ error: "OTP expired. Request a new OTP" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword }
    });

    // Delete used OTP
    await prisma.otp.delete({
      where: { id: otpRecord.id }
    });

    res.status(200).json({
      message: "Password reset successful"
    });

  } catch (error) {
    return next(error);
  }
};
