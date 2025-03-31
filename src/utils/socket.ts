import { Server, Socket } from "socket.io";

let io: Server;

export const setupSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });
  io.on("connection", (socket: Socket) => {
    console.log("New client connnected: ", socket.id);

    // Handle user joining their personal room
    socket.on("join", (userId: string) => {
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

export { io };
