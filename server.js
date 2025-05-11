// ✅ Importations
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");

const app = express();

// ✅ Configuration EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

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

// ✅ Connexion MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/gestion_examens")
  .then(() => console.log("✅ Base de données connectée"))
  .catch((err) => console.error("❌ Erreur de connexion DB:", err));

// ✅ Modèle Utilisateur
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

// ✅ Modèle Examen
const examenSchema = new mongoose.Schema({
  titre: String,
  description: String,
  public: String,
  questions: [
    {
      enonce: String,
      choix: [String],
      reponseCorrecte: mongoose.Schema.Types.Mixed, // ✅ accepte string ou array
    },
  ],
  enseignantId: { type: mongoose.Schema.Types.ObjectId, ref: "Utilisateur" },
  lien_unique: { type: String, required: true, unique: true },
  duree: Number,
  createdAt: { type: Date, default: Date.now },
  reponsesEtudiants: [
    {
      reponses: [mongoose.Schema.Types.Mixed],
      score: Number,
      geolocalisation: {
        latitude: Number,
        longitude: Number,
      },
      date: { type: Date, default: Date.now },
    },
  ],
});
const Examen = mongoose.model("Examen", examenSchema);

// ✅ Inscription
app.post(
  "/inscription",
  [
    check("email").isEmail().withMessage("Email invalide"),
    check("mot_de_passe")
      .isLength({ min: 6 })
      .withMessage("Mot de passe trop court"),
    check("nom").notEmpty().withMessage("Nom requis"),
    check("prenom").notEmpty().withMessage("Prénom requis"),
    check("type").notEmpty().withMessage("Type requis"),
  ],
  async (req, res) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) {
      return res.status(400).json({ erreurs: erreurs.array() });
    }

    const {
      type,
      email,
      nom,
      prenom,
      etablissement,
      mot_de_passe,
      date_naissance,
      sexe,
      filiere,
    } = req.body;

    try {
      const utilisateurExistant = await Utilisateur.findOne({ email });
      if (utilisateurExistant) {
        return res.status(400).json({ message: "❌ Email déjà utilisé" });
      }

      const motDePasseCrypte = await bcrypt.hash(mot_de_passe, 10);

      const nouvelUtilisateur = new Utilisateur({
        type,
        email,
        nom,
        prenom,
        etablissement,
        mot_de_passe: motDePasseCrypte,
        date_naissance,
        sexe,
        filiere,
      });

      await nouvelUtilisateur.save();
      req.session.userId = nouvelUtilisateur._id;
      res.status(201).json({ message: "✅ Inscription réussie" });
    } catch (err) {
      console.error("Erreur inscription:", err);
      res.status(500).json({ message: "❌ Erreur serveur" });
    }
  }
);

// ✅ Connexion
app.post("/connexion", async (req, res) => {
  const { email, mot_de_passe } = req.body;

  try {
    const utilisateur = await Utilisateur.findOne({ email });
    if (!utilisateur) {
      return res.status(400).json({ message: "❌ Utilisateur non trouvé" });
    }

    const motDePasseValide = await bcrypt.compare(
      mot_de_passe,
      utilisateur.mot_de_passe
    );
    if (!motDePasseValide) {
      return res.status(401).json({ message: "❌ Mot de passe incorrect" });
    }

    req.session.userId = utilisateur._id;

    const redirection =
      utilisateur.type === "enseignant"
        ? "/create_add_question.html"
        : "/profil.html";

    res.json({
      message: "✅ Connexion réussie",
      redirectTo: redirection,
      utilisateur,
    });
  } catch (err) {
    console.error("Erreur connexion:", err);
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});

// ✅ Profil
app.get("/profil", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "❌ Non connecté" });
  }

  try {
    const utilisateur = await Utilisateur.findById(req.session.userId).select(
      "-mot_de_passe"
    );
    res.json({ utilisateur });
  } catch (err) {
    console.error("Erreur profil:", err);
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});

