"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuth = exports.login = exports.verifyOtp = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../config/prisma"));
const jwt_utils_1 = require("../utils/jwt.utils");
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = __importDefault(require("crypto"));
dotenv_1.default.config();
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
});
const sendOtp = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Email Verification OTP",
            text: `Your OTP for email verification is ${otp}`,
        };
        yield transporter.verify();
        yield transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    }
    catch (error) {
        console.error("Email sending failed:", error);
        throw new Error(`Failed to send email: ${error}`);
    }
});
const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, username } = req.body;
        const existingUser = yield prisma_1.default.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });
        if (existingUser) {
            return res.status(400).json({
                error: existingUser.email === email
                    ? "Email already registered"
                    : "Username already taken",
            });
        }
        const otp = crypto_1.default.randomInt(100000, 999999).toString();
        const tempUser = yield prisma_1.default.user.create({
            data: {
                email,
                username,
            },
        });
        yield prisma_1.default.otp.create({
            data: {
                userId: tempUser.id,
                code: otp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
        });
        yield sendOtp(email, otp);
        res.status(200).json({ message: "OTP sent to your email" });
    }
    catch (error) {
        return next(error);
    }
});
exports.register = register;
const verifyOtp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp, firstName, lastName, username, password, PhoneNumber, location, bio, profilePictureUrl, college, degree, startYear, endYear, } = req.body;
        const otpRecord = yield prisma_1.default.otp.findFirst({
            where: { user: { username }, code: otp },
            orderBy: { createdAt: "desc" },
        });
        if (!otpRecord) {
            return res.status(400).json({ error: "Invalid OTP" });
        }
        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({ error: "OTP expired. Request a new OTP" });
        }
        yield prisma_1.default.otp.delete({ where: { id: otpRecord.id } });
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const updatedUser = yield prisma_1.default.user.update({
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
        const token = (0, jwt_utils_1.generateToken)(updatedUser.id);
        res.status(201).json({ token, user: updatedUser });
    }
    catch (error) {
        return next(error);
    }
});
exports.verifyOtp = verifyOtp;
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }
        const token = (0, jwt_utils_1.generateToken)(user.id);
        return res.status(200).json({ token });
    }
    catch (error) {
        return next(error);
    }
});
exports.login = login;
const googleAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { googleId, email, username, profilePictureUrl } = req.body;
        const user = yield prisma_1.default.user.findUnique({
            where: { googleId },
        });
        if (user) {
            const token = (0, jwt_utils_1.generateToken)(user.id);
            return res.json({ user, token });
        }
        const newUser = yield prisma_1.default.user.create({
            data: {
                googleId,
                email,
                username,
                profilePictureUrl,
                passwordHash: "",
            },
        });
        if (!newUser) {
            return res.status(400).json({ error: "Failed to create user" });
        }
        const token = (0, jwt_utils_1.generateToken)(newUser.id);
        return res.json({ user: newUser, token });
    }
    catch (error) {
        console.error("Google auth error:", error);
        return next(error);
    }
});
exports.googleAuth = googleAuth;
