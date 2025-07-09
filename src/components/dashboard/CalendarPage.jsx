"use client"
import { useState, useEffect } from "react"
import {
  getFamilyCalendar,
  getUserDishes,
  getUserFamilies,
  saveCalendarMeals,
  deleteCalendarMeal,
} from "../../services/supabase"
import { FaPlus, FaChevronLeft, FaChevronRight, FaFilePdf, FaEnvelope, FaTimes, FaSave } from "react-icons/fa"

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState("month") // day, week, month
  const [calendarMeals, setCalendarMeals] = useState([])
  const [dishes, setDishes] = useState([])
  const [families, setFamilies] = useState([])
  const [selectedFamily, setSelectedFamily] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [newMeal, setNewMeal] = useState({
    dish_id: "",
    meal_category: "",
    notes: "",
  })

  const categories = ["breakfast", "lunch", "dinner", "snack"]
  const categoryLabels = {
    breakfast: "Petit-déjeuner",
    lunch: "Déjeuner",
    dinner: "Dîner",
    snack: "Collation",
  }

  const categoryColors = {
    breakfast:
      "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
    lunch:
      "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700",
    dinner: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    snack:
      "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700",
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedFamily) {
      loadCalendarMeals()
    }
  }, [selectedFamily, currentDate, viewMode])

  const loadInitialData = async () => {
    try {
      const [familiesResult, dishesResult] = await Promise.all([getUserFamilies(), getUserDishes()])

      setFamilies(familiesResult.data || [])
      setDishes(dishesResult.data || [])

      if (familiesResult.data && familiesResult.data.length > 0) {
        setSelectedFamily(familiesResult.data[0])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCalendarMeals = async () => {
    if (!selectedFamily) return

    try {
      const startDate = getStartDate()
      const endDate = getEndDate()

      const result = await getFamilyCalendar(selectedFamily.id, startDate, endDate)
      setCalendarMeals(result.data || [])
    } catch (error) {
      console.error("Erreur lors du chargement du calendrier:", error)
    }
  }

  const getStartDate = () => {
    const date = new Date(currentDate)
    if (viewMode === "month") {
      return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0]
    } else if (viewMode === "week") {
      const startOfWeek = new Date(date)
      startOfWeek.setDate(date.getDate() - date.getDay())
      return startOfWeek.toISOString().split("T")[0]
    } else {
      return date.toISOString().split("T")[0]
    }
  }

  const getEndDate = () => {
    const date = new Date(currentDate)
    if (viewMode === "month") {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0]
    } else if (viewMode === "week") {
      const endOfWeek = new Date(date)
      endOfWeek.setDate(date.getDate() - date.getDay() + 6)
      return endOfWeek.toISOString().split("T")[0]
    } else {
      return date.toISOString().split("T")[0]
    }
  }

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + direction)
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + direction * 7)
    } else {
      newDate.setDate(newDate.getDate() + direction)
    }
    setCurrentDate(newDate)
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Jours du mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }

    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false })
    }

    return days
  }

  const getMealsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0]
    return calendarMeals.filter((meal) => meal.meal_date === dateStr)
  }

  const handleAddMeal = async () => {
    if (!newMeal.dish_id || !newMeal.meal_category || !selectedDate || !selectedFamily) return

    try {
      const mealData = {
        family_id: selectedFamily.id,
        dish_id: Number.parseInt(newMeal.dish_id),
        meal_date: selectedDate.toISOString().split("T")[0],
        meal_category: newMeal.meal_category,
        notes: newMeal.notes,
      }

      await saveCalendarMeals(
        [
          {
            dish: dishes.find((d) => d.id === Number.parseInt(newMeal.dish_id)),
            date: mealData.meal_date,
            category: mealData.meal_category,
          },
        ],
        selectedFamily.id,
      )

      await loadCalendarMeals()
      setShowAddModal(false)
      setNewMeal({ dish_id: "", meal_category: "", notes: "" })
      setSelectedDate(null)
    } catch (error) {
      console.error("Erreur lors de l'ajout du repas:", error)
    }
  }

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce repas ?")) return

    try {
      await deleteCalendarMeal(mealId)
      await loadCalendarMeals()
    } catch (error) {
      console.error("Erreur lors de la suppression du repas:", error)
    }
  }

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ]
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendrier des Repas</h1>
          <p className="text-gray-600 dark:text-gray-400">Planifiez vos repas pour la famille</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors flex items-center space-x-2">
            <FaFilePdf />
            <span>Exporter PDF</span>
          </button>
          <button className="bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600 transition-colors flex items-center space-x-2">
            <FaEnvelope />
            <span>Envoyer par Email</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Family Selection */}
          {families.length > 1 && (
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Famille:</label>
              <select
                value={selectedFamily?.id || ""}
                onChange={(e) => {
                  const family = families.find((f) => f.id === Number.parseInt(e.target.value))
                  setSelectedFamily(family)
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode */}
          <div className="flex items-center space-x-2">
            {["day", "week", "month"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-xl transition-colors ${
                  viewMode === mode
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {mode === "day" ? "Jour" : mode === "week" ? "Semaine" : "Mois"}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaChevronLeft className="text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
              {viewMode === "month"
                ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : currentDate.toLocaleDateString("fr-FR")}
            </h2>
            <button
              onClick={() => navigateDate(1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaChevronRight className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        {viewMode === "month" && (
          <>
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {dayNames.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((day, index) => {
                const mealsForDay = getMealsForDate(day.date)
                const isToday = day.date.toDateString() === new Date().toDateString()

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border border-gray-100 dark:border-gray-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      day.isCurrentMonth
                        ? "bg-white dark:bg-gray-800"
                        : "bg-gray-50 dark:bg-gray-700/30 text-gray-400 dark:text-gray-500"
                    } ${isToday ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : ""}`}
                    onClick={() => {
                      if (day.isCurrentMonth) {
                        setSelectedDate(day.date)
                        setShowAddModal(true)
                      }
                    }}
                  >
                    <div className={`text-sm font-medium mb-2 ${isToday ? "text-blue-600 dark:text-blue-400" : ""}`}>
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {mealsForDay.slice(0, 3).map((meal) => (
                        <div
                          key={meal.id}
                          className={`text-xs px-2 py-1 rounded border ${categoryColors[meal.meal_category]} cursor-pointer hover:shadow-sm transition-shadow`}
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle meal click
                          }}
                        >
                          <div className="font-medium truncate">{meal.dishes?.name || "Repas"}</div>
                          <div className="text-xs opacity-75">{categoryLabels[meal.meal_category]}</div>
                        </div>
                      ))}
                      {mealsForDay.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          +{mealsForDay.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Add meal button for mobile */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setSelectedDate(new Date())
              setShowAddModal(true)
            }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2 mx-auto"
          >
            <FaPlus />
            <span>Ajouter un Repas</span>
          </button>
        </div>
      </div>

      {/* Add Meal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ajouter un Repas</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewMeal({ dish_id: "", meal_category: "", notes: "" })
                  setSelectedDate(null)
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate?.toISOString().split("T")[0] || ""}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catégorie</label>
                <select
                  value={newMeal.meal_category}
                  onChange={(e) => setNewMeal({ ...newMeal, meal_category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {categoryLabels[category]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Plat</label>
                <select
                  value={newMeal.dish_id}
                  onChange={(e) => setNewMeal({ ...newMeal, dish_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner un plat</option>
                  {dishes.map((dish) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={newMeal.notes}
                  onChange={(e) => setNewMeal({ ...newMeal, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Notes sur le repas..."
                  rows="3"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewMeal({ dish_id: "", meal_category: "", notes: "" })
                  setSelectedDate(null)
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMeal}
                disabled={!newMeal.dish_id || !newMeal.meal_category || !selectedDate}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <FaSave />
                <span>Ajouter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarPage
