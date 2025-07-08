import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import PageAccueil from "./components/PageAccueil"
import PageInscription from "./components/PageInscription"
import PageConnexion from "./components/PageConnexion"
import PageOnboarding from "./components/PageOnboarding"
import Dashboard from "./components/Dashboard"
import "./App.css"

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<PageAccueil />} />
          <Route path="/inscription" element={<PageInscription />} />
          <Route path="/connexion" element={<PageConnexion />} />
          <Route path="/onboarding" element={<PageOnboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
