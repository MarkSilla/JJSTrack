import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Context from './context/Context'
import LandingPage from './pages/LandingPage'
import ProtectedRoute from './components/ProtectedRoute'

const App = () => {
  return (
    <Context>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* Add protected routes here */}
          {/* <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> */}
        </Routes>
      </Router>
    </Context>
  )
}

export default App
