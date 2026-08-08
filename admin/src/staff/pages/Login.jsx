import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    AuthLoginShell,
    Lock,
    LoginError,
    LoginField,
    LoginSubmitButton,
    Mail,
    PasswordVisibilityButton,
} from '../../components/AuthLoginShell'
import image from '../assets/img'
import { API_BASE_URL } from '../utils/apiBaseUrl'
import { persistStoredStaffUser } from '../utils/staffSession'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})
    const [showHelpNotice, setShowHelpNotice] = useState(false)
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
        setFieldErrors({})

        const normalizedEmail = String(email).replace(/\s+/g, '').trim().toLowerCase()
        const rawPassword = String(password)
        const nextFieldErrors = {}

        if (!normalizedEmail) {
            nextFieldErrors.email = 'Email address is required.'
        }

        if (!rawPassword) {
            nextFieldErrors.password = 'Password is required.'
        }

        if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors)
            setError('Please review the highlighted fields.')
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

            window.dispatchEvent(new Event('staff-auth-changed'))

            navigate('/staff/dashboard')
        } catch (err) {
            setFieldErrors({})
            setError(err.message || 'Unable to login right now.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLoginShell
            portalLabel="Staff Portal"
            portalTitle="Welcome back"
            portalDescription="Sign in to your staff account"
            heroTitle="Quality Matters"
            heroDescription="Easily manage and track repair and tailoring jobs to ensure accurate and timely work."
            heroImage={image.Staffjjs}
            logoSrc={image.JJS}
            onBack={() => navigate('/')}
        >
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error && Object.keys(fieldErrors).length === 0 && <LoginError message={error} />}

                <LoginField
                    id="staff-email"
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
                    id="staff-password"
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

                <div className="flex items-center justify-between pt-0.5">
                    <label htmlFor="staff-remember" className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 select-none">
                        <input
                            id="staff-remember"
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed accent-blue-600 cursor-pointer"
                            defaultChecked
                            disabled={loading}
                        />
                        <span>Remember this email</span>
                    </label>

                    <button
                        type="button"
                        onClick={() => setShowHelpNotice((prev) => !prev)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus-visible:underline"
                    >
                        Forgot password?
                    </button>
                </div>

                {showHelpNotice && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50/90 p-2 text-xs text-blue-950 leading-tight font-inter animate-in fade-in duration-200">
                        <p className="font-semibold text-blue-900">Need access or reset?</p>
                        <p className="mt-0.5 text-blue-800/90 text-[11px]">Please contact an administrator to update your credentials.</p>
                    </div>
                )}

                <LoginSubmitButton loading={loading}>Sign In</LoginSubmitButton>
            </form>
        </AuthLoginShell>
    )
}

export default Login
