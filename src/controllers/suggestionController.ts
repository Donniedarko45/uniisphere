import { Request, Response } from 'express';
import { SuggestionService } from '../services/suggestionService';

interface AuthRequest extends Request {
  userId?: string;
}

export class SuggestionController {
  public static async getSuggestions(req: AuthRequest, res: Response): Promise<any> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = req.userId;

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const suggestions = await SuggestionService.getSuggestedUsers(userId as string, limit);

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
    } catch (error) {
      console.error('Error in getSuggestions:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 
