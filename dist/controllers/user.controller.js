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
exports.updateUserStatus = exports.getAllUsers = exports.updateProfile = exports.getProfile = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const client_1 = require("@prisma/client");
/*
 *
 we have to implement a search functionality for users where suppose there 2 data in database donniedarko and donniedarko1 when user type donniedarko it should return both the data
 *
 */
const prismaClient = new client_1.PrismaClient();
const getProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.query;
        const { search } = req.query;
        const requestingUserId = req.body.userId; // The user making the request
        if (!userId && !search) {
            return res
                .status(400)
                .json({ message: "Either userId or search term is required" });
        }
        // First get the user(s) based on search or userId
        const users = yield prisma_1.default.user.findMany({
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
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                location: true,
                About: true,
                Skills: true,
                Interests: true,
                headline: true,
                class10Board: true,
                class12Board: true,
                profilePictureUrl: true,
                workorProject: true,
                college: true,
                degree: true,
                email: true,
                connections1: true,
                connections2: true,
                experiences: true, // Added experience data
                _count: {
                    select: {
                        connections1: true,
                        connections2: true,
                    },
                },
            },
        });
        if (!users || users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        // For each user, check if they are connected with the requesting user
        const processedUsers = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            // Skip connection check if it's the same user
            if (user.id === requestingUserId) {
                return Object.assign(Object.assign({}, user), { isConnected: true, isOwnProfile: true });
            }
            const connection = yield prisma_1.default.connection.findFirst({
                where: {
                    OR: [
                        {
                            userId1: requestingUserId,
                            userId2: user.id,
                            status: "accepted",
                        },
                        {
                            userId1: user.id,
                            userId2: requestingUserId,
                            status: "accepted",
                        },
                    ],
                },
            });
            const isConnected = !!connection;
            // If not connected, return limited profile information
            if (!isConnected) {
                return {
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    headline: user.headline,
                    workorProject: user.workorProject,
                    email: user.email,
                    Skills: user.Skills,
                    Interests: user.Interests,
                    About: user.About,
                    experiences: user.experiences, // Added experience data for non-connected users
                    class10Board: user.class10Board,
                    class12Board: user.class12Board,
                    profilePictureUrl: user.profilePictureUrl,
                    college: user.college,
                    degree: user.degree,
                    location: user.location,
                    _count: user._count,
                    isConnected: false,
                    isOwnProfile: false,
                };
            }
            // If connected, return full profile information
            return Object.assign(Object.assign({}, user), { isConnected: true, isOwnProfile: false });
        })));
        res.status(200).json(processedUsers);
    }
    catch (err) {
        console.error(next(err));
    }
});
exports.getProfile = getProfile;
const updateProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId; // Get userId from auth middleware instead of request body
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { username, firstName, lastName, PhoneNumber, location, college, headline, Gender, Skills, Interests, About, degree, workorProject, startYear, endYear, class10Board, class12Board, profilePictureBase64, experiences, } = req.body;
        const existingUser = yield prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                experiences: true,
            },
        });
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }
        if (username && username !== existingUser.username) {
            const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
            if (!usernameRegex.test(username)) {
                return res.status(400).json({
                    error: "Username must be 3-30 characters long and can only contain letters, numbers, and underscores",
                });
            }
            const usernameExists = yield prisma_1.default.user.findUnique({
                where: { username },
            });
            if (usernameExists && usernameExists.id !== userId) {
                return res.status(400).json({ error: "Username already taken" });
            }
        }
        let profilePictureUrl = existingUser.profilePictureUrl || "";
        if (req.file) {
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
                        userId,
                    },
                });
            }
            catch (error) {
                console.error("Error uploading profile picture:", error);
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
                        userId,
                    },
                });
            }
            catch (error) {
                console.error("Error uploading base64 image:", error);
                console.error("Base64 string length:", profilePictureBase64 === null || profilePictureBase64 === void 0 ? void 0 : profilePictureBase64.length);
                console.error("Base64 string preview:", profilePictureBase64 === null || profilePictureBase64 === void 0 ? void 0 : profilePictureBase64.substring(0, 50));
                return res
                    .status(400)
                    .json({ error: "Failed to upload profile picture" });
            }
        }
        const updateData = {};
        if (username !== undefined)
            updateData.username = username;
        if (firstName !== undefined)
            updateData.firstName = firstName;
        if (lastName !== undefined)
            updateData.lastName = lastName;
        if (PhoneNumber !== undefined)
            updateData.PhoneNumber = PhoneNumber;
        if (location !== undefined)
            updateData.location = location;
        if (About !== undefined)
            updateData.About = About;
        if (headline !== undefined)
            updateData.headline = headline;
        if (Gender !== undefined)
            updateData.Gender = Gender;
        if (workorProject !== undefined)
            updateData.workorProject = workorProject;
        if (class10Board !== undefined)
            updateData.class10Board = class10Board;
        if (class12Board !== undefined)
            updateData.class12Board = class12Board;
        if (college !== undefined)
            updateData.college = college;
        if (degree !== undefined)
            updateData.degree = degree;
        if (startYear !== undefined)
            updateData.startYear = startYear;
        if (endYear !== undefined)
            updateData.endYear = endYear;
        // Arrays require special handling
        if (Skills !== undefined)
            updateData.Skills = Skills;
        if (Interests !== undefined)
            updateData.Interests = Interests;
        // Check if profilePictureBase64 was provided at all (even if it's empty)
        if ("profilePictureBase64" in req.body || req.file) {
            updateData.profilePictureUrl = profilePictureUrl;
        }
        // Handle experiences update if provided
        if (experiences) {
            // Delete removed experiences
            const experienceIds = experiences
                .filter((exp) => exp.id)
                .map((exp) => exp.id);
            yield prisma_1.default.experience.deleteMany({
                where: {
                    userId: userId,
                    id: { notIn: experienceIds },
                },
            });
            // Update or create experiences
            const experiencePromises = experiences.map((exp) => __awaiter(void 0, void 0, void 0, function* () {
                if (exp.id) {
                    // Update existing experience
                    return prisma_1.default.experience.update({
                        where: { id: exp.id },
                        data: {
                            title: exp.title,
                            organizationName: exp.organizationName,
                            location: exp.location,
                            locationType: exp.locationType,
                            description: exp.description,
                        },
                    });
                }
                else {
                    // Create new experience
                    return prisma_1.default.experience.create({
                        data: {
                            title: exp.title,
                            organizationName: exp.organizationName,
                            location: exp.location,
                            locationType: exp.locationType,
                            description: exp.description,
                            userId: userId,
                        },
                    });
                }
            }));
            yield Promise.all(experiencePromises);
        }
        const updatedUser = yield prisma_1.default.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                experiences: true,
            },
        });
        return res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("Error updating profile:", error);
        return next(error);
    }
});
exports.updateProfile = updateProfile;
const getAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allUsers = yield prisma_1.default.user.findMany();
        res.status(200).json(allUsers);
    }
    catch (error) {
        next(error); // pass the error to the Express error handler
    }
});
exports.getAllUsers = getAllUsers;
const updateUserStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, status, isOnline } = req.body;
    try {
        const user = yield prismaClient.user.update({
            where: { id: userId },
            data: {
                status,
                isOnline,
            },
        });
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update user status",
        });
    }
});
exports.updateUserStatus = updateUserStatus;
