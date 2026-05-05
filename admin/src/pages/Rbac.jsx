import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Users, ChevronRight, X, ShieldCheck, Scale } from 'lucide-react'
import image from '../assets/img'
import { PrivacyContent } from './PrivacyPolicy'
import { TermsContent } from './TermsOfUse'

const LegalModal = ({ isOpen, onClose, title, ContentComponent }) => {
    const scrollRef = useRef(null);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#020617]/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-6 md:px-8 py-5 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-stone-50 p-1.5 rounded-xl border border-stone-100 shadow-sm flex items-center justify-center overflow-hidden">
                            <img src={image.JJS} alt="JJS Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-stone-900 tracking-tight">{title}</h2>
                            <p className="text-[10px] md:text-xs text-blue-600 font-bold tracking-[0.2em] uppercase mt-0.5 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-blue-600 inline-block"></span>
                                JJSTrack Management Portal
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-900"
                    >
                        <X size={22} />
                    </button>
                </div>
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 md:p-8 bg-stone-50/40 font-inter"
                >
                    <ContentComponent scrollRef={scrollRef} />
                </div>
                <div className="px-6 py-4 border-t border-stone-100 bg-white flex items-center justify-between shrink-0">
                    <p className="text-xs text-stone-400 font-medium">
                        By continuing, you acknowledge and accept this {title}.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-[#020617] text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest"
                    >
                        Accept & Continue
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

    return (
        <div className="flex min-h-screen relative overflow-hidden font-sans items-center justify-center p-6 md:p-8">
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-sm"
                style={{ backgroundImage: `url(${image.jjsb})` }}
            />
            <div className="absolute inset-0 z-10 bg-[#020617] opacity-80" />
            <div className="relative z-20 w-full max-w-5xl bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[1rem] md:rounded-[2rem] p-8 md:p-16 shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000">
                <header className="w-full mb-10 flex flex-col items-center">
                    <div className="mb-8 p-1 rounded-full bg-white/5 border border-white/10 shadow-inner">
                        <img src={image.JJS} alt="JJSTrack Logo" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-lg" />
                    </div>
                </header>

                <div className="w-full flex flex-col items-center">
                    <div className="text-center mb-12 max-w-2xl">
                        <h1 className="text-3xl md:text-[3.5rem] font-extrabold tracking-wide text-white mb-6 drop-shadow-md">
                            Welcome to JJSTrack
                        </h1>
                        <p className="text-white/80 text-lg md:text-xl leading-relaxed font-medium">
                            Choose your portal to access the system.
                        </p>
                    </div>


                    <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 lg:gap-10 w-full max-w-5xl">
                        <button
                            onClick={() => navigate('/admin/login')}
                            className="group w-full md:w-1/2 flex flex-col bg-white rounded-[2.5rem] p-8 md:p-9 shadow-2xl transition-all duration-500 text-left relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-white/10"
                        >
                            <div className="w-16 h-16 bg-[#000821]/5 text-[#000821] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#000821] group-hover:text-white transition-colors duration-500">
                                <Shield size={32} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Admin Portal</h3>
                            <p className="text-slate-500 leading-relaxed mb-10 flex-1 text-sm md:text-base">
                                Full access for administrators to manage all system functions
                            </p>
                            <div className="flex items-center font-bold text-[#000821] gap-2 group-hover:gap-4 transition-all duration-300 uppercase text-xs tracking-[0.2em]">
                                Continue as Administrator <ChevronRight size={18} />
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/staff/login')}
                            className="group w-full md:w-1/2 flex flex-col bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl transition-all duration-500 text-left relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-white/10"
                        >
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                                <Users size={32} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Staff Portal</h3>
                            <p className="text-slate-500 leading-relaxed mb-10 flex-1 text-sm md:text-base">
                                Manage orders, updates, and daily tasks as staff.
                            </p>
                            <div className="flex items-center font-bold text-blue-600 gap-2 group-hover:gap-4 transition-all duration-300 uppercase text-xs tracking-[0.2em]">
                                Continue as Staff <ChevronRight size={18} />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <footer className="absolute bottom-0 w-full py-8 px-12 flex flex-col md:flex-row items-center justify-between text-[13px] text-white/40 font-medium z-20">
                <div className="flex-1 hidden md:flex items-center gap-2">
                    <span className="tracking-widest uppercase">JJSTRACK</span>
                </div>

                <div className="flex-1 flex justify-center items-center gap-8 pointer-events-auto ">
                    <button
                        onClick={() => openModal('Privacy Policy', PrivacyContent)}
                        className="hover:text-white transition-colors duration-200"
                    >
                        Privacy Policy
                    </button>
                    <div className="w-px h-3 bg-white/20" />
                    <button
                        onClick={() => openModal('Terms of Use', TermsContent)}
                        className="hover:text-white transition-colors duration-200"
                    >
                        Terms of Use
                    </button>
                </div>

                <div className="flex-1 hidden md:flex justify-end opacity-60">
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