// ✅ Déconnexion
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("❌ Erreur déconnexion");
    res.redirect("/");
  });
});

// ✅ Création Examen
app.post("/creer-examen", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "❌ Non connecté" });
  }

  try {
    const {
      titre,
      description,
      questions,
      public: publicCible,
      duree,
    } = req.body;

    if (!titre || !questions || questions.length === 0) {
      return res.status(400).json({ message: "❌ Champs manquants" });
    }

    const lien_unique = Math.random().toString(36).substring(2, 10);

    const nouvelExamen = new Examen({
      titre,
      description,
      public: publicCible || "Tous",
      questions,
      enseignantId: req.session.userId,
      lien_unique,
      duree: duree || 3600,
    });

    await nouvelExamen.save();

    console.log(`🔗 Lien examen: http://localhost:3000/examens/${lien_unique}`);
    res.status(201).json({
      message: "✅ Examen enregistré avec succès",
      lien_unique: lien_unique,
    });
  } catch (err) {
    console.error("Erreur création examen:", err);
    res.status(500).json({ message: "❌ Erreur serveur" });
  }
});

// ✅ Accès à l'examen (vue étudiante)
app.get("/examens/:lien_unique", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send("❌ Non connecté");
  }
  try {
    const utilisateur = await Utilisateur.findById(req.session.userId);
    if (utilisateur.type !== "etudiant") {
      return res.status(403).send("❌ Accès interdit");
    }

    const examen = await Examen.findOne({
      lien_unique: req.params.lien_unique,
    });

    if (!examen) {
      return res.status(404).json({ message: "❌ Examen introuvable" });
    }

    res.render("examens_etudiant", { examen, utilisateur });
  } catch (err) {
    console.error("Erreur accès examen:", err);
    res.status(500).send("❌ Erreur serveur");
  }
});

// ✅ API Questions Examen
app.get("/examens/api/:lien_unique/questions", async (req, res) => {
  try {
    const examen = await Examen.findOne({
      lien_unique: req.params.lien_unique,
    });

    if (!examen) {
      return res.status(404).json({ error: "❌ Examen introuvable" });
    }

    res.json({
      questions: examen.questions,
      duree: examen.duree,
    });
  } catch (err) {
    console.error("Erreur chargement questions:", err);
    res.status(500).json({ error: "❌ Erreur serveur" });
  }
});

// ✅ Soumission Examen avec score + geoloc
app.post("/examens/soumettre", async (req, res) => {
  const { examId, reponses, geolocalisation } = req.body;

  try {
    const examen = await Examen.findOne({ lien_unique: examId });

    if (!examen) {
      return res.json({ success: false, message: "Examen introuvable." });
    }

    const questions = examen.questions;
    let correctCount = 0;

    questions.forEach((q, index) => {
      const reponseEtudiant = reponses[index];
      const bonneReponse = q.reponseCorrecte;

      if (Array.isArray(bonneReponse)) {
        if (
          Array.isArray(reponseEtudiant) &&
          reponseEtudiant.length === bonneReponse.length &&
          reponseEtudiant.every((r) => bonneReponse.includes(r))
        ) {
          correctCount++;
        }
      } else {
        if (
          typeof reponseEtudiant === "string" &&
          reponseEtudiant.trim().toLowerCase() ===
            bonneReponse.trim().toLowerCase()
        ) {
          correctCount++;
        }
      }
    });

    const total = questions.length;
    const score = Math.round((correctCount / total) * 100);

    examen.reponsesEtudiants = examen.reponsesEtudiants || [];
    examen.reponsesEtudiants.push({
      reponses,
      score,
      geolocalisation,
      date: new Date(),
    });
    await examen.save();

    return res.json({ success: true, score, geolocalisation });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Erreur serveur." });
  }
});

// ✅ Lancement serveur
app.listen(3000, () => {
  console.log("✅ Serveur lancé : http://localhost:3000");
});
