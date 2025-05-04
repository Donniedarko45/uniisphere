import { Request, Response } from 'express';
import prisma from '../config/prisma';


export async function getIntro(req: Request, res: Response) {
  try {
    const current = await prisma.user.findFirst();               // or use auth context
    const suggestions = await prisma.user.findMany({ take: 6 }); // customize filter
    res.json({ current, suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load suggestions' });
  }
}

export async function getLoading(req: Request, res: Response) {
  try {
    const count = await prisma.user.count();
    const randomIndex = Math.floor(Math.random() * count);
    const [match] = await prisma.user.findMany({ skip: randomIndex, take: 1 });
    res.json({ match });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to find a match' });
  }
}