import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    date: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const playerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    age: { type: Number, required: true, min: 5, max: 100 },
    sport: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, trim: true, default: "", maxlength: 30 },
    email: { type: String, trim: true, lowercase: true, default: "", maxlength: 160 },
    position: { type: String, trim: true, default: "", maxlength: 80 },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    statusReason: { type: String, trim: true, default: "", maxlength: 300 },
    photo: { type: String, default: "" },
    notes: { type: [noteSchema], default: [] },
    achievements: { type: [achievementSchema], default: [] },
  },
  { timestamps: true }
);

const Player = mongoose.model("Player", playerSchema);
export default Player;
