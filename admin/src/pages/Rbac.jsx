import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Users, ArrowRight, X, ShieldCheck, ClipboardCheck } from 'lucide-react'
import image from '../assets/img'
import { PrivacyContent } from './PrivacyPolicy'
import { TermsContent } from './TermsOfUse'

const LegalModal = ({ isOpen, onClose, title, ContentComponent }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
        >
            <div
                className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
            >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 p-2 shadow-xs flex items-center justify-center shrink-0">
                            <img src={image.JJS} alt="JJSTrack Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h2 id="legal-modal-title" className="text-base sm:text-xl font-bold font-playfair text-slate-900 tracking-tight">
                                {title}
                            </h2>
                            <p className="text-[11px] text-slate-500 font-medium font-sans tracking-wide uppercase mt-0.5">
                                JJSTrack Management Portal Documentation
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        type="button"
                        aria-label="Close legal dialog"
                        className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50 font-sans custom-scrollbar text-slate-700 leading-relaxed text-sm"
                >
                    {ContentComponent && <ContentComponent scrollRef={scrollRef} />}
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 font-sans">
                    <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
                        By continuing, you acknowledge and agree to this {title}.
                    </p>
                    <button
                        onClick={onClose}
                        type="button"
                        className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs tracking-wide focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        Acknowledge & Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function RBAC() {
    const navigate = useNavigate();
    const [modal, setModal] = useState({ open: false, title: '', component: null });

    const openModal = (title, component) => setModal({ open: true, title, component });
    const closeModal = () => setModal({ open: false, title: '', component: null });

    const handlePortalClick = (targetPath) => {
        navigate(targetPath);
    };

    return (
        <div className="relative min-h-screen h-screen w-full font-sans text-slate-100 flex flex-col justify-between overflow-hidden selection:bg-slate-700 selection:text-white">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 blur-sm scale-105"
                    style={{ backgroundImage: `url(${image.jjsb})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#080c17]/85 via-[#080c17]/90 to-[#080c17]" />
            </div>

            <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-5 flex flex-col items-center flex-1 justify-center overflow-hidden">

                <header className="w-full max-w-xl text-center flex flex-col items-center mb-3 sm:mb-5 shrink-0">
                    <div className="mb-2 sm:mb-3 p-2 backdrop-blur-xl flex items-center justify-center">
                        <img src={image.JJS} alt="JJSTrack Logo" className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md" />
                    </div>
                    <h1 className="text-2xl sm:text-4xl md:text-4xl font-bold font-playfair tracking-tight text-white mb-1.5 text-center leading-tight drop-shadow-lg">
                        Welcome to JJSTrack
                    </h1>
                    <p className="text-slate-200 text-xs sm:text-sm max-w-md text-center leading-relaxed font-sans font-normal drop-shadow-sm">
                        Select your authorized portal scope to access your workspace.
                    </p>
                </header>

                <main className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

                    <button
                        type="button"
                        onClick={() => handlePortalClick('/admin/login')}
                        className="group text-left relative flex flex-col justify-between bg-neutral-950/70 hover:bg-neutral-950/85 backdrop-blur-xl border border-neutral-800/80 hover:border-blue-500/70 rounded-2xl p-5 sm:p-6 shadow-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer overflow-hidden"
                    >
                        <div className="pointer-events-none absolute -right-6 -bottom-6 text-blue-500/10 group-hover:text-blue-500/20 group-hover:scale-105 transition-all duration-300 transform -rotate-12 select-none">
                            <ShieldCheck size={160} strokeWidth={1.1} />
                        </div>
                        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-blue-600/10 blur-2xl group-hover:bg-blue-600/20 transition-all duration-300" />
                        <div className="pointer-events-none absolute top-0 right-0 h-[1px] w-24 bg-gradient-to-l from-blue-500/40 to-transparent" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4 sm:mb-5">
                                <div className="w-10 h-10 bg-neutral-900/70 text-white border border-neutral-700/80 group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-md backdrop-blur-md">
                                    <Shield size={20} strokeWidth={2} />
                                </div>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold font-playfair text-white mb-1.5 tracking-tight group-hover:text-blue-400 transition-colors">
                                Admin Portal
                            </h2>
                            <p className="text-neutral-300 text-xs leading-relaxed mb-4 font-sans font-normal">
                                Full access for administrators to manage all system functions
                            </p>
                            <div className="flex flex-wrap gap-1.5 mb-5">
                                {['Analytics & Reports', 'Staff Management', 'Services & Pricing', 'Inventory'].map((scope) => (
                                    <span key={scope} className="text-[11px] font-medium font-sans text-neutral-300 bg-neutral-900/60 border border-neutral-800/80 px-2.5 py-1 rounded-md group-hover:border-neutral-700 transition-colors backdrop-blur-md">
                                        {scope}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="relative z-10 pt-3 border-t border-neutral-800/80 flex items-center justify-between font-sans">
                            <span className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-300 group-hover:text-blue-400 tracking-wider uppercase transition-colors">
                                Continue as Administrator
                            </span>
                            <div className="w-8 h-8 rounded-full bg-neutral-900/80 text-neutral-300 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-md border border-neutral-800 group-hover:border-blue-500 backdrop-blur-md">
                                <ArrowRight size={14} />
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handlePortalClick('/staff/login')}
                        className="group text-left relative flex flex-col justify-between bg-white/70 hover:bg-white/90 backdrop-blur-xl border border-white/60 hover:border-blue-500/70 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/25 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer overflow-hidden"
                    >
                        <div className="pointer-events-none absolute -right-6 -bottom-6 text-slate-900/10 group-hover:text-blue-600/20 group-hover:scale-105 transition-all duration-300 transform rotate-12 select-none">
                            <ClipboardCheck size={160} strokeWidth={1.1} />
                        </div>
                        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-600/20 transition-all duration-300" />
                        <div className="pointer-events-none absolute top-0 right-0 h-[1px] w-24 bg-gradient-to-l from-blue-500/40 to-transparent" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4 sm:mb-5">
                                <div className="w-10 h-10 bg-white/80 text-slate-800 border border-slate-200/80 group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm backdrop-blur-xl">
                                    <Users size={20} strokeWidth={2} />
                                </div>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold font-playfair text-slate-900 mb-1.5 tracking-tight group-hover:text-blue-600 transition-colors">
                                Staff Portal
                            </h2>
                            <p className="text-slate-700 text-xs leading-relaxed mb-4 font-sans font-medium">
                                Access your personalized dashboard to monitor workflows and productivity tools.
                            </p>
                            <div className="flex flex-wrap gap-1.5 mb-5">
                                {['Order Workflows', 'QR Scanner', 'Stock Logging', 'Job Archives'].map((scope) => (
                                    <span key={scope} className="text-[11px] font-medium font-sans text-slate-800 bg-white/70 border border-slate-200/90 px-2.5 py-1 rounded-md group-hover:border-slate-300 transition-colors backdrop-blur-md">
                                        {scope}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="relative z-10 pt-3 border-t border-slate-200/90 flex items-center justify-between font-sans">
                            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 group-hover:text-blue-600 tracking-wider uppercase transition-colors">
                                Continue as Staff
                            </span>
                            <div className="w-8 h-8 rounded-full bg-white/90 text-slate-800 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm border border-slate-200/90 group-hover:border-blue-500 backdrop-blur-md">
                                <ArrowRight size={14} />
                            </div>
                        </div>
                    </button>
                </main>
            </div>

            <footer className="relative z-10 w-full border-t border-neutral-800/80 bg-black/90 backdrop-blur-md py-3 px-4 sm:px-8 md:px-12 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-2 shrink-0 font-sans">
                <div className="flex items-center gap-2 font-medium tracking-wide text-slate-200">
                    <img src={image.JJS} alt=" JJSTRACK LOGO" className="w-5 h-5" />
                    <span>JJS ADMIN & STAFF PORTAL</span>
                </div>

                <div className="flex items-center gap-4 font-medium">
                    <button
                        type="button"
                        onClick={() => openModal('Privacy Policy', PrivacyContent)}
                        className="py-0.5 px-2 rounded-md hover:text-white hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-slate-400 flex items-center"
                    >
                        Privacy Policy
                    </button>
                    <span className="text-slate-700">|</span>
                    <button
                        type="button"
                        onClick={() => openModal('Terms of Use', TermsContent)}
                        className="py-0.5 px-2 rounded-md hover:text-white hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-slate-400 flex items-center"
                    >
                        Terms of Use
                    </button>
                </div>

                <div className="text-slate-400 text-center sm:text-right font-normal text-[11px]">
                    &copy; 2026 JJSTRACK. All rights reserved.
                </div>
            </footer>

            <LegalModal
                isOpen={modal.open}
                onClose={closeModal}
                title={modal.title}
                ContentComponent={modal.component}
            />
        </div>
    );
}
