import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import emailjs from "@emailjs/browser"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { FaShoppingCart } from "react-icons/fa"

// Supabase config
const supabaseUrl = "https://cyhzojhgcetcgzsusoxc.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aHpvamhnY2V0Y2d6c3Vzb3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTg2ODEsImV4cCI6MjA2NzQ3NDY4MX0.iN2zyaMdDa7pWKCSuokxMx5bcTLjNVtDw5CjsvJGpcY"
const supabase = createClient(supabaseUrl, supabaseKey)

const GOOGLE_GEN_AI_API_KEY = "AIzaSyBeD1PXhzqw0mlVM7CTg8IK7taOu5KBdoY"

// Recherche utilisateur dans toutes les tables pertinentes
async function fetchUserByEmail(email) {
  // Chercher dans family_members
  let { data: familyMember, error } = await supabase
    .from("family_members")
    .select("id, name, age, email")
    .eq("email", email)
    .single()
  if (error) familyMember = null

  // Si pas trouvé, chercher dans users
  if (!familyMember) {
    const { data: user, error: err2 } = await supabase
      .from("users")
      .select("id, full_name, profile_photo_url, email")
      .eq("email", email)
      .single()
    if (err2) return null
    // Remettre le formatage identique
    return user ? { name: user.full_name, age: null, email: user.email } : null
  }

  return familyMember
}

// Appel à Gemini Google Generative AI
async function generateMessage(name, age, mealName) {
  const prompt = `
Rédige un message amical personnalisé pour ${name}, 
${age ? `âgé(e) de ${age} ans` : "sans âge précisé"}, 
qui va préparer le repas "${mealName}". 
Adapte le style selon qu'il s'agit d'un enfant, adolescent ou adulte. 
Sois chaleureux, positif et bref.
`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta2/models/chat-bison-001:generateMessage?key=${GOOGLE_GEN_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: { text: prompt },
          temperature: 0.7,
          candidateCount: 1,
        }),
      }
    )
    const data = await response.json()
    return data.candidates?.[0]?.content || "Bon appétit !"
  } catch (e) {
    console.error("Erreur Gemini:", e)
    return "Bon appétit !"
  }
}

