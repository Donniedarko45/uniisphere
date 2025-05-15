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
exports.SuggestionController = void 0;
const suggestionService_1 = require("../services/suggestionService");
class SuggestionController {
    static getSuggestions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                const userId = req.userId;
                const limit = req.query.limit ? parseInt(req.query.limit) : 10;
                const suggestions = yield suggestionService_1.SuggestionService.getSuggestedUsers(userId, limit);
                return res.json({
                    success: true,
                    data: suggestions.map(user => ({
                        id: user.id,
                        username: user.username,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        profilePictureUrl: user.profilePictureUrl,
                        headline: user.headline,
                        matchScore: {
                            score: user.matchScore.score,
                            matchedSkills: user.matchScore.matchedSkills,
                            matchedInterests: user.matchScore.matchedInterests,
                            mutualConnections: user.matchScore.mutualConnections
                        }
                    }))
                });
            }
            catch (error) {
                console.error('Error in getSuggestions:', error);
                return res.status(500).json({
                    error: 'Internal server error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
}
exports.SuggestionController = SuggestionController;
