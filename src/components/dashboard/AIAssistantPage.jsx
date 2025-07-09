"use client"
import { useState, useEffect, useRef } from "react"
import { getCurrentUser, getUserFamilies, getFamilyMembers, getUserDishes } from "../../services/supabase"
import {
  FaRobot,
  FaPaperPlane,
  FaUser,
  FaUtensils,
  FaShoppingCart,
  FaLightbulb,
  FaHeart,
  FaSpinner,
  FaCopy,
  FaThumbsUp,
  FaThumbsDown,
} from "react-icons/fa"

const AIAssistantPage = () => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [familyData, setFamilyData] = useState(null)
  const messagesEndRef = useRef(null)

  const quickActions = [
    {
      title: "Suggérer un menu",
      description: "Créer un menu équilibré pour la semaine",
      icon: FaUtensils,
      color: "from-green-500 to-emerald-500",
      prompt:
        "Peux-tu me suggérer un menu équilibré pour la semaine en tenant compte des allergies et préférences de ma famille ?",
    },
    {
      title: "Optimiser les courses",
      description: "Organiser ma liste de courses",
      icon: FaShoppingCart,
      color: "from-blue-500 to-cyan-500",
      prompt: "Comment puis-je optimiser ma liste de courses pour économiser du temps et de l'argent ?",
    },
    {
      title: "Recette avec ingrédients",
      description: "Créer une recette avec mes stocks",
      icon: FaLightbulb,
      color: "from-orange-500 to-red-500",
      prompt: "Peux-tu me proposer une recette avec les ingrédients que j'ai en stock ?",
    },
    {
      title: "Conseils nutrition",
      description: "Obtenir des conseils santé",
      icon: FaHeart,
      color: "from-pink-500 to-rose-500",
      prompt: "Donne-moi des conseils nutritionnels adaptés aux besoins de ma famille",
    },
  ]

  useEffect(() => {
    loadUserData()
    // Message de bienvenue
    setMessages([
      {
        id: 1,
        type: "assistant",
        content:
          "Bonjour ! Je suis votre assistant IA pour FamilyMeal. Je peux vous aider à planifier vos repas, optimiser vos courses, suggérer des recettes et donner des conseils nutritionnels. Comment puis-je vous aider aujourd'hui ?",
        timestamp: new Date(),
      },
    ])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      const familiesResult = await getUserFamilies()
      if (familiesResult.data && familiesResult.data.length > 0) {
        const family = familiesResult.data[0]
        const [membersResult, dishesResult] = await Promise.all([getFamilyMembers(family.id), getUserDishes()])

        setFamilyData({
          family,
          members: membersResult.data || [],
          dishes: dishesResult.data || [],
        })
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || loading) return

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setLoading(true)

    // Simuler une réponse de l'IA
    setTimeout(() => {
      const aiResponse = generateAIResponse(messageText)
      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setLoading(false)
    }, 1500)
  }

  const generateAIResponse = (userMessage) => {
    const message = userMessage.toLowerCase()

    if (message.includes("menu") || message.includes("repas") || message.includes("planifier")) {
      return `Voici mes suggestions pour un menu équilibré cette semaine :

**Lundi**
- Petit-déjeuner : Porridge aux fruits et noix
- Déjeuner : Salade de quinoa aux légumes grillés
- Dîner : Saumon grillé avec légumes vapeur

**Mardi**
- Petit-déjeuner : Smoothie vert aux épinards et banane
- Déjeuner : Soupe de lentilles avec pain complet
- Dîner : Poulet rôti aux herbes avec riz brun

**Mercredi**
- Petit-déjeuner : Œufs brouillés avec avocat
- Déjeuner : Wrap au thon et légumes
- Dîner : Curry de légumes avec naan

${
  familyData?.members?.some((m) => m.allergies?.length > 0)
    ? `\n⚠️ **Note importante** : J'ai pris en compte les allergies de votre famille (${familyData.members
        .filter((m) => m.allergies?.length > 0)
        .map((m) => `${m.name}: ${m.allergies.join(", ")}`)
        .join("; ")})`
    : ""
}

Voulez-vous que je détaille une de ces recettes ou que je vous aide à créer la liste de courses correspondante ?`
    }

    if (message.includes("course") || message.includes("liste") || message.includes("acheter")) {
      return `Pour optimiser vos courses, voici mes conseils :

**🛒 Organisation par zones**
1. **Fruits et légumes** - Commencez par ici pour les produits frais
2. **Produits laitiers** - Réfrigérés, à prendre en fin de parcours
3. **Viandes et poissons** - Idem, pour maintenir la chaîne du froid
4. **Épicerie sèche** - Conserves, pâtes, riz, etc.

**💰 Économies**
- Privilégiez les produits de saison
- Comparez les prix au kilo/litre
- Utilisez les promotions sur vos produits habituels
- Achetez en vrac pour les produits non périssables

**⏰ Gain de temps**
- Organisez votre liste selon le plan du magasin
- Faites vos courses aux heures creuses
- Utilisez les applications de drive si disponibles

Voulez-vous que je génère une liste de courses optimisée pour vos repas de la semaine ?`
    }

    if (message.includes("recette") || message.includes("cuisiner") || message.includes("stock")) {
      return `Excellente idée ! Voici une recette que vous pouvez réaliser avec des ingrédients courants :

**🍝 Pâtes aux légumes de saison**

**Ingrédients** (4 personnes) :
- 400g de pâtes
- 2 courgettes
- 2 tomates
- 1 oignon
- 2 gousses d'ail
- Huile d'olive
- Herbes de Provence
- Parmesan râpé

**Préparation** (20 min) :
1. Faites cuire les pâtes selon les instructions
2. Émincez l'oignon et l'ail, coupez les légumes en dés
3. Faites revenir l'oignon dans l'huile d'olive
4. Ajoutez les légumes et les herbes, cuisez 10 min
5. Mélangez avec les pâtes égouttées
6. Servez avec le parmesan

**💡 Variantes** : Ajoutez des protéines (poulet, thon) ou d'autres légumes selon vos stocks.

Avez-vous des ingrédients spécifiques en stock que vous aimeriez utiliser ?`
    }

    if (message.includes("nutrition") || message.includes("santé") || message.includes("conseil")) {
      return `Voici mes conseils nutritionnels pour votre famille :

**🥗 Équilibre alimentaire**
- **5 portions** de fruits et légumes par jour
- **3 repas** principaux + 1-2 collations si besoin
- **Hydratation** : 1,5-2L d'eau par jour

**🍎 Groupes alimentaires à chaque repas**
- **Protéines** : viande, poisson, œufs, légumineuses
- **Féculents** : pain, pâtes, riz, pommes de terre
- **Légumes** : crus et cuits, variez les couleurs
- **Produits laitiers** : lait, yaourt, fromage

**👨‍👩‍👧‍👦 Conseils famille**
${familyData?.members?.some((m) => m.is_sick) ? `- Adaptations pour les problèmes de santé identifiés\n` : ""}
${familyData?.members?.some((m) => m.allergies?.length > 0) ? `- Alternatives pour les allergies alimentaires\n` : ""}
- Impliquez les enfants dans la préparation
- Variez les modes de cuisson
- Limitez les produits ultra-transformés

Avez-vous des questions spécifiques sur l'alimentation de votre famille ?`
    }

    // Réponse générale
    return `Je comprends votre question ! En tant qu'assistant IA spécialisé dans la nutrition familiale, je peux vous aider avec :

• **Planification de menus** équilibrés et adaptés
• **Suggestions de recettes** selon vos ingrédients
• **Optimisation des courses** pour économiser temps et argent
• **Conseils nutritionnels** personnalisés
• **Gestion des allergies** et régimes spéciaux

${familyData ? `Je vois que votre famille compte ${familyData.members.length} membre(s) et vous avez ${familyData.dishes.length} recette(s) enregistrée(s).` : ""}

Pouvez-vous me dire plus précisément comment je peux vous aider aujourd'hui ?`
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    // Vous pourriez ajouter une notification ici
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <FaRobot className="text-3xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Assistant IA FamilyMeal</h1>
            <p className="text-purple-100">Votre expert en nutrition et planification de repas</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <button
                  key={index}
                  onClick={() => sendMessage(action.prompt)}
                  className={`p-4 rounded-xl bg-gradient-to-r ${action.color} text-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-left`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Icon className="text-xl" />
                    <h3 className="font-semibold">{action.title}</h3>
                  </div>
                  <p className="text-sm opacity-90">{action.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex items-start space-x-3 max-w-[80%] ${message.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    message.type === "user"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500"
                      : "bg-gradient-to-r from-purple-500 to-pink-500"
                  }`}
                >
                  {message.type === "user" ? <FaUser className="text-white" /> : <FaRobot className="text-white" />}
                </div>
                <div
                  className={`rounded-2xl p-4 ${
                    message.type === "user"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20 dark:border-gray-600">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {message.type === "assistant" && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(message.content)}
                          className="p-1 hover:bg-white/20 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Copier"
                        >
                          <FaCopy className="text-xs" />
                        </button>
                        <button
                          className="p-1 hover:bg-white/20 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Utile"
                        >
                          <FaThumbsUp className="text-xs" />
                        </button>
                        <button
                          className="p-1 hover:bg-white/20 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Pas utile"
                        >
                          <FaThumbsDown className="text-xs" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-[80%]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <FaRobot className="text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4">
                  <div className="flex items-center space-x-2">
                    <FaSpinner className="animate-spin text-purple-500" />
                    <span className="text-gray-600 dark:text-gray-400">L'assistant réfléchit...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question sur la nutrition, les recettes, la planification..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows="2"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || loading}
                className="absolute right-3 bottom-3 p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIAssistantPage
