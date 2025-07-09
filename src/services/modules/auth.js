import { supabase } from "../supabase.js"

// =====================================================
// AUTHENTIFICATION
// =====================================================

export const signUp = async (email, password, userData) => {
  try {
    console.log("🔧 Début inscription Supabase...")
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: undefined,
      },
    })

    if (error) {
      console.error("❌ Erreur lors de l'inscription:", error)
      return { data: null, error }
    }

    console.log("✅ Inscription Supabase réussie:", data)

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

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

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
