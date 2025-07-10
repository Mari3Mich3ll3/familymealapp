"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  FaUsers,
  FaUtensils,
  FaCalendarAlt,
  FaShoppingCart,
  FaLeaf,
  FaRocket,
  FaCheckCircle,
  FaStar,
  FaUserPlus,
  FaCalendarPlus,
  FaListUl,
} from "react-icons/fa"
import { useCountUp } from "../hooks/useCountUp"

const PageAccueil = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  // Statistiques animées
  const familiesCount = useCountUp(1247, 2000)
  const mealsCount = useCountUp(15680, 2500)
  const savedCount = useCountUp(89, 2200)
  const recipesCount = useCountUp(3420, 1800)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: <FaUsers className="text-2xl" />,
      title: "Profils Familiaux",
      description: "Gérez les allergies et préférences de chaque membre de votre famille",
      image:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      details:
        "Créez des profils personnalisés pour chaque membre de votre famille avec leurs allergies, intolérances et préférences alimentaires.",
    },
    {
      icon: <FaUtensils className="text-2xl" />,
      title: "Recettes Intelligentes",
      description: "Catalogue personnalisé avec suggestions IA adaptées à votre famille",
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      details:
        "Notre IA analyse vos préférences familiales pour vous proposer des recettes parfaitement adaptées à tous les membres.",
    },
    {
      icon: <FaCalendarAlt className="text-2xl" />,
      title: "Planification Avancée",
      description: "Calendrier intelligent pour organiser tous vos repas de la semaine",
      image:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      details:
        "Planifiez vos repas à l'avance avec notre calendrier intelligent qui optimise votre temps et votre budget.",
    },
    {
      icon: <FaShoppingCart className="text-2xl" />,
      title: "Courses Optimisées",
      description: "Listes automatiques et budget intelligent pour vos achats",
      image:
        "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      details:
        "Générez automatiquement vos listes de courses basées sur vos repas planifiés et optimisez votre budget.",
    },
  ]

  const testimonials = [
    {
      name: "Marie Michelle",
      role: "Maman de 3 enfants",
      image:
        "https://images.unsplash.com/photo-1610563166150-6f53fe4b2c68?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      text: "FamilyMeal a révolutionné notre organisation familiale. Plus de stress pour les repas !",
      rating: 5,
    },
    {
      name: "Soh Laurent",
      role: "Papa chef cuisinier",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      text: "L'assistant IA propose des recettes parfaites pour les allergies de mon fils.",
      rating: 5,
    },
    {
      name: "Fonkou Booz",
      role: "Nutritionniste & Diététicien",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      text: "Un outil professionnel que je recommande à toutes mes familles clientes.",
      rating: 5,
    },
  ]

  const stats = [
    { label: "Familles actives", value: familiesCount, suffix: "+" },
    { label: "Repas planifiés", value: mealsCount, suffix: "+" },
    { label: "% d'économies", value: savedCount, suffix: "%" },
    { label: "Recettes disponibles", value: recipesCount, suffix: "+" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-green-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FaLeaf className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                FamilyMeal
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                Fonctionnalités
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                Comment ça marche
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                Témoignages
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/connexion" className="text-green-600 hover:text-green-700 font-medium transition-colors">
                Connexion
              </Link>
              <Link
                to="/inscription"
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-2xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                Essai gratuit
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section avec Carrousel */}
      <section className="pt-24 pb-20 relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-emerald-900/10 to-teal-900/20"></div>

        {/* Carrousel d'images de fond */}
        <div className="absolute inset-0">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === activeFeature ? "opacity-100" : "opacity-0"
              }`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${feature.image}')`,
                }}
              ></div>
            </div>
          ))}
        </div>

        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-emerald-200/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Contenu textuel qui change */}
            <div className="text-left relative z-10">
              <div className="inline-flex items-center bg-green-100 rounded-3xl px-4 py-2 mb-6">
                <FaRocket className="text-green-600 mr-2" />
                <span className="text-green-800 font-medium text-sm">Nouveau : Assistant IA intégré</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                {features[activeFeature].title}
              </h1>

              <p className="text-lg md:text-xl text-gray-100 mb-6 leading-relaxed">{features[activeFeature].details}</p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/inscription"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center"
                >
                  <FaRocket className="mr-3" />
                  Commencer gratuitement
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-200">
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  Essai gratuit 14 jours
                </div>
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  Sans engagement
                </div>
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  Support 24/7
                </div>
              </div>
            </div>

            {/* Statistiques animées */}
            <div className="relative z-10">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">Nos chiffres en temps réel</h3>
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">
                        {stat.value.toLocaleString()}
                        {stat.suffix}
                      </div>
                      <div className="text-green-200 text-sm font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                intelligentes
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez tous les outils pour simplifier la gestion des repas de votre famille
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-transform duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Comment ça marche ?</h2>
            <p className="text-xl text-gray-600">Trois étapes simples pour révolutionner vos repas</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Configurez votre famille",
                description: "Ajoutez les membres, leurs allergies et préférences alimentaires",
                icon: <FaUserPlus className="text-2xl" />,
                color: "from-blue-500 to-cyan-500",
              },
              {
                step: "02",
                title: "Planifiez vos repas",
                description: "Laissez l'IA suggérer ou choisissez vos recettes favorites",
                icon: <FaCalendarPlus className="text-2xl" />,
                color: "from-green-500 to-emerald-500",
              },
              {
                step: "03",
                title: "Générez vos courses",
                description: "Obtenez automatiquement votre liste de courses optimisée",
                icon: <FaListUl className="text-2xl" />,
                color: "from-purple-500 to-pink-500",
              },
            ].map((step, index) => (
              <div key={index} className="text-center relative">
                <div
                  className={`w-20 h-20 bg-gradient-to-r ${step.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg text-white`}
                >
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                {index < 2 && <div className="hidden md:block absolute top-10 -right-4 w-8 h-0.5 bg-gray-300"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ce que disent nos utilisateurs</h2>
            <p className="text-xl text-gray-600">Des familles satisfaites partagent leur expérience</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400 text-xl" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-500 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <FaLeaf className="text-white text-xl" />
                </div>
                <span className="text-3xl font-bold">FamilyMeal</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Révolutionnez la gestion des repas de votre famille avec notre solution intelligente et intuitive.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">Produit</h3>
              <ul className="space-y-3">
                {["Fonctionnalités", "Sécurité", "Support"].map((item, index) => (
                  <li key={index}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">Support</h3>
              <ul className="space-y-3">
                {["Centre d'aide", "Contact", "Documentation"].map((item, index) => (
                  <li key={index}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">© 2025 FamilyMeal. Tous droits réservés.</p>
            <div className="flex space-x-6">
              {["Confidentialité", "Conditions"].map((item, index) => (
                <a key={index} href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PageAccueil
