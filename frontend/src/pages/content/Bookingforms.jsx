import React, { useState, useEffect } from 'react'
import { MdCheck, MdArrowBack, MdArrowForward, MdSend, MdClose } from 'react-icons/md'
import { toast } from 'sonner'
import img from '../../assets/img.js'
import { bookingApi } from '../../../services/bookingApi.js'
import { pricingApi } from '../../../services/pricingApi.js'
import { uploadImageToCloudinary, uploadFilesToCloudinary } from '../../utils/cloudinary.js'
import { mergeServicePricing } from '../../utils/servicePricing.js'

// Repair steps
import StepService from '../repairForm/StepService.jsx'
import StepOptions from '../repairForm/StepOptions.jsx'
import StepPhoto from '../repairForm/StepPhoto.jsx'
import StepDetails from '../repairForm/StepDetails.jsx'
import StepPickup from '../repairForm/StepPickup.jsx'
import StepReview from '../repairForm/StepReview.jsx'
import { REPAIR_OPTIONS } from '../repairForm/constants.js'

// Team steps
import TeamStepPlayers from '../teamForm/TeamStepPlayers.jsx'
import TeamStepDesign from '../teamForm/TeamStepDesign.jsx'
import TeamStepContact from '../teamForm/TeamStepContact.jsx'
import TeamStepConfirm from '../teamForm/TeamStepConfirm.jsx'

// Org steps
import OrgStepDetails from '../OrgTeam/OrgStepDetails.jsx'
import OrgStepContact from '../OrgTeam/OrgStepContact.jsx'
import OrgStepConfirm from '../OrgTeam/OrgStepConfirm.jsx'

const REPAIR_LABELS = ['Service', 'Options', 'Photo', 'Details', 'Pickup', 'Confirm']
const TEAM_LABELS = ['Service', 'Team & Players', 'Design', 'Contact', 'Confirm']
const ORG_LABELS = ['Service', 'Details', 'Design', 'Contact', 'Confirm']
const BOOKING_TIME_ZONE = 'Asia/Manila'

const getBookingDateKey = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: BOOKING_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date)

    const getPart = (type) => parts.find((part) => part.type === type)?.value || ''
    return `${getPart('year')}-${getPart('month')}-${getPart('day')}`
}

const getStoredUser = () => {
    try {
        const rawUser = localStorage.getItem('user')
        return rawUser ? JSON.parse(rawUser) : null
    } catch (err) {
        console.error('Error parsing stored user data:', err)
        return null
    }
}

const buildRepairDetailsFromUser = (user) => ({
    name: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    address: user?.address || '',
    street: user?.street || '',
    regionCode: user?.regionCode || '',
    regionName: user?.regionName || '',
    provinceCode: user?.provinceCode || '',
    provinceName: user?.provinceName || '',
    cityCode: user?.cityCode || '',
    cityName: user?.cityName || '',
    brgyCode: user?.brgyCode || '',
    brgyName: user?.brgyName || '',
    city: user?.cityName || '',
})

const buildContactFromUser = (user) => ({
    fullName: user?.fullName || '',
    phone: user?.phoneNumber || '',
    email: user?.email || '',
    facebook: '',
    address: user?.address || '',
    street: user?.street || '',
    regionCode: user?.regionCode || '',
    regionName: user?.regionName || '',
    provinceCode: user?.provinceCode || '',
    provinceName: user?.provinceName || '',
    cityCode: user?.cityCode || '',
    cityName: user?.cityName || '',
    brgyCode: user?.brgyCode || '',
    brgyName: user?.brgyName || '',
    city: user?.cityName || '',
})

