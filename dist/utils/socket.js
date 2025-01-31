"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
const socket_io_1 = require("socket.io");
const setupSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
        },
    });
    io.on("connection", (socket) => {
        console.log("New client connnected: ", socket.id);
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
