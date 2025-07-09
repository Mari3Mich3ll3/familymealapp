"use client"
import { useState, useEffect } from "react"
import {
  getUserDishes,
  getUserIngredients,
  getFamilyMembers,
  getUserFamilies,
  saveShoppingList,
  getUserShoppingLists,
  deleteShoppingList,
  getEnrichedDishes,
} from "../../services/supabase"
import {
  FaShoppingCart,
  FaPlus,
  FaTrash,
  FaDownload,
  FaEdit,
  FaSave,
  FaTimes,
  FaExclamationTriangle,
  FaCheck,
  FaSpinner,
  FaRobot,
} from "react-icons/fa"
import jsPDF from "jspdf"
import { GoogleGenerativeAI } from "@google/generative-ai"

const ShoppingPage = () => {
  const [dishes, setDishes] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [families, setFamilies] = useState([])
  const [allMembers, setAllMembers] = useState([])
  const [selectedDishes, setSelectedDishes] = useState([])
  const [shoppingList, setShoppingList] = useState([])
  const [savedLists, setSavedLists] = useState([])
  const [selectedFamily, setSelectedFamily] = useState("")
  const [listName, setListName] = useState("")
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [allergicMembers, setAllergicMembers] = useState([])

  // Configuration Gemini AI
  const genAI = new GoogleGenerativeAI("AIzaSyDdI0hIm4N4lZkqxRdlqMzb_T4-Bm8JTOU")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [dishesResult, ingredientsResult, familiesResult, listsResult] = await Promise.all([
        getEnrichedDishes(),
        getUserIngredients(),
        getUserFamilies(),
        getUserShoppingLists(),
      ])

      setDishes(dishesResult.data || [])
      setIngredients(ingredientsResult.data || [])
      setFamilies(familiesResult.data || [])
      setSavedLists(listsResult.data || [])

      // Charger tous les membres de toutes les familles
      const membersData = []
      for (const family of familiesResult.data || []) {
        const membersResult = await getFamilyMembers(family.id)
        if (membersResult.data) {
          membersData.push(
            ...membersResult.data.map((member) => ({
              ...member,
              family_name: family.name,
            })),
          )
        }
      }
      setAllMembers(membersData)
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateShoppingListWithAI = async () => {
    if (selectedDishes.length === 0) {
      alert("Veuillez sélectionner au moins un repas")
      return
    }

    setAiLoading(true)
    try {
      // Récupérer les plats sélectionnés avec leurs ingrédients
      const selectedDishesData = dishes.filter((dish) => selectedDishes.includes(dish.id))

      // Créer le contexte pour l'IA
      const context = {
        dishes: selectedDishesData,
        ingredients: ingredients,
        members: allMembers,
        familyMembers: selectedFamily
          ? allMembers.filter((member) => member.family_id === selectedFamily)
          : allMembers,
      }

      const prompt = `
        Tu es un expert en nutrition et organisation des courses. Génère une liste de courses optimisée.
        
        PLATS SÉLECTIONNÉS:
        ${selectedDishesData
          .map(
            (dish) => `
          - ${dish.name} (${dish.servings || 4} portions)
            Ingrédients: ${dish.ingredients?.map((ing) => `${ing.name} (${ing.quantity} ${ing.unit})`).join(", ")}
        `,
          )
          .join("")}
        
        MEMBRES DE LA FAMILLE:
        ${context.familyMembers
          .map(
            (member) => `
          - ${member.name} (${member.age} ans)
            Allergies: ${member.allergies?.join(", ") || "Aucune"}
            Maladies: ${member.diseases?.join(", ") || "Aucune"}
        `,
          )
          .join("")}
        
        INGRÉDIENTS DISPONIBLES EN STOCK:
        ${ingredients
          .map(
            (ing) => `
          - ${ing.name} (${ing.category}) - Prix: ${ing.price_per_unit || "Non renseigné"} XAF/${ing.unit_of_measure}
        `,
          )
          .join("")}
        
        INSTRUCTIONS:
        1. Calcule les quantités totales nécessaires pour tous les plats
        2. Classe les ingrédients par catégories (Viandes, Légumes, Tubercules, Épices, etc.)
        3. Indique les prix estimés en XAF (francs CFA)
        4. IMPORTANT: Signale les allergies potentielles avec le nom du membre concerné
        5. Donne des conseils d'achat (où acheter, comment choisir)
        6. Calcule le total estimé
        
        Réponds au format JSON suivant:
        {
          "categories": {
            "Viandes": [{"name": "Poulet", "quantity": "1 kg", "price": 2500, "notes": "Choisir du poulet fermier"}],
            "Légumes": [{"name": "Tomates", "quantity": "500g", "price": 500, "notes": ""}]
          },
          "allergies_alerts": [{"member": "Jean", "ingredient": "Arachides", "severity": "grave"}],
          "total_estimated": 15000,
          "shopping_tips": ["Aller au marché tôt le matin", "Négocier les prix en gros"],
          "optimizations": ["Acheter les légumes au marché central", "Prendre la viande chez Chez Rosa"]
        }
      `

      const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
      let aiResponse = null

      for (const modelName of models) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName })
          const result = await model.generateContent(prompt)
          const response = await result.response
          aiResponse = response.text()
          break
        } catch (error) {
          console.warn(`Erreur avec le modèle ${modelName}:`, error)
          if (error.message.includes("503")) {
            await new Promise((resolve) => setTimeout(resolve, 2000))
          }
        }
      }

      if (!aiResponse) {
        throw new Error("Tous les modèles IA ont échoué")
      }

      // Parser la réponse JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Format de réponse invalide")
      }

      const aiData = JSON.parse(jsonMatch[0])

      // Convertir en format de liste de courses
      const generatedList = []
      const allergies = []

      Object.entries(aiData.categories || {}).forEach(([category, items]) => {
        items.forEach((item) => {
          generatedList.push({
            id: Date.now() + Math.random(),
            name: item.name,
            quantity: item.quantity,
            category: category,
            price: item.price || 0,
            notes: item.notes || "",
            checked: false,
          })
        })
      })

      // Traiter les alertes d'allergies
      if (aiData.allergies_alerts) {
        aiData.allergies_alerts.forEach((alert) => {
          allergies.push({
            member: alert.member,
            ingredient: alert.ingredient,
            severity: alert.severity,
          })
        })
      }

      setShoppingList(generatedList)
      setAllergicMembers(allergies)

      // Afficher les conseils d'optimisation
      if (aiData.shopping_tips || aiData.optimizations) {
        const tips = [...(aiData.shopping_tips || []), ...(aiData.optimizations || [])]
        alert("Conseils d'achat IA:\n\n" + tips.join("\n"))
      }
    } catch (error) {
      console.error("Erreur génération IA:", error)
      alert("Erreur lors de la génération IA. Génération manuelle...")
      generateManualShoppingList()
    } finally {
      setAiLoading(false)
    }
  }

  const generateManualShoppingList = () => {
    const selectedDishesData = dishes.filter((dish) => selectedDishes.includes(dish.id))
    const ingredientMap = new Map()

    // Agréger les ingrédients
    selectedDishesData.forEach((dish) => {
      dish.ingredients?.forEach((ingredient) => {
        const key = ingredient.name.toLowerCase()
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)
          existing.quantity = parseFloat(existing.quantity) + parseFloat(ingredient.quantity || 1)
        } else {
          ingredientMap.set(key, {
            id: Date.now() + Math.random(),
            name: ingredient.name,
            quantity: ingredient.quantity || 1,
            unit: ingredient.unit || "unité",
            category: ingredient.category || "Divers",
            price: ingredient.price || 0,
            notes: "",
            checked: false,
          })
        }
      })
    })

    setShoppingList(Array.from(ingredientMap.values()))
  }

  const saveList = async () => {
    if (!listName.trim()) {
      alert("Veuillez donner un nom à votre liste")
      return
    }

    try {
      const listData = {
        name: listName,
        family_id: selectedFamily || null,
        items: shoppingList,
        total_estimated: shoppingList.reduce((sum, item) => sum + (item.price || 0), 0),
        dishes_included: selectedDishes,
      }

      await saveShoppingList(listData)
      alert("Liste sauvegardée avec succès!")
      loadData()
      setListName("")
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      alert("Erreur lors de la sauvegarde")
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()

    // Titre
    doc.setFontSize(20)
    doc.text("Liste de Courses FamilyMeal", 20, 30)

    // Informations générales
    doc.setFontSize(12)
    doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 20, 50)
    if (selectedFamily) {
      const family = families.find((f) => f.id === selectedFamily)
      doc.text(`Famille: ${family?.name || ""}`, 20, 60)
    }

    // Alertes allergies
    if (allergicMembers.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(255, 0, 0)
      doc.text("⚠️ ALERTES ALLERGIES", 20, 80)
      doc.setFontSize(10)
      allergicMembers.forEach((alert, index) => {
        doc.text(`• ${alert.member}: Allergie à ${alert.ingredient}`, 25, 90 + index * 10)
      })
      doc.setTextColor(0, 0, 0)
    }

    // Grouper par catégories
    const categories = {}
    shoppingList.forEach((item) => {
      const cat = item.category || "Divers"
      if (!categories[cat]) categories[cat] = []
      categories[cat].push(item)
    })

    let yPosition = allergicMembers.length > 0 ? 120 : 80
    let totalPrice = 0

    Object.entries(categories).forEach(([category, items]) => {
      // Titre de catégorie
      doc.setFontSize(14)
      doc.setTextColor(0, 100, 200)
      doc.text(category.toUpperCase(), 20, yPosition)
      yPosition += 15

      // Items de la catégorie
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      items.forEach((item) => {
        const line = `• ${item.name} - ${item.quantity} ${item.unit || ""}`
        const price = item.price ? ` - ${item.price} XAF` : ""
        const notes = item.notes ? ` (${item.notes})` : ""

        doc.text(line + price + notes, 25, yPosition)
        totalPrice += item.price || 0
        yPosition += 8

        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
      })

      yPosition += 10
    })

    // Total
    doc.setFontSize(14)
    doc.setTextColor(0, 150, 0)
    doc.text(`TOTAL ESTIMÉ: ${totalPrice.toLocaleString()} XAF`, 20, yPosition + 10)

    // Conseils
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text("Généré par FamilyMeal - Assistant IA Culinaire", 20, yPosition + 30)

    doc.save(`liste-courses-${new Date().toISOString().split("T")[0]}.pdf`)
  }

  const toggleItemCheck = (itemId) => {
    setShoppingList((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item)),
    )
  }

  const updateItemNotes = (itemId, notes) => {
    setShoppingList((prev) => prev.map((item) => (item.id === itemId ? { ...item, notes } : item)))
    setEditingItem(null)
  }

  const removeItem = (itemId) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== itemId))
  }

  const addCustomItem = () => {
    const name = prompt("Nom de l'ingrédient:")
    if (!name) return

    const quantity = prompt("Quantité:")
    const price = prompt("Prix estimé (XAF):")

    const newItem = {
      id: Date.now(),
      name,
      quantity: quantity || "1",
      unit: "unité",
      category: "Ajout manuel",
      price: parseFloat(price) || 0,
      notes: "",
      checked: false,
    }

    setShoppingList((prev) => [...prev, newItem])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <span className="ml-4 text-lg">Chargement des données...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <FaShoppingCart className="mr-3 text-green-600" />
            Listes de Courses Intelligentes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Génération automatique avec IA • Gestion des allergies • Export PDF
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sélection des repas */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">1. Sélectionner les repas</h2>

            {/* Sélection famille */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Famille (optionnel)
              </label>
              <select
                value={selectedFamily}
                onChange={(e) => setSelectedFamily(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Toutes les familles</option>
                {families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Liste des repas */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {dishes.map((dish) => (
                <div
                  key={dish.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedDishes.includes(dish.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    setSelectedDishes((prev) =>
                      prev.includes(dish.id) ? prev.filter((id) => id !== dish.id) : [...prev, dish.id],
                    )
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{dish.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {dish.category} • {dish.ingredients?.length || 0} ingrédients
                      </p>
                    </div>
                    {selectedDishes.includes(dish.id) && <FaCheck className="text-blue-500" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Boutons de génération */}
            <div className="mt-6 space-y-3">
              <button
                onClick={generateShoppingListWithAI}
                disabled={selectedDishes.length === 0 || aiLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {aiLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Génération IA...
                  </>
                ) : (
                  <>
                    <FaRobot className="mr-2" />
                    Générer avec IA
                  </>
                )}
              </button>

              <button
                onClick={generateManualShoppingList}
                disabled={selectedDishes.length === 0}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Génération manuelle
              </button>
            </div>
          </div>
        </div>

        {/* Liste de courses générée */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Liste de courses</h2>
              <div className="flex space-x-2">
                <button
                  onClick={addCustomItem}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Ajouter
                </button>
                <button
                  onClick={exportToPDF}
                  disabled={shoppingList.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  <FaDownload className="mr-2" />
                  PDF
                </button>
              </div>
            </div>

            {/* Alertes allergies */}
            {allergicMembers.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-center mb-2">
                  <FaExclamationTriangle className="text-red-500 mr-2" />
                  <h3 className="font-semibold text-red-800 dark:text-red-300">Alertes Allergies</h3>
                </div>
                {allergicMembers.map((alert, index) => (
                  <p key={index} className="text-red-700 dark:text-red-300 text-sm">
                    • <strong>{alert.member}</strong> est allergique à <strong>{alert.ingredient}</strong>
                  </p>
                ))}
              </div>
            )}

            {/* Liste des ingrédients par catégorie */}
            {shoppingList.length > 0 ? (
              <div>
                {Object.entries(
                  shoppingList.reduce((acc, item) => {
                    const category = item.category || "Divers"
                    if (!acc[category]) acc[category] = []
                    acc[category].push(item)
                    return acc
                  }, {}),
                ).map(([category, items]) => (
                  <div key={category} className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            item.checked
                              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                              : "border-gray-200 dark:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center flex-1">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => toggleItemCheck(item.id)}
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className={`font-medium ${item.checked ? "line-through text-gray-500" : ""}`}>
                                {item.name} - {item.quantity} {item.unit}
                              </div>
                              {item.price > 0 && (
                                <div className="text-sm text-green-600 dark:text-green-400">
                                  {item.price.toLocaleString()} XAF
                                </div>
                              )}
                              {item.notes && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 italic">"{item.notes}"</div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingItem(item.id)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Ajouter une note"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Supprimer"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Total estimé:</span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      {shoppingList.reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString()} XAF
                    </span>
                  </div>
                </div>

                {/* Sauvegarde */}
                <div className="mt-6 flex items-center space-x-4">
                  <input
                    type="text"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="Nom de la liste (ex: Courses semaine 1)"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={saveList}
                    disabled={!listName.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    <FaSave className="mr-2" />
                    Sauvegarder
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FaShoppingCart className="mx-auto text-6xl mb-4 opacity-50" />
                <p className="text-lg">Sélectionnez des repas pour générer votre liste de courses</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'édition de notes */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Ajouter une note</h3>
            <input
              type="text"
              defaultValue={shoppingList.find((item) => item.id === editingItem)?.notes || ""}
              placeholder="Ex: acheter chez Rosa, choisir bio..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  updateItemNotes(editingItem, e.target.value)
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <FaTimes className="mr-2" />
                Annuler
              </button>
              <button
                onClick={(e) => {
                  const input = e.target.closest(".fixed").querySelector("input")
                  updateItemNotes(editingItem, input.value)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FaSave className="mr-2" />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listes sauvegardées */}
      {savedLists.length > 0 && (
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Listes sauvegardées</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedLists.map((list) => (
                <div key={list.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{list.name}</h3>
                    <button
                      onClick={() => deleteShoppingList(list.id).then(() => loadData())}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {list.items?.length || 0} articles • {list.total_estimated?.toLocaleString() || 0} XAF
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(list.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShoppingPage
