"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase, TABLES, handleSupabaseError } from "../../services/supabase"

// Import des composants dashboard
import DashboardOverview from "./dashboard/DashboardOverview"
import DashboardMeals from "./dashboard/DashboardMeals"
import DashboardMembers from "./dashboard/DashboardMembers"
import DashboardStocks from "./dashboard/DashboardStocks"
import DashboardPlanning from "./dashboard/DashboardPlanning"
import DashboardShopping from "./dashboard/DashboardShopping"

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [family, setFamily] = useState(null)
  const [members, setMembers] = useState([])
  const [meals, setMeals] = useState([])
  const [stocks, setStocks] = useState([])
  const [mealPlans, setMealPlans] = useState([])
  const [shoppingLists, setShoppingLists] = useState([])
  const [activeTab, setActiveTab] = useState("overview")
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    initializeDashboard()
  }, [])

  const initializeDashboard = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) {
        navigate("/connexion")
        return
      }

      setUser(user)
      await loadFamilyData(user.id)
    } catch (error) {
      console.error("Erreur initialisation dashboard:", error)
      setError(handleSupabaseError(error))
    } finally {
      setLoading(false)
    }
  }

  const loadFamilyData = async (userId) => {
    try {
      // Charger la famille
      const { data: familyData, error: familyError } = await supabase
        .from(TABLES.FAMILIES)
        .select("*")
        .eq("user_id", userId)
        .single()

      if (familyError) throw familyError
      setFamily(familyData)

      // Charger les membres
      const { data: membersData, error: membersError } = await supabase
        .from(TABLES.FAMILY_MEMBERS)
        .select("*")
        .eq("family_id", familyData.id)

      if (membersError) throw membersError
      setMembers(membersData || [])

      // Charger les repas
      const { data: mealsData, error: mealsError } = await supabase
        .from(TABLES.MEALS)
        .select(`
          *,
          meal_ingredients (
            *,
            ingredients (*)
          )
        `)
        .eq("family_id", familyData.id)

      if (mealsError) throw mealsError
      setMeals(mealsData || [])

      // Charger les stocks
      const { data: stocksData, error: stocksError } = await supabase
        .from(TABLES.STOCKS)
        .select(`
          *,
          ingredients (*)
        `)
        .eq("family_id", familyData.id)

      if (stocksError) throw stocksError
      setStocks(stocksData || [])

      // Charger les planifications
      const { data: plansData, error: plansError } = await supabase
        .from(TABLES.MEAL_PLANS)
        .select(`
          *,
          meals (*)
        `)
        .eq("family_id", familyData.id)
        .order("date_repas", { ascending: true })

      if (plansError) throw plansError
      setMealPlans(plansData || [])

      // Charger les listes de courses
      const { data: shoppingData, error: shoppingError } = await supabase
        .from(TABLES.SHOPPING_LISTS)
        .select(`
          *,
          ingredients (*)
        `)
        .eq("family_id", familyData.id)
        .order("created_at", { ascending: false })

      if (shoppingError) throw shoppingError
      setShoppingLists(shoppingData || [])
    } catch (error) {
      console.error("Erreur chargement données famille:", error)
      throw error
    }
  }

  const showSuccess = (message) => {
    setSuccess(message)
    setError("")
    setTimeout(() => setSuccess(""), 3000)
  }

  const showError = (message) => {
    setError(message)
    setSuccess("")
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      navigate("/")
    } catch (error) {
      console.error("Erreur déconnexion:", error)
      showError("Erreur lors de la déconnexion")
    }
  }

  const renderTabContent = () => {
    const commonProps = {
      user,
      family,
      members,
      meals,
      stocks,
      mealPlans,
      shoppingLists,
      darkMode,
      loading,
      setLoading,
      showSuccess,
      showError,
      loadFamilyData,
    }

    switch (activeTab) {
      case "overview":
        return <DashboardOverview {...commonProps} />
      case "meals":
        return <DashboardMeals {...commonProps} />
      case "members":
        return <DashboardMembers {...commonProps} />
      case "stocks":
        return <DashboardStocks {...commonProps} />
      case "planning":
        return <DashboardPlanning {...commonProps} />
      case "shopping":
        return <DashboardShopping {...commonProps} />
      default:
        return <DashboardOverview {...commonProps} />
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="fas fa-leaf text-white text-2xl"></i>
          </div>
          <p className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
            Chargement de votre dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <header className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <i className="fas fa-leaf text-white"></i>
              </div>
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>FamilyMeal</h1>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Bonjour {user?.user_metadata?.prenom || user?.email} !
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? "bg-gray-700 text-yellow-400 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} transition-all`}
              >
                <i className={`fas ${darkMode ? "fa-sun" : "fa-moon"}`}></i>
              </button>
              <button
                onClick={handleLogout}
                className={`px-4 py-2 ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} rounded-lg transition-all flex items-center`}
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-4 flex items-center">
            <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 flex items-center">
            <i className="fas fa-check-circle text-green-500 mr-3"></i>
            <span className="text-green-700 font-medium">{success}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 overflow-x-auto">
            {[
              { id: "overview", label: "Vue d'ensemble", icon: "fa-tachometer-alt" },
              { id: "meals", label: "Repas", icon: "fa-utensils" },
              { id: "members", label: "Famille", icon: "fa-users" },
              { id: "stocks", label: "Stocks", icon: "fa-boxes" },
              { id: "planning", label: "Planning", icon: "fa-calendar-alt" },
              { id: "shopping", label: "Courses", icon: "fa-shopping-cart" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-green-500 text-white shadow-lg"
                    : darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <i className={`fas ${tab.icon}`}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu principal */}
        {renderTabContent()}
      </div>
    </div>
  )
}

export default Dashboard
