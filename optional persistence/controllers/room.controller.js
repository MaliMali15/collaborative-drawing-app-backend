import { Room } from "../models/room.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {nanoid} from "nanoid"

const createRoom = asyncHandler(async (req, res) => {
    const roomId = nanoid(10);

    const room = await Room.create({
        roomId: roomId,
        name: `room ${roomId}`,
        createdBy: req.user._id,
        participants: [req.user._id],
    });

    if (!room) {
        throw new ApiError(500, "Some went wrong. Room not created")
    }

    const roomLink = `${process.env.ROOM_URL}/room/${roomId}`;

    return res.status(201).json(new ApiResponse(200, { room, roomLink }, "Room created successfully"));
});

const getCurrentRoom = asyncHandler(async (req, res) => {
    const room = await Room.findOne({ participants: req.user._id });

    if (!room) {
        return res.status(200).json(new ApiResponse(200, {}, "User is not in any room"));
    }

    return res.status(200).json(new ApiResponse(200, room, "User current room fetched successfully"));
});

const joinRoom = asyncHandler(async (req, res) => {
    const newRoom = await Room.findOne({ roomId: req.params.id });
    if (!newRoom) throw new ApiError(404, "Room not found");

    const prevRoom = await Room.findOne({ participants: req.user._id });
    if (prevRoom.createdBy.toString() === req.user._id.toString()) {
        await prevRoom.remove();
    }

    if (prevRoom) {
        prevRoom.participants = prevRoom.participants.filter(p => p.toString() !== req.user._id.toString());
        await prevRoom.findByIdAndDelete(prevRoom._id);
    }

    newRoom.participants.push(req.user._id);
    await newRoom.save();

    return res.status(200).json(new ApiResponse(200, newRoom, "Joined room successfully"));
});

const leaveRoom = asyncHandler(async (req, res) => {
    const room = await Room.findOne({ roomId: req.params.id });
    if (!room) throw new ApiError(404, "Room not found");

    if (room.createdBy.toString() === req.user._id.toString()) {
        await Room.findByIdAndDelete(room._id);
        return res.status(200).json(new ApiResponse(200, {}, "Room deleted as creator left."));
    } else {
        room.participants = room.participants.filter(p => p.toString() !== req.user._id.toString());
        await room.save();
        return res.status(200).json(new ApiResponse(200, room, "Left room successfully"));
    }
});
    
const updateRoomName = asyncHandler(async (req, res) => {
    const room = await Room.findOne({ roomId: req.params.id });
    if (!room) throw new ApiError(404, "Room not found");

    if (room.createdBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the creator can update the room name");
    }

    room.name = req.body.name || room.name;
    await room.save();

    return res.status(200).json(new ApiResponse(200, room, "Room name updated successfully"));
});

const getRoomById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const roomData = await Room.aggregate([
        {
            $match: {
                roomCode: id
            }
        }, 
        {
        $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "participantsInfo",
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        email: 1
                    }
                }, 
            ],
        },
        },
        {
        $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "creatorInfo",
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        email: 1
                    }
                },
            ],
        },
        },
        {
            $unwind: "$creatorInfo"
        }, 
        {
        $project: {
            _id: 1,
            roomCode: 1,
            creator: "$creatorInfo",
            participants: "$participantsInfo",
            createdAt: 1,
            updatedAt: 1,
        },
        },
    ]);

    if (!roomData.length) throw new ApiError(404, "Room not found");

    return res
        .status(200)
        .json(new ApiResponse(200, roomData[0], "Room fetched successfully"));
});

export {createRoom, getCurrentRoom, joinRoom, leaveRoom, updateRoomName, getRoomById}


