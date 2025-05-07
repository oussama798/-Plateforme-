const express = require("express");
const router = express.Router();
const Question = require("../models/question"); // نحتاج نضيف هاد الموديل

router.post("/addQuestion", async (req, res) => {
  const {
    type,
    question,
    choices,
    answer,
    duration,
    score,
    tolerance,
    exam_id,
  } = req.body;

  const newQuestion = new Question({
    type,
    question,
    choices,
    answer,
    duration,
    score,
    tolerance,
    exam_id,
  });

  try {
    await newQuestion.save();
    res.json({ message: "✅ Question ajoutée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "❌ Erreur lors de l’ajout" });
  }
});

module.exports = router;
