import { useContext } from 'react'
import {
    BadgeCheck,
    BriefcaseBusiness,
    CalendarDays,
    ContactRound,
    IdCard,
    Mail,
    MapPinned,
    Phone,
    Shield,
    UserRound,
} from 'lucide-react'
import { StaffAuthContext } from '../context/StaffAuthContext'
import { getStoredStaffUser } from '../utils/staffSession'

const ProfileSection = ({ icon: Icon, title, description, children, withBorder = true }) => (
    <section className={`${withBorder ? 'border-b border-slate-200' : ''}`}>
        <div className="grid gap-6 px-5 py-6 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
            <div>
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
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

const ReadOnlyField = ({ icon: Icon, label, value, className = '', multiline = false }) => (
    <div className={className}>
        <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
            <Icon size={13} className="text-slate-400" />
            <span>{label}</span>
        </label>
        <div
            className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-800 transition-colors hover:border-slate-300 ${multiline ? 'min-h-[72px] whitespace-pre-wrap break-words' : 'min-h-[42px] break-words'}`}
        >
            {value || 'Not provided'}
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
    return String(name).slice(0, 2).toUpperCase() || 'ST'
}

const formatLabel = (value = '', fallback = 'Not assigned') => {
    if (!String(value).trim()) return fallback

    return String(value)
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

const formatDateValue = (value) => {
    if (!value) return ''

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    return date.toISOString().split('T')[0]
}

const StaffProfilePage = () => {
    const { staffUser } = useContext(StaffAuthContext)
    const profile = staffUser || getStoredStaffUser() || {}
    const displayName =
        profile.fullName ||
        [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
        'Staff User'

    const addressValue = [
        profile.street,
        profile.brgyName,
        profile.cityName,
        profile.provinceName,
        profile.regionName,
    ].filter(Boolean).join(', ')

    return (
        <section className="w-full min-h-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            <div className="border-b border-slate-800 bg-[#0F172A] px-5 py-7 text-white md:px-8">
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
                                <p className="mt-2 text-sm text-slate-300">Staff account profile based on the information configured by admin.</p>
                            </div>
                        </div>

                        <div className="max-w-md">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Profile Overview</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                This page shows your registered identity, employment details, and contact information in read-only mode.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <SummaryPill icon={IdCard} label="Employee ID" value={profile.employeeId} />
                        <SummaryPill icon={BriefcaseBusiness} label="Position" value={formatLabel(profile.position)} />
                        <SummaryPill icon={Shield} label="Status" value={formatLabel(profile.accountStatus, 'Active')} />
                        <SummaryPill icon={Mail} label="Email" value={profile.email} />
                    </div>
                </div>
            </div>

            <ProfileSection
                icon={UserRound}
                title="Personal Information"
                description="Basic identity details saved when this staff account was created."
            >
                <ReadOnlyField icon={UserRound} label="First Name" value={profile.firstName} />
                <ReadOnlyField icon={UserRound} label="Last Name" value={profile.lastName} />
                <ReadOnlyField icon={IdCard} label="Employee ID" value={profile.employeeId} />
                <ReadOnlyField icon={CalendarDays} label="Date of Birth" value={formatDateValue(profile.dob)} />
                <ReadOnlyField icon={BadgeCheck} label="Gender" value={profile.gender} />
                <ReadOnlyField icon={UserRound} label="Full Name" value={displayName} />
            </ProfileSection>

            <ProfileSection
                icon={MapPinned}
                title="Address"
                description="Location details entered by admin during staff account setup."
            >
                <ReadOnlyField icon={MapPinned} label="Region" value={profile.regionName} />
                <ReadOnlyField icon={MapPinned} label="Province" value={profile.provinceName} />
                <ReadOnlyField icon={MapPinned} label="City / Municipality" value={profile.cityName} />
                <ReadOnlyField icon={MapPinned} label="Barangay" value={profile.brgyName} />
                <ReadOnlyField
                    icon={MapPinned}
                    label="Street / House No. / Building"
                    value={profile.street}
                    className="md:col-span-2"
                    multiline
                />
                <ReadOnlyField
                    icon={MapPinned}
                    label="Full Address"
                    value={profile.address || addressValue}
                    className="md:col-span-2"
                    multiline
                />
            </ProfileSection>

            <ProfileSection
                icon={Mail}
                title="Contact & Account"
                description="Contact channels and account-level details for this staff user."
            >
                <ReadOnlyField icon={Mail} label="Email Address" value={profile.email} />
                <ReadOnlyField icon={Phone} label="Contact Number" value={profile.phoneNumber} />
                <ReadOnlyField icon={Shield} label="Portal Role" value={formatLabel(profile.role, 'Staff')} />
                <ReadOnlyField icon={BadgeCheck} label="Account Status" value={formatLabel(profile.accountStatus, 'Active')} />
            </ProfileSection>

            <ProfileSection
                icon={BriefcaseBusiness}
                title="Employment Details"
                description="Work assignment and system access settings from the admin record."
            >
                <ReadOnlyField icon={BriefcaseBusiness} label="Employee Type" value={profile.employmentType} />
                <ReadOnlyField icon={BriefcaseBusiness} label="Role" value={formatLabel(profile.position)} />
                <ReadOnlyField icon={CalendarDays} label="Date Hired" value={formatDateValue(profile.hiredDate)} />
                <ReadOnlyField icon={Shield} label="Status" value={formatLabel(profile.accountStatus, 'Active')} />
                <ReadOnlyField icon={Shield} label="System Role" value={formatLabel(profile.systemRole)} className="md:col-span-2" />
            </ProfileSection>

            <ProfileSection
                icon={ContactRound}
                title="Emergency Contact"
                description="Emergency contact information saved by admin during account creation."
            >
                <ReadOnlyField icon={UserRound} label="Contact Name" value={profile.emergencyContact?.name} />
                <ReadOnlyField icon={ContactRound} label="Relationship" value={profile.emergencyContact?.relationship} />
                <ReadOnlyField
                    icon={Phone}
                    label="Contact Number"
                    value={profile.emergencyContact?.contact}
                    className="md:col-span-2"
                />
            </ProfileSection>

            <ProfileSection
                icon={CalendarDays}
                title="Account Activity"
                description="Read-only account timestamps currently available in session data."
                withBorder={false}
            >
                <ReadOnlyField icon={CalendarDays} label="Created At" value={formatDateValue(profile.createdAt)} />
                <ReadOnlyField icon={CalendarDays} label="Last Login" value={formatDateValue(profile.lastLoginAt)} />
            </ProfileSection>
        </section>
    )
}

export default StaffProfilePage
