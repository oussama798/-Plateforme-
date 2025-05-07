const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  type: { type: String, required: true }, // QCM ou direct
  question: { type: String, required: true },
  choices: [String], // فقط إذا كان QCM
  answer: String, // الجواب للسؤال المباشر
  duration: Number,
  score: Number,
  tolerance: Number,
  exam_id: { type: mongoose.Schema.Types.ObjectId, ref: "Examen" },
});

module.exports = mongoose.model("Question", questionSchema);
