"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { "default": mod };
};

Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_1 = require("./utils/socket");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const post_routes_1 = __importDefault(require("./routes/post.routes"));
const user_controller_1 = require("./controllers/user.controller");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
  origin: process.env.CORS_ORIGIN,
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
const server = http_1.default.createServer(app);
const io = (0, socket_1.setupSocket)(server); // we have to pass this to socket setup
server.listen(process.env.PORT || 5000, () => {
  console.log(`server running on port ${process.env.PORT || 5000}`);
});
app.use(express_1.default.json());
app.use("/auth", auth_routes_1.default);
app.use("/posts", post_routes_1.default);
app.use("/getProfile", user_controller_1.getProfile);
