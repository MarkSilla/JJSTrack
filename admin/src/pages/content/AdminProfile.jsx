import { useContext } from 'react'
import {
    BadgeCheck,
    KeyRound,
    Mail,
    Shield,
    UserRound,
} from 'lucide-react'
import { AdminAuthContext } from '../../context/AdminAuthContext'
import { getStoredAdminUser } from '../../utils/adminSession'

const ProfileSection = ({ icon: Icon, title, description, children, withBorder = true }) => (
    <section className={`${withBorder ? 'border-b border-slate-200' : ''}`}>
        <div className="grid gap-6 px-5 py-6 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
            <div>
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        <Icon size={16} />
                    </span>
                    <h2 className="text-sm font-bold text-slate-900">{title}</h2>
                </div>
                {description && (
                    <p className="mt-3 max-w-[22rem] text-xs leading-5 text-slate-500">{description}</p>
                )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {children}
            </div>
        </div>
    </section>
)

const ReadOnlyField = ({ icon: Icon, label, value, className = '' }) => (
    <div className={className}>
        <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
            <Icon size={13} className="text-slate-400" />
            <span>{label}</span>
        </label>
        <div className="min-h-[42px] w-full break-words rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-800 transition-colors hover:border-slate-300">
            {value || 'Not available'}
        </div>
    </div>
)

const SummaryPill = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-blue-200">
            <Icon size={14} />
        </span>
        <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <p className="truncate text-xs font-semibold text-white">{value || 'N/A'}</p>
        </div>
    </div>
)

const getInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return String(name).slice(0, 2).toUpperCase() || 'AD'
}

const formatRole = (role = '') => {
    if (!role) return 'Administrator'
    return String(role)
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

const AdminProfile = () => {
    const { adminUser } = useContext(AdminAuthContext)
    const storedAdminUser = getStoredAdminUser()
    const profile = adminUser || storedAdminUser || {}
    const displayName = profile.fullName || 'System Administrator'

    return (
        <section className="w-full min-h-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            <div className="border-b border-slate-800 bg-[#0F172A] px-5 py-7 text-white md:px-8">
                <div className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem] border border-white/10 bg-slate-900 text-2xl font-bold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                                {getInitials(displayName)}
                            </div>
                            <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                                    <BadgeCheck size={14} />
                                    View Only
                                </div>
                                <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">{displayName}</h1>
                                <p className="mt-2 text-sm text-slate-300">Administrator account information aligned with current portal access.</p>
                            </div>
                        </div>

                        <div className="max-w-md">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Profile Overview</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                This view shows the active administrator identity and access metadata for this session.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <SummaryPill icon={Mail} label="Email" value={profile.email} />
                        <SummaryPill icon={Shield} label="Role" value={formatRole(profile.role)} />
                        <SummaryPill icon={KeyRound} label="Admin ID" value={profile.id || 'admin'} />
                    </div>
                </div>
            </div>

            <ProfileSection
                icon={UserRound}
                title="Account Information"
                description="Administrator details currently associated with this portal session."
            >
                <ReadOnlyField icon={UserRound} label="Full Name" value={displayName} />
                <ReadOnlyField icon={Mail} label="Email Address" value={profile.email} />
                <ReadOnlyField icon={Shield} label="Portal Role" value={formatRole(profile.role)} />
                <ReadOnlyField icon={KeyRound} label="Admin ID" value={profile.id || 'admin'} />
            </ProfileSection>

            <ProfileSection
                icon={Shield}
                title="Access Details"
                description="Read-only access metadata for this account."
                withBorder={false}
            >
                <ReadOnlyField icon={Shield} label="Access Level" value={formatRole(profile.role)} />
                <ReadOnlyField icon={BadgeCheck} label="Profile Mode" value="View Only" />
            </ProfileSection>
        </section>
    )
}

export default AdminProfile
