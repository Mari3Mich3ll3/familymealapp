import express from "express";
import nodemailer from "nodemailer";
import { jsPDF } from "jspdf";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "10mb" })); // supporte les PDF base64 volumineux
app.use(cors());

// Config Nodemailer (assure-toi que "less secure apps" est autorisé ou utilise un mot de passe d'application)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "fonkoubooz07@gmail.com",
    pass: "rrhk ivnc xmuj dstz", // mot de passe d’application Gmail
  },
});

// Route : génération serveur OU réception base64 depuis le frontend
app.post("/send-pdf", async (req, res) => {
  const { email, pdfBase64 } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Adresse email invalide" });
  }

  try {
    let finalPdfBase64 = pdfBase64;

    // Si pas de base64 fourni, générer un PDF par défaut
    if (!pdfBase64) {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("📄 Document personnalisé", 10, 20);
      doc.setFontSize(12);
      doc.text("Ceci est un message généré automatiquement par FamilyMeal.", 10, 40);
      doc.text("Merci de faire partie de notre communauté !", 10, 50);
      finalPdfBase64 = doc.output("base64");
    }

    const mailOptions = {
      from: '"FamilyMeal" <fonkoubooz07@gmail.com>',
      to: email,
      subject: "📄 Votre document FamilyMeal",
      text: "Bonjour !\n\nVeuillez trouver en pièce jointe votre document PDF.",
      attachments: [
        {
          filename: "document-familymeal.pdf",
          content: finalPdfBase64,
          encoding: "base64",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ PDF envoyé à ${email}`);
    res.json({ success: true, message: `PDF envoyé à ${email}` });
  } catch (err) {
    console.error("❌ Erreur envoi PDF:", err.message);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur actif sur http://localhost:${PORT}`);
});
