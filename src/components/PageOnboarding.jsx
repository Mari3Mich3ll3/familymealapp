"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase, TABLES, handleSupabaseError } from "../../services/supabase"

const PageOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [user, setUser] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [familyData, setFamilyData] = useState({
    nomFamille: "",
    nombreMembres: 1,
    membres: [],
  })
  const [currentMember, setCurrentMember] = useState({
    nom: "",
    prenom: "",
    sexe: "",
    age: "",
    email: "",
    photo: null,
    allergies: [],
    maladies: [],
    estMalade: false,
  })
  const [memberIndex, setMemberIndex] = useState(0)
  const [currentAllergy, setCurrentAllergy] = useState("")
  const [currentMaladie, setCurrentMaladie] = useState("")
  const [meals, setMeals] = useState([])
  const [currentMeal, setCurrentMeal] = useState({
    nom: "",
    photo: null,
    description: "",
    categorie: "dejeuner",
    ingredients: [],
  })
  const [currentIngredient, setCurrentIngredient] = useState({
    nom: "",
    quantite: "",
    unite: "piece",
    photo: null,
    prix: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const navigate = useNavigate()

  const totalSteps = 5
  const allergiesCommunes = [
    "Arachides",
    "Fruits à coque",
    "Lait",
    "Œufs",
    "Poisson",
    "Crustacés",
    "Soja",
    "Blé",
    "Sésame",
    "Moutarde",
  ]

  const maladiesCommunes = [
    "Diabète",
    "Hypertension",
    "Cholestérol",
    "Maladie cardiaque",
    "Asthme",
    "Arthrite",
    "Anémie",
  ]

  const unitesAfricaines = [
    "piece",
    "morceau",
    "pincée",
    "cuillère à café",
    "cuillère à soupe",
    "verre",
    "bol",
    "tasse",
    "boîte",
    "sachet",
    "kg",
    "g",
    "l",
    "ml",
    "poignée",
    "botte",
    "régime",
    "grappe",
  ]

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        if (error) throw error
        if (user) {
          setUser(user)
          setCurrentMember((prev) => ({
            ...prev,
            nom: user.user_metadata?.nom || "",
            prenom: user.user_metadata?.prenom || "",
            email: user.email || "",
          }))
        } else {
          navigate("/connexion")
        }
      } catch (error) {
        console.error("Erreur récupération utilisateur:", error)
        navigate("/connexion")
      }
    }
    getCurrentUser()
  }, [navigate])

  const showSuccess = (message) => {
    setSuccess(message)
    setError("")
    setTimeout(() => setSuccess(""), 3000)
  }

  const showError = (message) => {
    setError(message)
    setSuccess("")
  }

  const progressPercentage = (currentStep / totalSteps) * 100

  const handleNext = () => {
    if (currentStep === 1 && familyData.nomFamille && familyData.nombreMembres > 0) {
      initializeMembers()
      setCurrentStep(2)
      showSuccess("Configuration famille enregistrée !")
    } else if (currentStep === 2) {
      if (currentMember.nom && currentMember.prenom && currentMember.sexe && currentMember.age) {
        saveMemberAndNext()
      } else {
        showError("Veuillez remplir tous les champs obligatoires")
      }
    } else if (currentStep === 3) {
      setCurrentStep(4)
      showSuccess("Configuration des repas terminée !")
    } else if (currentStep === 4) {
      setCurrentStep(5)
      showSuccess("Prêt pour la finalisation !")
    }
  }

  const handlePrevious = () => {
    if (currentStep === 2 && memberIndex > 0) {
      setMemberIndex(memberIndex - 1)
      setCurrentMember(familyData.membres[memberIndex - 1])
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const initializeMembers = () => {
    const membres = Array(familyData.nombreMembres)
      .fill(null)
      .map(() => ({
        nom: "",
        prenom: "",
        sexe: "",
        age: "",
        email: "",
        photo: null,
        allergies: [],
        maladies: [],
        estMalade: false,
      }))
    membres[0] = { ...currentMember }
    setFamilyData((prev) => ({ ...prev, membres }))
  }

  const saveMemberAndNext = () => {
    const updatedMembres = [...familyData.membres]
    updatedMembres[memberIndex] = { ...currentMember }
    setFamilyData((prev) => ({ ...prev, membres: updatedMembres }))

    if (memberIndex < familyData.nombreMembres - 1) {
      setMemberIndex(memberIndex + 1)
      setCurrentMember(
        familyData.membres[memberIndex + 1] || {
          nom: "",
          prenom: "",
          sexe: "",
          age: "",
          email: "",
          photo: null,
          allergies: [],
          maladies: [],
          estMalade: false,
        },
      )
      showSuccess(`Membre ${memberIndex + 1} enregistré !`)
    } else {
      setCurrentStep(3)
      showSuccess("Tous les membres ont été configurés !")
    }
  }

  const handlePhotoUpload = (e, type = "member") => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError("La photo ne doit pas dépasser 5MB")
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        if (type === "member") {
          setCurrentMember((prev) => ({ ...prev, photo: e.target.result }))
          showSuccess("Photo ajoutée avec succès !")
        } else if (type === "meal") {
          setCurrentMeal((prev) => ({ ...prev, photo: e.target.result }))
          showSuccess("Photo du repas ajoutée !")
        } else if (type === "ingredient") {
          setCurrentIngredient((prev) => ({ ...prev, photo: e.target.result }))
          showSuccess("Photo de l'ingrédient ajoutée !")
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const addAllergy = () => {
    if (currentAllergy.trim()) {
      setCurrentMember((prev) => ({
        ...prev,
        allergies: [...prev.allergies, currentAllergy.trim()],
      }))
      setCurrentAllergy("")
      showSuccess("Allergie ajoutée !")
    }
  }

  const removeAllergy = (index) => {
    setCurrentMember((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }))
    showSuccess("Allergie supprimée !")
  }

  const addMaladie = () => {
    if (currentMaladie.trim()) {
      setCurrentMember((prev) => ({
        ...prev,
        maladies: [...prev.maladies, currentMaladie.trim()],
      }))
      setCurrentMaladie("")
      showSuccess("Maladie ajoutée !")
    }
  }

  const removeMaladie = (index) => {
    setCurrentMember((prev) => ({
      ...prev,
      maladies: prev.maladies.filter((_, i) => i !== index),
    }))
    showSuccess("Maladie supprimée !")
  }

  const addIngredientToMeal = () => {
    if (currentIngredient.nom && currentIngredient.quantite) {
      setCurrentMeal((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, { ...currentIngredient, id: Date.now() }],
      }))
      setCurrentIngredient({
        nom: "",
        quantite: "",
        unite: "piece",
        photo: null,
        prix: "",
        description: "",
      })
      showSuccess("Ingrédient ajouté au repas !")
    } else {
      showError("Nom et quantité sont obligatoires")
    }
  }

  const removeIngredientFromMeal = (id) => {
    setCurrentMeal((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((ing) => ing.id !== id),
    }))
    showSuccess("Ingrédient supprimé !")
  }

  const saveMeal = () => {
    if (currentMeal.nom && currentMeal.ingredients.length > 0) {
      setMeals((prev) => [...prev, { ...currentMeal, id: Date.now() }])
      setCurrentMeal({
        nom: "",
        photo: null,
        description: "",
        categorie: "dejeuner",
        ingredients: [],
      })
      showSuccess("Repas sauvegardé avec succès !")
    } else {
      showError("Le repas doit avoir un nom et au moins un ingrédient")
    }
  }

  const removeMeal = (id) => {
    setMeals((prev) => prev.filter((meal) => meal.id !== id))
    showSuccess("Repas supprimé !")
  }

  const handleFinish = async () => {
    setLoading(true)
    setError("")

    try {
      const finalMembres = [...familyData.membres]
      if (currentStep === 2) {
        finalMembres[memberIndex] = { ...currentMember }
      }

      // 1. Créer la famille
      const { data: familyProfile, error: familyError } = await supabase
        .from(TABLES.FAMILIES)
        .insert([
          {
            user_id: user.id,
            nom_famille: familyData.nomFamille,
            nombre_membres: familyData.nombreMembres,
          },
        ])
        .select()
        .single()

      if (familyError) throw familyError

      // 2. Ajouter les membres
      if (finalMembres.length > 0) {
        const membersToInsert = finalMembres.map((membre) => ({
          family_id: familyProfile.id,
          nom: membre.nom,
          prenom: membre.prenom,
          sexe: membre.sexe || "autre",
          age: Number.parseInt(membre.age) || null,
          email: membre.email || null,
          photo_url: membre.photo || null,
          allergies: membre.allergies || [],
          maladies: membre.maladies || [],
          est_malade: membre.estMalade || false,
        }))

        const { error: membersError } = await supabase.from(TABLES.FAMILY_MEMBERS).insert(membersToInsert)
        if (membersError) throw membersError
      }

      // 3. Ajouter les repas et ingrédients
      if (meals.length > 0) {
        for (const meal of meals) {
          const { data: mealData, error: mealError } = await supabase
            .from(TABLES.MEALS)
            .insert([
              {
                family_id: familyProfile.id,
                nom: meal.nom,
                description: meal.description,
                categorie: meal.categorie,
                photo_url: meal.photo,
              },
            ])
            .select()
            .single()

          if (mealError) throw mealError

          for (const ingredient of meal.ingredients) {
            const { data: ingredientData, error: ingredientError } = await supabase
              .from(TABLES.INGREDIENTS)
              .insert([
                {
                  family_id: familyProfile.id,
                  nom: ingredient.nom,
                  description: ingredient.description,
                  unite_mesure: ingredient.unite,
                  prix_unitaire: Number.parseFloat(ingredient.prix) || 0,
                  photo_url: ingredient.photo,
                },
              ])
              .select()
              .single()

            if (ingredientError) throw ingredientError

            await supabase.from(TABLES.MEAL_INGREDIENTS).insert([
              {
                meal_id: mealData.id,
                ingredient_id: ingredientData.id,
                quantite: Number.parseFloat(ingredient.quantite),
                unite: ingredient.unite,
              },
            ])
          }
        }
      }

      showSuccess("Configuration terminée avec succès !")
      setTimeout(() => navigate("/dashboard"), 2000)
    } catch (error) {
      console.error("Erreur lors de la création du profil:", error)
      showError(handleSupabaseError(error))
    }

    setLoading(false)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <div
                className={`w-20 h-20 ${darkMode ? "bg-gray-800" : "bg-green-100"} rounded-2xl flex items-center justify-center mx-auto mb-6`}
              >
                <i className={`fas fa-home ${darkMode ? "text-green-400" : "text-green-600"} text-2xl`}></i>
              </div>
              <h2 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-4`}>
                Bonjour {user?.user_metadata?.prenom || ""}
              </h2>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} text-lg`}>Configurons votre famille</p>
            </div>

            <div className="space-y-8">
              <div>
                <label className={`block text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"} mb-3`}>
                  <i className={`fas fa-users mr-2 ${darkMode ? "text-green-400" : "text-green-500"}`}></i>
                  Nom de votre famille
                </label>
                <input
                  type="text"
                  value={familyData.nomFamille}
                  onChange={(e) => setFamilyData({ ...familyData, nomFamille: e.target.value })}
                  className={`w-full px-6 py-4 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-lg`}
                  placeholder="Famille Martin"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"} mb-3`}>
                  <i className={`fas fa-user-friends mr-2 ${darkMode ? "text-green-400" : "text-green-500"}`}></i>
                  Nombre de membres
                </label>
                <div className="flex justify-center items-center space-x-6">
                  <button
                    onClick={() =>
                      setFamilyData({
                        ...familyData,
                        nombreMembres: Math.max(1, familyData.nombreMembres - 1),
                      })
                    }
                    className={`w-12 h-12 ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} rounded-xl flex items-center justify-center transition-all`}
                  >
                    <i className={`fas fa-minus ${darkMode ? "text-gray-300" : "text-gray-600"}`}></i>
                  </button>
                  <div className={`text-4xl font-bold ${darkMode ? "text-white" : "text-gray-900"} w-16 text-center`}>
                    {familyData.nombreMembres}
                  </div>
                  <button
                    onClick={() =>
                      setFamilyData({
                        ...familyData,
                        nombreMembres: familyData.nombreMembres + 1,
                      })
                    }
                    className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center transition-all"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div
                className={`w-20 h-20 ${darkMode ? "bg-gray-800" : "bg-green-100"} rounded-2xl flex items-center justify-center mx-auto mb-6`}
              >
                <i className={`fas fa-user ${darkMode ? "text-green-400" : "text-green-600"} text-2xl`}></i>
              </div>
              <h2 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-2`}>
                Membre {memberIndex + 1}/{familyData.nombreMembres}
              </h2>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {memberIndex === 0 ? "Commençons par vous" : `Configurons le membre ${memberIndex + 1}`}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Informations de base */}
              <div className="space-y-6">
                <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"} flex items-center`}>
                  <i className={`fas fa-id-card mr-3 ${darkMode ? "text-green-400" : "text-green-500"}`}></i>
                  Informations personnelles
                </h3>

                {/* Photo */}
                <div className="text-center">
                  <div
                    className={`w-32 h-32 mx-auto mb-4 rounded-2xl overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-100"} flex items-center justify-center`}
                  >
                    {currentMember.photo ? (
                      <img
                        src={currentMember.photo || "/placeholder.svg"}
                        alt="Photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className={`fas fa-camera ${darkMode ? "text-gray-400" : "text-gray-400"} text-2xl`}></i>
                    )}
                  </div>
                  <label
                    className={`cursor-pointer ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-900 text-white hover:bg-gray-800"} px-6 py-3 rounded-xl font-medium transition-all inline-flex items-center`}
                  >
                    <i className="fas fa-upload mr-2"></i>
                    Ajouter une photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, "member")}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"} mb-2`}>
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={currentMember.prenom}
                      onChange={(e) => setCurrentMember({ ...currentMember, prenom: e.target.value })}
                      className={`w-full px-4 py-3 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                      placeholder="Prénom"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"} mb-2`}>
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={currentMember.nom}
                      onChange={(e) => setCurrentMember({ ...currentMember, nom: e.target.value })}
                      className={`w-full px-4 py-3 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                      placeholder="Nom"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"} mb-2`}>
                      Sexe *
                    </label>
                    <select
                      value={currentMember.sexe}
                      onChange={(e) => setCurrentMember({ ...currentMember, sexe: e.target.value })}
                      className={`w-full px-4 py-3 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                    >
                      <option value="">Sélectionner</option>
                      <option value="homme">Homme</option>
                      <option value="femme">Femme</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"} mb-2`}>
                      Âge *
                    </label>
                    <input
                      type="number"
                      value={currentMember.age}
                      onChange={(e) => setCurrentMember({ ...currentMember, age: e.target.value })}
                      className={`w-full px-4 py-3 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                      placeholder="Âge"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"} mb-2`}>
                    <i className={`fas fa-envelope mr-2 ${darkMode ? "text-green-400" : "text-green-500"}`}></i>
                    Email (optionnel)
                  </label>
                  <input
                    type="email"
                    value={currentMember.email}
                    onChange={(e) => setCurrentMember({ ...currentMember, email: e.target.value })}
                    className={`w-full px-4 py-3 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                    placeholder="email@exemple.com"
                  />
                </div>
              </div>

              {/* Santé */}
              <div className="space-y-6">
                <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"} flex items-center`}>
                  <i className="fas fa-heartbeat mr-3 text-red-500"></i>
                  Santé et allergies
                </h3>

                {/* Allergies */}
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"} mb-3`}>
                    <i className="fas fa-exclamation-triangle mr-2 text-amber-500"></i>
                    Allergies
                  </label>

                  <div className="grid grid-cols-2 gap-2 mb-4 max-h-40 overflow-y-auto">
                    {allergiesCommunes.map((allergie) => (
                      <label
                        key={allergie}
                        className={`flex items-center space-x-2 cursor-pointer p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                      >
                        <input
                          type="checkbox"
                          checked={currentMember.allergies.includes(allergie)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCurrentMember((prev) => ({
                                ...prev,
                                allergies: [...prev.allergies, allergie],
                              }))
                            } else {
                              setCurrentMember((prev) => ({
                                ...prev,
                                allergies: prev.allergies.filter((a) => a !== allergie),
                              }))
                            }
                          }}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{allergie}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Autre allergie..."
                      value={currentAllergy}
                      onChange={(e) => setCurrentAllergy(e.target.value)}
                      className={`flex-1 px-4 py-2 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                      onKeyPress={(e) => e.key === "Enter" && addAllergy()}
                    />
                    <button
                      onClick={addAllergy}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>

                  {/* Allergies ajoutées */}
                  {currentMember.allergies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {currentMember.allergies.map((allergie, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm border border-red-200"
                        >
                          <i className="fas fa-exclamation-circle mr-1"></i>
                          {allergie}
                          <button onClick={() => removeAllergy(index)} className="ml-2 text-red-500 hover:text-red-700">
                            <i className="fas fa-times"></i>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Maladies */}
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={currentMember.estMalade}
                      onChange={(e) => setCurrentMember({ ...currentMember, estMalade: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                      <i className={`fas fa-stethoscope mr-2 ${darkMode ? "text-green-400" : "text-green-500"}`}></i>
                      Ce membre a des problèmes de santé
                    </span>
                  </label>

                  {currentMember.estMalade && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                        {maladiesCommunes.map((maladie) => (
                          <label
                            key={maladie}
                            className={`flex items-center space-x-2 cursor-pointer p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                          >
                            <input
                              type="checkbox"
                              checked={currentMember.maladies.includes(maladie)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCurrentMember((prev) => ({
                                    ...prev,
                                    maladies: [...prev.maladies, maladie],
                                  }))
                                } else {
                                  setCurrentMember((prev) => ({
                                    ...prev,
                                    maladies: prev.maladies.filter((m) => m !== maladie),
                                  }))
                                }
                              }}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{maladie}</span>
                          </label>
                        ))}
                      </div>

                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Autre maladie..."
                          value={currentMaladie}
                          onChange={(e) => setCurrentMaladie(e.target.value)}
                          className={`flex-1 px-4 py-2 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                          onKeyPress={(e) => e.key === "Enter" && addMaladie()}
                        />
                        <button
                          onClick={addMaladie}
                          className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all"
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>

                      {/* Maladies ajoutées */}
                      {currentMember.maladies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {currentMember.maladies.map((maladie, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm border border-red-200"
                            >
                              <i className="fas fa-stethoscope mr-1"></i>
                              {maladie}
                              <button
                                onClick={() => removeMaladie(index)}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div
                className={`w-20 h-20 ${darkMode ? "bg-gray-800" : "bg-green-100"} rounded-2xl flex items-center justify-center mx-auto mb-6`}
              >
                <i className={`fas fa-utensils ${darkMode ? "text-green-400" : "text-green-600"} text-2xl`}></i>
              </div>
              <h2 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-2`}>
                Configuration des repas
              </h2>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Ajoutez vos plats favoris avec leurs ingrédients
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Formulaire repas */}
              <div className="space-y-6">
                <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"} flex items-center`}>
                  <i className="fas fa-plus-circle mr-3 text-green-500"></i>
                  Nouveau repas
                </h3>

                <div className="text-center">
                  <div
                    className={`w-32 h-32 mx-auto mb-4 rounded-2xl overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-100"} flex items-center justify-center`}
                  >
                    {currentMeal.photo ? (
                      <img
                        src={currentMeal.photo || "/placeholder.svg"}
                        alt="Repas"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className={`fas fa-camera ${darkMode ? "text-gray-400" : "text-gray-400"} text-2xl`}></i>
                    )}
                  </div>
                  <label
                    className={`cursor-pointer ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-900 text-white hover:bg-gray-800"} px-6 py-3 rounded-xl font-medium transition-all inline-flex items-center`}
                  >
                    <i className="fas fa-upload mr-2"></i>
                    Photo du repas
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, "meal")}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"} mb-2`}>
                    Nom du repas
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Riz au poulet"
                    value={currentMeal.nom}
                    onChange={(e) => setCurrentMeal({ ...currentMeal, nom: e.target.value })}
                    className={`w-full px-4 py-3 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"} mb-2`}>
                    Description
                  </label>
                  <textarea
                    placeholder="Description du repas..."
                    value={currentMeal.description}
                    onChange={(e) => setCurrentMeal({ ...currentMeal, description: e.target.value })}
                    className={`w-full px-4 py-3 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all h-24`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"} mb-2`}>
                    Catégorie
                  </label>
                  <select
                    value={currentMeal.categorie}
                    onChange={(e) => setCurrentMeal({ ...currentMeal, categorie: e.target.value })}
                    className={`w-full px-4 py-3 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                  >
                    <option value="petit-dejeuner">Petit-déjeuner</option>
                    <option value="dejeuner">Déjeuner</option>
                    <option value="diner">Dîner</option>
                  </select>
                </div>

                {/* Formulaire ingrédient */}
                <div className={`border-t ${darkMode ? "border-gray-600" : "border-gray-200"} pt-6`}>
                  <h4
                    className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-4 flex items-center`}
                  >
                    <i className="fas fa-carrot mr-2 text-orange-500"></i>
                    Ajouter un ingrédient
                  </h4>

                  <div className="text-center mb-4">
                    <div
                      className={`w-20 h-20 mx-auto mb-3 rounded-xl overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-100"} flex items-center justify-center`}
                    >
                      {currentIngredient.photo ? (
                        <img
                          src={currentIngredient.photo || "/placeholder.svg"}
                          alt="Ingrédient"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <i className={`fas fa-camera ${darkMode ? "text-gray-400" : "text-gray-400"}`}></i>
                      )}
                    </div>
                    <label
                      className={`cursor-pointer ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} px-4 py-2 rounded-lg text-sm transition-all inline-flex items-center`}
                    >
                      <i className="fas fa-upload mr-2"></i>
                      Photo ingrédient
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, "ingredient")}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Nom ingrédient"
                      value={currentIngredient.nom}
                      onChange={(e) => setCurrentIngredient({ ...currentIngredient, nom: e.target.value })}
                      className={`px-4 py-3 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                    />
                    <input
                      type="number"
                      placeholder="Quantité"
                      value={currentIngredient.quantite}
                      onChange={(e) => setCurrentIngredient({ ...currentIngredient, quantite: e.target.value })}
                      className={`px-4 py-3 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <select
                      value={currentIngredient.unite}
                      onChange={(e) => setCurrentIngredient({ ...currentIngredient, unite: e.target.value })}
                      className={`px-4 py-3 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                    >
                      {unitesAfricaines.map((unite) => (
                        <option key={unite} value={unite}>
                          {unite}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Prix (optionnel)"
                      value={currentIngredient.prix}
                      onChange={(e) => setCurrentIngredient({ ...currentIngredient, prix: e.target.value })}
                      className={`px-4 py-3 border ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-900"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                    />
                  </div>

                  <button
                    onClick={addIngredientToMeal}
                    className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition-all"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Ajouter l'ingrédient
                  </button>
                </div>

                <button
                  onClick={saveMeal}
                  disabled={!currentMeal.nom || currentMeal.ingredients.length === 0}
                  className={`w-full ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-900 hover:bg-gray-800"} text-white py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <i className="fas fa-save mr-2"></i>
                  Sauvegarder le repas
                </button>
              </div>

              {/* Liste des ingrédients et repas */}
              <div className="space-y-6">
                {/* Ingrédients du repas actuel */}
                {currentMeal.ingredients.length > 0 && (
                  <div>
                    <h4
                      className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-4 flex items-center`}
                    >
                      <i className={`fas fa-list mr-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}></i>
                      Ingrédients du repas ({currentMeal.ingredients.length})
                    </h4>
                    <div className="space-y-2">
                      {currentMeal.ingredients.map((ingredient) => (
                        <div
                          key={ingredient.id}
                          className={`flex items-center justify-between p-3 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"} rounded-xl border`}
                        >
                          <div className="flex items-center space-x-3">
                            {ingredient.photo && (
                              <img
                                src={ingredient.photo || "/placeholder.svg"}
                                alt={ingredient.nom}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                                {ingredient.nom}
                              </span>
                              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                {ingredient.quantite} {ingredient.unite}
                                {ingredient.prix && ` - ${ingredient.prix}€`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeIngredientFromMeal(ingredient.id)}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repas sauvegardés */}
                {meals.length > 0 && (
                  <div>
                    <h4
                      className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"} mb-4 flex items-center`}
                    >
                      <i className="fas fa-check-circle mr-2 text-green-500"></i>
                      Repas configurés ({meals.length})
                    </h4>
                    <div className="space-y-3">
                      {meals.map((meal) => (
                        <div
                          key={meal.id}
                          className={`p-4 border ${darkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-white"} rounded-xl`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {meal.photo && (
                                <img
                                  src={meal.photo || "/placeholder.svg"}
                                  alt={meal.nom}
                                  className="w-16 h-16 rounded-xl object-cover"
                                />
                              )}
                              <div>
                                <h5 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                                  {meal.nom}
                                </h5>
                                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} capitalize`}>
                                  {meal.categorie} • {meal.ingredients.length} ingrédients
                                </p>
                                {meal.description && (
                                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>
                                    {meal.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button onClick={() => removeMeal(meal.id)} className="text-red-500 hover:text-red-700 p-2">
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="max-w-2xl mx-auto text-center">
            <div
              className={`w-20 h-20 ${darkMode ? "bg-gray-800" : "bg-green-100"} rounded-2xl flex items-center justify-center mx-auto mb-6`}
            >
              <i className={`fas fa-calendar-alt ${darkMode ? "text-green-400" : "text-green-600"} text-2xl`}></i>
            </div>
            <h2 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-4`}>
              Planification des repas
            </h2>
            <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} text-lg mb-8`}>
              Cette fonctionnalité sera disponible dans votre dashboard
            </p>

            <div
              className={`${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"} border rounded-2xl p-8`}
            >
              <i className="fas fa-info-circle text-green-500 text-2xl mb-4"></i>
              <p className={`${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                Vous pourrez planifier vos repas par jour, semaine ou mois directement depuis votre tableau de bord.
              </p>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-check-circle text-green-600 text-2xl"></i>
            </div>
            <h2 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-4`}>
              Configuration terminée !
            </h2>
            <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} text-lg mb-8`}>
              Récapitulatif de votre configuration
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <i className="fas fa-users text-green-600 text-2xl mb-4"></i>
                <h4 className="font-bold text-green-900 mb-2">Famille</h4>
                <p className="text-green-700">{familyData.nomFamille}</p>
                <p className="text-green-600 text-sm">{familyData.nombreMembres} membres</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <i className="fas fa-utensils text-blue-600 text-2xl mb-4"></i>
                <h4 className="font-bold text-blue-900 mb-2">Repas</h4>
                <p className="text-blue-700">{meals.length} repas configurés</p>
                <p className="text-blue-600 text-sm">
                  {meals.reduce((total, meal) => total + meal.ingredients.length, 0)} ingrédients
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                <i className="fas fa-heartbeat text-purple-600 text-2xl mb-4"></i>
                <h4 className="font-bold text-purple-900 mb-2">Santé</h4>
                <p className="text-purple-700">
                  {familyData.membres.reduce((total, membre) => total + (membre.allergies?.length || 0), 0)} allergies
                </p>
                <p className="text-purple-600 text-sm">Profils configurés</p>
              </div>
            </div>

            <div
              className={`${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"} border rounded-2xl p-6 mb-8`}
            >
              <h4 className={`font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-4`}>Prochaines étapes</h4>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start space-x-3">
                  <i className="fas fa-calendar-check text-green-500 mt-1"></i>
                  <div>
                    <p className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Planifier vos repas</p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Organisez vos menus par semaine
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fas fa-shopping-cart text-blue-500 mt-1"></i>
                  <div>
                    <p className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                      Générer vos listes de courses
                    </p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Automatiquement basées sur vos repas
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fas fa-chart-line text-purple-500 mt-1"></i>
                  <div>
                    <p className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                      Suivre vos statistiques
                    </p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Nutrition et budget</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fas fa-robot text-orange-500 mt-1"></i>
                  <div>
                    <p className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Assistant IA</p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Suggestions personnalisées
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50"} py-8 px-4`}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <i className="fas fa-leaf text-white text-xl"></i>
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Configuration FamilyMeal
              </h1>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Étape {currentStep} sur {totalSteps}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-xl ${darkMode ? "bg-gray-700 text-yellow-400 hover:bg-gray-600" : "bg-white text-gray-600 hover:bg-gray-50"} transition-all shadow-lg`}
          >
            <i className={`fas ${darkMode ? "fa-sun" : "fa-moon"}`}></i>
          </button>
        </div>

        {/* Barre de progression */}
        <div className={`mt-6 ${darkMode ? "bg-gray-700" : "bg-white"} rounded-full h-3 shadow-inner`}>
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-4 flex items-center">
            <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 flex items-center">
            <i className="fas fa-check-circle text-green-500 mr-3"></i>
            <span className="text-green-700 font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div
        className={`max-w-7xl mx-auto ${darkMode ? "bg-gray-800" : "bg-white"} rounded-3xl shadow-2xl p-8 border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
      >
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto mt-8 flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1 && memberIndex === 0}
          className={`px-6 py-3 ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Précédent
        </button>

        <div className="flex space-x-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i + 1 === currentStep
                  ? "bg-green-500 scale-125"
                  : i + 1 < currentStep
                    ? "bg-green-400"
                    : darkMode
                      ? "bg-gray-600"
                      : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {currentStep === totalSteps ? (
          <button
            onClick={handleFinish}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-3"></i>
                Finalisation...
              </>
            ) : (
              <>
                <i className="fas fa-rocket mr-3"></i>
                Terminer la configuration
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center"
          >
            Suivant
            <i className="fas fa-arrow-right ml-2"></i>
          </button>
        )}
      </div>
    </div>
  )
}

export default PageOnboarding
