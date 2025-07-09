"use client"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { getCurrentUser, supabase } from "./services/supabase"

// Import des pages
import PageAccueil from "./components/PageAccueil"
import Inscription from "./components/Inscription"
import Connexion from "./components/Connexion"
import Onboarding from "./components/Onboarding"
import Dashboard from "./components/Dashboard"

// Import du CSS
import "./index.css"

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier l'utilisateur au chargement
    checkUser()

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state changed:", event, session?.user?.email)

      if (event === "SIGNED_IN" && session?.user) {
        console.log("✅ Utilisateur connecté:", session.user.email)
        setUser(session.user)
      } else if (event === "SIGNED_OUT") {
        console.log("❌ Utilisateur déconnecté")
        setUser(null)
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        console.log("🔄 Token rafraîchi:", session.user.email)
        setUser(session.user)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      console.log("👤 Utilisateur actuel:", currentUser?.email || "Aucun")
      setUser(currentUser)
    } catch (error) {
      console.error("❌ Erreur lors de la vérification de l'utilisateur:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl">🌿</span>
          </div>
          <p className="text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  console.log("🎯 Rendu App - Utilisateur:", user?.email || "Non connecté")

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<PageAccueil />} />

          {/* Route d'inscription - accessible même si connecté pour permettre la redirection */}
          <Route path="/inscription" element={<Inscription />} />

          {/* Si utilisateur connecté, rediriger vers dashboard, sinon afficher connexion */}
          <Route path="/connexion" element={user ? <Navigate to="/dashboard" replace /> : <Connexion />} />

          {/* Onboarding accessible seulement si connecté */}
          <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/connexion" replace />} />

          {/* Dashboard accessible seulement si connecté */}
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/connexion" replace />} />

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
