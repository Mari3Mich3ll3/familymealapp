"use client"
import { useState, useEffect } from "react"
import {
  getUserFamilies,
  getFamilyMembers,
  getMemberDetails,
  saveFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  createFamily,
  getAllergies,
} from "../../services/supabase"
import {
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUser,
  FaMale,
  FaFemale,
  FaChild,
  FaExclamationTriangle,
  FaHeart,
  FaCamera,
  FaSave,
  FaTimes,
  FaUserPlus,
  FaEnvelope,
  FaSpinner,
  FaSearch,
  FaEye,
  FaCheck,
  FaExclamationCircle,
  FaInfoCircle,
  FaCalendarAlt,
  FaShieldAlt,
  FaBirthdayCake,
} from "react-icons/fa"

const FamilyPage = () => {
  // Utility functions pour gérer l'affichage des données
  const getDiseaseName = (disease) => {
    if (typeof disease === "string") return disease
    return disease?.disease_name || disease?.name || "Maladie non spécifiée"
  }

  const getDiseaseCount = (diseases) => {
    if (!diseases || !Array.isArray(diseases)) return 0
    return diseases.length
  }

  const getAllergyCount = (allergies) => {
    if (!allergies || !Array.isArray(allergies)) return 0
    return allergies.length
  }

  const [families, setFamilies] = useState([])
  const [selectedFamily, setSelectedFamily] = useState(null)
  const [members, setMembers] = useState([])
  const [filteredMembers, setFilteredMembers] = useState([])
  const [commonAllergies, setCommonAllergies] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showFamilyModal, setShowFamilyModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberDetails, setMemberDetails] = useState(null)
  const [notification, setNotification] = useState(null)
  const [newDisease, setNewDisease] = useState("")

  const [memberForm, setMemberForm] = useState({
    name: "",
    gender: "male",
    age: "",
    email: "",
    photo: "",
    allergies: [],
    diseases: [],
    hasHealthIssues: false,
  })

  const [familyForm, setFamilyForm] = useState({
    name: "",
    memberCount: 0,
  })

  const [errors, setErrors] = useState({})

  // Notification system
  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMembers(members)
    } else {
      const filtered = members.filter(
        (member) =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.allergies?.some((allergy) => allergy.toLowerCase().includes(searchTerm.toLowerCase())) ||
          member.diseases?.some((disease) => {
            const diseaseName = getDiseaseName(disease)
            return diseaseName.toLowerCase().includes(searchTerm.toLowerCase())
          }),
      )
      setFilteredMembers(filtered)
    }
  }, [searchTerm, members])

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedFamily) {
      loadFamilyMembers(selectedFamily.id)
    }
  }, [selectedFamily])

  const loadInitialData = async () => {
    try {
      setLoading(true)

      // Charger les familles
      const familiesResult = await getUserFamilies()
      if (familiesResult.error) {
        throw new Error(familiesResult.error.message)
      }

      if (familiesResult.data) {
        setFamilies(familiesResult.data)
        if (familiesResult.data.length > 0 && !selectedFamily) {
          setSelectedFamily(familiesResult.data[0])
        }
      }

      // Charger les allergies communes
      const allergiesResult = await getAllergies()
      if (allergiesResult.data) {
        setCommonAllergies(allergiesResult.data.map((a) => a.name))
      }
    } catch (error) {
      console.error("Erreur lors du chargement initial:", error)
      showNotification("Erreur lors du chargement des données", "error")
    } finally {
      setLoading(false)
    }
  }

  const validateMemberForm = () => {
    const newErrors = {}

    if (!memberForm.name.trim()) {
      newErrors.name = "Le nom est obligatoire"
    }

    if (memberForm.email && !/\S+@\S+\.\S+/.test(memberForm.email)) {
      newErrors.email = "Email invalide"
    }

    if (memberForm.age && (isNaN(memberForm.age) || memberForm.age < 0 || memberForm.age > 150)) {
      newErrors.age = "Âge invalide"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateFamilyForm = () => {
    const newErrors = {}

    if (!familyForm.name.trim()) {
      newErrors.familyName = "Le nom de famille est obligatoire"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const loadFamilyMembers = async (familyId) => {
    try {
      const result = await getFamilyMembers(familyId)
      if (result.error) {
        throw new Error(result.error.message)
      }
      if (result.data) {
        setMembers(result.data)
        setFilteredMembers(result.data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error)
      showNotification("Erreur lors du chargement des membres", "error")
    }
  }

  const handleCreateFamily = async () => {
    if (!validateFamilyForm()) return

    try {
      setSaving(true)
      const result = await createFamily(familyForm)
      if (result.error) {
        throw new Error(result.error.message)
      }
      if (result.data) {
        setFamilies([result.data, ...families])
        setSelectedFamily(result.data)
        setShowFamilyModal(false)
        setFamilyForm({ name: "", memberCount: 0 })
        setErrors({})
        showNotification("Famille créée avec succès")
      }
    } catch (error) {
      console.error("Erreur lors de la création de la famille:", error)
      showNotification("Erreur lors de la création de la famille", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMember = async () => {
    if (!validateMemberForm()) return
    if (!selectedFamily) {
      showNotification("Veuillez sélectionner une famille", "error")
      return
    }

    try {
      setSaving(true)
      const memberData = {
        ...memberForm,
        diseases: memberForm.hasHealthIssues ? memberForm.diseases : [],
      }

      if (editingMember) {
        const result = await updateFamilyMember(editingMember.id, memberData)
        if (result.error) {
          throw new Error(result.error.message)
        }
        showNotification("Membre modifié avec succès")
      } else {
        const result = await saveFamilyMember(memberData, selectedFamily.id)
        if (result.error) {
          throw new Error(result.error.message)
        }
        showNotification("Membre ajouté avec succès")
      }

      loadFamilyMembers(selectedFamily.id)
      setShowMemberModal(false)
      resetMemberForm()
      setErrors({})
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du membre:", error)
      showNotification("Erreur lors de la sauvegarde", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${memberName} ?`)) {
      return
    }

    try {
      const result = await deleteFamilyMember(memberId)
      if (result.error) {
        throw new Error(result.error.message)
      }
      loadFamilyMembers(selectedFamily.id)
      showNotification("Membre supprimé avec succès")
    } catch (error) {
      console.error("Erreur lors de la suppression du membre:", error)
      showNotification("Erreur lors de la suppression", "error")
    }
  }

  const handleEditMember = (member) => {
    setEditingMember(member)

    // Convertir les maladies objets en chaînes pour l'édition
    const diseasesArray = member.diseases
      ? member.diseases.map((disease) => getDiseaseName(disease)).filter(Boolean)
      : []

    setMemberForm({
      name: member.name || "",
      gender: member.gender || "male",
      age: member.age?.toString() || "",
      email: member.email || "",
      photo: member.photo_url || "",
      allergies: member.allergies || [],
      diseases: diseasesArray,
      hasHealthIssues: diseasesArray.length > 0 || member.is_sick || false,
    })
    setErrors({})
    setShowMemberModal(true)
  }

  const handleViewDetails = async (member) => {
    try {
      setSelectedMember(member)

      // Charger les détails complets du membre
      const result = await getMemberDetails(member.id)
      if (result.error) {
        throw new Error(result.error.message)
      }

      setMemberDetails(result.data)
      setShowDetailsModal(true)
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
      showNotification("Erreur lors du chargement des détails", "error")
    }
  }

  const resetMemberForm = () => {
    setEditingMember(null)
    setMemberForm({
      name: "",
      gender: "male",
      age: "",
      email: "",
      photo: "",
      allergies: [],
      diseases: [],
      hasHealthIssues: false,
    })
    setNewDisease("")
    setErrors({})
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification("La taille de l'image ne doit pas dépasser 5MB", "error")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setMemberForm({ ...memberForm, photo: e.target.result })
      }
      reader.onerror = () => {
        showNotification("Erreur lors du chargement de l'image", "error")
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleAllergy = (allergy) => {
    const updatedAllergies = memberForm.allergies.includes(allergy)
      ? memberForm.allergies.filter((a) => a !== allergy)
      : [...memberForm.allergies, allergy]
    setMemberForm({ ...memberForm, allergies: updatedAllergies })
  }

  const addDisease = () => {
    if (newDisease.trim() && !memberForm.diseases.includes(newDisease.trim())) {
      setMemberForm({
        ...memberForm,
        diseases: [...memberForm.diseases, newDisease.trim()],
      })
      setNewDisease("")
    }
  }

  const removeDisease = (diseaseToRemove) => {
    setMemberForm({
      ...memberForm,
      diseases: memberForm.diseases.filter((disease) => disease !== diseaseToRemove),
    })
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addDisease()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg">
            <FaUsers className="text-white text-2xl" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Chargement des familles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300"
              : notification.type === "error"
                ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300"
                : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300"
          } animate-slide-in-bottom`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === "success" && <FaCheck className="text-green-500" />}
            {notification.type === "error" && <FaExclamationCircle className="text-red-500" />}
            {notification.type === "info" && <FaInfoCircle className="text-blue-500" />}
            <span className="font-medium">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 text-gray-400 hover:text-gray-600">
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion de la Famille</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez les membres de votre famille et leurs informations de santé
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFamilyModal(true)}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
          >
            <FaPlus className="text-sm" />
            <span>Nouvelle famille</span>
          </button>
          {selectedFamily && (
            <button
              onClick={() => {
                resetMemberForm()
                setShowMemberModal(true)
              }}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <FaUserPlus className="text-sm" />
              <span>Ajouter membre</span>
            </button>
          )}
        </div>
      </div>

      {/* Family Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <FaUsers className="text-blue-600 dark:text-blue-400 text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{families.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Famille{families.length > 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <FaUser className="text-emerald-600 dark:text-emerald-400 text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{members.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Membres actifs</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <FaExclamationTriangle className="text-orange-600 dark:text-orange-400 text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {members.filter((m) => getAllergyCount(m.allergies) > 0).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avec allergies</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <FaHeart className="text-red-600 dark:text-red-400 text-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {members.filter((m) => getDiseaseCount(m.diseases) > 0 || m.is_sick).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Problèmes santé</p>
            </div>
          </div>
        </div>
      </div>

      {/* Family Selector */}
      {families.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Sélectionner une famille</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {families.map((family) => (
              <button
                key={family.id}
                onClick={() => setSelectedFamily(family)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  selectedFamily?.id === family.id
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 transform scale-105"
                    : "border-gray-300 dark:border-gray-600 hover:border-emerald-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${selectedFamily?.id === family.id ? "bg-emerald-500" : "bg-gray-400"}`}
                  >
                    <FaUsers className="text-white text-lg" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">{family.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {family.member_count || 0} membre{(family.member_count || 0) > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      {selectedFamily && members.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un membre par nom, email, allergie ou maladie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* Members Section */}
      {selectedFamily && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Membres de {selectedFamily.name}</h3>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
              {filteredMembers.length} membre{filteredMembers.length > 1 ? "s" : ""}
              {searchTerm && ` (${members.length} total)`}
            </span>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUsers className="text-gray-400 text-3xl" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Aucun membre</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Commencez par ajouter le premier membre de votre famille
              </p>
              <button
                onClick={() => {
                  resetMemberForm()
                  setShowMemberModal(true)
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                Ajouter le premier membre
              </button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaSearch className="text-gray-400 text-3xl" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Aucun résultat</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Aucun membre ne correspond à votre recherche "{searchTerm}"
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
              >
                Effacer la recherche
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-200/50 dark:border-gray-600/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-14 h-14">
                          {member.photo_url ? (
                            <img
                              src={member.photo_url || "/placeholder.svg"}
                              alt={member.name}
                              className="w-full h-full rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                              {member.gender === "female" ? (
                                <FaFemale className="text-white text-lg" />
                              ) : member.age && Number.parseInt(member.age) < 18 ? (
                                <FaChild className="text-white text-lg" />
                              ) : (
                                <FaMale className="text-white text-lg" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{member.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.age ? `${member.age} ans` : "Âge non spécifié"}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleViewDetails(member)}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors duration-200"
                        title="Voir détails"
                      >
                        <FaEye className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleEditMember(member)}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                        title="Modifier"
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id, member.name)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                        title="Supprimer"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {member.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <FaEnvelope className="text-gray-400 text-xs" />
                        <span className="text-gray-600 dark:text-gray-400 truncate">{member.email}</span>
                      </div>
                    )}

                    {member.allergies && getAllergyCount(member.allergies) > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <FaExclamationTriangle className="text-orange-500 text-sm" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Allergies ({getAllergyCount(member.allergies)})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {member.allergies.slice(0, 3).map((allergy, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-xs font-medium"
                            >
                              {allergy}
                            </span>
                          ))}
                          {getAllergyCount(member.allergies) > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300 rounded-full text-xs">
                              +{getAllergyCount(member.allergies) - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {((member.diseases && getDiseaseCount(member.diseases) > 0) || member.is_sick) && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <FaHeart className="text-red-500 text-sm" />
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            Problèmes de santé {member.diseases && `(${getDiseaseCount(member.diseases)})`}
                          </span>
                        </div>
                        {member.diseases && getDiseaseCount(member.diseases) > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {member.diseases.slice(0, 2).map((disease, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-medium"
                              >
                                {getDiseaseName(disease)}
                              </span>
                            ))}
                            {getDiseaseCount(member.diseases) > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300 rounded-full text-xs">
                                +{getDiseaseCount(member.diseases) - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Family Modal */}
      {showFamilyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nouvelle famille</h2>
              <button
                onClick={() => {
                  setShowFamilyModal(false)
                  setErrors({})
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de la famille *
                </label>
                <input
                  type="text"
                  value={familyForm.name}
                  onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                    errors.familyName ? "border-red-500 dark:border-red-400" : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Ex: Famille Dupont"
                />
                {errors.familyName && <p className="text-red-500 text-sm mt-1">{errors.familyName}</p>}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowFamilyModal(false)
                  setErrors({})
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateFamily}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                <span>{saving ? "Création..." : "Créer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingMember ? "Modifier le membre" : "Nouveau membre"}
              </h2>
              <button
                onClick={() => {
                  setShowMemberModal(false)
                  resetMemberForm()
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-6">
              {/* Photo */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20">
                  {memberForm.photo ? (
                    <img
                      src={memberForm.photo || "/placeholder.svg"}
                      alt="Aperçu"
                      className="w-full h-full rounded-full object-cover border-4 border-emerald-200 dark:border-emerald-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <FaUser className="text-white text-xl" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Photo (optionnel)
                  </label>
                  <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2">
                    <FaCamera />
                    <span>Choisir une photo</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                      errors.name ? "border-red-500 dark:border-red-400" : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Ex: Marie Dupont"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Genre</label>
                  <select
                    value={memberForm.gender}
                    onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                  >
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Âge</label>
                  <input
                    type="number"
                    value={memberForm.age}
                    onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                      errors.age ? "border-red-500 dark:border-red-400" : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Ex: 25"
                    min="0"
                    max="150"
                  />
                  {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                      errors.email ? "border-red-500 dark:border-red-400" : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="marie@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Allergies alimentaires
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commonAllergies.map((allergy) => (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => toggleAllergy(allergy)}
                      className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        memberForm.allergies.includes(allergy)
                          ? "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-2 border-orange-300 dark:border-orange-700 transform scale-105"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-transparent"
                      }`}
                    >
                      {allergy}
                    </button>
                  ))}
                </div>
              </div>

              {/* Health Issues */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="hasHealthIssues"
                    checked={memberForm.hasHealthIssues}
                    onChange={(e) =>
                      setMemberForm({
                        ...memberForm,
                        hasHealthIssues: e.target.checked,
                        diseases: e.target.checked ? memberForm.diseases : [],
                      })
                    }
                    className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="hasHealthIssues" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cette personne a des problèmes de santé
                  </label>
                </div>

                {memberForm.hasHealthIssues && (
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newDisease}
                        onChange={(e) => setNewDisease(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                        placeholder="Ex: Diabète, hypertension..."
                      />
                      <button
                        type="button"
                        onClick={addDisease}
                        disabled={!newDisease.trim()}
                        className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <FaPlus />
                      </button>
                    </div>

                    {memberForm.diseases.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Problèmes de santé ajoutés :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {memberForm.diseases.map((disease, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-sm font-medium"
                            >
                              {disease}
                              <button
                                type="button"
                                onClick={() => removeDisease(disease)}
                                className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                              >
                                <FaTimes className="text-xs" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowMemberModal(false)
                  resetMemberForm()
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveMember}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                <span>{saving ? "Sauvegarde..." : editingMember ? "Modifier" : "Ajouter"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && memberDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profil complet</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-8">
              {/* Member Header */}
              <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl">
                <div className="w-24 h-24">
                  {memberDetails.photo_url ? (
                    <img
                      src={memberDetails.photo_url || "/placeholder.svg"}
                      alt={memberDetails.name}
                      className="w-full h-full rounded-full object-cover border-4 border-emerald-200 dark:border-emerald-700 shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      {memberDetails.gender === "female" ? (
                        <FaFemale className="text-white text-2xl" />
                      ) : memberDetails.age && Number.parseInt(memberDetails.age) < 18 ? (
                        <FaChild className="text-white text-2xl" />
                      ) : (
                        <FaMale className="text-white text-2xl" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{memberDetails.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <FaBirthdayCake className="text-emerald-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {memberDetails.age ? `${memberDetails.age} ans` : "Âge non spécifié"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaUser className="text-emerald-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {memberDetails.gender === "female"
                          ? "Femme"
                          : memberDetails.gender === "male"
                            ? "Homme"
                            : "Autre"}
                      </span>
                    </div>
                    {memberDetails.email && (
                      <div className="flex items-center space-x-2">
                        <FaEnvelope className="text-emerald-500" />
                        <span className="text-gray-600 dark:text-gray-400">{memberDetails.email}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <FaCalendarAlt className="text-emerald-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Membre depuis {new Date(memberDetails.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center space-x-3 mb-2">
                    <FaShieldAlt className="text-orange-500 text-lg" />
                    <h4 className="font-semibold text-orange-700 dark:text-orange-300">Allergies</h4>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {memberDetails.allergiesDetails?.length || 0}
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    {memberDetails.allergiesDetails?.length > 0 ? "Allergies déclarées" : "Aucune allergie"}
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-3 mb-2">
                    <FaHeart className="text-red-500 text-lg" />
                    <h4 className="font-semibold text-red-700 dark:text-red-300">Maladies</h4>
                  </div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {memberDetails.diseasesDetails?.length || 0}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {memberDetails.diseasesDetails?.length > 0 ? "Problèmes de santé" : "Aucun problème"}
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3 mb-2">
                    <FaCheck className="text-green-500 text-lg" />
                    <h4 className="font-semibold text-green-700 dark:text-green-300">Statut</h4>
                  </div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {memberDetails.allergiesDetails?.length === 0 && memberDetails.diseasesDetails?.length === 0
                      ? "Sain"
                      : "Attention"}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {memberDetails.allergiesDetails?.length === 0 && memberDetails.diseasesDetails?.length === 0
                      ? "Aucun problème"
                      : "Surveillance requise"}
                  </p>
                </div>
              </div>

              {/* Detailed Allergies */}
              {memberDetails.allergiesDetails && memberDetails.allergiesDetails.length > 0 && (
                <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <FaExclamationTriangle className="text-orange-500" />
                    <span>Allergies alimentaires détaillées</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {memberDetails.allergiesDetails.map((allergy, index) => (
                      <div
                        key={index}
                        className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-orange-700 dark:text-orange-300">{allergy.name}</h5>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              allergy.severity === "severe"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                : allergy.severity === "moderate"
                                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                            }`}
                          >
                            {allergy.severity === "severe"
                              ? "Sévère"
                              : allergy.severity === "moderate"
                                ? "Modérée"
                                : "Légère"}
                          </span>
                        </div>
                        {allergy.description && (
                          <p className="text-sm text-orange-600 dark:text-orange-400 mb-2">{allergy.description}</p>
                        )}
                        {allergy.notes && (
                          <div className="flex items-start space-x-2">
                            <FaNotes className="text-orange-500 text-xs mt-1" />
                            <p className="text-sm text-orange-600 dark:text-orange-400">{allergy.notes}</p>
                          </div>
                        )}
                        {allergy.added_date && (
                          <p className="text-xs text-orange-500 dark:text-orange-400 mt-2">
                            Ajouté le {new Date(allergy.added_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Diseases */}
              {memberDetails.diseasesDetails && memberDetails.diseasesDetails.length > 0 && (
                <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <FaHeart className="text-red-500" />
                    <span>Problèmes de santé détaillés</span>
                  </h4>
                  <div className="space-y-4">
                    {memberDetails.diseasesDetails.map((disease, index) => (
                      <div
                        key={index}
                        className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h5 className="font-semibold text-red-700 dark:text-red-300 text-lg">{disease.name}</h5>
                          {disease.diagnosed_date && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-medium">
                              Diagnostiqué le {new Date(disease.diagnosed_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {disease.description && (
                          <p className="text-sm text-red-600 dark:text-red-400 mb-3">{disease.description}</p>
                        )}

                        {disease.dietary_restrictions && (
                          <div className="mb-3">
                            <h6 className="font-medium text-red-700 dark:text-red-300 mb-1">
                              Restrictions alimentaires :
                            </h6>
                            <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                              {disease.dietary_restrictions}
                            </p>
                          </div>
                        )}

                        {disease.notes && (
                          <div className="flex items-start space-x-2">
                            <FaNotes className="text-red-500 text-sm mt-1" />
                            <div>
                              <h6 className="font-medium text-red-700 dark:text-red-300 mb-1">Notes :</h6>
                              <p className="text-sm text-red-600 dark:text-red-400">{disease.notes}</p>
                            </div>
                          </div>
                        )}

                        {disease.added_date && (
                          <p className="text-xs text-red-500 dark:text-red-400 mt-3">
                            Ajouté le {new Date(disease.added_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No health issues */}
              {(!memberDetails.allergiesDetails || memberDetails.allergiesDetails.length === 0) &&
                (!memberDetails.diseasesDetails || memberDetails.diseasesDetails.length === 0) && (
                  <div className="text-center py-12 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaCheck className="text-green-500 text-3xl" />
                    </div>
                    <h4 className="text-xl font-semibold text-green-700 dark:text-green-300 mb-2">
                      Excellent état de santé
                    </h4>
                    <p className="text-green-600 dark:text-green-400">
                      Aucun problème de santé ou allergie alimentaire signalé pour ce membre.
                    </p>
                  </div>
                )}
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  handleEditMember(selectedMember)
                }}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors duration-200 flex items-center space-x-2"
              >
                <FaEdit />
                <span>Modifier</span>
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors duration-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FamilyPage
