import { createClient } from "@supabase/supabase-js"

// Configuration Supabase - Remplacez par vos vraies valeurs
const supabaseUrl = "https://cyhzojhgcetcgzsusoxc.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aHpvamhnY2V0Y2d6c3Vzb3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTg2ODEsImV4cCI6MjA2NzQ3NDY4MX0.iN2zyaMdDa7pWKCSuokxMx5bcTLjNVtDw5CjsvJGpcY"

// Créer le client Supabase avec configuration pour désactiver la vérification email
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Désactiver la vérification email en développement
    flowType: "implicit",
  },
})

// Configuration des tables
export const TABLES = {
  USERS: "users",
  FAMILIES: "families",
  FAMILY_MEMBERS: "family_members",
  INGREDIENTS: "ingredients",
  MEALS: "meals",
  MEAL_INGREDIENTS: "meal_ingredients",
  MEAL_PLANS: "meal_plans",
  MEAL_CATEGORIES: "meal_categories",
}

// Configuration des buckets de stockage
export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
  PHOTOS: "photos",
  MEAL_IMAGES: "meal-images",
}

// Utilitaires pour la gestion d'erreurs
export const handleSupabaseError = (error) => {
  console.error("Erreur Supabase:", error)

  if (error.message.includes("duplicate key")) {
    return "Cette donnée existe déjà"
  }
  if (error.message.includes("foreign key")) {
    return "Référence invalide"
  }
  if (error.message.includes("not null")) {
    return "Champ obligatoire manquant"
  }
  if (error.message.includes("check constraint")) {
    return "Valeur non autorisée"
  }

  return error.message || "Une erreur est survenue"
}
export const handleSupabaseSuccess = (message) => {
  console.log("Succès Supabase:", message)
  return message || "Opération réussie"
}