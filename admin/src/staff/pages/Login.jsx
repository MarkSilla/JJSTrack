import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import image from '../assets/img'
import { API_BASE_URL } from '../utils/apiBaseUrl'
import { persistStoredStaffUser } from '../utils/staffSession'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberStaffEmail')
        if (rememberedEmail) {
            setEmail(rememberedEmail)
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        const normalizedEmail = String(email).replace(/\s+/g, '').trim().toLowerCase()
        const rawPassword = String(password)

        if (!normalizedEmail || !rawPassword) {
            setError('Please enter your email and password.')
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/users/staff/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: normalizedEmail,
                    password: rawPassword,
                }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data?.message || 'Login failed')
            }

            if (!data?.staff || data.staff.role !== 'staff') {
                throw new Error('This account has no staff portal access.')
            }

            localStorage.setItem('staffToken', data.token)
            localStorage.setItem('rememberStaffEmail', normalizedEmail)
            persistStoredStaffUser(data.staff)

            // Notify auth context of the change
            window.dispatchEvent(new Event('staff-auth-changed'))

            navigate('/staff/dashboard')
        } catch (err) {
            setError(err.message || 'Unable to login right now.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full font-inter bg-slate-50 overflow-hidden">
            <div className="hidden md:flex xl:w-[50%] md:w-[50%] bg-gradient-to-b from-[#0f172a] to-[#1e293b] flex-col justify-between p-2 md:p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <img
                        src={image.Staffjjs}
                        alt="Staff Background"
                        className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] to-[#1e293b]/30  backdrop-blur-[1px]"></div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <img src={image.JJS} alt="JJSTrack Logo" className="w-10 h-10 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <div className="text-2xl font-bold tracking-tight">JJSTrack <span className="text-sm font-normal text-slate-400 ml-2">Staff</span></div>
                </div>

                <div className="relative z-10 max-w-sm mb-12 md:mb-0 items-center ">
                    <h1 className="text-2xl md:text-5xl  xl:text-5xl  font-playfair font-bold leading-tight mb-3 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                        Quality Matters.
                    </h1>
                    <p className="text-sm md:text-sm xl:text-lg text-slate-300 mb-8 leading-relaxed">
                        Easily manage and track repair and tailoring jobs to ensure accurate and timely work.
                    </p>
                </div>

                <div className="relative text-start z-10 text-sm text-slate-500">
                    © 2026 JJSTrack Inc. All rights reserved.
                </div>
            </div>

            {/* Right Login Side */}
            <div className="flex-1 relative flex items-center justify-center md:p-12 bg-slate-100">
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="absolute left-5 top-5 md:left-8 md:top-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                >
                    <ArrowLeft size={16} />
                    Access Portal
                </button>
                <div className="w-full max-w-md px-4">
                    <div className="rounded-2xl md:rounded-3xl p-3 md:p-8 relative">
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-20 h-20 bg-[#0f172a] border-2 border-blue-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                            <img src={image.JJS} alt="Logo" className="w-13 h-13" />
                        </div>
                        <div className="text-start mt-14 mb-8">
                            <h2 className="text-light text-2xl md:text-3xl mb-2 font-playfair font-bold">Welcome Back</h2>
                            <p className="text-slate-400 text-sm md:text-xs">Enter your credentials to access your staff portal</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="block text-slate-300 text-sm md:text-xs font-semibold">Email Address</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="w-full bg-white border border-slate-300 rounded-lg md:rounded-xl py-3 md:py-3 pl-11 pr-4 text-slate-900 text-base md:text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-slate-300 text-sm md:text-xs font-semibold">Password</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        className="w-full bg-white border border-slate-300 rounded-lg md:rounded-xl py-3 md:py-3 pl-11 pr-11 text-slate-900 text-base md:text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-400"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end mt-3 md:mt-2">
                                <a href="#" className="text-sm md:text-xs text-blue-500 hover:text-blue-600 transition-colors font-medium">
                                    Forgot Password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 md:py-4 rounded-lg md:rounded-xl shadow-lg shadow-blue-500/30 transform transition-all active:scale-[0.98] mt-4 text-base md:text-base"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="text-center mt-5 md:mt-6 pt-4 md:pt-4 border-t border-slate-800/50">
                            <p className="text-slate-500 text-xs tracking-wider uppercase">Staff Portal</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
