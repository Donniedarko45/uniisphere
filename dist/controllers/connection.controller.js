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
exports.getConnectionStats = exports.getConnections = exports.declineConnection = exports.acceptConnection = exports.getPendingRequests = exports.sendConnectionRequest = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const socket_1 = require("../utils/socket");
const sendConnectionRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId1 = req.body.userId;
    const userId2 = req.params.userId;
    try {
        const existingConnection = yield prisma_1.default.connection.findUnique({
            where: { userId1_userId2: { userId1, userId2 } },
        });
        if (existingConnection) {
            return res.status(400).json({ message: "Connection already exists" });
        }
        const newConnection = yield prisma_1.default.connection.create({
            data: {
                userId1,
                userId2,
                status: "pending",
            },
            include: {
                user1: {
                    select: {
                        id: true,
                        username: true,
                        profilePictureUrl: true,
                        headline: true,
                    },
                },
            },
        });
        socket_1.io.to(userId2).emit("connectionRequest", {
            connectionId: newConnection.id,
            sender: newConnection.user1,
            timestamp: new Date(),
        });
        return res.status(201).json({
            message: "Connection request sent",
            connectionId: newConnection.id,
        });
    }
    catch (error) {
        console.error("Error sending connection request:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.sendConnectionRequest = sendConnectionRequest;
const getPendingRequests = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.body.userId;
        const pendingRequests = yield prisma_1.default.connection.findMany({
            where: {
                userId2: userId,
                status: "pending",
            },
            include: {
                user1: {
                    select: {
                        id: true,
                        username: true,
                        profilePictureUrl: true,
                        headline: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json({
            pendingRequests,
        });
    }
    catch (error) {
        console.error("Error fetching pending requests:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.getPendingRequests = getPendingRequests;
const acceptConnection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { connectionId } = req.params;
    const userId = req.body.userId;
    try {
        const connection = yield prisma_1.default.connection.findUnique({
            where: { id: connectionId },
            include: {
                user1: true,
                user2: true,
            },
        });
        if (!connection) {
            return res.status(404).json({ message: "Connection request not found" });
        }
        if (connection.userId2 !== userId) {
            return res
                .status(403)
                .json({ message: "Not authorized to accept this request" });
        }
        yield prisma_1.default.connection.update({
            where: { id: connectionId },
            data: { status: "accepted" },
        });
        // Notify the sender that their request was accepted
        socket_1.io.to(connection.userId1).emit("connectionAccepted", {
            connectionId,
            acceptedBy: connection.user2,
        });
        res.status(200).json({ message: "Connection accepted" });
    }
    catch (error) {
        console.error("Error accepting connection:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.acceptConnection = acceptConnection;
const declineConnection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { connectionId } = req.params;
    const userId = req.body.userId;
    try {
        const connection = yield prisma_1.default.connection.findUnique({
            where: { id: connectionId },
        });
        if (!connection) {
            return res.status(404).json({ message: "Connection request not found" });
        }
        if (connection.userId2 !== userId) {
            return res
                .status(403)
                .json({ message: "Not authorized to decline this request" });
        }
        yield prisma_1.default.connection.update({
            where: { id: connectionId },
            data: { status: "declined" },
        });
        res.status(200).json({ message: "Connection declined" });
    }
    catch (error) {
        console.error("Error declining connection:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.declineConnection = declineConnection;
const getConnections = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.body.userId;
        const [connections, stats] = yield Promise.all([
            prisma_1.default.connection.findMany({
                where: {
                    OR: [
                        { userId1: userId, status: "accepted" },
                        { userId2: userId, status: "accepted" },
                    ],
                },
                include: {
                    user1: {
                        select: {
                            id: true,
                            username: true,
                            profilePictureUrl: true,
                            headline: true,
                        },
                    },
                    user2: {
                        select: {
                            id: true,
                            username: true,
                            profilePictureUrl: true,
                            headline: true,
                        },
                    },
                },
            }),
            // Get connection stats
            prisma_1.default.$transaction([
                prisma_1.default.connection.count({
                    where: {
                        OR: [
                            { userId1: userId, status: "accepted" },
                            { userId2: userId, status: "accepted" },
                        ],
                    },
                }),
                prisma_1.default.connection.count({
                    where: {
                        userId2: userId,
                        status: "accepted",
                    },
                }),
                prisma_1.default.connection.count({
                    where: {
                        userId1: userId,
                        status: "accepted",
                    },
                }),
            ]),
        ]);
        const [totalConnections, followers, following] = stats;
        res.status(200).json({
            connections: connections.map((conn) => (Object.assign(Object.assign({}, conn), { otherUser: conn.userId1 === userId ? conn.user2 : conn.user1 }))),
            stats: {
                totalConnections,
                followers,
                following,
            },
        });
    }
    catch (error) {
        console.error("Error fetching connections:", error);
        res.status(500).json({ error: "Failed to fetch connections" });
    }
});
exports.getConnections = getConnections;
// Add this new function to get connection stats
const getConnectionStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        // Get total connections (accepted only)
        const connectionsCount = yield prisma_1.default.connection.count({
            where: {
                OR: [
                    { userId1: userId, status: "accepted" },
                    { userId2: userId, status: "accepted" },
                ],
            },
        });
        // Get followers (where this user is userId2)
        const followersCount = yield prisma_1.default.connection.count({
            where: {
                userId2: userId,
                status: "accepted",
            },
        });
        // Get following (where this user is userId1)
        const followingCount = yield prisma_1.default.connection.count({
            where: {
                userId1: userId,
                status: "accepted",
            },
        });
        // Get pending requests received
        const pendingRequestsCount = yield prisma_1.default.connection.count({
            where: {
                userId2: userId,
                status: "pending",
            },
        });
        res.status(200).json({
            stats: {
                totalConnections: connectionsCount,
                followers: followersCount,
                following: followingCount,
                pendingRequests: pendingRequestsCount,
            },
        });
    }
    catch (error) {
        console.error("Error fetching connection stats:", error);
        res.status(500).json({ error: "Failed to fetch connection statistics" });
    }
});
exports.getConnectionStats = getConnectionStats;
