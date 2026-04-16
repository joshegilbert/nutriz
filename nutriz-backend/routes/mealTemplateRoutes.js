const express = require("express");
const router = express.Router();
const MealTemplate = require("../models/MealTemplate");
const auth = require("../middleware/authMiddleware");

// Get all meal templates for the authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const templates = await MealTemplate.find({ user: req.user.id }).sort({
      updatedAt: -1,
    });

    res.json(templates);
  } catch (error) {
    console.error("Error fetching meal templates:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new meal template
router.post("/", auth, async (req, res) => {
  try {
    const { name, tags, meal } = req.body;

    if (!name || !meal) {
      return res
        .status(400)
        .json({ message: "Name and meal data are required" });
    }

    const template = new MealTemplate({
      user: req.user.id,
      name,
      tags: tags || [],
      meal,
    });

    await template.save();
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating meal template:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a meal template
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, tags, meal } = req.body;

    const template = await MealTemplate.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (name) template.name = name;
    if (tags) template.tags = tags;
    if (meal) template.meal = meal;

    await template.save();
    res.json(template);
  } catch (error) {
    console.error("Error updating meal template:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a meal template
router.delete("/:id", auth, async (req, res) => {
  try {
    const template = await MealTemplate.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting meal template:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific meal template
router.get("/:id", auth, async (req, res) => {
  try {
    const template = await MealTemplate.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error fetching meal template:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
