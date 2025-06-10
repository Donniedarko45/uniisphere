import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import cloudinary from "../utils/cloudinary";
import prisma from "../config/prisma";

interface AuthRequest extends Request {
  userId?: string;
}

//Maximum video duration in seconds (5 minutes)
const MAX_VIDEO_DURATION = 300;
// Maximum video size in bytes (100MB)
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

// Get all blogs
export const getAllBlogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const blogs = await prisma.blogs.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

// Get single blog by ID
export const getBlogById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { id } = req.params;

    const blog = await prisma.blogs.findUnique({
      where: { id },
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

// Create new blog with enhanced video handling
export const createBlog = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { content, authorId, description, title } = req.body;

  try {
    const mediaUrls: string[] = [];

    if (!req.files || !Array.isArray(req.files)) {
      console.log("No files uploaded or invalid file format");
    } else {
      for (const file of req.files) {
        try {
          if (!file.path) {
            console.log(`No path found for file: ${file.originalname}`);
            continue;
          }
          console.log("filePath:" + file.path);

          const result = await cloudinary.uploader.upload(file.path, {
            folder: "posts",
            resource_type: "auto",
          });
          console.log("result is ", result);
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

    const blog = await prisma.blogs.create({
      data: {
        content,
        mediaUrl: mediaUrls,
        authorId,
        description,
        title,
      },
    });

    res.status(201).json({
      success: true,
      blog,
      mediaUrls,
      message: mediaUrls.length
        ? "blog created with media"
        : "blog created without media",
    });
  } catch (error) {
    console.error("Error in createBlog:", error);
    next(error);
  }
};

// Update blog
export const updateBlog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { id } = req.params;

    const existingBlog = await prisma.blogs.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const updatedBlog = await prisma.blogs.update({
      where: { id },
      //@ts-ignore
      data: validatedData,
    });

    return res.status(200).json({
      success: true,
      data: updatedBlog,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    next(error);
  }
};

// Delete blog
export const deleteBlog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { id } = req.params;

    const existingBlog = await prisma.blogs.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    await prisma.blogs.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
