import { useRef, useEffect } from 'react';
import image from '../assets/img';

export function LegalModal({ isOpen, onClose, title, ContentComponent }) {
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
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
                        className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs tracking-wide focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                    >
                        Acknowledge & Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LegalModal;
