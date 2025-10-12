import { connectDB } from "./db/db.js";
import dotenv from "dotenv"
import app from "./app.js";
import http from "http";
import { Server } from "socket.io";
import { registerRoomHandlers } from "./socketHandlers/room.socket.js";
import { registerMessageHandlers } from "./socketHandlers/message.sockets.js";
import { registerDrawingHandlers } from "./socketHandlers/drawing.sockets.js";

dotenv.config({
    path:"./.env"
})

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    },
});

    io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

        registerRoomHandlers(io, socket);
        registerMessageHandlers(io, socket);
        registerDrawingHandlers(io, socket);
        
    });

    connectDB()
    .then(() => {
        server.listen(process.env.PORT, () => {
        console.log(`Server running on port: ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.log(" Mongo connection error:", error);
    });

export { io };