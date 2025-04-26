"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.setupSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const setupSocket = (server) => {
    exports.io = io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
        },
    });
    io.on("connection", (socket) => {
        console.log("New client connnected: ", socket.id);
        // Handle user joining their personal room
        socket.on("join", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their personal room`);
        });
        socket.on("message", (data) => {
            io.to(data.recieverId).emit("message", data);
        });
        socket.on("join group", (groupId) => {
            socket.join(groupId);
        });
        socket.on("groupMessage", (data) => {
            io.to(data.groupId).emit("groupMessage", data);
        });
        socket.on("disconnected", () => {
            console.log("client disconnected", socket.id);
        });
    });
    return io;
};
exports.setupSocket = setupSocket;
