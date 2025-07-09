"use client"
import { useState, useEffect } from "react"
import { getUserDishes, getUserFamilies, getFamilyMembers, getFamilyCalendar } from "../../services/supabase"
import {
  FaShoppingCart,
  FaPlus,
  FaTrash,
  FaCheck,
  FaBoxes,
  FaTimes,
  FaSave,
  FaUtensils,
  FaCalendarAlt,
} from "react-icons/fa"

const ShoppingPage = () => {
  const [dishes, setDishes] = useState([])
  const [families, setFamilies] = useState([])
  const [selectedFamily, setSelectedFamily] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [selectedDishes, setSelectedDishes] = useState([])
  const [shoppingLists, setShoppingLists] = useState([])
  const [stocks, setStocks] = useState({})
  const [loading, setLoading] = useState(true)
  const [showDishSelector, setShowDishSelector] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [stockQuantity, setStockQuantity] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newList, setNewList] = useState({
    name: "",
    items: [],
  })
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    unit: "piece",
    category: "other",
  })

  const categories = [
    { value: "vegetable", label: "Légumes", color: "bg-green-100 text-green-800" },
    { value: "fruit", label: "Fruits", color: "bg-yellow-100 text-yellow-800" },
    { value: "meat", label: "Viandes", color: "bg-red-100 text-red-800" },
    { value: "dairy", label: "Produits laitiers", color: "bg-blue-100 text-blue-800" },
    { value: "grain", label: "Féculents", color: "bg-orange-100 text-orange-800" },
    { value: "spice", label: "Épices", color: "bg-purple-100 text-purple-800" },
    { value: "other", label: "Autres", color: "bg-gray-100 text-gray-800" },
  ]

  const units = ["piece", "kg", "g", "l", "ml", "cup", "tbsp", "tsp"]

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedFamily) {
      loadFamilyMembers()
    }
  }, [selectedFamily])

  useEffect(() => {
    generateShoppingList()
  }, [selectedDishes, stocks])

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

  const generateShoppingList = () => {
    const ingredientMap = new Map()

    selectedDishes.forEach((dishSelection) => {
      const dish = dishes.find((d) => d.id === dishSelection.dishId)
      if (!dish || !dish.ingredients) return

      dish.ingredients.forEach((ingredient) => {
        const key = ingredient.name.toLowerCase()
        const quantity = Number.parseFloat(ingredient.quantity) * dishSelection.servings
        const price = Number.parseFloat(ingredient.price_per_unit || ingredient.price || 0)

        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)
          existing.quantity += quantity
          existing.totalPrice += price * quantity
        } else {
          ingredientMap.set(key, {
            id: ingredient.id || Date.now() + Math.random(),
            name: ingredient.name,
            quantity: quantity,
            unit: ingredient.unit_of_measure || ingredient.unit,
            pricePerUnit: price,
            totalPrice: price * quantity,
            category: ingredient.category || "other",
            comment: "",
            checked: false,
            stockQuantity: stocks[key] || 0,
          })
        }
      })
    })

    // Calculer les quantités finales après déduction du stock
    const finalList = Array.from(ingredientMap.values()).map((item) => {
      const finalQuantity = Math.max(0, item.quantity - item.stockQuantity)
      return {
        ...item,
        finalQuantity,
        finalPrice: finalQuantity * item.pricePerUnit,
        isStocked: item.stockQuantity >= item.quantity,
      }
    })

    // Grouper par catégorie
    const categorizedList = groupByCategory(finalList)
    setShoppingLists([{ id: Date.now(), name: "Liste de courses", items: categorizedList }])
  }

  const groupByCategory = (items) => {
    const categoriesObj = {
      meat: { name: "Viandes", items: [], color: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300" },
      vegetable: {
        name: "Légumes",
        items: [],
        color: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300",
      },
      fruit: {
        name: "Fruits",
        items: [],
        color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300",
      },
      dairy: {
        name: "Produits laitiers",
        items: [],
        color: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
      },
      grain: {
        name: "Féculents",
        items: [],
        color: "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300",
      },
      spice: {
        name: "Épices",
        items: [],
        color: "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300",
      },
      other: { name: "Autres", items: [], color: "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300" },
    }

    items.forEach((item) => {
      const category = categoriesObj[item.category] || categoriesObj.other
      category.items.push(item)
    })

    return Object.values(categoriesObj).filter((category) => category.items.length > 0)
  }

  const addDishToList = (dishId, servings = 1) => {
    const existingIndex = selectedDishes.findIndex((d) => d.dishId === dishId)
    if (existingIndex >= 0) {
      const updated = [...selectedDishes]
      updated[existingIndex].servings += servings
      setSelectedDishes(updated)
    } else {
      setSelectedDishes([...selectedDishes, { dishId, servings }])
    }
  }

  const removeDishFromList = (dishId) => {
    setSelectedDishes(selectedDishes.filter((d) => d.dishId !== dishId))
  }

  const updateDishServings = (dishId, servings) => {
    const updated = selectedDishes.map((d) => (d.dishId === dishId ? { ...d, servings: Math.max(1, servings) } : d))
    setSelectedDishes(updated)
  }

  const updateStock = (ingredientName, quantity) => {
    setStocks({
      ...stocks,
      [ingredientName.toLowerCase()]: Number.parseFloat(quantity) || 0,
    })
  }

  const updateItemComment = (itemId, comment) => {
    setShoppingLists(
      shoppingLists.map((list) => ({
        ...list,
        items: list.items.map((item) => (item.id === itemId ? { ...item, comment } : item)),
      })),
    )
  }

  const toggleItemChecked = (itemId) => {
    setShoppingLists(
      shoppingLists.map((list) => ({
        ...list,
        items: list.items.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item)),
      })),
    )
  }

  const getTotalPrice = () => {
    return shoppingLists.reduce(
      (total, list) =>
        total + list.items.reduce((catTotal, item) => catTotal + (item.isStocked ? 0 : item.finalPrice), 0),
      0,
    )
  }

  const getTotalItems = () => {
    return shoppingLists.reduce((total, list) => total + list.items.filter((item) => !item.isStocked).length, 0)
  }

  const generateFromCalendar = async () => {
    if (!selectedFamily) return

    try {
      // Récupérer les repas de la semaine prochaine
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(startDate.getDate() + 7)

      const calendarResult = await getFamilyCalendar(
        selectedFamily.id,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
      )

      const dishesResult = await getUserDishes()
      const dishes = dishesResult.data || []

      // Générer la liste d'ingrédients
      const ingredientsMap = new Map()

      if (calendarResult.data) {
        calendarResult.data.forEach((meal) => {
          const dish = dishes.find((d) => d.id === meal.dish_id)
          if (dish && dish.ingredients) {
            dish.ingredients.forEach((ingredient) => {
              const key = ingredient.name.toLowerCase()
              if (ingredientsMap.has(key)) {
                const existing = ingredientsMap.get(key)
                existing.quantity += ingredient.quantity || 1
              } else {
                ingredientsMap.set(key, {
                  name: ingredient.name,
                  quantity: ingredient.quantity || 1,
                  unit: ingredient.unit || "piece",
                  category: ingredient.category || "other",
                  checked: false,
                })
              }
            })
          }
        })
      }

      const generatedItems = Array.from(ingredientsMap.values())

      setNewList({
        name: `Liste du ${new Date().toLocaleDateString("fr-FR")}`,
        items: generatedItems,
      })
      setShowCreateModal(true)
    } catch (error) {
      console.error("Erreur lors de la génération de la liste:", error)
    }
  }

  const addItem = () => {
    if (!newItem.name.trim()) return

    setNewList({
      ...newList,
      items: [
        ...newList.items,
        {
          ...newItem,
          id: Date.now(),
          checked: false,
        },
      ],
    })

    setNewItem({
      name: "",
      quantity: "",
      unit: "piece",
      category: "other",
    })
  }

  const removeItem = (itemId) => {
    setNewList({
      ...newList,
      items: newList.items.filter((item) => item.id !== itemId),
    })
  }

  const toggleItem = (listId, itemId) => {
    setShoppingLists((lists) =>
      lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item)),
            }
          : list,
      ),
    )
  }

  const saveList = () => {
    if (!newList.name.trim() || newList.items.length === 0) return

    const listToSave = {
      ...newList,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      familyId: selectedFamily?.id,
    }

    setShoppingLists([listToSave, ...shoppingLists])
    setShowCreateModal(false)
    setNewList({ name: "", items: [] })
  }

  const deleteList = (listId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette liste ?")) {
      setShoppingLists((lists) => lists.filter((list) => list.id !== listId))
    }
  }

  const getCategoryInfo = (categoryValue) => {
    return categories.find((cat) => cat.value === categoryValue) || categories[categories.length - 1]
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Listes de courses</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez vos listes de courses et planifiez vos achats</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateFromCalendar}
            disabled={!selectedFamily}
            className="bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaCalendarAlt />
            <span>Générer du calendrier</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
          >
            <FaPlus />
            <span>Nouvelle liste</span>
          </button>
        </div>
      </div>

      {/* No Family State */}
      {families.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <FaShoppingCart className="text-gray-400 text-6xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Créez d'abord une famille</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Pour créer des listes de courses, vous devez d'abord créer une famille dans la section "Famille".
          </p>
        </div>
      )}

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

      {/* Shopping Lists */}
      {selectedFamily && (
        <>
          {shoppingLists.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 text-center">
              <FaShoppingCart className="text-gray-400 text-6xl mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Aucune liste de courses</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Créez votre première liste de courses ou générez-en une à partir de votre calendrier de repas.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={generateFromCalendar}
                  className="bg-purple-500 text-white px-6 py-3 rounded-xl hover:bg-purple-600 transition-colors flex items-center space-x-2"
                >
                  <FaCalendarAlt />
                  <span>Générer du calendrier</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <FaPlus />
                  <span>Créer manuellement</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {shoppingLists.map((list) => (
                <div
                  key={list.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{list.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {list.items.filter((item) => item.checked).length} / {list.items.length} articles
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => deleteList(list.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {list.items.map((item) => {
                      const categoryInfo = getCategoryInfo(item.category)
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                            item.checked ? "bg-green-50 dark:bg-green-900/20" : "bg-gray-50 dark:bg-gray-700/50"
                          }`}
                        >
                          <button
                            onClick={() => toggleItem(list.id, item.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              item.checked
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-gray-300 dark:border-gray-600 hover:border-green-500"
                            }`}
                          >
                            {item.checked && <FaCheck className="text-xs" />}
                          </button>

                          <div className="flex-1">
                            <div
                              className={`font-medium ${item.checked ? "line-through text-gray-500" : "text-gray-900 dark:text-white"}`}
                            >
                              {item.name}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>
                                {item.quantity} {item.unit}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${categoryInfo.color}`}>
                                {categoryInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>Progression</span>
                      <span>
                        {Math.round((list.items.filter((item) => item.checked).length / list.items.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(list.items.filter((item) => item.checked).length / list.items.length) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Dish Selection */}
      {selectedFamily && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sélection des Repas</h2>
            <button
              onClick={() => setShowDishSelector(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
            >
              <FaPlus />
              <span>Ajouter un Repas</span>
            </button>
          </div>

          {selectedDishes.length === 0 ? (
            <div className="text-center py-8">
              <FaUtensils className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucun repas sélectionné</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Ajoutez des repas pour générer votre liste</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDishes.map((dishSelection) => {
                const dish = dishes.find((d) => d.id === dishSelection.dishId)
                if (!dish) return null

                return (
                  <div
                    key={dish.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                  >
                    <div className="flex items-center space-x-4">
                      {dish.photo_url && (
                        <img
                          src={dish.photo_url || "/placeholder.svg"}
                          alt={dish.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{dish.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {dish.ingredients?.length || 0} ingrédients
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateDishServings(dish.id, dishSelection.servings - 1)}
                          className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                          {dishSelection.servings}
                        </span>
                        <button
                          onClick={() => updateDishServings(dish.id, dishSelection.servings + 1)}
                          className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeDishFromList(dish.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Health Alerts */}
          {familyMembers.some((member) => member.allergies?.length > 0 || member.is_sick) && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">⚠️ Alertes Santé</h3>
              <div className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                {familyMembers
                  .filter((member) => member.allergies?.length > 0)
                  .map((member) => (
                    <p key={member.id}>
                      <strong>{member.name}</strong>: Allergique à {member.allergies.join(", ")}
                    </p>
                  ))}
                {familyMembers
                  .filter((member) => member.is_sick)
                  .map((member) => (
                    <p key={member.id}>
                      <strong>{member.name}</strong>: {member.diseases}
                    </p>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nouvelle liste de courses</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-6">
              {/* List Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de la liste *
                </label>
                <input
                  type="text"
                  value={newList.name}
                  onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Courses de la semaine"
                />
              </div>

              {/* Add Item Form */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Ajouter un article</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Nom de l'article"
                  />
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Quantité"
                  />
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addItem}
                  disabled={!newItem.name.trim()}
                  className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <FaPlus />
                  <span>Ajouter l'article</span>
                </button>
              </div>

              {/* Items List */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Articles ({newList.items.length})</h3>
                {newList.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FaShoppingCart className="text-2xl mx-auto mb-2" />
                    <p className="text-sm">Aucun article ajouté</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {newList.items.map((item) => {
                      const categoryInfo = getCategoryInfo(item.category)
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                        >
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>
                                {item.quantity} {item.unit}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${categoryInfo.color}`}>
                                {categoryInfo.label}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveList}
                disabled={!newList.name.trim() || newList.items.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <FaSave />
                <span>Créer la liste</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dish Selector Modal */}
      {showDishSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sélectionner des Repas</h2>
              <button
                onClick={() => setShowDishSelector(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dishes.map((dish) => (
                <div
                  key={dish.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:shadow-lg transition-all"
                >
                  {dish.photo_url && (
                    <img
                      src={dish.photo_url || "/placeholder.svg"}
                      alt={dish.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">{dish.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {dish.ingredients?.length || 0} ingrédients
                  </p>
                  <button
                    onClick={() => {
                      addDishToList(dish.id)
                      setShowDishSelector(false)
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <FaPlus />
                    <span>Ajouter</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedIngredient ? `Stock: ${selectedIngredient.name}` : "Gérer le Stock"}
              </h2>
              <button
                onClick={() => {
                  setShowStockModal(false)
                  setSelectedIngredient(null)
                  setStockQuantity("")
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {selectedIngredient ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantité en stock
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                      step="0.1"
                    />
                    <span className="text-gray-600 dark:text-gray-400">{selectedIngredient.unit}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowStockModal(false)
                      setSelectedIngredient(null)
                      setStockQuantity("")
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      updateStock(selectedIngredient.name, stockQuantity)
                      setShowStockModal(false)
                      setSelectedIngredient(null)
                      setStockQuantity("")
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <FaSave />
                    <span>Sauvegarder</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaBoxes className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Sélectionnez un ingrédient pour gérer son stock</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ShoppingPage
