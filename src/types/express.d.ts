import { Prisma } from '@prisma/client';

declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: string;
        email: string;
        username?: string;
        [key: string]: any;
      };
    }
  }
} 