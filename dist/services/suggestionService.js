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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class SuggestionService {
    static calculateMatchScore(user, otherUser, mutualConnectionsCount) {
        let score = 0;
        const matchedSkills = [];
        const matchedInterests = [];
        // Calculate skills match
        user.Skills.forEach(skill => {
            if (otherUser.Skills.includes(skill)) {
                score += 2;
                matchedSkills.push(skill);
            }
        });
        // Calculate interests match
        user.Interests.forEach(interest => {
            if (otherUser.Interests.includes(interest)) {
                score += 1.5;
                matchedInterests.push(interest);
            }
        });
        // Add score for mutual connections
        score += mutualConnectionsCount * 3;
        // Add score for same college/degree
        if (user.college && otherUser.college && user.college === otherUser.college) {
            score += 2;
        }
        if (user.degree && otherUser.degree && user.degree === otherUser.degree) {
            score += 1;
        }
        return {
            userId: otherUser.id,
            score,
            matchedSkills,
            matchedInterests,
            mutualConnections: mutualConnectionsCount
        };
    }
    static getSuggestedUsers(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 10) {
            // Get the current user
            const currentUser = yield prisma.user.findUnique({
                where: { id: userId },
                include: {
                    connections1: true,
                    connections2: true,
                }
            });
            if (!currentUser) {
                throw new Error('User not found');
            }
            // Get all connected user IDs
            const connectedUserIds = new Set([
                ...currentUser.connections1.map(c => c.userId2),
                ...currentUser.connections2.map(c => c.userId1)
            ]);
            // Get potential users (excluding current user and already connected users)
            const potentialUsers = yield prisma.user.findMany({
                where: {
                    AND: [
                        { id: { not: userId } },
                        { id: { notIn: Array.from(connectedUserIds) } }
                    ]
                },
                include: {
                    connections1: true,
                    connections2: true,
                }
            });
            // Calculate scores for each potential user
            const scoredUsers = yield Promise.all(potentialUsers.map((user) => __awaiter(this, void 0, void 0, function* () {
                // Calculate mutual connections
                const mutualConnections = yield prisma.connection.count({
                    where: {
                        OR: [
                            {
                                AND: [
                                    { userId1: { in: Array.from(connectedUserIds) } },
                                    { userId2: user.id }
                                ]
                            },
                            {
                                AND: [
                                    { userId2: { in: Array.from(connectedUserIds) } },
                                    { userId1: user.id }
                                ]
                            }
                        ]
                    }
                });
                const matchScore = this.calculateMatchScore(currentUser, user, mutualConnections);
                return Object.assign(Object.assign({}, user), { matchScore });
            })));
            // Sort by score and return top suggestions
            return scoredUsers
                .sort((a, b) => b.matchScore.score - a.matchScore.score)
                .slice(0, limit);
        });
    }
}
exports.SuggestionService = SuggestionService;
