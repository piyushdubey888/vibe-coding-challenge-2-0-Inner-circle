import express from "express";
import mongoose from "mongoose";
import Match from "../models/Match.js";

const router = express.Router();
const allowedFields = ["title", "sport", "date", "venue", "opponent", "status", "result"];
const validId = (id) => mongoose.isValidObjectId(id);

function cleanInput(body) {
  const input = {};
  for (const field of allowedFields) if (Object.hasOwn(body, field)) input[field] = body[field];
  return input;
}

router.get("/", async (_req, res) => {
  try {
    const matches = await Match.find().sort({ date: 1, createdAt: -1 });
    res.json(matches);
  } catch (error) {
    console.error("Fetch matches error:", error.message);
    res.status(500).json({ message: "Failed to fetch matches." });
  }
});

router.post("/", async (req, res) => {
  try {
    const input = cleanInput(req.body);
    if (!input.title?.trim() || !input.sport?.trim() || !input.date) {
      return res.status(400).json({ message: "Match title, sport and date are required." });
    }
    const match = await Match.create(input);
    res.status(201).json(match);
  } catch (error) {
    if (["ValidationError", "CastError"].includes(error.name)) return res.status(400).json({ message: "Invalid match details." });
    console.error("Create match error:", error.message);
    res.status(500).json({ message: "Failed to create match." });
  }
});

router.patch("/:id", async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid match ID." });
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, cleanInput(req.body), { new: true, runValidators: true });
    if (!match) return res.status(404).json({ message: "Match not found." });
    res.json(match);
  } catch (error) {
    if (["ValidationError", "CastError"].includes(error.name)) return res.status(400).json({ message: "Invalid match details." });
    res.status(500).json({ message: "Failed to update match." });
  }
});

export default router;
