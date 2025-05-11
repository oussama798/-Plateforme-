// ✅ Extraire le lien unique depuis l'URL
const lienUnique = window.location.pathname.split("/").pop();
console.log("🔍 Lien unique extrait:", lienUnique); // Ajoute cette ligne pour vérifier si la valeur est correcte

// ✅ Vérifier si lienUnique est défini avant de l'utiliser
if (!lienUnique || lienUnique === "") {
  console.error("❌ Lien unique invalide ou vide.");
} else {
  // ✅ Afficher le lien complet de l'examen (si div présente)
  const lienExamenDiv = document.getElementById("lien-examen");
  if (lienExamenDiv) {
    const lienComplet = `${window.location.origin}/examens/${lienUnique}`;
    lienExamenDiv.innerHTML = `🔗 Lien de l'examen : <a href="${lienComplet}" target="_blank">${lienComplet}</a>`;
  }
}

// ✅ Charger les questions
async function chargerQuestions() {
  try {
    const res = await fetch(`/examens/api/${lienUnique}/questions`);
    const data = await res.json();

    if (!data.questions || data.questions.length === 0) {
      throw new Error("Aucune question reçue");
    }

    afficherQuestions(data.questions);
  } catch (err) {
    console.error("Erreur chargement questions:", err);
    document.getElementById("questions-container").innerHTML =
      "❌ Impossible de charger l'examen.";
  }
}

// ✅ Afficher les questions dans le formulaire
function afficherQuestions(questions) {
  const container = document.getElementById("questions-container");
  container.innerHTML = "";

  questions.forEach((q, index) => {
    const div = document.createElement("div");
    div.className = "question-block";
    div.innerHTML = `
      <p><strong>Question ${index + 1} :</strong> ${q.enonce}</p>
      ${q.choix
        .map(
          (choix) => `
        <label>
          <input type="radio" name="q${index}" value="${choix}" />
          ${choix}
        </label><br/>
      `
        )
        .join("")}
      <hr/>
    `;
    container.appendChild(div);
  });
}

// ✅ Gestion de la soumission de l’examen
document.getElementById("exam-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const reponses = [];

  const questions = document.querySelectorAll('[name^="q"]');
  const nbQuestions = [...new Set([...questions].map((q) => q.name))].length;

  for (let i = 0; i < nbQuestions; i++) {
    const val = form.get(`q${i}`);
    reponses.push(val || "");
  }

  try {
    const res = await fetch("/soumettre", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lien_unique: lienUnique,
        reponses,
      }),
    });

    const data = await res.json();
    if (data.score !== undefined) {
      document.getElementById(
        "resultat"
      ).innerText = `✅ Score : ${data.score} / ${data.total}`;
    } else {
      document.getElementById("resultat").innerText = "❌ Soumission échouée.";
    }
  } catch (err) {
    console.error("Erreur soumission:", err);
    document.getElementById("resultat").innerText =
      "❌ Erreur lors de la soumission.";
  }
});

// ✅ Géolocalisation avant démarrage (optionnel)
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        await fetch(`/examens/api/${lienUnique}/geoloc`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        });
        console.log("📍 Position envoyée");
      } catch (err) {
        console.warn("⚠ Échec envoi position");
      }
    },
    (error) => {
      console.warn("⚠ Géolocalisation refusée ou échouée", error);
    }
  );
}

// ✅ Lancer le chargement des questions
chargerQuestions();

