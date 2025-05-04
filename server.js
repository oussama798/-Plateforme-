const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Configuration de la session
app.use(
  session({
    secret: "cle_secrete_session",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // false si vous n'utilisez pas HTTPS
  })
);

// Connexion à la base de données MongoDB (sans options dépréciées)
mongoose
  .connect("mongodb://127.0.0.1:27017/gestion_examens")
  .then(() => console.log("✅ Base de données connectée"))
  .catch((err) => console.error("❌ Erreur de connexion DB:", err));

// Définition du schéma utilisateur
const utilisateurSchema = new mongoose.Schema({
  type: String,
  email: String,
  nom: String,
  prenom: String,
  etablissement: String,
  mot_de_passe: String,
  date_naissance: String,
  sexe: String,
  filiere: String,
});

// Création du modèle
const Utilisateur = mongoose.model("Utilisateur", utilisateurSchema);

// Routes
app.post("/inscription", async (req, res) => {
  try {
    const nouveauUtilisateur = new Utilisateur(req.body);
    await nouveauUtilisateur.save();
    res.send("✅ Inscription réussie !");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Erreur lors de l'inscription");
  }
});

app.post("/connexion", async (req, res) => {
  const { email, mot_de_passe } = req.body;
  const utilisateur = await Utilisateur.findOne({ email, mot_de_passe });
  if (utilisateur) {
    req.session.utilisateur = utilisateur.nom;
    res.redirect("/profil.html");
  } else {
    res.send("❌ Identifiants invalides");
  }
});

app.get("/profil", (req, res) => {
  if (req.session.utilisateur) {
    res.send(`Bienvenue ${req.session.utilisateur}`);
  } else {
    res.status(401).send("Accès refusé");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Lancement du serveur
app.listen(3000, () =>
  console.log("✅ Serveur lancé sur http://localhost:3000")
);
