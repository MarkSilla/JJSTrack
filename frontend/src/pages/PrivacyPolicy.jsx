import { useState } from "react";
import { Link } from "react-router-dom";
import TableOfContents from "../components/toc";
import Section from "../components/legalsection";
import img from "../assets/img";
import {
    Database, FileText, Activity, Globe,
    Users, Archive, Lock, UserCheck,
    Link2, ShieldCheck, RefreshCcw, Mail
} from "lucide-react";

const LAST_UPDATED = "March 29, 2026";
const EFFECTIVE_DATE = "March 29, 2026";

const ListItem = ({ num, title, children }) => (
    <div className="flex items-start gap-3 mb-4">
        {num && <span className="text-blue-700 font-bold shrink-0">{num}.</span>}
        <div>
            {title && <strong className="block text-stone-800 mb-1">{title}</strong>}
            <div className="text-stone-600 text-sm leading-relaxed">{children}</div>
        </div>
    </div>
);

const privacySections = [
    {
        id: "intro",
        title: "Introduction",
        icon: FileText,
        content: (
            <div className="p-5 bg-blue-50 rounded-xl text-blue-900 border border-blue-200/50 mb-6 shadow-sm">
                <p className="mb-0 leading-relaxed font-medium">
                    Welcome to JJS Track. We are committed to protecting your personal data and respecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our web application. By using JJS Track, you consent to the data practices described in this policy.
                </p>
            </div>
        )
    },
    {
        id: "info-collected",
        title: "1. Information We Collect",
        icon: Database,
        content: (
            <>
                <p className="mb-5">We collect the following categories of information when you use JJS Track:</p>

                <h4 className="text-stone-800 font-bold mb-4 mt-6 flex items-center gap-2">
                    <span className="text-blue-600 font-bold shrink-0">1.1.</span>
                    Personal Information
                </h4>
                <div className="pl-4 border-l-2 border-stone-100 ml-2">
                    <ListItem num="1.1.1" title="Full Name">Used for account identification and order management.</ListItem>
                    <ListItem num="1.1.2" title="Full Address">Used for order delivery and fulfillment purposes.</ListItem>
                    <ListItem num="1.1.3" title="Contact Number">Used to communicate order updates, confirmations, and support inquiries.</ListItem>
                    <ListItem num="1.1.4" title="Profile Photo (Optional)">May be uploaded voluntarily for personalization of your account profile.</ListItem>
                    <ListItem num="1.1.5" title="Email Address">Used for account identification and order management.</ListItem>
                    <ListItem num="1.1.6" title="Password">Stored securely for account authentication if you register directly without Google Sign-In.</ListItem>
                </div>

                <h4 className="text-stone-800 font-bold mb-4 mt-8 flex items-center gap-2">
                    <span className="text-blue-600 font-bold shrink-0">1.2.</span>
                    Authentication Data
                </h4>
                <div className="pl-4 border-l-2 border-stone-100 ml-2">
                    <ListItem num="1.2.1" title="Google Sign-In"> If you choose to sign in using Google, we may collect your full name, email address, contact number, address and profile photo from your Google account.</ListItem>
                </div>
                <p className="mb-5"><span className="font-bold text-stone-800">Purpose: </span> This data is used solely to authenticate your identity and create or manage your JJS Track account.</p>


                <h4 className="text-stone-800 font-bold mb-4 mt-8 flex items-center gap-2">
                    <span className="text-blue-600 font-bold shrink-0">1.3.</span>
                    Technical and Usage Data
                </h4>
                <div className="pl-4 border-l-2 border-stone-100 ml-2">
                    <ListItem num="1.3.1" title="IP Address">Collected for security monitoring and fraud prevention.</ListItem>
                    <ListItem num="1.3.2" title="Browser Type and Version">Collected for compatibility and system optimization.</ListItem>
                    <ListItem num="1.3.3" title="Device Information">Including operating system and screen resolution, for responsive service delivery.</ListItem>
                    <ListItem num="1.3.4" title="Usage and Activity Logs">Including pages visited, features accessed, and interaction timestamps, for service improvement.</ListItem>
                </div>
            </>
        ),
    },
    {
        id: "legal-basis",
        title: "2. Legal Basis for Processing",
        icon: FileText,
        content: (
            <>
                <p className="mb-5">JJS Track processes your personal data on the following lawful bases:</p>
                <ListItem num="2.1" title="User Consent">Where you have expressly provided consent for specific data processing activities, such as optional profile photo uploads or marketing communications.</ListItem>
                <ListItem num="2.2" title="Contractual Necessity">Processing is necessary to fulfill our obligations to you, including account creation, order placement, and delivery coordination.</ListItem>
                <ListItem num="2.3" title="Legitimate Business Interests">We process certain technical and usage data to maintain, improve, and secure our platform, provided such interests are not overridden by your fundamental rights and freedoms.</ListItem>
            </>
        ),
    },
    {
        id: "use-of-info",
        title: "3. How We Use Your Information",
        icon: Activity,
        content: (
            <>
                <p className="mb-5">The information we collect is used for the following purposes:</p>
                <ListItem num="3.1" title="Account Management">To register, authenticate, and maintain your user account on JJS Track.</ListItem>
                <ListItem num="3.2" title="Order Processing and Fulfillment">To receive, process, track, and deliver your jersey orders and repair service requests.</ListItem>
                <ListItem num="3.3" title="Customer Support and Communication">To respond to inquiries, provide order status updates, and resolve issues in a timely manner.</ListItem>
                <ListItem num="3.4" title="System Improvement and Analytics">To analyze usage patterns, diagnose technical issues, and improve the overall user experience of the platform.</ListItem>

                <div className="mt-6 p-4 bg-stone-50 border border-stone-200 rounded-lg text-sm italic text-stone-500">
                    We do not use your data for automated decision-making or profiling that would produce legal or similarly significant effects on you.
                </div>
            </>
        ),
    },
    {
        id: "cookies",
        title: "4. Cookies and Tracking Technologies",
        icon: Globe,
        content: (
            <>
                <p className="mb-5">JJS Track uses cookies and similar tracking technologies to enhance your browsing experience and ensure the platform functions correctly.</p>
                <ListItem num="4.1" title="Session Cookies">These are temporary cookies used to maintain your authenticated session while you are logged in. They are deleted automatically when you close your browser.</ListItem>
                <ListItem num="4.2" title="Analytics Cookies">We may use third-party analytics tools that place cookies to help us understand how users interact with our platform. This data is aggregated and anonymized where possible.</ListItem>
                <ListItem num="4.3" title="Preference Cookies">Used to store your display preferences and other settings to personalize your experience.</ListItem>

                <p className="mt-5 text-sm text-stone-500">You may configure your browser to refuse cookies or alert you when cookies are being sent. However, disabling certain cookies may affect the functionality of the platform, including your ability to remain signed in.</p>
            </>
        ),
    },
    {
        id: "data-sharing",
        title: "5. Data Sharing and Disclosure",
        icon: Users,
        content: (
            <>
                <p className="mb-5">JJS Track does not sell, rent, or trade your personal information to third parties. We may share your data in the following limited circumstances:</p>
                <ListItem num="5.1" title="Service Providers">We engage trusted third-party service providers, including Google for authentication services, to facilitate the operation of our platform. These providers are bound by confidentiality obligations and are not permitted to use your data for any purpose other than providing services to JJS Track.</ListItem>
                <ListItem num="5.2" title="Legal Compliance">We may disclose your information if required to do so by applicable law, court order, governmental authority, or law enforcement agency, or when we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others.</ListItem>
                <ListItem num="5.3" title="Business Transfers">In the event of a merger, acquisition, or sale of assets, your personal data may be transferred to the succeeding entity, provided that entity agrees to honor this Privacy Policy.</ListItem>
            </>
        ),
    },
    {
        id: "data-retention",
        title: "6. Data Retention",
        icon: Archive,
        content: (
            <>
                <p className="mb-5">We retain your personal data only for as long as is necessary to fulfill the purposes for which it was collected, including to satisfy any legal, accounting, or reporting requirements. Specifically:</p>
                <ListItem num="6.1">Account data is retained for the duration of your active account registration.</ListItem>
                <ListItem num="6.2">Order data is retained for a period necessary to fulfill legal and business obligations, including warranty claims and financial record-keeping.</ListItem>
                <ListItem num="6.3">Upon account deletion or upon your written request, we will delete or anonymize your personal data, subject to any overriding legal obligations to retain such data.</ListItem>
            </>
        ),
    },
    {
        id: "data-security",
        title: "7. Data Security",
        icon: Lock,
        content: (
            <>
                <p className="mb-5">JJS Track employs industry-standard technical and organizational safeguards to protect your personal information from unauthorized access, disclosure, alteration, or destruction. These measures include:</p>
                <ListItem num="7.1" title="Encryption">Data transmitted between your browser and our servers is encrypted using Secure Socket Layer (SSL/TLS) protocols.</ListItem>
                <ListItem num="7.2" title="Secure Servers">Personal data is stored on secured servers with access controls and monitoring in place.</ListItem>
                <ListItem num="7.3" title="Restricted Access">Access to personal data is limited to authorized personnel who require it to perform their job functions.</ListItem>
                <ListItem num="7.4" title="Regular Security Reviews">We conduct periodic reviews of our security practices to identify and mitigate risks.</ListItem>

                <p className="mt-5 text-sm text-stone-500 italic">While we strive to implement robust security measures, no method of electronic transmission or storage is completely secure. We cannot guarantee absolute security and disclaim liability for breaches outside our reasonable control.</p>
            </>
        ),
    },
    {
        id: "user-rights",
        title: "8. Your Rights",
        icon: UserCheck,
        content: (
            <>
                <p className="mb-5">Subject to applicable law, you have the following rights with respect to your personal data:</p>
                <ListItem num="8.1" title="Right of Access">You may request a copy of the personal data we hold about you.</ListItem>
                <ListItem num="8.2" title="Right to Rectification">You may request correction of inaccurate or incomplete personal data.</ListItem>
                <ListItem num="8.3" title="Right to Erasure">You may request deletion of your personal data where it is no longer necessary for the purposes for which it was collected, subject to legal retention requirements.</ListItem>
                <ListItem num="8.4" title="Right to Withdraw Consent">Where processing is based on your consent, you may withdraw such consent at any time without affecting the lawfulness of prior processing.</ListItem>
                <ListItem num="8.5" title="Right to Restrict Processing">In certain circumstances, you may request that we limit the processing of your data.</ListItem>

                <p className="mt-5 text-sm text-stone-500">To exercise any of these rights, please contact us using the contact information provided in Section 12 of this Policy.</p>
            </>
        ),
    },
    {
        id: "third-party",
        title: "9. Third-Party Services",
        icon: Link2,
        content: (
            <>
                <p className="mb-5">JJS Track integrates with the following third-party services, which have their own privacy practices and policies:</p>
                <ListItem num="9.1" title="Google Sign-In">When you authenticate via Google, your data is also subject to Google's Privacy Policy, available at <a href="https://policies.google.com/privacy" className="text-blue-600 underline hover:text-blue-700 font-medium" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a>. We encourage you to review Google's policies to understand how your data is handled by them.</ListItem>

                <p className="mt-5 text-sm text-stone-500">We are not responsible for the privacy practices of third-party services integrated with JJS Track. We recommend reviewing their respective privacy policies before using such features.</p>
            </>
        ),
    },
    {
        id: "childrens-privacy",
        title: "10. Children's Privacy",
        icon: ShieldCheck,
        content: (
            <>
                <p className="mb-4">JJS Track is not intended for use by individuals under the age of thirteen (13). We do not knowingly collect personal information from children under 13 years of age. If we become aware that we have inadvertently collected personal information from a child under 13, we will take prompt steps to delete such data.</p>
                <p className="mb-0">If you are a parent or guardian and believe that your child has provided us with personal information without your consent, please contact us immediately using the information provided in Section 12.</p>
            </>
        ),
    },
    {
        id: "policy-changes",
        title: "11. Changes to This Privacy Policy",
        icon: RefreshCcw,
        content: (
            <>
                <p className="mb-5">JJS Track reserves the right to update or modify this Privacy Policy at any time. In the event of material changes, we will notify users through one or more of the following methods:</p>
                <ListItem num="11.1">A prominent notice posted on the JJS Track platform.</ListItem>
                <ListItem num="11.2">An email notification to registered users where feasible.</ListItem>
                <ListItem num="11.3">An updated "Last Updated" date at the top of this Policy.</ListItem>

                <p className="mt-5 text-sm">Your continued use of the platform following notification of changes constitutes your acceptance of the revised Privacy Policy. We encourage you to periodically review this Policy to stay informed about how we are protecting your information.</p>
            </>
        ),
    },
    {
        id: "contact",
        title: "12. Contact Information",
        icon: Mail,
        content: (
            <>
                <p className="mb-5">If you have any questions, concerns, or requests regarding this Privacy Policy or our data processing practices, please contact us at:</p>
                <div className="mt-4 p-5 bg-stone-50 border border-stone-200 rounded-lg shadow-sm">
                    <p className="mb-3 font-semibold text-stone-800">JJS Track — System Administrator</p>
                    <p className="mb-2 text-sm flex"><span className="text-stone-500 w-24 shrink-0 font-medium">Email:</span> <a href="mailto:jjsportswear@gmail.com" className="text-blue-700 hover:text-blue-800 font-semibold underline decoration-blue-200 underline-offset-4">jjsportswear@gmail.com</a></p>
                    <p className="mb-2 text-sm flex"><span className="text-stone-500 w-24 shrink-0 font-medium">Address:</span> <span className="text-stone-700">Purok 3B National Highway, Calapacuan, Subic, Philippines</span></p>
                    <p className="mb-0 text-sm flex"><span className="text-stone-500 w-24 shrink-0 font-medium">Contact:</span> <span className="text-stone-700">0908 997 2332</span></p>
                    <p className="mb-0 text-sm flex"><span className="text-stone-500 w-24  shrink-0 font-medium">Facebook:</span><a href="https://www.facebook.com/JennoelJennyl" className="text-blue-700 hover:text-blue-800 font-semibold  ">JJSportswear</a></p>
                </div>
                <p className="mt-5 text-sm text-stone-500 italic">We will respond to all legitimate requests within a reasonable timeframe and in accordance with applicable data protection laws.</p>
            </>
        ),
    },
];

