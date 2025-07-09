import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://cyhzojhgcetcgzsusoxc.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aHpvamhnY2V0Y2d6c3Vzb3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTg2ODEsImV4cCI6MjA2NzQ3NDY4MX0.iN2zyaMdDa7pWKCSuokxMx5bcTLjNVtDw5CjsvJGpcY"

export const supabase = createClient(supabaseUrl, supabaseKey)

// =====================================================
// AUTHENTIFICATION
// =====================================================
export {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  updatePassword,
} from "./modules/auth.js"

// =====================================================
// GESTION DES FAMILLES
// =====================================================
export {
  createFamily,
  getUserFamilies,
  saveFamilyMember,
  saveFamilyMembers,
  updateFamilyMember,
  deleteFamilyMember,
  getFamilyMembers,
  getMemberDetails,
  getAllergies,
  getDiseases,
} from "./modules/family.js"

// =====================================================
// GESTION DES REPAS
// =====================================================
export {
  saveDish,
  updateDish,
  deleteDish,
  getUserDishes,
} from "./modules/meals.js"

// =====================================================
// GESTION DES INGRÉDIENTS
// =====================================================
export {
  saveIngredient,
  updateIngredient,
  deleteIngredient,
  getUserIngredients,
} from "./modules/ingredients.js"

// =====================================================
// GESTION DES STOCKS
// =====================================================
export {
  saveStock,
  getFamilyStocks,
} from "./modules/stocks.js"

// =====================================================
// GESTION DU CALENDRIER
// =====================================================
export {
  saveCalendarMeals,
  saveFamilyData,
  getFamilyCalendar,
  updateCalendarMeal,
  deleteCalendarMeal,
} from "./modules/calendar.js"

// =====================================================
// FONCTIONS UTILITAIRES AJOUTÉES
// =====================================================

// Fonction pour récupérer tous les membres de toutes les familles
export const getAllFamilyMembers = async () => {
  try {
    const { getCurrentUser } = await import("./modules/auth.js")
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    // Récupérer toutes les familles de l'utilisateur
    const { data: families, error: familiesError } = await supabase
      .from("families")
      .select("id, name")
      .eq("user_id", user.id)

    if (familiesError) throw familiesError

    // Récupérer tous les membres de toutes les familles
    const allMembers = []
    for (const family of families || []) {
      const { data: members, error: membersError } = await supabase
        .from("family_members")
        .select("*")
        .eq("family_id", family.id)

      if (!membersError && members) {
        allMembers.push(
          ...members.map((member) => ({
            ...member,
            family_name: family.name,
          })),
        )
      }
    }

    return { data: allMembers, error: null }
  } catch (error) {
    console.error("Erreur lors de la récupération des membres:", error)
    return { data: null, error }
  }
}

// Fonctions pour les listes de courses
export const saveShoppingList = async (listData) => {
  try {
    const { getCurrentUser } = await import("./modules/auth.js")
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    const { data, error } = await supabase
      .from("shopping_lists")
      .insert([
        {
          ...listData,
          user_id: user.id,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la liste:", error)
    return { data: null, error }
  }
}

export const getUserShoppingLists = async (familyId = null) => {
  try {
    const { getCurrentUser } = await import("./modules/auth.js")
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    let query = supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (familyId) {
      query = query.eq("family_id", familyId)
    }

    const { data, error } = await query

    return { data, error }
  } catch (error) {
    console.error("Erreur lors du chargement des listes:", error)
    return { data: null, error }
  }
}

export const updateShoppingList = async (listId, listData) => {
  try {
    const { data, error } = await supabase.from("shopping_lists").update(listData).eq("id", listId).select().single()

    return { data, error }
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la liste:", error)
    return { data: null, error }
  }
}

export const deleteShoppingList = async (listId) => {
  try {
    const { data, error } = await supabase.from("shopping_lists").delete().eq("id", listId)

    return { data, error }
  } catch (error) {
    console.error("Erreur lors de la suppression de la liste:", error)
    return { data: null, error }
  }
}

// Fonction pour enrichir les plats avec les ingrédients complets
export const getEnrichedDishes = async () => {
  try {
    const { getCurrentUser } = await import("./modules/auth.js")
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    const { data: dishes, error: dishesError } = await supabase.from("dishes").select("*").eq("user_id", user.id)

    if (dishesError) throw dishesError

    const { data: ingredients, error: ingredientsError } = await supabase
      .from("ingredients")
      .select("*")
      .eq("user_id", user.id)

    if (ingredientsError) throw ingredientsError

    // Enrichir les plats avec les données complètes des ingrédients
    const enrichedDishes = dishes.map((dish) => ({
      ...dish,
      ingredients:
        dish.ingredients?.map((dishIngredient) => {
          const fullIngredient = ingredients.find(
            (ing) =>
              ing.name.toLowerCase() === dishIngredient.name?.toLowerCase() || ing.id === dishIngredient.ingredient_id,
          )

          return {
            ...dishIngredient,
            photo: fullIngredient?.photo_url || dishIngredient.photo,
            description: fullIngredient?.description || dishIngredient.description,
            price: dishIngredient.price || fullIngredient?.price_per_unit || "",
            ingredient_id: fullIngredient?.id,
          }
        }) || [],
    }))

    return { data: enrichedDishes, error: null }
  } catch (error) {
    console.error("Erreur lors de l'enrichissement des plats:", error)
    return { data: null, error }
  }
}

// Ajouter cette fonction pour une meilleure gestion des repas du calendrier
export const saveCalendarMeal = async (mealData) => {
  try {
    const { data, error } = await supabase
      .from("calendar_meals")
      .insert([mealData])
      .select(`
        *,
        dishes:dish_id (
          id,
          name,
          description,
          photo_url,
          category,
          preparation_time,
          cooking_time,
          servings
        )
      `)
      .single()

    return { data, error }
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du repas:", error)
    return { data: null, error }
  }
}
