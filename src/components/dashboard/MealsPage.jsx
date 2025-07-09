"use client"
import { useState, useEffect } from "react"
import { getUserDishes, saveDish, updateDish, deleteDish, getUserIngredients } from "../../services/supabase.js"
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
  FaEye,
  FaSpinner,
  FaCheck,
  FaExclamationCircle,
  FaInfoCircle,
} from "react-icons/fa"

const MealsPage = () => {
  const [dishes, setDishes] = useState([])
  const [filteredDishes, setFilteredDishes] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDishModal, setShowDishModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingDish, setEditingDish] = useState(null)
  const [selectedDish, setSelectedDish] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [notification, setNotification] = useState(null)
  const [errors, setErrors] = useState({})

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

  // Unités camerounaises et prix en XAF
  const units = [
    { value: "g", label: "grammes" },
    { value: "kg", label: "kilogrammes" },
    { value: "ml", label: "millilitres" },
    { value: "l", label: "litres" },
    { value: "piece", label: "pièces" },
    { value: "paquet", label: "paquets" },
    { value: "sachet", label: "sachets" },
    { value: "boite", label: "boîtes" },
    { value: "bouteille", label: "bouteilles" },
    { value: "gousse", label: "gousses" },
    { value: "botte", label: "bottes" },
    { value: "tas", label: "tas" },
    { value: "tasse", label: "tasses" },
    { value: "cuillere", label: "cuillères" },
    { value: "pincee", label: "pincées" },
    { value: "tranche", label: "tranches" },
    { value: "morceau", label: "morceaux" },
    { value: "tbsp", label: "cuillères à soupe" },
    { value: "tsp", label: "cuillères à café" },
    { value: "cup", label: "tasses" },
  ]

  // Notification system
  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterDishes()
  }, [dishes, searchTerm, selectedCategory])

  const loadData = async () => {
    try {
      setLoading(true)
      const [dishesResult, ingredientsResult] = await Promise.all([getUserDishes(), getUserIngredients()])

      if (dishesResult.data) {
        // Enrichir les plats avec les ingrédients complets
        const enrichedDishes = dishesResult.data.map((dish) => ({
          ...dish,
          ingredients:
            dish.ingredients?.map((dishIngredient) => {
              // Chercher l'ingrédient complet dans la liste des ingrédients
              const fullIngredient = ingredientsResult.data?.find(
                (ing) =>
                  ing.name.toLowerCase() === dishIngredient.name?.toLowerCase() ||
                  ing.id === dishIngredient.ingredient_id,
              )

              return {
                ...dishIngredient,
                // Utiliser les données complètes si trouvées, sinon garder les données du plat
                photo: fullIngredient?.photo_url || dishIngredient.photo,
                description: fullIngredient?.description || dishIngredient.description,
                price: dishIngredient.price || fullIngredient?.price_per_unit || "",
                // Garder les quantités spécifiques au plat
                quantity: dishIngredient.quantity,
                unit: dishIngredient.unit || fullIngredient?.unit_of_measure,
                ingredient_id: fullIngredient?.id,
              }
            }) || [],
        }))

        setDishes(enrichedDishes)
      }

      if (ingredientsResult.data) {
        setIngredients(ingredientsResult.data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      showNotification("Erreur lors du chargement des données", "error")
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
          dish.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dish.ingredients?.some((ingredient) => ingredient.name?.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((dish) => dish.category === selectedCategory)
    }

    setFilteredDishes(filtered)
  }

  const validateDishForm = () => {
    const newErrors = {}
    if (!dishForm.name.trim()) {
      newErrors.name = "Le nom du plat est obligatoire"
    }
    if (dishForm.preparationTime && (isNaN(dishForm.preparationTime) || dishForm.preparationTime < 0)) {
      newErrors.preparationTime = "Temps de préparation invalide"
    }
    if (dishForm.cookingTime && (isNaN(dishForm.cookingTime) || dishForm.cookingTime < 0)) {
      newErrors.cookingTime = "Temps de cuisson invalide"
    }
    if (dishForm.servings && (isNaN(dishForm.servings) || dishForm.servings < 1)) {
      newErrors.servings = "Nombre de portions invalide"
    }

    // Validation des ingrédients
    dishForm.ingredients.forEach((ingredient, index) => {
      if (!ingredient.name.trim()) {
        newErrors[`ingredient_${index}_name`] = "Nom de l'ingrédient requis"
      }
      if (!ingredient.quantity || isNaN(ingredient.quantity) || ingredient.quantity <= 0) {
        newErrors[`ingredient_${index}_quantity`] = "Quantité invalide"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveDish = async () => {
    if (!validateDishForm()) return

    try {
      setSaving(true)
      if (editingDish) {
        const result = await updateDish(editingDish.id, dishForm)
        if (result.error) {
          throw new Error(result.error.message)
        }
        showNotification("Plat modifié avec succès")
      } else {
        const result = await saveDish(dishForm)
        if (result.error) {
          throw new Error(result.error.message)
        }
        showNotification("Plat créé avec succès")
      }

      await loadData()
      setShowDishModal(false)
      resetDishForm()
      setErrors({})
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du plat:", error)
      showNotification("Erreur lors de la sauvegarde", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDish = async (dishId, dishName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${dishName}" ?\n\nCette action est irréversible.`)) {
      return
    }

    try {
      const result = await deleteDish(dishId)
      if (result.error) {
        throw new Error(result.error.message)
      }
      await loadData()
      showNotification("Plat supprimé avec succès")
    } catch (error) {
      console.error("Erreur lors de la suppression du plat:", error)
      showNotification("Erreur lors de la suppression", "error")
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
    setErrors({})
    setShowDishModal(true)
  }

  const handleViewDetails = (dish) => {
    setSelectedDish(dish)
    setShowDetailsModal(true)
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
    setErrors({})
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification("La taille de l'image ne doit pas dépasser 5MB", "error")
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        setDishForm({ ...dishForm, photo: e.target.result })
      }
      reader.onerror = () => {
        showNotification("Erreur lors du chargement de l'image", "error")
      }
      reader.readAsDataURL(file)
    }
  }

  const addIngredient = () => {
    setDishForm({
      ...dishForm,
      ingredients: [
        ...dishForm.ingredients,
        { name: "", quantity: "", unit: "g", photo: "", description: "", price: "" },
      ],
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

  const handleIngredientImageUpload = (index, e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification("La taille de l'image ne doit pas dépasser 2MB", "error")
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        updateIngredient(index, "photo", e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateAIRecipe = () => {
    const aiRecipes = [
      {
        name: "Ndolé Camerounais",
        description: "Plat traditionnel camerounais aux feuilles de ndolé, arachides et poisson fumé",
        category: "lunch",
        preparationTime: "30",
        cookingTime: "45",
        servings: 6,
        ingredients: [
          { name: "Feuilles de ndolé", quantity: "2", unit: "paquet", description: "Feuilles fraîches", price: "500" },
          { name: "Arachides crues", quantity: "250", unit: "g", description: "Arachides décortiquées", price: "800" },
          { name: "Poisson fumé", quantity: "300", unit: "g", description: "Poisson barracuda fumé", price: "2000" },
          { name: "Crevettes séchées", quantity: "100", unit: "g", description: "Crevettes de qualité", price: "1500" },
          {
            name: "Huile de palme",
            quantity: "3",
            unit: "cuillere",
            description: "Huile rouge traditionnelle",
            price: "200",
          },
          { name: "Oignons", quantity: "2", unit: "piece", description: "Oignons moyens", price: "300" },
          { name: "Ail", quantity: "4", unit: "gousse", description: "Gousses d'ail frais", price: "100" },
        ],
      },
      {
        name: "Poulet DG",
        description: "Poulet Directeur Général - plat festif camerounais avec plantains et légumes",
        category: "dinner",
        preparationTime: "25",
        cookingTime: "35",
        servings: 4,
        ingredients: [
          { name: "Poulet", quantity: "1", unit: "piece", description: "Poulet entier découpé", price: "3500" },
          { name: "Plantains mûrs", quantity: "3", unit: "piece", description: "Plantains bien mûrs", price: "600" },
          { name: "Carottes", quantity: "2", unit: "piece", description: "Carottes moyennes", price: "200" },
          { name: "Haricots verts", quantity: "200", unit: "g", description: "Haricots verts frais", price: "400" },
          { name: "Huile végétale", quantity: "4", unit: "cuillere", description: "Huile de cuisson", price: "300" },
          { name: "Maggi", quantity: "2", unit: "piece", description: "Cubes d'assaisonnement", price: "100" },
        ],
      },
    ]
    const randomRecipe = aiRecipes[Math.floor(Math.random() * aiRecipes.length)]
    setDishForm(randomRecipe)
    setShowDishModal(true)
    showNotification("Recette camerounaise générée !", "info")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg">
            <FaUtensils className="text-white text-2xl" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Chargement des repas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300"
              : notification.type === "error"
                ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300"
                : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300"
          } animate-slide-in-bottom`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === "success" && <FaCheck className="text-green-500" />}
            {notification.type === "error" && <FaExclamationCircle className="text-red-500" />}
            {notification.type === "info" && <FaInfoCircle className="text-blue-500" />}
            <span className="font-medium">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 text-gray-400 hover:text-gray-600">
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des repas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Créez et gérez vos recettes favorites avec leurs ingrédients
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateAIRecipe}
            className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
          >
            <FaRobot />
            <span>Recette Camerounaise</span>
          </button>
          <button
            onClick={() => {
              resetDishForm()
              setShowDishModal(true)
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <FaPlus />
            <span>Nouveau repas</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <FaUtensils className="text-green-600 dark:text-green-400 text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dishes.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Repas créés</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <FaLeaf className="text-blue-600 dark:text-blue-400 text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dishes.reduce((total, dish) => total + (dish.ingredients?.length || 0), 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ingrédients utilisés</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <FaClock className="text-orange-600 dark:text-orange-400 text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(dishes.reduce((total, dish) => total + (dish.preparation_time || 0), 0) / dishes.length) ||
                  0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Temps moyen (min)</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <span className="text-purple-600 dark:text-purple-400 text-lg font-bold">XAF</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dishes
                  .reduce((total, dish) => {
                    const dishCost =
                      dish.ingredients?.reduce(
                        (sum, ing) =>
                          sum + (Number.parseFloat(ing.price) || 0) * (Number.parseFloat(ing.quantity) || 0),
                        0,
                      ) || 0
                    return total + dishCost
                  }, 0)
                  .toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Coût total (XAF)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un repas ou ingrédient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <FaFilter className="text-gray-400" />
            <div className="flex flex-wrap gap-2">
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
            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
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
                  onClick={() => handleViewDetails(dish)}
                  className="p-2 bg-white dark:bg-gray-800 text-emerald-500 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors shadow-lg"
                  title="Voir détails"
                >
                  <FaEye />
                </button>
                <button
                  onClick={() => handleEditDish(dish)}
                  className="p-2 bg-white dark:bg-gray-800 text-blue-500 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-lg"
                  title="Modifier"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDeleteDish(dish.id, dish.name)}
                  className="p-2 bg-white dark:bg-gray-800 text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-lg"
                  title="Supprimer"
                >
                  <FaTrash />
                </button>
              </div>
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full text-sm font-medium shadow-lg">
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
                <div className="flex items-center space-x-2">
                  {dish.ingredients && dish.ingredients.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <FaLeaf />
                      <span>{dish.ingredients.length}</span>
                    </div>
                  )}
                  <div className="text-green-600 dark:text-green-400 font-bold">
                    {dish.ingredients
                      ?.reduce(
                        (sum, ing) =>
                          sum + (Number.parseFloat(ing.price) || 0) * (Number.parseFloat(ing.quantity) || 0),
                        0,
                      )
                      .toLocaleString()}{" "}
                    XAF
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDishes.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaUtensils className="text-gray-400 text-3xl" />
          </div>
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm || selectedCategory !== "all" ? "Aucun repas trouvé" : "Aucun repas créé"}
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || selectedCategory !== "all"
              ? "Aucun repas ne correspond à vos critères de recherche"
              : "Commencez par créer votre premier repas"}
          </p>
          <button
            onClick={() => {
              if (searchTerm || selectedCategory !== "all") {
                setSearchTerm("")
                setSelectedCategory("all")
              } else {
                resetDishForm()
                setShowDishModal(true)
              }
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
          >
            {searchTerm || selectedCategory !== "all" ? "Effacer les filtres" : "Créer votre premier repas"}
          </button>
        </div>
      )}

      {/* Modal d'ajout/modification de plat */}
      {showDishModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingDish ? "Modifier le repas" : "Nouveau repas"}
                </h2>
                <button
                  onClick={() => {
                    setShowDishModal(false)
                    resetDishForm()
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Colonne gauche - Informations du plat */}
                <div className="space-y-6">
                  {/* Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Photo du plat
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 h-32">
                        {dishForm.photo ? (
                          <img
                            src={dishForm.photo || "/placeholder.svg"}
                            alt="Aperçu"
                            className="w-full h-full rounded-xl object-cover border-2 border-green-200 dark:border-green-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                            <FaUtensils className="text-white text-2xl" />
                          </div>
                        )}
                      </div>
                      <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2">
                        <FaCamera />
                        <span>Choisir une photo</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Informations de base */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nom du plat *
                      </label>
                      <input
                        type="text"
                        value={dishForm.name}
                        onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                          errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="Ex: Ndolé Camerounais"
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={dishForm.description}
                        onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
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
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                            errors.servings ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                          }`}
                          min="1"
                        />
                        {errors.servings && <p className="text-red-500 text-sm mt-1">{errors.servings}</p>}
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
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                            errors.preparationTime ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                          }`}
                          placeholder="15"
                          min="0"
                        />
                        {errors.preparationTime && (
                          <p className="text-red-500 text-sm mt-1">{errors.preparationTime}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Temps de cuisson (min)
                        </label>
                        <input
                          type="number"
                          value={dishForm.cookingTime}
                          onChange={(e) => setDishForm({ ...dishForm, cookingTime: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                            errors.cookingTime ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                          }`}
                          placeholder="20"
                          min="0"
                        />
                        {errors.cookingTime && <p className="text-red-500 text-sm mt-1">{errors.cookingTime}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Colonne droite - Ingrédients */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ingrédients ({dishForm.ingredients.length})
                    </label>
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      <FaPlus />
                      <span>Ajouter</span>
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {dishForm.ingredients.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <FaLeaf className="text-3xl mx-auto mb-3" />
                        <p className="text-sm">Aucun ingrédient ajouté</p>
                        <p className="text-xs">Cliquez sur "Ajouter" pour commencer</p>
                      </div>
                    ) : (
                      dishForm.ingredients.map((ingredient, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                          {/* Photo de l'ingrédient */}
                          <div className="flex items-center space-x-3">
                            <div className="w-16 h-16 flex-shrink-0">
                              {ingredient.photo ? (
                                <img
                                  src={ingredient.photo || "/placeholder.svg"}
                                  alt={ingredient.name}
                                  className="w-full h-full rounded-lg object-cover border-2 border-green-200 dark:border-green-700"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-lg flex items-center justify-center">
                                  <FaLeaf className="text-white text-lg" />
                                </div>
                              )}
                            </div>
                            <label className="cursor-pointer bg-gray-200 dark:bg-gray-600 px-3 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center space-x-2 text-sm">
                              <FaCamera className="text-xs" />
                              <span>Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleIngredientImageUpload(index, e)}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => removeIngredient(index)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-auto"
                              title="Supprimer l'ingrédient"
                            >
                              <FaTrash />
                            </button>
                          </div>

                          {/* Informations de l'ingrédient */}
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex space-x-2">
                              <select
                                value={ingredient.ingredient_id || ""}
                                onChange={(e) => {
                                  const selectedIngredient = ingredients.find(
                                    (ing) => ing.id === Number.parseInt(e.target.value),
                                  )
                                  if (selectedIngredient) {
                                    updateIngredient(index, "ingredient_id", selectedIngredient.id)
                                    updateIngredient(index, "name", selectedIngredient.name)
                                    updateIngredient(index, "photo", selectedIngredient.photo_url)
                                    updateIngredient(index, "description", selectedIngredient.description)
                                    updateIngredient(index, "price", selectedIngredient.price_per_unit)
                                    updateIngredient(index, "unit", selectedIngredient.unit_of_measure)
                                  }
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              >
                                <option value="">Sélectionner un ingrédient existant</option>
                                {ingredients.map((ing) => (
                                  <option key={ing.id} value={ing.id}>
                                    {ing.name}
                                  </option>
                                ))}
                              </select>
                              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">ou</span>
                            </div>

                            <input
                              type="text"
                              value={ingredient.name}
                              onChange={(e) => {
                                updateIngredient(index, "name", e.target.value)
                                updateIngredient(index, "ingredient_id", "") // Reset selection
                              }}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${
                                errors[`ingredient_${index}_name`]
                                  ? "border-red-500"
                                  : "border-gray-300 dark:border-gray-600"
                              }`}
                              placeholder="Ou saisir un nouvel ingrédient *"
                            />
                            {errors[`ingredient_${index}_name`] && (
                              <p className="text-red-500 text-xs">{errors[`ingredient_${index}_name`]}</p>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                value={ingredient.quantity}
                                onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${
                                  errors[`ingredient_${index}_quantity`]
                                    ? "border-red-500"
                                    : "border-gray-300 dark:border-gray-600"
                                }`}
                                placeholder="Quantité *"
                                step="0.1"
                                min="0"
                              />
                              <select
                                value={ingredient.unit}
                                onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              >
                                {units.map((unit) => (
                                  <option key={unit.value} value={unit.value}>
                                    {unit.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {errors[`ingredient_${index}_quantity`] && (
                              <p className="text-red-500 text-xs">{errors[`ingredient_${index}_quantity`]}</p>
                            )}

                            <input
                              type="text"
                              value={ingredient.description || ""}
                              onChange={(e) => updateIngredient(index, "description", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              placeholder="Description (optionnel)"
                            />

                            <div className="relative">
                              <input
                                type="number"
                                value={ingredient.price || ""}
                                onChange={(e) => updateIngredient(index, "price", e.target.value)}
                                className="w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                placeholder="Prix unitaire"
                                step="1"
                                min="0"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                XAF
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowDishModal(false)
                    resetDishForm()
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveDish}
                  disabled={saving || !dishForm.name.trim()}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all duration-300 disabled:cursor-not-allowed"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  <span>{saving ? "Sauvegarde..." : editingDish ? "Modifier" : "Créer"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails du plat */}
      {showDetailsModal && selectedDish && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Détails du repas</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Photo et informations de base */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="aspect-square rounded-2xl overflow-hidden">
                    {selectedDish.photo_url ? (
                      <img
                        src={selectedDish.photo_url || "/placeholder.svg"}
                        alt={selectedDish.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                        <FaUtensils className="text-white text-6xl" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <div>
                    <h4 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{selectedDish.name}</h4>
                    <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-sm font-medium">
                      {categoryLabels[selectedDish.category] || selectedDish.category}
                    </span>
                  </div>
                  {selectedDish.description && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h5>
                      <p className="text-gray-600 dark:text-gray-400">{selectedDish.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedDish.preparation_time && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                        <FaClock className="text-blue-500 text-xl mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Préparation</p>
                        <p className="font-bold text-gray-900 dark:text-white">{selectedDish.preparation_time} min</p>
                      </div>
                    )}
                    {selectedDish.cooking_time && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
                        <FaUtensils className="text-orange-500 text-xl mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Cuisson</p>
                        <p className="font-bold text-gray-900 dark:text-white">{selectedDish.cooking_time} min</p>
                      </div>
                    )}
                    {selectedDish.servings && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                        <FaUsers className="text-purple-500 text-xl mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Portions</p>
                        <p className="font-bold text-gray-900 dark:text-white">{selectedDish.servings}</p>
                      </div>
                    )}
                    {selectedDish.ingredients && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                        <FaLeaf className="text-green-500 text-xl mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ingrédients</p>
                        <p className="font-bold text-gray-900 dark:text-white">{selectedDish.ingredients.length}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Liste des ingrédients */}
              {selectedDish.ingredients && selectedDish.ingredients.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <FaLeaf className="text-green-500" />
                    <span>Liste des ingrédients ({selectedDish.ingredients.length})</span>
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDish.ingredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center space-x-3 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="w-16 h-16 flex-shrink-0">
                          {ingredient.photo ? (
                            <img
                              src={ingredient.photo || "/placeholder.svg"}
                              alt={ingredient.name || "Ingrédient"}
                              className="w-full h-full rounded-lg object-cover border-2 border-green-200 dark:border-green-700"
                              onError={(e) => {
                                e.target.style.display = "none"
                                e.target.nextSibling.style.display = "flex"
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-lg flex items-center justify-center ${ingredient.photo ? "hidden" : "flex"}`}
                          >
                            <FaLeaf className="text-white text-lg" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-base">
                            {ingredient.name || "Ingrédient sans nom"}
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                            {ingredient.quantity || "0"}{" "}
                            {units.find((u) => u.value === ingredient.unit)?.label || ingredient.unit || "unité(s)"}
                          </p>
                          {ingredient.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {ingredient.description}
                            </p>
                          )}
                        </div>
                        {ingredient.price && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {Number.parseFloat(ingredient.price).toLocaleString()} XAF
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">prix unitaire</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Coût total estimé */}
                  {selectedDish.ingredients.some((ing) => ing.price) && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900 dark:text-white">Coût total estimé:</span>
                        <span className="text-xl font-bold text-green-600 dark:text-green-400">
                          {selectedDish.ingredients
                            .reduce(
                              (sum, ing) =>
                                sum + (Number.parseFloat(ing.price) || 0) * (Number.parseFloat(ing.quantity) || 0),
                              0,
                            )
                            .toLocaleString()}{" "}
                          XAF
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Soit environ{" "}
                        {Math.round(
                          selectedDish.ingredients.reduce(
                            (sum, ing) =>
                              sum + (Number.parseFloat(ing.price) || 0) * (Number.parseFloat(ing.quantity) || 0),
                            0,
                          ) / (selectedDish.servings || 1),
                        ).toLocaleString()}{" "}
                        XAF par portion
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    handleEditDish(selectedDish)
                  }}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-300"
                >
                  <FaEdit />
                  <span>Modifier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MealsPage
