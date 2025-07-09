import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://cyhzojhgcetcgzsusoxc.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aHpvamhnY2V0Y2d6c3Vzb3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTg2ODEsImV4cCI6MjA2NzQ3NDY4MX0.iN2zyaMdDa7pWKCSuokxMx5bcTLjNVtDw5CjsvJGpcY"

export const supabase = createClient(supabaseUrl, supabaseKey)

// Fonction pour l'inscription SANS confirmation d'email
export const signUp = async (email, password, userData) => {
  try {
    console.log("🔧 Début inscription Supabase...")

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: undefined, // Pas de confirmation par email
      },
    })

    if (error) {
      console.error("❌ Erreur lors de l'inscription:", error)
      return { data: null, error }
    }

    console.log("✅ Inscription Supabase réussie:", data)

    // Si pas de session, essayer de se connecter immédiatement
    if (data.user && !data.session) {
      console.log("🔄 Pas de session, tentative de connexion automatique...")

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error("❌ Erreur connexion automatique:", signInError)
        return { data, error: signInError }
      }

      console.log("✅ Connexion automatique réussie:", signInData)
      return { data: signInData, error: null }
    }

    return { data, error: null }
  } catch (err) {
    console.error("💥 Erreur inattendue lors de l'inscription:", err)
    return { data: null, error: err }
  }
}

// Fonction pour la connexion
export const signIn = async (email, password) => {
  try {
    console.log("🔧 Tentative de connexion...")

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("❌ Erreur lors de la connexion:", error)
      return { data: null, error }
    }

    console.log("✅ Connexion réussie:", data)
    return { data, error: null }
  } catch (err) {
    console.error("💥 Erreur inattendue lors de la connexion:", err)
    return { data: null, error: err }
  }
}

// Fonction pour la déconnexion
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Fonction pour obtenir l'utilisateur actuel
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("🔍 getCurrentUser:", user?.email || "Aucun")
    return user
  } catch (error) {
    console.error("❌ Erreur getCurrentUser:", error)
    return null
  }
}

// Fonction pour obtenir le profil utilisateur complet
export const getUserProfile = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (error) {
      console.error("❌ Erreur lors de la récupération du profil:", error)
      return null
    }

    return data
  } catch (err) {
    console.error("💥 Erreur inattendue lors de la récupération du profil:", err)
    return null
  }
}

// Fonction pour mettre à jour le profil utilisateur
export const updateUserProfile = async (profileData) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: profileData,
    })

    if (error) {
      console.error("❌ Erreur lors de la mise à jour du profil:", error)
      return { data: null, error }
    }

    console.log("✅ Profil mis à jour:", data)
    return { data, error: null }
  } catch (err) {
    console.error("💥 Erreur inattendue lors de la mise à jour du profil:", err)
    return { data: null, error: err }
  }
}

// Fonction pour changer le mot de passe
export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error("❌ Erreur lors du changement de mot de passe:", error)
      return { data: null, error }
    }

    console.log("✅ Mot de passe changé:", data)
    return { data, error: null }
  } catch (err) {
    console.error("💥 Erreur inattendue lors du changement de mot de passe:", err)
    return { data: null, error: err }
  }
}

// =====================================================
// GESTION DES FAMILLES
// =====================================================
export const createFamily = async (familyData) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    const { data, error } = await supabase
      .from("families")
      .insert({
        name: familyData.name,
        created_by: user.id,
        member_count: familyData.memberCount || 0,
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur création famille:", err)
    return { data: null, error: err }
  }
}

export const getUserFamilies = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return { data: [], error: null }

    const { data, error } = await supabase
      .from("families")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur récupération familles:", err)
    return { data: [], error: err }
  }
}

