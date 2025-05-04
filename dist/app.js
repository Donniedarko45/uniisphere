"use strict";
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
const user_controller_1 = require("./controllers/user.controller");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const connection_routes_1 = __importDefault(require("./routes/connection.routes"));
const feed_routes_1 = __importDefault(require("./routes/feed.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const post_routes_1 = __importDefault(require("./routes/post.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const anonymousChat_routes_1 = __importDefault(require("./routes/anonymousChat.routes"));
const suggestionRoutes_1 = __importDefault(require("./routes/suggestionRoutes"));
const book_routes_1 = __importDefault(require("./routes/book.routes"));
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
// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
app.use("/api", connection_routes_1.default);
app.use("/auth", auth_routes_1.default);
app.use("/posts", post_routes_1.default);
app.use("/users", user_routes_1.default);
app.use("/getProfile", user_controller_1.getProfile);
app.use("/api", feed_routes_1.default);
app.use("/api", blogs_routes_1.default);
app.use("/api/messages", message_routes_1.default);
app.use("/api/anonymous", anonymousChat_routes_1.default);
app.use("/api/suggestions", suggestionRoutes_1.default);
app.use("/api/books", book_routes_1.default);
