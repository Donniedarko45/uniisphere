import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { setupSocket } from "./utils/socket";
import authRoutes from "./routes/auth.routes";
import postRoutes from "./routes/post.routes";
import { getProfile } from "./controllers/user.controller";
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
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/getProfile", getProfile);
