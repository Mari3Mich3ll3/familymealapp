"use client"
import { useState, useEffect } from "react"
import { getUserDishes, saveDish, updateDish, deleteDish, getUserIngredients } from "../../services/supabase"
import {
  FaUtensils,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaClock,
  FaUsers,
  FaCamera,
  FaSave,
  FaTimes,
  FaRobot,
  FaLeaf,
  FaHeart,
} from "react-icons/fa"

const MealsPage = () => {
  const [dishes, setDishes] = useState([])
  const [filteredDishes, setFilteredDishes] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDishModal, setShowDishModal] = useState(false)
  const [editingDish, setEditingDish] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [dishForm, setDishForm] = useState({
    name: "",
    description: "",
    category: "lunch",
    photo: "",
    preparationTime: "",
    cookingTime: "",
    servings: 4,
    ingredients: [],
  })

  const categories = [
    { value: "all", label: "Tous les repas", icon: FaUtensils },
    { value: "breakfast", label: "Petit-déjeuner", icon: FaUtensils },
    { value: "lunch", label: "Déjeuner", icon: FaUtensils },
    { value: "dinner", label: "Dîner", icon: FaUtensils },
    { value: "snack", label: "Collation", icon: FaHeart },
  ]

  const categoryLabels = {
    breakfast: "Petit-déjeuner",
    lunch: "Déjeuner",
    dinner: "Dîner",
    snack: "Collation",
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterDishes()
  }, [dishes, searchTerm, selectedCategory])

  const loadData = async () => {
    try {
      const [dishesResult, ingredientsResult] = await Promise.all([getUserDishes(), getUserIngredients()])

      if (dishesResult.data) {
        setDishes(dishesResult.data)
      }

      if (ingredientsResult.data) {
        setIngredients(ingredientsResult.data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterDishes = () => {
    let filtered = dishes

    if (searchTerm) {
      filtered = filtered.filter(
        (dish) =>
          dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dish.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((dish) => dish.category === selectedCategory)
    }

    setFilteredDishes(filtered)
  }

  const handleSaveDish = async () => {
    try {
      if (editingDish) {
        const result = await updateDish(editingDish.id, dishForm)
        if (result.data) {
          loadData()
        }
      } else {
        const result = await saveDish(dishForm)
        if (result.data) {
          loadData()
        }
      }
      setShowDishModal(false)
      resetDishForm()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du plat:", error)
    }
  }

  const handleDeleteDish = async (dishId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce plat ?")) {
      try {
        await deleteDish(dishId)
        loadData()
      } catch (error) {
        console.error("Erreur lors de la suppression du plat:", error)
      }
    }
  }

  const handleEditDish = (dish) => {
    setEditingDish(dish)
    setDishForm({
      name: dish.name || "",
      description: dish.description || "",
      category: dish.category || "lunch",
      photo: dish.photo_url || "",
      preparationTime: dish.preparation_time?.toString() || "",
      cookingTime: dish.cooking_time?.toString() || "",
      servings: dish.servings || 4,
      ingredients: dish.ingredients || [],
    })
    setShowDishModal(true)
  }

  const resetDishForm = () => {
    setEditingDish(null)
    setDishForm({
      name: "",
      description: "",
      category: "lunch",
      photo: "",
      preparationTime: "",
      cookingTime: "",
      servings: 4,
      ingredients: [],
    })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setDishForm({ ...dishForm, photo: e.target.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const addIngredient = () => {
    setDishForm({
      ...dishForm,
      ingredients: [...dishForm.ingredients, { name: "", quantity: "", unit: "g" }],
    })
  }

  const updateIngredient = (index, field, value) => {
    const updatedIngredients = dishForm.ingredients.map((ingredient, i) =>
      i === index ? { ...ingredient, [field]: value } : ingredient,
    )
    setDishForm({ ...dishForm, ingredients: updatedIngredients })
  }

  const removeIngredient = (index) => {
    const updatedIngredients = dishForm.ingredients.filter((_, i) => i !== index)
    setDishForm({ ...dishForm, ingredients: updatedIngredients })
  }

  const generateAIRecipe = () => {
    // Simulation de génération IA
    const aiRecipes = [
      {
        name: "Spaghetti Carbonara",
        description: "Un classique italien crémeux et savoureux",
        category: "dinner",
        preparationTime: "15",
        cookingTime: "20",
        servings: 4,
        ingredients: [
          { name: "Spaghetti", quantity: "400", unit: "g" },
          { name: "Lardons", quantity: "200", unit: "g" },
          { name: "Œufs", quantity: "3", unit: "pièces" },
          { name: "Parmesan", quantity: "100", unit: "g" },
        ],
      },
      {
        name: "Salade César",
        description: "Salade fraîche avec croûtons et parmesan",
        category: "lunch",
        preparationTime: "10",
        cookingTime: "0",
        servings: 2,
        ingredients: [
          { name: "Salade romaine", quantity: "1", unit: "pièce" },
          { name: "Poulet grillé", quantity: "200", unit: "g" },
          { name: "Croûtons", quantity: "50", unit: "g" },
          { name: "Parmesan", quantity: "50", unit: "g" },
        ],
      },
    ]

    const randomRecipe = aiRecipes[Math.floor(Math.random() * aiRecipes.length)]
    setDishForm(randomRecipe)
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des repas</h1>
          <p className="text-gray-600 dark:text-gray-400">Créez et gérez vos recettes favorites</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateAIRecipe}
            className="bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600 transition-colors flex items-center space-x-2"
          >
            <FaRobot />
            <span>Générer avec IA</span>
          </button>
          <button
            onClick={() => {
              resetDishForm()
              setShowDishModal(true)
            }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
          >
            <FaPlus />
            <span>Nouveau repas</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un repas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <FaFilter className="text-gray-400" />
            <div className="flex space-x-2">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2 ${
                      selectedCategory === category.value
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <Icon className="text-sm" />
                    <span>{category.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDishes.map((dish) => (
          <div
            key={dish.id}
            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className="relative h-48">
              {dish.photo_url ? (
                <img
                  src={dish.photo_url || "/placeholder.svg"}
                  alt={dish.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <FaUtensils className="text-white text-4xl" />
                </div>
              )}
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={() => handleEditDish(dish)}
                  className="p-2 bg-white dark:bg-gray-800 text-blue-500 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDeleteDish(dish.id)}
                  className="p-2 bg-white dark:bg-gray-800 text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <FaTrash />
                </button>
              </div>
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full text-sm font-medium">
                  {categoryLabels[dish.category] || dish.category}
                </span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{dish.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                {dish.description || "Aucune description"}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  {dish.preparation_time && (
                    <div className="flex items-center space-x-1">
                      <FaClock />
                      <span>{dish.preparation_time}min</span>
                    </div>
                  )}
                  {dish.servings && (
                    <div className="flex items-center space-x-1">
                      <FaUsers />
                      <span>{dish.servings}</span>
                    </div>
                  )}
                </div>
                {dish.ingredients && dish.ingredients.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <FaLeaf />
                    <span>{dish.ingredients.length} ingrédients</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDishes.length === 0 && (
        <div className="text-center py-12">
          <FaUtensils className="text-gray-400 text-4xl mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || selectedCategory !== "all"
              ? "Aucun repas ne correspond à vos critères"
              : "Aucun repas créé pour le moment"}
          </p>
          <button
            onClick={() => {
              resetDishForm()
              setShowDishModal(true)
            }}
            className="bg-green-500 text-white px-6 py-2 rounded-xl hover:bg-green-600 transition-colors"
          >
            Créer votre premier repas
          </button>
        </div>
      )}

      {/* Dish Modal */}
      {showDishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingDish ? "Modifier le repas" : "Nouveau repas"}
              </h2>
              <button
                onClick={() => setShowDishModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Photo du plat
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24">
                      {dishForm.photo ? (
                        <img
                          src={dishForm.photo || "/placeholder.svg"}
                          alt="Aperçu"
                          className="w-full h-full rounded-xl object-cover border-2 border-green-200 dark:border-green-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                          <FaUtensils className="text-white text-xl" />
                        </div>
                      )}
                    </div>
                    <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2">
                      <FaCamera />
                      <span>Choisir une photo</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom du plat *
                    </label>
                    <input
                      type="text"
                      value={dishForm.name}
                      onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ex: Spaghetti Bolognaise"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={dishForm.description}
                      onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="3"
                      placeholder="Décrivez votre plat..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Catégorie
                      </label>
                      <select
                        value={dishForm.category}
                        onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="breakfast">Petit-déjeuner</option>
                        <option value="lunch">Déjeuner</option>
                        <option value="dinner">Dîner</option>
                        <option value="snack">Collation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Portions
                      </label>
                      <input
                        type="number"
                        value={dishForm.servings}
                        onChange={(e) => setDishForm({ ...dishForm, servings: Number.parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Temps de préparation (min)
                      </label>
                      <input
                        type="number"
                        value={dishForm.preparationTime}
                        onChange={(e) => setDishForm({ ...dishForm, preparationTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="15"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Temps de cuisson (min)
                      </label>
                      <input
                        type="number"
                        value={dishForm.cookingTime}
                        onChange={(e) => setDishForm({ ...dishForm, cookingTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ingrédients</label>
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-1 text-sm"
                  >
                    <FaPlus />
                    <span>Ajouter</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {dishForm.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                    >
                      <input
                        type="text"
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(index, "name", e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="Nom de l'ingrédient"
                      />
                      <input
                        type="number"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="Qté"
                      />
                      <select
                        value={ingredient.unit}
                        onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                        <option value="piece">pièce</option>
                        <option value="tbsp">c. à s.</option>
                        <option value="tsp">c. à c.</option>
                        <option value="cup">tasse</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>

                {dishForm.ingredients.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FaLeaf className="text-2xl mx-auto mb-2" />
                    <p className="text-sm">Aucun ingrédient ajouté</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDishModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveDish}
                disabled={!dishForm.name.trim()}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <FaSave />
                <span>{editingDish ? "Modifier" : "Créer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MealsPage
