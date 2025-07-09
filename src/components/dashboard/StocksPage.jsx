"use client"
import { useState, useEffect } from "react"
import { getUserFamilies, getFamilyStocks, saveStock, getUserIngredients } from "../../services/supabase"
import {
  FaBoxes,
  FaPlus,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaSave,
  FaTimes,
  FaSearch,
  FaFilter,
} from "react-icons/fa"

const StocksPage = () => {
  const [families, setFamilies] = useState([])
  const [selectedFamily, setSelectedFamily] = useState(null)
  const [stocks, setStocks] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showStockModal, setShowStockModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stockForm, setStockForm] = useState({
    ingredient: "",
    quantity: "",
    expirationDate: "",
    location: "frigo",
  })

  const locations = [
    { value: "frigo", label: "Réfrigérateur" },
    { value: "congelateur", label: "Congélateur" },
    { value: "placard", label: "Placard" },
    { value: "cave", label: "Cave" },
    { value: "autre", label: "Autre" },
  ]

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedFamily) {
      loadFamilyStocks()
    }
  }, [selectedFamily])

  const loadData = async () => {
    try {
      setLoading(true)
      const [familiesResult, ingredientsResult] = await Promise.all([getUserFamilies(), getUserIngredients()])

      if (familiesResult.data) {
        setFamilies(familiesResult.data)
        if (familiesResult.data.length > 0) {
          setSelectedFamily(familiesResult.data[0])
        }
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

  const loadFamilyStocks = async () => {
    if (!selectedFamily) return

    try {
      const result = await getFamilyStocks(selectedFamily.id)
      if (result.data) {
        setStocks(result.data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des stocks:", error)
      setStocks([])
    }
  }

  const handleSaveStock = async () => {
    try {
      if (!stockForm.ingredient || !stockForm.quantity || !selectedFamily) return

      const result = await saveStock(stockForm, selectedFamily.id)
      if (result.data) {
        loadFamilyStocks()
        setShowStockModal(false)
        resetStockForm()
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du stock:", error)
    }
  }

  const resetStockForm = () => {
    setStockForm({
      ingredient: "",
      quantity: "",
      expirationDate: "",
      location: "frigo",
    })
  }

  const getStockStatus = (stock) => {
    if (!stock.expiration_date) return "no-expiry"

    const today = new Date()
    const expiryDate = new Date(stock.expiration_date)
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) return "expired"
    if (daysUntilExpiry <= 3) return "expiring-soon"
    if (daysUntilExpiry <= 7) return "expiring-week"
    return "fresh"
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case "expired":
        return { label: "Expiré", color: "text-red-600", bgColor: "bg-red-100", icon: FaTimesCircle }
      case "expiring-soon":
        return {
          label: "Expire bientôt",
          color: "text-orange-600",
          bgColor: "bg-orange-100",
          icon: FaExclamationTriangle,
        }
      case "expiring-week":
        return {
          label: "Expire cette semaine",
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          icon: FaExclamationTriangle,
        }
      case "fresh":
        return { label: "Frais", color: "text-green-600", bgColor: "bg-green-100", icon: FaCheckCircle }
      default:
        return { label: "Pas d'expiration", color: "text-gray-600", bgColor: "bg-gray-100", icon: FaCheckCircle }
    }
  }

  const getLocationLabel = (location) => {
    const locationInfo = locations.find((loc) => loc.value === location)
    return locationInfo ? locationInfo.label : location
  }

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch = stock.ingredients?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || getStockStatus(stock) === statusFilter

    return matchesSearch && matchesStatus
  })

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des stocks</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Suivez vos stocks d'ingrédients et leurs dates d'expiration
          </p>
        </div>
        <button
          onClick={() => setShowStockModal(true)}
          disabled={!selectedFamily || ingredients.length === 0}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaPlus />
          <span>Ajouter stock</span>
        </button>
      </div>

      {/* No Family State */}
      {families.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <FaBoxes className="text-gray-400 text-6xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Créez d'abord une famille</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Pour gérer vos stocks, vous devez d'abord créer une famille dans la section "Famille".
          </p>
        </div>
      )}

      {/* No Ingredients State */}
      {families.length > 0 && ingredients.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <FaBoxes className="text-gray-400 text-6xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Créez d'abord des ingrédients</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Pour gérer vos stocks, vous devez d'abord créer des ingrédients dans la section "Ingrédients".
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

      {/* Filters */}
      {selectedFamily && ingredients.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un ingrédient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <FaFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="fresh">Frais</option>
                <option value="expiring-week">Expire cette semaine</option>
                <option value="expiring-soon">Expire bientôt</option>
                <option value="expired">Expiré</option>
                <option value="no-expiry">Sans expiration</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stocks Grid */}
      {selectedFamily && ingredients.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          {filteredStocks.length === 0 ? (
            <div className="text-center py-12">
              <FaBoxes className="text-gray-400 text-4xl mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {stocks.length === 0 ? "Aucun stock enregistré" : "Aucun stock ne correspond à vos critères"}
              </p>
              {stocks.length === 0 && (
                <button
                  onClick={() => setShowStockModal(true)}
                  className="bg-green-500 text-white px-6 py-2 rounded-xl hover:bg-green-600 transition-colors"
                >
                  Ajouter votre premier stock
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStocks.map((stock) => {
                const status = getStockStatus(stock)
                const statusInfo = getStatusInfo(status)
                const StatusIcon = statusInfo.icon

                return (
                  <div
                    key={stock.id}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {stock.ingredients?.name || "Ingrédient inconnu"}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{getLocationLabel(stock.location)}</p>
                      </div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${statusInfo.bgColor}`}>
                        <StatusIcon className={`text-xs ${statusInfo.color}`} />
                        <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Quantité:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {stock.quantity} {stock.ingredients?.unit_of_measure || "unité"}
                        </span>
                      </div>

                      {stock.expiration_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Expiration:</span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {new Date(stock.expiration_date).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      )}

                      {stock.expiration_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Jours restants:</span>
                          <span className={`text-sm font-medium ${statusInfo.color}`}>
                            {Math.ceil((new Date(stock.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))} jours
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={() => {
                          setStockForm({
                            ingredient: stock.ingredient_id?.toString() || "",
                            quantity: stock.quantity?.toString() || "",
                            expirationDate: stock.expiration_date || "",
                            location: stock.location || "frigo",
                          })
                          setShowStockModal(true)
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Êtes-vous sûr de vouloir supprimer ce stock ?")) {
                            // TODO: Implement delete stock
                          }
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ajouter un stock</h2>
              <button
                onClick={() => {
                  setShowStockModal(false)
                  resetStockForm()
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ingrédient *</label>
                <select
                  value={stockForm.ingredient}
                  onChange={(e) => setStockForm({ ...stockForm, ingredient: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner un ingrédient</option>
                  {ingredients.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantité *</label>
                <input
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: 500"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date d'expiration
                </label>
                <input
                  type="date"
                  value={stockForm.expirationDate}
                  onChange={(e) => setStockForm({ ...stockForm, expirationDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Emplacement</label>
                <select
                  value={stockForm.location}
                  onChange={(e) => setStockForm({ ...stockForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {locations.map((location) => (
                    <option key={location.value} value={location.value}>
                      {location.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowStockModal(false)
                  resetStockForm()
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveStock}
                disabled={!stockForm.ingredient || !stockForm.quantity}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <FaSave />
                <span>Sauvegarder</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StocksPage
