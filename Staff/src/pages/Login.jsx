import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import image from '../assets/img'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log('Login attempt:', { email, password })
    }

    return (
        <div className="flex min-h-screen w-full font-inter bg-white overflow-hidden">
            <div className="hidden md:flex xl:w-[50%] md:w-[50%] bg-gradient-to-br from-[#4ca9df] to-[#292e91] flex-col justify-between p-8 md:p-9 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)' }}>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <img src={image.JJS} alt="JJSTrack Logo" className="w-10 h-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                    <div className="text-2xl font-bold tracking-tight">JJSTrack <span className="text-sm font-normal text-white/70 ml-2">Staff</span></div>
                </div>

                <div className="relative z-10 max-w-sm mb-12 md:mb-0 items-center ">
                    <h1 className="text-2xl md:text-5xl  xl:text-5xl  font-playfair font-bold leading-tight mb-3 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        Quality Matters.
                    </h1>
                    <p className="italic text-sm md:text-sm xl:text-sm text-white/90 mb-8 leading-relaxed">
                        Easily manage and track repair and tailoring jobs.
                    </p>
                </div>

                <div className="relative text-center z-10 text-sm text-white/40">
                    © 2026 JJSTrack Inc. All rights reserved.
                </div>
            </div>

            {/* Right Login Side */}
            <div className="flex-1 flex items-center justify-center mt-16 md:mt-14 p-1 md:p-12 ">
                <div className="w-full max-w-xs md:max-w-md">
                    <div className="rounded-2xl md:rounded-3xl p-3 md:p-8 relative">
                        <div className="absolute -top-14 md:-top-12 left-1/2 -translate-x-1/2 flex items-center justify-center">
                            <img src={image.JJS} alt="Logo" className="w-20 h-20 md:w-20 md:h-20" />
                        </div>

                        <div className="text-start mt-6 md:mt-4 mb-6 md:mb-6">
                            <h2 className="text-transparent bg-gradient-to-r from-[#4ca9df] to-[#292e91] bg-clip-text text-2xl md:text-3xl mb-2 font-playfair font-bold">Welcome Back</h2>
                            <p className="text-slate-600 text-sm md:text-xs">Enter your credentials to access your staff portal</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-slate-700 text-sm md:text-xs font-semibold">Email Address</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="Your Email"
                                        className="w-full border border-blue-200 rounded-lg md:rounded-xl py-3 md:py-3 pl-11 pr-4 text-slate-900 text-base md:text-sm focus:outline-none focus:border-[#4ca9df] focus:ring-4 focus:ring-blue-400/20 focus:bg-white transition-all placeholder:text-slate-400"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-slate-700 text-sm md:text-xs font-semibold">Password</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="•••••••••"
                                        className="w-full  border border-blue-200 rounded-lg md:rounded-xl py-3 md:py-3 pl-11 pr-11 text-slate-900 text-base md:text-sm focus:outline-none focus:border-[#4ca9df] focus:ring-4 focus:ring-blue-400/20 focus:bg-white transition-all placeholder:text-slate-400"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end mt-3 md:mt-2">
                                <a href="#" className="text-sm md:text-xs text-[#4ca9df] hover:text-[#292e91] transition-colors font-medium">
                                    Forgot Password?
                                </a>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full bg-gradient-to-r from-[#4ca9df] to-[#292e91] hover:from-[#3fa3d8] hover:to-[#1f2875] text-white font-semibold py-3 md:py-2.5 rounded-lg md:rounded-xl shadow-lg shadow-blue-500/30 transform transition-all active:scale-[0.98] mt-4 text-base md:text-base"
                            >
                                Sign In
                            </button>
                        </form>

                        <div className="text-center mt-5 md:mt-6 pt-4 md:pt-4 border-t border-slate-300">
                            <p className="text-slate-400 text-xs">Staff Portal</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login