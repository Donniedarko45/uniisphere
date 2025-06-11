import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import http from "http";
import path from "path";
import prisma from "./config/prisma";
//import redisManager from "./config/redis";
import { generalLimiter } from "./middlewares/rateLimiter.middleware";
import authRoutes from "./routes/auth.routes";
import blogRoutes from "./routes/blogs.routes";
import bookRoutes from "./routes/book.routes";
import connectionRoutes from "./routes/connection.routes";
import feedRoutes from "./routes/feed.routes";
import humanRoutes from "./routes/humanLib.routes";
import messageRoutes from "./routes/message.routes";
import notificationRoutes from "./routes/notification.routes";
import postRoutes from "./routes/post.routes";
import shareRoutes from "./routes/sharePost.routes";
import storyRoutes from "./routes/story.routes";
import suggestionRoutes from "./routes/suggestionRoutes";
import userRoutes from "./routes/user.routes";
import { setupHumanLibSocket } from "./services/humanLibSocket";
import { setupSocket } from "./utils/socket";

dotenv.config();

const app = express();

// Apply general rate limiting to all requests
app.use(generalLimiter);

app.use(express.json());

// CORS configuration - Fixed for Chrome/Brave compatibility
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite dev server
      "http://localhost:5175", // Alternative dev port
      "http://localhost:5174", // Alternative Vite port
      "https://main.uniisphere.in", // Production frontend (removed trailing slash)
      "http://localhost:3000", // Added back common dev port
      // Add your actual production domain here
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    credentials: false, // Fixed: Cannot use wildcard origin with credentials: true
    optionsSuccessStatus: 200, // For legacy browser support
  }),
);

// Explicitly handle preflight requests
app.options(
  "*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5175",
      "http://localhost:5174",
      "https://main.uniisphere.in",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    credentials: false,
    optionsSuccessStatus: 200,
  }),
);

//app.use(express.urlencoded({ extended: true }));

// Debug middleware for CORS requests
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    console.log(
      `CORS Preflight: ${req.method} ${req.url} from origin: ${req.headers.origin}`,
    );
  }
  next();
});

// Health check endpoint for CORS testing
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "CORS is working!",
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/human-lib", humanRoutes);
app.use("/api/suggestions", suggestionRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/shares", shareRoutes);
app.use("/api/stories", storyRoutes);

app.use("/public", express.static(path.join(__dirname, "../public")));

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, "../public/temp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const server = http.createServer(app);

const io = setupSocket(server);

const humanLibIo = setupHumanLibSocket(io);

app.set("io", io);
app.set("humanLibIo", humanLibIo);

const PORT = process.env.PORT || 8000;
const serverInstance = server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const cleanup = async () => {
  console.log("Shutting down server...");

  serverInstance.close(() => {
    console.log("HTTP server closed");
  });

  if (io) {
    io.close(() => {
      console.log("Socket.io server closed");
    });
  }
  /*
  try {
    await redisManager.disconnect();
    console.log("Redis connections closed");
  } catch (err) {
    console.error("Error during Redis disconnect:", err);
  }
*/
  try {
    await prisma.$disconnect();
    console.log("Database connections closed");
  } catch (err) {
    console.error("Error during database disconnect:", err);
  }
};

process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);

process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await cleanup();
  process.exit(1);
});

process.on("unhandledRejection", async (err) => {
  console.error("Unhandled Rejection:", err);
  await cleanup();
  process.exit(1);
});

module.exports = app;
