import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Message } from "../models/message.model.js";
import { Room } from "../models/room.model.js";

const sendMessage = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { roomId } = req.params;

    if (!content?.trim()) {
        throw new ApiError(400, "Message content cannot be empty");
    }

    const roomExists = await Room.findById(roomId);
    if (!roomExists) {
        throw new ApiError(404, "Room not found");
    }

    const message = await Message.create({
        room: roomId,
        sender: req.user._id,
        content: content.trim(),
    });

    if (!message) {
        throw new ApiError(500, "Message could not be saved");
    }

    const savedMessage = await Message.aggregate([
        {
            $match: {
                _id: message._id
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "sender",
                pipeline: [
                    { $project: { username: 1, email: 1, _id: 1 } }
                ]
            }
        },
        { $unwind: "$sender" }
    ]);

    return res
        .status(201)
        .json(new ApiResponse(201, savedMessage[0], "Message sent successfully"));
});

const getMessagesByRoom = asyncHandler(async (req, res) => {
    const { roomId } = req.params;

    const roomExists = await Room.findOne({ roomId });
    if (!roomExists) throw new ApiError(404, "Room not found");

    const messages = await Message.aggregate([
        { $match: { roomId: roomId } },
        {
            $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "sender",
                pipeline: [{ $project: { username: 1, email: 1, _id: 1 } }]
            }
        },
        { $unwind: "$sender" },
        { $sort: { createdAt: 1 } }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, messages, "Messages fetched successfully"));
});

const deleteMessagesByRoom = asyncHandler(async (req, res) => {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });
    if (!room) throw new ApiError(404, "Room not found");

    await Message.deleteMany({ room: room._id });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Messages deleted successfully"));
});

export {sendMessage, getMessagesByRoom, deleteMessagesByRoom}