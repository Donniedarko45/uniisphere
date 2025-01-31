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
exports.googleAuth = exports.otpLogin = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../config/prisma"));
const jwt_utils_1 = require("../utils/jwt.utils");
const otp_util_1 = require("../utils/otp.util");
const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, firstName, lastName, username, password, PhoneNumber, location, bio, profilePictureUrl, college, degree, startYear, endYear, } = req.body;
        const existingUser = yield prisma_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({
                error: "email already registered",
            });
        }
        const hashedpassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma_1.default.user.create({
            data: {
                email,
                username,
                firstName,
                lastName,
                passwordHash: hashedpassword,
                profilePictureUrl,
                PhoneNumber,
                location,
                bio,
                college,
                degree,
                startYear,
                endYear,
            },
        });
        const token = (0, jwt_utils_1.generateToken)(user.id);
        res.status(201).json({ token, user });
    }
    catch (error) {
        return next(error);
    }
});
exports.register = register;
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
const otpLogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        const user = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res
                .status(404)
                .json({ message: "user with this email not found" });
        }
        const isValidOtp = yield (0, otp_util_1.verifyOtp)(user.id, otp);
        if (!isValidOtp) {
            return res.status(401).json({ message: "Invalid otp" });
        }
        const token = (0, jwt_utils_1.generateToken)(user.id);
        return res.status(200).json({ token });
    }
    catch (error) {
        return next(error);
    }
});
exports.otpLogin = otpLogin;
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
        // Create new user with required fields
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
