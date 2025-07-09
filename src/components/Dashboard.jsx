"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getCurrentUser, signOut } from "../services/supabase"
import {
  FaLeaf,
  FaUsers,
  FaUtensils,
  FaCalendarAlt,
  FaShoppingCart,
  FaBoxes,
  FaSeedling,
  FaRobot,
  FaCog,
  FaHome,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaSun,
  FaMoon,
  FaDesktop,
  FaUser,
  FaChevronDown,
  FaBell,
  FaSearch,
  FaPlus,
} from "react-icons/fa"

// Import des pages
import OverviewPage from "./dashboard/OverviewPage"
import FamilyPage from "./dashboard/FamilyPage"
import MealsPage from "./dashboard/MealsPage"
import CalendarPage from "./dashboard/CalendarPage"
import ShoppingPage from "./dashboard/ShoppingPage"
import StocksPage from "./dashboard/StocksPage"
import IngredientsPage from "./dashboard/IngredientsPage"
import AIAssistantPage from "./dashboard/AIAssistantPage"
import SettingsPage from "./dashboard/SettingsPage"

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [theme, setTheme] = useState("system")
  const [resolvedTheme, setResolvedTheme] = useState("light")
  const navigate = useNavigate()

  const menuItems = [
    { id: "overview", label: "Tableau de Bord", icon: FaHome, badge: null },
    { id: "family", label: "Famille", icon: FaUsers, badge: "4" },
    { id: "meals", label: "Repas", icon: FaUtensils, badge: null },
    { id: "calendar", label: "Calendrier", icon: FaCalendarAlt, badge: "3" },
    { id: "shopping", label: "Courses", icon: FaShoppingCart, badge: "8" },
    { id: "stocks", label: "Stocks", icon: FaBoxes, badge: null },
    { id: "ingredients", label: "Ingrédients", icon: FaSeedling, badge: null },
    { id: "ai", label: "Assistant IA", icon: FaRobot, badge: "New" },
    { id: "settings", label: "Paramètres", icon: FaCog, badge: null },
  ]

  const themeOptions = [
    { value: "light", label: "Clair", icon: FaSun },
    { value: "dark", label: "Sombre", icon: FaMoon },
    { value: "system", label: "Système", icon: FaDesktop },
  ]

  // Fonction pour obtenir le thème système
  const getSystemTheme = () => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return "light"
  }

  // Fonction pour appliquer le thème
  const applyTheme = (newTheme) => {
    if (typeof window === "undefined") return

    const root = document.documentElement
    let actualTheme = newTheme

    if (newTheme === "system") {
      actualTheme = getSystemTheme()
    }

    root.classList.remove("dark")
    if (actualTheme === "dark") {
      root.classList.add("dark")
    }

    setResolvedTheme(actualTheme)
  }

  // Fonction pour changer le thème
  const changeTheme = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem("familymeal-theme", newTheme)
    applyTheme(newTheme)
  }

  // Initialisation du thème
  useEffect(() => {
    const savedTheme = localStorage.getItem("familymeal-theme") || "system"
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  // Écouter les changements de préférence système
  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system")
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        navigate("/connexion")
        return
      }
      setUser(currentUser)
    } catch (error) {
      console.error("Erreur lors de la vérification de l'utilisateur:", error)
      navigate("/connexion")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate("/")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "overview":
        return <OverviewPage />
      case "family":
        return <FamilyPage />
      case "meals":
        return <MealsPage />
      case "calendar":
        return <CalendarPage />
      case "shopping":
        return <ShoppingPage />
      case "stocks":
        return <StocksPage />
      case "ingredients":
        return <IngredientsPage />
      case "ai":
        return <AIAssistantPage />
      case "settings":
        return <SettingsPage />
      default:
        return <OverviewPage />
    }
  }

  const getCurrentPageInfo = () => {
    return menuItems.find((item) => item.id === currentPage) || menuItems[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
            <FaLeaf className="text-white text-3xl" />
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-32 mx-auto animate-pulse"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-24 mx-auto animate-pulse"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium mt-4">Chargement de FamilyMeal...</p>
        </div>
      </div>
    )
  }

  const CurrentPageIcon = getCurrentPageInfo().icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-300">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FaLeaf className="text-white text-xl" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  FamilyMeal
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gestion familiale</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <FaTimes className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Navigation
              </p>
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg transform scale-[1.02]"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-emerald-600 dark:hover:text-emerald-400"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`text-lg transition-colors duration-200 ${
                          isActive
                            ? "text-white"
                            : "text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                        }`}
                      />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          isActive
                            ? "bg-white/20 text-white"
                            : item.badge === "New"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <FaUser className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {user?.user_metadata?.full_name || "Utilisateur"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
                <FaChevronDown
                  className={`text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-slide-in-bottom">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Apparence</p>
                  </div>

                  {themeOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = theme === option.value
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          changeTheme(option.value)
                          setUserMenuOpen(false)
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors duration-200 ${
                          isSelected
                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <Icon className="text-sm" />
                        <span className="text-sm font-medium">{option.label}</span>
                        {isSelected && <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full"></div>}
                      </button>
                    )
                  })}

                  <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                    >
                      <FaSignOutAlt className="text-sm" />
                      <span className="text-sm font-medium">Se déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72 transition-all duration-300">
        {/* Top Bar */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <FaBars className="text-gray-600 dark:text-gray-300" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                  <CurrentPageIcon className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getCurrentPageInfo().label}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Gérez votre {getCurrentPageInfo().label.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2">
                <FaSearch className="text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none w-48"
                />
              </div>

              {/* Quick Actions */}
              <button className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors duration-200 shadow-lg">
                <FaPlus className="text-sm" />
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200">
                <FaBell className="text-lg" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Theme Indicator */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-xl">
                <div
                  className={`w-2 h-2 rounded-full ${resolvedTheme === "dark" ? "bg-blue-400" : "bg-yellow-400"}`}
                ></div>
                <span className="capitalize font-medium">{resolvedTheme}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {renderCurrentPage()}
          </div>
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default Dashboard
