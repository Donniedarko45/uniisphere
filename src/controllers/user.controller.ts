import { Request, Response } from "express";
import prisma from "../config/prisma";

export const updateProfile = async (req: Request, res: Response) => {
  const userId = req.body.userId;
  const { headline, location, college, bio, fullName } = req.body;
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      headline,
      location,
      college,
      bio,
      fullName,
    },
  });
  res.status(200).json({ message: "profile updated successfully", user });
};

export const getProfile = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      fullName: true,
      location: true,
      bio: true,
      college: true,
      email: true,
    },
  });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json(user);
};

export const acceptConnection = async (req: Request, res: Response) => {
  const { connectionId } = req.params;

  await prisma.connection.update({
    where: { id: connectionId },
    data: { status: "accepted" },
  });
  res.status(200).json({ message: "Connection accepted" });
};

export const declineConnection = async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  await prisma.connection.update({
    where: { id: connectionId },
    data: { status: "declined" },
  });
  res.status(200).json({ message: "Request declined" });
};

export const getConnection = async (req: Request, res: Response) => {
  const userId = req.body.userId;
  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { userId1: userId, status: "accepted" },
        { userId2: userId, status: "accepted" },
      ],
    },
    include: {
      user1: true,
      user2: true,
    },
  });
  res.status(200).json({ connections });
};

// Next task is to update the all the routes and postControllers
