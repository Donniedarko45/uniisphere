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
  next: NextFunction
): Promise<void> => {
  const { userId } = req.query;
  try {
    console.log(`[getUserPosts] Searching for posts with userId: ${userId}`);
    
    if (!userId || typeof userId !== 'string') {
      console.log('[getUserPosts] Invalid userId provided:', userId);
      res.status(400).json({ message: "UserId is required as a query parameter" });
      return;
    }

    // First check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log(`[getUserPosts] User not found with id: ${userId}`);
      res.status(404).json({ message: "User not found" });
      return;
    }

    console.log(`[getUserPosts] Found user:`, {
      userId: user.id,
      username: user.username
    });

    const posts = await prisma.post.findMany({
      where: { userId },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`[getUserPosts] Query results:`, {
      postsFound: posts.length,
      posts: posts.map(post => ({
        id: post.id,
        content: post.content?.substring(0, 50), // First 50 chars of content for logging
        createdAt: post.createdAt
      }))
    });

    if (posts.length === 0) {
      res.status(200).json({ 
        message: "No posts found for this user",
        posts: [] 
      });
      return;
    }

    res.status(200).json({ posts });
  } catch (error) {
    console.error('[getUserPosts] Error fetching posts:', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
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


export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { commentId } = req.params; 
    const userId = (req as any).userId;

    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to delete this comment" });
    }

    await prisma.comments.delete({
      where: { id: commentId },
    });

    res.status(200).json({ message: "Comment deleted successfully" });
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
          }
        }
      },
    });

    res.status(200).json({ totalPosts });
  } catch (error) {
    next(error);
  }
};

export const getPostLikes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { postId } = req.params;

    // First check if the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Get all likes for the post with user information
    const likes = await prisma.likes.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Most recent likes first
      },
    });

    // Extract user information from likes
    const likedUsers = likes.map(like => ({
      id: like.user.id,
      username: like.user.username,
      profilePictureUrl: like.user.profilePictureUrl,
      firstName: like.user.firstName,
      lastName: like.user.lastName,
      fullName: `${like.user.firstName || ''} ${like.user.lastName || ''}`.trim(),
      likedAt: like.createdAt,
    }));

    res.status(200).json({
      success: true,
      postId,
      totalLikes: likes.length,
      likedBy: likedUsers,
    });
  } catch (error) {
    console.error("Error getting post likes:", error);
    next(error);
  }
};
