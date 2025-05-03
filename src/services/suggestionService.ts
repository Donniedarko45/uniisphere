import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

interface SuggestionScore {
  userId: string;
  score: number;
  matchedSkills: string[];
  matchedInterests: string[];
  mutualConnections: number;
}

export class SuggestionService {
  private static calculateMatchScore(
    user: User,
    otherUser: User,
    mutualConnectionsCount: number
  ): SuggestionScore {
    let score = 0;
    const matchedSkills: string[] = [];
    const matchedInterests: string[] = [];

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

  public static async getSuggestedUsers(
    userId: string,
    limit: number = 10
  ): Promise<Array<User & { matchScore: SuggestionScore }>> {
    // Get the current user
    const currentUser = await prisma.user.findUnique({
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
    const potentialUsers = await prisma.user.findMany({
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
    const scoredUsers = await Promise.all(
      potentialUsers.map(async (user) => {
        // Calculate mutual connections
        const mutualConnections = await prisma.connection.count({
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
          ...user,
          matchScore
        };
      })
    );

    // Sort by score and return top suggestions
    return scoredUsers
      .sort((a, b) => b.matchScore.score - a.matchScore.score)
      .slice(0, limit);
  }
} 