export default function PrivacyPolicy() {
    const [activeSection, setActiveSection] = useState(null);

    const scrollTo = (id) => {
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 font-inter">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={img.jjslogo1} alt="JJS Logo" className="w-12 h-12 object-contain" />
                        <span className="font-bold text-stone-800 text-lg">JJS Track</span>
                    </div>
                    <span className="text-sm font-medium text-stone-500">
                        Last Updated: <span className="text-stone-800">{LAST_UPDATED}</span>
                    </span>
                </div>
            </header>

            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-stone-800 to-stone-900 text-white py-16 md:py-24 text-center">
                <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none">
                    <span className="font-bold text-[15rem] leading-none select-none tracking-tighter">JJS</span>
                </div>
                <div className="relative z-10 px-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
                    <p className="text-blue-400 font-semibold text-sm md:text-base tracking-wide uppercase shadow-sm inline-block px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/5">
                        Effective Date: {EFFECTIVE_DATE}
                    </p>
                </div>
            </div>
            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:grid lg:grid-cols-[250px_1fr] gap-12 items-start relative">
                <TableOfContents
                    sections={privacySections}
                    active={activeSection}
                    onSelect={scrollTo}
                />

                <main className="min-w-0">
                    {privacySections.map((s) => (
                        <Section key={s.id} section={s} />
                    ))}
                </main>
            </div>

            {/* Footer */}
            <footer className="mt-12 py-10 bg-stone-100 border-t border-stone-200 text-stone-500">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img src={img.jjslogo1} alt="JJS Logo" className="w-9 h-9 object-contain" />
                        <span className="font-bold text-stone-800 text-sm opacity-80">JJS Track</span>
                    </div>
                    <div className="text-xs font-medium">
                        © {new Date().getFullYear()} JJS Track. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}