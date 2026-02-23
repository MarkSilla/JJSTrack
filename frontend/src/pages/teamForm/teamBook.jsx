import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdCheck, MdArrowBack, MdArrowForward, MdSend } from 'react-icons/md'
import TeamStepPlayers from './TeamStepPlayers'
import TeamStepDesign from './TeamStepDesign'
import TeamStepContact from './TeamStepContact'
import TeamStepConfirm from './TeamStepConfirm'

const STEP_LABELS = ['Team & Players', 'Design', 'Contact', 'Confirm']

//Stepper
const Stepper = ({ currentStep }) => (
    <nav className="w-full max-w-2xl mx-auto" aria-label="Progress">
        <ol className="hidden sm:flex items-center">
            {STEP_LABELS.map((label, i) => {
                const num = i + 1
                const active = num === currentStep
                const done = num < currentStep
                return (
                    <li key={label} className="flex-1 flex items-center">
                        <div className="flex flex-col items-center w-full relative">
                            {i > 0 && (
                                <span
                                    className={`absolute top-5 right-1/2 w-full h-[2px] -translate-y-1/2 transition-colors duration-500
                    ${done ? 'bg-blue-500' : active ? 'bg-gradient-to-r from-blue-500 to-gray-700' : 'bg-gray-700/60'}`}
                                />
                            )}
                            <span
                                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold tracking-wide transition-all duration-300
                  ${active
                                        ? 'bg-blue-600 text-white ring-[3px] ring-blue-500/30 shadow-lg shadow-blue-600/25'
                                        : done
                                            ? 'bg-blue-600/90 text-white'
                                            : 'bg-[#1B2540] text-gray-500 ring-1 ring-gray-700'
                                    }`}
                            >
                                {done ? <MdCheck size={18} /> : num}
                            </span>
                            <span
                                className={`mt-2 text-[11px] font-semibold uppercase tracking-widest transition-colors
                  ${active ? 'text-blue-400' : done ? 'text-blue-400/60' : 'text-gray-600'}`}
                            >
                                {label}
                            </span>
                        </div>
                    </li>
                )
            })}
        </ol>
        <div className="sm:hidden flex items-center justify-between px-2">
            {STEP_LABELS.map((label, i) => {
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
                                            : 'bg-[#1B2540] text-gray-600 ring-1 ring-gray-700'
                                    }`}
                            >
                                {done ? <MdCheck size={14} /> : num}
                            </span>
                            <span className={`text-[9px] mt-1 font-semibold uppercase tracking-wider ${active ? 'text-blue-400' : done ? 'text-blue-400/50' : 'text-gray-600'}`}>
                                {label}
                            </span>
                        </div>
                        {i < STEP_LABELS.length - 1 && (
                            <div className={`flex-1 h-[2px] mx-1 -mt-4 rounded ${done || (active && i < currentStep - 1) ? 'bg-blue-500' : 'bg-gray-700/50'}`} />
                        )}
                    </React.Fragment>
                )
            })}
        </div>
    </nav>
)

const TeamBook = () => {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)

    // Step 1
    const [teamName, setTeamName] = useState('')
    const [players, setPlayers] = useState([])

    // Step 2
    const [designFile, setDesignFile] = useState(null)
    const [driveLink, setDriveLink] = useState('')

    // Step 3
    const [contact, setContact] = useState({ fullName: '', phone: '', email: '', facebook: '', address: '' })

    const canNext = () => {
        if (step === 1) return players.length > 0
        return true
    }

    const handleSubmit = () => {
        alert('Team order submitted successfully!')
        navigate('/home')
    }

    const goToStep = (s) => setStep(s)

    const renderStep = () => {
        switch (step) {
            case 1: return <TeamStepPlayers teamName={teamName} setTeamName={setTeamName} players={players} setPlayers={setPlayers} />
            case 2: return <TeamStepDesign designFile={designFile} setDesignFile={setDesignFile} driveLink={driveLink} setDriveLink={setDriveLink} />
            case 3: return <TeamStepContact contact={contact} setContact={setContact} />
            case 4: return <TeamStepConfirm teamName={teamName} players={players} designFile={designFile} driveLink={driveLink} contact={contact} goToStep={goToStep} />
            default: return null
        }
    }

    return (
        <div className="min-h-screen bg-[#0B1120] flex flex-col font-['Inter',sans-serif]">
            <header className="pt-10 pb-2 text-center select-none">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    JJS <span className="text-blue-500">Track</span>
                </h1>
                <p className="text-[10px] uppercase tracking-[0.35em] text-blue-400/50 font-bold mt-1.5">
                    Team Jersey Order
                </p>
            </header>
            <div className="px-6 pt-8 pb-2">
                <Stepper currentStep={step} />
            </div>
            <div className="flex-1 flex items-start justify-center px-4 sm:px-6 py-6">
                <div className="w-full max-w-2xl relative">
                    <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                    <div className="bg-[#0F1729]/90 border border-gray-700/40 rounded-2xl p-7 md:p-10 backdrop-blur-sm shadow-2xl shadow-black/30">
                        {renderStep()}
                        <div className="border-t border-gray-700/30 mt-10 pt-6 flex items-center justify-between">
                            {step > 1 ? (
                                <button
                                    onClick={() => setStep((s) => s - 1)}
                                    className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-sm font-medium group"
                                >
                                    <MdArrowBack size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/home')}
                                    className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-sm font-medium group"
                                >
                                    <MdArrowBack size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Dashboard
                                </button>
                            )}

                            {step < 4 ? (
                                <button
                                    onClick={() => canNext() && setStep((s) => s + 1)}
                                    disabled={!canNext()}
                                    className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer
                                            ${canNext()
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30'
                                            : 'bg-gray-800 text-gray-600 cursor-not-allowed shadow-none'}`}
                                >
                                    Next <MdArrowForward size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30 transition-all duration-300 cursor-pointer"
                                >
                                    Confirm & Submit <MdSend size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <footer className="text-center pb-8">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-600">
                    Step {step} of 4
                </span>
            </footer>
        </div>
    )
}

export default TeamBook
