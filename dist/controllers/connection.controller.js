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
exports.getConnections = exports.declineConnection = exports.acceptConnection = exports.sendConnectionRequest = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
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
        yield prisma_1.default.connection.create({
            data: {
                userId1,
                userId2,
            },
        });
        return res.status(201).json({ message: "Connection request sent" });
    }
    catch (error) {
        console.error("Error sending connection request:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.sendConnectionRequest = sendConnectionRequest;
// Accept a connection request
const acceptConnection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { connectionId } = req.params;
    yield prisma_1.default.connection.update({
        where: { id: connectionId },
        data: { status: "accepted" },
    });
    res.status(200).json({ message: "Connection accepted" });
});
exports.acceptConnection = acceptConnection;
// Decline a connection request
const declineConnection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { connectionId } = req.params;
    yield prisma_1.default.connection.update({
        where: { id: connectionId },
        data: { status: "declined" },
    });
    res.status(200).json({ message: "Connection declined" });
});
exports.declineConnection = declineConnection;
// Get user's connections
const getConnections = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.body.userId; // Extract from token
    const connections = yield prisma_1.default.connection.findMany({
        where: {
            OR: [
                { userId1: userId, status: "accepted" },
                { userId2: userId, status: "accepted" },
            ],
        },
        include: {
            user1: true,
            user2: true,
        },
    });
    res.status(200).json({ connections });
});
exports.getConnections = getConnections;
