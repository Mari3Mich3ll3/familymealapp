import { supabase } from "../supabase.js"
import { getCurrentUser } from "./auth.js"

// =====================================================
// GESTION DES STOCKS
// =====================================================

export const saveStock = async (stockData, familyId) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    // Vérifier que la famille appartient à l'utilisateur
    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("id", familyId)
      .eq("created_by", user.id)
      .single()

    if (!family) throw new Error("Famille non trouvée")

    // Récupérer l'ingrédient par ID (car front envoie l’ID maintenant)
    const { data: ingredient } = await supabase
      .from("ingredients")
      .select("id")
      .eq("id", stockData.ingredient)
      .eq("created_by", user.id)
      .single()

    if (!ingredient) throw new Error("Ingrédient non trouvé")

    const { data, error } = await supabase
      .from("stocks")
      .upsert({
        family_id: familyId,
        ingredient_id: ingredient.id,
        quantity: Number.parseFloat(stockData.quantity),
        expiration_date: stockData.expirationDate || null,
        storage_location: stockData.location,
        purchase_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur sauvegarde stock:", err)
    return { data: null, error: err }
  }
}

export const getFamilyStocks = async (familyId) => {
  try {
    const { data, error } = await supabase
      .from("stocks")
      .select(`
        *,
        ingredients (
          name,
          unit_of_measure,
          category
        )
      `)
      .eq("family_id", familyId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur récupération stocks:", err)
    return { data: [], error: err }
  }
}
