import { rooms } from "../memory/rooms.memory.js";

export const registerRoomHandlers = (io, socket) => {
    console.log(`[ROOM] New socket connected: ${socket.id}`);

    // ============ ROOM JOIN ============
    socket.on("room:join", ({ roomId, userId, username }) => {
        try {
            // ============ INPUT VALIDATION ============

            // Validate roomId
            if (!roomId || typeof roomId !== 'string') {
                console.warn(`[ROOM] Invalid roomId from ${socket.id}:`, roomId);
                socket.emit("error", { message: "Invalid room ID" });
                return;
            }

            // Validate userId
            if (!userId || typeof userId !== 'number') {
                console.warn(`[ROOM] Invalid userId from ${socket.id}:`, userId);
                socket.emit("error", { message: "Invalid user ID" });
                return;
            }

            // Validate username
            if (!username || typeof username !== 'string') {
                console.warn(`[ROOM] Invalid username from ${socket.id}:`, username);
                socket.emit("error", { message: "Invalid username" });
                return;
            }

            if (username.trim().length === 0) {
                console.warn(`[ROOM] Empty username from ${socket.id}`);
                socket.emit("error", { message: "Username cannot be empty" });
                return;
            }

            // ============ CREATE ROOM IF DOESN'T EXIST ============

            if (!rooms[roomId]) {
                rooms[roomId] = {
                    users: {},
                    messages: [],
                    drawingData: [],
                    createdAt: new Date()
                };
                console.log(`[ROOM] New room created: ${roomId}`);
            }

            // ============ CHECK IF USER ALREADY IN ROOM ============

            if (rooms[roomId].users[socket.id]) {
                console.warn(`[ROOM] Socket ${socket.id} already in room ${roomId}`);
                socket.emit("error", { message: "You are already in this room" });
                return;
            }

            // ============ ADD USER TO ROOM ============

            rooms[roomId].users[socket.id] = {
                userId,
                username: username.trim(),
                joinedAt: new Date()
            };

            socket.join(roomId);

            console.log(`[ROOM] User ${username} (ID: ${userId}) joined room ${roomId}`);
            console.log(`[ROOM] Total users in ${roomId}: ${Object.keys(rooms[roomId].users).length}`);

            // ============ BROADCAST JOIN EVENT ============

            io.to(roomId).emit("room:userJoined", {
                userId,
                username: username.trim(),
                userCount: Object.keys(rooms[roomId].users).length
            });

        } catch (error) {
            console.error(`[ROOM] Error in room:join:`, error.message);
            socket.emit("error", { message: "Failed to join room" });
        }
    });

    // ============ ROOM LEAVE ============
    socket.on("room:leave", ({ roomId }) => {
        try {
            // ============ INPUT VALIDATION ============

            if (!roomId || typeof roomId !== 'string') {
                console.warn(`[ROOM] Invalid roomId from ${socket.id}:`, roomId);
                socket.emit("error", { message: "Invalid room ID" });
                return;
            }

            // ============ ROOM EXISTENCE CHECK ============

            if (!rooms[roomId]) {
                console.warn(`[ROOM] Room ${roomId} not found for socket ${socket.id}`);
                socket.emit("error", { message: "Room not found" });
                return;
            }

            // ============ CHECK IF USER IN ROOM ============

            if (!rooms[roomId].users[socket.id]) {
                console.warn(`[ROOM] Socket ${socket.id} not in room ${roomId}`);
                socket.emit("error", { message: "You are not in this room" });
                return;
            }

            // ============ REMOVE USER FROM ROOM ============

            const user = rooms[roomId].users[socket.id];
            delete rooms[roomId].users[socket.id];
            socket.leave(roomId);

            console.log(`[ROOM] User ${user.username} (ID: ${user.userId}) left room ${roomId}`);

            // ============ BROADCAST LEAVE EVENT ============

            io.to(roomId).emit("room:userLeft", {
                userId: user.userId,
                username: user.username,
                userCount: Object.keys(rooms[roomId].users).length
            });

            // ============ CLEANUP EMPTY ROOM ============

            if (Object.keys(rooms[roomId].users).length === 0) {
                const messageCount = rooms[roomId].messages?.length || 0;
                const drawingCount = rooms[roomId].drawingData?.length || 0;
                
                delete rooms[roomId];
                
                console.log(`[ROOM] Room ${roomId} deleted (empty). Had ${messageCount} messages and ${drawingCount} drawing strokes`);
            }

        } catch (error) {
            console.error(`[ROOM] Error in room:leave:`, error.message);
            socket.emit("error", { message: "Failed to leave room" });
        }
    });

    // ============ DISCONNECT ============
    socket.on("disconnect", () => {
        try {
            console.log(`[ROOM] Socket ${socket.id} disconnecting...`);

            let roomsAffected = 0;
            let usersCleanedUp = 0;

            // ============ FIND & REMOVE USER FROM ALL ROOMS ============

            for (const roomId in rooms) {
                if (rooms[roomId].users[socket.id]) {
                    const user = rooms[roomId].users[socket.id];
                    
                    delete rooms[roomId].users[socket.id];
                    usersCleanedUp++;
                    roomsAffected++;

                    console.log(`[ROOM] User ${user.username} removed from room ${roomId} due to disconnect`);

                    // ============ NOTIFY OTHERS ============

                    io.to(roomId).emit("room:userLeft", {
                        userId: user.userId,
                        username: user.username,
                        userCount: Object.keys(rooms[roomId].users).length
                    });

                    // ============ CLEANUP EMPTY ROOM ============

                    if (Object.keys(rooms[roomId].users).length === 0) {
                        const messageCount = rooms[roomId].messages?.length || 0;
                        const drawingCount = rooms[roomId].drawingData?.length || 0;
                        
                        delete rooms[roomId];
                        
                        console.log(`[ROOM] Room ${roomId} deleted (empty after disconnect). Had ${messageCount} messages and ${drawingCount} drawing strokes`);
                    }
                }
            }

            console.log(`[ROOM] Socket ${socket.id} fully disconnected. Cleaned up from ${roomsAffected} room(s)`);

        } catch (error) {
            console.error(`[ROOM] Error in disconnect:`, error.message);
        }
    });

    console.log(`[ROOM] Room handler fully registered for socket ${socket.id}`);
};