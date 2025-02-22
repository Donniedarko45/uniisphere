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

const skills = [
  "Web Development",
  "WordPress",
  "Python",
  "Java",
  "C++",
  "App Development",
  "Software Testing",
  "Data Analytics",
  "SQL",
  "Cloud Computing",
  "Cybersecurity",
  "Blockchain",
  "AI/ML",
  "AR/VR",
  "IoT",
  "Automation",
  "Game Development",
  "Web Scraping",
  "API Development",
  "Chatbot Development",
  "Graphic Design",
  "UI/UX",
  "Animation",
  "Video Editing",
  "3D Modeling",
  "Logo Design",
  "Infographics",
  "Typography",
  "NFT Art",
  "Interior Design",
  "Content Writing",
  "Copywriting",
  "Technical Writing",
  "Ghostwriting",
  "Resume Writing",
  "Scriptwriting",
  "Blogging",
  "Research Writing",
  "Translation",
  "Transcription",
  "Speech Writing",
  "Social Media",
  "SEO",
  "Email Marketing",
  "Ads Management",
  "Affiliate Marketing",
  "Influencer Marketing",
  "PR",
  "Market Research",
  "Lead Generation",
  "Growth Hacking",
  "Accounting",
  "Financial Analysis",
  "Stock Trading",
  "Cryptocurrency",
  "Tax Filing",
  "Budgeting",
  "Crowdfunding",
  "Business Valuation",
  "Investment Analysis",
  "Risk Management",
  "Public Speaking",
  "Negotiation",
  "Conflict Resolution",
  "Time Management",
  "Leadership",
  "Networking",
  "Emotional Intelligence",
  "Personal Branding",
  "Interviewing",
  "Problem-Solving",
  "Online Tutoring",
  "Language Teaching",
  "Music Lessons",
  "Fitness Training",
  "Life Coaching",
  "Career Counseling",
  "Exam Coaching",
  "Yoga",
  "Personal Development",
  "Skill Training",
  "Virtual Assistance",
  "Data Entry",
  "Email Management",
  "Customer Support",
  "Travel Planning",
  "Project Management",
  "Event Planning",
  "Document Formatting",
  "CRM Management",
  "E-commerce",
  "Dropshipping",
  "Product Listing",
  "Sales Funnels",
  "Print-on-Demand",
  "B2B Sales",
  "Customer Retention",
  "Online Courses",
  "Subscription Business",
  "Retail Management",
  "Podcasting",
  "Voiceover",
  "Photography",
  "Freelance Writing",
  "Handmade Crafts",
  "Car Maintenance",
  "Home Repair",
  "Cooking",
  "Nutrition",
  "First Aid",
  "Emergency Preparedness",
  "Gardening",
  "Public Transport Navigation",
  "Apartment Hunting",
  "Resume Optimization",
  "Personal Finance",
  "Stress Management",
  "Meditation",
  "Relationship Building",
  "Workplace Communication",
  "Professional Dressing",
  "Job Search",
  "Business Proposal",
  "Legal Knowledge",
  "Debt Management",
  "Stock Photography",
  "Virtual Reality Content",
  "3D Printing",
  "Ethical Hacking",
  "Cloud Security",
  "Copyediting",
  "Data Visualization",
  "Business Consulting",
  "HR Management",
  "Podcast Editing",
  "Mobile Repair",
  "Digital Illustration",
  "App Monetization",
  "Video Marketing",
  "Email Copywriting",
  "Digital Fundraising",
  "Dance Choreography",
  "DIY Home Decor",
  "Resume Designing",
  "Smart Home Setup",
  "Google Analytics",
  "Social Media Ads",
  "Public Relations Writing",
  "Proofreading",
  "Voice Modulation",
];

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

/*
 *
 *to fix things=> when I am trying to post something, suppose i am kartikey(userid-1) and you are adarsh(userid-2) and when I(Kartikey) logged into the system I got some jwt token . so what I(Kartikey) is doing that he is posting something with passing userid-2 which is of adarsh id and with jwt token of himself he can successfully posting posts from account-2 dont know why it is happening
 *
 *
 */

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { email } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
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

    const otpRecord = await prisma.otp.findFirst({
      where: { user: { email }, code: otp },
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
        firstName,
        lastName,
        passwordHash: hashedPassword,
        PhoneNumber,
        profilePictureUrl: profilePictureUrl || "",
        location,
        About,
        headline,
        username,
        Gender,
        workorProject,
        Interests,
        Skills,
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