const Stepper = ({ currentStep, labels, expanded = false }) => (
    <nav className={`w-full ${expanded ? 'max-w-6xl' : 'max-w-2xl'} mx-auto transition-all duration-300`} aria-label="Progress">
        <div className="hidden sm:flex items-center justify-between">
            {labels.map((label, i) => {
                const num = i + 1
                const active = num === currentStep
                const done = num < currentStep
                return (
                    <React.Fragment key={label}>
                        <div className="flex flex-col items-center">
                            <span
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300
                  ${active
                                        ? 'bg-blue-600 text-white ring-2 ring-blue-500/30'
                                        : done
                                            ? 'bg-blue-600/80 text-white'
                                            : 'bg-gray-100 text-gray-400 ring-1 ring-gray-300'
                                    }`}
                            >
                                {done ? <MdCheck size={14} /> : num}
                            </span>
                            <span className={`text-[9px] mt-1 font-semibold uppercase tracking-wider ${active ? 'text-blue-600' : done ? 'text-blue-500/60' : 'text-gray-400'}`}>
                                {label}
                            </span>
                        </div>
                        {i < labels.length - 1 && (
                            <div className={`flex-1 h-[2px] mx-1 -mt-4 rounded ${done || (active && i < currentStep - 1) ? 'bg-blue-500' : 'bg-gray-300'}`} />
                        )}
                    </React.Fragment>
                )
            })}
        </div>
    </nav>
)

const BookingModal = ({ isOpen, onClose, initialBookingDate = '' }) => {
    const [step, setStep] = useState(1)
    const [service, setService] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [nextError, setNextError] = useState('')
    const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
    const [servicePricing, setServicePricing] = useState(() => mergeServicePricing())
    const [bookingCapacity, setBookingCapacity] = useState(null)
    const [capacityLoading, setCapacityLoading] = useState(false)

    // Repair state
    const [selectedOptions, setSelectedOptions] = useState([])
    const [quantities, setQuantities] = useState({})
    const [repairDescription, setRepairDescription] = useState('')
    const [repairNotes, setRepairNotes] = useState({})
    const [photos, setPhotos] = useState([])
    const [details, setDetails] = useState(() => buildRepairDetailsFromUser(getStoredUser()))
    const [repairBookingDate, setRepairBookingDate] = useState(initialBookingDate || '')
    const [selectedDate, setSelectedDate] = useState(null)
    const [selectedSlot, setSelectedSlot] = useState('')
    const [notes, setNotes] = useState('')

    // Bulk repair state
    const [isBulkMode, setIsBulkMode] = useState(false)
    const [bulkItems, setBulkItems] = useState([])
    const [bulkSharedNotes, setBulkSharedNotes] = useState('')

    // Team state
    const [teamName, setTeamName] = useState('')
    const [players, setPlayers] = useState([])
    const [designFile, setDesignFile] = useState(null)
    const [driveLink, setDriveLink] = useState('')
    const [contact, setContact] = useState(() => buildContactFromUser(getStoredUser()))

    // Org state
    const [orgName, setOrgName] = useState('')
    const [members, setMembers] = useState([])
    const [orgDesignFile, setOrgDesignFile] = useState(null)
    const [orgDriveLink, setOrgDriveLink] = useState('')
    const [orgContact, setOrgContact] = useState(() => buildContactFromUser(getStoredUser()))
    const repairOptions = REPAIR_OPTIONS.map((option) => ({
        ...option,
        price: Number(servicePricing.repair?.repairOptions?.[option.id] ?? option.price),
    }))

    // Rehydrate locked account details whenever the booking modal opens.
    useEffect(() => {
        if (!isOpen) return

        const user = getStoredUser()
        setDetails(buildRepairDetailsFromUser(user))
        setContact(buildContactFromUser(user))
        setOrgContact(buildContactFromUser(user))
        setRepairBookingDate(getBookingDateKey())
        setSelectedDate(null)

        const capacityDate = getBookingDateKey()
        pricingApi.getAllPricing()
            .then((response) => setServicePricing(mergeServicePricing(response.data || response.pricing)))
            .catch((err) => console.error('Error loading service pricing:', err))

        setCapacityLoading(true)
        bookingApi.getAvailableSlots(capacityDate)
            .then((response) => setBookingCapacity(response))
            .catch((err) => {
                console.error('Error loading booking capacity:', err)
                setBookingCapacity(null)
            })
            .finally(() => setCapacityLoading(false))
    }, [isOpen, initialBookingDate])

    // Reset form function
    const resetForm = () => {
        setStep(1)
        setService('')
        setLoading(false)
        setError('')
        setSizeGuideOpen(false)

        // Reset repair state
        setSelectedOptions([])
        setQuantities({})
        setRepairDescription('')
        setRepairNotes({})
        setPhotos([])
        setDetails(buildRepairDetailsFromUser(getStoredUser()))
        setRepairBookingDate('')
        setSelectedDate(null)
        setSelectedSlot('')
        setNotes('')

        // Reset bulk repair state
        setIsBulkMode(false)
        setBulkItems([])
        setBulkSharedNotes('')

        // Reset team state
        setTeamName('')
        setPlayers([])
        setDesignFile(null)
        setDriveLink('')
        setContact(buildContactFromUser(getStoredUser()))

        // Reset org state
        setOrgName('')
        setMembers([])
        setOrgDesignFile(null)
        setOrgDriveLink('')
        setOrgContact(buildContactFromUser(getStoredUser()))
    }

    // Handle modal close
    const handleClose = () => {
        resetForm()
        onClose()
    }

    // Derived
    const isRepair = service === 'repair'
    const isJersey = service === 'jersey'
    const isOrg = service === 'organizational'
    const labels = isJersey ? TEAM_LABELS : isOrg ? ORG_LABELS : REPAIR_LABELS
    const totalSteps = labels.length
    const isRosterEntryStep = (isJersey || isOrg) && step === 2
    const isExpandedEntryStep = isRosterEntryStep && sizeGuideOpen

    const toggleOption = (id) => setSelectedOptions((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
    const setQuantity = (id, qty) => setQuantities((p) => ({ ...p, [id]: qty }))
    const setRepairNote = (id, note) => setRepairNotes((p) => ({ ...p, [id]: note }))
    const setDetail = (k, v) => setDetails((p) => ({ ...p, [k]: v }))

    // Bulk repair helpers
    const addBulkItem = () => {
        const newItem = {
            id: Date.now(),
            name: '',
            selectedOptions: [],
            quantities: {},
            repairDescription: '',
        }
        setBulkItems((p) => [...p, newItem])
    }

    const removeBulkItem = (itemId) => {
        setBulkItems((p) => p.filter((item) => item.id !== itemId))
    }

    const updateBulkItem = (itemId, updates) => {
        setBulkItems((p) =>
            p.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
            )
        )
    }

    const toggleBulkItemOption = (itemId, optionId) => {
        updateBulkItem(itemId, {
            selectedOptions: (bulkItems.find((i) => i.id === itemId)?.selectedOptions || []).includes(optionId)
                ? bulkItems.find((i) => i.id === itemId)?.selectedOptions.filter((x) => x !== optionId)
                : [...(bulkItems.find((i) => i.id === itemId)?.selectedOptions || []), optionId],
        })
    }

    const setBulkItemQuantity = (itemId, optionId, qty) => {
        updateBulkItem(itemId, {
            quantities: { ...(bulkItems.find((i) => i.id === itemId)?.quantities || {}), [optionId]: qty },
        })
    }

    const selectedServiceCapacity = service === 'repair'
        ? bookingCapacity?.repair
        : service
            ? bookingCapacity?.jerseyOrg
            : null
    const isSelectedServiceFull = Boolean(selectedServiceCapacity?.isFull)
    const capacityWarning = bookingCapacity?.capacityWarning || selectedServiceCapacity?.capacityWarning || 'This date has already reached its recommended capacity. Your booking request may be delayed and is subject to approval.'

    const isRepairDetailsComplete = () => {
        return [details.name, details.email, details.phone, details.address].every((field) => field && field.trim().length > 0)
    }

    const canNext = () => {
        if (step === 1) return !!service

        if (isRepair) {
            if (step === 2) {
                if (isBulkMode) {
                    // In bulk mode, need at least one bulk item with repair options
                    return bulkItems.length > 0 && bulkItems.some(item => item.selectedOptions && item.selectedOptions.length > 0)
                } else {
                    // Normal mode, need at least one repair option selected
                    return selectedOptions.length > 0
                }
            }
            if (step === 3) return true // Photo is optional, can skip or add
            if (step === 4) return isRepairDetailsComplete()
            if (step === 5) return !!selectedDate && !!selectedSlot
            return true
        }

        if (isJersey) {
            if (step === 2) return players.length > 0
            if (step === 3) return true // Design is optional, can skip or add
            if (step === 4) return [contact.fullName, contact.phone, contact.email, contact.address].every((field) => field && field.trim().length > 0)
            return true
        }

        if (isOrg) {
            if (step === 2) return members.length > 0
            if (step === 3) return true // Design is optional, can skip or add
            if (step === 4) return [orgContact.fullName, orgContact.phone, orgContact.email, orgContact.address].every((field) => field && field.trim().length > 0)
            return true
        }

        return true
    }

    const getNextErrorMessage = () => {
        if (step === 1) return 'Please select a service before continuing.'
        if (isRepair && step === 2) {
            if (isBulkMode) {
                return 'Please add at least one item with repair options to continue.'
            }
            return 'Please select at least one repair option to continue.'
        }
        if (isRepair && step === 4) return 'Please complete your profile details first before continuing.'
        if (isRepair && step === 5) return 'Please select a pickup date and time slot.'

        if (isJersey && step === 2) return 'Please add at least one player first.'
        if (isJersey && step === 4) return 'Please complete your profile contact details first before continuing.'

        if (isOrg && step === 2) return 'Please add at least one member first.'
        if (isOrg && step === 4) return 'Please complete your profile contact details first before continuing.'

        return 'Please complete the required fields before continuing.'
    }

    const handleNext = () => {
        if (canNext()) {
            setNextError('')
            setSizeGuideOpen(false)
            setStep((s) => s + 1)
            return
        }
        setNextError(getNextErrorMessage())
    }

    const handleSubmit = async () => {
        try {
            setLoading(true)
            setError('')

            // Get token - verify authentication
            const token = localStorage.getItem('token') || sessionStorage.getItem('token')
            if (!token) {
                setError('Authentication failed. Please login again.')
                return
            }

            // Get user from localStorage
            const userStr = localStorage.getItem('user')
            const user = userStr ? JSON.parse(userStr) : null

            if (!user) {
                setError('User not authenticated. Please login first.')
                setLoading(false)
                return
            }

            const uploadedPhotos = isRepair ? await uploadFilesToCloudinary(photos) : []
            const uploadedDesignFile = isJersey ? await uploadImageToCloudinary(designFile) : ''
            const uploadedOrgDesignFile = isOrg ? await uploadImageToCloudinary(orgDesignFile) : ''

            // Build booking object based on service type
            const bookingData = {
                bookingType: isRepair ? 'repair' : isJersey ? 'jersey' : 'organizational',
                service: service,
                notes: notes,
            }

            // Determine which contact object to use
            let contactToUse = contact
            if (isRepair) {
                contactToUse = {
                    fullName: details.name,
                    email: details.email,
                    phone: details.phone,
                    address: details.address,
                    street: details.street,
                    regionCode: details.regionCode,
                    regionName: details.regionName,
                    provinceCode: details.provinceCode,
                    provinceName: details.provinceName,
                    cityCode: details.cityCode,
                    cityName: details.cityName,
                    brgyCode: details.brgyCode,
                    brgyName: details.brgyName,
                    city: details.cityName || details.city,
                }
            } else if (isOrg) {
                contactToUse = orgContact
            }

            // Validate contact info
            if (!contactToUse.fullName || contactToUse.fullName.trim() === '') {
                setError('Full name is required in contact information')
                return
            }

            if (!contactToUse.email && !contactToUse.phone) {
                setError('Please provide either email or phone number')
                return
            }

            if (isRepair) {
                // Repair booking - handle both normal and bulk mode
                let optionsArray = []
                
                if (isBulkMode) {
                    // Bulk repair mode: combine all items into one booking
                    optionsArray = bulkItems.flatMap((bulkItem) => {
                        return (bulkItem.selectedOptions || []).map((optId) => {
                            const repairOption = repairOptions.find((option) => option.id === optId)
                            const quantity = bulkItem.quantities?.[optId] || 1
                            const displayName = bulkItem.name ? `${bulkItem.name} - ${repairOption?.label || optId}` : (repairOption?.label || optId)
                            return {
                                name: displayName,
                                quantity,
                                price: Number(repairOption?.price) || 0,
                                notes: '',
                            }
                        })
                    })
                    bookingData.isBulkRepair = true
                    bookingData.bulkItems = bulkItems
                    bookingData.notes = bulkSharedNotes
                } else {
                    // Normal mode
                    optionsArray = selectedOptions.map(optId => {
                        const repairOption = repairOptions.find(option => option.id === optId)
                        const quantity = quantities[optId] || 1
                        const displayName = optId === 'others'
                            ? (repairDescription.trim() || repairOption?.label || 'Other Repair')
                            : (repairOption?.label || optId)

                        return {
                            name: displayName,
                            quantity,
                            price: Number(repairOption?.price) || 0,
                            notes: (repairNotes[optId] || '').trim(),
                        }
                    })
                    bookingData.repairDescription = repairDescription
                }

                bookingData.selectedOptions = optionsArray
                bookingData.service = optionsArray[0]?.name || service
                bookingData.items = optionsArray.map(option => ({
                    description: option.name,
                    type: 'Repair',
                    qty: option.quantity,
                    unitPrice: option.price,
                    addOn: 'None',
                    addOnPrice: 0,
                    notes: option.notes,
                }))
                bookingData.photos = Array.isArray(uploadedPhotos)
                    ? uploadedPhotos.map((url) => (typeof url === 'string' ? url.trim() : '')).filter(Boolean)
                    : []
                bookingData.contact = contactToUse
                bookingData.pickupDate = selectedDate
                bookingData.pickupSlot = selectedSlot
                bookingData.bookingDateKey = repairBookingDate || getBookingDateKey()
            } else if (isJersey) {
                // Team jersey booking
                bookingData.teamName = teamName
                bookingData.players = players
                bookingData.items = players.map((player, index) => {
                    const baseProductCatalog = {
                        jersey: { label: 'Jersey Only', price: Number(servicePricing.jersey?.jerseyProducts?.jersey ?? 550), needsJerseySize: true, needsShortSize: false },
                        fullset: { label: 'Full Set (Jersey + Shorts)', price: Number(servicePricing.jersey?.jerseyProducts?.fullset ?? 850), needsJerseySize: true, needsShortSize: true },
                        short: { label: 'Short Only', price: Number(servicePricing.jersey?.jerseyProducts?.short ?? 400), needsJerseySize: false, needsShortSize: true },
                    }
                    const addOnCatalog = {
                        warmer: { label: 'Long Sleeve Warmer', price: Number(servicePricing.jersey?.jerseyAddOns?.warmer ?? 750) },
                        hoodie: { label: 'Hoodie T-shirt', price: Number(servicePricing.jersey?.jerseyAddOns?.hoodie ?? 700) },
                    }
                    const baseProduct = baseProductCatalog[player.productType] || baseProductCatalog.jersey
                    const selectedAddOns = (baseProduct.needsJerseySize && Array.isArray(player.addOns) ? player.addOns : [])
                        .map((id) => addOnCatalog[id])
                        .filter(Boolean)
                    const hasPockets = Boolean(player.pockets && baseProduct.needsShortSize)
                    const addOnLabels = selectedAddOns.map((addOn) => `${addOn.label} (+${addOn.price})`)
                    const pocketPrice = Number(servicePricing.jersey?.pocketPrice ?? 100)
                    if (hasPockets) addOnLabels.push(`Pocket Short (+${pocketPrice})`)
                    const addOnPrice = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0) + (hasPockets ? pocketPrice : 0)
                    const playerLabel = [player.nickname, player.firstName, player.surname].filter(Boolean).join(' ').trim() || `Player ${index + 1}`

                    return {
                        description: `${baseProduct.label} (${playerLabel}${player.number ? ` #${player.number}` : ''})`,
                        type: 'Custom',
                        qty: 1,
                        unitPrice: baseProduct.price,
                        size: baseProduct.needsJerseySize ? player.jerseySize : player.shortSize,
                        addOn: addOnLabels.length > 0 ? addOnLabels.join(', ') : 'None',
                        addOnPrice,
                        notes: '',
                    }
                })
                bookingData.designFile = uploadedDesignFile
                bookingData.driveLink = driveLink
                bookingData.contact = contact
                bookingData.bookingDateKey = getBookingDateKey()
            } else if (isOrg) {
                // Organizational booking
                bookingData.orgName = orgName
                bookingData.members = members
                bookingData.orgDesignFile = uploadedOrgDesignFile
                bookingData.orgDriveLink = orgDriveLink
                bookingData.contact = orgContact
                bookingData.bookingDateKey = getBookingDateKey()
            }

            console.log('Submitting booking data:', bookingData)

            // Call API to create booking
            const response = await bookingApi.createBooking(bookingData)

            console.log('Booking response:', response)

            if (response.success || response._id || response.booking) {
                // Show success message
                toast.success('Booking submitted successfully! We will contact you soon.')
                resetForm()
                onClose()
            } else {
                const errorMessage = response.message || 'Failed to create booking'
                setError(errorMessage)
                toast.error(errorMessage)
            }
        } catch (err) {
            console.error('Booking submission error:', err)
            console.error('Error response data:', err.response?.data)
            console.error('Error status:', err.response?.status)

            // Try to extract detailed error message from backend
            let errorMsg = 'Error submitting booking. Please try again.'

            if (err.response?.data?.message) {
                errorMsg = err.response.data.message
            } else if (err.response?.data?.error) {
                errorMsg = err.response.data.error
            } else if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                errorMsg = 'Validation errors: ' + err.response.data.errors.join(', ')
            } else if (err.response?.data?.received) {
                errorMsg = err.response.data.message + ' - Received: ' + JSON.stringify(err.response.data.received)
            } else if (err.message) {
                errorMsg = err.message
            }

            console.error('Final error message to display:', errorMsg)
            setError(errorMsg)
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const goToStep = (s) => setStep(s)

    useEffect(() => {
        if (nextError && canNext()) setNextError('')
    }, [nextError, step, service, players.length, members.length])

    const renderStep = () => {
        if (step === 1) return <StepService service={service} setService={setService} bookingCapacity={bookingCapacity} capacityLoading={capacityLoading} bookingDate={repairBookingDate || initialBookingDate || getBookingDateKey()} />

        if (isRepair) {
            switch (step) {
                case 2: return <StepOptions selectedOptions={selectedOptions} toggleOption={toggleOption} quantities={quantities} setQuantity={setQuantity} repairDescription={repairDescription} setRepairDescription={setRepairDescription} repairNotes={repairNotes} setRepairNote={setRepairNote} notes={notes} setNotes={setNotes} repairOptions={repairOptions} isBulkMode={isBulkMode} setIsBulkMode={setIsBulkMode} bulkItems={bulkItems} addBulkItem={addBulkItem} removeBulkItem={removeBulkItem} updateBulkItem={updateBulkItem} toggleBulkItemOption={toggleBulkItemOption} setBulkItemQuantity={setBulkItemQuantity} bulkSharedNotes={bulkSharedNotes} setBulkSharedNotes={setBulkSharedNotes} />
                case 3: return <StepPhoto photos={photos} setPhotos={setPhotos} skipPhoto={() => setStep(4)} />
                case 4: return <StepDetails details={details} setDetail={setDetail} readOnly />
                case 5: return <StepPickup selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot} />
                case 6: return <StepReview service={service} selectedOptions={selectedOptions} details={details} selectedDate={selectedDate} selectedSlot={selectedSlot} photos={photos} quantities={quantities} repairDescription={repairDescription} repairNotes={repairNotes} notes={notes} repairOptions={repairOptions} isBulkMode={isBulkMode} bulkItems={bulkItems} bulkSharedNotes={bulkSharedNotes} />
                default: return null
            }
        }

        if (isJersey) {
            switch (step) {
                case 2: return <TeamStepPlayers teamName={teamName} setTeamName={setTeamName} players={players} setPlayers={setPlayers} contact={contact} onSizeGuideChange={setSizeGuideOpen} pricing={servicePricing.jersey} />
                case 3: return <TeamStepDesign designFile={designFile} setDesignFile={setDesignFile} driveLink={driveLink} setDriveLink={setDriveLink} />
                case 4: return <TeamStepContact contact={contact} setContact={setContact} readOnly />
                case 5: return <TeamStepConfirm teamName={teamName} players={players} designFile={designFile} driveLink={driveLink} contact={contact} goToStep={goToStep} contactReadOnly pricing={servicePricing.jersey} />
                default: return null
            }
        }

        if (isOrg) {
            switch (step) {
                case 2: return <OrgStepDetails orgName={orgName} setOrgName={setOrgName} members={members} setMembers={setMembers} contact={orgContact} onSizeGuideChange={setSizeGuideOpen} pricing={servicePricing.organizational} />
                case 3: return <TeamStepDesign designFile={orgDesignFile} setDesignFile={setOrgDesignFile} driveLink={orgDriveLink} setDriveLink={setOrgDriveLink} />
                case 4: return <OrgStepContact contact={orgContact} setContact={setOrgContact} readOnly />
                case 5: return <OrgStepConfirm orgName={orgName} members={members} designFile={orgDesignFile} driveLink={orgDriveLink} contact={orgContact} goToStep={goToStep} contactReadOnly pricing={servicePricing.organizational} />
                default: return null
            }
        }

        return null
    }

    const submitLabel = isJersey ? 'Confirm & Submit' : isOrg ? 'Confirm & Submit' : 'Submit Booking'

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden p-2 sm:p-4">
            <div className={`relative w-full ${isExpandedEntryStep ? 'max-w-6xl' : 'max-w-2xl'} max-h-[96vh] flex flex-col transition-all duration-300`}>
                <div className="bg-[#F8FAFC] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full w-full">
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/5 hover:bg-red-100 flex items-center justify-center text-gray-500 hover:text-red-600 transition-all cursor-pointer"
                    >
                        <MdClose size={18} />
                    </button>

                    {/* Header */}
                    <div className="pt-4 pb-2 text-center select-none shrink-0">
                        <img src={img.jjslogo1} alt="JJS" className="h-10 mx-auto" />
                        <p className="text-[9px] uppercase tracking-[0.3em] text-blue-500/60 font-bold mt-1.5">
                            Repair & Custom Jersey Service
                        </p>
                    </div>

                    {/* Stepper */}
                    <div className="px-4 pb-1 shrink-0">
                        <Stepper currentStep={step} labels={labels} expanded={isExpandedEntryStep} />
                    </div>

                    {/* Main scrollable content area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-1">
                        <div className="w-full mx-auto relative h-full flex flex-col">
                            {/* Inner transparent container replacing the white box */}
                            <div className="py-2 flex-grow">
                                {renderStep()}

                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                )}
                                {nextError && (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-sm text-amber-700">{nextError}</p>
                                    </div>
                                )}
                                {step === 1 && isSelectedServiceFull && (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-sm font-semibold text-amber-800">{capacityWarning}</p>
                                    </div>
                                )}

                                <div className="mt-6 pt-4 flex items-center justify-between shrink-0 mb-2">
                                    {step > 1 ? (
                                        <button
                                            onClick={() => setStep((s) => s - 1)}
                                            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer text-sm font-semibold group py-2"
                                        >
                                            <MdArrowBack size={18} className="group-hover:-translate-x-1 transition-transform" /> Back
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleClose}
                                            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer text-sm font-semibold group py-2"
                                        >
                                            <MdArrowBack size={18} className="group-hover:-translate-x-1 transition-transform" /> Cancel
                                        </button>
                                    )}

                                    {step < totalSteps ? (
                                        <button
                                            onClick={handleNext}
                                            disabled={!canNext()}
                                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer shadow-sm
                                            ${canNext()
                                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25'
                                                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300 shadow-none'}`}
                                        >
                                            Next <MdArrowForward size={18} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer shadow-sm
                                            ${loading
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25'}`}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    ...
                                                </>
                                            ) : (
                                                <>
                                                    {submitLabel} <MdSend size={16} />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center py-2 shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">
                            Step {step} of {totalSteps}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BookingModal
