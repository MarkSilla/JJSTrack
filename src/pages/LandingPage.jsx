import React from 'react'
import LandingNavbar from '../components/LandingNavbar'
import Footer from '../components/Footer'


const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <main className="flex-grow">
        <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-indigo-900 opacity-100"></div>
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url('/src/assets/shop.png')` }}></div>
          <div className="relative z-10 text-center px-4">
            <span className="inline-block bg-blue-900/60 border border-blue-400/40 text-blue-200 text-sm md:text-base px-5 py-2 rounded-full mb-6 tracking-wide">
              Your trusted tailoring shop in the Philippines
            </span>
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Master Your Craft.
            </h1>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r bg-clip-text text-transparent from-blue-600 to-blue-100 mb-9 leading-tight">
              Manage Your Business.
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              All-in-one web application. Track orders, manage clients, and grow your business with precision and style.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/signup')} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg font-medium transition-colors">
                Register Now!
              </button>

            </div>
          </div>
          <div className="absolute bottom-0  left-1/2 -translate-x-1/2 z-10 animate-bounce duration-400 justify-center items-center flex">
            <span className="material-symbols-outlined text-white text-4xl opacity-80">keyboard_arrow_down</span>
          </div>
        </section >
        <section id="features" className="relative px-4 px-0 py-16 md:py-20 flex items-start justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[#F1F5F9]"> </div>
          <div className="relative z-10 text-center px-0 max-w-6xl mx-auto">
            <h1 className="text-6xl md:text-4xl font-bold font-playfair text-[#0F172A] mb-6 ">Everything You Need to Scale</h1>
            <p className="text-md md:text-lg mb-12 max-w-3xl mx-auto">
              Powerful tools designed specifically for JJSportswear, bringing traditional craftsmanship into the digital age.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4 lg:gap-6 justify-center">
              <div className="bg-[#D5DBEC] rounded-2xl py-10 px-6 text-left shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-blue-600">assignment</span>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">Order Tracking</h3>
                <p className="text-[#475569] text-sm">Track every order from measurement to delivery with real-time status updates.</p>
              </div>
              <div className="bg-[#D5DBEC] rounded-2xl py-10 px-6 text-left shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-blue-600">group</span>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">Client Management</h3>
                <p className="text-[#475569] text-sm">Build lasting relationships with detailed client profiles and history.</p>
              </div>
              <div className="bg-[#D5DBEC] rounded-2xl py-10 px-6 text-left shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-blue-600">straighten</span>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">Measurements Database</h3>
                <p className="text-[#475569] text-sm">Store and access precise measurements instantly. Never lose a detail.</p>
              </div>
              <div className="bg-[#D5DBEC] rounded-2xl py-10 px-6 text-left shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-blue-600">inventory_2</span>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">Inventory Control</h3>
                <p className="text-[#475569] text-sm">Monitor fabric stock and supplies in real-time to prevent shortages.</p>
              </div>
            </div>
          </div>
        </section>
        <section id="about" className="relative py-16 md:py-24 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-4">
            <div className="text-center mb-10 md:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-playfair text-[#0F172A] mb-4">Curated Features</h1>
              <div className="border-b-2 border-yellow-400 w-16 md:w-24 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="md:col-span-2 relative rounded-none overflow-hidden min-h-[280px] md:min-h-[320px] group">
                <div className="absolute inset-0 bg-[#0F172A]">
                  <img src="/src/assets/shop.png" alt="Fit Profiles" className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity" />
                </div>
                {/* Top Left */}
                <div className="relative z-10 p-6 md:p-8 flex flex-col justify-end h-full text-left text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-sm text-yellow-400">content_cut</span>
                    <span className="text-xs uppercase font-thin tracking-wider text-yellow-400">JJS Management</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-normal font-playfair mb-2">Personalized Fit Profiles</h3>
                  <p className="text-sm text-white font-light">We save your measurements and preferences to ensure every sportswear piece or altered garment fits you perfectly, every time.</p>
                </div>
              </div>
              {/* Top Right */}
              <div className="bg-[#0F172A] rounded-none  p-8 flex flex-col justify-center min-h-[250px] md:min-h-[320px] text-left">
                <h3 className="text-xl md:text-2xl font-bold font-playfair text-white mb-3">Custom Sportswear <span className="text-yellow-400">Design</span></h3>
                <p className="text-white font-light text-sm md:text-base mb-6">Create jerseys and sportswear tailored to your team's identity. Choose your colors, logos, names, and numbers—designed for comfort, durability, and performance.</p>
                <div>
                  <a href="#" className="inline-block border-b-2 border-yellow-400 text-white px-4 md:px-6 py-2 rounded-lg font-medium 
                    hover:shadow-[0_3px_1px_#facc15] transition-all duration-300">View Designs</a>
                </div>
              </div>
              {/* Bottom Left */}
              <div className="bg-[#F8FAFC] border border-gray-300 rounded-none  p-8 md:p-10 flex flex-col justify-center min-h-[250px] md:min-h-[320px] text-left">
                <div className="mb-4">
                  <span className="material-symbols-outlined text-3xl text-[#0F172A]">straighten</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold font-playfair text-[#0F172A] mb-3">Clothing Repair & Alterations</h3>
                <p className="text-[#475569] font-light text-sm md:text-base">From resizing and hemming to zipper replacement and repairs, we restore and adjust your clothes to look and feel just right.</p>
              </div>
              {/* Bottom Right */}
              <div className="md:col-span-2 relative rounded-none overflow-hidden min-h-[280px] md:min-h-[320px] group">
                <div className="absolute inset-0 bg-[#0F172A]">
                  <img src="/src/assets/jersey.jpg" alt="jersey" className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity" />
                </div>
                <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center h-full text-left text-white">
                  <h3 className="text-3xl md:text-5xl font-black italic mb-2">Quality You Can Trust</h3>
                  <p className="text-sm md:text-base text-white">Every stitch matters. We focus on clean finishes, strong seams, and long-lasting materials—because details make the design stand out.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage
