import { useState, useEffect } from 'react'
import image from '../assets/img'

const LOADING_MESSAGES = [
  'Preparing your workspace...',
  'Loading your dashboard...',
  'Fetching your latest orders...',
  'Setting up JJS Track...',
  'Almost ready...'
]

export function AuthLoadingScreen({ onComplete }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 1400)
    return () => clearInterval(messageInterval)
  }, [])

  useEffect(() => {
    const duration = 2500
    const startTime = Date.now()
    let animId

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const current = Math.min((elapsed / duration) * 100, 100)

      setProgress(Math.round(current))

      if (elapsed < duration) {
        animId = requestAnimationFrame(updateProgress)
      } else {
        if (onComplete) onComplete()
      }
    }

    animId = requestAnimationFrame(updateProgress)
    return () => cancelAnimationFrame(animId)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center font-sans animate-fade-in overflow-hidden">
      <div className="absolute inset-0 bg-[#020617]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>
      {image.bgjjs && (
        <img
          src={image.bgjjs}
          alt="JJS Storefront Background"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.08] grayscale pointer-events-none"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/90 via-transparent to-[#020617]" />
      <div className="relative z-10 w-full max-w-lg px-8 flex flex-col items-center text-center">
        <h2 className="flex flex-col items-center text-2xl font-black text-white tracking-widest mb-1 italic">
          <img src={image.JJS} alt="JJS logo" className="w-24 h-24 object-contain mb-2 drop-shadow-md" />
          <span>
            JJS <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500">TRACK</span>
          </span>
        </h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-10">
          Jennoel-Jennyl Sportswear
        </p>
        <div className="relative w-full h-16 flex items-center mb-8 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl px-6">
          <span className="absolute right-4 top-2 text-[10px] font-black text-blue-400 tracking-widest uppercase">
            {progress}%
          </span>
          <div className="relative flex-1 h-12">
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 border-b-4 border-dotted border-slate-700"
              style={{
                clipPath: `inset(0 0 0 ${progress}%)`
              }}
            />
            {/* Solid Cut Line */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 border-b-2 border-blue-500"
              style={{
                width: `${progress}%`
              }}
            />
            {/* Scissors Container */}
            <div
              className="absolute top-1/2 transition-all duration-75 ease-out"
              style={{
                left: `${progress}%`,
                transform: 'translate(-18px, -50%)'
              }}
            >
              <svg viewBox="0 0 48 48" className="w-12 h-12 text-blue-500 filter drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]">
                <g className="scissor-top" style={{ transformOrigin: '18px 24px' }}>
                  <circle cx="12" cy="17" r="5.5" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path d="M16 19.5 L40 23.5 L18 25.5 Z" fill="currentColor" />
                </g>
                <g className="scissor-bottom" style={{ transformOrigin: '18px 24px' }}>
                  <circle cx="12" cy="31" r="5.5" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path d="M16 28.5 L40 24.5 L18 22.5 Z" fill="currentColor" />
                </g>
                <circle cx="18" cy="24" r="2.5" fill="currentColor" stroke="white" strokeWidth="1" />
              </svg>
            </div>
          </div>
        </div>
        <div className="h-6 overflow-hidden w-full">
          <p className="text-sm font-semibold text-slate-300 transition-all duration-300 animate-slide-in">
            {LOADING_MESSAGES[messageIndex]}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthLoadingScreen

