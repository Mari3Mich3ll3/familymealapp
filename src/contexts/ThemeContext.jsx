"use client"
import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("system")
  const [resolvedTheme, setResolvedTheme] = useState("light")

  // Fonction pour obtenir le thème système
  const getSystemTheme = () => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return "light"
  }

  // Fonction pour appliquer le thème à Tailwind
  const applyTheme = (newTheme) => {
    if (typeof window === "undefined") return

    const root = document.documentElement
    let actualTheme = newTheme

    // Si c'est "system", on récupère le thème système
    if (newTheme === "system") {
      actualTheme = getSystemTheme()
    }

    // Supprimer la classe dark si elle existe
    root.classList.remove("dark")

    // Ajouter la classe dark si le thème est sombre
    if (actualTheme === "dark") {
      root.classList.add("dark")
    }

    // Mettre à jour le thème résolu
    setResolvedTheme(actualTheme)

    console.log(`Thème appliqué: ${actualTheme}`) // Debug
  }

  // Initialisation du thème
  useEffect(() => {
    const savedTheme = localStorage.getItem("familymeal-theme") || "system"
    console.log(`Thème sauvegardé: ${savedTheme}`) // Debug
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  // Fonction pour changer le thème
  const changeTheme = (newTheme) => {
    console.log(`Changement de thème vers: ${newTheme}`) // Debug
    setTheme(newTheme)
    localStorage.setItem("familymeal-theme", newTheme)
    applyTheme(newTheme)
  }

  // Écouter les changements de préférence système
  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = () => {
      console.log(`Changement système détecté`) // Debug
      if (theme === "system") {
        applyTheme("system")
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme: changeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
