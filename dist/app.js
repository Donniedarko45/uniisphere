"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("./config/prisma"));
//import redisManager from "./config/redis";
const rateLimiter_middleware_1 = require("./middlewares/rateLimiter.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const blogs_routes_1 = __importDefault(require("./routes/blogs.routes"));
const book_routes_1 = __importDefault(require("./routes/book.routes"));
const connection_routes_1 = __importDefault(require("./routes/connection.routes"));
const feed_routes_1 = __importDefault(require("./routes/feed.routes"));
const humanLib_routes_1 = __importDefault(require("./routes/humanLib.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const post_routes_1 = __importDefault(require("./routes/post.routes"));
const sharePost_routes_1 = __importDefault(require("./routes/sharePost.routes"));
const story_routes_1 = __importDefault(require("./routes/story.routes"));
const suggestionRoutes_1 = __importDefault(require("./routes/suggestionRoutes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const humanLibSocket_1 = require("./services/humanLibSocket");
const socket_1 = require("./utils/socket");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Apply general rate limiting to all requests
app.use(rateLimiter_middleware_1.generalLimiter);
app.use(express_1.default.json());
// CORS configuration - Fixed for Chrome/Brave compatibility
app.use((0, cors_1.default)({
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
}));
// Explicitly handle preflight requests
app.options('*', (0, cors_1.default)({
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
}));
app.use(express_1.default.urlencoded({ extended: true }));
// Debug middleware for CORS requests
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        console.log(`CORS Preflight: ${req.method} ${req.url} from origin: ${req.headers.origin}`);
    }
    next();
});
// Health check endpoint for CORS testing
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'CORS is working!',
        timestamp: new Date().toISOString(),
        origin: req.headers.origin
    });
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/posts", post_routes_1.default);
app.use("/api/connections", connection_routes_1.default);
app.use("/api/messages", message_routes_1.default);
app.use("/api/notifications", notification_routes_1.default);
app.use("/api/feed", feed_routes_1.default);
app.use("/api/blogs", blogs_routes_1.default);
app.use("/api/human-lib", humanLib_routes_1.default);
app.use("/api/suggestions", suggestionRoutes_1.default);
app.use("/api/books", book_routes_1.default);
app.use("/api/shares", sharePost_routes_1.default);
app.use("/api/stories", story_routes_1.default);
app.use("/public", express_1.default.static(path_1.default.join(__dirname, "../public")));
// Create upload directory if it doesn't exist
const uploadDir = path_1.default.join(__dirname, "../public/temp");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const server = http_1.default.createServer(app);
const io = (0, socket_1.setupSocket)(server);
const humanLibIo = (0, humanLibSocket_1.setupHumanLibSocket)(io);
app.set("io", io);
app.set("humanLibIo", humanLibIo);
const PORT = process.env.PORT || 8000;
const serverInstance = server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const cleanup = () => __awaiter(void 0, void 0, void 0, function* () {
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
        yield prisma_1.default.$disconnect();
        console.log("Database connections closed");
    }
    catch (err) {
        console.error("Error during database disconnect:", err);
    }
});
process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);
process.on("uncaughtException", (err) => __awaiter(void 0, void 0, void 0, function* () {
    console.error("Uncaught Exception:", err);
    yield cleanup();
    process.exit(1);
}));
process.on("unhandledRejection", (err) => __awaiter(void 0, void 0, void 0, function* () {
    console.error("Unhandled Rejection:", err);
    yield cleanup();
    process.exit(1);
}));
module.exports = app;
