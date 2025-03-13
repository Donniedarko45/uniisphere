import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { getProfile } from "./controllers/user.controller";
import authRoutes from "./routes/auth.routes";
import connectionRoutes from "./routes/connection.routes";
import feedRoutes from "./routes/feed.routes";
import postRoutes from "./routes/post.routes";
import { setupSocket } from "./utils/socket";
dotenv.config();
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

const server = http.createServer(app);
const io = setupSocket(server); // we have to pass this to socket setup
server.listen(process.env.PORT || 5000, () => {
  console.log(`server running on port ${process.env.PORT || 5000}`);
});
app.use(express.json());
app.use("/api",connectionRoutes);
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/getProfile", getProfile);
app.use("/api", feedRoutes); // Mount feed routes under /api prefix
