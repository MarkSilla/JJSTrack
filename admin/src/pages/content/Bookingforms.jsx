import React, { useState, useEffect } from 'react'
import { MdCheck, MdArrowBack, MdArrowForward, MdSend, MdClose } from 'react-icons/md'
import img from '../../assets/img.js'

// Repair steps
import StepService from '../repairForm/StepService.jsx'
import StepOptions from '../repairForm/StepOptions.jsx'
import StepPhoto from '../repairForm/StepPhoto.jsx'
import StepDetails from '../repairForm/StepDetails.jsx'
import StepPickup from '../repairForm/StepPickup.jsx'
import StepReview from '../repairForm/StepReview.jsx'

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

// Stepper
const Stepper = ({ currentStep, labels }) => (
    <nav className="w-full max-w-2xl mx-auto" aria-label="Progress">
        <ol className="hidden sm:flex items-center">
            {labels.map((label, i) => {
                const num = i + 1
                const active = num === currentStep
                const done = num < currentStep
                return (
                    <li key={label} className="flex-1 flex items-center">
                        <div className="flex flex-col items-center w-full relative">
                            {i > 0 && (
                                <span
                                    className={`absolute top-4 right-1/2 w-full h-[2px] -translate-y-1/2 transition-colors duration-500
                    ${done ? 'bg-blue-500' : active ? 'bg-gradient-to-r from-blue-500 to-gray-300' : 'bg-gray-300'}`}
                                />
                            )}
                            <span
                                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold tracking-wide transition-all duration-300
                  ${active
                                        ? 'bg-blue-600 text-white ring-[3px] ring-blue-500/30 shadow-lg shadow-blue-600/25'
                                        : done
                                            ? 'bg-blue-600/90 text-white'
                                            : 'bg-gray-100 text-gray-400 ring-1 ring-gray-300'
                                    }`}
                            >
                                {done ? <MdCheck size={18} /> : num}
                            </span>
                            <span
                                className={`mt-2 text-[8px] font-semibold uppercase tracking-widest transition-colors
                  ${active ? 'text-blue-600' : done ? 'text-blue-500/70' : 'text-gray-400'}`}
                            >
                                {label}
                            </span>
                        </div>
                    </li>
                )
            })}
        </ol>

        {/* Mobile */}
        <div className="sm:hidden flex items-center justify-between px-2">
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

const BookingModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1)
    const [service, setService] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [nextError, setNextError] = useState('')

    // Repair state
    const [selectedOptions, setSelectedOptions] = useState([])
    const [quantities, setQuantities] = useState({})
    const [repairDescription, setRepairDescription] = useState('')
    const [photos, setPhotos] = useState([])
    const [details, setDetails] = useState({ name: '', email: '', phone: '', address: '', city: '' })
    const [selectedDate, setSelectedDate] = useState(null)
    const [selectedSlot, setSelectedSlot] = useState('')

    // Team state
    const [teamName, setTeamName] = useState('')
    const [players, setPlayers] = useState([])
    const [designFile, setDesignFile] = useState(null)
    const [driveLink, setDriveLink] = useState('')
    const [contact, setContact] = useState({ fullName: '', phone: '', email: '', facebook: '', address: '' })

    // Org state
    const [orgName, setOrgName] = useState('')
    const [members, setMembers] = useState([])
    const [orgDesignFile, setOrgDesignFile] = useState(null)
    const [orgDriveLink, setOrgDriveLink] = useState('')
    const [orgContact, setOrgContact] = useState({ fullName: '', phone: '', email: '', facebook: '', address: '' })

    // Initialize contact data from user on component mount
    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            try {
                const user = JSON.parse(userStr)
                // Auto-fill repair form details
                if (user.fullName || user.phoneNumber || user.email || user.address) {
                    setDetails({
                        name: user.fullName || '',
                        email: user.email || '',
                        phone: user.phoneNumber || '',
                        address: user.address || '',
                        city: ''
                    })
                }
                // Auto-fill team contact
                if (user.fullName || user.phoneNumber || user.email) {
                    setContact({
                        fullName: user.fullName || '',
                        phone: user.phoneNumber || '',
                        email: user.email || '',
                        facebook: '',
                        address: user.address || ''
                    })
                }
                // Auto-fill org contact
                if (user.fullName || user.phoneNumber || user.email) {
                    setOrgContact({
                        fullName: user.fullName || '',
                        phone: user.phoneNumber || '',
                        email: user.email || '',
                        facebook: '',
                        address: user.address || ''
                    })
                }
            } catch (err) {
                console.error('Error parsing user data:', err)
            }
        }
    }, [])

    // Reset form function
    const resetForm = () => {
        setStep(1)
        setService('')
        setLoading(false)
        setError('')

        // Reset repair state
        setSelectedOptions([])
        setQuantities({})
        setRepairDescription('')
        setPhotos([])
        setDetails({ name: '', email: '', phone: '', address: '', city: '' })
        setSelectedDate(null)
        setSelectedSlot('')

        // Reset team state
        setTeamName('')
        setPlayers([])
        setDesignFile(null)
        setDriveLink('')
        setContact({ fullName: '', phone: '', email: '', facebook: '', address: '' })

        // Reset org state
        setOrgName('')
        setMembers([])
        setOrgDesignFile(null)
        setOrgDriveLink('')
        setOrgContact({ fullName: '', phone: '', email: '', facebook: '', address: '' })
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

    const toggleOption = (id) => setSelectedOptions((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
    const setQuantity = (id, qty) => setQuantities((p) => ({ ...p, [id]: qty }))
    const setDetail = (k, v) => setDetails((p) => ({ ...p, [k]: v }))

    const canNext = () => {
        if (step === 1) return !!service
        if (isJersey && step === 2) return players.length > 0
        if (isOrg && step === 2) return members.length > 0
        return true
    }

    const getNextErrorMessage = () => {
        if (step === 1) return 'Please select a service before continuing.'
        if (isJersey && step === 2) return 'Please add at least one player first.'
        if (isOrg && step === 2) return 'Please add at least one member first.'
        return 'Please complete the required fields before continuing.'
    }

    const handleNext = () => {
        if (canNext()) {
            setNextError('')
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
                return
            }

            // Build booking object based on service type
            const bookingData = {
                bookingType: isRepair ? 'repair' : isJersey ? 'jersey' : 'organizational',
                service: service,
            }

            // Determine which contact object to use
            let contactToUse = contact
            if (isRepair) {
                contactToUse = {
                    fullName: details.name,
                    email: details.email,
                    phone: details.phone,
                    address: details.address,
                    city: details.city,
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
                // Repair booking
                const optionsArray = selectedOptions.map(optId => ({
                    name: optId,
                    quantity: quantities[optId] || 1,
                    price: 0 // Price would be fetched from options data if available
                }))

                bookingData.selectedOptions = optionsArray
                bookingData.repairDescription = repairDescription
                bookingData.photos = photos // Array of file paths/URLs
                bookingData.contact = contactToUse
                bookingData.pickupDate = selectedDate
                bookingData.pickupSlot = selectedSlot
            } else if (isJersey) {
                // Team jersey booking
                bookingData.teamName = teamName
                bookingData.players = players
                bookingData.designFile = designFile ? designFile.name : ''
                bookingData.driveLink = driveLink
                bookingData.contact = contact
            } else if (isOrg) {
                // Organizational booking
                bookingData.orgName = orgName
                bookingData.members = members
                bookingData.orgDesignFile = orgDesignFile ? orgDesignFile.name : ''
                bookingData.orgDriveLink = orgDriveLink
                bookingData.contact = orgContact
            }

            console.log('Submitting booking data:', bookingData)

            // Call API to create booking
            const response = await bookingApi.createBooking(bookingData)

            console.log('Booking response:', response)

            if (response.success || response._id || response.booking) {
                // Show success message
                alert('Booking submitted successfully! We will contact you soon.')
                resetForm()
                onClose()
            } else {
                setError(response.message || 'Failed to create booking')
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
        } finally {
            setLoading(false)
        }
    }

    const goToStep = (s) => setStep(s)

    useEffect(() => {
        if (nextError && canNext()) setNextError('')
    }, [nextError, step, service, players.length, members.length])

    const renderStep = () => {
        if (step === 1) return <StepService service={service} setService={setService} />

        if (isRepair) {
            switch (step) {
                case 2: return <StepOptions selectedOptions={selectedOptions} toggleOption={toggleOption} quantities={quantities} setQuantity={setQuantity} repairDescription={repairDescription} setRepairDescription={setRepairDescription} />
                case 3: return <StepPhoto photos={photos} setPhotos={setPhotos} skipPhoto={() => setStep(4)} />
                case 4: return <StepDetails details={details} setDetail={setDetail} />
                case 5: return <StepPickup selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot} />
                case 6: return <StepReview service={service} selectedOptions={selectedOptions} details={details} selectedDate={selectedDate} selectedSlot={selectedSlot} photos={photos} quantities={quantities} repairDescription={repairDescription} />
                default: return null
            }
        }

        if (isJersey) {
            switch (step) {
                case 2: return <TeamStepPlayers teamName={teamName} setTeamName={setTeamName} players={players} setPlayers={setPlayers} />
                case 3: return <TeamStepDesign designFile={designFile} setDesignFile={setDesignFile} driveLink={driveLink} setDriveLink={setDriveLink} />
                case 4: return <TeamStepContact contact={contact} setContact={setContact} />
                case 5: return <TeamStepConfirm teamName={teamName} players={players} designFile={designFile} driveLink={driveLink} contact={contact} goToStep={goToStep} />
                default: return null
            }
        }

        if (isOrg) {
            switch (step) {
                case 2: return <OrgStepDetails orgName={orgName} setOrgName={setOrgName} members={members} setMembers={setMembers} />
                case 3: return <TeamStepDesign designFile={orgDesignFile} setDesignFile={setOrgDesignFile} driveLink={orgDriveLink} setDriveLink={setOrgDriveLink} />
                case 4: return <OrgStepContact contact={orgContact} setContact={setOrgContact} />
                case 5: return <OrgStepConfirm orgName={orgName} members={members} designFile={orgDesignFile} driveLink={orgDriveLink} contact={orgContact} goToStep={goToStep} />
                default: return null
            }
        }

        return null
    }

    const submitLabel = isJersey ? 'Confirm & Submit' : isOrg ? 'Confirm & Submit' : 'Submit Booking'

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden p-2 sm:p-4">
            <div className="relative w-full max-w-2xl max-h-[96vh] flex flex-col">
                <div className="bg-[#F8FAFC] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full w-full">
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/5 hover:bg-red-100 flex items-center justify-center text-gray-500 hover:text-red-600 transition-all cursor-pointer"
                    >
                        <MdClose size={18} />
                    </button>

                    {/* Header */}
                    <div className="pt-4 pb-2 text-center select-none shrink-0">
                        <img src={img.JJS} alt="JJS" className="h-10 mx-auto" />
                        <p className="text-[9px] uppercase tracking-[0.3em] text-blue-500/60 font-bold mt-1.5">
                            Repair & Custom Jersey Service
                        </p>
                    </div>

                    {/* Stepper */}
                    <div className="px-4 pb-1 shrink-0">
                        <Stepper currentStep={step} labels={labels} />
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
