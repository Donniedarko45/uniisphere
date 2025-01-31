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
exports.verifyOtp = exports.generateOtp = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const generateOtp = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    try {
        yield prisma_1.default.otp.create({
            data: {
                userId,
                code: otpCode,
            },
        });
        return otpCode;
    }
    catch (error) {
        console.error("Error creating OTP:", error);
        throw new Error("Unable to generate OTP. Please try again later.");
    }
});
exports.generateOtp = generateOtp;
const verifyOtp = (userId, otpCode) => __awaiter(void 0, void 0, void 0, function* () {
    const otp = yield prisma_1.default.otp.findFirst({
        where: { userId, code: otpCode },
    });
    if (!otp)
        return false;
    yield prisma_1.default.otp.delete({
        where: { id: otp.id },
    });
    return true;
});
exports.verifyOtp = verifyOtp;
