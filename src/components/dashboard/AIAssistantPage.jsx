"use client"
import { useState, useEffect, useRef } from "react"
import {
  getAllFamilyMembers,
  getUserDishes,
  getUserIngredients,
  getUserFamilies,
  getFamilyCalendar,
} from "../../services/supabase"
import { FaPaperPlane, FaRobot, FaUser, FaExclamationTriangle } from "react-icons/fa"
import { GoogleGenerativeAI } from "@google/generative-ai"

const GOOGLE_GEN_AI_API_KEY = "AIzaSyBeD1PXhzqw0mlVM7CTg8IK7taOu5KBdoY"

const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      content:
        "Bonjour ! Je suis votre assistant culinaire IA. Je peux vous aider avec vos repas, plannings, recettes et listes de courses. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [contextData, setContextData] = useState({
    members: [],
    dishes: [],
    ingredients: [],
    families: [],
    calendar: [],
  })
  const [errorMessage, setErrorMessage] = useState(null)

  const messagesEndRef = useRef(null)

  const genAI = new GoogleGenerativeAI(GOOGLE_GEN_AI_API_KEY)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const loadContextData = async () => {
      try {
        const [familiesResult, membersResult, dishesResult, ingredientsResult] =
          await Promise.all([
            getUserFamilies(),
            getAllFamilyMembers(),
            getUserDishes(),
            getUserIngredients(),
          ])

        if (familiesResult.error) throw familiesResult.error
        if (membersResult.error) throw membersResult.error
        if (dishesResult.error) throw dishesResult.error
        if (ingredientsResult.error) throw ingredientsResult.error

        let allCalendarData = []
        for (const family of familiesResult.data) {
          const startDate = new Date()
          startDate.setMonth(startDate.getMonth() - 1)
          const endDate = new Date()
          endDate.setMonth(endDate.getMonth() + 1)

          const calendarResult = await getFamilyCalendar(
            family.id,
            startDate.toISOString().split("T")[0],
            endDate.toISOString().split("T")[0]
          )
          if (calendarResult.error) {
            console.warn(`Calendrier introuvable pour famille ${family.id}`)
            continue
          }
          if (calendarResult.data) {
            allCalendarData.push(
              ...calendarResult.data.map((meal) => ({
                ...meal,
                family_name: family.name,
              }))
            )
          }
        }

        setContextData({
          families: familiesResult.data,
          members: membersResult.data,
          dishes: dishesResult.data,
          ingredients: ingredientsResult.data,
          calendar: allCalendarData,
        })
      } catch (err) {
        console.error("Erreur chargement données contextuelles:", err)
        setErrorMessage(
          "Erreur lors du chargement des données contextuelles, certaines fonctionnalités peuvent être limitées."
        )
      }
    }

    loadContextData()
  }, [])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    setErrorMessage(null)

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
      let response = null
      let lastError = null

      const contextPrompt = `
Tu es un assistant culinaire expert pour une application familiale.

CONTEXTES:
Familles: ${JSON.stringify(contextData.families)}
Membres: ${JSON.stringify(contextData.members)}
Plats: ${JSON.stringify(contextData.dishes)}
Ingrédients: ${JSON.stringify(contextData.ingredients)}
Calendrier repas: ${JSON.stringify(contextData.calendar)}

INSTRUCTIONS:
- Réponds en français.
- Sois clair, concis et pratique.
- Utilise le contexte pour personnaliser la réponse.
- Prends en compte allergies, préférences et maladies des membres.
- Propose des conseils et recettes adaptés.

Question: ${inputMessage.trim()}
      `

      for (const modelName of models) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName })
          const result = await model.generateContent(contextPrompt)
          response = await result.response
          break
        } catch (error) {
          lastError = error
          if (error.message.includes("503") || error.message.includes("overloaded")) {
            await new Promise((res) => setTimeout(res, 2000))
          } else {
            console.warn(`Erreur modèle ${modelName}:`, error.message)
          }
        }
      }

      if (!response) throw lastError || new Error("Tous les modèles ont échoué")

      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: response.text(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      console.error("Erreur IA:", err)
      setErrorMessage("L'IA est momentanément indisponible. Veuillez réessayer plus tard.")
      const fallback = {
        id: Date.now() + 1,
        type: "ai",
        content: `Je rencontre des difficultés techniques. Vous avez actuellement ${contextData.dishes.length} plats et ${contextData.members.length} membres.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, fallback])
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

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="border-b border-gray-300 dark:border-gray-700 p-5 flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <FaRobot className="text-gray-700 dark:text-gray-300 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assistant IA Culinaire</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {contextData.members.length} membres • {contextData.dishes.length} plats • {contextData.families.length} familles
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`
                max-w-[75%] rounded-3xl p-4 shadow-md transition-transform transform hover:scale-[1.02]
                ${
                  message.type === "user"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none"
                }
              `}
              style={{ animation: "fadeIn 0.3s ease forwards" }}
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-gray-300 dark:bg-gray-700">
                  {message.type === "user" ? (
                    <FaUser className="text-indigo-600 dark:text-indigo-400 text-sm" />
                  ) : (
                    <FaRobot className="text-gray-600 dark:text-gray-400 text-sm" />
                  )}
                </div>
                <div className="whitespace-pre-wrap text-base leading-relaxed select-text">{message.content}</div>
              </div>
              <div className="text-xs mt-2 opacity-60 text-right">{formatTime(message.timestamp)}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-3xl px-5 py-4 max-w-[75%] flex items-center space-x-3">
              <FaRobot className="text-gray-600 dark:text-gray-400 text-xl animate-pulse" />
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 flex items-center space-x-2 text-sm border border-red-300 dark:border-red-700 rounded-md mx-4 my-2">
          <FaExclamationTriangle />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="border-t border-gray-300 dark:border-gray-700 p-5 flex items-end space-x-4 bg-gray-50 dark:bg-gray-900">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Posez votre question sur les repas, recettes, planning..."
          className="flex-1 resize-none rounded-2xl border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={2}
          disabled={isLoading}
          spellCheck={false}
          aria-label="Message utilisateur"
        />
        <button
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
          aria-label="Envoyer message"
          className="rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 p-3 text-white transition-colors shadow-lg disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <FaPaperPlane />
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default AIAssistantPage