// =====================================================
// GESTION DES MEMBRES DE FAMILLE
// =====================================================
export const saveFamilyMember = async (memberData, familyId) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    console.log("💾 Sauvegarde membre:", memberData)

    // Vérifier que la famille appartient à l'utilisateur
    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("id", familyId)
      .eq("created_by", user.id)
      .single()

    if (!family) throw new Error("Famille non trouvée")

    const { data, error } = await supabase
      .from("family_members")
      .insert({
        family_id: familyId,
        name: memberData.name,
        gender: memberData.gender,
        age: memberData.age ? Number.parseInt(memberData.age) : null,
        photo_url: memberData.photo,
        email: memberData.email,
        is_sick: memberData.isSick || false,
      })
      .select()
      .single()

    if (error) throw error

    console.log("✅ Membre sauvegardé:", data)

    // Sauvegarder les allergies
    if (memberData.allergies && memberData.allergies.length > 0) {
      await saveMemberAllergies(data.id, memberData.allergies)
    }

    // Sauvegarder les allergies personnalisées
    if (memberData.customAllergies && memberData.customAllergies.trim()) {
      const customAllergiesList = memberData.customAllergies
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a)
      if (customAllergiesList.length > 0) {
        await saveMemberAllergies(data.id, customAllergiesList)
      }
    }

    // Sauvegarder les maladies (texte libre)
    if (memberData.diseases && memberData.diseases.trim()) {
      await saveMemberDiseasesText(data.id, memberData.diseases)
    }

    return { data, error: null }
  } catch (err) {
    console.error("Erreur sauvegarde membre:", err)
    return { data: null, error: err }
  }
}

// Fonction pour sauvegarder plusieurs membres
export const saveFamilyMembers = async (members, familyId) => {
  try {
    const results = []
    for (const member of members) {
      const result = await saveFamilyMember(member, familyId)
      if (result.error) {
        console.error("❌ Erreur membre:", member.name, result.error)
        // Continuer avec les autres membres même si un échoue
        continue
      }
      results.push(result.data)
    }
    return { data: results, error: null }
  } catch (err) {
    console.error("Erreur sauvegarde membres:", err)
    return { data: null, error: err }
  }
}

export const updateFamilyMember = async (memberId, memberData) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    const { data, error } = await supabase
      .from("family_members")
      .update({
        name: memberData.name,
        gender: memberData.gender,
        age: memberData.age ? Number.parseInt(memberData.age) : null,
        photo_url: memberData.photo,
        email: memberData.email,
        is_sick: memberData.diseases && memberData.diseases.length > 0,
      })
      .eq("id", memberId)
      .select()
      .single()

    if (error) throw error

    // Supprimer les anciennes allergies et maladies
    await supabase.from("member_allergies").delete().eq("member_id", memberId)
    await supabase.from("member_diseases").delete().eq("member_id", memberId)

    // Sauvegarder les nouvelles allergies
    if (memberData.allergies && memberData.allergies.length > 0) {
      await saveMemberAllergies(memberId, memberData.allergies)
    }

    // Sauvegarder les nouvelles maladies
    if (memberData.diseases && memberData.diseases.length > 0) {
      await saveMemberDiseases(memberId, memberData.diseases)
    }

    return { data, error: null }
  } catch (err) {
    console.error("Erreur modification membre:", err)
    return { data: null, error: err }
  }
}

export const deleteFamilyMember = async (memberId) => {
  try {
    const { error } = await supabase.from("family_members").delete().eq("id", memberId)

    if (error) throw error

    return { error: null }
  } catch (err) {
    console.error("Erreur suppression membre:", err)
    return { error: err }
  }
}

export const getFamilyMembers = async (familyId) => {
  try {
    const { data, error } = await supabase
      .from("family_members_complete")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at")

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur récupération membres:", err)
    return { data: [], error: err }
  }
}

const saveMemberAllergies = async (memberId, allergies) => {
  try {
    for (const allergyName of allergies) {
      // Récupérer ou créer l'allergie
      let { data: allergy } = await supabase.from("allergies").select("id").eq("name", allergyName).single()

      if (!allergy) {
        const { data: newAllergy } = await supabase
          .from("allergies")
          .insert({ name: allergyName, is_common: false })
          .select()
          .single()
        allergy = newAllergy
      }

      // Lier l'allergie au membre
      await supabase.from("member_allergies").insert({
        member_id: memberId,
        allergy_id: allergy.id,
        severity: "moderate",
      })
    }
  } catch (err) {
    console.error("Erreur sauvegarde allergies:", err)
  }
}

const saveMemberDiseasesText = async (memberId, diseasesText) => {
  try {
    console.log("💾 Sauvegarde maladies texte:", diseasesText)

    // Utiliser la fonction SQL pour gérer les maladies
    const { error } = await supabase.rpc("handle_member_diseases", {
      p_member_id: memberId,
      p_diseases_text: diseasesText,
    })

    if (error) {
      console.error("❌ Erreur RPC handle_member_diseases:", error)
      // Fallback: créer une maladie générique
      await createGenericDisease(memberId, diseasesText)
    }
  } catch (err) {
    console.error("Erreur sauvegarde maladies texte:", err)
    // Fallback: créer une maladie générique
    await createGenericDisease(memberId, diseasesText)
  }
}

