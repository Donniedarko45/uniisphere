import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import http from "http";
import { setupSocket } from "./utils/socket";
import { getProfile } from "./controllers/user.controller";
import authRoutes from "./routes/auth.routes";
import connectionRoutes from "./routes/connection.routes";
import feedRoutes from "./routes/feed.routes";
import messageRoutes from "./routes/message.routes";
import postRoutes from "./routes/post.routes";
import userRoutes from "./routes/user.routes";
import anonymousChatRoutes from "./routes/anonymousChat.routes";
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
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use("/api", connectionRoutes);
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/users", userRoutes);
app.use("/getProfile", getProfile);
app.use("/api", feedRoutes);
app.use("/api/messages", messageRoutes);
app.use("api/anonymous", anonymousChatRoutes);
