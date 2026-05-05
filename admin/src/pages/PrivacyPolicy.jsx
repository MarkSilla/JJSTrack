import { useEffect, useRef, useState } from "react";
import TableOfContents from "../components/toc";
import Section from "../components/legalsection";
import img from "../assets/img";
import {
    Database, FileText, Activity, Globe,
    Users, Archive, Lock, UserCheck,
    Link2, ShieldCheck, RefreshCcw, Mail
} from "lucide-react";

const LAST_UPDATED = "May 5, 2026";
const EFFECTIVE_DATE = "May 5, 2026";

const ListItem = ({ num, title, children }) => (
    <div className="flex items-start gap-3 mb-4">
        {num && <span className="text-blue-700 font-bold shrink-0">{num}.</span>}
        <div>
            {title && <strong className="block text-stone-800 mb-1">{title}</strong>}
            <div className="text-stone-600 text-sm leading-relaxed">{children}</div>
        </div>
    </div>
);

export const privacySections = [
    {
        id: "pp-intro",
        title: "Introduction",
        icon: FileText,
        content: (
            <div className="p-5 bg-blue-50 rounded-xl text-blue-900 border border-blue-200/50 mb-6 shadow-sm">
                <p className="mb-0 leading-relaxed font-medium">
                    Welcome to JJSTrack. This Privacy Policy, fully compliant with the <strong>Philippine Data Privacy Act of 2012 (RA 10173)</strong> and aligned with the <strong>General Data Protection Regulation (GDPR)</strong>, explains how we collect, use, and safeguard the personal data of our Admin and Staff users.
                </p>
            </div>
        )
    },
    {
        id: "pp-info-collected",
        title: "1. Information We Collect",
        icon: Database,
        content: (
            <>
                <p className="mb-5">We collect the following personal information from users of the JJSTrack platform:</p>

                <h4 className="text-stone-800 font-bold mb-4 mt-6 flex items-center gap-2">
                    <span className="text-blue-600 font-bold shrink-0">1.1.</span>
                    Personal Information
                </h4>
                <div className="pl-4 border-l-2 border-stone-100 ml-2">
                    <ListItem num="1.1.1" title="Email Address">Used as the primary identifier for account authentication and system communications.</ListItem>
                    <ListItem num="1.1.2" title="Contact Number">Used to communicate order updates, confirmations, and support inquiries.</ListItem>
                    <ListItem num="1.1.3" title="Address">Used for order delivery, fulfillment, and record-keeping purposes.</ListItem>
                    <ListItem num="1.1.4" title="Birthday">Collected for identity verification and account profile purposes.</ListItem>
                    <ListItem num="1.1.5" title="Gender">Collected as part of user profile information for account personalization.</ListItem>
                </div>

                <h4 className="text-stone-800 font-bold mb-4 mt-8 flex items-center gap-2">
                    <span className="text-blue-600 font-bold shrink-0">1.2.</span>
                    Emergency Contact Information
                </h4>
                <div className="pl-4 border-l-2 border-stone-100 ml-2">
                    <ListItem num="1.2.1" title="Name">The full name of the designated emergency contact person.</ListItem>
                    <ListItem num="1.2.2" title="Relationship">The relationship of the emergency contact to the account holder (e.g., Brother, Sister, Parent).</ListItem>
                    <ListItem num="1.2.3" title="Contact Number">The phone number of the emergency contact, used only in cases of urgent necessity.</ListItem>
                </div>
            </>
        ),
    },
    {
        id: "pp-legal-basis",
        title: "2. Legal Basis for Processing",
        icon: FileText,
        content: (
            <>
                <p className="mb-5">Under the Data Privacy Act of 2012 (RA 10173), JJSTrack processes personnel data on the following lawful bases:</p>
                <ListItem num="2.1" title="Contractual Necessity">Processing is necessary to fulfill your employment role and operate the management system.</ListItem>
                <ListItem num="2.2" title="Legitimate Business Interests">System activity logs are processed to ensure security, accountability, and compliance with legal obligations.</ListItem>
                <ListItem num="2.3" title="Legal Obligation">Certain data is retained to comply with the Cybercrime Prevention Act (RA 10175) and applicable labor and commercial laws.</ListItem>
            </>
        ),
    },
    {
        id: "pp-use-of-info",
        title: "3. How We Use Your Information",
        icon: Activity,
        content: (
            <>
                <p className="mb-5">The information we collect is used for the following purposes:</p>
                <ListItem num="3.1" title="Authentication & Access Control">To verify your identity and enforce Role-Based Access Control (RBAC) within the portal.</ListItem>
                <ListItem num="3.2" title="Audit & Compliance">To maintain a complete audit trail of system activity as required by enterprise security standards.</ListItem>
                <ListItem num="3.3" title="System Security">To detect and respond to unauthorized access, anomalies, or potential data breaches.</ListItem>
                <ListItem num="3.4" title="Platform Improvement">To analyze usage patterns and improve the performance and usability of the management system.</ListItem>

                <div className="mt-6 p-4 bg-stone-50 border border-stone-200 rounded-lg text-sm italic text-stone-500">
                    We do not use your data for automated decision-making or profiling that would produce legal or similarly significant effects on you.
                </div>
            </>
        ),
    },
    {
        id: "pp-data-sharing",
        title: "4. Data Sharing and Disclosure",
        icon: Users,
        content: (
            <>
                <p className="mb-5">JJSTrack does not sell, rent, or trade personnel information. We may share your data only in the following limited circumstances:</p>
                <ListItem num="4.1" title="Internal Operations">Data is accessible only to authorized system administrators on a need-to-know basis.</ListItem>
                <ListItem num="4.2" title="Legal Compliance">We may disclose information if required by applicable Philippine law, a court order, or a regulatory authority.</ListItem>
                <ListItem num="4.3" title="Security Incidents">In the event of a security incident, relevant logs may be shared with law enforcement pursuant to RA 10175.</ListItem>
            </>
        ),
    },
    {
        id: "pp-data-retention",
        title: "5. Data Retention",
        icon: Archive,
        content: (
            <>
                <p className="mb-5">We retain your personal data only for as long as necessary to fulfill the purposes described in this policy:</p>
                <ListItem num="5.1">Account credentials are retained for the duration of your active employment/engagement.</ListItem>
                <ListItem num="5.2">System activity logs are retained for a minimum period to satisfy legal audit requirements.</ListItem>
                <ListItem num="5.3">Upon termination of your role, your account data will be deactivated and scheduled for deletion subject to legal retention obligations.</ListItem>
            </>
        ),
    },
    {
        id: "pp-data-security",
        title: "6. Data Security",
        icon: Lock,
        content: (
            <>
                <p className="mb-5">JJSTrack employs enterprise-grade technical and organizational safeguards:</p>
                <ListItem num="6.1" title="Encryption">All data in transit is protected via SSL/TLS. Sensitive data at rest is encrypted using AES-256 standards.</ListItem>
                <ListItem num="6.2" title="Access Control">Access is strictly governed by RBAC — Admin and Staff roles have separate, scoped permissions.</ListItem>
                <ListItem num="6.3" title="Audit Logging">All actions are logged with timestamps and user attribution for forensic accountability.</ListItem>
                <ListItem num="6.4" title="Regular Reviews">We conduct periodic security reviews to identify and mitigate risks.</ListItem>

                <p className="mt-5 text-sm text-stone-500 italic">While we employ robust security measures, no system is completely immune to breaches. We disclaim liability for events outside our reasonable control.</p>
            </>
        ),
    },
    {
        id: "pp-user-rights",
        title: "7. Your Rights (RA 10173)",
        icon: UserCheck,
        content: (
            <>
                <p className="mb-5">As a data subject under the Philippine Data Privacy Act of 2012, you have the following rights:</p>
                <ListItem num="7.1" title="Right to be Informed">To know what personal data is being collected and how it is processed.</ListItem>
                <ListItem num="7.2" title="Right of Access">To obtain a copy of the personal data we hold about you.</ListItem>
                <ListItem num="7.3" title="Right to Rectification">To correct inaccurate or incomplete personal data.</ListItem>
                <ListItem num="7.4" title="Right to Erasure">To request deletion of your data upon termination of your role, subject to legal retention requirements.</ListItem>
                <ListItem num="7.5" title="Right to Data Portability">To obtain your data in a structured, electronic format.</ListItem>
                <ListItem num="7.6" title="Right to File a Complaint">To lodge a complaint with the National Privacy Commission (NPC) if you believe your rights have been violated.</ListItem>

                <p className="mt-5 text-sm text-stone-500">To exercise any of these rights, please contact the JJSTrack Admin using the information provided in Section 10.</p>
            </>
        ),
    },
    {
        id: "pp-third-party",
        title: "8. Third-Party Services",
        icon: Link2,
        content: (
            <>
                <p className="mb-5">JJSTrack may integrate with the following third-party services:</p>
                <ListItem num="8.1" title="Google Authentication">If used, Google Sign-In is subject to Google's Privacy Policy at <a href="https://policies.google.com/privacy" className="text-blue-600 underline hover:text-blue-700 font-medium" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>.</ListItem>

                <p className="mt-5 text-sm text-stone-500">We are not responsible for the privacy practices of third-party integrations.</p>
            </>
        ),
    },
    {
        id: "pp-policy-changes",
        title: "9. Changes to This Policy",
        icon: RefreshCcw,
        content: (
            <>
                <p className="mb-5">JJSTrack reserves the right to update this Privacy Policy at any time. In the event of material changes, we will notify users by:</p>
                <ListItem num="9.1">Posting a notice within the management portal.</ListItem>
                <ListItem num="9.2">Updating the "Last Updated" date above.</ListItem>

                <p className="mt-5 text-sm">Continued use of the portal following notification constitutes acceptance of the revised policy.</p>
            </>
        ),
    },
    {
        id: "pp-contact",
        title: "10. Contact Information",
        icon: Mail,
        content: (
            <>
                <p className="mb-5">For any privacy-related inquiries or requests, please contact the JJSTrack Admin directly:</p>
                <div className="mt-4 p-5 bg-stone-50 border border-stone-200 rounded-lg shadow-sm">
                    <p className="mb-3 font-semibold text-stone-800">JJSTrack — Admin</p>
                    <p className="mb-2 text-sm flex"><span className="text-stone-500 w-24 shrink-0 font-medium">Email:</span> <a href="mailto:jjsportswear@gmail.com" className="text-blue-700 hover:text-blue-800 font-semibold underline decoration-blue-200 underline-offset-4">jjsportswear@gmail.com</a></p>
                    <p className="mb-2 text-sm flex"><span className="text-stone-500 w-24 shrink-0 font-medium">Address:</span> <span className="text-stone-700">Purok 3B National Highway, Calapacuan, Subic, Philippines</span></p>
                    <p className="mb-0 text-sm flex"><span className="text-stone-500 w-24 shrink-0 font-medium">Contact:</span> <span className="text-stone-700">0908 997 2332</span></p>
                </div>
                <p className="mt-5 text-sm text-stone-500 italic">We will respond to all legitimate requests within a reasonable timeframe in accordance with applicable data protection laws.</p>
            </>
        ),
    },
];
export function PrivacyContent({ scrollRef }) {
    const [activeSection, setActiveSection] = useState(privacySections[0].id);
    const containerRef = scrollRef;

    const scrollTo = (id) => {
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el && containerRef?.current) {
            const y = el.offsetTop - 16;
            containerRef.current.scrollTo({ top: y, behavior: "smooth" });
        }
    };

    useEffect(() => {
        const container = containerRef?.current;
        if (!container) return;

        const onScroll = () => {
            const offset = container.scrollTop + 80;
            let current = privacySections[0].id;
            privacySections.forEach(({ id }) => {
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
            <aside className="hidden lg:block w-56 shrink-0">
                <div className="sticky top-0 bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">On this page</p>
                    <ul className="space-y-1">
                        {privacySections.map((s) => {
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
            <main className="flex-1 min-w-0 space-y-4">
                {privacySections.map((s) => (
                    <Section key={s.id} section={s} />
                ))}
            </main>
        </div>
    );
}
export default function PrivacyPolicy() {
    const [activeSection, setActiveSection] = useState(privacySections[0].id);

    useEffect(() => {
        const sectionIds = privacySections.map((s) => s.id);
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
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
                    <p className="text-blue-400 font-semibold text-sm md:text-base tracking-wide uppercase inline-block px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/5">
                        Effective Date: {EFFECTIVE_DATE}
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:grid lg:grid-cols-[250px_1fr] gap-12 items-start relative">
                <TableOfContents sections={privacySections} active={activeSection} onSelect={scrollTo} />
                <main className="min-w-0">
                    {privacySections.map((s) => <Section key={s.id} section={s} />)}
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