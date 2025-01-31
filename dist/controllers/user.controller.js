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
exports.getProfile = exports.updateProfile = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const updateProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.body.userId;
        const { headline, location, college, bio, firstName, lastName } = req.body;
        const user = yield prisma_1.default.user.update({
            where: { id: userId },
            data: {
                headline,
                location,
                college,
                bio,
                firstName,
                lastName,
            },
        });
        res.status(200).json({ message: "profile updated successfully", user });
    }
    catch (err) {
        next(err);
    }
});
exports.updateProfile = updateProfile;
/*
 *
 * we have to implement a search functionality for users where suppose there 2 data in database donniedarko and donniedarko1 when user type donniedarko it should return both the data
 *
 */
const getProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.query;
        const { search } = req.query;
        if (!userId && !search) {
            return res
                .status(400)
                .json({ message: "Either userId or search term is required" });
        }
        const user = yield prisma_1.default.user.findMany({
            where: {
                OR: [
                    { id: userId },
                    {
                        username: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            },
            select: {
                username: true,
                firstName: true,
                lastName: true,
                location: true,
                bio: true,
                college: true,
                email: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    }
    catch (err) {
        console.error(next(err));
    }
});
exports.getProfile = getProfile;
