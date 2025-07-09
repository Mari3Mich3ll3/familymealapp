"use client"
import { useState, useEffect } from "react"
import { getUserIngredients, saveIngredient, updateIngredient, deleteIngredient } from "../../services/supabase"
import {
  FaSeedling,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCamera,
  FaSearch,
  FaFilter,
  FaSave,
  FaTimes,
  FaDownload,
} from "react-icons/fa"

const IngredientsPage = () => {
  const [ingredients, setIngredients] = useState([])
  const [filteredIngredients, setFilteredIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")

  const [newIngredient, setNewIngredient] = useState({
    name: "",
    photo: "",
    unit: "piece",
    averagePrice: "",
    description: "",
    category: "Autres",
  })

  const categories = ["Légumes", "Fruits", "Viandes", "Produits laitiers", "Féculents", "Épices", "Autres"]
  const units = ["kg", "g", "l", "ml", "piece", "cup", "tbsp", "tsp"]

  useEffect(() => {
    loadIngredients()
  }, [])

  useEffect(() => {
    filterIngredients()
  }, [ingredients, searchTerm, selectedCategory])

  const loadIngredients = async () => {
    try {
      const result = await getUserIngredients()
      setIngredients(result.data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des ingrédients:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterIngredients = () => {
    let filtered = ingredients

    if (searchTerm) {
      filtered = filtered.filter(
        (ingredient) =>
          ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ingredient.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory) {
      const categoryMap = {
        Légumes: "vegetable",
        Fruits: "fruit",
        Viandes: "meat",
        "Produits laitiers": "dairy",
        Féculents: "grain",
        Épices: "spice",
        Autres: "other",
      }
      filtered = filtered.filter((ingredient) => ingredient.category === categoryMap[selectedCategory])
    }

    setFilteredIngredients(filtered)
  }

  const handleAddIngredient = async () => {
    if (!newIngredient.name.trim()) return

    try {
      const result = await saveIngredient(newIngredient)
      if (result.data) {
        await loadIngredients()
        setShowAddForm(false)
        resetNewIngredient()
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'ingrédient:", error)
    }
  }

  const handleEditIngredient = async () => {
    if (!editingIngredient) return

    try {
      const result = await updateIngredient(editingIngredient.id, editingIngredient)
      if (result.data) {
        await loadIngredients()
        setShowEditForm(false)
        setEditingIngredient(null)
      }
    } catch (error) {
      console.error("Erreur lors de la modification de l'ingrédient:", error)
    }
  }

  const handleDeleteIngredient = async (ingredientId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet ingrédient ?")) return

    try {
      await deleteIngredient(ingredientId)
      await loadIngredients()
    } catch (error) {
      console.error("Erreur lors de la suppression de l'ingrédient:", error)
    }
  }

  const resetNewIngredient = () => {
    setNewIngredient({
      name: "",
      photo: "",
      unit: "piece",
      averagePrice: "",
      description: "",
      category: "Autres",
    })
  }

  const handleImageUpload = (e, isEditing = false) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (isEditing) {
          setEditingIngredient({ ...editingIngredient, photo: e.target.result })
        } else {
          setNewIngredient({ ...newIngredient, photo: e.target.result })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const getCategoryLabel = (category) => {
    const categoryMap = {
      vegetable: "Légumes",
      fruit: "Fruits",
      meat: "Viandes",
      dairy: "Produits laitiers",
      grain: "Féculents",
      spice: "Épices",
      other: "Autres",
    }
    return categoryMap[category] || category
  }

  const getCategoryColor = (category) => {
    const colorMap = {
      vegetable: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300",
      fruit: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300",
      meat: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300",
      dairy: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
      grain: "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300",
      spice: "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300",
      other: "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300",
    }
    return colorMap[category] || colorMap.other
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Ingrédients</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez votre base d'ingrédients</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors flex items-center space-x-2">
            <FaDownload />
            <span>Importer</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2"
          >
            <FaPlus />
            <span>Ajouter un Ingrédient</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher un ingrédient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-4">
            <FaFilter className="text-gray-400 dark:text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ingredients Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        {filteredIngredients.length === 0 ? (
          <div className="text-center py-12">
            <FaSeedling className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {searchTerm || selectedCategory ? "Aucun ingrédient trouvé" : "Aucun ingrédient enregistré"}
            </p>
            <p className="text-gray-400 dark:text-gray-500">
              {searchTerm || selectedCategory
                ? "Essayez de modifier vos filtres"
                : "Ajoutez votre premier ingrédient pour commencer"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredIngredients.map((ingredient) => (
              <div
                key={ingredient.id}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300"
              >
                <div className="relative mb-4">
                  {ingredient.photo_url ? (
                    <img
                      src={ingredient.photo_url || "/placeholder.svg"}
                      alt={ingredient.name}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <FaSeedling className="text-white text-3xl" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingIngredient(ingredient)
                        setShowEditForm(true)
                      }}
                      className="p-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteIngredient(ingredient.id)}
                      className="p-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(ingredient.category)}`}
                    >
                      {getCategoryLabel(ingredient.category)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{ingredient.name}</h3>

                  {ingredient.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{ingredient.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-500 dark:text-gray-400">
                      Unité:{" "}
                      <span className="font-medium text-gray-900 dark:text-white">{ingredient.unit_of_measure}</span>
                    </div>
                    {ingredient.price_per_unit && (
                      <div className="text-green-600 dark:text-green-400 font-medium">
                        {ingredient.price_per_unit} XAF
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Ingredient Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ajouter un Ingrédient</h2>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  resetNewIngredient()
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <IngredientForm
              ingredient={newIngredient}
              setIngredient={setNewIngredient}
              categories={categories}
              units={units}
              onImageUpload={(e) => handleImageUpload(e, false)}
              onSave={handleAddIngredient}
              onCancel={() => {
                setShowAddForm(false)
                resetNewIngredient()
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Ingredient Modal */}
      {showEditForm && editingIngredient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Modifier l'Ingrédient</h2>
              <button
                onClick={() => {
                  setShowEditForm(false)
                  setEditingIngredient(null)
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <IngredientForm
              ingredient={editingIngredient}
              setIngredient={setEditingIngredient}
              categories={categories}
              units={units}
              onImageUpload={(e) => handleImageUpload(e, true)}
              onSave={handleEditIngredient}
              onCancel={() => {
                setShowEditForm(false)
                setEditingIngredient(null)
              }}
              isEditing={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Composant formulaire réutilisable
const IngredientForm = ({
  ingredient,
  setIngredient,
  categories,
  units,
  onImageUpload,
  onSave,
  onCancel,
  isEditing = false,
}) => {
  return (
    <div className="space-y-6">
      {/* Photo */}
      <div className="text-center">
        <div className="w-32 h-32 mx-auto mb-4 relative">
          {ingredient.photo ? (
            <img
              src={ingredient.photo || "/placeholder.svg"}
              alt="Photo de l'ingrédient"
              className="w-full h-full rounded-2xl object-cover border-4 border-green-200 dark:border-green-700"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center border-4 border-gray-300 dark:border-gray-600">
              <FaCamera className="text-gray-400 dark:text-gray-500 text-3xl" />
            </div>
          )}
          <label className="absolute bottom-0 right-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors">
            <FaCamera className="text-white" />
            <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nom de l'ingrédient *
          </label>
          <input
            type="text"
            value={ingredient.name}
            onChange={(e) => setIngredient({ ...ingredient, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Ex: Tomates"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catégorie</label>
          <select
            value={ingredient.category}
            onChange={(e) => setIngredient({ ...ingredient, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unité de mesure</label>
          <select
            value={ingredient.unit}
            onChange={(e) => setIngredient({ ...ingredient, unit: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prix moyen (XAF)</label>
          <input
            type="number"
            value={ingredient.averagePrice}
            onChange={(e) => setIngredient({ ...ingredient, averagePrice: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Prix par unité"
            step="1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
        <textarea
          value={ingredient.description}
          onChange={(e) => setIngredient({ ...ingredient, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Description de l'ingrédient..."
          rows="3"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={onSave}
          disabled={!ingredient.name.trim()}
          className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <FaSave />
          <span>{isEditing ? "Modifier" : "Ajouter"}</span>
        </button>
      </div>
    </div>
  )
}

export default IngredientsPage
