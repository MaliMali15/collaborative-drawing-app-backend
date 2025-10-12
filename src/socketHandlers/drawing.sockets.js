import { rooms } from "../memory/rooms.memory.js";

export const registerDrawingHandlers = (io, socket) => {
    console.log(`[DRAWING] Handler initialized for socket: ${socket.id}`);

    // ============ CANVAS DRAW ============
    socket.on("canvas:draw", ({ roomId, drawData }) => {
        try {
            // Input validation
            if (!roomId || typeof roomId !== 'string') {
                console.warn(`[DRAWING] Invalid roomId from ${socket.id}:`, roomId);
                socket.emit("error", { message: "Invalid room ID" });
                return;
            }

            if (!drawData || typeof drawData !== 'object') {
                console.warn(`[DRAWING] Invalid drawData from ${socket.id}:`, drawData);
                socket.emit("error", { message: "Invalid draw data" });
                return;
            }

            // Validate required drawData properties
            if (typeof drawData.x !== 'number' || typeof drawData.y !== 'number') {
                console.warn(`[DRAWING] Invalid coordinates from ${socket.id}:`, drawData);
                socket.emit("error", { message: "Invalid coordinates" });
                return;
            }

            // Room existence check
            if (!rooms[roomId]) {
                console.warn(`[DRAWING] Room ${roomId} not found for socket ${socket.id}`);
                socket.emit("error", { message: "Room not found" });
                return;
            }

            // Check if user is in room
            if (!rooms[roomId].users[socket.id]) {
                console.warn(`[DRAWING] Socket ${socket.id} not in room ${roomId}`);
                socket.emit("error", { message: "You are not in this room" });
                return;
            }

            // Initialize drawing data if needed
            if (!rooms[roomId].drawingData) {
                rooms[roomId].drawingData = [];
            }

            // Store drawing
            const completeDrawData = {
                ...drawData,
                timestamp: Date.now(),
                userId: rooms[roomId].users[socket.id]?.userId,
                socketId: socket.id
            };

            rooms[roomId].drawingData.push(completeDrawData);

            console.log(`[DRAWING] User ${rooms[roomId].users[socket.id]?.userId} drew in room ${roomId}`);

            // Broadcast to others
            socket.to(roomId).emit("canvas:draw", drawData);

        } catch (error) {
            console.error(`[DRAWING] Error in canvas:draw:`, error.message);
            socket.emit("error", { message: "Failed to process drawing" });
        }
    });

    // ============ CLEAR CANVAS ============
    socket.on("canvas:clearCanvas", ({ roomId }) => {
        try {
            // Input validation
            if (!roomId || typeof roomId !== 'string') {
                console.warn(`[DRAWING] Invalid roomId from ${socket.id}:`, roomId);
                socket.emit("error", { message: "Invalid room ID" });
                return;
            }

            // Room existence check
            if (!rooms[roomId]) {
                console.warn(`[DRAWING] Room ${roomId} not found for socket ${socket.id}`);
                socket.emit("error", { message: "Room not found" });
                return;
            }

            // Check if user is in room
            if (!rooms[roomId].users[socket.id]) {
                console.warn(`[DRAWING] Socket ${socket.id} not in room ${roomId}`);
                socket.emit("error", { message: "You are not in this room" });
                return;
            }

            // Clear drawing data
            const previousCount = rooms[roomId].drawingData?.length || 0;
            rooms[roomId].drawingData = [];

            console.log(`[DRAWING] Canvas cleared in room ${roomId}. Removed ${previousCount} strokes`);

            // Broadcast to all
            io.to(roomId).emit("canvas:clearCanvas");

        } catch (error) {
            console.error(`[DRAWING] Error in canvas:clearCanvas:`, error.message);
            socket.emit("error", { message: "Failed to clear canvas" });
        }
    });

    // ============ LOAD DRAWING ============
    socket.on("canvas:loadDrawing", ({ roomId }) => {
        try {
            // Input validation
            if (!roomId || typeof roomId !== 'string') {
                console.warn(`[DRAWING] Invalid roomId from ${socket.id}:`, roomId);
                socket.emit("error", { message: "Invalid room ID" });
                return;
            }

            // Room existence check
            if (!rooms[roomId]) {
                console.warn(`[DRAWING] Room ${roomId} not found for socket ${socket.id}`);
                socket.emit("canvas:loadDrawing", []);
                console.log(`[DRAWING] Sent empty drawing data to ${socket.id} for non-existent room`);
                return;
            }

            // Check if user is in room
            if (!rooms[roomId].users[socket.id]) {
                console.warn(`[DRAWING] Socket ${socket.id} trying to load drawing but not in room ${roomId}`);
                socket.emit("error", { message: "You are not in this room" });
                return;
            }

            const drawingData = rooms[roomId].drawingData || [];

            console.log(`[DRAWING] Loaded ${drawingData.length} strokes for socket ${socket.id} in room ${roomId}`);

            // Send to requesting socket only
            socket.emit("canvas:loadDrawing", drawingData);

        } catch (error) {
            console.error(`[DRAWING] Error in canvas:loadDrawing:`, error.message);
            socket.emit("canvas:loadDrawing", []);
        }
    });

    // ============ UNDO (Commented - Add when needed) ============
    // socket.on("canvas:undo", ({ roomId }) => {
    //     try {
    //         if (!roomId || typeof roomId !== 'string') {
    //             console.warn(`[DRAWING] Invalid roomId from ${socket.id}:`, roomId);
    //             socket.emit("error", { message: "Invalid room ID" });
    //             return;
    //         }

    //         if (!rooms[roomId] || !rooms[roomId].drawingData || rooms[roomId].drawingData.length === 0) {
    //             console.warn(`[DRAWING] Cannot undo in room ${roomId} - no drawing data`);
    //             socket.emit("error", { message: "Nothing to undo" });
    //             return;
    //         }

    //         if (!rooms[roomId].users[socket.id]) {
    //             console.warn(`[DRAWING] Socket ${socket.id} not in room ${roomId}`);
    //             socket.emit("error", { message: "You are not in this room" });
    //             return;
    //         }

    //         rooms[roomId].drawingData.pop();
    //         console.log(`[DRAWING] Undo executed in room ${roomId}`);

    //         io.to(roomId).emit("canvas:undo");

    //     } catch (error) {
    //         console.error(`[DRAWING] Error in canvas:undo:`, error.message);
    //         socket.emit("error", { message: "Failed to undo" });
    //     }
    // });

    // ============ REDO (Commented - Add when needed) ============
    // socket.on("canvas:redo", ({ roomId, drawData }) => {
    //     try {
    //         if (!roomId || typeof roomId !== 'string') {
    //             console.warn(`[DRAWING] Invalid roomId from ${socket.id}:`, roomId);
    //             socket.emit("error", { message: "Invalid room ID" });
    //             return;
    //         }

    //         if (!drawData || typeof drawData !== 'object') {
    //             console.warn(`[DRAWING] Invalid drawData from ${socket.id}:`, drawData);
    //             socket.emit("error", { message: "Invalid draw data" });
    //             return;
    //         }

    //         if (!rooms[roomId]) {
    //             console.warn(`[DRAWING] Room ${roomId} not found`);
    //             socket.emit("error", { message: "Room not found" });
    //             return;
    //         }

    //         if (!rooms[roomId].users[socket.id]) {
    //             console.warn(`[DRAWING] Socket ${socket.id} not in room ${roomId}`);
    //             socket.emit("error", { message: "You are not in this room" });
    //             return;
    //         }

    //         if (!rooms[roomId].drawingData) {
    //             rooms[roomId].drawingData = [];
    //         }

    //         rooms[roomId].drawingData.push(drawData);
    //         console.log(`[DRAWING] Redo executed in room ${roomId}`);

    //         io.to(roomId).emit("canvas:redo", drawData);

    //     } catch (error) {
    //         console.error(`[DRAWING] Error in canvas:redo:`, error.message);
    //         socket.emit("error", { message: "Failed to redo" });
    //     }
    // });

    console.log(`[DRAWING] Drawing handler fully registered for socket ${socket.id}`);
};