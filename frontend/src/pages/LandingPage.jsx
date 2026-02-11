import React from 'react'
import LandingNavbar from '../components/LandingNavbar'
import Footer from '../components/Footer'

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <main className="flex-grow">
        {/* Landing page content goes here */}
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage
