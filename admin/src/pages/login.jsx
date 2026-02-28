import { useState } from 'react'
import image from '../assets/img'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    return (
        <div className="flex min-h-screen w-full font-sans bg-slate-50 overflow-hidden">
            <div className="hidden md:flex lg:w-[65%] md:w-[50%] bg-gradient-to-b from-[#0f172a] to-[#1e293b] flex-col justify-between p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <img src={image.JJS} alt="JJSTrack Logo" className="w-10 h-10 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <div className="text-2xl font-bold tracking-tight">JJSTrack <span className="text-sm font-normal text-slate-400 ml-2">Admin</span></div>
                </div>

                <div className="relative z-10 max-w-lg mb-12 md:mb-0  items-center">
                    <div className="flex mb-3">
                        <div className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-sm flex items-center gap-2 hover:bg-white/10 transition-all cursor-default backdrop-blur-sm">
                            Your trusted tailoring shop in the Philippines
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-playfair font-bold leading-tight mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Where every stitch tells a story.
                    </h1>
                    <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                        All-in-one web application. Track orders, manage clients, and grow your business with precision and style.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-slate-500">
                    © 2026 JJSTrack Inc. All rights reserved.
                </div>
            </div>

            {/* Right Login Side */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-slate-100">
                <div className="w-full max-w-md">
                    <div className="rounded-[2.5rem] p-8 md:p-12 relative ">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-20 bg-[#0f172a] border-2 border-blue-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                            <img src={image.JJS} alt="Logo" className="w-30 h-30" />
                        </div>

                        <div className="text-start mt-6 mb-10">
                            <h2 className="text-black text-3xl mb-2 font-playfair">Welcome Back</h2>
                            <p className="text-slate-400 text-sm">Enter your credentials to access the admin panel</p>
                        </div>

                        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-slate-300 text-sm font-medium">Email Address</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="admin@jjstrack.com"
                                        className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-black text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-slate-300 text-sm font-medium">Password</label>
                                    <a href="#" className="text-blue-500 text-sm hover:underline font-medium">Forgot password?</a>
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-black text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center gap-2 text-slate-400 text-sm cursor-pointer select-none">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-800 bg-[#0f172a] text-blue-600 focus:ring-blue-500/20" />
                                    Remember me
                                </label>
                            </div>

                            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transform transition-all active:scale-[0.98]">
                                Sign In
                            </button>
                        </form>

                        <div className="text-center mt-8 pt-6 border-t border-slate-800/50">
                            <p className="text-slate-500 text-xs tracking-wider uppercase">Admin Panel</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login