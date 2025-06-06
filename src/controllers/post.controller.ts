import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import cloudinary from "../utils/cloudinary";
import { any } from "zod";

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  const { content, userId, visibility, tags, location } = req.body;

  try {
    const mediaUrls: string[] = [];

    // Check if files exist in the request
    if (!req.files || !Array.isArray(req.files)) {
      console.log('No files uploaded or invalid file format');
    } else {
      // Handle file uploads
      for (const file of req.files) {
        try {
          // Check if file path exists
          if (!file.path) {
            console.log(`No path found for file: ${file.originalname}`);
            continue;
          }

          const result = await cloudinary.uploader.upload(file.path, {
            folder: "posts",
            resource_type: "auto",
          });

          if (result && result.secure_url) {
            mediaUrls.push(result.secure_url);
          } else {
            console.log(`Failed to upload file: ${file.originalname}`);
          }
        } catch (uploadError) {
          console.error(`Error uploading file ${file.originalname}:`, uploadError);
        }
      }
    }

    // Create post even if some files failed to upload
    const post = await prisma.post.create({
      data: {
        content,
        mediaUrl: mediaUrls,
        userId,
        visibility,
        //@ts-ignore
        tags : tags ? tags.split(",").map(tag => tag.trim()) : [],
        location,
      },
      include: {
        user: {
          select: {
            username: true,
            profilePictureUrl: true,
          }
        },
        _count: {
          select: {
            Likes: true,
            Comments: true,
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      post,
      mediaUrls,
      message: mediaUrls.length ? 'Post created with media' : 'Post created without media'
    });

  } catch (error) {
    console.error('Error in createPost:', error);
    next(error);
  }
};

export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { postId } = req.params;
    const { content, mediaUrl, visibility } = req.body;
    const post = await prisma.post.update({
      where: { id: postId },
      data: { content, mediaUrl, visibility },
    });
    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { postId } = req.params;
    const userId = (req as any).userId;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    if (post.userId !== userId) {
      return res.status(403).json({
        message: "You don't have permission to delete this post"
      });
    }

    await prisma.$transaction([
      prisma.likes.deleteMany({
        where: { postId }
      }),
      prisma.comments.deleteMany({
        where: { postId }
      }),
      prisma.share.deleteMany({
        where: { postId }
      }),

      //after deleting all the data related to the post, delete the post
      prisma.post.delete({
        where: { id: postId }
      })
    ]);

    res.status(200).json({
      message: "Post and associated data deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    next(error);
  }
};

export const getPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { postId } = req.params;
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

export const getUserPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { userId } = req.params;
  try {
    const posts = await prisma.post.findMany({
      where: { userId },
    });
    res.status(200).json({ posts });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = (req as any).userId;

    const comment = await prisma.comments.create({
      data: {
        content,
        userId,
        postId,
      },
      include: {
        user: {
          select: {
            username: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

export const likePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { postId } = req.params;
    const userId = (req as any).userId;

    const like = await prisma.likes.create({
      data: {
        userId,
        postId,
      },
    });

    res.status(201).json(like);
  } catch (error) {
    next(error);
  }
};

export const unlikePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { postId } = req.params;
    const userId = (req as any).userId;

    await prisma.likes.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    res.status(200).json({ message: "Post unliked successfully" });
  } catch (error) {
    next(error);
  }
};

export const getTotalPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).userId as string;

    const totalPosts = await prisma.post.findMany({
      where: {
        userId,
      },
      select: {
        content: true,
        mediaUrl: true,
        user: true,
        _count: {
          select: {
            Likes: true,
            Comments: true,
          },
        },
      },
    });

    res.status(200).json({ totalPosts });
  } catch (error) {
    next(error);
  }
};
