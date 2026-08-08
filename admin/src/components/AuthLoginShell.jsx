import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, AlertCircle, ShieldCheck, Target, Layers } from 'lucide-react'
import { PrivacyContent } from '../pages/PrivacyPolicy'
import { TermsContent } from '../pages/TermsOfUse'
import { LegalModal } from './LegalModal'

export function AuthLoginShell({
    portalLabel,
    portalTitle = 'Welcome back',
    portalDescription = 'Sign in to your account',
    heroTitle = 'Where every stitch tells a story.',
    heroDescription = 'All-in-one web application. Track orders, manage clients, and grow your business with precision and style.',
    heroImage,
    logoSrc,
    onBack,
    children,
}) {
    const roleName = portalLabel?.replace(' Portal', '') || 'Portal'
    const [modalState, setModalState] = useState({ open: false, title: '', component: null })

    const openLegalModal = (title, component) => {
        setModalState({ open: true, title, component })
    }

    const closeLegalModal = () => {
        setModalState({ open: false, title: '', component: null })
    }

    return (
        <main className="min-h-screen h-screen w-full bg-slate-50 font-inter text-slate-900 antialiased selection:bg-blue-600 selection:text-white overflow-hidden">
            <div className="grid min-h-screen h-screen w-full md:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)] lg:grid-cols-[minmax(0,0.9fr)_minmax(460px,1.1fr)] overflow-hidden">
                <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-8 text-white md:flex lg:p-12 border-r border-slate-800">
                    {heroImage && (
                        <img
                            src={heroImage}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 h-full w-full object-cover opacity-20 filter contrast-125 pointer-events-none"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-blue-600/30 pointer-events-none" aria-hidden="true" />
                    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl pointer-events-none" aria-hidden="true" />

                    <div className="relative z-10 max-w-md my-auto py-12">
                        <div className="flex items-center gap-1.5 mb-6">
                            <div className="h-1 w-8 rounded-full bg-white" />
                            <div className="h-1 w-8 rounded-full bg-slate-700" />
                        </div>

                        <h1 className="font-playfair text-balance text-2xl font-bold tracking-tight text-white lg:text-4xl leading-snug">
                            {heroTitle}
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-slate-300">
                            {heroDescription}
                        </p>

                        <div className="mt-8 flex items-center gap-6">
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800/90 border border-slate-700/80 text-white shadow-sm">
                                    <Target size={20} strokeWidth={2} />
                                </div>
                                <span className="text-xs font-semibold text-slate-200 tracking-wide">Precision</span>
                            </div>

                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800/90 border border-slate-700/80 text-white shadow-sm">
                                    <Layers size={20} strokeWidth={2} />
                                </div>
                                <span className="text-xs font-semibold text-slate-200 tracking-wide">Efficiency</span>
                            </div>

                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800/90 border border-slate-700/80 text-white shadow-sm">
                                    <ShieldCheck size={20} strokeWidth={2} />
                                </div>
                                <span className="text-xs font-semibold text-slate-200 tracking-wide">Reliability</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-medium border-t border-slate-800 pt-6">
                        <span>© 2026 JJSTrack Inc. All rights reserved.</span>
                    </div>
                </aside>

                <section className="relative flex h-screen max-h-screen flex-col bg-slate-900 md:bg-white overflow-hidden justify-between">
                    <div className="relative z-10 flex items-center justify-between w-full px-5 py-3 md:px-8 md:py-4 bg-slate-900 md:bg-transparent shrink-0">
                        <div>
                            {onBack && (
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-slate-700 md:border-blue-200/80 bg-slate-800 md:bg-white px-3.5 py-1 text-xs font-semibold text-slate-200 md:text-blue-600 shadow-sm transition-all hover:bg-slate-700 md:hover:bg-blue-50 md:hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-[0.98]"
                                >
                                    <ArrowLeft size={13} aria-hidden="true" />
                                    <span>Access Portal</span>
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-sm font-bold text-white md:text-slate-800">
                                {roleName}
                            </span>
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 w-full bg-white rounded-t-[32px] sm:rounded-t-[40px] md:rounded-none px-4 sm:px-6 md:px-10 lg:px-12 py-3 sm:py-4 flex flex-col justify-center shadow-[0_-12px_32px_rgba(15,23,42,0.25)] md:shadow-none backdrop-blur-md overflow-hidden">
                        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none hidden md:block" aria-hidden="true">
                            <svg
                                className="absolute right-0 top-0 h-full w-full text-slate-400 opacity-90"
                                fill="none"
                                viewBox="0 0 800 800"
                                preserveAspectRatio="xMaxYMin slice"
                            >
                                <defs>
                                    <filter id="deskMinimalLineShadow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.20" />
                                    </filter>
                                </defs>

                                <g stroke="currentColor" fill="none" filter="url(#deskMinimalLineShadow)">
                                    <polygon points="560,60 740,240 560,420 380,240" strokeWidth="1" opacity="0.45" />
                                    <polygon points="680,260 860,440 680,620 500,440" strokeWidth="0.85" opacity="0.35" />
                                    <line x1="240" y1="0" x2="800" y2="560" strokeWidth="1.25" opacity="0.50" />
                                    <line x1="420" y1="0" x2="800" y2="380" strokeWidth="0.85" opacity="0.40" />
                                    <line x1="560" y1="240" x2="380" y2="420" strokeWidth="0.85" opacity="0.35" />
                                </g>
                            </svg>
                        </div>

                        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none md:hidden" aria-hidden="true">
                            <svg
                                className="absolute right-0 top-0 h-full w-full opacity-90 text-slate-400"
                                fill="none"
                                viewBox="0 0 400 800"
                                preserveAspectRatio="xMaxYMin slice"
                            >
                                <defs>
                                    <filter id="mobMinimalLineShadow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.16" />
                                    </filter>
                                </defs>

                                <g stroke="currentColor" fill="none" filter="url(#mobMinimalLineShadow)">
                                    <polygon points="280,60 400,180 280,300 160,180" strokeWidth="0.85" opacity="0.25" />
                                    <line x1="160" y1="0" x2="400" y2="300" strokeWidth="1" opacity="0.35" />
                                </g>
                            </svg>
                        </div>

                        <div className="relative z-10 w-full max-w-[340px] sm:max-w-[360px] mx-auto my-auto py-1 sm:py-2">
                            <div className="relative z-10 text-center mb-3 sm:mb-4">
                                <div className="flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                                    <img
                                        src={logoSrc}
                                        alt="JJSTrack"
                                        className="h-12 sm:h-14 w-auto object-contain drop-shadow-md"
                                    />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                                    {portalTitle}
                                </h2>
                                <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                                    {portalDescription}
                                </p>
                            </div>

                            <div>
                                {children}
                            </div>

                            <div className="mt-4 sm:mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                                <button
                                    type="button"
                                    onClick={() => openLegalModal('Privacy Policy', PrivacyContent)}
                                    className="hover:text-slate-900 hover:underline transition-colors focus:outline-none cursor-pointer"
                                >
                                    Privacy Policy
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                    type="button"
                                    onClick={() => openLegalModal('Terms of Use', TermsContent)}
                                    className="hover:text-slate-900 hover:underline transition-colors focus:outline-none cursor-pointer"
                                >
                                    Terms of Use
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <LegalModal
                isOpen={modalState.open}
                onClose={closeLegalModal}
                title={modalState.title}
                ContentComponent={modalState.component}
            />
        </main>
    )
}

export function LoginField({
    id,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    disabled,
    autoComplete,
    error,
    icon: Icon = Mail,
    rightControl,
}) {
    const errorId = error ? `${id}-error` : undefined

    return (
        <div className="space-y-1.5 font-inter">
            {label && (
                <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
                    {label}
                </label>
            )}
            <div className="relative group">
                <Icon
                    size={17}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-150"
                />
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    aria-invalid={Boolean(error)}
                    aria-describedby={errorId}
                    className={`h-11 sm:h-12 w-full rounded-xl border bg-white pl-10 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs transition-all duration-150 hover:border-slate-300 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${error
                        ? 'border-red-300 focus:border-red-600 focus:ring-red-600'
                        : 'border-slate-200'
                        }`}
                />
                {rightControl}
            </div>
            {error && (
                <p id={errorId} className="mt-1 text-xs font-medium text-red-600 flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0 text-red-600" aria-hidden="true" />
                    <span>{error}</span>
                </p>
            )}
        </div>
    )
}

export function LoginVisibilityButton({ shown, onClick, disabled }) {
    const label = shown ? 'Hide password' : 'Show password'

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {shown ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
    )
}

export const PasswordVisibilityButton = LoginVisibilityButton

export function LoginError({ message }) {
    if (!message) return null

    return (
        <div className="rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-red-900 flex items-start gap-2.5 shadow-2xs" role="alert">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
            <div className="leading-snug">{message}</div>
        </div>
    )
}

export function LoginSubmitButton({ loading, loadingLabel = 'Signing in...', children }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-150 hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {loading ? (
                <>
                    <Loader2 size={16} aria-hidden="true" className="animate-spin" />
                    <span>{loadingLabel}</span>
                </>
            ) : (
                children
            )}
        </button>
    )
}

export { Lock, Mail }
