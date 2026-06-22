const normalizeValue = (value) => {
    if (!value) return ''

    if (typeof value === 'string') {
        return value.trim()
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value).trim()
    }

    if (typeof value === 'object') {
        return normalizeValue(
            value.displayName ||
            value.name ||
            value.fullName ||
            value.teamName ||
            value.orgName ||
            value.organizationName
        )
    }

    return value?.toString?.().trim() || ''
}

const extractSuffixAfterDash = (value = '') => {
    const match = String(value || '').match(/^[^-]+-\s*(.+)$/)
    return normalizeValue(match?.[1] || '')
}

const getRelatedEntries = (entry = {}) => [
    entry,
    entry?.bookingId,
    entry?.booking,
    entry?.originalBooking,
    entry?.appointment,
    entry?.appointmentId,
    entry?.orderId,
    entry?.details,
    entry?.formData,
    entry?.bookingDetails,
    entry?.orderDetails,
    entry?.metadata,
].filter((source) => source && typeof source === 'object')

const getPathValue = (source, path) =>
    path.split('.').reduce((current, key) => current?.[key], source)

const getFirstFieldValue = (entry, paths) => {
    for (const source of getRelatedEntries(entry)) {
        for (const path of paths) {
            const value = normalizeValue(getPathValue(source, path))
            if (value) return value
        }
    }

    return ''
}

const normalizeLabel = (value) =>
    normalizeValue(value)
        .toLowerCase()
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

const TEAM_NAME_PATHS = [
    'teamName',
    'team',
    'team_name',
    'team_name_text',
    'team_name_value',
    'team_name_label',
    'teamTitle',
    'team_title',
    'clubTeam',
    'club_team',
    'jerseyTeamName',
    'jerseyTeam',
    'jersey.teamName',
    'jersey.team',
    'jerseyDetails.teamName',
    'jerseyDetails.team',
    'customJersey.teamName',
    'customJersey.team',
    'customJerseyDetails.teamName',
    'customJerseyDetails.team',
    'teamDetails.name',
    'teamDetails.teamName',
    'teamInfo.name',
    'teamInfo.teamName',
    'uniformDetails.teamName',
    'details.teamName',
    'details.team',
    'details.team_name',
    'bookingDetails.teamName',
    'bookingDetails.team',
    'orderDetails.teamName',
    'orderDetails.team',
    'formData.teamName',
    'formData.team',
    'metadata.teamName',
    'metadata.team',
    'customization.teamName',
]

const ORGANIZATION_NAME_PATHS = [
    'orgName',
    'organizationName',
    'organization',
    'organization_name',
    'org_name',
    'org',
    'orgTitle',
    'org_title',
    'organizationalName',
    'groupName',
    'group',
    'clubName',
    'club',
    'schoolName',
    'school',
    'companyName',
    'company',
    'departmentName',
    'department',
    'jersey.organizationName',
    'jersey.organization',
    'customJersey.organizationName',
    'customJersey.organization',
    'customJerseyDetails.organizationName',
    'customJerseyDetails.organization',
    'organizationDetails.name',
    'organizationDetails.orgName',
    'organizationDetails.organizationName',
    'organizationInfo.name',
    'organizationInfo.orgName',
    'organizationInfo.organizationName',
    'organizationalDetails.name',
    'organizationalDetails.orgName',
    'organizationalDetails.organizationName',
    'uniformDetails.organizationName',
    'uniformDetails.orgName',
    'details.orgName',
    'details.organizationName',
    'details.organization',
    'details.organization_name',
    'details.org_name',
    'bookingDetails.orgName',
    'bookingDetails.organizationName',
    'bookingDetails.organization',
    'orderDetails.orgName',
    'orderDetails.organizationName',
    'orderDetails.organization',
    'formData.orgName',
    'formData.organizationName',
    'formData.organization',
    'metadata.orgName',
    'metadata.organizationName',
    'metadata.organization',
]

const TYPE_PATHS = ['bookingType', 'serviceType', 'type']

