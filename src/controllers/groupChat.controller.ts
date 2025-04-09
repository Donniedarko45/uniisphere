import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createGroup = async (req: Request, res: Response) => {
  const { name, description, isPrivate } = req.body;
  try {
    const group = await prisma.group.create({
      data: {
        name,
        description,
        isPrivate,
      },
    });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: "failed to create a group" });
  }
};


export const sendGroupMessage = async (req: Request, res: Response) => {
  const { senderId, groupId, content } = req.body;
  try {
    const message = await prisma.groupMessage.create({
      data: {
        senderId,
        groupId,
        content,
      },
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send Message" });
  }
};
// next task deleting the group only the admin can delete the group
// privilages are given to the admin only
/*
 * task1: we have to create a group
 * task2: send group Message
 * task4:deleting the Message
 *
 */
