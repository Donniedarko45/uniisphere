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
exports.resetPassword = exports.forgotPassword = exports.resendOtp = exports.googleAuthCallback = exports.googleAuth = exports.login = exports.completeProfile = exports.verifyOtp = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const passport_1 = __importDefault(require("passport"));
const prisma_1 = __importDefault(require("../config/prisma"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const jwt_utils_1 = require("../utils/jwt.utils");
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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }
        const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                error: "Username must be 3-30 characters long and can only contain letters, numbers and underscore",
            });
        }
        const existingUser = yield prisma_1.default.user.findFirst({
            where: {
                OR: [{ email, verified: true }, { username }],
            },
        });
        if (existingUser) {
            return res.status(400).json({
                error: existingUser.email === email
                    ? "Email already registered"
                    : "Username already taken",
            });
        }
        yield prisma_1.default.user.deleteMany({
            where: {
                email,
                verified: false,
            },
        });
        const otp = crypto_1.default.randomInt(100000, 999999).toString();
        const tempUser = yield prisma_1.default.user.create({
            data: {
                email,
            },
        });
        yield prisma_1.default.otp.deleteMany({
            where: { userId: tempUser.id },
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
        const { email, otp } = req.body;
        const user = yield prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }
        yield prisma_1.default.otp.deleteMany({
            where: {
                userId: user.id,
                expiresAt: { lt: new Date() },
            },
        });
        const otpRecord = yield prisma_1.default.otp.findFirst({
            where: { userId: user.id, code: otp },
            orderBy: { createdAt: "desc" },
        });
        if (!otpRecord) {
            return res.status(400).json({ error: "Invalid OTP" });
        }
        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({ error: "OTP expired. Request a new OTP" });
        }
        yield prisma_1.default.otp.delete({ where: { id: otpRecord.id } });
        const tempToken = (0, jwt_utils_1.generateToken)(user.id);
        res.status(200).json({
            message: "OTP verified successfully",
            tempToken,
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.verifyOtp = verifyOtp;
const completeProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, username, firstName, lastName, password, PhoneNumber, location, college, headline, Gender, Skills, Interests, About, degree, workorProject, startYear, endYear, profilePictureBase64, // Add this to accept base64 image
         } = req.body;
        const user = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }
        if (user.verified) {
            return res.status(400).json({ error: "User already verified" });
        }
        let profilePictureUrl = "";
        // Handle profile picture - check both file upload and base64 string
        if (req.file) {
            // Existing file upload logic
            try {
                const result = yield cloudinary_1.default.uploader.upload(req.file.path, {
                    folder: "profile_pictures",
                    transformation: [
                        { width: 500, height: 500, crop: "fill" },
                        { quality: "auto" },
                    ],
                });
                profilePictureUrl = result.secure_url;
                yield prisma_1.default.cloudinaryMedia.create({
                    data: {
                        publicId: result.public_id,
                        url: result.secure_url,
                        resourceType: "image",
                        userId: user.id,
                    },
                });
            }
            catch (error) {
                return res
                    .status(400)
                    .json({ error: "Failed to upload profile picture" });
            }
        }
        else if (profilePictureBase64) {
            try {
                const result = yield cloudinary_1.default.uploader.upload(profilePictureBase64, {
                    folder: "profile_pictures",
                    transformation: [
                        { width: 500, height: 500, crop: "fill" },
                        { quality: "auto" },
                    ],
                });
                profilePictureUrl = result.secure_url;
                yield prisma_1.default.cloudinaryMedia.create({
                    data: {
                        publicId: result.public_id,
                        url: result.secure_url,
                        resourceType: "image",
                        userId: user.id,
                    },
                });
            }
            catch (error) {
                console.error("Error uploading base64 image:", error);
                return res
                    .status(400)
                    .json({ error: "Failed to upload profile picture" });
            }
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character",
            });
        }
        const existingUser = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!existingUser) {
            return res.status(400).json({ error: "User not found" });
        }
        if (existingUser.verified) {
            return res.status(400).json({ error: "User already verified" });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const updatedUser = yield prisma_1.default.user.update({
            where: { email },
            data: {
                username,
                firstName,
                lastName,
                passwordHash: hashedPassword,
                PhoneNumber,
                profilePictureUrl,
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
            },
        });
        const token = (0, jwt_utils_1.generateToken)(updatedUser.id);
        res.status(200).json({
            message: "Profile completed successfully",
            token,
            user: updatedUser,
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.completeProfile = completeProfile;
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }
        if (!user.verified) {
            return res.status(403).json({
                message: "Email not verified. Please verify your email first.",
                needsVerification: true,
            });
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }
        const token = (0, jwt_utils_1.generateToken)(user.id);
        return res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.login = login;
const googleAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    passport_1.default.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});
exports.googleAuth = googleAuth;
const googleAuthCallback = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    passport_1.default.authenticate("google", { session: false }, (err, user) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: "Authentication failed" });
        }
        const token = (0, jwt_utils_1.generateToken)(user.id);
        res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
    })(req, res, next);
});
exports.googleAuthCallback = googleAuthCallback;
const resendOtp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        yield prisma_1.default.otp.deleteMany({
            where: { userId: user.id },
        });
        const otp = crypto_1.default.randomInt(100000, 999999).toString();
        yield prisma_1.default.otp.create({
            data: {
                userId: user.id,
                code: otp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
        });
        yield sendOtp(email, otp);
        res.status(200).json({
            message: "New OTP sent successfully",
            expiresIn: "5 minutes",
        });
    }
    catch (error) {
        next(error);
    }
});
exports.resendOtp = resendOtp;
const forgotPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Delete any existing OTPs
        yield prisma_1.default.otp.deleteMany({
            where: { userId: user.id },
        });
        const otp = crypto_1.default.randomInt(100000, 999999).toString();
        yield prisma_1.default.otp.create({
            data: {
                userId: user.id,
                code: otp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
            },
        });
        yield sendOtp(email, otp);
        res.status(200).json({
            message: "Password reset OTP sent to your email",
            expiresIn: "5 minutes",
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp, newPassword } = req.body;
        // Updated password validation with clearer regex and error messages
        const passwordValidation = {
            minLength: newPassword.length >= 8,
            hasUpper: /[A-Z]/.test(newPassword),
            hasLower: /[a-z]/.test(newPassword),
            hasNumber: /\d/.test(newPassword),
            hasSpecial: /[@$!%*?&#]/.test(newPassword),
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
                    .map(([key]) => key),
            });
        }
        const user = yield prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Delete expired OTPs
        yield prisma_1.default.otp.deleteMany({
            where: {
                userId: user.id,
                expiresAt: { lt: new Date() },
            },
        });
        const otpRecord = yield prisma_1.default.otp.findFirst({
            where: {
                userId: user.id,
                code: otp,
            },
            orderBy: { createdAt: "desc" },
        });
        if (!otpRecord) {
            return res.status(400).json({ error: "Invalid OTP" });
        }
        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({ error: "OTP expired. Request a new OTP" });
        }
        // Hash new password
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        // Update password
        yield prisma_1.default.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword },
        });
        // Delete used OTP
        yield prisma_1.default.otp.delete({
            where: { id: otpRecord.id },
        });
        res.status(200).json({
            message: "Password reset successful",
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.resetPassword = resetPassword;
