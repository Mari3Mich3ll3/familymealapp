import { supabase } from "../supabase.js"
import { getCurrentUser } from "./auth.js"

// =====================================================
// GESTION DES REPAS
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

export const saveDish = async (dishData) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    console.log("💾 Sauvegarde plat:", dishData)

    const categoryMap = {
      "Petit-déjeuner": "breakfast",
      Déjeuner: "lunch",
      Dîner: "dinner",
      Collation: "snack",
    }

    const { data: dish, error: dishError } = await supabase
      .from("dishes")
      .insert({
        name: dishData.name,
        photo_url: dishData.photo,
        description: dishData.description,
        category: categoryMap[dishData.category] || "lunch",
        preparation_time: dishData.preparationTime ? Number.parseInt(dishData.preparationTime) : null,
        cooking_time: dishData.cookingTime ? Number.parseInt(dishData.cookingTime) : null,
        servings: dishData.servings || 1,
        created_by: user.id,
      })
      .select()
      .single()

    if (dishError) throw dishError

    console.log("✅ Plat sauvegardé:", dish)

    // Sauvegarder les ingrédients
    if (dishData.ingredients && dishData.ingredients.length > 0) {
      console.log("💾 Sauvegarde ingrédients:", dishData.ingredients)
      const ingredientsResult = await saveDishIngredients(dish.id, dishData.ingredients)
      if (ingredientsResult.error) {
        console.error("❌ Erreur ingrédients:", ingredientsResult.error)
      }
    }

    return { data: dish, error: null }
  } catch (err) {
    console.error("Erreur sauvegarde plat:", err)
    return { data: null, error: err }
  }
}

export const updateDish = async (dishId, dishData) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    const categoryMap = {
      "Petit-déjeuner": "breakfast",
      Déjeuner: "lunch",
      Dîner: "dinner",
      Collation: "snack",
    }

    const { data: dish, error: dishError } = await supabase
      .from("dishes")
      .update({
        name: dishData.name,
        photo_url: dishData.photo,
        description: dishData.description,
        category: categoryMap[dishData.category] || "lunch",
        preparation_time: dishData.preparationTime ? Number.parseInt(dishData.preparationTime) : null,
        cooking_time: dishData.cookingTime ? Number.parseInt(dishData.cookingTime) : null,
        servings: dishData.servings || 1,
      })
      .eq("id", dishId)
      .eq("created_by", user.id)
      .select()
      .single()

    if (dishError) throw dishError

    // Supprimer les anciens ingrédients
    await supabase.from("dish_ingredients").delete().eq("dish_id", dishId)

    // Sauvegarder les nouveaux ingrédients
    if (dishData.ingredients && dishData.ingredients.length > 0) {
      await saveDishIngredients(dishId, dishData.ingredients)
    }

    return { data: dish, error: null }
  } catch (err) {
    console.error("Erreur modification plat:", err)
    return { data: null, error: err }
  }
}

export const deleteDish = async (dishId) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    const { error } = await supabase.from("dishes").delete().eq("id", dishId).eq("created_by", user.id)

    if (error) throw error

    return { error: null }
  } catch (err) {
    console.error("Erreur suppression plat:", err)
    return { error: err }
  }
}

export const getUserDishes = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return { data: [], error: null }

    const { data, error } = await supabase
      .from("dishes_with_ingredients")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur récupération plats:", err)
    return { data: [], error: err }
  }
}

const saveDishIngredients = async (dishId, ingredients) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    console.log("💾 Traitement ingrédients pour plat:", dishId, ingredients)

    for (const ingredient of ingredients) {
      try {
        console.log("💾 Traitement ingrédient:", ingredient)

        const normalizedUnit = normalizeUnit(ingredient.unit)

        const { data: existingIngredient } = await supabase
          .from("ingredients")
          .select("id")
          .eq("name", ingredient.name)
          .eq("created_by", user.id)
          .single()

        let ingredientId

        if (existingIngredient) {
          ingredientId = existingIngredient.id
          console.log("✅ Ingrédient existant trouvé:", ingredientId)
        } else {
          console.log("💾 Création nouvel ingrédient:", {
            name: ingredient.name,
            unit: normalizedUnit,
            price: ingredient.price,
          })

          const { data: newIngredient, error: ingredientError } = await supabase
            .from("ingredients")
            .insert({
              name: ingredient.name,
              unit_of_measure: normalizedUnit,
              category: "other",
              price_per_unit: ingredient.price ? Number.parseFloat(ingredient.price) : null,
              description: ingredient.description || "",
              photo_url: ingredient.photo || "",
              created_by: user.id,
            })
            .select()
            .single()

          if (ingredientError) {
            console.error("❌ Erreur création ingrédient:", ingredientError)
            continue
          }

          ingredientId = newIngredient.id
          console.log("✅ Nouvel ingrédient créé:", ingredientId)
        }

        const { error: linkError } = await supabase.from("dish_ingredients").insert({
          dish_id: dishId,
          ingredient_id: ingredientId,
          quantity: Number.parseFloat(ingredient.quantity) || 1,
        })

        if (linkError) {
          console.error("❌ Erreur liaison ingrédient-plat:", linkError)
          continue
        }

        console.log("✅ Ingrédient lié au plat:", ingredient.name)
      } catch (ingredientErr) {
        console.error("❌ Erreur traitement ingrédient individuel:", ingredient.name, ingredientErr)
        continue
      }
    }

    return { error: null }
  } catch (err) {
    console.error("Erreur sauvegarde ingrédients:", err)
    return { error: err }
  }
}
