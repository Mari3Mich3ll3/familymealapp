"use client"
import { useState, useEffect } from "react"
import { getUserFamilies, getUserDishes, getUserIngredients, getFamilyStocks } from "../../services/supabase"
import {
  FaUsers,
  FaUtensils,
  FaLeaf,
  FaBoxes,
  FaPlus,
  FaCalendarAlt,
  FaShoppingCart,
  FaChartLine,
  FaExclamationTriangle,
  FaClock,
  FaHeart,
} from "react-icons/fa"

const OverviewPage = () => {
  const [stats, setStats] = useState({
    families: 0,
    members: 0,
    dishes: 0,
    ingredients: 0,
    stocks: 0,
    expiringSoon: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [quickActions, setQuickActions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Charger les statistiques
      const [familiesResult, dishesResult, ingredientsResult] = await Promise.all([
        getUserFamilies(),
        getUserDishes(),
        getUserIngredients(),
      ])

      let totalMembers = 0
      let totalStocks = 0
      let expiringSoon = 0

      if (familiesResult.data && familiesResult.data.length > 0) {
        // Calculer le nombre total de membres et stocks
        for (const family of familiesResult.data) {
          totalMembers += family.member_count || 0
          const stocksResult = await getFamilyStocks(family.id)
          if (stocksResult.data) {
            totalStocks += stocksResult.data.length
            // Compter les articles qui expirent dans les 7 prochains jours
            const now = new Date()
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            expiringSoon += stocksResult.data.filter((stock) => {
              if (!stock.expiration_date) return false
              const expirationDate = new Date(stock.expiration_date)
              return expirationDate <= weekFromNow && expirationDate >= now
            }).length
          }
        }
      }

      setStats({
        families: familiesResult.data?.length || 0,
        members: totalMembers,
        dishes: dishesResult.data?.length || 0,
        ingredients: ingredientsResult.data?.length || 0,
        stocks: totalStocks,
        expiringSoon,
      })

      // Activité récente simulée
      setRecentActivity([
        {
          id: 1,
          type: "meal",
          title: "Nouveau repas ajouté",
          description: "Spaghetti Bolognaise",
          time: "Il y a 2 heures",
          icon: FaUtensils,
          color: "text-green-500",
        },
        {
          id: 2,
          type: "family",
          title: "Membre ajouté",
          description: "Marie a été ajoutée à la famille",
          time: "Il y a 1 jour",
          icon: FaUsers,
          color: "text-blue-500",
        },
        {
          id: 3,
          type: "shopping",
          title: "Liste de courses générée",
          description: "15 articles pour cette semaine",
          time: "Il y a 2 jours",
          icon: FaShoppingCart,
          color: "text-purple-500",
        },
        {
          id: 4,
          type: "stock",
          title: "Stock mis à jour",
          description: "Tomates fraîches ajoutées",
          time: "Il y a 3 jours",
          icon: FaBoxes,
          color: "text-orange-500",
        },
      ])

      // Actions rapides
      setQuickActions([
        {
          id: 1,
          title: "Ajouter un repas",
          description: "Créer une nouvelle recette",
          icon: FaUtensils,
          color: "bg-green-500",
          action: () => console.log("Ajouter repas"),
        },
        {
          id: 2,
          title: "Planifier la semaine",
          description: "Organiser les repas",
          icon: FaCalendarAlt,
          color: "bg-blue-500",
          action: () => console.log("Planifier"),
        },
        {
          id: 3,
          title: "Faire les courses",
          description: "Générer une liste",
          icon: FaShoppingCart,
          color: "bg-purple-500",
          action: () => console.log("Courses"),
        },
        {
          id: 4,
          title: "Vérifier les stocks",
          description: "Voir les expirations",
          icon: FaBoxes,
          color: "bg-orange-500",
          action: () => console.log("Stocks"),
        },
      ])
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Familles",
      value: stats.families,
      icon: FaUsers,
      color: "bg-blue-500",
      change: "+2 ce mois",
    },
    {
      title: "Membres",
      value: stats.members,
      icon: FaHeart,
      color: "bg-pink-500",
      change: "+1 cette semaine",
    },
    {
      title: "Repas",
      value: stats.dishes,
      icon: FaUtensils,
      color: "bg-green-500",
      change: "+5 ce mois",
    },
    {
      title: "Ingrédients",
      value: stats.ingredients,
      icon: FaLeaf,
      color: "bg-emerald-500",
      change: "+12 ce mois",
    },
    {
      title: "Articles en stock",
      value: stats.stocks,
      icon: FaBoxes,
      color: "bg-orange-500",
      change: "Mis à jour",
    },
    {
      title: "Expire bientôt",
      value: stats.expiringSoon,
      icon: FaExclamationTriangle,
      color: "bg-red-500",
      change: "À vérifier",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vue d'ensemble</h1>
          <p className="text-gray-600 dark:text-gray-400">Bienvenue sur votre tableau de bord FamilyMeal</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Dernière mise à jour</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="text-white text-xl" />
                </div>
                <FaChartLine className="text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
                <p className="text-xs text-green-600 dark:text-green-400">{card.change}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaPlus className="mr-2 text-green-500" />
              Actions rapides
            </h2>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mr-3`}>
                      <Icon className="text-white text-sm" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{action.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaClock className="mr-2 text-blue-500" />
              Activité récente
            </h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.color} bg-opacity-10`}
                    >
                      <Icon className={`text-sm ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{activity.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {stats.expiringSoon > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 text-xl mr-3" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">Attention requise</h3>
              <p className="text-red-700 dark:text-red-400">
                {stats.expiringSoon} article{stats.expiringSoon > 1 ? "s" : ""} expire
                {stats.expiringSoon > 1 ? "nt" : ""} bientôt. Vérifiez vos stocks pour éviter le gaspillage.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OverviewPage
