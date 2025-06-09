import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { uploadBlogMedia } from "../services/cloudinaryService";

const prisma = new PrismaClient();

// Helper function to validate video URLs
const isValidVideoUrl = (url: string): boolean => {
  const videoUrlPatterns = [
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i,  // YouTube
    /^https?:\/\/(www\.)?vimeo\.com\/.+/i,               // Vimeo
    /^https?:\/\/(www\.)?dailymotion\.com\/.+/i,         // Dailymotion
    /\.mp4(\?.*)?$/i,                                    // Direct MP4 links
    /\.webm(\?.*)?$/i,                                   // WebM videos
  ];
  return videoUrlPatterns.some(pattern => pattern.test(url));
};

// Helper function to handle file uploads
const handleFileUploads = async (files: Express.Multer.File[]) => {
  const uploadResults = await Promise.all(
    files.map(async (file) => {
      const result = await uploadBlogMedia(file);
      return {
        url: result.url,
        type: result.resourceType,
        publicId: result.publicId
      };
    })
  );

  return uploadResults.reduce((acc, result) => {
    if (result.type === 'video') {
      acc.videos.push(result.url);
    } else {
      acc.images.push(result.url);
    }
    return acc;
  }, { images: [] as string[], videos: [] as string[] });
};

// Validation schema for blog creation and updates
const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  titlePhoto: z.string().optional(),
  contentVideo: z.array(z.string().refine(
    url => isValidVideoUrl(url),
    { message: "Invalid video URL format. Supported platforms: YouTube, Vimeo, Dailymotion, or direct MP4/WebM links" }
  )).optional(),
  mediaUrl: z.array(z.string()).optional(),
  authorId: z.string().min(1, "Author ID is required"),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional()
});

// Get all blogs
export const getAllBlogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const blogs = await prisma.blogs.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return res.status(200).json({
      success: true,
      data: blogs
    });
  } catch (error) {
    next(error);
  }
};

// Get single blog by ID
export const getBlogById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { id } = req.params;
    
    const blog = await prisma.blogs.findUnique({
      where: { id }
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    next(error);
  }
};

// Create new blog
export const createBlog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const validatedData = blogSchema.parse(req.body);
    
    const blog = await prisma.blogs.create({
      data: {
        ...validatedData,
        published: validatedData.published ?? false
      },
      include: {
        author: true
      }
    });

    return res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }
    next(error);
  }
};

// Update blog
export const updateBlog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { id } = req.params;
    const validatedData = blogSchema.partial().parse(req.body);
    
    const existingBlog = await prisma.blogs.findUnique({
      where: { id }
    });

    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }

    const updatedBlog = await prisma.blogs.update({
      where: { id },
      data: validatedData
    });

    return res.status(200).json({
      success: true,
      data: updatedBlog
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors
      });
    }
    next(error);
  }
};

// Delete blog
export const deleteBlog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { id } = req.params;
    
    const existingBlog = await prisma.blogs.findUnique({
      where: { id }
    });

    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }

    await prisma.blogs.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
