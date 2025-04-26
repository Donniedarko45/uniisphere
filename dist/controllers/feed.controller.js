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
exports.getFeed = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getFeed = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cursor, limit, filter } = req.query;
        const userId = req.userId;
        const pageSize = parseInt(limit) || 10;
        const userNetwork = yield prisma_1.default.connection.findMany({
            where: {
                OR: [
                    { userId1: userId, status: "accepted" },
                    { userId2: userId, status: "accepted" },
                ],
            },
            select: {
                userId1: true,
                userId2: true,
            },
        });
        const user = yield prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { Interests: true },
        });
        const connectedUserIds = userNetwork
            .flatMap((conn) => [conn.userId1, conn.userId2])
            .filter((id) => id !== userId);
        const baseQuery = {
            take: pageSize,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            where: {
                OR: [
                    { userId: { in: connectedUserIds } },
                    { userId },
                    {
                        AND: [
                            { visibility: "public" },
                            { tags: { hasSome: (user === null || user === void 0 ? void 0 : user.Interests) || [] } },
                        ],
                    },
                ],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePictureUrl: true,
                        headline: true,
                    },
                },
                Comments: {
                    include: {
                        user: {
                            select: {
                                username: true,
                                profilePictureUrl: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
                Likes: true,
                _count: {
                    select: {
                        Comments: true,
                        Likes: true,
                        Share: true,
                    },
                },
            },
            orderBy: filter === "trending"
                ? {
                    Likes: {
                        _count: "desc",
                    },
                }
                : { createdAt: "desc" },
        };
        const posts = yield prisma_1.default.post.findMany(baseQuery);
        const postsWithEngagement = posts.map((post) => {
            var _a, _b, _c, _d;
            const likesCount = ((_a = post.Likes) === null || _a === void 0 ? void 0 : _a.length) || 0;
            const commentsCount = ((_b = post._count) === null || _b === void 0 ? void 0 : _b.Comments) || 0;
            const sharesCount = ((_c = post._count) === null || _c === void 0 ? void 0 : _c.Share) || 0;
            const engagementScore = likesCount * 1 + commentsCount * 2 + sharesCount * 3;
            return Object.assign(Object.assign({}, post), { engagementScore, commentPreview: ((_d = post.Comments) === null || _d === void 0 ? void 0 : _d.slice(0, 3)) || [], totalComments: commentsCount, totalLikes: likesCount, totalShares: sharesCount });
        });
        const nextCursor = posts.length ? posts[posts.length - 1].id : null;
        res.json({
            posts: postsWithEngagement,
            nextCursor,
            hasMore: posts.length === pageSize,
        });
    }
    catch (error) {
        console.error("Error fetching feed posts:", error);
        next(error);
    }
});
exports.getFeed = getFeed;
