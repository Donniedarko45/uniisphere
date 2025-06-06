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
exports.deleteStory = exports.viewStory = exports.getStories = exports.createStory = void 0;
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const prisma_1 = __importDefault(require("../config/prisma"));
const createStory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { caption, mediaType } = req.body;
        const userId = req.userId;
        if (!userId) {
            console.log("userId is not found" + userId);
            return res.status(400).json({
                error: "userId is not found",
            });
        }
        console.log("userId!!!!!", userId);
        console.log("req.body", req.body);
        if (!req.file) {
            return res.status(400).json({
                error: "no media file uploaded",
            });
        }
        console.log("File details:", {
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
        let mediaUrl;
        try {
            const result = yield cloudinary_1.default.uploader.upload(req.file.path, {
                folder: "stories",
                resource_type: "auto",
            });
            console.log("Cloudinary upload successful:", result.secure_url);
            mediaUrl = result.secure_url;
            // console.log(mediaUrl);
        }
        catch (uploadError) {
            console.error("Cloudinary upload error (continuing with local file):", uploadError);
        }
        try {
            const story = yield prisma_1.default.story.create({
                data: {
                    userId,
                    //@ts-ignore
                    mediaUrl: mediaUrl,
                    type: mediaType,
                    duration: 5,
                    caption: caption,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });
            console.log("story", story);
            return res.status(201).json({ story });
        }
        catch (error) {
            console.error("error in creating story:", error);
            next(error);
        }
    }
    catch (err) {
        console.error("Story creation error:", err);
        res.status(500).json({ error: err.message });
    }
});
exports.createStory = createStory;
const getStories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const stories = yield prisma_1.default.story.findMany({
            where: {
                expiresAt: { gt: now },
            },
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePictureUrl: true,
                    },
                },
                views: {
                    where: {
                        viewerId: req.userId,
                    },
                },
            },
        });
        const grouped = stories.reduce((acc, story) => {
            const userId = story.userId;
            if (!acc[userId])
                acc[userId] = { user: story.user, stories: [] };
            acc[userId].stories.push(Object.assign(Object.assign({}, story), { isViewed: story.views.length > 0 }));
            return acc;
        }, {});
        res.json(Object.values(grouped));
    }
    catch (err) {
        res.status(500).json({
            error: "failed to fetch stories.",
        });
    }
});
exports.getStories = getStories;
const viewStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const storyId = req.params.id;
    const viewerId = req.userId;
    if (!viewerId) {
        return res.status(401).json({
            error: "Unauthorized - Viewer ID not found",
        });
    }
    try {
        const existing = yield prisma_1.default.storyView.findUnique({
            where: {
                storyId_viewerId: {
                    storyId,
                    viewerId,
                },
            },
        });
        if (!existing) {
            yield prisma_1.default.storyView.create({
                data: {
                    storyId,
                    viewerId,
                },
            });
        }
        res.status(200).json({ message: "Marked as viewed" });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to mark as viewed" });
    }
});
exports.viewStory = viewStory;
const deleteStory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const storyId = req.params.id;
    const userId = req.userId;
    console.log('Delete Story - Params:', { storyId, userId });
    try {
        console.log('Attempting to find story:', storyId);
        const story = yield prisma_1.default.story.findUnique({
            where: { id: storyId },
        });
        console.log('Found story:', story);
        if (!story) {
            return res.status(404).json({ error: "Story not found" });
        }
        if (story.userId !== userId) {
            return res
                .status(403)
                .json({ error: "Unauthorized to delete this story" });
        }
        // Try to delete from Cloudinary but don't let it block the story deletion
        if (story.mediaUrl) {
            try {
                console.log('Attempting to delete from cloudinary:', story.mediaUrl);
                yield cloudinary_1.default.uploader.destroy(story.mediaUrl);
                console.log('Successfully deleted from Cloudinary');
            }
            catch (cloudinaryError) {
                console.error('Failed to delete from Cloudinary:', cloudinaryError);
                // Continue with story deletion even if Cloudinary fails
            }
        }
        console.log('Deleting story views');
        yield prisma_1.default.storyView.deleteMany({
            where: { storyId },
        });
        console.log('Deleting story');
        yield prisma_1.default.story.delete({
            where: { id: storyId },
        });
        console.log('Story deleted successfully');
        res.json({ message: "Story deleted successfully" });
    }
    catch (err) {
        console.error('Delete story error details:', err);
        next(err);
    }
});
exports.deleteStory = deleteStory;
