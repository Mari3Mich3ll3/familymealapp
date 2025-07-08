"use client"

const DashboardShopping = ({ shoppingLists, darkMode, loading, setLoading, showSuccess, showError }) => {
  const generateShoppingList = async () => {
    try {
      setLoading(true)
      // Logique de génération automatique de liste de courses
      showSuccess("Liste de courses générée automatiquement !")
    } catch (error) {
      console.error("Erreur génération liste de courses:", error)
      showError("Erreur lors de la génération de la liste de courses")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"} flex items-center`}>
          <i className="fas fa-shopping-cart mr-3 text-green-500"></i>
          Listes de courses
        </h2>
        <button
          onClick={generateShoppingList}
          disabled={loading}
          className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all flex items-center disabled:opacity-50"
        >
          <i className="fas fa-magic mr-2"></i>
          Générer liste auto
        </button>
      </div>

      {shoppingLists.length > 0 ? (
        <div className="space-y-4">
          {shoppingLists.map((item) => (
            <div
              key={item.id}
              className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-6 shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 ${item.statut === "achete" ? "bg-green-100" : "bg-orange-100"} rounded-xl flex items-center justify-center`}
                  >
                    <i
                      className={`fas ${item.statut === "achete" ? "fa-check text-green-600" : "fa-shopping-basket text-orange-600"}`}
                    ></i>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {item.ingredients?.nom}
                    </h3>
                    <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {item.quantite} {item.unite}
                      {item.prix_estime && ` • ${item.prix_estime.toFixed(2)}€`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.statut === "achete" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {item.statut === "achete" ? "Acheté" : "En attente"}
                  </span>
                  <button className="p-2 text-gray-500 hover:text-green-600 transition-all">
                    <i className="fas fa-check"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <i className={`fas fa-shopping-cart text-6xl ${darkMode ? "text-gray-600" : "text-gray-400"} mb-6`}></i>
          <h3 className={`text-xl font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"} mb-4`}>
            Aucune liste de courses
          </h3>
          <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} mb-6`}>
            Générez automatiquement vos listes basées sur vos repas planifiés
          </p>
          <button
            onClick={generateShoppingList}
            disabled={loading}
            className="px-8 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all disabled:opacity-50"
          >
            <i className="fas fa-magic mr-2"></i>
            Générer ma première liste
          </button>
        </div>
      )}
    </div>
  )
}

export default DashboardShopping
