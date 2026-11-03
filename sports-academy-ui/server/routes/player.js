import express from "express";
import mongoose from "mongoose";
import Player from "../models/Player.js";

const router = express.Router();
const allowedFields = [
  "firstName", "lastName", "age", "sport", "phone", "email", "position",
  "status", "statusReason", "photo", "notes", "achievements",
];

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function cleanPlayerInput(body) {
  const input = {};
  for (const field of allowedFields) {
    if (Object.hasOwn(body, field)) input[field] = body[field];
  }
  if (Object.hasOwn(input, "age")) input.age = Number(input.age);
  return input;
}

router.get("/", async (_req, res) => {
  try {
    const players = await Player.find().sort({ createdAt: -1 });
    res.json(players);
  } catch (error) {
    console.error("Fetch players error:", error.message);
    res.status(500).json({ message: "Failed to fetch players." });
  }
});

router.get("/:id", async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid player ID." });
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ message: "Player not found." });
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch player." });
  }
});

router.post("/", async (req, res) => {
  try {
    const input = cleanPlayerInput(req.body);
    if (!input.firstName?.trim() || !input.lastName?.trim() || !input.age || !input.sport?.trim()) {
      return res.status(400).json({ message: "First name, last name, age, and sport are required." });
    }
    const player = await Player.create(input);
    res.status(201).json(player);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "Invalid player details. Please check the submitted fields." });
    }
    console.error("Create player error:", error.message);
    res.status(500).json({ message: "Failed to register player." });
  }
});

router.patch("/:id", async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid player ID." });
  try {
    const input = cleanPlayerInput(req.body);
    const player = await Player.findByIdAndUpdate(req.params.id, input, {
      new: true,
      runValidators: true,
    });
    if (!player) return res.status(404).json({ message: "Player not found." });
    res.json(player);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "Invalid player details. Please check the submitted fields." });
    }
    res.status(500).json({ message: "Failed to update player." });
  }
});

// Soft-delete: preserve academy history by marking the player inactive.
router.delete("/:id", async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid player ID." });
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { status: "Inactive", statusReason: req.body?.reason || "Removed from active roster" },
      { new: true, runValidators: true }
    );
    if (!player) return res.status(404).json({ message: "Player not found." });
    res.json({ message: "Player marked inactive. Their record has been preserved.", player });
  } catch (error) {
    res.status(500).json({ message: "Failed to deactivate player." });
  }
});

export default router;
