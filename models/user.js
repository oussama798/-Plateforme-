const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Schéma utilisateur
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  mot_de_passe: { type: String, required: true },
  nom: { type: String, required: true },
  type: { type: String, required: true },
});

// Hachage du mot de passe avant de le sauvegarder
userSchema.pre("save", async function (next) {
  if (this.isModified("mot_de_passe")) {
    this.mot_de_passe = await bcrypt.hash(this.mot_de_passe, 10);
  }
  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.mot_de_passe);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
