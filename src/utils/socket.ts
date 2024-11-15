import { Server, Socket } from "socket.io";

export const setupSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });
  io.on("connection", (socket: Socket) => {
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
