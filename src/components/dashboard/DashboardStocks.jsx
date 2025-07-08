const DashboardStocks = ({ stocks, darkMode, showSuccess, showError }) => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"} flex items-center`}>
          <i className="fas fa-boxes mr-3 text-green-500"></i>
          Gestion des stocks ({stocks.length})
        </h2>
        <button className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all flex items-center">
          <i className="fas fa-plus mr-2"></i>
          Ajouter stock
        </button>
      </div>

      {stocks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stocks.map((stock) => {
            const status = getStockStatus(stock)
            return (
              <div
                key={stock.id}
                className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-6 shadow-lg`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {stock.ingredients?.nom}
                  </h3>
                  <span
                    className={`px-3 py-1 bg-${status.color}-100 text-${status.color}-800 rounded-full text-sm font-medium`}
                  >
                    {status.text}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Quantité</span>
                    <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {stock.quantite} {stock.unite}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Lieu</span>
                    <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"} capitalize`}>
                      {stock.lieu_stockage}
                    </span>
                  </div>
                  {stock.date_expiration && (
                    <div className="flex items-center justify-between">
                      <span className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Expiration</span>
                      <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {new Date(stock.date_expiration).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  )}
                  {stock.seuil_alerte && (
                    <div className="flex items-center justify-between">
                      <span className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Seuil alerte</span>
                      <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {stock.seuil_alerte} {stock.unite}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 mt-4">
                  <button className="flex-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all">
                    <i className="fas fa-edit mr-2"></i>
                    Modifier
                  </button>
                  <button className="px-4 py-2 text-gray-500 hover:text-red-600 transition-all">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <i className={`fas fa-boxes text-6xl ${darkMode ? "text-gray-600" : "text-gray-400"} mb-6`}></i>
          <h3 className={`text-xl font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"} mb-4`}>
            Aucun stock enregistré
          </h3>
          <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} mb-6`}>
            Commencez par ajouter vos premiers stocks d'ingrédients
          </p>
          <button className="px-8 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all">
            <i className="fas fa-plus mr-2"></i>
            Ajouter un stock
          </button>
        </div>
      )}
    </div>
  )
}

export default DashboardStocks
