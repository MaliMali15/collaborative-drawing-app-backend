import { rooms } from "../memory/rooms.memory.js";

export const registerMessageHandlers = (io, socket) => {
    console.log(`[MESSAGE] Handler initialized for socket: ${socket.id}`);

    socket.on("chat:message", ({ roomId, message, username }) => {
        try {
            // ============ INPUT VALIDATION ============
            
            // Validate roomId
            if (!roomId || typeof roomId !== 'string') {
                console.warn(`[MESSAGE] Invalid roomId from ${socket.id}:`, roomId);
                socket.emit("error", { message: "Invalid room ID" });
                return;
            }

            // Validate message
            if (!message || typeof message !== 'string') {
                console.warn(`[MESSAGE] Invalid message from ${socket.id}:`, message);
                socket.emit("error", { message: "Message must be a string" });
                return;
            }

            // Validate message is not empty
            if (message.trim().length === 0) {
                console.warn(`[MESSAGE] Empty message from ${socket.id} in room ${roomId}`);
                socket.emit("error", { message: "Message cannot be empty" });
                return;
            }

            // Validate message length (max 500 characters)
            if (message.length > 500) {
                console.warn(`[MESSAGE] Message too long from ${socket.id}`);
                socket.emit("error", { message: "Message is too long (max 500 characters)" });
                return;
            }

            // Validate username
            if (!username || typeof username !== 'string') {
                console.warn(`[MESSAGE] Invalid username from ${socket.id}:`, username);
                socket.emit("error", { message: "Invalid username" });
                return;
            }

            if (username.trim().length === 0) {
                console.warn(`[MESSAGE] Empty username from ${socket.id}`);
                socket.emit("error", { message: "Username cannot be empty" });
                return;
            }

            // ============ ROOM VALIDATION ============

            // Check if room exists
            if (!rooms[roomId]) {
                console.warn(`[MESSAGE] Room ${roomId} not found for socket ${socket.id}`);
                socket.emit("error", { message: "Room not found" });
                return;
            }

            // Check if user is in room
            if (!rooms[roomId].users[socket.id]) {
                console.warn(`[MESSAGE] Socket ${socket.id} not in room ${roomId}`);
                socket.emit("error", { message: "You are not in this room" });
                return;
            }

            // ============ INITIALIZE MESSAGES ARRAY ============

            if (!rooms[roomId].messages) {
                rooms[roomId].messages = [];
            }

            // ============ CREATE MESSAGE DATA ============

            const messageData = {
                username: username.trim(),
                message: message.trim(),
                timestamp: new Date(),
                userId: rooms[roomId].users[socket.id]?.userId,
                socketId: socket.id
            };

            // ============ STORE MESSAGE ============

            rooms[roomId].messages.push(messageData);
            console.log(`[MESSAGE] [${roomId}] ${username}: ${message}`);

            // ============ BROADCAST MESSAGE ============

            io.to(roomId).emit("chat:message", messageData);
            console.log(`[MESSAGE] Broadcasted to room ${roomId}. Total messages: ${rooms[roomId].messages.length}`);

        } catch (error) {
            console.error(`[MESSAGE] Error in chat:message:`, error.message);
            socket.emit("error", { message: "Failed to send message" });
        }
    });

    console.log(`[MESSAGE] Message handler fully registered for socket ${socket.id}`);
};