const isTeamJerseyLabel = (value) => {
    const label = normalizeLabel(value)
    return label === 'jersey' ||
        label === 'team jersey' ||
        label === 'team jerseys' ||
        label === 'jersey order' ||
        label === 'jersey orders' ||
        label === 'team jersey order' ||
        label === 'team jersey orders' ||
        label === 'custom jersey' ||
        label === 'custom jerseys' ||
        label === 'custom jersey order' ||
        label === 'custom jersey orders' ||
        label.startsWith('team jersey ') ||
        label.startsWith('custom jersey ') ||
        (label.includes('team') && label.includes('jersey'))
}

const isOrganizationLabel = (value) => {
    const label = normalizeLabel(value)
    return label === 'organization' ||
        label === 'organizational' ||
        label === 'organization order' ||
        label === 'organizational order' ||
        label === 'organization jersey' ||
        label === 'organizational jersey' ||
        label === 'organization jerseys' ||
        label === 'organizational jerseys' ||
        label === 'organization jersey order' ||
        label === 'organizational jersey order' ||
        label.startsWith('organizational ') ||
        label.startsWith('organization ') ||
        (label.includes('org') && label.includes('jersey')) ||
        (label.includes('organization') && label.includes('jersey'))
}

const getRepairDisplayLabel = (entry = {}) =>
    normalizeValue(entry?.selectedOptions?.[0]?.name) ||
    normalizeValue(entry?.service) ||
    normalizeValue(entry?.repairDescription) ||
    normalizeValue(entry?.item) ||
    'Repair'

export const getTrackingDisplayName = (entry = {}) => {
    const bookingType = normalizeLabel(getFirstFieldValue(entry, ['bookingType']))
    const serviceType = normalizeLabel(getFirstFieldValue(entry, ['serviceType']))
    const teamName = getFirstFieldValue(entry, TEAM_NAME_PATHS)
    const organizationName = getFirstFieldValue(entry, ORGANIZATION_NAME_PATHS)
    const service = getFirstFieldValue(entry, ['service'])
    const item = getFirstFieldValue(entry, ['item'])
    const itemName = getFirstFieldValue(entry, ['itemName'])
    const typeLabel = getFirstFieldValue(entry, TYPE_PATHS)

    if (bookingType === 'jersey' || bookingType === 'team jersey' || serviceType === 'team jersey' || isTeamJerseyLabel(typeLabel)) {
        return (
            teamName ||
            extractSuffixAfterDash(item) ||
            extractSuffixAfterDash(itemName) ||
            extractSuffixAfterDash(service) ||
            (!isTeamJerseyLabel(service) ? service : '') ||
            (!isTeamJerseyLabel(item) ? item : '') ||
            itemName ||
            'Team Jersey'
        )
    }

    if (bookingType === 'organizational' || bookingType === 'organization' || isOrganizationLabel(typeLabel)) {
        return (
            organizationName ||
            extractSuffixAfterDash(item) ||
            extractSuffixAfterDash(itemName) ||
            extractSuffixAfterDash(service) ||
            (!isOrganizationLabel(service) ? service : '') ||
            (!isOrganizationLabel(item) ? item : '') ||
            itemName ||
            'Organization'
        )
    }

    if (bookingType === 'repair') {
        return getRepairDisplayLabel(entry)
    }

    if (serviceType === 'team jersey' || item.toLowerCase().startsWith('team jersey -')) {
        return teamName || extractSuffixAfterDash(item) || extractSuffixAfterDash(itemName) || extractSuffixAfterDash(service) || item || 'Team Jersey'
    }

    if (item.toLowerCase().startsWith('organizational -')) {
        return organizationName || extractSuffixAfterDash(item) || extractSuffixAfterDash(itemName) || extractSuffixAfterDash(service) || item || 'Organization'
    }

    if (teamName && (isTeamJerseyLabel(item) || isTeamJerseyLabel(service) || isTeamJerseyLabel(itemName))) {
        return teamName
    }

    if (organizationName && (isOrganizationLabel(item) || isOrganizationLabel(service) || isOrganizationLabel(itemName))) {
        return organizationName
    }

    return (
        item ||
        service ||
        itemName ||
        organizationName ||
        teamName ||
        'Booking'
    )
}
