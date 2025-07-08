"use client"

const DashboardOverview = ({
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
}) => {
  const generateShoppingList = async () => {
    try {
      setLoading(true)
      // Logique de génération de liste de courses
      showSuccess("Liste de courses générée avec succès !")
    } catch (error) {
      console.error("Erreur génération liste de courses:", error)
      showError("Erreur lors de la génération de la liste de courses")
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (stock) => {
    const today = new Date()
    const expirationDate = new Date(stock.date_expiration)
    const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24))

    if (stock.quantite === 0) return { status: "empty", color: "red", text: "Épuisé" }
    if (daysUntilExpiration < 0) return { status: "expired", color: "red", text: "Expiré" }
    if (daysUntilExpiration <= 3) return { status: "expiring", color: "orange", text: "Expire bientôt" }
    if (stock.quantite <= stock.seuil_alerte) return { status: "low", color: "yellow", text: "Stock faible" }
    return { status: "good", color: "green", text: "OK" }
  }

  return (
    <div className="space-y-8">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-6 shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Membres famille</p>
              <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{members.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-users text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div
          className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-6 shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Repas configurés</p>
              <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{meals.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-utensils text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div
          className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-6 shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Articles en stock</p>
              <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {stocks.filter((s) => s.quantite > 0).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-boxes text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div
          className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-6 shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Repas planifiés</p>
              <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{mealPlans.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-calendar-alt text-orange-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div
        className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-6 shadow-lg`}
      >
        <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-6 flex items-center`}>
          <i className="fas fa-bolt mr-3 text-green-500"></i>
          Actions rapides
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-3 p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-all">
            <i className="fas fa-plus text-green-600"></i>
            <span className="font-medium text-green-700">Nouveau repas</span>
          </button>
          <button className="flex items-center justify-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all">
            <i className="fas fa-user-plus text-blue-600"></i>
            <span className="font-medium text-blue-700">Ajouter membre</span>
          </button>
          <button className="flex items-center justify-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all">
            <i className="fas fa-calendar-plus text-purple-600"></i>
            <span className="font-medium text-purple-700">Planifier repas</span>
          </button>
          <button
            onClick={generateShoppingList}
            disabled={loading}
            className="flex items-center justify-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-all disabled:opacity-50"
          >
            <i className="fas fa-shopping-cart text-orange-600"></i>
            <span className="font-medium text-orange-700">Liste de courses</span>
          </button>
        </div>
      </div>

      {/* Alertes stocks */}
      {stocks.filter((stock) => {
        const status = getStockStatus(stock)
        return status.status !== "good"
      }).length > 0 && (
        <div
          className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-6 shadow-lg`}
        >
          <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-6 flex items-center`}>
            <i className="fas fa-exclamation-triangle mr-3 text-amber-500"></i>
            Alertes stocks
          </h3>
          <div className="space-y-3">
            {stocks
              .filter((stock) => {
                const status = getStockStatus(stock)
                return status.status !== "good"
              })
              .slice(0, 5)
              .map((stock) => {
                const status = getStockStatus(stock)
                return (
                  <div
                    key={stock.id}
                    className={`flex items-center justify-between p-3 bg-${status.color}-50 border border-${status.color}-200 rounded-xl`}
                  >
                    <div className="flex items-center space-x-3">
                      <i className={`fas fa-box text-${status.color}-600`}></i>
                      <div>
                        <p className={`font-medium text-${status.color}-900`}>{stock.ingredients?.nom}</p>
                        <p className={`text-sm text-${status.color}-700`}>
                          {stock.quantite} {stock.unite} • {stock.lieu_stockage}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 bg-${status.color}-100 text-${status.color}-800 rounded-full text-sm font-medium`}
                    >
                      {status.text}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Repas de la semaine */}
      <div
        className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-6 shadow-lg`}
      >
        <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-6 flex items-center`}>
          <i className="fas fa-calendar-week mr-3 text-green-500"></i>
          Repas de la semaine
        </h3>
        {mealPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mealPlans.slice(0, 6).map((plan) => (
              <div
                key={plan.id}
                className={`p-4 border ${darkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50"} rounded-xl`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"} capitalize`}>
                    {plan.type_repas}
                  </span>
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {new Date(plan.date_repas).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <h4 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{plan.meals?.nom}</h4>
                {plan.meals?.description && (
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>
                    {plan.meals.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <i className={`fas fa-calendar-times text-4xl ${darkMode ? "text-gray-600" : "text-gray-400"} mb-4`}></i>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>Aucun repas planifié pour cette semaine</p>
            <button className="mt-4 px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all">
              Planifier des repas
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardOverview
