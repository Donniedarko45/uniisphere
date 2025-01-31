"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (typeof decoded !== "object" || !decoded.userId) {
            throw new Error("Invalid token structure");
        }
        return decoded;
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            console.error("Token expired:", error.message);
        }
        else if (error.name === "JsonWebTokenError") {
            console.error("Invalid token:", error.message);
        }
        else {
            console.error("Token verification error:", error.message);
        }
        return null;
    }
};
exports.verifyToken = verifyToken;
