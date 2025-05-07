const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ["qcm", "directe"], required: true },
  enonce: { type: String, required: true },
  media: { type: String },
  options: [String],
  bonnes_reponses: [String],
  reponse_directe: String,
  tolerance: Number,
  note: Number,
  duree: Number, // en secondes
});

const examenSchema = new mongoose.Schema({
  titre: String,
  description: String,
  public: String,
  lien: String,
  questions: [questionSchema],
  enseignant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Utilisateur" },
});

module.exports = mongoose.model("Examen", examenSchema);