const createGenericDisease = async (memberId, diseasesText) => {
  try {
    // Créer une maladie générique
    const { data: disease, error: diseaseError } = await supabase
      .from("diseases")
      .insert({
        name: diseasesText.substring(0, 100), // Limiter la longueur
        description: "Maladie ajoutée par l'utilisateur",
      })
      .select()
      .single()

    if (diseaseError) {
      console.error("❌ Erreur création maladie:", diseaseError)
      return
    }

    // Lier la maladie au membre
    await supabase.from("member_diseases").insert({
      member_id: memberId,
      disease_id: disease.id,
    })

    console.log("✅ Maladie générique créée:", disease.name)
  } catch (err) {
    console.error("Erreur création maladie générique:", err)
  }
}

const saveMemberDiseases = async (memberId, diseases) => {
  try {
    for (const diseaseName of diseases) {
      // Récupérer ou créer la maladie
      let { data: disease } = await supabase.from("diseases").select("id").eq("name", diseaseName).single()

      if (!disease) {
        const { data: newDisease } = await supabase.from("diseases").insert({ name: diseaseName }).select().single()
        disease = newDisease
      }

      // Lier la maladie au membre
      await supabase.from("member_diseases").insert({
        member_id: memberId,
        disease_id: disease.id,
      })
    }
  } catch (err) {
    console.error("Erreur sauvegarde maladies:", err)
  }
}

// =====================================================
// GESTION DES REPAS
// =====================================================
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
        // Ne pas faire échouer tout le plat pour des erreurs d'ingrédients
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

        // Normaliser l'unité
        const normalizedUnit = normalizeUnit(ingredient.unit)

        // Créer ou récupérer l'ingrédient
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
          // Créer un nouvel ingrédient
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
            continue // Passer à l'ingrédient suivant
          }

          ingredientId = newIngredient.id
          console.log("✅ Nouvel ingrédient créé:", ingredientId)
        }

        // Lier l'ingrédient au plat
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
        continue // Continuer avec les autres ingrédients
      }
    }

    return { error: null }
  } catch (err) {
    console.error("Erreur sauvegarde ingrédients:", err)
    return { error: err }
  }
}

// Fonction pour normaliser les unités
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

// =====================================================
// GESTION DES INGRÉDIENTS
// =====================================================
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

    // Récupérer l'ingrédient
    const { data: ingredient } = await supabase
      .from("ingredients")
      .select("id")
      .eq("name", stockData.ingredient)
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

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================
export const getAllergies = async () => {
  try {
    const { data, error } = await supabase.from("allergies").select("*").eq("is_common", true).order("name")

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur récupération allergies:", err)
    return { data: [], error: err }
  }
}

export const getDiseases = async () => {
  try {
    const { data, error } = await supabase.from("diseases").select("*").order("name")

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur récupération maladies:", err)
    return { data: [], error: err }
  }
}

export const saveCalendarMeals = async (meals, familyId) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    console.log("💾 Sauvegarde calendrier repas:", meals)

    // Mapping des catégories français -> anglais
    const categoryMap = {
      "Petit-déjeuner": "breakfast",
      Déjeuner: "lunch",
      Dîner: "dinner",
      Collation: "snack",
      // Aussi supporter les valeurs déjà en anglais
      breakfast: "breakfast",
      lunch: "lunch",
      dinner: "dinner",
      snack: "snack",
    }

    // Sauvegarder chaque repas individuellement dans meal_calendar
    const results = []
    for (const meal of meals) {
      console.log("💾 Sauvegarde repas:", meal)

      // Convertir la catégorie en anglais
      const mealCategory = categoryMap[meal.category] || meal.category.toLowerCase()

      const { data, error } = await supabase
        .from("meal_calendar")
        .insert({
          family_id: familyId,
          dish_id: meal.dish.id,
          meal_date: meal.date,
          meal_category: mealCategory, // Utiliser la catégorie convertie
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

// =====================================================
// GESTION DU CALENDRIER
// =====================================================
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
