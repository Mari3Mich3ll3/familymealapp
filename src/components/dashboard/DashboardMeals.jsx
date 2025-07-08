const DashboardMeals = ({ meals, darkMode, showSuccess, showError }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"} flex items-center`}>
          <i className="fas fa-utensils mr-3 text-green-500"></i>
          Mes repas ({meals.length})
        </h2>
        <button className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all flex items-center">
          <i className="fas fa-plus mr-2"></i>
          Nouveau repas
        </button>
      </div>

      {meals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all`}
            >
              {meal.photo_url && (
                <img
                  src={meal.photo_url || "/placeholder.svg?height=200&width=300"}
                  alt={meal.nom}
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium capitalize">
                  {meal.categorie}
                </span>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-500 hover:text-green-600 transition-all">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button className="p-2 text-gray-500 hover:text-red-600 transition-all">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-2`}>{meal.nom}</h3>
              {meal.description && (
                <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} mb-4`}>{meal.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {meal.meal_ingredients?.length || 0} ingrédients
                </span>
                <button className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all">
                  Voir détails
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <i className={`fas fa-utensils text-6xl ${darkMode ? "text-gray-600" : "text-gray-400"} mb-6`}></i>
          <h3 className={`text-xl font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"} mb-4`}>
            Aucun repas configuré
          </h3>
          <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} mb-6`}>
            Commencez par ajouter vos premiers repas favoris
          </p>
          <button className="px-8 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all">
            <i className="fas fa-plus mr-2"></i>
            Ajouter un repas
          </button>
        </div>
      )}
    </div>
  )
}

export default DashboardMeals
