import { useEffect, useRef, useState } from "react";
import TableOfContents from "../components/toc";
import Section from "../components/legalsection";
import img from "../assets/img";
import {
    CheckCircle, UserCheck, Lock, CreditCard,
    RefreshCcw, XCircle, Clock, Wrench,
    Truck, Copyright, Ban, AlertTriangle,
    AlertOctagon, Scale, FileText
} from "lucide-react";

const LAST_UPDATED = "May 5, 2026";
const EFFECTIVE_DATE = "May 5, 2026";

const ListItem = ({ num, title, children }) => (
    <div className="flex items-start gap-4 mb-5">
        {num && <span className="text-blue-700 font-bold shrink-0">{num}.</span>}
        <div>
            {title && <strong className="block text-stone-800 mb-1">{title}</strong>}
            <div className="text-stone-600 text-sm leading-relaxed">{children}</div>
        </div>
    </div>
);

export const termsSections = [
    {
        id: "tou-intro",
        title: "Introduction",
        icon: FileText,
        content: (
            <div className="p-5 bg-blue-50 rounded-xl text-blue-900 border border-blue-200/50 mb-6 shadow-sm">
                <p className="mb-0 leading-relaxed font-medium">
                    Welcome to the JJSTrack Management Portal. These Terms of Use constitute a legally binding agreement between you (Admin or Staff) and JJSTrack. By accessing the portal, you agree to be bound by these terms, the <strong>Philippine Cybercrime Prevention Act of 2012 (RA 10175)</strong>, and applicable global enterprise standards.
                </p>
            </div>
        )
    },
    {
        id: "tou-acceptance",
        title: "1. Acceptance of Terms",
        icon: CheckCircle,
        content: (
            <>
                <ListItem num="1.1">By accessing, using, or logging into the JJSTrack Management Portal (the "Portal"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Use, as well as the Privacy Policy incorporated herein.</ListItem>
                <ListItem num="1.2">If you do not agree to these Terms, you must cease use of the Portal immediately and notify your administrator.</ListItem>
            </>
        ),
    },
    {
        id: "tou-proper-usage",
        title: "2. Authorized & Proper Usage",
        icon: UserCheck,
        content: (
            <>
                <p className="mb-5">Access to the JJSTrack Portal is strictly limited to authorized personnel. As a user, you represent and warrant that:</p>
                <ListItem num="2.1">You will use the Portal solely for legitimate business operations within the scope of your assigned role.</ListItem>
                <ListItem num="2.2">You will not access or attempt to access data, features, or areas of the Portal beyond your authorized role permissions.</ListItem>
                <ListItem num="2.3">You will not use the Portal for any personal, commercial, or unlawful purpose outside your employment or engagement with JJSTrack.</ListItem>
                <ListItem num="2.4">Any unauthorized access constitutes a violation of <strong>RA 10175 (Cybercrime Prevention Act)</strong> and may result in criminal prosecution.</ListItem>

                <p className="mt-5 text-sm italic text-stone-500">Providing false information or misrepresenting your identity may result in immediate revocation of access and legal action.</p>
            </>
        ),
    },
    {
        id: "tou-account-security",
        title: "3. Account Security & Credentials",
        icon: Lock,
        content: (
            <>
                <p className="mb-5">To maintain the integrity and security of the Portal, you agree to:</p>
                <ListItem num="3.1">Maintain strict confidentiality of your account credentials (username, password, and any 2FA tokens).</ListItem>
                <ListItem num="3.2">Never share your login credentials with any other person, including other staff members.</ListItem>
                <ListItem num="3.3">Immediately report any unauthorized access to your account or security breach to your system administrator.</ListItem>
                <ListItem num="3.4">Log out of the Portal at the end of every session, especially on shared or public devices.</ListItem>

                <p className="mt-5 text-sm italic text-stone-500">JJSTrack will not be liable for any losses arising from your failure to maintain the confidentiality of your credentials. All actions performed under your credentials are your responsibility.</p>
            </>
        ),
    },
    {
        id: "tou-confidentiality",
        title: "4. Data Confidentiality",
        icon: CreditCard,
        content: (
            <>
                <p className="mb-5">All Admin and Staff users are bound by strict confidentiality obligations regarding data accessed through the Portal:</p>
                <ListItem num="4.1" title="Customer Data">All customer records, order details, contact information, and personal data must be treated as strictly confidential and used only for authorized business purposes.</ListItem>
                <ListItem num="4.2" title="Financial Records">Financial data, payment information, and business metrics accessible through the Portal are proprietary and must not be disclosed externally.</ListItem>
                <ListItem num="4.3" title="System Information">Architectural details, access credentials, and system configurations must not be shared with unauthorized parties.</ListItem>

                <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 shadow-sm flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <strong className="block text-amber-800 mb-2">Breach of Confidentiality</strong>
                        <p className="mb-0 text-sm leading-relaxed text-amber-800 font-medium">
                            Unauthorized disclosure of confidential data is a violation of the Data Privacy Act of 2012 (RA 10173) and may result in administrative sanctions, civil liability, and/or criminal prosecution.
                        </p>
                    </div>
                </div>
            </>
        ),
    },
    {
        id: "tou-audit",
        title: "5. Audit Logging & Monitoring",
        icon: RefreshCcw,
        content: (
            <>
                <p className="mb-5">To maintain system integrity and accountability, JJSTrack performs continuous monitoring of all Portal activity:</p>
                <ListItem num="5.1">All actions performed within the Portal — including logins, data access, record modifications, and order updates — are logged with timestamps and user attribution.</ListItem>
                <ListItem num="5.2">These logs are subject to periodic audits by authorized administrators.</ListItem>
                <ListItem num="5.3">By using the Portal, you irrevocably consent to such monitoring and logging for security, forensic, and quality assurance purposes.</ListItem>
                <ListItem num="5.4">Audit logs may be used as evidence in internal investigations or legal proceedings where applicable.</ListItem>
            </>
        ),
    },
    {
        id: "tou-prohibited",
        title: "6. Prohibited Activities",
        icon: Ban,
        content: (
            <>
                <p className="mb-5">The following activities are strictly prohibited on the JJSTrack Management Portal:</p>
                <ListItem num="6.1">Attempting to access, modify, or delete data outside your authorized scope.</ListItem>
                <ListItem num="6.2">Introducing malware, viruses, or any harmful code into the Portal systems.</ListItem>
                <ListItem num="6.3">Scraping, exporting, or mass-downloading system data without explicit authorization.</ListItem>
                <ListItem num="6.4">Misrepresenting data entries or falsifying records within the system.</ListItem>
                <ListItem num="6.5">Using system access to gain personal or financial benefit outside your employment scope.</ListItem>
                <ListItem num="6.6">Sharing screenshots or system data with unauthorized third parties.</ListItem>

                <p className="mt-5 text-sm italic text-stone-500">Violation of any of the above may result in immediate suspension of access, administrative action, and referral to law enforcement authorities.</p>
            </>
        ),
    },
    {
        id: "tou-termination",
        title: "7. Termination of Access",
        icon: AlertOctagon,
        content: (
            <>
                <p className="mb-5">JJSTrack reserves the right, at its sole discretion, to suspend or permanently revoke your Portal access, without prior notice, if:</p>
                <ListItem num="7.1">You have violated any provision of these Terms.</ListItem>
                <ListItem num="7.2">Your employment or engagement with JJSTrack has ended.</ListItem>
                <ListItem num="7.3">Your continued access poses a risk to system security or data integrity.</ListItem>
                <ListItem num="7.4">We are required to do so by applicable law or regulatory authority.</ListItem>

                <p className="mt-5 text-sm text-stone-600">Upon termination, your right to access the Portal ceases immediately and all associated credentials will be invalidated.</p>
            </>
        ),
    },
    {
        id: "tou-governing-law",
        title: "8. Governing Law & Dispute Resolution",
        icon: Scale,
        content: (
            <>
                <ListItem num="8.1">These Terms of Use shall be governed by and construed in accordance with the laws of the Republic of the Philippines.</ListItem>
                <ListItem num="8.2">Any dispute arising from the use of the Portal shall be subject to the exclusive jurisdiction of the competent courts of the Philippines.</ListItem>
                <ListItem num="8.3">Prior to any formal legal action, parties agree to make a good faith effort to resolve disputes through direct communication with JJSTrack management.</ListItem>
            </>
        ),
    },
    {
        id: "tou-changes",
        title: "9. Changes to These Terms",
        icon: FileText,
        content: (
            <>
                <p className="mb-5">JJSTrack reserves the right to modify these Terms at any time. When material changes are made, we will:</p>
                <ListItem num="9.1">Post a notice within the Portal.</ListItem>
                <ListItem num="9.2">Update the "Last Updated" date above.</ListItem>

                <p className="mt-5 text-sm text-stone-600">Your continued use of the Portal following the posting of revised Terms constitutes your acceptance of the updated Terms.</p>
            </>
        ),
    },
];

// ── Modal-friendly content (used by Rbac.jsx LegalModal) ─────────────────────
export function TermsContent({ scrollRef }) {
    const [activeSection, setActiveSection] = useState(termsSections[0].id);
    const containerRef = scrollRef;

    const scrollTo = (id) => {
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el && containerRef?.current) {
            containerRef.current.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
        }
    };

    useEffect(() => {
        const container = containerRef?.current;
        if (!container) return;

        const onScroll = () => {
            const offset = container.scrollTop + 80;
            let current = termsSections[0].id;
            termsSections.forEach(({ id }) => {
                const el = document.getElementById(id);
                if (el && el.offsetTop <= offset) current = id;
            });
            setActiveSection((prev) => (prev === current ? prev : current));
        };

        container.addEventListener("scroll", onScroll, { passive: true });
        return () => container.removeEventListener("scroll", onScroll);
    }, [containerRef]);

    return (
        <div className="flex gap-6 min-h-0">
            {/* Sidebar TOC */}
            <aside className="hidden lg:block w-56 shrink-0">
                <div className="sticky top-0 bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">On this page</p>
                    <ul className="space-y-1">
                        {termsSections.map((s) => {
                            const match = s.title.match(/^(\d+)\.\s+(.*)$/);
                            const num = match ? match[1] : "";
                            const text = match ? match[2] : s.title;
                            return (
                                <li key={s.id}>
                                    <button
                                        onClick={() => scrollTo(s.id)}
                                        className={`text-left w-full text-xs py-1.5 px-2.5 rounded-md transition-all duration-150 flex items-center gap-2 ${activeSection === s.id ? "bg-blue-50 border border-blue-100 text-blue-700 font-semibold" : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"}`}
                                    >
                                        {num && <span className={`font-bold shrink-0 ${activeSection === s.id ? "text-blue-600" : "text-stone-400"}`}>{num}.</span>}
                                        <span className="leading-snug">{text}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </aside>

            {/* Sections */}
            <main className="flex-1 min-w-0 space-y-4">
                {termsSections.map((s) => (
                    <Section key={s.id} section={s} />
                ))}
            </main>
        </div>
    );
}

// ── Standalone full page ──────────────────────────────────────────────────────
export default function TermsOfUse() {
    const [activeSection, setActiveSection] = useState(termsSections[0].id);

    useEffect(() => {
        const sectionIds = termsSections.map((s) => s.id);
        const onScroll = () => {
            const offset = window.scrollY + 140;
            let current = sectionIds[0];
            sectionIds.forEach((id) => {
                const el = document.getElementById(id);
                if (el && el.offsetTop <= offset) current = id;
            });
            setActiveSection((prev) => (prev === current ? prev : current));
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
    }, []);

    const scrollTo = (id) => {
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-stone-50 font-inter">
            <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={img.JJS} alt="JJS Logo" className="w-12 h-12 object-contain" />
                        <span className="font-bold text-stone-800 text-lg">JJSTrack Admin</span>
                    </div>
                    <span className="text-sm font-medium text-stone-500">Last Updated: <span className="text-stone-800">{LAST_UPDATED}</span></span>
                </div>
            </header>

            <div className="relative overflow-hidden bg-gradient-to-br from-stone-800 to-stone-900 text-white py-16 md:py-24 text-center">
                <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none">
                    <span className="font-bold text-[15rem] leading-none select-none tracking-tighter">JJS</span>
                </div>
                <div className="relative z-10 px-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Terms of Use</h1>
                    <p className="text-blue-400 font-semibold text-sm md:text-base tracking-wide uppercase inline-block px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/5">
                        Effective Date: {EFFECTIVE_DATE}
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:grid lg:grid-cols-[250px_1fr] gap-12 items-start relative">
                <TableOfContents sections={termsSections} active={activeSection} onSelect={scrollTo} />
                <main className="min-w-0">
                    {termsSections.map((s) => <Section key={s.id} section={s} />)}
                </main>
            </div>

            <footer className="mt-12 py-10 bg-stone-100 border-t border-stone-200 text-stone-500">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img src={img.JJS} alt="JJS Logo" className="w-9 h-9 object-contain" />
                        <span className="font-bold text-stone-800 text-sm opacity-80">JJSTrack Admin</span>
                    </div>
                    <div className="text-xs font-medium">© {new Date().getFullYear()} JJSTrack. All rights reserved.</div>
                </div>
            </footer>
        </div>
    );
}
