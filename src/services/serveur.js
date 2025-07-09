const nodemailer = require("nodemailer")
const { GoogleGenerativeAI } = require("@google/generative-ai")
const jsPDF = require("jspdf")
require("jspdf-autotable")

// Configuration Gemini AI
const genAI = new GoogleGenerativeAI("AIzaSyChfFx3qXfqtc2tth5DzDc8WySy9r-UCxo")
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) // Utiliser un modèle plus stable

// Configuration Nodemailer
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: "melobozzy07@gmail.com", // Remplacez par votre email
    pass: "zvtu elzu artj viyx", // Remplacez par votre mot de passe d'application
  },
})

// Fonction pour générer un message personnalisé avec Gemini
const generatePersonalizedMessage = async (memberName, memberAge, shoppingList) => {
  try {
    const prompt = `
Génère un message personnalisé et bienveillant pour ${memberName}, âgé de ${memberAge} ans, concernant la liste de courses familiale.

Le message doit :
- Être adapté à l'âge de la personne
- Être chaleureux et familial
- Mentionner quelques éléments de la liste de courses
- Encourager une alimentation saine
- Être en français
- Faire environ 100-150 mots

Liste de courses : ${JSON.stringify(shoppingList)}

Format de réponse : Un message direct sans formatage spécial.
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("Erreur génération message Gemini:", error)
    return `Bonjour ${memberName},

Voici la liste de courses de notre famille pour cette semaine. Nous avons préparé une sélection d'ingrédients nutritifs et délicieux pour nos repas.

Cette liste a été soigneusement organisée pour répondre aux besoins de toute la famille tout en tenant compte de nos préférences et allergies.

Bon shopping !

Avec amour,
La famille FamilyMeal`
  }
}

// Fonction pour générer le PDF de la liste de courses
const generateShoppingListPDF = (shoppingList, familyName) => {
  const doc = new jsPDF()

  // En-tête
  doc.setFontSize(20)
  doc.setTextColor(34, 197, 94)
  doc.text("Liste de Courses Familiale", 20, 30)

  // Informations
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Famille: ${familyName}`, 20, 45)
  doc.text(`Générée le: ${new Date().toLocaleDateString("fr-FR")}`, 20, 55)

  // Préparer les données par catégorie
  const categorizedItems = {}
  let totalPrice = 0

  shoppingList.forEach((item) => {
    const category = item.category || "Autres"
    if (!categorizedItems[category]) {
      categorizedItems[category] = []
    }
    categorizedItems[category].push(item)
    totalPrice += (item.price || 0) * (item.quantity || 1)
  })

  let yPosition = 70

  // Générer le tableau par catégorie
  Object.keys(categorizedItems).forEach((category) => {
    const items = categorizedItems[category]

    // En-tête de catégorie
    doc.setFontSize(14)
    doc.setTextColor(34, 197, 94)
    doc.text(category.toUpperCase(), 20, yPosition)
    yPosition += 10

    // Items de la catégorie
    const tableData = items.map((item) => [
      item.name,
      `${item.quantity || 1} ${item.unit || "pièce(s)"}`,
      `${((item.price || 0) * (item.quantity || 1)).toFixed(0)} XAF`,
      item.comment || "",
    ])

    doc.autoTable({
      head: [["Article", "Quantité", "Prix", "Commentaire"]],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 60 },
      },
    })

    yPosition = doc.lastAutoTable.finalY + 15
  })

  // Total
  doc.setFontSize(14)
  doc.setTextColor(34, 197, 94)
  doc.text(`Total estimé: ${totalPrice.toFixed(0)} XAF`, 20, yPosition)

  return doc.output("arraybuffer")
}

// Fonction principale pour envoyer la liste par email
const sendShoppingListByEmail = async (memberEmail, memberName, memberAge, shoppingList, familyName) => {
  try {
    // Générer le message personnalisé
    const personalizedMessage = await generatePersonalizedMessage(memberName, memberAge, shoppingList)

    // Générer le PDF
    const pdfBuffer = generateShoppingListPDF(shoppingList, familyName)

    // Configuration de l'email
    const mailOptions = {
      from: "votre-email@gmail.com",
      to: memberEmail,
      subject: `🛒 Liste de courses familiale - ${familyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🛒 FamilyMeal</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Liste de courses personnalisée</p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-top: 0;">Bonjour ${memberName} !</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981;">
              ${personalizedMessage.replace(/\n/g, "<br>")}
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="color: #374151; margin-top: 0;">📋 Résumé de la liste</h3>
              <ul style="color: #6b7280;">
                <li><strong>${shoppingList.length}</strong> articles au total</li>
                <li><strong>${[...new Set(shoppingList.map((item) => item.category))].length}</strong> catégories</li>
                <li>Budget estimé: <strong>${shoppingList.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0).toFixed(0)} XAF</strong></li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px;">
                📎 La liste complète est disponible en pièce jointe au format PDF
              </p>
            </div>
            
            <div style="text-align: center; padding: 15px; background: #ecfdf5; border-radius: 8px;">
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                💚 Bon shopping et à bientôt !<br>
                <strong>L'équipe FamilyMeal</strong>
              </p>
            </div>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `liste-courses-${familyName}-${new Date().toISOString().split("T")[0]}.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: "application/pdf",
        },
      ],
    }

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions)
    console.log("Email envoyé:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Erreur envoi email:", error)
    return { success: false, error: error.message }
  }
}

module.exports = {
  sendShoppingListByEmail,
  generatePersonalizedMessage,
  generateShoppingListPDF,
}
