import cloudinary from "../utils/cloudinary";
import { NextFunction, Request, Response } from "express";
import { string, z } from "zod";
import fs from "fs";
import { ResourceLimits } from "worker_threads";
import prisma from "../config/prisma";
import { error } from "console";
import path from "path";

interface AuthRequest extends Request {
  userId?: string;
}


export const createStory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { caption, mediaType } = req.body;
    const userId = req.userId;

   if(!userId){
    console.log("userId is not found"+userId)
    return res.status(400).json({
      error: "userId is not found",
    });
  }
    console.log("userId!!!!!", userId);
    console.log("req.body", req.body);
  
    if (!req.file) {
      return res.status(400).json({
        error: "no media file uploaded",
      });
    }
    console.log("File details:", {
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    let mediaUrl: string;
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "stories",
        resource_type: "auto",
      });
      console.log("Cloudinary upload successful:", result.secure_url);
      mediaUrl = result.secure_url;
     // console.log(mediaUrl);
    } catch (uploadError) {
      console.error("Cloudinary upload error (continuing with local file):", uploadError);
    }

    try {
      const story = await prisma.story.create({
        data: {
          userId,
          //@ts-ignore
          mediaUrl:mediaUrl,
          type: mediaType,
          duration: 5,
          caption: caption,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      console.log("story", story);
      return res.status(201).json({ story });
    } catch (error) {
      console.error("error in creating story:", error);
      next(error)
    }
  } catch (err: any) {
    console.error("Story creation error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getStories = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const now = new Date();
    const stories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        views: {
          where: {
            viewerId: req.userId,
          },
        },
      },
    });

    const grouped = stories.reduce(
      (acc, story) => {
        const userId = story.userId;
        if (!acc[userId]) acc[userId] = { user: story.user, stories: [] };
        acc[userId].stories.push({
          ...story,
          isViewed: story.views.length > 0,
        });
        return acc;
      },
      {} as Record<string, any>,
    );

    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({
      error: "failed to fetch stories.",
    });
  }
};

export const viewStory = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  const storyId = req.params.id;
  const viewerId = req.userId;

  if (!viewerId) {
    return res.status(401).json({
      error: "Unauthorized - Viewer ID not found",
    });
  }

  try {
    const existing = await prisma.storyView.findUnique({
      where: {
        storyId_viewerId: {
          storyId,
          viewerId,
        },
      },
    });

    if (!existing) {
      await prisma.storyView.create({
        data: {
          storyId,
          viewerId,
        },
      });
    }

    res.status(200).json({ message: "Marked as viewed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark as viewed" });
  }
};

export const deleteStory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const storyId = req.params.id;
  const userId = req.userId;

  console.log('Delete Story - Params:', { storyId, userId });

  try {
    console.log('Attempting to find story:', storyId);
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    console.log('Found story:', story);

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    if (story.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this story" });
    }

    // Try to delete from Cloudinary but don't let it block the story deletion
    if (story.mediaUrl) {
      try {
        console.log('Attempting to delete from cloudinary:', story.mediaUrl);
        await cloudinary.uploader.destroy(story.mediaUrl);
        console.log('Successfully deleted from Cloudinary');
      } catch (cloudinaryError) {
        console.error('Failed to delete from Cloudinary:', cloudinaryError);
        // Continue with story deletion even if Cloudinary fails
      }
    }

    console.log('Deleting story views');
    await prisma.storyView.deleteMany({
      where: { storyId },
    });

    console.log('Deleting story');
    await prisma.story.delete({
      where: { id: storyId },
    });

    console.log('Story deleted successfully');
    res.json({ message: "Story deleted successfully" });
  } catch (err) {
    console.error('Delete story error details:', err);
    next(err);
  }
};
