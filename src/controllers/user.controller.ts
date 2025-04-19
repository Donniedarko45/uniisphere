import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import cloudinary from "../utils/cloudinary";
import { PrismaClient } from '@prisma/client';
/*
 *
 * we have to implement a search functionality for users where suppose there 2 data in database donniedarko and donniedarko1 when user type donniedarko it should return both the data
 *
 */

const prismaClient = new PrismaClient();

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
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        location: true,
        About: true,
        Skills: true,
        Interests: true,
        headline: true,
        profilePictureUrl: true,
        workorProject: true,
        college: true,
        degree: true,
        email: true,
        connections1: true,
        connections2: true,
        _count: {
          select: {
            connections1: true,
            connections2: true
          }
        }
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




export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const userId = req.body.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      username,
      firstName,
      lastName,
      PhoneNumber,
      location,
      college,
      headline,
      Gender,
      Skills,
      Interests,
      About,
      degree,
      workorProject,
      startYear,
      endYear,
      profilePictureBase64,
    } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (username && username !== existingUser.username) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          error: "Username must be 3-30 characters long and can only contain letters, numbers, and underscores",
        });
      }

      const usernameExists = await prisma.user.findUnique({
        where: { username },
      });

      if (usernameExists && usernameExists.id !== userId) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    let profilePictureUrl = existingUser.profilePictureUrl || "";

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "profile_pictures",
          transformation: [
            { width: 500, height: 500, crop: "fill" },
            { quality: "auto" }
          ]
        });
        profilePictureUrl = result.secure_url;

        await prisma.cloudinaryMedia.create({
          data: {
            publicId: result.public_id,
            url: result.secure_url,
            resourceType: 'image',
            userId
          }
        });
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        return res.status(400).json({ error: "Failed to upload profile picture" });
      }
    } else if (profilePictureBase64) {
      try {
        const result = await cloudinary.uploader.upload(profilePictureBase64, {
          folder: "profile_pictures",
          transformation: [
            { width: 500, height: 500, crop: "fill" },
            { quality: "auto" }
          ]
        });

        profilePictureUrl = result.secure_url;

        await prisma.cloudinaryMedia.create({
          data: {
            publicId: result.public_id,
            url: result.secure_url,
            resourceType: 'image',
            userId
          }
        });
      } catch (error) {
        console.error("Error uploading base64 image:", error);
        console.error("Base64 string length:", profilePictureBase64?.length);
        console.error("Base64 string preview:", profilePictureBase64?.substring(0, 50));
        return res.status(400).json({ error: "Failed to upload profile picture" });
      }
    }

    const updateData: any = {};

    if (username !== undefined) updateData.username = username;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (PhoneNumber !== undefined) updateData.PhoneNumber = PhoneNumber;
    if (location !== undefined) updateData.location = location;
    if (About !== undefined) updateData.About = About;
    if (headline !== undefined) updateData.headline = headline;
    if (Gender !== undefined) updateData.Gender = Gender;
    if (workorProject !== undefined) updateData.workorProject = workorProject;
    if (college !== undefined) updateData.college = college;
    if (degree !== undefined) updateData.degree = degree;
    if (startYear !== undefined) updateData.startYear = startYear;
    if (endYear !== undefined) updateData.endYear = endYear;

    // Arrays require special handling
    if (Skills !== undefined) updateData.Skills = Skills;
    if (Interests !== undefined) updateData.Interests = Interests;

    // Check if profilePictureBase64 was provided at all (even if it's empty)
    if ('profilePictureBase64' in req.body || req.file) {
      updateData.profilePictureUrl = profilePictureUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        PhoneNumber: true,
        profilePictureUrl: true,
        headline: true,
        location: true,
        Gender: true,
        Skills: true,
        Interests: true,
        workorProject: true,
        About: true,
        college: true,
        degree: true,
        startYear: true,
        endYear: true,
        createdAt: true,
        updatedAt: true,
        verified: true
      }
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    return next(error);
  }
};


export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const allUsers = await prisma.user.findMany();
    res.status(200).json(allUsers);
  } catch (error) {
    next(error); // pass the error to the Express error handler
  }
};

export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  const { userId, status, isOnline } = req.body;

  try {
    const user = await prismaClient.user.update({
      where: { id: userId },
      data: {
        status,
        isOnline
      }
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