const ShoppingPage = () => {
  // State plats, ingrédients, sélection, warnings
  const [dishes, setDishes] = useState([])
  const [selectedDishes, setSelectedDishes] = useState([])
  const [ingredientsMap, setIngredientsMap] = useState({})
  const [allIngredients, setAllIngredients] = useState([])
  const [selectedIngredientId, setSelectedIngredientId] = useState("")
  const [manualQuantity, setManualQuantity] = useState("")
  const [warnings, setWarnings] = useState([])

  // Email + mealName + statut envoi
  const [emailInput, setEmailInput] = useState("")
  const [mealName, setMealName] = useState("")
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState("")

  // Chargement des plats et ingrédients au montage
  useEffect(() => {
    async function loadData() {
      // Charger les plats (avec leurs ingrédients et photos)
      const { data: userDishes, error } = await supabase
        .from("dishes")
        .select(`
          id, name, photo_url, description,
          dish_ingredients (
            quantity,
            ingredient:ingredients (id, name, photo_url, unit_of_measure, price_per_unit)
          )
        `)
      if (error) {
        console.error("Erreur chargement plats:", error)
        setDishes([])
      } else {
        // Format plat + ingrédients dans forme facile
        const formattedDishes = userDishes.map(dish => ({
          id: dish.id,
          name: dish.name,
          photo_url: dish.photo_url,
          description: dish.description,
          ingredients: dish.dish_ingredients.map(di => ({
            ingredient_id: di.ingredient.id,
            name: di.ingredient.name,
            photo_url: di.ingredient.photo_url,
            unit_of_measure: di.ingredient.unit_of_measure,
            price_per_unit: di.ingredient.price_per_unit,
            quantity: Number(di.quantity),
          })),
        }))
        setDishes(formattedDishes)
      }

      // Charger tous les ingrédients (pour ajout manuel)
      const { data: ingredients } = await supabase
        .from("ingredients")
        .select("id, name, photo_url, unit_of_measure, price_per_unit")
      setAllIngredients(ingredients || [])

      // TODO : charger allergies, maladies, membres si besoin pour warnings

      setWarnings([]) // Pour l'instant vide
    }
    loadData()
  }, [])

  // Met à jour la liste d’ingrédients cumulés quand on sélectionne plats
  useEffect(() => {
    const summary = {}
    selectedDishes.forEach(dish => {
      dish.ingredients.forEach(ing => {
        const key = ing.ingredient_id || ing.name
        if (!summary[key]) {
          summary[key] = { ...ing, quantity: 0 }
        }
        summary[key].quantity += Number(ing.quantity)
      })
    })
    setIngredientsMap(summary)
  }, [selectedDishes])

  // Gérer sélection/désélection plat
  const handleSelectDish = dish => {
    if (selectedDishes.find(d => d.id === dish.id)) {
      setSelectedDishes(prev => prev.filter(d => d.id !== dish.id))
    } else {
      setSelectedDishes(prev => [...prev, dish])
    }
  }

  // Ajouter un ingrédient manuellement à la liste cumulée
  const handleAddManualIngredient = () => {
    if (!selectedIngredientId || !manualQuantity) return
    const ing = allIngredients.find(i => i.id === Number(selectedIngredientId))
    if (!ing) return

    setIngredientsMap(prev => {
      const copy = { ...prev }
      if (!copy[ing.id]) {
        copy[ing.id] = {
          ingredient_id: ing.id,
          name: ing.name,
          photo_url: ing.photo_url,
          unit_of_measure: ing.unit_of_measure,
          price_per_unit: ing.price_per_unit || 0,
          quantity: 0,
        }
      }
      copy[ing.id].quantity += parseFloat(manualQuantity)
      return copy
    })
    setSelectedIngredientId("")
    setManualQuantity("")
  }

  // Génération PDF de la liste
  const generatePDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.setTextColor(0, 102, 51)
    doc.text("🛒 Liste de Courses Familiale", 14, 20)

    autoTable(doc, {
      startY: 30,
      head: [["Ingrédient", "Qté", "Unité", "Prix unitaire (FCFA)", "Total (FCFA)"]],
      body: Object.values(ingredientsMap).map(ing => [
        ing.name,
        ing.quantity,
        ing.unit_of_measure,
        ing.price_per_unit || "-",
        ((ing.price_per_unit || 0) * ing.quantity).toFixed(0),
      ]),
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [0, 102, 51], textColor: 255 },
    })

    const total = Object.values(ingredientsMap).reduce(
      (acc, ing) => acc + (ing.price_per_unit || 0) * ing.quantity,
      0
    )

    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(`Total estimé: ${total.toFixed(0)} FCFA`, 14, doc.lastAutoTable.finalY + 10)
    doc.save("liste_courses.pdf")
  }

  // Envoi mail avec EmailJS + message Gemini
  const handleSendEmail = async () => {
    setStatus("")
    setSending(true)
    if (!emailInput) {
      setStatus("Merci d'entrer un email valide.")
      setSending(false)
      return
    }
    if (!mealName) {
      setStatus("Merci d'entrer le nom du repas.")
      setSending(false)
      return
    }
    const user = await fetchUserByEmail(emailInput.trim())
    if (!user) {
      setStatus("Utilisateur introuvable avec cet email.")
      setSending(false)
      return
    }

    const message = await generateMessage(user.name, user.age, mealName)

    const templateParams = {
      to_email: emailInput,
      to_name: user.name,
      message_content: message,
      meal_name: mealName,
    }

    emailjs
      .send("service_4m24i8e", "template_4hhrrh5", templateParams, "8a8DDVizeSqPlf657")
      .then(() => {
        setStatus("Email envoyé avec succès !")
        setSending(false)
      })
      .catch(err => {
        console.error(err)
        setStatus("Erreur lors de l'envoi de l'email.")
        setSending(false)
      })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-green-700 mb-6 flex items-center gap-2">
        <FaShoppingCart /> Générateur de Liste de Courses (PDF) & Envoi Email
      </h2>

      {/* Sélection plats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {dishes.map(dish => (
          <div
            key={dish.id}
            onClick={() => handleSelectDish(dish)}
            className={`cursor-pointer border rounded-lg p-4 shadow-sm hover:shadow-md transition ${
              selectedDishes.find(d => d.id === dish.id)
                ? "bg-green-50 border-green-400"
                : "bg-white"
            }`}
          >
            {dish.photo_url && (
              <img
                src={dish.photo_url}
                alt={dish.name}
                className="w-full h-32 object-cover rounded mb-2"
              />
            )}
            <h4 className="font-semibold">{dish.name}</h4>
            <p className="text-sm text-gray-500">{dish.description}</p>
          </div>
        ))}
      </div>

      {/* Ajouter ingrédient manuel */}
      <div className="bg-white p-4 shadow rounded mb-6">
        <h3 className="text-lg font-semibold mb-3">➕ Ajouter un ingrédient manuellement</h3>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <select
            className="border p-2 rounded w-full md:w-1/3"
            value={selectedIngredientId}
            onChange={e => setSelectedIngredientId(e.target.value)}
          >
            <option value="">-- Sélectionner un ingrédient --</option>
            {allIngredients.map(ing => (
              <option key={ing.id} value={ing.id}>
                {ing.name} ({ing.unit_of_measure})
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Quantité"
            className="border p-2 rounded w-full md:w-1/3"
            value={manualQuantity}
            onChange={e => setManualQuantity(e.target.value)}
          />
          <button
            onClick={handleAddManualIngredient}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Ajouter
          </button>
        </div>
      </div>

      {/* Aperçu ingrédients */}
      {Object.keys(ingredientsMap).length > 0 && (
        <div className="bg-gray-100 p-4 rounded shadow mb-6">
          <h3 className="text-xl font-semibold mb-3">🧾 Ingrédients à acheter :</h3>
          <ul className="divide-y">
            {Object.values(ingredientsMap).map((ing, idx) => (
              <li key={idx} className="py-3 flex justify-between items-center gap-4">
                <div className="flex gap-3 items-center">
                  {ing.photo_url && (
                    <img
                      src={ing.photo_url}
                      alt={ing.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <strong>{ing.name}</strong> <br />
                    <small>
                      {ing.quantity} {ing.unit_of_measure}
                    </small>
                  </div>
                </div>
                <span className="font-semibold text-green-600">
                  {(ing.price_per_unit * ing.quantity || 0).toFixed(0)} FCFA
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 font-bold text-lg text-right">
            Total:{" "}
            {Object.values(ingredientsMap)
              .reduce((acc, ing) => acc + (ing.price_per_unit * ing.quantity || 0), 0)
              .toFixed(0)}{" "}
            FCFA
          </div>
        </div>
      )}

      {/* Générer PDF */}
      <button
        onClick={generatePDF}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded mb-10"
      >
        Télécharger la Liste en PDF
      </button>

      {/* Formulaire envoi mail */}
      <div className="max-w-md mx-auto border p-6 rounded shadow">
        <h3 className="text-2xl font-semibold mb-4">Envoyer un email au repas</h3>
        <input
          type="email"
          placeholder="Email du destinataire"
          value={emailInput}
          onChange={e => setEmailInput(e.target.value)}
          className="border p-2 rounded w-full mb-3"
        />
        <input
          type="text"
          placeholder="Nom du repas"
          value={mealName}
          onChange={e => setMealName(e.target.value)}
          className="border p-2 rounded w-full mb-3"
        />
        <button
          disabled={sending || !emailInput || !mealName}
          onClick={handleSendEmail}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          {sending ? "Envoi en cours..." : "Envoyer l'email"}
        </button>
        {status && <p className="mt-4">{status}</p>}
      </div>
    </div>
  )
}

export default ShoppingPage
