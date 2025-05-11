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
        const userSkills = user.Skills || [];
        const otherUserSkills = otherUser.Skills || [];
        userSkills.forEach(skill => {
            if (otherUserSkills.includes(skill)) {
                score += 2;
                matchedSkills.push(skill);
            }
        });
        const userInterests = user.Interests || [];
        const otherUserInterests = otherUser.Interests || [];
        userInterests.forEach(interest => {
            if (otherUserInterests.includes(interest)) {
                score += 1.5;
                matchedInterests.push(interest);
            }
        });
        score += mutualConnectionsCount * 3;
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
            const currentUser = yield prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    profilePictureUrl: true,
                    headline: true,
                    Skills: true,
                    Interests: true,
                    college: true,
                    degree: true,
                    connections1: {
                        select: {
                            userId2: true
                        }
                    },
                    connections2: {
                        select: {
                            userId1: true
                        }
                    }
                }
            });
            console.log("current User" + currentUser);
            if (!currentUser) {
                throw new Error('User not found');
            }
            const connectedUserIds = new Set([
                ...currentUser.connections1.map(c => c.userId2),
                ...currentUser.connections2.map(c => c.userId1)
            ]);
            console.log("connected user" + connectedUserIds);
            const potentialUsers = yield prisma.user.findMany({
                where: {
                    AND: [
                        { id: { not: userId } },
                        { id: { notIn: Array.from(connectedUserIds) } }
                    ]
                },
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    profilePictureUrl: true,
                    headline: true,
                    Skills: true,
                    Interests: true,
                    college: true,
                    degree: true,
                    connections1: {
                        select: {
                            userId2: true
                        }
                    },
                    connections2: {
                        select: {
                            userId1: true
                        }
                    }
                }
            });
            console.log(potentialUsers);
            const scoredUsers = yield Promise.all(potentialUsers.map((user) => __awaiter(this, void 0, void 0, function* () {
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
                return {
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profilePictureUrl: user.profilePictureUrl,
                    headline: user.headline || [],
                    Skills: user.Skills || [],
                    Interests: user.Interests || [],
                    matchScore
                };
            })));
            return scoredUsers
                .sort((a, b) => b.matchScore.score - a.matchScore.score)
                .slice(0, limit);
        });
    }
}
exports.SuggestionService = SuggestionService;
