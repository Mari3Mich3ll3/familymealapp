import { supabase } from "../supabase.js"
import { getCurrentUser } from "./auth.js"

// =====================================================
// GESTION DES FAMILLES ET MEMBRES
// =====================================================

export const createFamily = async (familyData) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    const { data, error } = await supabase
      .from("families")
      .insert({
        name: familyData.name,
        created_by: user.id,
        member_count: familyData.memberCount || 0,
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur création famille:", err)
    return { data: null, error: err }
  }
}

export const getUserFamilies = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return { data: [], error: null }

    const { data, error } = await supabase
      .from("families")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur récupération familles:", err)
    return { data: [], error: err }
  }
}

export const saveFamilyMember = async (memberData, familyId) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    console.log("💾 Sauvegarde membre:", memberData)

    // Vérifier que la famille appartient à l'utilisateur
    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("id", familyId)
      .eq("created_by", user.id)
      .single()

    if (!family) throw new Error("Famille non trouvée")

    const { data, error } = await supabase
      .from("family_members")
      .insert({
        family_id: familyId,
        name: memberData.name,
        gender: memberData.gender,
        age: memberData.age ? Number.parseInt(memberData.age) : null,
        photo_url: memberData.photo,
        email: memberData.email,
        is_sick: memberData.isSick || false,
      })
      .select()
      .single()

    if (error) throw error

    console.log("✅ Membre sauvegardé:", data)

    // Sauvegarder les allergies
    if (memberData.allergies && memberData.allergies.length > 0) {
      await saveMemberAllergies(data.id, memberData.allergies)
    }

    // Sauvegarder les allergies personnalisées
    if (memberData.customAllergies && memberData.customAllergies.trim()) {
      const customAllergiesList = memberData.customAllergies
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a)
      if (customAllergiesList.length > 0) {
        await saveMemberAllergies(data.id, customAllergiesList)
      }
    }

    // Sauvegarder les maladies (gérer array et string)
    if (memberData.diseases) {
      if (Array.isArray(memberData.diseases) && memberData.diseases.length > 0) {
        // Si c'est un array, joindre en string
        const diseasesText = memberData.diseases.join(", ")
        await saveMemberDiseasesText(data.id, diseasesText)
      } else if (typeof memberData.diseases === 'string' && memberData.diseases.trim()) {
        // Si c'est un string
        await saveMemberDiseasesText(data.id, memberData.diseases.trim())
      }
    }

    return { data, error: null }
  } catch (err) {
    console.error("Erreur sauvegarde membre:", err)
    return { data: null, error: err }
  }
}

export const saveFamilyMembers = async (members, familyId) => {
  try {
    const results = []
    for (const member of members) {
      const result = await saveFamilyMember(member, familyId)
      if (result.error) {
        console.error("❌ Erreur membre:", member.name, result.error)
        continue
      }
      results.push(result.data)
    }
    return { data: results, error: null }
  } catch (err) {
    console.error("Erreur sauvegarde membres:", err)
    return { data: null, error: err }
  }
}

export const updateFamilyMember = async (memberId, memberData) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Utilisateur non connecté")

    const { data, error } = await supabase
      .from("family_members")
      .update({
        name: memberData.name,
        gender: memberData.gender,
        age: memberData.age ? Number.parseInt(memberData.age) : null,
        photo_url: memberData.photo,
        email: memberData.email,
        is_sick: memberData.diseases && memberData.diseases.length > 0,
      })
      .eq("id", memberId)
      .select()
      .single()

    if (error) throw error

    // Supprimer les anciennes allergies et maladies
    await supabase.from("member_allergies").delete().eq("member_id", memberId)
    await supabase.from("member_diseases").delete().eq("member_id", memberId)

    // Sauvegarder les nouvelles allergies
    if (memberData.allergies && memberData.allergies.length > 0) {
      await saveMemberAllergies(memberId, memberData.allergies)
    }

    // Sauvegarder les nouvelles maladies
    if (memberData.diseases && memberData.diseases.length > 0) {
      await saveMemberDiseases(memberId, memberData.diseases)
    }

    return { data, error: null }
  } catch (err) {
    console.error("Erreur modification membre:", err)
    return { data: null, error: err }
  }
}

export const deleteFamilyMember = async (memberId) => {
  try {
    const { error } = await supabase.from("family_members").delete().eq("id", memberId)

    if (error) throw error

    return { error: null }
  } catch (err) {
    console.error("Erreur suppression membre:", err)
    return { error: err }
  }
}

