import mongoose from "mongoose";

const strokeSchema = new mongoose.Schema(
  {
    tool: {
        type: String,
        enum: ["pen", "line", "circle", "rectangle", "eraser", "text"],
        required: true
    },
    color: {
        type: String,
        default: "#000000"
    },
    width: {
        type: Number,
        default: 2
    },
    points: [
        {
            x: Number,
            y: Number
        }
    ], 
  },
  { _id: false }
);

const drawingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room", required: true
    },
    strokes: [strokeSchema],
    undoneStrokes: [strokeSchema],
  },
  { timestamps: true }
);

export const Drawing = mongoose.model("Drawing", drawingSchema);
