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
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const prisma_1 = __importDefault(require("./prisma"));
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/v2/google/callback",
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const existingUser = yield prisma_1.default.user.findUnique({
            where: { googleId: profile.id },
        });
        if (existingUser) {
            return done(null, existingUser);
        }
        const newUser = yield prisma_1.default.user.create({
            data: {
                googleId: profile.id,
                email: profile.emails[0].value,
                username: profile.displayName,
                profilePictureUrl: (_a = profile.photos) === null || _a === void 0 ? void 0 : _a[0].value,
                passwordHash: "",
            },
        });
        done(null, newUser);
    }
    catch (error) {
        done(error, undefined);
    }
})));
exports.default = passport_1.default;
