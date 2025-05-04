import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import http from "http";
import blogRoutes from "./routes/blogs.routes"
import { setupSocket } from "./utils/socket";
import { getProfile } from "./controllers/user.controller";
import authRoutes from "./routes/auth.routes";
import connectionRoutes from "./routes/connection.routes";
import feedRoutes from "./routes/feed.routes";
import messageRoutes from "./routes/message.routes";
import postRoutes from "./routes/post.routes";
import userRoutes from "./routes/user.routes";
import anonymousChatRoutes from "./routes/anonymousChat.routes";
import suggestionRoutes from "./routes/suggestionRoutes";
import bookRoutes from "./routes/book.routes";
import prisma from "./config/prisma";
import connectRouter from './routes/connect';

dotenv.config();
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());

const server = http.createServer(app);
const io = setupSocket(server);
// Store io instance on app for use in routes if needed
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
const serverInstance = httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use("/api", connectionRoutes);
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/users", userRoutes);
app.use("/getProfile", getProfile);
app.use("/api", feedRoutes);
app.use("/api", blogRoutes)
app.use("/api/messages", messageRoutes);
app.use("/api/anonymous", anonymousChatRoutes);
app.use("/api/suggestions", suggestionRoutes);
app.use("/api/books", bookRoutes);

app.use('/api/connect', connectRouter);

// Graceful shutdown handlers
const cleanup = async () => {
  console.log('Shutting down gracefully...');
  
  serverInstance.close(() => {
    console.log('HTTP server closed');
  });

  if (io) {
    io.close(() => {
      console.log('Socket.io server closed');
    });
  }

  try {
    await prisma.$disconnect();
    console.log('Database connections closed');
  } catch (err) {
    console.error('Error during database disconnect:', err);
  }
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err);
  await cleanup();
  process.exit(1);
});

process.on('unhandledRejection', async (err) => {
  console.error('Unhandled Rejection:', err);
  await cleanup();
  process.exit(1);
});