export const getFamilyMembers = async (familyId) => {
  try {
    const { data, error } = await supabase
      .from("family_members_complete")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at")

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur récupération membres:", err)
    return { data: [], error: err }
  }
}

export const getMemberDetails = async (memberId) => {
  try {
    // Récupérer les informations de base du membre
    const { data: member, error: memberError } = await supabase
      .from("family_members")
      .select("*")
      .eq("id", memberId)
      .single()

    if (memberError) throw memberError

    // Récupérer les allergies détaillées
    const { data: allergiesData } = await supabase
      .from("member_allergies")
      .select(`
        severity,
        notes,
        created_at,
        allergies (
          name,
          description
        )
      `)
      .eq("member_id", memberId)

    // Récupérer les maladies détaillées
    const { data: diseasesData } = await supabase
      .from("member_diseases")
      .select(`
        diagnosed_date,
        notes,
        created_at,
        diseases (
          name,
          description,
          dietary_restrictions
        )
      `)
      .eq("member_id", memberId)

    const memberWithDetails = {
      ...member,
      allergiesDetails:
        allergiesData?.map((a) => ({
          name: a.allergies.name,
          description: a.allergies.description,
          severity: a.severity,
          notes: a.notes,
          added_date: a.created_at,
        })) || [],
      diseasesDetails:
        diseasesData?.map((d) => ({
          name: d.diseases.name,
          description: d.diseases.description,
          dietary_restrictions: d.diseases.dietary_restrictions,
          diagnosed_date: d.diagnosed_date,
          notes: d.notes,
          added_date: d.created_at,
        })) || [],
    }

    return { data: memberWithDetails, error: null }
  } catch (err) {
    console.error("Erreur récupération détails membre:", err)
    return { data: null, error: err }
  }
}

export const getAllergies = async () => {
  try {
    const { data, error } = await supabase.from("allergies").select("*").eq("is_common", true).order("name")

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur récupération allergies:", err)
    return { data: [], error: err }
  }
}

export const getDiseases = async () => {
  try {
    const { data, error } = await supabase.from("diseases").select("*").order("name")

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error("Erreur récupération maladies:", err)
    return { data: [], error: err }
  }
}

// Fonctions utilitaires privées
const saveMemberAllergies = async (memberId, allergies) => {
  try {
    for (const allergyName of allergies) {
      let { data: allergy } = await supabase.from("allergies").select("id").eq("name", allergyName).single()

      if (!allergy) {
        const { data: newAllergy } = await supabase
          .from("allergies")
          .insert({ name: allergyName, is_common: false })
          .select()
          .single()
        allergy = newAllergy
      }

      await supabase.from("member_allergies").insert({
        member_id: memberId,
        allergy_id: allergy.id,
        severity: "moderate",
      })
    }
  } catch (err) {
    console.error("Erreur sauvegarde allergies:", err)
  }
}

const saveMemberDiseasesText = async (memberId, diseasesText) => {
  try {
    console.log("💾 Sauvegarde maladies texte:", diseasesText)
    const { error } = await supabase.rpc("handle_member_diseases", {
      p_member_id: memberId,
      p_diseases_text: diseasesText,
    })

    if (error) {
      console.error("❌ Erreur RPC handle_member_diseases:", error)
      await createGenericDisease(memberId, diseasesText)
    }
  } catch (err) {
    console.error("Erreur sauvegarde maladies texte:", err)
    await createGenericDisease(memberId, diseasesText)
  }
}

const createGenericDisease = async (memberId, diseasesText) => {
  try {
    const { data: disease, error: diseaseError } = await supabase
      .from("diseases")
      .insert({
        name: diseasesText.substring(0, 100),
        description: "Maladie ajoutée par l'utilisateur",
      })
      .select()
      .single()

    if (diseaseError) {
      console.error("❌ Erreur création maladie:", diseaseError)
      return
    }

    await supabase.from("member_diseases").insert({
      member_id: memberId,
      disease_id: disease.id,
    })

    console.log("✅ Maladie générique créée:", disease.name)
  } catch (err) {
    console.error("Erreur création maladie générique:", err)
  }
}

const saveMemberDiseases = async (memberId, diseases) => {
  try {
    for (const diseaseName of diseases) {
      let { data: disease } = await supabase.from("diseases").select("id").eq("name", diseaseName).single()

      if (!disease) {
        const { data: newDisease } = await supabase.from("diseases").insert({ name: diseaseName }).select().single()
        disease = newDisease
      }

      await supabase.from("member_diseases").insert({
        member_id: memberId,
        disease_id: disease.id,
      })
    }
  } catch (err) {
    console.error("Erreur sauvegarde maladies:", err)
  }
}
