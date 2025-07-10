"use client"
import { useState, useEffect } from "react"
import {
  supabase,
  getFamilyCalendar,
  getUserDishes,
  getUserFamilies,
  saveCalendarMeals,
  deleteCalendarMeal,
} from "../../services/supabase"
import { jsPDF } from "jspdf"
import { FaPlus, FaChevronLeft, FaChevronRight, FaFilePdf, FaTimes, FaSave } from "react-icons/fa"

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
    breakfast: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
    lunch: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700",
    dinner: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    snack: "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700",
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedFamily) {
      loadCalendarMeals()
    }
  }, [selectedFamily, currentDate, viewMode])

  async function loadInitialData() {
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

  async function loadCalendarMeals() {
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

    // Jours mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // Jours mois courant
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }

    // Jours mois suivant pour compléter grille
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
            notes: mealData.notes,
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
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ]

  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

  // Fonction pour exporter le PDF professionnel
  const exportCalendarToPDF = () => {
    const doc = new jsPDF()
    
    // Configuration des couleurs
    const primaryColor = [34, 197, 94] // Vert
    const secondaryColor = [107, 114, 128] // Gris
    const textColor = [31, 41, 55] // Gris foncé
    
    // En-tête avec logo/titre
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, 210, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('PLANNING FAMILIAL', 20, 25)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`, 20, 35)
    
    // Informations famille
    doc.setTextColor(...textColor)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('INFORMATIONS', 20, 55)
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Famille: ${selectedFamily?.name || 'Non sélectionnée'}`, 20, 65)
    doc.text(`Période: ${viewMode === 'month' ? 'Mensuel' : viewMode === 'week' ? 'Hebdomadaire' : 'Journalier'}`, 20, 72)
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, 79)
    doc.text(`Nombre de repas planifiés: ${calendarMeals.length}`, 20, 86)
    
    // Ligne de séparation
    doc.setDrawColor(...secondaryColor)
    doc.setLineWidth(0.5)
    doc.line(20, 92, 190, 92)
    
    // Titre section repas
    doc.setTextColor(...primaryColor)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('REPAS PLANIFIÉS', 20, 105)
    
    // Tableau des repas
    let yPosition = 120
    const lineHeight = 8
    const pageHeight = 280
    
    if (calendarMeals.length === 0) {
      doc.setTextColor(...secondaryColor)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'italic')
      doc.text('Aucun repas planifié pour cette période.', 20, yPosition)
    } else {
      // Grouper les repas par date
      const mealsByDate = {}
      calendarMeals.forEach(meal => {
        const date = meal.meal_date
        if (!mealsByDate[date]) {
          mealsByDate[date] = []
        }
        mealsByDate[date].push(meal)
      })
      
      // Afficher les repas groupés par date
      Object.keys(mealsByDate).sort().forEach(date => {
        // Vérifier si on a assez de place pour la date + au moins un repas
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = 20
        }
        
        // Date
        doc.setTextColor(...textColor)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        doc.text(formattedDate.toUpperCase(), 20, yPosition)
        yPosition += lineHeight + 2
        
        // Repas pour cette date
        mealsByDate[date].forEach(meal => {
          if (yPosition > pageHeight - 10) {
            doc.addPage()
            yPosition = 20
          }
          
          const dish = meal.dishes
          const category = categoryLabels[meal.meal_category] || meal.meal_category
          
          // Icône catégorie (cercle coloré)
          const categoryColorMap = {
            breakfast: [255, 193, 7],
            lunch: [40, 167, 69],
            dinner: [0, 123, 255],
            snack: [108, 117, 125]
          }
          const color = categoryColorMap[meal.meal_category] || [108, 117, 125]
          doc.setFillColor(...color)
          doc.circle(25, yPosition - 2, 2, 'F')
          
          // Texte repas
          doc.setTextColor(...textColor)
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.text(category, 32, yPosition)
          
          doc.setFont('helvetica', 'normal')
          doc.text(`: ${dish?.name || 'Repas supprimé'}`, 32 + doc.getTextWidth(category), yPosition)
          
          // Notes si présentes
          if (meal.notes) {
            yPosition += 5
            doc.setTextColor(...secondaryColor)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'italic')
            doc.text(`Note: ${meal.notes}`, 32, yPosition)
          }
          
          yPosition += lineHeight
        })
        
        yPosition += 3 // Espacement entre les dates
      })
    }
    
    // Pied de page
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setTextColor(...secondaryColor)
      doc.setFontSize(8)
      doc.text(`Page ${i} sur ${totalPages}`, 190, 290, { align: 'right' })
      doc.text('Généré par FamilyMeal Dashboard', 20, 290)
    }
    
    // Sauvegarde
    const fileName = `planning-${selectedFamily?.name || 'famille'}-${monthNames[currentDate.getMonth()]}-${currentDate.getFullYear()}.pdf`
    doc.save(fileName)
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendrier des Repas</h1>
          <p className="text-gray-600 dark:text-gray-400">Planifiez vos repas pour la famille</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={exportCalendarToPDF}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <FaFilePdf />
            <span>Exporter PDF</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
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
                    ? "bg-green-500 text-white shadow-md"
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Vue Mois */}
        {viewMode === "month" && (
          <>
            {/* En-tête jours */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  {day}
                </div>
              ))}
            </div>
            {/* Grille jours */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((day, index) => {
                const mealsForDay = getMealsForDate(day.date)
                const isToday = day.date.toDateString() === new Date().toDateString()
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:shadow-md rounded-lg ${
                      day.isCurrentMonth
                        ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        : "bg-gray-50 dark:bg-gray-700/30 text-gray-400 dark:text-gray-500"
                    } ${isToday ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-2 ring-blue-200 dark:ring-blue-800" : ""}`}
                    onClick={() => {
                      if (day.isCurrentMonth) {
                        setSelectedDate(day.date)
                        setShowAddModal(true)
                      }
                    }}
                  >
                    <div
                      className={`text-sm font-medium mb-2 ${
                        isToday ? "text-blue-600 dark:text-blue-400" : ""
                      }`}
                    >
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1 max-h-[100px] overflow-y-auto">
                      {mealsForDay.slice(0, 3).map((meal) => (
                        <div
                          key={meal.id}
                          className={`text-xs px-2 py-1 rounded border ${categoryColors[meal.meal_category]} cursor-pointer hover:shadow-sm transition-all duration-200 hover:scale-105`}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (
                              window.confirm(
                                `Supprimer le repas "${meal.dishes?.name || "Repas"}" ?`,
                              )
                            ) {
                              handleDeleteMeal(meal.id)
                            }
                          }}
                        >
                          <div className="font-medium truncate">{meal.dishes?.name || "Repas"}</div>
                          <div className="text-xs opacity-75">{categoryLabels[meal.meal_category]}</div>
                        </div>
                      ))}
                      {mealsForDay.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
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

        {/* Vue Semaine */}
        {viewMode === "week" && (
          <WeekView
            currentDate={currentDate}
            meals={calendarMeals}
            categories={categories}
            categoryLabels={categoryLabels}
            categoryColors={categoryColors}
            onDayClick={(date) => {
              setSelectedDate(date)
              setShowAddModal(true)
            }}
            onDeleteMeal={handleDeleteMeal}
          />
        )}

        {/* Vue Jour */}
        {viewMode === "day" && (
          <DayView
            currentDate={currentDate}
            meals={calendarMeals}
            categories={categories}
            categoryLabels={categoryLabels}
            categoryColors={categoryColors}
            onAddMeal={() => {
              setSelectedDate(currentDate)
              setShowAddModal(true)
            }}
            onDeleteMeal={handleDeleteMeal}
          />
        )}

        {/* Bouton Ajout repas */}
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

      {/* Modal ajout repas */}
      {showAddModal && (
        <AddMealModal
          selectedDate={selectedDate}
          newMeal={newMeal}
          setNewMeal={setNewMeal}
          setShowAddModal={setShowAddModal}
          handleAddMeal={handleAddMeal}
          categoryLabels={categoryLabels}
          dishes={dishes}
        />
      )}
    </div>
  )
}

// Composant Vue Semaine
const WeekView = ({
  currentDate,
  meals,
  categories,
  categoryLabels,
  categoryColors,
  onDayClick,
  onDeleteMeal,
}) => {
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    return [...Array(7).keys()].map((i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      return d
    })
  }

  const weekDays = getWeekDays()

  const getMealsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0]
    return meals.filter((meal) => meal.meal_date === dateStr)
  }

  return (
    <div>
      <div className="grid grid-cols-7 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        {weekDays.map((day) => {
          const mealsForDay = getMealsForDate(day)
          const isToday = day.toDateString() === new Date().toDateString()
          return (
            <div
              key={day.toISOString()}
              className={`p-4 border-r last:border-r-0 cursor-pointer transition-all duration-200 ${
                isToday
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                  : "bg-white dark:bg-gray-800"
              } hover:bg-gray-50 dark:hover:bg-gray-700/50 flex flex-col min-h-[200px]`}
              onClick={() => onDayClick(day)}
            >
              <div className="font-semibold mb-3 text-center text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg py-2">
                {day.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
              </div>
              <div className="flex flex-col space-y-2 overflow-y-auto max-h-[160px]">
                {mealsForDay.length === 0 && (
                  <div className="text-xs italic text-gray-400 dark:text-gray-500 text-center py-4">
                    Aucun repas planifié
                  </div>
                )}
                {mealsForDay.map((meal) => (
                  <div
                    key={meal.id}
                    className={`text-xs px-3 py-2 rounded-lg border ${categoryColors[meal.meal_category]} cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (
                        window.confirm(`Supprimer le repas "${meal.dishes?.name || "Repas"}" ?`)
                      ) {
                        onDeleteMeal(meal.id)
                      }
                    }}
                  >
                    <div className="font-medium truncate">{meal.dishes?.name || "Repas"}</div>
                    <div className="text-xs opacity-75 mt-1">{categoryLabels[meal.meal_category]}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Composant Vue Jour
const DayView = ({ currentDate, meals, categories, categoryLabels, categoryColors, onAddMeal, onDeleteMeal }) => {
  const dateStr = currentDate.toISOString().split("T")[0]
  const mealsForDay = meals.filter((meal) => meal.meal_date === dateStr)
  const isToday = currentDate.toDateString() === new Date().toDateString()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 min-h-[300px] shadow-sm">
      <h3 className={`text-xl font-bold mb-6 text-center p-4 rounded-lg ${isToday ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" : "text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"}`}>
        {currentDate.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </h3>
      
      {mealsForDay.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 text-lg mb-4">🍽️</div>
          <p className="text-center italic text-gray-500 dark:text-gray-400">Aucun repas planifié pour cette journée</p>
        </div>
      )}
      
      <div className="space-y-4 max-h-[300px] overflow-y-auto">
        {mealsForDay.map((meal) => (
          <div
            key={meal.id}
            className={`p-4 rounded-lg border-2 ${categoryColors[meal.meal_category]} flex justify-between items-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105`}
            onClick={() => {
              if (window.confirm(`Supprimer le repas "${meal.dishes?.name || "Repas"}" ?`)) {
                onDeleteMeal(meal.id)
              }
            }}
          >
            <div className="flex-1">
              <div className="font-bold text-lg">{meal.dishes?.name || "Repas"}</div>
              <div className="text-sm opacity-75 font-medium">{categoryLabels[meal.meal_category]}</div>
              {meal.notes && <div className="text-sm italic mt-2 opacity-70 bg-white/50 dark:bg-gray-800/50 p-2 rounded">{meal.notes}</div>}
            </div>
            <div className="text-2xl opacity-60">
              {meal.meal_category === 'breakfast' && '🌅'}
              {meal.meal_category === 'lunch' && '☀️'}
              {meal.meal_category === 'dinner' && '🌙'}
              {meal.meal_category === 'snack' && '🍪'}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <button
          onClick={onAddMeal}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          ➕ Ajouter un Repas
        </button>
      </div>
    </div>
  )
}

// Modal ajout repas
const AddMealModal = ({ selectedDate, newMeal, setNewMeal, setShowAddModal, handleAddMeal, categoryLabels, dishes }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">🍽️ Ajouter un Repas</h2>
          <button
            onClick={() => {
              setShowAddModal(false)
              setNewMeal({ dish_id: "", meal_category: "", notes: "" })
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📅 Date</label>
            <input
              type="date"
              value={selectedDate?.toISOString().split("T")[0] || ""}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              readOnly
            />
            <small className="text-xs italic text-gray-500 dark:text-gray-400">Sélectionnez une date dans le calendrier</small>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🕐 Catégorie</label>
            <select
              value={newMeal.meal_category}
              onChange={(e) => setNewMeal({ ...newMeal, meal_category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Sélectionner une catégorie</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🍽️ Plat</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📝 Notes (optionnel)</label>
            <textarea
              value={newMeal.notes}
              onChange={(e) => setNewMeal({ ...newMeal, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ajoutez des notes sur ce repas..."
              rows="3"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={() => {
              setShowAddModal(false)
              setNewMeal({ dish_id: "", meal_category: "", notes: "" })
            }}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleAddMeal}
            disabled={!newMeal.dish_id || !newMeal.meal_category || !selectedDate}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transform hover:-translate-y-0.5"
          >
            <FaSave />
            <span>Ajouter</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CalendarPage
