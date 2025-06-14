import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import cloudinary from "../utils/cloudinary";
import { PrismaClient } from "@prisma/client";
import { transferableAbortController } from "util";

/*
 *
 we have to implement a search functionality for users where suppose there 2 data in database donniedarko and donniedarko1 when user type donniedarko it should return both the data
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
    const requestingUserId = req.body.userId; // The user making the request

    if (!userId && !search) {
      return res
        .status(400)
        .json({ message: "Either userId or search term is required" });
    }

    // First get the user(s) based on search or userId
    const users = await prisma.user.findMany({
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
        Gender: true,
        PhoneNumber: true,
        location: true,
        About: true,
        Skills: true,
        Interests: true,
        headline: true,
        class10Board: true,
        class12Board: true,
        profilePictureUrl: true,
        workorProject: true,
        college: true,
        degree: true,
        email: true,
        connections1: true,
        connections2: true,
        experiences: true, // Added experience data
        _count: {
          select: {
            connections1: true,
            connections2: true,
          },
        },
      },
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // For each user, check if they are connected with the requesting user
    const processedUsers = await Promise.all(
      users.map(async (user) => {
        // Skip connection check if it's the same user
        if (user.id === requestingUserId) {
          return {
            ...user,
            isConnected: true,
            isOwnProfile: true,
          };
        }

        const connection = await prisma.connection.findFirst({
          where: {
            OR: [
              {
                userId1: requestingUserId,
                userId2: user.id,
                status: "accepted",
              },
              {
                userId1: user.id,
                userId2: requestingUserId,
                status: "accepted",
              },
            ],
          },
        });

        const isConnected = !!connection;

        // If not connected, return limited profile information
        if (!isConnected) {
          return {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            headline: user.headline,
            workorProject: user.workorProject,
            email: user.email,
            Skills: user.Skills,
            Interests: user.Interests,
            About: user.About,
            experiences: user.experiences,
            class10Board: user.class10Board,
            class12Board: user.class12Board,
            profilePictureUrl: user.profilePictureUrl,
            college: user.college,
            degree: user.degree,
            location: user.location,
            _count: user._count,
            isConnected: false,
            isOwnProfile: false,
          };
        }
        // If connected, return full profile information
        return {
          ...user,
          isConnected: true,
          isOwnProfile: false,
        };
      }),
    );

    res.status(200).json(processedUsers);
  } catch (err) {
    console.error(next(err));
  }
};

export const updateProfile = async (
  req: Request & { userId?: string },
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const userId = req.userId; // Get userId from auth middleware instead of request body

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
      class10Board,
      class12Board,
      profilePictureBase64,
      experiences,
    } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        experiences: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (username && username !== existingUser.username) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          error:
            "Username must be 3-30 characters long and can only contain letters, numbers, and underscores",
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
            { quality: "auto" },
          ],
        });
        profilePictureUrl = result.secure_url;

        await prisma.cloudinaryMedia.create({
          data: {
            publicId: result.public_id,
            url: result.secure_url,
            resourceType: "image",
            userId,
          },
        });
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        return res
          .status(400)
          .json({ error: "Failed to upload profile picture" });
      }
    } else if (profilePictureBase64) {
      try {
        const result = await cloudinary.uploader.upload(profilePictureBase64, {
          folder: "profile_pictures",
          transformation: [
            { width: 500, height: 500, crop: "fill" },
            { quality: "auto" },
          ],
        });

        profilePictureUrl = result.secure_url;

        await prisma.cloudinaryMedia.create({
          data: {
            publicId: result.public_id,
            url: result.secure_url,
            resourceType: "image",
            userId,
          },
        });
      } catch (error) {
        console.error("Error uploading base64 image:", error);
        console.error("Base64 string length:", profilePictureBase64?.length);
        console.error(
          "Base64 string preview:",
          profilePictureBase64?.substring(0, 50),
        );
        return res
          .status(400)
          .json({ error: "Failed to upload profile picture" });
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
    if (class10Board !== undefined) updateData.class10Board = class10Board;
    if (class12Board !== undefined) updateData.class12Board = class12Board;
    if (college !== undefined) updateData.college = college;
    if (degree !== undefined) updateData.degree = degree;
    if (startYear !== undefined) updateData.startYear = startYear;
    if (endYear !== undefined) updateData.endYear = endYear;

    // Arrays require special handling
    if (Skills !== undefined) updateData.Skills = Skills;
    if (Interests !== undefined) updateData.Interests = Interests;

    // Check if profilePictureBase64 was provided at all (even if it's empty)
    if ("profilePictureBase64" in req.body || req.file) {
      updateData.profilePictureUrl = profilePictureUrl;
    }

    // Handle experiences update if provided
    if (experiences) {
      // Delete removed experiences
      const experienceIds = experiences
        .filter((exp: any) => exp.id)
        .map((exp: any) => exp.id);

      await prisma.experience.deleteMany({
        where: {
          userId: userId,
          id: { notIn: experienceIds },
        },
      });

      // Update or create experiences
      const experiencePromises = experiences.map(
        async (exp: {
          id?: string;
          title: string;
          organizationName: string;
          location: string;
          locationType: string;
          description: string;
        }) => {
          if (exp.id) {
            // Update existing experience
            return prisma.experience.update({
              where: { id: exp.id },
              data: {
                title: exp.title,
                organizationName: exp.organizationName,
                location: exp.location,
                locationType: exp.locationType,
                description: exp.description,
              },
            });
          } else {
            // Create new experience
            return prisma.experience.create({
              data: {
                title: exp.title,
                organizationName: exp.organizationName,
                location: exp.location,
                locationType: exp.locationType,
                description: exp.description,
                userId: userId,
              },
            });
          }
        },
      );

      await Promise.all(experiencePromises);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        experiences: true,
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const allUsers = await prisma.user.findMany();
    res.status(200).json(allUsers);
  } catch (error) {
    next(error); // pass the error to the Express error handler
  }
};

export const updateUserStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userId, status, isOnline } = req.body;

  try {
    const user = await prismaClient.user.update({
      where: { id: userId },
      data: {
        status,
        isOnline,
      },
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

export const getTotalUsersExcludingExistingConnections = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { userId } = req.body;
    const { search } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all connections (both accepted and pending) where user is either userId1 or userId2
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { userId1: userId },
          { userId2: userId }
        ]
      },
    });

    // Get all connected user IDs (only for accepted connections)
    const connectedUserIds = connections
      .filter(connection => connection.status === "accepted")
      .map(connection => 
        connection.userId1 === userId ? connection.userId2 : connection.userId1
      );

    // Add the requesting user's ID to exclude them from results
    connectedUserIds.push(userId);

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { notIn: connectedUserIds } },
          search ? {
            OR: [
              { username: { contains: search as string, mode: 'insensitive' } },
              { firstName: { contains: search as string, mode: 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' } }
            ]
          } : {}
        ]
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        headline: true,
        profilePictureUrl: true,
        location: true,
        college: true,
        degree: true
      }
    });

    // Add connection status to each user
    const usersWithConnectionStatus = await Promise.all(
      users.map(async (user) => {
        const pendingConnection = connections.find(
          connection => 
            (connection.userId1 === userId && connection.userId2 === user.id) ||
            (connection.userId1 === user.id && connection.userId2 === userId)
        );

        return {
          ...user,
          connectionStatus: pendingConnection ? {
            status: pendingConnection.status,
            isSender: pendingConnection.userId1 === userId
          } : null
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: usersWithConnectionStatus,
    });
  } catch (error) {
    console.error("Error in getTotalUsersExcludingExistingConnections:", error);
    next(error);
  }
};
