"use client"
import { useState, useEffect, useRef } from "react"
import { 
  getAllFamilyMembers, 
  getUserDishes, 
  getUserIngredients,
  getUserFamilies,
  getFamilyCalendar 
} from "../../services/supabase"
import { FaPaperPlane, FaRobot, FaUser } from "react-icons/fa"
import { GoogleGenerativeAI } from "@google/generative-ai"

const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      content: "Bonjour ! Je suis votre assistant culinaire IA. Je peux vous aider avec vos repas, plannings, recettes et listes de courses. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [contextData, setContextData] = useState({
    members: [],
    dishes: [],
    ingredients: [],
    families: [],
    calendar: []
  })
  const messagesEndRef = useRef(null)

  // Configuration Gemini AI avec fallback
  const genAI = new GoogleGenerativeAI("AIzaSyDdI0hIm4N4lZkqxRdlqMzb_T4-Bm8JTOU")

  useEffect(() => {
    loadContextData()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadContextData = async () => {
    try {
      const [membersResult, dishesResult, ingredientsResult, familiesResult] = await Promise.all([
        getAllFamilyMembers(),
        getUserDishes(),
        getUserIngredients(),
        getUserFamilies()
      ])

      // Charger le calendrier pour toutes les familles
      let allCalendarData = []
      if (familiesResult.data) {
        for (const family of familiesResult.data) {
          const startDate = new Date()
          startDate.setMonth(startDate.getMonth() - 1)
          const endDate = new Date()
          endDate.setMonth(endDate.getMonth() + 1)
          
          const calendarResult = await getFamilyCalendar(
            family.id,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          )
          
          if (calendarResult.data) {
            allCalendarData.push(...calendarResult.data.map(meal => ({
              ...meal,
              family_name: family.name
            })))
          }
        }
      }

      setContextData({
        members: membersResult.data || [],
        dishes: dishesResult.data || [],
        ingredients: ingredientsResult.data || [],
        families: familiesResult.data || [],
        calendar: allCalendarData
      })
    } catch (error) {
      console.error("Erreur lors du chargement des données contextuelles:", error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      // Essayer plusieurs modèles en cas d'erreur
      const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
      let response = null
      let lastError = null

      for (const modelName of models) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName })
          
          const contextPrompt = `
            Tu es un assistant culinaire expert pour une application de gestion familiale des repas.
            
            DONNÉES CONTEXTUELLES:
            
            Familles: ${JSON.stringify(contextData.families)}
            
            Membres de famille (TOUS): ${JSON.stringify(contextData.members)}
            
            Plats disponibles: ${JSON.stringify(contextData.dishes)}
            
            Ingrédients: ${JSON.stringify(contextData.ingredients)}
            
            Calendrier des repas: ${JSON.stringify(contextData.calendar)}
            
            INSTRUCTIONS:
            - Réponds en français
            - Sois concis et pratique
            - Utilise les données contextuelles pour personnaliser tes réponses
            - Propose des solutions concrètes
            - Tiens compte des allergies et préférences des membres
            - Suggère des améliorations basées sur les données
            
            Question de l'utilisateur: ${inputMessage}
          `

          const result = await model.generateContent(contextPrompt)
          response = await result.response
          break // Succès, sortir de la boucle
        } catch (error) {
          lastError = error
          console.warn(`Erreur avec le modèle ${modelName}:`, error.message)
          
          // Si c'est une erreur 503, attendre un peu avant de réessayer
          if (error.message.includes('503') || error.message.includes('overloaded')) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }

      if (!response) {
        throw lastError || new Error("Tous les modèles ont échoué")
      }

      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: response.text(),
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error("Erreur Gemini AI:", error)
      
      // Message d'erreur convivial
      const errorMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: "Désolé, je rencontre des difficultés techniques en ce moment. L'IA est temporairement surchargée. Veuillez réessayer dans quelques instants. En attendant, je peux vous dire que vous avez " + 
                contextData.dishes.length + " plats et " + 
                contextData.members.length + " membres dans vos familles.",
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <FaRobot className="text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Assistant IA Culinaire</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {contextData.members.length} membres • {contextData.dishes.length} plats • {contextData.families.length} familles
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.type === "user"
                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              }`}
            >
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  {message.type === "user" ? (
                    <FaUser className="text-xs" />
                  ) : (
                    <FaRobot className="text-xs" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-2 opacity-70`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <FaRobot className="text-gray-600 dark:text-gray-400" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question sur les repas, recettes, planning..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              rows="2"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 p-3 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Appuyez sur Entrée pour envoyer • Maj+Entrée pour une nouvelle ligne
        </div>
      </div>
    </div>
  )
}

export default AIAssistantPage
