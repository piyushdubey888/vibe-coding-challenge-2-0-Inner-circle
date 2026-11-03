import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    sport: { type: String, required: true, trim: true, maxlength: 80 },
    date: { type: Date, required: true },
    venue: { type: String, trim: true, default: "", maxlength: 160 },
    opponent: { type: String, trim: true, default: "", maxlength: 120 },
    status: { type: String, enum: ["Upcoming", "Completed", "Cancelled"], default: "Upcoming" },
    result: { type: String, trim: true, default: "", maxlength: 160 },
  },
  { timestamps: true }
);

export default mongoose.model("Match", matchSchema);
