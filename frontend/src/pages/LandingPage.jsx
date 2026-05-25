import React, { Suspense, lazy, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LandingNavbar from '../components/LandingNavbar'
import Footer from '../components/Footer'
import { AuthContext } from '../context/Context'
import { ArrowRight, ClipboardList, Clock, Download, Mail, MapPin, Navigation, Package, Phone, Ruler, Users } from 'lucide-react'
import shop from '../assets/shop_result.png'
import jjsLogo from '../assets/jjs_result.png'
import panorama from '../assets/panoramajjs_result.webp'
import fit from '../assets/fit.jfif'
import desi from '../assets/desi.jpg'
import jersey from '../assets/jersey_result.jpg'
import featuredSportswear from '../assets/jersey/nb (4)_result.jpg'

const LandingTestimonials = lazy(() => import('./LandingTestimonials'))
const LandingFAQ = lazy(() => import('./LandingFAQ'))

const notify = async (type, message, options) => {
  const { toast } = await import('sonner')
  toast[type](message, options)
}

const LandingPage = () => {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator?.standalone === true
  })
  const { loading } = useContext(AuthContext)
  const navigate = useNavigate()

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }

    const handleAppInstalled = () => {
      setInstallPrompt(null)
      setIsAppInstalled(true)
      notify('success', 'JJSTrack app installed successfully.')
    }

    const standaloneQuery = window.matchMedia?.('(display-mode: standalone)')
    const handleStandaloneChange = (event) => setIsAppInstalled(event.matches)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    if (standaloneQuery?.addEventListener) {
      standaloneQuery.addEventListener('change', handleStandaloneChange)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      if (standaloneQuery?.removeEventListener) {
        standaloneQuery.removeEventListener('change', handleStandaloneChange)
      }
    }
  }, [])

  const handleDownloadApp = async () => {
    if (isAppInstalled) {
      notify('success', 'JJSTrack is already installed on this device.')
      return
    }

    if (installPrompt) {
      installPrompt.prompt()
      const choice = await installPrompt.userChoice

      if (choice?.outcome === 'accepted') {
        setInstallPrompt(null)
      }
      return
    }

    notify('info', 'Open your browser menu and choose Install app or Add to Home Screen.', {
      duration: 6500,
    })
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <main className="flex-grow">
        <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[#020617]">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px]" />
            <div className="absolute inset-0 opacity-[0.15] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          </div>

          <img
            src={shop}
            alt="JJS shop"
            width="1600"
            height="900"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/90 via-transparent to-[#020617]" />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center">
            <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom duration-700">
              <h1 className="text-5xl md:text-[120px] font-black leading-[0.85] tracking-tighter uppercase italic">
                <span className="text-white">JJS</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600">TRACK</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-100/60 max-w-2xl mx-auto font-medium leading-relaxed">
                <br className="hidden md:block" />
                We Create, Repair, and Elevate Team and Company Uniforms.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 items-center animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
              <button
                onClick={() => navigate('/signup')}
                className="group relative px-12 py-5 bg-white text-[#020617] rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all hover:bg-blue-500 hover:text-white hover:scale-105 active:scale-95 shadow-2xl shadow-white/10"
              >
                Sign Up Now!
              </button>
              <button
                onClick={handleDownloadApp}
                className="group relative inline-flex items-center justify-center gap-3 px-7 py-5 rounded-2xl border border-white/20 bg-white/10 text-white font-black uppercase text-xs tracking-[0.2em] backdrop-blur-md transition-all hover:bg-blue-500 hover:border-blue-400 hover:scale-105 active:scale-95 shadow-2xl shadow-blue-950/20"
                type="button"
              >
                <Download className="h-3 w-3 transition-transform group-hover:-translate-y-0.5" />
                Download App
              </button>
            </div>
          </div>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-opacity cursor-pointer">

            <div className="w-1 h-12 bg-gradient-to-b from-blue-500 to-transparent animate-bounce" />
          </div>
        </section >
        <section id="features" className="relative px-4 px-0 py-16 md:py-20 flex items-start justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[#F1F5F9]"> </div>
          <div className="relative z-10 text-center px-0 max-w-6xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold font-playfair text-[#0F172A] mb-6 ">Everything You Need to Scale</h1>
            <div className="border-b-2 border-yellow-400 w-16 md:w-24 mx-auto mb-4"></div>
            <p className="text-md md:text-lg mb-12 max-w-3xl mx-auto">
              Powerful tools designed specifically for JJSportswear, bringing traditional craftsmanship into the digital age.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
              {[
                { icon: ClipboardList, title: 'Order Tracking', desc: 'Track every order from measurement to delivery with real-time status updates.' },
                { icon: Users, title: 'Client Management', desc: 'Build lasting relationships with detailed client profiles and history.' },
                { icon: Ruler, title: 'Measurements Database', desc: 'Store and access precise measurements instantly. Never lose a detail.' },
                { icon: Package, title: 'Inventory Control', desc: 'Monitor fabric stock and supplies in real-time to prevent shortages.' }
              ].map((f, i) => (
                <div key={i} className="group bg-white rounded-[2rem] p-10 text-left border border-gray-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-20px_rgba(37,99,235,0.1)] transition-all duration-500 cursor-pointer">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-colors duration-500">
                    <f.icon className="text-blue-600 group-hover:text-white transition-colors duration-500" size={24} />
                  </div>
                  <h3 className="text-md font-black text-[#0F172A] mb-4 tracking-tight uppercase">{f.title}</h3>
                  <p className="text-[#64748b] text-sm font-medium leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="about" className="relative py-16 md:py-24 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-4">
            <div className="text-center mb-5 md:mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-playfair text-[#0F172A] mb-4">Our Expertise</h1>
              <div className="border-b-2 border-yellow-400 w-16 md:w-24 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3">
              <div className="md:col-span-2 relative rounded-none overflow-hidden min-h-[300px] md:min-h-[350px] group cursor-pointer" onClick={() => navigate('/designs')}>
                <div className="absolute inset-0 bg-[#0F172A]/90 ">
                  <img src={featuredSportswear} alt="Custom Sportswear" width="1200" height="900" loading="lazy" decoding="async" className=" w-full h-full object-cover opacity-60 group-hover:opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/40 to-transparent" />
                </div>
                <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center h-full text-left text-white max-w-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-1px bg-yellow-400" />
                    <span className="text-[10px] uppercase font-black tracking-[0.3em] text-blue-400">Elite Collections</span>
                  </div>
                  <h3 className="text-4xl md:text-6xl font-extrabold font-playfair   mb-4 leading-none uppercase tracking-tight">
                    JJS <br /> <span className="text-blue-400">Sportswear</span> Design
                  </h3>
                  <p className="text-sm md:text-base text-white/80 font-medium mb-8 leading-relaxed">
                    Elevate your team's presence with professional-grade jerseys. Fully customizable colors, logos, and elite spandex fabrics.
                  </p>
                  <div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('/designs'); }}
                      className="inline-flex items-center gap-3 bg-blue-400 text-white px-8 py-3.5 rounded-full font-black uppercase text-xs tracking-widest hover:bg-blue-300 hover:scale-105 transition-all shadow-xl shadow-blue-400/20"
                    >
                      Explore Our Designs
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="relative bg-[#0F172A] rounded-none overflow-hidden min-h-[280px] md:min-h-[350px] group">
                <div className="absolute inset-0">
                  <img src={fit} alt="Fit Profiles" width="900" height="700" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
                </div>
                <div className="relative z-10 p-8 flex flex-col justify-center h-full text-left text-white">
                  <h3 className="text-xl md:text-2xl font-bold font-playfair mb-3">Personalized <br /> Fit Profiles</h3>
                  <p className="text-white/60 font-medium text-xs md:text-sm leading-relaxed mb-6">
                    We securely store your measurements and style preferences to ensure every piece fits perfectly, every time you order.
                  </p>
                </div>
              </div>
              <div className="relative rounded-none overflow-hidden min-h-[250px] md:min-h-[320px] group">
                <div className="absolute inset-0 bg-[#0F172A]">
                  <img src={desi} alt="Repair" width="900" height="700" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent opacity-60" />
                </div>
                <div className="relative z-10 p-8 md:p-10 flex flex-col justify-center h-full text-left text-white">
                  <h3 className="text-xl md:text-2xl font-bold font-playfair text-white mb-3">Clothing Repair & Alterations</h3>
                  <p className="text-white/70 font-light text-sm md:text-base leading-relaxed">
                    From resizing and hemming to zipper replacement and repairs, we restore and adjust your clothes to look and feel just right.
                  </p>
                </div>
              </div>
              <div className="md:col-span-2 relative rounded-none overflow-hidden min-h-[280px] md:min-h-[320px] group">
                <div className="absolute inset-0 bg-[#0F172A]">
                  <img src={jersey} alt="jersey" width="1200" height="800" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity" />
                </div>
                <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center h-full text-left text-white">
                  <h3 className="text-3xl md:text-5xl font-black italic mb-2">Quality You Can Trust</h3>
                  <p className="text-sm md:text-base text-white">Every stitch matters. We focus on clean finishes, strong seams, and long-lasting materials—because details make the design stand out.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="location" className="relative bg-[#0F172A] overflow-hidden">
          <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
            <img
              src={panorama}
              alt="JJS Sportswear Shop Panorama"
              width="1600"
              height="900"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/60 via-transparent to-[#0F172A]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/40 to-transparent"></div>
            <div className="absolute top-2 left-3 md:top-12 md:left-12 z-10">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5">
                <MapPin className="text-yellow-400" size={16} />
                <span className="text-white text-sm font-medium tracking-wide">Our Location</span>
              </div>
            </div>
            <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10  ">
              <div className="text-center px-1">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-white m-y-10 drop-shadow-lg mb-2">
                  Visit Our Shop
                </h2>
                <div className="w-16 h-0.5 bg-yellow-400 mx-auto mb-2"></div>
              </div>
            </div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 -mt-16 pb-16 md:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <iframe
                  title="JJS Sportswear Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3847.0!2d120.2430905!3d14.8605929!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDUxJzM4LjEiTiAxMjDCsDE0JzM1LjEiRQ!5e0!3m2!1sen!2sph!4v1700000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '350px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full min-h-[350px] md:min-h-[400px]"
                ></iframe>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <img src={jjsLogo} alt="google" width="24" height="24" loading="lazy" decoding="async" className="w-6 h-6" />
                    <span className="text-xs uppercase tracking-widest text-yellow-400 font-semibold">JJSportswear</span>
                  </div>

                  <h3 className="text-2xl font-playfair font-bold text-white mb-4">Jennoel-Jennyl Sportswear</h3>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-blue-400 mt-0.5 shrink-0" size={20} />
                      <p className="text-gray-300 text-sm leading-relaxed">
                        Purok 3B National Highway,<br />
                        Calapacuan, Subic,<br />
                        Zambales, Philippines
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="text-blue-400 shrink-0" size={20} />
                      <p className="text-gray-300 text-sm">0908 997 2332</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="text-blue-400 shrink-0" size={20} />
                      <p className="text-gray-300 text-sm">jjsportswearph@gmail.com</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="text-blue-400 shrink-0" size={20} />
                      <div className="flex flex-col">
                        <p className="text-gray-300 text-sm">Mon - Sat: 8:00 AM – 8:00 PM</p>
                        <p className="text-gray-300 text-sm">Sun: <span className="text-red-500 font-bold">Closed</span></p>
                      </div>
                    </div>
                  </div>
                </div>
                <a
                  href="https://www.google.com/maps/@14.8605929,120.2430905,3a,75y,42.19h,85.86t/data=!3m7!1e1!3m5!1sclhDjyO6FL7gA0kwpA0OsQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D4.141821770887503%26panoid%3DclhDjyO6FL7gA0kwpA0OsQ%26yaw%3D42.190002848256434!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDIwOS4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25"
                >
                  <Navigation size={20} />
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        </section>
        <Suspense fallback={null}>
          <LandingTestimonials />
          <LandingFAQ />
        </Suspense>
      </main>
      <Footer />
    </div >
  )
}

export default LandingPage


