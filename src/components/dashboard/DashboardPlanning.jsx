const DashboardPlanning = ({ mealPlans, darkMode, showSuccess, showError }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"} flex items-center`}>
          <i className="fas fa-calendar-alt mr-3 text-green-500"></i>
          Planification des repas
        </h2>
        <button className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all flex items-center">
          <i className="fas fa-calendar-plus mr-2"></i>
          Planifier repas
        </button>
      </div>

      {mealPlans.length > 0 ? (
        <div className="space-y-4">
          {mealPlans.map((plan) => (
            <div
              key={plan.id}
              className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-6 shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-utensils text-green-600"></i>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {plan.meals?.nom}
                    </h3>
                    <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} capitalize`}>
                      {plan.type_repas} •{" "}
                      {new Date(plan.date_repas).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-500 hover:text-green-600 transition-all">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button className="p-2 text-gray-500 hover:text-red-600 transition-all">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              {plan.meals?.description && (
                <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} mt-3 ml-16`}>{plan.meals.description}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <i className={`fas fa-calendar-times text-6xl ${darkMode ? "text-gray-600" : "text-gray-400"} mb-6`}></i>
          <h3 className={`text-xl font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"} mb-4`}>
            Aucun repas planifié
          </h3>
          <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} mb-6`}>
            Commencez par planifier vos repas pour la semaine
          </p>
          <button className="px-8 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all">
            <i className="fas fa-calendar-plus mr-2"></i>
            Planifier des repas
          </button>
        </div>
      )}
    </div>
  )
}

export default DashboardPlanning
