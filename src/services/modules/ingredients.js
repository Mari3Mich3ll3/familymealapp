import { supabase } from "../supabase.js"
import { getCurrentUser } from "./auth.js"

// =====================================================
// GESTION DES INGRÉDIENTS
// =====================================================

const normalizeUnit = (unit) => {
  const unitMap = {
    litres: "l",
    kilogrammes: "kg",
    grammes: "g",
    morceaux: "piece",
    pièces: "piece",
    cuillères: "tbsp",
    verres: "cup",
    bols: "cup",
  }
  return unitMap[unit] || unit || "piece"
}

export const saveIngredient = async (ingredientData) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    const categoryMap = {
      Légumes: "vegetable",
      Fruits: "fruit",
      Viandes: "meat",
      "Produits laitiers": "dairy",
      Féculents: "grain",
      Épices: "spice",
      Autres: "other",
    }

    const { data, error } = await supabase
      .from("ingredients")
      .insert({
        name: ingredientData.name,
        photo_url: ingredientData.photo,
        unit_of_measure: normalizeUnit(ingredientData.unit) || "piece",
        price_per_unit: ingredientData.averagePrice ? Number.parseFloat(ingredientData.averagePrice) : null,
        description: ingredientData.description,
        category: categoryMap[ingredientData.category] || "other",
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur sauvegarde ingrédient:", err)
    return { data: null, error: err }
  }
}

export const updateIngredient = async (ingredientId, ingredientData) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    const categoryMap = {
      Légumes: "vegetable",
      Fruits: "fruit",
      Viandes: "meat",
      "Produits laitiers": "dairy",
      Féculents: "grain",
      Épices: "spice",
      Autres: "other",
    }

    const { data, error } = await supabase
      .from("ingredients")
      .update({
        name: ingredientData.name,
        photo_url: ingredientData.photo,
        unit_of_measure: normalizeUnit(ingredientData.unit) || "piece",
        price_per_unit: ingredientData.averagePrice ? Number.parseFloat(ingredientData.averagePrice) : null,
        description: ingredientData.description,
        category: categoryMap[ingredientData.category] || "other",
      })
      .eq("id", ingredientId)
      .eq("created_by", user.id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur modification ingrédient:", err)
    return { data: null, error: err }
  }
}

export const deleteIngredient = async (ingredientId) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    const { error } = await supabase.from("ingredients").delete().eq("id", ingredientId).eq("created_by", user.id)

    if (error) throw error

    return { error: null }
  } catch (err) {
    console.error("Erreur suppression ingrédient:", err)
    return { error: err }
  }
}

export const getUserIngredients = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return { data: [], error: null }

    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur récupération ingrédients:", err)
    return { data: [], error: err }
  }
}
