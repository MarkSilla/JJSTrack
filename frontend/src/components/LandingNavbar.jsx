import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogIn } from 'lucide-react'
import jjsLogo from '../assets/jjs_result.png'
import { AuthContext } from '../context/Context.jsx'

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Location', href: '#location' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#FAQ' },
]

const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  const { isAuthenticated } = useContext(AuthContext)

  useEffect(() => {
    let frameId = null
    const handleScroll = () => {
      if (frameId) return
      frameId = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 50)
        frameId = null
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleAuthAction = () => {
    setIsOpen(false)
    navigate('/login')
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[80] transition-all duration-500 ease-in-out ${scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-lg shadow-slate-900/5'
        : 'bg-transparent'
        }`}
    >
      <style>{`
        .nav-link {
          position: relative;
          display: inline-block;
          transition: color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2.5px;
          border-radius: 9999px;
          background: linear-gradient(to right, #2563eb, #3b82f6);
          transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .nav-link:hover::after {
          width: 100%;
        }
        
        .nav-link.nav-light:hover {
          color: #93c5fd;
        }
        
        .nav-link.nav-dark:hover {
          color: #1d4ed8;
        }
      `}</style>

      <div className="mx-auto w-full max-w-[88rem] px-4 py-2 sm:px-6 lg:px-8">
        <div className="relative flex h-14 w-full items-center justify-between sm:h-16">
          {/* Desktop Left Navigation Links */}
          <div className="min-w-0 flex-1">
            <ul className="hidden items-center gap-4 xl:flex 2xl:gap-6">
              {navLinks.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    className={`nav-link whitespace-nowrap text-sm font-medium transition-colors duration-500 2xl:text-base ${scrolled ? 'text-[#1E293B] nav-dark' : 'text-white nav-light'
                      }`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Logo Center */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[85] flex -translate-x-1/2 -translate-y-1/2 justify-center">
            <div className="flex items-center justify-center transition-all duration-500 ease-in-out">
              <img
                src={jjsLogo}
                alt="JJS logo"
                width="56"
                height="56"
                decoding="async"
                className={`h-11 w-11 object-contain transition-all duration-500 sm:h-12 sm:w-12 ${scrolled ? 'xl:h-12 xl:w-12' : 'xl:h-14 xl:w-14'}`}
              />
            </div>
          </div>

          {/* Desktop Auth Button & Mobile Toggle Button */}
          <div className="flex min-w-0 flex-1 items-center justify-end">
            <button
              onClick={handleAuthAction}
              className={`hidden rounded-lg px-6 py-2.5 font-medium transition-all duration-500 xl:block ${scrolled
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
                : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30'
                }`}
            >
              {isAuthenticated ? 'Sign In' : 'Sign In'}
            </button>
            <button
              type="button"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}
              className={`group relative z-[100] flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 xl:hidden ${isOpen
                ? 'bg-slate-900/80 text-white border border-white/20 shadow-lg shadow-black/40 backdrop-blur-xl'
                : scrolled
                  ? 'bg-slate-100/20 hover:bg-slate-200/90 text-slate-900 border border-slate-200/80 shadow-sm'
                  : 'bg-white/1 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 shadow-lg shadow-black/10'
                }`}
            >
              <div className="relative flex h-[18px] w-[22px] flex-col justify-between items-center">
                {/* Top line */}
                <span
                  className={`h-[2.5px] w-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-center ${isOpen
                    ? 'translate-y-[7.75px] rotate-[45deg] bg-white'
                    : scrolled
                      ? 'bg-slate-800'
                      : 'bg-white'
                    }`}
                />
                {/* Middle line */}
                <span
                  className={`h-[2.5px] w-full rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen
                    ? 'opacity-0 scale-x-0 translate-x-2'
                    : scrolled
                      ? 'bg-slate-800 opacity-100 scale-x-100'
                      : 'bg-white opacity-100 scale-x-100'
                    }`}
                />
                {/* Bottom line */}
                <span
                  className={`h-[2.5px] w-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-center ${isOpen
                    ? '-translate-y-[7.75px] -rotate-[45deg] bg-white'
                    : scrolled
                      ? 'bg-slate-800'
                      : 'bg-white'
                    }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar / Premium Drawer overlay */}
      <div
        className={`fixed inset-0 z-[90] xl:hidden transition-all duration-500 ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
        aria-hidden={!isOpen}
      >
        {/* Backdrop overlay */}
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'
            }`}
        />

        {/* Premium Drawer Container */}
        <aside
          className={`absolute right-0 top-0 flex h-dvh w-[min(88vw,22rem)] flex-col overflow-hidden border-l border-white/10 bg-[#070D1B] text-white shadow-2xl backdrop-blur-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          {/* Subtle Ambient Lighting Overlay */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-indigo-600/15 blur-3xl" />

          {/* Drawer Header */}
          <div className="relative flex items-center gap-3  border-b border-white/[0.08] px-6 py-5">
            <div className="flex h-12 w-12 items-center justify-center p-1.5 shadow-sm">
              <img
                src={jjsLogo}
                alt="JJS logo"
                width="40"
                height="40"
                decoding="async"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white">
                JJS TRACK
              </span>

            </div>
          </div>

          {/* Nav Items List */}
          <div className="relative flex flex-1 flex-col justify-between overflow-y-auto px-5 py-6">
            <ul className="flex flex-col space-y-1">
              {navLinks.map(({ label, href }, index) => (
                <li
                  key={href}
                  className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-8 opacity-0'
                    }`}
                  style={{
                    transitionDelay: isOpen ? `${(index + 1) * 60}ms` : '0ms'
                  }}
                >
                  <a
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className="group relative flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-300 hover:bg-white/[0.06] active:bg-white/[0.1]"
                  >
                    <span className="text-[15px] font-medium text-slate-200 transition-colors group-hover:text-white">
                      {label}
                    </span>

                    <ChevronRight
                      size={16}
                      className="text-slate-500 opacity-40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-white"
                    />
                  </a>
                </li>
              ))}
            </ul>

            {/* Bottom Action Section */}
            <div className="pt-6 border-t border-white/[0.08] mt-6">
              <button
                onClick={handleAuthAction}
                className="group relative flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:bg-blue-500 hover:shadow-blue-600/40 active:bg-blue-700"
              >
                <LogIn size={18} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5" />
                <span>{isAuthenticated ? 'Go to Account' : 'Sign In'}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </nav>
  )
}

export default LandingNavbar
