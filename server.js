// ✅ Importations nécessaires
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");

const app = express();

// ✅ Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: "cle_secrete_session",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// ✅ Connexion à MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/gestion_examens", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Base de données connectée"))
  .catch((err) => console.error("❌ Erreur de connexion DB:", err));

// ✅ Schémas & modèles
const utilisateurSchema = new mongoose.Schema({
  type: String,
  email: { type: String, unique: true },
  nom: String,
  prenom: String,
  etablissement: String,
  mot_de_passe: String,
  date_naissance: String,
  sexe: String,
  filiere: String,
});
const Utilisateur = mongoose.model("Utilisateur", utilisateurSchema);
const Examen = require("./models/examen");

// ✅ Routes

// 📌 Inscription
app.post("/inscription", [...], async (req, res) => {
  // الكود ديال التحقق والتسجيل هنا
});

// 📌 Connexion
app.post("/connexion", async (req, res) => {
  // الكود ديال التحقق من البريد وكلمة السر وحفظ session
});

// 📌 Profil
app.get("/profil", async (req, res) => {
  // إرجاع معلومات المستخدم إذا كان مسجل الدخول
});

// 📌 Déconnexion
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("❌ Erreur déconnexion");
    res.redirect("/");
  });
});

// 📌 Création d'examen
app.post("/api/examen", async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).send("❌ Connectez-vous");
    const { titre, description, public: estPublic } = req.body;
    const lien = `exam-${Math.random().toString(36).substr(2, 9)}`;
    const examen = new Examen({
      titre,
      description,
      public: estPublic,
      lien,
      enseignant_id: req.session.userId,
      questions: [], // init vide
    });
    await examen.save();
    res.json({ message: "✅ Examen créé", lien });
  } catch (err) {
    res.status(500).json({ error: "❌ Erreur création examen" });
  }
});

// 📌 Ajout question
app.post("/api/question", async (req, res) => {
  try {
    const {
      lien,
      type,
      enonce,
      media,
      options,
      bonnes_reponses,
      reponse_directe,
      tolerance,
      note,
      duree,
    } = req.body;

    const examen = await Examen.findOne({ lien });
    if (!examen) return res.status(404).json({ error: "Examen non trouvé" });

    examen.questions.push({
      type,
      enonce,
      media,
      options,
      bonnes_reponses,
      reponse_directe,
      tolerance,
      note,
      duree,
    });

    await examen.save();
    res.json({ message: "✅ Question ajoutée" });
  } catch (err) {
    res.status(500).json({ error: "❌ Erreur ajout question" });
  }
});

// 📌 Modifier question
app.put("/api/question/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const examen = await Examen.findOne({ "questions._id": id });
    if (!examen) return res.status(404).json({ "Question non trouvée" });

    const question = examen.questions.id(id);
    question.set(req.body);

    await examen.save();
    res.json({ message: "✅ Question modifiée" });
  } catch (err) {
    res.status(500).json({ error: "❌ Erreur modification question" });
  }
});

// 📌 Supprimer question
app.delete("/api/question/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const examen = await Examen.findOne({ "questions._id": id });
    if (!examen) return res.status404).json({ error: "Question non trouvée" });

    examen.questions.id(id).remove();

    await examen.save();
    res.json({ message: "✅ Question supprimée" });
  } catch (err) {
    res.status(500).json({ error: "❌ Erreur suppression question" });
  }
});

// ✅ Démarrer serveur
app.listen(3000, () =>
  console.log("✅ Serveur lancé sur http://localhost:3000")
);
