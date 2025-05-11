const express = require("express");
const router = express.Router();
const Question = require("../models/question");

// POST /add-question
router.post("/add-question", async (req, res) => {
  try {
    const {
      examId,
      questionType,
      questionStatement,
      options,
      correctAnswers,
      tolerance,
      score,
      duration,
    } = req.body;

    const newQuestion = new Question({
      examId,
      questionType,
      questionStatement,
      options: options.split(",").map((opt) => opt.trim()),
      correctAnswers: correctAnswers.split(",").map((ans) => ans.trim()),
      tolerance,
      score,
      duration,
    });
    await newQuestion.save();
    res.send("Question ajoutée avec succès !");
  } catch (err) {
    res.status(500).send("Erreur lors de l'ajout de la question.");
  }
});

module.exports = router;
