import { useState } from "react";
import { Link } from "react-router-dom";
import TableOfContents from "../components/toc";
import Section from "../components/legalsection";
import img from "../assets/img";
import {
    CheckCircle, UserCheck, Lock, CreditCard,
    RefreshCcw, XCircle, Clock, Wrench,
    Truck, Copyright, Ban, AlertTriangle,
    AlertOctagon, Scale, FileText
} from "lucide-react";

const LAST_UPDATED = "March 29, 2026";
const EFFECTIVE_DATE = "March 29, 2026";

const ListItem = ({ num, title, children }) => (
    <div className="flex items-start gap-4 mb-5">
        {num && <span className="text-blue-700 font-bold shrink-0">{num}.</span>}
        <div>
            {title && <strong className="block text-stone-800 mb-1">{title}</strong>}
            <div className="text-stone-600 text-sm leading-relaxed">{children}</div>
        </div>
    </div>
);

const termsSections = [
    {
        id: "intro",
        title: "Introduction",
        icon: FileText,
        content: (
            <div className="p-5 bg-blue-50 rounded-xl text-blue-900 border border-blue-200/50 mb-6 shadow-sm">
                <p className="mb-0 leading-relaxed font-medium">
                    Welcome to JJS Track. These Terms of Use constitute a legally binding agreement made between you and JJS Track concerning your access to and use of the web application. By accessing the site, you agree to be bound by these Terms of Use.
                </p>
            </div>
        )
    },
    {
        id: "acceptance",
        title: "1. Acceptance of Terms",
        icon: CheckCircle,
        content: (
            <>
                <ListItem num="1.1">By accessing, registering on, or using the JJS Track web application (the "Platform"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Use ("Terms"), as well as our Privacy Policy, which is incorporated herein by reference.</ListItem>
                <ListItem num="1.2">If you do not agree to these Terms, you must immediately cease use of the Platform. Continued use of the Platform constitutes ongoing acceptance of these Terms as amended from time to time.</ListItem>
            </>
        ),
    },
    {
        id: "user-responsibilities",
        title: "2. User Responsibilities",
        icon: UserCheck,
        content: (
            <>
                <p className="mb-5">As a user of JJS Track, you represent and warrant that:</p>
                <ListItem num="2.1">All information you provide during registration and order placement is accurate, current, and complete.</ListItem>
                <ListItem num="2.2">You will promptly update your account information in the event of any changes.</ListItem>
                <ListItem num="2.3">You will use the Platform solely for lawful purposes and in a manner consistent with these Terms.</ListItem>
                <ListItem num="2.4">You will not engage in any conduct that disrupts, damages, or impairs the Platform or the experience of other users.</ListItem>
                <ListItem num="2.5">You are at least 13 years of age or have obtained verifiable parental or guardian consent.</ListItem>

                <p className="mt-5 text-sm italic text-stone-500">Providing false, misleading, or fraudulent information may result in immediate suspension or termination of your account.</p>
            </>
        ),
    },
    {
        id: "account-security",
        title: "3. Account Registration and Security",
        icon: Lock,
        content: (
            <>
                <p className="mb-5">To access certain features of JJS Track, you must register and create an account. In doing so, you agree to:</p>
                <ListItem num="3.1">Maintain the confidentiality of your account credentials, including your password and any linked authentication tokens.</ListItem>
                <ListItem num="3.2">Not share your account access with any other person.</ListItem>
                <ListItem num="3.3">Notify JJS Track immediately of any unauthorized access to or use of your account.</ListItem>

                <p className="mt-5 text-sm italic text-stone-500">JJS Track will not be liable for any loss or damage arising from your failure to maintain the confidentiality of your credentials. You are solely responsible for all activities that occur under your account.</p>
            </>
        ),
    },
    {
        id: "orders-payments",
        title: "4. Orders and Payment Policy",
        icon: CreditCard,
        content: (
            <>
                <p className="mb-5">JJS Track facilitates the ordering and tracking of team and organizational jerseys. The following payment terms apply to all orders:</p>
                <ListItem num="4.1" title="Full Payment Required Prior to Production">All jersey orders must be paid in full before the production process commences. JJS Track will not begin manufacturing or processing any order until complete payment has been received and confirmed.</ListItem>
                <ListItem num="4.2" title="No Release Without Full Payment">Completed orders will not be released, dispatched, or made available for pickup until full payment has been settled. Partial payments do not entitle a user to claim any portion of an order.</ListItem>
                <ListItem num="4.3" title="Payment Confirmation">Users will receive a payment confirmation notification upon successful processing. It is your responsibility to retain proof of payment.</ListItem>

                <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 shadow-sm flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <strong className="block text-amber-800 mb-2">4.4 Minimum Downpayment Requirement</strong>
                        <p className="mb-0 text-sm leading-relaxed text-amber-800 font-medium">
                            A minimum downpayment of fifty percent (50%) of the total order value is required for an order to be accepted and scheduled for processing. Orders without the required downpayment shall not be processed under any circumstances.
                        </p>
                    </div>
                </div>

                <p className="mt-5 text-sm text-stone-500 italic">JJS Track reserves the right to place orders on hold in the event of payment disputes or failed transactions.</p>
            </>
        ),
    },
    {
        id: "refund-policy",
        title: "5. Refund Policy",
        icon: RefreshCcw,
        content: (
            <>
                <p className="mb-5">JJS Track is committed to customer satisfaction. The following refund conditions apply:</p>
                <ListItem num="5.1" title="Eligibility">A full refund will be issued if an order is not delivered to the user within three (3) weeks from the confirmed production completion date, provided the delay is attributable to JJS Track and not caused by events beyond our control (see Section 9).</ListItem>
                <ListItem num="5.2" title="Refund Process">To initiate a refund, users must submit a refund request through the Platform's support portal, citing the order reference number and delivery delay details.</ListItem>
                <ListItem num="5.3" title="Non-Refundable Scenarios">Refunds will not be issued for delays caused by incorrect address information provided by the user, force majeure events, or circumstances expressly outside JJS Track's control.</ListItem>

                <p className="mt-5 text-sm italic text-stone-500">All refund requests are subject to review and will be processed within a reasonable period upon approval.</p>
            </>
        ),
    },
    {
        id: "cancellation",
        title: "6. Order Cancellation Policy",
        icon: XCircle,
        content: (
            <>
                <p className="mb-5">Users may request cancellation of a jersey order only under the following conditions:</p>
                <ListItem num="6.1">The order has not yet been confirmed by JJS Track administration; or</ListItem>
                <ListItem num="6.2">Production of the order has not yet commenced.</ListItem>

                <div className="mt-6 mb-4">
                    <p className="text-sm text-stone-600 leading-relaxed">Once an order has been confirmed and production has begun, cancellation requests will not be entertained. JJS Track will not be obligated to issue refunds for orders that have entered the production phase at the time of cancellation request.</p>
                </div>

                <p className="mt-4 text-sm text-stone-500 italic">To submit a cancellation request, please contact JJS Track support through the Platform as early as possible after placing the order.</p>
            </>
        ),
    },
    {
        id: "late-orders",
        title: "7. Late and Additional Orders ('Pahabol' Orders)",
        icon: Clock,
        content: (
            <>
                <p className="mb-5">JJS Track accommodates late or additional orders ("Pahabol") at its discretion. However, users placing such orders acknowledge and accept the following:</p>
                <ListItem num="7.1">Late orders are subject to placement at the end of the current production queue and may result in extended delivery timelines.</ListItem>
                <ListItem num="7.2">JJS Track does not guarantee that Pahabol orders will be fulfilled within the same timeframe as regular orders.</ListItem>
                <ListItem num="7.3">Users placing late orders expressly waive any claims for delivery delay refunds specifically attributable to the queue position of such orders.</ListItem>

                <p className="mt-5 text-sm italic text-stone-500">JJS Track will make reasonable efforts to inform users of projected delivery timelines for late orders upon confirmation.</p>
            </>
        ),
    },
    {
        id: "repair-services",
        title: "8. Repair Services Policy",
        icon: Wrench,
        content: (
            <>
                <p className="mb-5">JJS Track offers repair services for eligible jersey items. The following terms govern repair service requests:</p>

                <div className="mb-5">
                    <h4 className="text-stone-800 font-bold mb-4 flex items-center gap-2">
                        <span className="text-blue-600 font-bold shrink-0">8.1.</span>
                        Cancellation of Repair Requests
                    </h4>
                    <p className="text-sm text-stone-600 mb-4 pl-4 border-l-2 border-stone-100 ml-2">A repair service request may be canceled only if:</p>
                    <div className="pl-6 border-l-2 border-stone-100 ml-2">
                        <ListItem num="8.1.1">The cancellation request is submitted within twenty-four (24) hours of placing the repair order; or</ListItem>
                        <ListItem num="8.1.2">The item subject to repair has not yet been physically delivered to the JJS Track shop.</ListItem>
                    </div>
                </div>

                <ListItem num="8.2">Once the item has been received at our facility and repair work has commenced, the request cannot be canceled.</ListItem>
                <ListItem num="8.3">JJS Track is not responsible for any pre-existing damage beyond the scope of the repair request.</ListItem>

                <p className="mt-5 text-sm italic text-stone-500">All repair services are subject to availability and assessment by JJS Track staff.</p>
            </>
        ),
    },
    {
        id: "delivery-delays",
        title: "9. Delivery and Delays",
        icon: Truck,
        content: (
            <>
                <p className="mb-5">JJS Track strives to fulfill all orders within the estimated timelines communicated at the time of order confirmation. However, you acknowledge and agree that:</p>
                <ListItem num="9.1">Delivery timelines may be affected by high order volumes, production capacity constraints, or unforeseen operational disruptions.</ListItem>
                <ListItem num="9.2">JJS Track shall not be held liable for delays caused by force majeure events, including but not limited to natural disasters, public health emergencies, government-imposed restrictions, or other circumstances beyond our reasonable control.</ListItem>
                <ListItem num="9.3">In the event of a delay, JJS Track will make reasonable efforts to communicate revised timelines to affected users through the Platform.</ListItem>

                <p className="mt-5 text-sm italic text-stone-500">Users are encouraged to plan orders well in advance of required delivery dates to account for potential delays.</p>
            </>
        ),
    },
    {
        id: "intellectual-property",
        title: "10. Intellectual Property",
        icon: Copyright,
        content: (
            <>
                <ListItem num="10.1">All content, materials, branding, trademarks, graphics, software, and other intellectual property appearing on or within the JJS Track Platform are the exclusive property of JJS Track or its licensors, and are protected by applicable intellectual property laws.</ListItem>

                <p className="mb-5 mt-4 text-sm text-stone-600 leading-relaxed">You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the Platform for your personal and transactional purposes in accordance with these Terms. This license does not permit you to:</p>

                <div className="bg-stone-50 rounded-lg p-5 border border-stone-200 mb-4">
                    <ListItem num="10.2">Copy, reproduce, modify, distribute, or create derivative works of any Platform content without prior written consent.</ListItem>
                    <ListItem num="10.3">Use JJS Track's trademarks, logos, or branding for any commercial purpose.</ListItem>
                    <ListItem num="10.4">Reverse engineer or attempt to extract the source code of the Platform.</ListItem>
                </div>

                <p className="mt-4 text-sm font-medium text-stone-700">Any unauthorized use of JJS Track's intellectual property constitutes a material breach of these Terms.</p>
            </>
        ),
    },
    {
        id: "prohibited-activities",
        title: "11. Prohibited Activities",
        icon: Ban,
        content: (
            <>
                <p className="mb-5">Users of JJS Track are strictly prohibited from engaging in the following activities:</p>
                <ListItem num="11.1">Misrepresenting your identity or impersonating any person or entity.</ListItem>
                <ListItem num="11.2">Engaging in fraudulent transactions or submitting false order information.</ListItem>
                <ListItem num="11.3">Attempting to gain unauthorized access to any portion of the Platform, other user accounts, or our systems.</ListItem>
                <ListItem num="11.4">Introducing malware, viruses, or any harmful code into the Platform.</ListItem>
                <ListItem num="11.5">Scraping, harvesting, or otherwise extracting data from the Platform without authorization.</ListItem>
                <ListItem num="11.6">Using the Platform for any illegal purpose or in violation of any applicable law or regulation.</ListItem>
                <ListItem num="11.7">Harassing, threatening, or abusing other users or JJS Track personnel.</ListItem>

                <p className="mt-5 text-sm italic text-stone-500">Violation of any of the above may result in immediate account suspension or termination, and may be reported to appropriate law enforcement authorities.</p>
            </>
        ),
    },
    {
        id: "liability",
        title: "12. Limitation of Liability",
        icon: AlertTriangle,
        content: (
            <>
                <p className="mb-5">To the fullest extent permitted by applicable law, JJS Track, its officers, employees, and affiliates shall not be liable for:</p>
                <ListItem num="12.1">Any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the Platform.</ListItem>
                <ListItem num="12.2">Loss of data, revenue, profits, or business opportunities resulting from Platform downtime or service interruptions.</ListItem>
                <ListItem num="12.3">Delays in order production or delivery caused by third parties, force majeure, or circumstances outside our reasonable control.</ListItem>
                <ListItem num="12.4">Any issues, disputes, or losses arising from third-party services integrated with the Platform, including Google authentication services.</ListItem>

                <p className="mt-5 text-sm font-medium text-stone-700 p-4 bg-stone-50 rounded-lg border border-stone-200">Our total aggregate liability to you for any claim arising under or in connection with these Terms shall not exceed the total amount paid by you for the specific order or service giving rise to the claim.</p>
            </>
        ),
    },
    {
        id: "termination",
        title: "13. Termination of Access",
        icon: AlertOctagon,
        content: (
            <>
                <p className="mb-5">JJS Track reserves the right, at its sole discretion, to suspend, restrict, or permanently terminate your access to the Platform at any time, without prior notice, if:</p>
                <ListItem num="13.1">You have violated any provision of these Terms.</ListItem>
                <ListItem num="13.2">We receive credible reports of fraudulent, abusive, or unlawful conduct associated with your account.</ListItem>
                <ListItem num="13.3">Your continued use poses a risk to the security or integrity of the Platform or its users.</ListItem>
                <ListItem num="13.4">We are required to do so by applicable law or regulatory authority.</ListItem>

                <p className="mt-5 text-sm text-stone-600">Upon termination, your right to access the Platform ceases immediately. JJS Track shall not be liable for any losses or damages resulting from a termination carried out in accordance with these Terms.</p>
            </>
        ),
    },
    {
        id: "governing-law",
        title: "14. Governing Law and Dispute Resolution",
        icon: Scale,
        content: (
            <>
                <ListItem num="14.1">These Terms of Use shall be governed by and construed in accordance with the laws of the Republic of the Philippines, without regard to its conflict of laws provisions.</ListItem>
                <ListItem num="14.2">Any dispute, claim, or controversy arising out of or relating to these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the competent courts of the Philippines.</ListItem>
                <ListItem num="14.3">Prior to initiating any formal legal proceedings, the parties agree to make a good faith effort to resolve disputes through direct communication with JJS Track support.</ListItem>
            </>
        ),
    },
    {
        id: "terms-changes",
        title: "15. Changes to These Terms",
        icon: FileText,
        content: (
            <>
                <p className="mb-5">JJS Track reserves the right to modify these Terms of Use at any time. When we make material changes, we will:</p>
                <ListItem num="15.1">Update the "Last Updated" date at the top of this document.</ListItem>
                <ListItem num="15.2">Display a notice on the Platform informing users of the changes.</ListItem>
                <ListItem num="15.3">Where possible, provide advance notice of significant changes via email or in-platform notification.</ListItem>

                <p className="mt-5 text-sm text-stone-600">Your continued use of JJS Track following the posting of revised Terms constitutes your acceptance of the updated Terms. If you do not agree to the revised Terms, you must discontinue use of the Platform.</p>
            </>
        ),
    },
];

export default function TermsOfUse() {
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
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Terms of Use</h1>
                    <p className="text-blue-400 font-semibold text-sm md:text-base tracking-wide uppercase shadow-sm inline-block px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/5">
                        Effective Date: {EFFECTIVE_DATE}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:grid lg:grid-cols-[250px_1fr] gap-12 items-start relative">
                <TableOfContents
                    sections={termsSections}
                    active={activeSection}
                    onSelect={scrollTo}
                />

                <main className="min-w-0">
                    {termsSections.map((s) => (
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