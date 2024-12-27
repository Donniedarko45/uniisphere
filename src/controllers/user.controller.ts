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
