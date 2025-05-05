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
const http_1 = require("http");
const http_2 = __importDefault(require("http"));
const blogs_routes_1 = __importDefault(require("./routes/blogs.routes"));
const socket_1 = require("./utils/socket");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const connection_routes_1 = __importDefault(require("./routes/connection.routes"));
const feed_routes_1 = __importDefault(require("./routes/feed.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const post_routes_1 = __importDefault(require("./routes/post.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const anonymousChat_routes_1 = __importDefault(require("./routes/anonymousChat.routes"));
const suggestionRoutes_1 = __importDefault(require("./routes/suggestionRoutes"));
const book_routes_1 = __importDefault(require("./routes/book.routes"));
const prisma_1 = __importDefault(require("./config/prisma"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN,
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use(express_1.default.json());
const server = http_2.default.createServer(app);
const io = (0, socket_1.setupSocket)(server);
// Store io instance on app for use in routes if needed
app.set('io', io);
// Simple health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).send('OK');
});
// API routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/posts", post_routes_1.default);
app.use("/api/messages", message_routes_1.default);
app.use("/api", connection_routes_1.default);
app.use("/api/anonymous", anonymousChat_routes_1.default);
app.use("/api", feed_routes_1.default);
app.use("/api", blogs_routes_1.default);
app.use("/api/books", book_routes_1.default);
app.use("/api/suggestions", suggestionRoutes_1.default);
// Start server
const PORT = process.env.PORT || 8000;
const serverInstance = httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Graceful shutdown handlers
const cleanup = () => __awaiter(void 0, void 0, void 0, function* () {
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
        yield prisma_1.default.$disconnect();
        console.log('Database connections closed');
    }
    catch (err) {
        console.error('Error during database disconnect:', err);
    }
});
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('uncaughtException', (err) => __awaiter(void 0, void 0, void 0, function* () {
    console.error('Uncaught Exception:', err);
    yield cleanup();
    process.exit(1);
}));
process.on('unhandledRejection', (err) => __awaiter(void 0, void 0, void 0, function* () {
    console.error('Unhandled Rejection:', err);
    yield cleanup();
    process.exit(1);
}));
// Export the Express app instance
module.exports = app;
