"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

const PageAccueil = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: "fas fa-users-medical",
      title: "Profils Familiaux",
      description: "Gérez les allergies et préférences de chaque membre",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      icon: "fas fa-utensils",
      title: "Recettes Intelligentes",
      description: "Catalogue personnalisé avec suggestions IA",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      icon: "fas fa-calendar-check",
      title: "Planification Avancée",
      description: "Calendrier intelligent pour vos repas",
      image:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      icon: "fas fa-shopping-basket",
      title: "Courses Optimisées",
      description: "Listes automatiques et budget intelligent",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      icon: "fas fa-chart-line",
      title: "Suivi Nutritionnel",
      description: "Analyse des apports et recommandations",
      image:
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      icon: "fas fa-brain",
      title: "Assistant IA",
      description: "Conseils personnalisés et suggestions",
      image: "https://images.unsplash.com/photo-1543353071-873f17a7a088?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-green-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-leaf text-white text-lg"></i>
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
              <a href="#pricing" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                Tarifs
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/connexion" className="text-green-600 hover:text-green-700 font-medium transition-colors">
                Connexion
              </Link>
              <Link
                to="/inscription"
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                Essai gratuit
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 relative overflow-hidden min-h-screen flex items-center">
        {/* Image d'arrière-plan */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          }}
        ></div>

        {/* Overlay avec dégradé */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-emerald-900/10 to-teal-900/20"></div>

        {/* Formes décoratives */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-emerald-200/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center relative z-10">
            <div className="inline-flex items-center bg-green-100 rounded-full px-4 py-2 mb-6">
              <i className="fas fa-sparkles text-green-600 mr-2"></i>
              <span className="text-green-800 font-medium text-sm">Nouveau : Assistant IA intégré</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Organisez vos{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                repas familiaux
              </span>{" "}
              intelligemment
            </h1>

            <p className="text-lg md:text-xl text-gray-100 mb-8 leading-relaxed max-w-3xl mx-auto">
              Planifiez, cuisinez et savourez en famille. Gérez les allergies, optimisez vos courses et découvrez de
              nouvelles recettes adaptées à chaque membre.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
              <Link
                to="/inscription"
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center"
              >
                <i className="fas fa-rocket mr-3"></i>
                Commencer gratuitement
              </Link>
          
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-200">
              <div className="flex items-center">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                Essai gratuit 14 jours
              </div>
              <div className="flex items-center">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                Sans engagement
              </div>
              <div className="flex items-center">
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                Support 24/7
              </div>
            </div>

          
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "10K+", label: "Familles actives", icon: "fas fa-users" },
              { number: "50K+", label: "Repas planifiés", icon: "fas fa-utensils" },
              { number: "98%", label: "Satisfaction", icon: "fas fa-heart" },
              { number: "24/7", label: "Support", icon: "fas fa-headset" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <i className={`${stat.icon} text-white text-2xl`}></i>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carousel Section */}
      <section id="carousel" className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Découvrez notre{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                univers culinaire
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Plongez dans un monde de saveurs et d'organisation parfaite
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-2xl">
              <div className="relative h-96 lg:h-[500px]">
                {[
                  {
                    url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
                    title: "Cuisine Familiale",
                    description: "Des repas savoureux pour toute la famille",
                  },
                  {
                    url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
                    title: "Planification Intelligente",
                    description: "Organisez vos repas en quelques clics",
                  },
                  {
                    url: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
                    title: "Ingrédients Frais",
                    description: "Gérez vos courses et stocks facilement",
                  },
                  {
                    url: "https://images.unsplash.com/photo-1543353071-873f17a7a088?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
                    title: "Recettes Personnalisées",
                    description: "Des suggestions adaptées à votre famille",
                  },
                ].map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      index === activeFeature ? "opacity-100 scale-100" : "opacity-0 scale-105"
                    }`}
                  >
                    <div
                      className="w-full h-full bg-cover bg-center relative"
                      style={{ backgroundImage: `url(${image.url})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                        <h3 className="text-3xl lg:text-5xl font-black text-white mb-4 drop-shadow-lg">
                          {image.title}
                        </h3>
                        <p className="text-xl text-gray-200 font-medium max-w-2xl drop-shadow-md">
                          {image.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={() => setActiveFeature((prev) => (prev - 1 + 4) % 4)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
            >
              <i className="fas fa-chevron-left text-2xl group-hover:-translate-x-1 transition-transform duration-300"></i>
            </button>
            <button
              onClick={() => setActiveFeature((prev) => (prev + 1) % 4)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
            >
              <i className="fas fa-chevron-right text-2xl group-hover:translate-x-1 transition-transform duration-300"></i>
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-8 space-x-3">
              {[0, 1, 2, 3].map((index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    index === activeFeature
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 scale-125 shadow-lg"
                      : "bg-gray-300 hover:bg-gray-400 hover:scale-110"
                  }`}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-white">
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
                icon: "fas fa-user-plus",
                color: "from-blue-500 to-cyan-500",
              },
              {
                step: "02",
                title: "Planifiez vos repas",
                description: "Laissez l'IA suggérer ou choisissez vos recettes favorites",
                icon: "fas fa-calendar-alt",
                color: "from-green-500 to-emerald-500",
              },
              {
                step: "03",
                title: "Générez vos courses",
                description: "Obtenez automatiquement votre liste de courses optimisée",
                icon: "fas fa-shopping-cart",
                color: "from-purple-500 to-pink-500",
              },
            ].map((step, index) => (
              <div key={index} className="text-center relative">
                <div
                  className={`w-20 h-20 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                >
                  <i className={`${step.icon} text-white text-2xl`}></i>
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
      <section id="testimonials" className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ce que disent nos utilisateurs</h2>
            <p className="text-xl text-gray-600">Plus de 10 000 familles nous font confiance</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <i key={i} className="fas fa-star text-yellow-400"></i>
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
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

      {/* CTA Section */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <i className="fas fa-leaf text-white text-xl"></i>
                </div>
                <span className="text-3xl font-bold">FamilyMeal</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Révolutionnez la gestion des repas de votre famille avec notre solution intelligente et intuitive.
              </p>
              <div className="flex space-x-4">
                {["fab fa-facebook", "fab fa-twitter", "fab fa-instagram", "fab fa-linkedin"].map((icon, index) => (
                  <div
                    key={index}
                    className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-300"
                  >
                    <i className={`${icon} text-gray-400 hover:text-white`}></i>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">Produit</h3>
              <ul className="space-y-3">
                {["Fonctionnalités", "Tarifs", "Sécurité", "Intégrations"].map((item, index) => (
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
                {["Centre d'aide", "Contact", "Documentation", "Statut"].map((item, index) => (
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
            <p className="text-gray-400 mb-4 md:mb-0">© 2024 FamilyMeal. Tous droits réservés.</p>
            <div className="flex space-x-6">
              {["Confidentialité", "Conditions", "Cookies"].map((item, index) => (
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
