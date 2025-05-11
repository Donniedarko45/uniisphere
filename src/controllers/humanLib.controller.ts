/*
nickname --> user will enter his name backend will marked his status to online than other user will do the same enter his nickname it will marks it to online and 
in message it will show his  nickname and user will start to  chat 
*/

import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getOnlineUsers = async (req: Request, res: Response): Promise<any> => {
  const onlineUsers = await prisma.user.findMany({
    where: { isOnline: true },
    select: {
      id: true,
      humanLibSent: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { nickname: true },
      },
    },
  });

  const result = onlineUsers.map((u) => ({
    id: u.id,
    nickname: u.humanLibSent?.[0]?.nickname || 'Anonymous',
  }));

  res.json(result);
};
