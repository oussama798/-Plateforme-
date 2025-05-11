const express = require("express");
const router = express.Router();
const Utilisateur = require("../models/user"); // Assure-toi que le nom correspond à ton fichier

// Exemple de route pour obtenir tous les utilisateurs
router.get("/", async (req, res) => {
  try {
    const utilisateurs = await Utilisateur.find();
    res.json(utilisateurs);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des utilisateurs" });
  }
});

// Exemple de route pour obtenir un utilisateur par son ID
router.get("/:id", async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findById(req.params.id);
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.json(utilisateur);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération de l'utilisateur" });
  }
});

module.exports = router;
