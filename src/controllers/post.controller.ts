import { Request, Response } from "express";
import prisma from "../config/prisma";

export const createPost = async (req: Request, res: Response) => {
  const userId = req.body.userId;
  const { content, mediaUrl, postType, visibility, location } = req.body;
  const post = await prisma.post.create({
    data: {
      content,
      mediaUrl,
      postType,
      visibility,
      location,
      userId,
    },
  });

  res.status(201).json(post);
};

export const updatePost = async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { content, mediaUrl, visibility } = req.body;
  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      content,
      mediaUrl,
      visibility,
    },
  });

  res.status(200).json(post);
};

export const deletePost = async (req: Request, res: Response) => {
  const { PostId } = req.params;
  await prisma.post.delete({
    where: { id: PostId },
  });

  res.status(200).json({ message: "Post deleted Successfully" });
};

export const getPost = async (req: Request, res: Response) => {
  const { PostId } = req.params;
  const post = await prisma.post.findUnique({
    where: { id: PostId },
  });
  if (!post) {
    return res.status(404).json({ message: "post not found with this id" });
  }
  res.status(200).json(post);
};

export const getUserPosts = async (req: Request, res: Response) => {
  const { UserId } = req.params;
  const posts = await prisma.post.findMany({
    where: { id: UserId },
  });

  res.status(200).json({ posts });
};
