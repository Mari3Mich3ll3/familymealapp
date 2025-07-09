"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  getCurrentUser,
  saveFamilyData,
  saveFamilyMembers,
  saveCalendarMeals,
  saveDish,
  getAllergies,
  getDiseases,
} from "../services/supabase"
import {
  FaLeaf,
  FaUser,
  FaUsers,
  FaUtensils,
  FaCalendarAlt,
  FaCamera,
  FaPlus,
  FaCheck,
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaHome,
  FaMale,
  FaFemale,
  FaAllergies,
  FaHeart,
  FaMinus,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa"

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  // États pour les données
  const [familyData, setFamilyData] = useState({
    name: "",
    memberCount: 1,
  })
  const [familyMembers, setFamilyMembers] = useState([])
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0)
  const [dishes, setDishes] = useState([])
  const [currentDish, setCurrentDish] = useState({
    name: "",
    photo: "",
    description: "",
    category: "",
    ingredients: [],
  })
  const [calendarType, setCalendarType] = useState("weekly")
  const [calendarMeals, setCalendarMeals] = useState([])

  // Données de référence
  const [availableAllergies, setAvailableAllergies] = useState([])
  const [availableDiseases, setAvailableDiseases] = useState([])

  const totalSteps = 6

  useEffect(() => {
    loadUser()
    loadReferenceData()
  }, [])

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      console.log("👤 Onboarding - Utilisateur:", currentUser?.email || "Aucun")

      if (!currentUser) {
        console.log("❌ Pas d'utilisateur, redirection vers connexion")
        navigate("/connexion")
        return
      }

      setUser(currentUser)
      // Initialiser le premier membre avec les données de l'utilisateur
      setFamilyMembers([
        {
          id: Date.now(),
          name: currentUser.user_metadata?.full_name || "",
          photo: "",
          gender: "",
          age: "",
          allergies: [],
          customAllergies: "",
          isSick: false,
          diseases: "",
          email: currentUser.email,
          isMainUser: true,
        },
      ])
    } catch (err) {
      setError("Erreur lors du chargement des données utilisateur")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadReferenceData = async () => {
    try {
      const [allergiesResult, diseasesResult] = await Promise.all([getAllergies(), getDiseases()])

      if (allergiesResult.data) {
        setAvailableAllergies(allergiesResult.data)
      }

      if (diseasesResult.data) {
        setAvailableDiseases(diseasesResult.data)
      }
    } catch (err) {
      console.error("Erreur chargement données de référence:", err)
    }
  }

  const handleNext = async () => {
    try {
      setError("")
      setSaving(true)

      if (currentStep === 1) {
        // Valider les données de la famille
        if (!familyData.name.trim()) {
          setError("Veuillez entrer le nom de votre famille")
          return
        }
        if (familyData.memberCount < 1 || familyData.memberCount > 10) {
          setError("Le nombre de membres doit être entre 1 et 10")
          return
        }

        // Ajuster le nombre de membres
        const currentMembers = [...familyMembers]
        while (currentMembers.length < familyData.memberCount) {
          currentMembers.push({
            id: Date.now() + currentMembers.length,
            name: "",
            photo: "",
            gender: "",
            age: "",
            allergies: [],
            customAllergies: "",
            isSick: false,
            diseases: "",
            email: "",
            isMainUser: false,
          })
        }
        setFamilyMembers(currentMembers.slice(0, familyData.memberCount))
      }

      if (currentStep === 2) {
        // Valider les membres de la famille
        const invalidMember = familyMembers.find((member) => !member.name.trim())
        if (invalidMember) {
          setError("Veuillez remplir le nom de tous les membres")
          return
        }
      }

      if (currentStep === 3) {
        // Sauvegarder les données famille et membres
        console.log("💾 Sauvegarde famille:", familyData)
        const familyResult = await saveFamilyData(familyData)
        if (familyResult.error) {
          console.error("❌ Erreur famille:", familyResult.error)
          setError("Erreur lors de la sauvegarde de la famille")
          return
        }

        console.log("💾 Sauvegarde membres:", familyMembers)
        const membersResult = await saveFamilyMembers(familyMembers, familyResult.data.id)
        if (membersResult.error) {
          console.error("❌ Erreur membres:", membersResult.error)
          setError("Erreur lors de la sauvegarde des membres")
          return
        }

        // Stocker l'ID de la famille pour les étapes suivantes
        setFamilyData({ ...familyData, id: familyResult.data.id })
        console.log("✅ Famille et membres sauvegardés")
      }

      if (currentStep === 4) {
        // Valider qu'au moins un plat a été ajouté
        if (dishes.length === 0) {
          setError("Veuillez ajouter au moins un plat")
          return
        }

        // Sauvegarder tous les plats
        console.log("💾 Sauvegarde plats:", dishes)
        const savedDishes = []
        for (const dish of dishes) {
          const dishResult = await saveDish(dish)
          if (dishResult.error) {
            console.error("❌ Erreur plat:", dishResult.error)
            // Continuer avec les autres plats même si un échoue
            continue
          }
          savedDishes.push(dishResult.data)
        }

        if (savedDishes.length === 0) {
          setError("Aucun plat n'a pu être sauvegardé")
          return
        }

        // Mettre à jour les plats avec les IDs de la base de données
        setDishes(savedDishes)
        console.log("✅ Plats sauvegardés:", savedDishes.length)
      }

      if (currentStep === 5) {
        // Sauvegarder le calendrier
        if (calendarMeals.length > 0 && familyData.id) {
          console.log("💾 Sauvegarde calendrier:", calendarMeals)
          const calendarResult = await saveCalendarMeals(calendarMeals, familyData.id)
          if (calendarResult.error) {
            console.error("❌ Erreur calendrier:", calendarResult.error)
            setError("Erreur lors de la sauvegarde du calendrier")
            return
          }
          console.log("✅ Calendrier sauvegardé")
        }

        // Redirection vers le dashboard
        console.log("🚀 Redirection vers dashboard...")
        navigate("/dashboard")
        return
      }

      setCurrentStep(currentStep + 1)
    } catch (err) {
      console.error("💥 Erreur handleNext:", err)
      setError("Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Fonctions pour gérer le nombre de membres
  const incrementMemberCount = () => {
    if (familyData.memberCount < 10) {
      setFamilyData({ ...familyData, memberCount: familyData.memberCount + 1 })
    }
  }

  const decrementMemberCount = () => {
    if (familyData.memberCount > 1) {
      setFamilyData({ ...familyData, memberCount: familyData.memberCount - 1 })
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WelcomeStep
            user={user}
            familyData={familyData}
            setFamilyData={setFamilyData}
            incrementMemberCount={incrementMemberCount}
            decrementMemberCount={decrementMemberCount}
          />
        )
      case 2:
        return (
          <FamilyMembersStep
            familyMembers={familyMembers}
            setFamilyMembers={setFamilyMembers}
            currentMemberIndex={currentMemberIndex}
            setCurrentMemberIndex={setCurrentMemberIndex}
            availableAllergies={availableAllergies}
            availableDiseases={availableDiseases}
          />
        )
      case 3:
        return <FamilySummaryStep familyData={familyData} familyMembers={familyMembers} />
      case 4:
        return (
          <DishesStep dishes={dishes} setDishes={setDishes} currentDish={currentDish} setCurrentDish={setCurrentDish} />
        )
      case 5:
        return (
          <CalendarStep
            calendarType={calendarType}
            setCalendarType={setCalendarType}
            calendarMeals={calendarMeals}
            setCalendarMeals={setCalendarMeals}
            dishes={dishes}
          />
        )
      case 6:
        return (
          <FinalSummaryStep
            familyData={familyData}
            familyMembers={familyMembers}
            dishes={dishes}
            calendarMeals={calendarMeals}
          />
        )
      default:
        return (
          <WelcomeStep
            user={user}
            familyData={familyData}
            setFamilyData={setFamilyData}
            incrementMemberCount={incrementMemberCount}
            decrementMemberCount={decrementMemberCount}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FaLeaf className="text-white text-2xl" />
          </div>
          <p className="text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header avec barre de progression */}
      <div className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <FaLeaf className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                FamilyMeal
              </span>
            </div>
            <div className="text-sm text-gray-600 font-medium">
              Étape {currentStep} sur {totalSteps}
            </div>
          </div>
          {/* Barre de progression numérotée */}
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }, (_, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                    index + 1 <= currentStep
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index + 1 < currentStep ? <FaCheck /> : index + 1}
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={`h-1 w-16 mx-2 transition-all duration-300 ${
                      index + 1 < currentStep ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center">
              <span className="text-red-500 mr-3">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {renderStep()}

          {/* Boutons de navigation */}
          <div className="flex justify-between mt-12">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1 || saving}
              className="flex items-center px-6 py-3 border border-gray-300 rounded-2xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaArrowLeft className="mr-2" />
              Précédent
            </button>
            <button
              onClick={handleNext}
              disabled={saving}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <span className="mr-2">⏳</span>
                  Sauvegarde...
                </>
              ) : (
                <>
                  {currentStep === totalSteps ? "Terminer" : "Suivant"}
                  {currentStep === totalSteps ? <FaCheck className="ml-2" /> : <FaArrowRight className="ml-2" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant Étape 1 - Bienvenue et Configuration Famille
const WelcomeStep = ({ user, familyData, setFamilyData, incrementMemberCount, decrementMemberCount }) => (
  <div>
    <div className="text-center mb-8">
      <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <FaHome className="text-white text-2xl" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Bonjour {user?.user_metadata?.full_name || ""}! 👋</h2>
      <p className="text-gray-600 mb-8">Configurons votre famille pour personnaliser votre expérience</p>
    </div>

    <div className="max-w-md mx-auto space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FaUsers className="inline mr-2 text-gray-400" />
          Nom de votre famille
        </label>
        <input
          type="text"
          value={familyData.name}
          onChange={(e) => setFamilyData({ ...familyData, name: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
          placeholder="Ex: Famille Dupont"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <FaUsers className="inline mr-2 text-gray-400" />
          Nombre de membres dans votre famille
        </label>
        <div className="flex items-center justify-center space-x-4">
          <button
            type="button"
            onClick={decrementMemberCount}
            disabled={familyData.memberCount <= 1}
            className="w-12 h-12 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center transition-colors"
          >
            <FaMinus className="text-gray-600" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-gray-900">{familyData.memberCount}</span>
            <span className="text-sm text-gray-500">{familyData.memberCount === 1 ? "personne" : "personnes"}</span>
          </div>
          <button
            type="button"
            onClick={incrementMemberCount}
            disabled={familyData.memberCount >= 10}
            className="w-12 h-12 bg-green-100 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center transition-colors"
          >
            <FaPlus className="text-green-600" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">Maximum 10 membres</p>
      </div>
    </div>
  </div>
)

// Composant Étape 2 - Configuration des Membres
const FamilyMembersStep = ({
  familyMembers,
  setFamilyMembers,
  currentMemberIndex,
  setCurrentMemberIndex,
  availableAllergies,
  availableDiseases,
}) => {
  const currentMember = familyMembers[currentMemberIndex]

  const updateMember = (field, value) => {
    const updatedMembers = [...familyMembers]
    updatedMembers[currentMemberIndex] = { ...currentMember, [field]: value }
    setFamilyMembers(updatedMembers)
  }

  const toggleAllergy = (allergyName) => {
    const currentAllergies = currentMember.allergies || []
    const updatedAllergies = currentAllergies.includes(allergyName)
      ? currentAllergies.filter((a) => a !== allergyName)
      : [...currentAllergies, allergyName]
    updateMember("allergies", updatedAllergies)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        updateMember("photo", e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaUser className="text-white text-2xl" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Configuration des membres</h2>
        <p className="text-gray-600">
          Membre {currentMemberIndex + 1} sur {familyMembers.length}
          {currentMember.isMainUser && " (Vous)"}
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Navigation entre membres */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {familyMembers.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMemberIndex(index)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  index === currentMemberIndex
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Photo */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              {currentMember.photo ? (
                <img
                  src={currentMember.photo || "/placeholder.svg"}
                  alt="Photo du membre"
                  className="w-full h-full rounded-full object-cover border-4 border-green-200"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center border-4 border-gray-300">
                  <FaCamera className="text-gray-400 text-2xl" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors">
                <FaCamera className="text-white text-sm" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <p className="text-sm text-gray-500">Photo (optionnelle)</p>
          </div>

          {/* Informations de base */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
              <input
                type="text"
                value={currentMember.name}
                onChange={(e) => updateMember("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nom du membre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Âge</label>
              <input
                type="number"
                value={currentMember.age}
                onChange={(e) => updateMember("age", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Âge"
                min="0"
                max="120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sexe</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => updateMember("gender", "male")}
                  className={`flex items-center px-4 py-2 rounded-xl border transition-colors ${
                    currentMember.gender === "male"
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <FaMale className="mr-2" />
                  Homme
                </button>
                <button
                  type="button"
                  onClick={() => updateMember("gender", "female")}
                  className={`flex items-center px-4 py-2 rounded-xl border transition-colors ${
                    currentMember.gender === "female"
                      ? "bg-pink-50 border-pink-300 text-pink-700"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <FaFemale className="mr-2" />
                  Femme
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email (optionnel)</label>
              <input
                type="email"
                value={currentMember.email}
                onChange={(e) => updateMember("email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="email@exemple.com"
                disabled={currentMember.isMainUser}
              />
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <FaAllergies className="inline mr-2 text-gray-400" />
              Allergies alimentaires
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {availableAllergies.map((allergy) => (
                <button
                  key={allergy.id}
                  type="button"
                  onClick={() => toggleAllergy(allergy.name)}
                  className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                    (currentMember.allergies || []).includes(allergy.name)
                      ? "bg-red-50 border-red-300 text-red-700"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {allergy.name}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={currentMember.customAllergies || ""}
              onChange={(e) => updateMember("customAllergies", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Autres allergies (séparées par des virgules)"
            />
          </div>

          {/* Maladies */}
          <div>
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={currentMember.isSick}
                onChange={(e) => updateMember("isSick", e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500 mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                <FaHeart className="inline mr-2 text-gray-400" />
                Ce membre a des problèmes de santé
              </span>
            </label>
            {currentMember.isSick && (
              <textarea
                value={currentMember.diseases || ""}
                onChange={(e) => updateMember("diseases", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Décrivez les problèmes de santé (ex: diabète, hypertension, etc.)"
                rows="3"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant Étape 3 - Récapitulatif Famille
const FamilySummaryStep = ({ familyData, familyMembers }) => (
  <div>
    <div className="text-center mb-8">
      <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <FaCheck className="text-white text-2xl" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Récapitulatif de votre famille</h2>
      <p className="text-gray-600">Vérifiez les informations avant de continuer</p>
    </div>

    <div className="max-w-3xl mx-auto">
      <div className="bg-green-50 rounded-2xl p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FaHome className="mr-3 text-green-500" />
          {familyData.name}
        </h3>
        <p className="text-gray-600">
          <FaUsers className="inline mr-2" />
          {familyData.memberCount} {familyData.memberCount === 1 ? "membre" : "membres"}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {familyMembers.map((member, index) => (
          <div key={member.id} className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 flex-shrink-0">
                {member.photo ? (
                  <img
                    src={member.photo || "/placeholder.svg"}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                    <FaUser className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {member.name} {member.isMainUser && "(Vous)"}
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {member.age && <p>Âge: {member.age} ans</p>}
                  {member.gender && <p>Sexe: {member.gender === "male" ? "Homme" : "Femme"}</p>}
                  {member.allergies && member.allergies.length > 0 && <p>Allergies: {member.allergies.join(", ")}</p>}
                  {member.customAllergies && <p>Autres allergies: {member.customAllergies}</p>}
                  {member.isSick && member.diseases && <p>Problèmes de santé: {member.diseases}</p>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Composant Étape 4 - Configuration des Plats
const DishesStep = ({ dishes, setDishes, currentDish, setCurrentDish }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [currentIngredient, setCurrentIngredient] = useState({
    name: "",
    quantity: "",
    unit: "",
    photo: "",
    price: "",
    description: "",
  })

  const categories = ["Petit-déjeuner", "Déjeuner", "Dîner", "Collation"]
  const units = ["kg", "g", "l", "ml", "piece", "cup", "tbsp", "tsp"]

  const addIngredient = () => {
    if (currentIngredient.name && currentIngredient.quantity && currentIngredient.unit) {
      setCurrentDish({
        ...currentDish,
        ingredients: [...currentDish.ingredients, { ...currentIngredient, id: Date.now() }],
      })
      setCurrentIngredient({
        name: "",
        quantity: "",
        unit: "",
        photo: "",
        price: "",
        description: "",
      })
    }
  }

  const removeIngredient = (id) => {
    setCurrentDish({
      ...currentDish,
      ingredients: currentDish.ingredients.filter((ing) => ing.id !== id),
    })
  }

  const saveDish = () => {
    if (currentDish.name && currentDish.category && currentDish.ingredients.length > 0) {
      setDishes([...dishes, { ...currentDish, id: Date.now() }])
      setCurrentDish({
        name: "",
        photo: "",
        description: "",
        category: "",
        ingredients: [],
      })
      setShowAddForm(false)
    }
  }

  const removeDish = (id) => {
    setDishes(dishes.filter((dish) => dish.id !== id))
  }

  const handleDishImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCurrentDish({ ...currentDish, photo: e.target.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleIngredientImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCurrentIngredient({ ...currentIngredient, photo: e.target.result })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaUtensils className="text-white text-2xl" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Configuration des plats</h2>
        <p className="text-gray-600">Ajoutez vos plats favoris avec leurs ingrédients</p>
      </div>

      {!showAddForm ? (
        <div>
          {/* Liste des plats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {dishes.map((dish) => (
              <div key={dish.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="relative mb-4">
                  {dish.photo ? (
                    <img
                      src={dish.photo || "/placeholder.svg"}
                      alt={dish.name}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 rounded-xl flex items-center justify-center">
                      <FaUtensils className="text-gray-400 text-2xl" />
                    </div>
                  )}
                  <button
                    onClick={() => removeDish(dish.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                  >
                    <FaTimes />
                  </button>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{dish.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{dish.category}</p>
                <p className="text-xs text-gray-500 mb-3">{dish.description}</p>
                <p className="text-xs text-green-600">{dish.ingredients.length} ingrédients</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <FaPlus className="mr-2" />
              Ajouter un plat
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {/* Formulaire d'ajout de plat */}
          <div className="space-y-6">
            {/* Photo du plat */}
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 relative">
                {currentDish.photo ? (
                  <img
                    src={currentDish.photo || "/placeholder.svg"}
                    alt="Photo du plat"
                    className="w-full h-full rounded-2xl object-cover border-4 border-green-200"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-2xl flex items-center justify-center border-4 border-gray-300">
                    <FaCamera className="text-gray-400 text-3xl" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors">
                  <FaCamera className="text-white" />
                  <input type="file" accept="image/*" onChange={handleDishImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Informations du plat */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du plat *</label>
                <input
                  type="text"
                  value={currentDish.name}
                  onChange={(e) => setCurrentDish({ ...currentDish, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: Spaghetti Bolognaise"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                <select
                  value={currentDish.category}
                  onChange={(e) => setCurrentDish({ ...currentDish, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={currentDish.description}
                onChange={(e) => setCurrentDish({ ...currentDish, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Description du plat..."
                rows="3"
              />
            </div>

            {/* Ingrédients */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Ingrédients</h4>
              {/* Liste des ingrédients ajoutés */}
              {currentDish.ingredients.length > 0 && (
                <div className="mb-4 space-y-2">
                  {currentDish.ingredients.map((ingredient) => (
                    <div key={ingredient.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                      <div className="flex items-center space-x-3">
                        {ingredient.photo && (
                          <img
                            src={ingredient.photo || "/placeholder.svg"}
                            alt={ingredient.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <span className="font-medium">{ingredient.name}</span>
                        <span className="text-gray-600">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                        {ingredient.price && <span className="text-green-600">{ingredient.price} XAF</span>}
                      </div>
                      <button
                        onClick={() => removeIngredient(ingredient.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulaire d'ajout d'ingrédient */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={currentIngredient.name}
                    onChange={(e) => setCurrentIngredient({ ...currentIngredient, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nom"
                  />
                  <input
                    type="number"
                    value={currentIngredient.quantity}
                    onChange={(e) => setCurrentIngredient({ ...currentIngredient, quantity: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Quantité"
                  />
                  <select
                    value={currentIngredient.unit}
                    onChange={(e) => setCurrentIngredient({ ...currentIngredient, unit: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Unité</option>
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="1"
                    value={currentIngredient.price}
                    onChange={(e) => setCurrentIngredient({ ...currentIngredient, price: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Prix (XAF)"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={currentIngredient.description}
                      onChange={(e) => setCurrentIngredient({ ...currentIngredient, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Description (optionnelle)"
                    />
                  </div>
                  <label className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-400 transition-colors">
                    <FaCamera className="text-gray-600" />
                    <input type="file" accept="image/*" onChange={handleIngredientImageUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-between">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveDish}
                disabled={!currentDish.name || !currentDish.category || currentDish.ingredients.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sauvegarder le plat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant Étape 5 - Configuration du Calendrier avec grille mensuelle
const CalendarStep = ({ calendarType, setCalendarType, calendarMeals, setCalendarMeals, dishes }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showMealSelector, setShowMealSelector] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")

  const categories = ["breakfast", "lunch", "dinner", "snack"]
  const categoryLabels = {
    breakfast: "Petit-déjeuner",
    lunch: "Déjeuner",
    dinner: "Dîner",
    snack: "Collation",
  }

  // Générer les jours du mois
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Jours du mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }

    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false })
    }

    return days
  }

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  const handleDateClick = (date) => {
    if (!date.isCurrentMonth) return
    setSelectedDate(date.date)
    setShowMealSelector(true)
  }

  const addMealToCalendar = () => {
    if (selectedMeal && selectedCategory && selectedDate) {
      const meal = dishes.find((dish) => dish.id === Number.parseInt(selectedMeal))
      if (meal) {
        setCalendarMeals([
          ...calendarMeals,
          {
            id: Date.now(),
            date: selectedDate.toISOString().split("T")[0],
            category: selectedCategory, // selectedCategory est déjà en anglais
            dish: meal,
          },
        ])
        setSelectedMeal("")
        setSelectedCategory("")
        setShowMealSelector(false)
        setSelectedDate(null)
      }
    }
  }

  const removeMealFromCalendar = (id) => {
    setCalendarMeals(calendarMeals.filter((meal) => meal.id !== id))
  }

  const getMealsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0]
    return calendarMeals.filter((meal) => meal.date === dateStr)
  }

  const days = getDaysInMonth(currentDate)
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ]
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaCalendarAlt className="text-white text-2xl" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Configuration du calendrier</h2>
        <p className="text-gray-600">Planifiez vos repas en cliquant sur les dates</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Calendrier mensuel */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          {/* En-tête du calendrier */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FaChevronLeft className="text-gray-600" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FaChevronRight className="text-gray-600" />
            </button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const mealsForDay = getMealsForDate(day.date)
              const isToday = day.date.toDateString() === new Date().toDateString()

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`
                    min-h-[80px] p-2 border border-gray-100 cursor-pointer transition-colors
                    ${day.isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50 text-gray-400"}
                    ${isToday ? "bg-blue-50 border-blue-200" : ""}
                    ${selectedDate && day.date.toDateString() === selectedDate.toDateString() ? "bg-green-50 border-green-200" : ""}
                  `}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : ""}`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {mealsForDay.slice(0, 2).map((meal) => (
                      <div
                        key={meal.id}
                        className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded truncate"
                        title={`${categoryLabels[meal.category]}: ${meal.dish.name}`}
                      >
                        {meal.dish.name}
                      </div>
                    ))}
                    {mealsForDay.length > 2 && (
                      <div className="text-xs text-gray-500">+{mealsForDay.length - 2} autres</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sélecteur de repas */}
        {showMealSelector && dishes.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ajouter un repas pour le {selectedDate?.toLocaleDateString("fr-FR")}
            </h3>
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Sélectionner</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plat</label>
                <select
                  value={selectedMeal}
                  onChange={(e) => setSelectedMeal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un plat</option>
                  {dishes.map((dish) => (
                    <option key={dish.id} value={dish.id}>
                      {dish.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={addMealToCalendar}
                  disabled={!selectedMeal || !selectedCategory}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => {
                    setShowMealSelector(false)
                    setSelectedDate(null)
                    setSelectedMeal("")
                    setSelectedCategory("")
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des repas planifiés */}
        {calendarMeals.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Repas planifiés ({calendarMeals.length})</h3>
            <div className="space-y-3">
              {calendarMeals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-4">
                    {meal.dish.photo && (
                      <img
                        src={meal.dish.photo || "/placeholder.svg"}
                        alt={meal.dish.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{meal.dish.name}</h4>
                      <p className="text-sm text-gray-600">
                        {categoryLabels[meal.category]} - {new Date(meal.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeMealFromCalendar(meal.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Composant Étape 6 - Récapitulatif Final
const FinalSummaryStep = ({ familyData, familyMembers, dishes, calendarMeals }) => (
  <div>
    <div className="text-center mb-8">
      <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <FaCheck className="text-white text-2xl" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Configuration terminée ! 🎉</h2>
      <p className="text-gray-600">Voici un récapitulatif de votre configuration</p>
    </div>

    <div className="max-w-4xl mx-auto space-y-8">
      {/* Résumé famille */}
      <div className="bg-green-50 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FaHome className="mr-3 text-green-500" />
          {familyData.name}
        </h3>
        <p className="text-gray-600 mb-4">{familyMembers.length} membres configurés</p>
        <div className="grid md:grid-cols-3 gap-4">
          {familyMembers.slice(0, 3).map((member, index) => (
            <div key={member.id} className="flex items-center space-x-3">
              <div className="w-10 h-10 flex-shrink-0">
                {member.photo ? (
                  <img
                    src={member.photo || "/placeholder.svg"}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                    <FaUser className="text-gray-400 text-sm" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                {member.isMainUser && <p className="text-xs text-green-600">Vous</p>}
              </div>
            </div>
          ))}
          {familyMembers.length > 3 && (
            <div className="flex items-center text-gray-500">
              <span>+{familyMembers.length - 3} autres</span>
            </div>
          )}
        </div>
      </div>

      {/* Résumé plats */}
      <div className="bg-orange-50 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FaUtensils className="mr-3 text-orange-500" />
          Plats configurés ({dishes.length})
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          {dishes.slice(0, 4).map((dish) => (
            <div key={dish.id} className="text-center">
              {dish.photo ? (
                <img
                  src={dish.photo || "/placeholder.svg"}
                  alt={dish.name}
                  className="w-16 h-16 rounded-xl object-cover mx-auto mb-2"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <FaUtensils className="text-gray-400" />
                </div>
              )}
              <p className="font-medium text-gray-900 text-sm">{dish.name}</p>
              <p className="text-xs text-gray-600">{dish.category}</p>
            </div>
          ))}
          {dishes.length > 4 && (
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-medium">+{dishes.length - 4}</span>
              </div>
              <p className="text-sm">autres plats</p>
            </div>
          )}
        </div>
      </div>

      {/* Résumé calendrier */}
      {calendarMeals.length > 0 && (
        <div className="bg-purple-50 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FaCalendarAlt className="mr-3 text-purple-500" />
            Repas planifiés ({calendarMeals.length})
          </h3>
          <div className="space-y-2">
            {calendarMeals.slice(0, 5).map((meal) => (
              <div key={meal.id} className="flex items-center justify-between bg-white p-3 rounded-xl">
                <div className="flex items-center space-x-3">
                  {meal.dish.photo && (
                    <img
                      src={meal.dish.photo || "/placeholder.svg"}
                      alt={meal.dish.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{meal.dish.name}</p>
                    <p className="text-sm text-gray-600">
                      {meal.category === "breakfast"
                        ? "Petit-déjeuner"
                        : meal.category === "lunch"
                          ? "Déjeuner"
                          : meal.category === "dinner"
                            ? "Dîner"
                            : "Collation"}{" "}
                      - {new Date(meal.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {calendarMeals.length > 5 && (
              <p className="text-center text-gray-500 text-sm">+{calendarMeals.length - 5} autres repas planifiés</p>
            )}
          </div>
        </div>
      )}

      {/* Prochaines étapes */}
      <div className="bg-blue-50 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Prochaines étapes</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            "Accéder à votre tableau de bord personnalisé",
            "Générer vos premières listes de courses",
            "Découvrir l'assistant IA pour de nouvelles recettes",
            "Inviter d'autres membres de la famille",
          ].map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {index + 1}
              </div>
              <span className="text-gray-700">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export default Onboarding
