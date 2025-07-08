const DashboardMembers = ({ members, darkMode, showSuccess, showError }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"} flex items-center`}>
          <i className="fas fa-users mr-3 text-green-500"></i>
          Membres de la famille ({members.length})
        </h2>
        <button className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all flex items-center">
          <i className="fas fa-user-plus mr-2"></i>
          Ajouter membre
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div
            key={member.id}
            className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-6 shadow-lg`}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center overflow-hidden">
                {member.photo_url ? (
                  <img
                    src={member.photo_url || "/placeholder.svg?height=64&width=64"}
                    alt={`${member.prenom} ${member.nom}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <i className="fas fa-user text-green-600 text-xl"></i>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {member.prenom} {member.nom}
                </h3>
                <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} capitalize`}>
                  {member.sexe} • {member.age} ans
                </p>
              </div>
            </div>

            {member.email && (
              <div className="flex items-center space-x-2 mb-3">
                <i className={`fas fa-envelope ${darkMode ? "text-gray-400" : "text-gray-500"}`}></i>
                <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{member.email}</span>
              </div>
            )}

            {member.allergies && member.allergies.length > 0 && (
              <div className="mb-3">
                <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-2`}>
                  <i className="fas fa-exclamation-triangle text-amber-500 mr-2"></i>
                  Allergies
                </p>
                <div className="flex flex-wrap gap-1">
                  {member.allergies.slice(0, 3).map((allergie, index) => (
                    <span key={index} className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs">
                      {allergie}
                    </span>
                  ))}
                  {member.allergies.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      +{member.allergies.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {member.est_malade && member.maladies && member.maladies.length > 0 && (
              <div className="mb-4">
                <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-2`}>
                  <i className="fas fa-stethoscope text-red-500 mr-2"></i>
                  Problèmes de santé
                </p>
                <div className="flex flex-wrap gap-1">
                  {member.maladies.slice(0, 2).map((maladie, index) => (
                    <span key={index} className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs">
                      {maladie}
                    </span>
                  ))}
                  {member.maladies.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      +{member.maladies.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <button className="flex-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all">
                <i className="fas fa-edit mr-2"></i>
                Modifier
              </button>
              <button className="px-4 py-2 text-gray-500 hover:text-red-600 transition-all">
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardMembers
