"use client"
import { useState, useEffect } from "react"
import {
  getUserDishes,
  getUserFamilies,
  getFamilyMembers,
  saveCalendarMeals,
  getFamilyCalendar,
  updateCalendarMeal,
  deleteCalendarMeal,
} from "../../services/supabase"
import { FaPlus, FaTrash, FaChevronLeft, FaChevronRight, FaDownload, FaTimes, FaSave } from "react-icons/fa"
import jsPDF from "jspdf"
import "jspdf-autotable"

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dishes, setDishes] = useState([])
  const [families, setFamilies] = useState([])
  const [selectedFamily, setSelectedFamily] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [calendarMeals, setCalendarMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMealModal, setShowMealModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedMealType, setSelectedMealType] = useState("breakfast")
  const [selectedDish, setSelectedDish] = useState("")
  const [selectedMembers, setSelectedMembers] = useState([])
  const [editingMeal, setEditingMeal] = useState(null)

  const mealTypes = [
    { value: "breakfast", label: "Petit-déjeuner", color: "bg-yellow-100 text-yellow-800" },
    { value: "lunch", label: "Déjeuner", color: "bg-green-100 text-green-800" },
    { value: "dinner", label: "Dîner", color: "bg-blue-100 text-blue-800" },
    { value: "snack", label: "Collation", color: "bg-purple-100 text-purple-800" },
  ]

  const weekDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
  const months = [
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

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedFamily) {
      loadFamilyMembers()
      loadCalendarMeals()
    }
  }, [selectedFamily, currentDate])

  const loadInitialData = async () => {
    try {
      const [dishesResult, familiesResult] = await Promise.all([getUserDishes(), getUserFamilies()])

      setDishes(dishesResult.data || [])
      setFamilies(familiesResult.data || [])

      if (familiesResult.data && familiesResult.data.length > 0) {
        setSelectedFamily(familiesResult.data[0])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadFamilyMembers = async () => {
    if (!selectedFamily) return
    try {
      const result = await getFamilyMembers(selectedFamily.id)
      setFamilyMembers(result.data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error)
    }
  }

  const loadCalendarMeals = async () => {
    if (!selectedFamily) return
    try {
      const weekDays = getDaysInWeek()
      const startOfWeek = weekDays[0].date
      const endOfWeek = weekDays[6].date

      const result = await getFamilyCalendar(
        selectedFamily.id,
        startOfWeek.toISOString().split("T")[0],
        endOfWeek.toISOString().split("T")[0],
      )

      setCalendarMeals(result.data || [])
    } catch (error) {
      console.error("Erreur lors du chargement du calendrier:", error)
    }
  }

  const getDaysInWeek = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push({ date, isCurrentWeek: true })
    }
    return days
  }

  const getMealsForDate = (date) => {
    const dateString = date.toISOString().split("T")[0]
    return calendarMeals.filter((meal) => meal.date === dateString)
  }

  const getMealTypeInfo = (type) => {
    return mealTypes.find((mt) => mt.value === type) || mealTypes[0]
  }

  const openMealModal = (date, mealType = "breakfast") => {
    setSelectedDate(date)
    setSelectedMealType(mealType)
    setSelectedDish("")
    setSelectedMembers([])
    setEditingMeal(null)
    setShowMealModal(true)
  }

  const editMeal = (meal) => {
    setSelectedDate(new Date(meal.date))
    setSelectedMealType(meal.meal_type)
    setSelectedDish(meal.dish_id.toString())
    setSelectedMembers(meal.family_members || [])
    setEditingMeal(meal)
    setShowMealModal(true)
  }

  const saveMeal = async () => {
    if (!selectedDate || !selectedDish || !selectedFamily) return

    try {
      const mealData = {
        family_id: selectedFamily.id,
        date: selectedDate.toISOString().split("T")[0],
        meal_type: selectedMealType,
        dish_id: Number.parseInt(selectedDish),
        family_members: selectedMembers,
      }

      if (editingMeal) {
        await updateCalendarMeal(editingMeal.id, mealData)
      } else {
        await saveCalendarMeals([mealData])
      }

      await loadCalendarMeals()
      setShowMealModal(false)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
    }
  }

  const deleteMeal = async (mealId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce repas ?")) return

    try {
      await deleteCalendarMeal(mealId)
      await loadCalendarMeals()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
    }
  }

  const exportCalendarToPDF = () => {
    try {
      const doc = new jsPDF()

      // Titre
      doc.setFontSize(20)
      doc.setTextColor(34, 197, 94)
      doc.text(`Planning ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`, 20, 30)

      // Informations
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text(`Famille: ${selectedFamily?.name || "Non sélectionnée"}`, 20, 45)
      doc.text(`Généré le: ${new Date().toLocaleDateString("fr-FR")}`, 20, 55)

      // Préparer les données du calendrier
      const tableData = []
      const days = getDaysInWeek().filter((day) => day.isCurrentWeek)

      days.forEach((day) => {
        const meals = getMealsForDate(day.date)
        if (meals.length > 0) {
          meals.forEach((meal) => {
            const dish = dishes.find((d) => d.id === meal.dish_id)
            const mealTypeInfo = getMealTypeInfo(meal.meal_type)
            const members =
              meal.family_members
                ?.map((id) => {
                  const member = familyMembers.find((m) => m.id === id)
                  return member?.name || "Inconnu"
                })
                .join(", ") || "Toute la famille"

            tableData.push([day.date.getDate().toString(), mealTypeInfo.label, dish?.name || "Repas supprimé", members])
          })
        }
      })

      if (tableData.length > 0) {
        doc.autoTable({
          head: [["Jour", "Type", "Repas", "Membres"]],
          body: tableData,
          startY: 70,
          styles: {
            fontSize: 10,
            cellPadding: 5,
          },
          headStyles: {
            fillColor: [34, 197, 94],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
        })
      } else {
        doc.setFontSize(12)
        doc.setTextColor(128, 128, 128)
        doc.text("Aucun repas planifié ce mois-ci.", 20, 80)
      }

      const fileName = `planning-${months[currentDate.getMonth()]}-${currentDate.getFullYear()}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error)
    }
  }

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + direction * 7)
    setCurrentDate(newDate)
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendrier des repas</h1>
          <p className="text-gray-600 dark:text-gray-400">Planifiez vos repas familiaux</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportCalendarToPDF}
            disabled={!selectedFamily}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaDownload />
            <span>Exporter PDF</span>
          </button>
        </div>
      </div>

      {/* Family Selection */}
      {families.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
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
        </div>
      )}

      {/* Calendar */}
      {selectedFamily && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaChevronLeft className="text-gray-600 dark:text-gray-400" />
            </button>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Semaine du {getDaysInWeek()[0].date.toLocaleDateString("fr-FR")} au{" "}
              {getDaysInWeek()[6].date.toLocaleDateString("fr-FR")}
            </h2>

            <button
              onClick={() => navigateWeek(1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaChevronRight className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {weekDays.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInWeek().map((day, index) => {
                const meals = getMealsForDate(day.date)
                const isToday = day.date.toDateString() === new Date().toDateString()

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 ${
                      isToday ? "ring-2 ring-green-500" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${
                          day.isCurrentWeek ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"
                        } ${isToday ? "text-green-600 dark:text-green-400" : ""}`}
                      >
                        {day.date.getDate()}
                      </span>
                      {day.isCurrentWeek && (
                        <button
                          onClick={() => openMealModal(day.date)}
                          className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          title="Ajouter un repas"
                        >
                          <FaPlus className="text-xs" />
                        </button>
                      )}
                    </div>

                    {/* Meals for this day */}
                    <div className="space-y-1">
                      {meals.map((meal) => {
                        const dish = dishes.find((d) => d.id === meal.dish_id)
                        const mealTypeInfo = getMealTypeInfo(meal.meal_type)

                        return (
                          <div
                            key={meal.id}
                            className={`p-2 rounded text-xs ${mealTypeInfo.color} cursor-pointer hover:opacity-80 transition-opacity`}
                            onClick={() => editMeal(meal)}
                            title={`${mealTypeInfo.label}: ${dish?.name || "Repas supprimé"}`}
                          >
                            <div className="font-medium truncate">{dish?.name || "Repas supprimé"}</div>
                            <div className="text-xs opacity-75">{mealTypeInfo.label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Meal Modal */}
      {showMealModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingMeal ? "Modifier le repas" : "Ajouter un repas"}
              </h2>
              <button
                onClick={() => setShowMealModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate?.toISOString().split("T")[0] || ""}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Meal Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type de repas</label>
                <select
                  value={selectedMealType}
                  onChange={(e) => setSelectedMealType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {mealTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dish Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Repas</label>
                <select
                  value={selectedDish}
                  onChange={(e) => setSelectedDish(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner un repas</option>
                  {dishes.map((dish) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Family Members */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Membres de la famille
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {familyMembers.map((member) => (
                    <label key={member.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, member.id])
                          } else {
                            setSelectedMembers(selectedMembers.filter((id) => id !== member.id))
                          }
                        }}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between space-x-3 mt-6">
              {editingMeal && (
                <button
                  onClick={() => deleteMeal(editingMeal.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center space-x-2"
                >
                  <FaTrash />
                  <span>Supprimer</span>
                </button>
              )}
              <div className="flex space-x-3 ml-auto">
                <button
                  onClick={() => setShowMealModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={saveMeal}
                  disabled={!selectedDate || !selectedDish}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <FaSave />
                  <span>{editingMeal ? "Modifier" : "Ajouter"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarPage
