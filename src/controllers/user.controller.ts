import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.body.userId;
    const { headline, location, college, bio, firstName, lastName } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        headline,
        location,
        college,
        bio,
        firstName,
        lastName,
      },
    });
    res.status(200).json({ message: "profile updated successfully", user });
  } catch (err) {
    next(err);
  }
};

/*
 *
 * we have to implement a search functionality for users where suppose there 2 data in database donniedarko and donniedarko1 when user type donniedarko it should return both the data
 *
 */

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { userId } = req.query;
    const { search } = req.query;
    if (!userId && !search) {
      return res
        .status(400)
        .json({ message: "Either userId or search term is required" });
    }
    const user = await prisma.user.findMany({
      where: {
        OR: [
          { id: userId as string },
          {
            username: {
              contains: search as string,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        username: true,
        firstName: true,
        lastName: true,
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
  } catch (err) {
    console.error(next(err));
  }
};
