import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import cloudinary from '../utils/cloudinary';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const createStory = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { mediaUrl, type = 'image', duration = 8 } = req.body;

    if (!userId) {
      throw new ApiError(401, 'Unauthorized - User not authenticated');
    }

    let finalMediaUrl = '';

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "stories",
          resource_type: "auto", 
          transformation: type === 'video' ? [] : [
            { width: 1080, height: 1920, crop: "fill" }, 
            { quality: "auto" }
          ]
        });
        
        finalMediaUrl = result.secure_url;

        await prisma.cloudinaryMedia.create({
          data: {
            publicId: result.public_id,
            url: result.secure_url,
            resourceType: type,
            userId
          }
        });
      } catch (error) {
        console.error("Error uploading story media:", error);
        throw new ApiError(400, 'Failed to upload story media');
      }
    } else if (mediaUrl) {
      finalMediaUrl = mediaUrl;
    } else {
      throw new ApiError(400, 'Either upload a file or provide a media URL');
    }

    const story = await prisma.story.create({
      data: {
        userId,
        mediaUrl: finalMediaUrl,
        type,
        duration,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) 
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true
          }
        }
      }
    });

    await prisma.userActivity.create({
      data: {
        userId,
        activityType: 'CREATE_STORY',
        targetId: story.id
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: story
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getStories = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, 'Unauthorized - User not authenticated');
    }

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { userId1: userId },
          { userId2: userId }
        ],
        status: 'accepted'
      }
    });

    const connectedUserIds = connections.map(conn =>
      conn.userId1 === userId ? conn.userId2 : conn.userId1
    );

    const stories = await prisma.story.findMany({
      where: {
        userId: {
          in: [...connectedUserIds, userId]
        },
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true
          }
        },
        views: {
          select: {
            userId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const groupedStories = stories.reduce((acc: any, story) => {
      const userId = story.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: []
        };
      }
      acc[userId].stories.push(story);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: Object.values(groupedStories)
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const viewStory = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { storyId } = req.params;

    if (!userId) {
      throw new ApiError(401, 'Unauthorized - User not authenticated');
    }

    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!story) {
      throw new ApiError(404, 'Story not found or has expired');
    }

    const existingView = await prisma.storyView.findFirst({
      where: {
        storyId,
        userId
      }
    });

    if (!existingView) {
      await prisma.storyView.create({
        data: {
          storyId,
          userId
        }
      });

      await prisma.userActivity.create({
        data: {
          userId,
          activityType: 'VIEW_STORY',
          targetId: storyId
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Story viewed successfully'
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteStory = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { storyId } = req.params;

    if (!userId) {
      throw new ApiError(401, 'Unauthorized - User not authenticated');
    }

    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        userId
      }
    });

    if (!story) {
      throw new ApiError(404, 'Story not found or unauthorized');
    }

    await prisma.story.delete({
      where: {
        id: storyId
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
