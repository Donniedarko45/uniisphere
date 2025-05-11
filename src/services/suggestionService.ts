import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

interface SuggestionScore {
  userId: string;
  score: number;
  matchedSkills: string[];
  matchedInterests: string[];
  mutualConnections: number;
}

interface UserWithConnections {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  headline: string[];
  Skills: string[];
  Interests: string[];
  college: string | null;
  degree: string | null;
  connections1: { userId2: string }[];
  connections2: { userId1: string }[];
}

interface SuggestedUser {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  headline: string[];
  Skills: string[];
  Interests: string[];
  matchScore: SuggestionScore;
}

export class SuggestionService {
  private static calculateMatchScore(
    user: UserWithConnections,
    otherUser: UserWithConnections,
    mutualConnectionsCount: number
  ): SuggestionScore {
    let score = 0;
    const matchedSkills: string[] = [];
    const matchedInterests: string[] = [];

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

  public static async getSuggestedUsers(
    userId: string,
    limit: number = 10
  ): Promise<SuggestedUser[]> {
    const currentUser = await prisma.user.findUnique({
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
   

    console.log("current User"+currentUser);


    if (!currentUser) {
      throw new Error('User not found');
    }

    const connectedUserIds = new Set([
      ...currentUser.connections1.map(c => c.userId2),
      ...currentUser.connections2.map(c => c.userId1)
    ]);

    console.log("connected user"+connectedUserIds);


    const potentialUsers = await prisma.user.findMany({
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
  console.log(potentialUsers)
  
    const scoredUsers = await Promise.all(
      potentialUsers.map(async (user) => {

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
      })
    );

    return scoredUsers
      .sort((a, b) => b.matchScore.score - a.matchScore.score)
      .slice(0, limit);
  }
} 