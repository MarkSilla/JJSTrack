import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    AuthLoginShell,
    Lock,
    LoginError,
    LoginField,
    LoginSubmitButton,
    Mail,
    PasswordVisibilityButton,
} from '../components/AuthLoginShell'
import image from '../assets/img'
import { API_BASE_URL } from '../utils/apiBaseUrl'
import { persistStoredAdminUser } from '../utils/adminSession'
import { AdminAuthContext } from '../context/AdminAuthContext'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const navigate = useNavigate()
    const { refreshAdminSession } = useContext(AdminAuthContext)

    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberAdminEmail')
        if (rememberedEmail) {
            setEmail(rememberedEmail)
            setRememberMe(true)
        }
    }, [])

    const validateForm = () => {
        const nextFieldErrors = {}
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (!email) {
            nextFieldErrors.email = 'Email address is required.'
        } else if (!emailRegex.test(email)) {
            nextFieldErrors.email = 'Enter a valid email address.'
        }

        if (!password) {
            nextFieldErrors.password = 'Password is required.'
        } else if (password.length < 6) {
            nextFieldErrors.password = 'Password must be at least 6 characters.'
        }

        setFieldErrors(nextFieldErrors)
        if (Object.keys(nextFieldErrors).length > 0) {
            setError('Please review the highlighted fields.')
            return false
        }

        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setFieldErrors({})

        if (!validateForm()) {
            return
        }

        setLoading(true)

        try {
            const response = await fetch(`${API_BASE_URL}/users/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Login failed')
            }

            if (data.success) {
                localStorage.setItem('adminToken', data.token)
                if (data.admin) {
                    persistStoredAdminUser(data.admin)
                }
                if (rememberMe) {
                    localStorage.setItem('rememberAdminEmail', email)
                } else {
                    localStorage.removeItem('rememberAdminEmail')
                }

                await refreshAdminSession(data.token, {
                    showLoader: false,
                    throwOnError: true,
                })
            }
        } catch (err) {
            setFieldErrors({})
            setError(err.message || 'An error occurred during login')
            console.error('Login error:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLoginShell
            portalLabel="Admin Portal"
            portalTitle="Welcome back"
            portalDescription="Sign in to your admin account"
            heroTitle="Where every stitch tells a story."
            heroDescription="All-in-one web application. Track orders, manage clients, and grow your business with precision and style."
            heroImage={image.bgjjs}
            logoSrc={image.JJS}
            onBack={() => navigate('/')}
        >
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error && Object.keys(fieldErrors).length === 0 && <LoginError message={error} />}

                <LoginField
                    id="admin-email"
                    label=""
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={loading}
                    autoComplete="email"
                    error={fieldErrors.email}
                    icon={Mail}
                />

                <LoginField
                    id="admin-password"
                    label=""
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                    error={fieldErrors.password}
                    icon={Lock}
                    rightControl={
                        <PasswordVisibilityButton
                            shown={showPassword}
                            onClick={() => setShowPassword((current) => !current)}
                            disabled={loading}
                        />
                    }
                />

                <div className="flex items-center justify-between pt-1">
                    <label htmlFor="admin-remember" className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-slate-700 select-none">
                        <input
                            id="admin-remember"
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed accent-blue-600 cursor-pointer"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            disabled={loading}
                        />
                        <span>Remember this email</span>
                    </label>
                </div>

                <LoginSubmitButton loading={loading}>Sign In</LoginSubmitButton>
            </form>
        </AuthLoginShell>
    )
}

export default Login
