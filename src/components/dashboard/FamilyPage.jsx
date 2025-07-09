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
} from "../../services/supabase.js"
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
  FaTimes,
  FaUserPlus,
  FaEnvelope,
  FaSearch,
  FaEye,
  FaCheck,
  FaExclamationCircle,
  FaInfoCircle,
  FaCamera,
  FaSave,
  FaSpinner,
} from "react-icons/fa"

const FamilyPage = () => {
  // Utility functions pour gérer l'affichage des données
  const getDiseaseName = (disease) => {
    if (typeof disease === "string") return disease.trim()
    return disease?.disease_name?.trim() || disease?.name?.trim() || "Maladie non spécifiée"
  }

  const getAllergyName = (allergy) => {
    if (typeof allergy === "string") return allergy.trim()
    return allergy?.allergy_name?.trim() || allergy?.name?.trim() || "Allergie non spécifiée"
  }

  // Fonction pour éliminer les doublons et nettoyer les données
  const cleanAndDeduplicateArray = (array) => {
    if (!array || !Array.isArray(array)) return []

    const cleaned = array
      .map((item) => {
        if (typeof item === "string") return item.trim()
        return item?.name?.trim() || item?.allergy_name?.trim() || item?.disease_name?.trim() || ""
      })
      .filter((item) => item && item.length > 0) // Supprimer les éléments vides

    // Éliminer les doublons (insensible à la casse)
    const unique = []
    const seen = new Set()

    cleaned.forEach((item) => {
      const lowerItem = item.toLowerCase()
      if (!seen.has(lowerItem)) {
        seen.add(lowerItem)
        unique.push(item)
      }
    })

    return unique
  }

  const getDiseaseCount = (diseases) => {
    return cleanAndDeduplicateArray(diseases).length
  }

  const getAllergyCount = (allergies) => {
    return cleanAndDeduplicateArray(allergies).length
  }

  // Fonction pour recalculer les statistiques en temps réel
  const calculateStats = (membersList) => {
    return {
      totalMembers: membersList.length,
      membersWithAllergies: membersList.filter((m) => getAllergyCount(m.allergies) > 0).length,
      membersWithHealthIssues: membersList.filter((m) => getDiseaseCount(m.diseases) > 0 || m.is_sick).length,
    }
  }

  const [stats, setStats] = useState({
    totalMembers: 0,
    membersWithAllergies: 0,
    membersWithHealthIssues: 0,
  })

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
    customAllergies: "",
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
      const filtered = members.filter((member) => {
        const searchLower = searchTerm.toLowerCase()

        // Recherche dans le nom et email
        if (member.name.toLowerCase().includes(searchLower) || member.email?.toLowerCase().includes(searchLower)) {
          return true
        }

        // Recherche dans les allergies
        const cleanAllergies = cleanAndDeduplicateArray(member.allergies)
        if (cleanAllergies.some((allergy) => allergy.toLowerCase().includes(searchLower))) {
          return true
        }

        // Recherche dans les maladies
        const cleanDiseases = cleanAndDeduplicateArray(member.diseases)
        if (cleanDiseases.some((disease) => disease.toLowerCase().includes(searchLower))) {
          return true
        }

        return false
      })
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

      // Initialiser les stats
      setStats({
        totalMembers: 0,
        membersWithAllergies: 0,
        membersWithHealthIssues: 0,
      })
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
        // Nettoyer les données des membres
        const cleanedMembers = result.data.map((member) => ({
          ...member,
          allergies: cleanAndDeduplicateArray(member.allergies),
          diseases: cleanAndDeduplicateArray(member.diseases),
        }))
        setMembers(cleanedMembers)
        setFilteredMembers(cleanedMembers)

        // Mettre à jour les statistiques en temps réel
        const newStats = calculateStats(cleanedMembers)
        setStats(newStats)
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

      // Nettoyer et dédupliquer les allergies et maladies
      const cleanedAllergies = cleanAndDeduplicateArray([
        ...memberForm.allergies,
        ...(memberForm.customAllergies ? memberForm.customAllergies.split(",").map((a) => a.trim()) : []),
      ])

      const cleanedDiseases = memberForm.hasHealthIssues ? cleanAndDeduplicateArray(memberForm.diseases) : []

      const memberData = {
        ...memberForm,
        allergies: cleanedAllergies,
        diseases: cleanedDiseases,
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

    // Nettoyer les données pour l'édition
    const cleanedAllergies = cleanAndDeduplicateArray(member.allergies)
    const cleanedDiseases = cleanAndDeduplicateArray(member.diseases)

    setMemberForm({
      name: member.name || "",
      gender: member.gender || "male",
      age: member.age?.toString() || "",
      email: member.email || "",
      photo: member.photo_url || "",
      allergies: cleanedAllergies,
      customAllergies: "",
      diseases: cleanedDiseases,
      hasHealthIssues: cleanedDiseases.length > 0 || member.is_sick || false,
    })
    setErrors({})
    setShowMemberModal(true)
  }

  const handleViewDetails = async (member) => {
    try {
      setSelectedMember({
        ...member,
        allergies: cleanAndDeduplicateArray(member.allergies),
        diseases: cleanAndDeduplicateArray(member.diseases),
      })

      // Charger les détails complets du membre
      const result = await getMemberDetails(member.id)
      if (result.error) {
        throw new Error(result.error.message)
      }

      if (result.data) {
        setMemberDetails({
          ...result.data,
          allergies: cleanAndDeduplicateArray(result.data.allergies),
          diseases: cleanAndDeduplicateArray(result.data.diseases),
        })
      }

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
      customAllergies: "",
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
    const trimmedDisease = newDisease.trim()
    if (trimmedDisease && !memberForm.diseases.includes(trimmedDisease)) {
      setMemberForm({
        ...memberForm,
        diseases: [...memberForm.diseases, trimmedDisease],
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMembers}</p>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.membersWithAllergies}</p>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.membersWithHealthIssues}</p>
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
              {filteredMembers.map((member) => {
                const cleanAllergies = cleanAndDeduplicateArray(member.allergies)
                const cleanDiseases = cleanAndDeduplicateArray(member.diseases)

                return (
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

                      {cleanAllergies.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <FaExclamationTriangle className="text-orange-500 text-sm" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              Allergies ({cleanAllergies.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {cleanAllergies.slice(0, 2).map((allergy, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-xs font-medium"
                              >
                                {allergy}
                              </span>
                            ))}
                            {cleanAllergies.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300 rounded-full text-xs">
                                +{cleanAllergies.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {(cleanDiseases.length > 0 || member.is_sick) && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <FaHeart className="text-red-500 text-sm" />
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                              Problèmes de santé {cleanDiseases.length > 0 && `(${cleanDiseases.length})`}
                            </span>
                          </div>
                          {cleanDiseases.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {cleanDiseases.slice(0, 2).map((disease, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-medium"
                                >
                                  {disease}
                                </span>
                              ))}
                              {cleanDiseases.length > 2 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300 rounded-full text-xs">
                                  +{cleanDiseases.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de création/modification de famille */}
      {showFamilyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nouvelle famille</h3>
                <button
                  onClick={() => {
                    setShowFamilyModal(false)
                    setFamilyForm({ name: "", memberCount: 0 })
                    setErrors({})
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de la famille *
                </label>
                <input
                  type="text"
                  value={familyForm.name}
                  onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                    errors.familyName ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Ex: Famille Dupont"
                />
                {errors.familyName && <p className="text-red-500 text-sm mt-1">{errors.familyName}</p>}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowFamilyModal(false)
                  setFamilyForm({ name: "", memberCount: 0 })
                  setErrors({})
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateFamily}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg font-medium transition-colors duration-200"
              >
                {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                <span>{saving ? "Création..." : "Créer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout/modification de membre */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingMember ? "Modifier le membre" : "Ajouter un membre"}
                </h3>
                <button
                  onClick={() => {
                    setShowMemberModal(false)
                    resetMemberForm()
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Photo */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 mx-auto mb-4">
                    {memberForm.photo ? (
                      <img
                        src={memberForm.photo || "/placeholder.svg"}
                        alt="Aperçu"
                        className="w-full h-full rounded-full object-cover border-4 border-emerald-200 dark:border-emerald-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        <FaUser className="text-white text-2xl" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors duration-200">
                    <FaCamera className="text-sm" />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                      errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Nom complet"
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
                    <option value="male">Masculin</option>
                    <option value="female">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Âge</label>
                  <input
                    type="number"
                    value={memberForm.age}
                    onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                      errors.age ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Âge en années"
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
                      errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="email@exemple.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Allergies</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commonAllergies.map((allergy) => (
                    <label key={allergy} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={memberForm.allergies.includes(allergy)}
                        onChange={() => toggleAllergy(allergy)}
                        className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{allergy}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3">
                  <input
                    type="text"
                    value={memberForm.customAllergies}
                    onChange={(e) => setMemberForm({ ...memberForm, customAllergies: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="Autres allergies (séparées par des virgules)"
                  />
                </div>
              </div>

              {/* Problèmes de santé */}
              <div>
                <label className="flex items-center space-x-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={memberForm.hasHealthIssues}
                    onChange={(e) => setMemberForm({ ...memberForm, hasHealthIssues: e.target.checked })}
                    className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cette personne a des problèmes de santé
                  </span>
                </label>
                {memberForm.hasHealthIssues && (
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newDisease}
                        onChange={(e) => setNewDisease(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="Ajouter une maladie ou condition"
                      />
                      <button
                        type="button"
                        onClick={addDisease}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        Ajouter
                      </button>
                    </div>
                    {memberForm.diseases.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {memberForm.diseases.map((disease, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-sm"
                          >
                            <span>{disease}</span>
                            <button
                              type="button"
                              onClick={() => removeDisease(disease)}
                              className="text-red-500 hover:text-red-700 ml-1"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
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
                className="flex items-center space-x-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg font-medium transition-colors duration-200"
              >
                {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                <span>{saving ? "Sauvegarde..." : editingMember ? "Modifier" : "Ajouter"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails du membre */}
      {showDetailsModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Détails du membre</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Photo et informations de base */}
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24">
                  {selectedMember.photo_url ? (
                    <img
                      src={selectedMember.photo_url || "/placeholder.svg"}
                      alt={selectedMember.name}
                      className="w-full h-full rounded-full object-cover border-4 border-emerald-200 dark:border-emerald-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      {selectedMember.gender === "female" ? (
                        <FaFemale className="text-white text-2xl" />
                      ) : selectedMember.age && Number.parseInt(selectedMember.age) < 18 ? (
                        <FaChild className="text-white text-2xl" />
                      ) : (
                        <FaMale className="text-white text-2xl" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedMember.name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Âge:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedMember.age ? `${selectedMember.age} ans` : "Non spécifié"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Genre:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">
                        {selectedMember.gender === "male" ? "Masculin" : "Féminin"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              {selectedMember.email && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <FaEnvelope className="text-blue-500 text-lg" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedMember.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Allergies */}
              {selectedMember.allergies && selectedMember.allergies.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <FaExclamationTriangle className="text-orange-500 text-lg" />
                    <h5 className="font-semibold text-gray-900 dark:text-white">
                      Allergies ({selectedMember.allergies.length})
                    </h5>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.allergies.map((allergy, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-sm font-medium"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Maladies */}
              {((selectedMember.diseases && selectedMember.diseases.length > 0) || selectedMember.is_sick) && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <FaHeart className="text-red-500 text-lg" />
                    <h5 className="font-semibold text-gray-900 dark:text-white">
                      Problèmes de santé {selectedMember.diseases && `(${selectedMember.diseases.length})`}
                    </h5>
                  </div>
                  {selectedMember.diseases && selectedMember.diseases.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.diseases.map((disease, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-sm font-medium"
                        >
                          {disease}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-red-600 dark:text-red-400">Problèmes de santé signalés</p>
                  )}
                </div>
              )}

              {/* Informations supplémentaires */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Informations supplémentaires</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Membre depuis:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {selectedMember.created_at
                        ? new Date(selectedMember.created_at).toLocaleDateString()
                        : "Non disponible"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Statut:</span>
                    <span className="ml-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
                        Actif
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  handleEditMember(selectedMember)
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FamilyPage
