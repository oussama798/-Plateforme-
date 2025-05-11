const express = require("express");
const router = express.Router();
const path = require("path");
const crypto = require("crypto");
const Examen = require("../models/examen");

// ✅ دالة باش نولدوا lien unique للامتحان
function generateLienUnique() {
  return crypto.randomBytes(5).toString("hex"); // بحال: "a1b2c3d4e5"
}

// ✅ route GET باش نعرضوا للطالب لائحة ديال الامتحانات
router.get("/etudiant/examens", async (req, res) => {
  try {
    const examens = await Examen.find(); // كنجيبو جميع الامتحانات
    res.render("examens_etudiant", { examens }); // كنصيفطوهم للواجهة
  } catch (err) {
    res.status(500).send("وقعت شي خطأ فالسيرفر");
  }
});

// ✅ route باش الطالب يقدر يدخل الامتحان عبر lien_unique
router.get("/examen/:lien_unique", async (req, res) => {
  try {
    const examen = await Examen.findOne({
      lien_unique: req.params.lien_unique,
    });
    if (!examen) return res.status(404).send("ما كاينش هاد الامتحان");
    res.sendFile(path.join(__dirname, "../public/exam.html"));
  } catch (err) {
    console.error("❌ خطأ فالوصول للامتحان:", err);
    res.status(500).send("خطأ فالسيرفر");
  }
});

// ✅ route باش نرجعو الأسئلة ديال الامتحان (API)
router.get("/api/examens/:lien/questions", async (req, res) => {
  try {
    const examen = await Examen.findOne({ lien_unique: req.params.lien });
    if (!examen) {
      return res
        .status(404)
        .json({ success: false, message: "ما كاينش هاد الامتحان" });
    }

    res.json({
      success: true,
      questions: examen.questions.map((q) => ({
        texte: q.question,
        options: q.options,
      })),
    });
  } catch (err) {
    console.error("❌ خطأ فجلب الأسئلة:", err);
    res.status(500).json({ success: false, message: "خطأ فالسيرفر" });
  }
});

// ✅ route باش الأستاذ يصاوب امتحان جديد
router.post("/", async (req, res) => {
  try {
    const { titre, description, public: publicCible, questions } = req.body;

    if (!titre || !questions || questions.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "كاينين بعض الخانات ناقصين" });
    }

    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, error: "ممنوع الدخول" });
    }

    const lien_unique = generateLienUnique();

    const nouvelExamen = new Examen({
      titre,
      description,
      public: publicCible,
      questions,
      lien_unique,
      enseignant_id: req.session.userId,
    });

    await nouvelExamen.save();

    res.status(201).json({
      success: true,
      message: "تزاد الامتحان بنجاح",
      examenId: nouvelExamen._id,
      redirect: "/profil.html",
    });
  } catch (err) {
    console.error("❌ خطأ فإضافة الامتحان:", err);
    res.status(500).json({ success: false, error: "خطأ فالسيرفر" });
  }
});

// ✅ route باش الطالب يصيفط الإجوبة مع الجيولوكاليزاسيون
router.post("/soumettre", async (req, res) => {
  try {
    const { examId, etudiantId, reponses, geolocalisation } = req.body;

    const examen = await Examen.findById(examId);
    if (!examen) {
      return res
        .status(404)
        .json({ success: false, message: "ما كاينش هاد الامتحان" });
    }

    let score = 0;

    examen.questions.forEach((question, index) => {
      const reponseUser = reponses[index];
      if (question.type === "directe") {
        // نتحققو مع tolérance
        const bonneReponse = question.reponse_correcte.trim().toLowerCase();
        const userReponse = reponseUser.trim().toLowerCase();

        const tol = question.tolerance || 0;
        const maxDiff = Math.floor(bonneReponse.length * (tol / 100));
        let diff = 0;
        for (
          let i = 0;
          i < Math.max(bonneReponse.length, userReponse.length);
          i++
        ) {
          if (bonneReponse[i] !== userReponse[i]) diff++;
        }
        if (diff <= maxDiff) {
          score += question.note || 100 / examen.questions.length;
        }
      } else if (question.type === "qcm") {
        const bonnesReponses = question.bonnes_reponses.sort().toString();
        const userChoices = (reponseUser || []).sort().toString();

        if (bonnesReponses === userChoices) {
          score += question.note || 100 / examen.questions.length;
        }
      }
    });

    res.status(200).json({
      success: true,
      score: Math.round(score),
      message: "جاوباتك تسجلات مع الموقع ديالك",
      geolocalisation,
    });
  } catch (err) {
    console.error("❌ خطأ فتصحيح الامتحان:", err);
    res.status(500).json({ success: false, message: "خطأ فالسيرفر" });
  }
});

module.exports = router;
