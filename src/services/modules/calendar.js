import { supabase } from "../supabase.js"
import { getCurrentUser } from "./auth.js"

// =====================================================
// GESTION DU CALENDRIER
// =====================================================

export const saveCalendarMeals = async (meals, familyId) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    console.log("💾 Sauvegarde calendrier repas:", meals)

    const categoryMap = {
      "Petit-déjeuner": "breakfast",
      Déjeuner: "lunch",
      Dîner: "dinner",
      Collation: "snack",
      breakfast: "breakfast",
      lunch: "lunch",
      dinner: "dinner",
      snack: "snack",
    }

    const results = []
    for (const meal of meals) {
      console.log("💾 Sauvegarde repas:", meal)

      const mealCategory = categoryMap[meal.category] || meal.category.toLowerCase()

      const { data, error } = await supabase
        .from("meal_calendar")
        .insert({
          family_id: familyId,
          dish_id: meal.dish.id,
          meal_date: meal.date,
          meal_category: mealCategory,
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Erreur sauvegarde repas:", error)
        throw error
      }

      console.log("✅ Repas sauvegardé:", data)
      results.push(data)
    }

    return { data: results, error: null }
  } catch (err) {
    console.error("Erreur sauvegarde calendrier:", err)
    return { data: null, error: err }
  }
}

export const saveFamilyData = async (familyData) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    const { data, error } = await supabase
      .from("families")
      .insert({
        name: familyData.name,
        member_count: familyData.memberCount || 0,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur sauvegarde famille:", err)
    return { data: null, error: err }
  }
}

export const getFamilyCalendar = async (familyId, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from("meal_calendar")
      .select(`
        *,
        dishes (
          id,
          name,
          photo_url,
          category,
          description
        )
      `)
      .eq("family_id", familyId)
      .gte("meal_date", startDate)
      .lte("meal_date", endDate)
      .order("meal_date")

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur récupération calendrier:", err)
    return { data: [], error: err }
  }
}

export const updateCalendarMeal = async (mealId, mealData) => {
  try {
    const { data, error } = await supabase
      .from("meal_calendar")
      .update({
        dish_id: mealData.dish_id,
        meal_date: mealData.meal_date,
        meal_category: mealData.meal_category,
        notes: mealData.notes,
      })
      .eq("id", mealId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur modification repas calendrier:", err)
    return { data: null, error: err }
  }
}

export const deleteCalendarMeal = async (mealId) => {
  try {
    const { error } = await supabase.from("meal_calendar").delete().eq("id", mealId)

    if (error) throw error

    return { error: null }
  } catch (err) {
    console.error("Erreur suppression repas calendrier:", err)
    return { error: err }
  }
}
