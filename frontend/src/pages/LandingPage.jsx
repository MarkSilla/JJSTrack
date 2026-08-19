import React, { Suspense, lazy, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import LandingNavbar from '../components/LandingNavbar'
import Footer from '../components/Footer'
import { AuthContext } from '../context/Context'
import { RouteSkeleton } from '../components/SkeletonLoaders'
import { ArrowRight, ClipboardList, Clock, Download, Eye, Mail, MapPin, Navigation, Package, Phone, Ruler, Users } from 'lucide-react'
import { pageViewApi } from '../../services/pageViewApi.js'
import shop from '../assets/shop_result.png'
import jjsLogo from '../assets/jjs_result.png'
import panorama from '../assets/panoramajjs_result.webp'
import fit from '../assets/fit.jfif'
import desi from '../assets/desi.jpg'
import jersey from '../assets/jersey_result.jpg'
import featuredSportswear from '../assets/jersey/nb (4)_result.jpg'

const LandingTestimonials = lazy(() => import('./LandingTestimonials'))
const LandingFAQ = lazy(() => import('./LandingFAQ'))
const heroServices = 'Custom Team Jerseys • Company & Organization Uniforms • Alteration & Repair Service • Quality You Can Trust • Made-to-Order Apparel'

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
  const [pageViews, setPageViews] = useState(null)

  useEffect(() => {
    let isMounted = true
    const trackPageVisit = async () => {
      try {
        const hasViewedInSession = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('jjstrack_landing_viewed')
        let res
        if (hasViewedInSession) {
          res = await pageViewApi.getPageViewCount()
        } else {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('jjstrack_landing_viewed', '1')
          }
          res = await pageViewApi.recordPageView()
        }

        if (isMounted && res?.success && typeof res.count === 'number') {
          setPageViews(res.count)
        } else {
          const fetchRes = await pageViewApi.getPageViewCount()
          if (isMounted && fetchRes?.success && typeof fetchRes.count === 'number') {
            setPageViews(fetchRes.count)
          }
        }
      } catch (err) {
        console.error('Error tracking page view:', err)
      }
    }
    trackPageVisit()
    return () => {
      isMounted = false
    }
  }, [])

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
    return <RouteSkeleton />
  }

  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <main className="flex-grow">
        <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
          <style>{`
            @keyframes heroServicesMarquee {
              0% {
                transform: translate3d(0, 0, 0);
              }
              100% {
                transform: translate3d(-50%, 0, 0);
              }
            }

            .hero-services-track {
              animation: heroServicesMarquee 45s linear infinite;
              will-change: transform;
              backface-visibility: hidden;
            }
              
          `}</style>
          <div className="absolute inset-0 bg-[#020617]">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px]" />
            <div className="absolute inset-0 opacity-[0.15] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          </div>

          <img
            src={shop}
            alt="JJS Sportswear shop storefront in Calapacuan, Subic, Zambales"
            width="1600"
            height="900"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/90 via-transparent to-[#020617]" />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-center mb-10"
            >
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none tracking-tight uppercase italic">
                <span className="text-white">JJS </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500">TRACK</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed mt-4">
                We Create, Repair, and Elevate Team and Company Uniforms.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center"
            >
              <button
                onClick={() => navigate('/signup')}
                className="group relative min-h-[44px] px-8 py-4 bg-blue-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider transition-all hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 cursor-pointer"
              >
                Sign Up Now
              </button>
              <button
                onClick={handleDownloadApp}
                className="group relative inline-flex min-h-[44px] items-center justify-center gap-3 px-4 py-4 lg:px-8 lg:py-4 rounded-xl border border-slate-700 bg-slate-900/80 text-white font-bold uppercase text-[10px] tracking-wider backdrop-blur-md transition-all hover:bg-slate-800 hover:border-slate-600 hover:scale-105 active:scale-95 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
                type="button"
              >
                <Download className="h-4 w-4 transition-transform" />
                Download App
              </button>
            </motion.div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden border-y border-slate-800 bg-[#020617]/80 py-2.5 backdrop-blur-md">
            <div className="hero-services-track flex w-max whitespace-nowrap">
              {[...Array(4)].map((_, index) => (
                <span
                  key={index}
                  className="px-2 text-[8px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-300"
                >
                  {heroServices}
                </span>
              ))}
            </div>
          </div>
        </section>
        <section id="features" className="relative px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex items-start justify-center overflow-hidden bg-slate-100">
          <div className="relative z-10 text-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-playfair text-[#0F172A] mb-4">
                Everything You Need to Scale
              </h2>
              <div className="border-b-4 border-amber-400 w-16 md:w-20 mx-auto mb-6 rounded-full"></div>
              <p className="text-base md:text-lg text-slate-600 mb-12 max-w-3xl mx-auto font-medium">
                Powerful tools designed specifically for JJSportswear, bringing traditional craftsmanship into the digital age.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[
                { icon: ClipboardList, title: 'Order Tracking', desc: 'Track every order from measurement to delivery with real-time status updates.' },
                { icon: Users, title: 'Client Management', desc: 'Build lasting relationships with detailed client profiles and history.' },
                { icon: Ruler, title: 'Measurements Database', desc: 'Store and access precise measurements instantly. Never lose a detail.' },
                { icon: Package, title: 'Inventory Control', desc: 'Monitor fabric stock and supplies in real-time to prevent shortages.' }
              ].map((f, i) => (
                <motion.article
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  tabIndex={0}
                  role="article"
                  className="group bg-white rounded-2xl p-8 text-left border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-default"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                    <f.icon className="text-blue-600 group-hover:text-white transition-colors duration-300" size={22} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 tracking-tight uppercase">{f.title}</h3>
                  <p className="text-slate-600 text-sm font-normal leading-relaxed">{f.desc}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
        <section id="services" className="relative py-16 md:py-24 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8 md:mb-12"
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-playfair text-[#0F172A] mb-4">Our Expertise</h2>
              <div className="border-b-4 border-amber-400 w-16 md:w-20 mx-auto rounded-full"></div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/designs'); } }}
                onClick={() => navigate('/designs')}
                className="md:col-span-2 relative rounded-2xl overflow-hidden min-h-[320px] md:min-h-[360px] group cursor-pointer border border-slate-200/60 shadow-md hover:shadow-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <div className="absolute inset-0 bg-slate-950">
                  <img src={featuredSportswear} alt="Custom Sportswear" width="1200" height="900" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
                </div>
                <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center h-full text-left text-white max-w-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-0.5 bg-amber-400" />
                    <span className="text-xs uppercase font-bold tracking-widest text-blue-400">Elite Collections</span>
                  </div>
                  <h3 className="text-4xl md:text-6xl font-extrabold font-playfair mb-4 leading-none uppercase tracking-tight">
                    JJS <span className="text-blue-400">Sportswear</span> Design
                  </h3>
                  <p className="text-sm md:text-base text-slate-200 font-normal mb-6 leading-relaxed">
                    Elevate your team's presence with professional-grade jerseys. Fully customizable colors, logos, and elite spandex fabrics.
                  </p>
                  <div>
                    <span className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wider group-hover:bg-blue-500 transition-colors shadow-md">
                      Explore Our Designs
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="relative bg-slate-900 rounded-2xl overflow-hidden min-h-[280px] md:min-h-[360px] group border border-slate-800 shadow-md"
              >
                <div className="absolute inset-0">
                  <img src={fit} alt="Fit Profiles" width="900" height="700" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-35 group-hover:opacity-50 transition-opacity" />
                </div>
                <div className="relative z-10 p-8 flex flex-col justify-center h-full text-left text-white">
                  <h3 className="text-xl md:text-2xl font-bold font-playfair mb-3">Personalized Fit Profiles</h3>
                  <p className="text-slate-300 font-normal text-sm leading-relaxed">
                    We securely store your measurements and style preferences to ensure every piece fits perfectly, every time you order.
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="relative rounded-2xl overflow-hidden min-h-[280px] md:min-h-[320px] group border border-slate-800 shadow-md"
              >
                <div className="absolute inset-0 bg-slate-900">
                  <img src={desi} alt="Repair" width="900" height="700" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-40 group-hover:opacity-55 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-70" />
                </div>
                <div className="relative z-10 p-8 flex flex-col justify-center h-full text-left text-white">
                  <h3 className="text-xl md:text-2xl font-bold font-playfair text-white mb-3">Clothing Repair & Alterations</h3>
                  <p className="text-slate-300 font-normal text-sm leading-relaxed">
                    From resizing and hemming to zipper replacement and repairs, we restore and adjust your clothes to look and feel just right.
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="md:col-span-2 relative rounded-2xl overflow-hidden min-h-[280px] md:min-h-[320px] group border border-slate-800 shadow-md"
              >
                <div className="absolute inset-0 bg-slate-900">
                  <img src={jersey} alt="jersey" width="1200" height="800" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-50 group-hover:opacity-65 transition-opacity" />
                </div>
                <div className="relative z-10 p-8 flex flex-col justify-center h-full text-left text-white">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase italic mb-3 tracking-tight">Quality You Can Trust</h3>
                  <p className="text-sm md:text-base text-slate-200 font-normal max-w-2xl leading-relaxed">Every stitch matters. We focus on clean finishes, strong seams, and long-lasting materials—because details make the design stand out.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        <section id="location" className="relative bg-[#0F172A] overflow-hidden">
          <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
            <img
              src={panorama}
              alt="JJS Sportswear shop panorama at Purok 3B National Highway, Calapacuan, Subic"
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

                  <address className="not-italic space-y-4 mb-8">
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
                  </address>
                </div>
                <a
                  href="https://www.google.com/maps/@14.8605929,120.2430905,3a,75y,42.19h,85.86t/data=!3m7!1e1!3m5!1sclhDjyO6FL7gA0kwpA0OsQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D4.141821770887503%26panoid%3DclhDjyO6FL7gA0kwpA0OsQ%26yaw%3D42.190002848256434!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDIwOS4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open JJS Sportswear location in Google Maps"
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
      <div className="absolute bottom-10 right-4 lg:bottom-8 lg:right-4 lg:group flex flex-col items-end">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0000000]/90 border border-slate-700/60 text-slate-300 backdrop-blur-md shadow-lg shadow-black/40 text-[11px] font-semibold tracking-wide transition-all duration-300 group-hover:scale-105 group-hover:border-white/30 group-hover:text-white cursor-default"
          title="Viewers Count"
        >
          <Eye className="w-3.5 h-3.5 text-white transition-transform group-hover:scale-105" />
          <span>{typeof pageViews === 'number' ? pageViews.toLocaleString() : 0}</span>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
