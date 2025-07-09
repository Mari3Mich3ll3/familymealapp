// =====================================================
// EXPORT CENTRALISÉ DE TOUS LES SERVICES
// =====================================================

// Configuration Supabase
export { supabase, getCurrentUser } from "./supabase.js"

// Service d'authentification
export {
  signUp,
  signIn,
  signOut,
  getUserProfile,
  updateUserProfile,
  updatePassword,
} from "./authService.js"

// Service de gestion des familles
export {
  createFamily,
  getUserFamilies,
  saveFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  getFamilyMembers,
  getMemberDetails,
  getAllergies,
  getDiseases,
} from "./familyService.js"

// Service de gestion des repas
export {
  saveDish,
  updateDish,
  deleteDish,
  getUserDishes,
} from "./dishService.js"

// Service de gestion des ingrédients
export {
  saveIngredient,
  updateIngredient,
  deleteIngredient,
  getUserIngredients,
} from "./ingredientService.js"

// Service de gestion des stocks
export {
  saveStock,
  getFamilyStocks,
  updateStock,
  deleteStock,
} from "./stockService.js"

// Service de gestion du calendrier
export {
  saveCalendarMeals,
  getFamilyCalendar,
  updateCalendarMeal,
  deleteCalendarMeal,
  saveFamilyData,
} from "./calendarService.js"
