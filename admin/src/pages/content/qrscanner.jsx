import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import {
    QrCode, CheckCircle2, AlertCircle, X,
    PackageCheck, ChevronLeft, Loader,
    ScanLine, User, Wrench, CalendarDays, Hash,
    Camera, Info, ChevronDown, ChevronUp, Upload,
    Zap, ShieldCheck
} from 'lucide-react';
import { orderApi } from '../../services/orderApi';
import { bookingApi } from '../../services/bookingApi';

const STEPS = [
    {
        icon: Camera,
        title: 'Allow Camera Access',
        desc: 'Click "Request Camera Permissions" when prompted by your browser.',
        badge: '01',
    },
    {
        icon: QrCode,
        title: 'Align the QR Code',
        desc: 'Hold the customer\'s QR code steady inside the blue scanning frame.',
        badge: '02',
    },
    {
        icon: ShieldCheck,
        title: 'Confirm & Release',
        desc: 'Review order details, then tap "Release Item" to mark it as picked up.',
        badge: '03',
    },
    {
        icon: Upload,
        title: 'Or Upload an Image',
        desc: 'Switch to the file tab and upload a QR code image if camera isn\'t available.',
        badge: '04',
    },
];

export default function QRScanner() {
    const navigate = useNavigate();
    const [scanResult, setScanResult] = useState(null);
    const [scannedOrder, setScannedOrder] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isReleasing, setIsReleasing] = useState(false);
    const [released, setReleased] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const html5QrcodeScanner = useRef(null);
    const scanResultRef = useRef(null);

    useEffect(() => {
        if (html5QrcodeScanner.current) return;

        html5QrcodeScanner.current = new Html5QrcodeScanner(
            'qr-reader',
            {
                fps: 10,
                qrbox: { width: 220, height: 220 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                showZoomSliderIfSupported: true,
                supportedScanTypes: [
                    Html5QrcodeScanType.SCAN_TYPE_CAMERA,
                    Html5QrcodeScanType.SCAN_TYPE_FILE,
                ],
            },
            false
        );

        html5QrcodeScanner.current.render(onScanSuccess, () => {});

        return () => {
            if (html5QrcodeScanner.current) {
                html5QrcodeScanner.current.clear().catch(() => {});
                html5QrcodeScanner.current = null;
            }
        };
    }, []);

    const onScanSuccess = async (decodedText) => {
        if (scanResultRef.current === decodedText) return;
        scanResultRef.current = decodedText;
        setScanResult(decodedText);
        setScanError(null);
        setIsLoading(true);

        try {
            let scannedId = decodedText;
            try {
                const parsed = JSON.parse(decodedText);
                scannedId = parsed.orderId || parsed.bookingId || parsed.id || decodedText;
            } catch {
                scannedId = decodedText;
            }

            let order = null;
            let isBooking = false;

            try {
                const res = await orderApi.getOrderById(scannedId);
                if (res?.success && res?.data) order = res.data;
                else if (res?.data) order = res.data;
            } catch (err) {
                if (err.response?.status === 404) { /* try booking */ }
            }

            if (!order) {
                try {
                    const res = await bookingApi.getBookingById(scannedId);
                    if (res?.success && res?.data) { order = res.data; isBooking = true; }
                    else if (res?.data) { order = res.data; isBooking = true; }
                } catch (err) {
                    const status = err.response?.status;
                    if (status === 404 || status === 500) {
                        try {
                            const releaseRes = await bookingApi.markAsPickedUp(scannedId);
                            if (releaseRes?.success) {
                                setReleased(true);
                                setScannedOrder(null);
                                setScanResult(null);
                                setScanError(null);
                                return;
                            } else {
                                const errorMsg = releaseRes?.message || '';
                                if (errorMsg.toLowerCase().includes('already')) {
                                    setScanError('This order is already marked as received and cannot be released again.');
                                    return;
                                }
                            }
                        } catch (releaseErr) {
                            if (releaseErr.response?.status === 400) {
                                const errMsg = releaseErr.response?.data?.message || '';
                                if (errMsg.toLowerCase().includes('not found')) {
                                    setScanError(`Order ID "${scannedId}" does not exist. Please scan a valid QR code.`);
                                } else if (errMsg.toLowerCase().includes('already')) {
                                    setScanError('This order is already marked as received and cannot be released again.');
                                } else {
                                    setScanError(errMsg || 'Invalid order ID — cannot find in system.');
                                }
                                return;
                            }
                        }
                    }
                }
            }

            if (order) {
                const isAlreadyReleased = order.status === 'Released' || order.status === 'Completed' || order.released || order.isPickedUp;
                if (isAlreadyReleased) {
                    setScanError('This order is already marked as received and cannot be released again.');
                    setScannedOrder(null);
                } else {
                    setScannedOrder({ ...order, isBooking });
                }
            } else {
                setScanError(`Order ID "${scannedId}" not found in system. This QR code may be invalid or expired.`);
            }
        } catch (err) {
            setScanError(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRelease = async () => {
        if (!scannedOrder) return;
        setIsReleasing(true);
        try {
            const response = scannedOrder.isBooking
                ? await bookingApi.markAsPickedUp(scannedOrder._id)
                : await orderApi.markAsReleased(scannedOrder._id);

            if (response.success) {
                setReleased(true);
                scanResultRef.current = null;
                setTimeout(() => {
                    setReleased(false);
                    setScannedOrder(null);
                    setScanResult(null);
                    setScanError(null);
                }, 2500);
            } else {
                const errorMsg = response.message || 'Failed to release order.';
                if (errorMsg.toLowerCase().includes('already')) {
                    setScanError('This order is already marked as received and cannot be released again.');
                } else {
                    setScanError(errorMsg);
                }
                setScannedOrder(null);
            }
        } catch (err) {
            const errorMsg = err.message || '';
            if (errorMsg.toLowerCase().includes('already')) {
                setScanError('This order is already marked as received and cannot be released again.');
            } else {
                setScanError(`Error releasing: ${err.message}`);
            }
        } finally {
            setIsReleasing(false);
        }
    };

    const handleCancel = () => {
        setScannedOrder(null);
        setScanResult(null);
        setScanError(null);
        scanResultRef.current = null;
    };

    const orderDetails = scannedOrder ? [
        { icon: User,         label: 'Customer', value: scannedOrder.contact?.fullName || scannedOrder.customer || 'N/A' },
        { icon: Wrench,       label: 'Service',  value: scannedOrder.service || scannedOrder.serviceType || 'N/A' },
        { icon: Hash,         label: 'Item',     value: scannedOrder.item || 'N/A' },
        { icon: CalendarDays, label: 'Date',     value: new Date(scannedOrder.createdAt || scannedOrder.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
    ] : [];

    return (
        <div className="min-h-screen font-sans">

            {/* ── Header ── */}
            <header className="sticky top-0 z-20 border-b border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3 px-4 lg:px-8 py-4 max-w-2xl mx-auto">
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border-0 cursor-pointer shrink-0"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                            <QrCode size={17} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-bold text-white leading-tight tracking-tight">QR Scanner</h1>
                            <p className="text-xs text-slate-500 leading-tight">Release items by scanning</p>
                        </div>
                    </div>

                    {/* Live indicator */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isLoading ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                        {isLoading ? 'Reading' : 'Live'}
                    </div>
                </div>
            </header>

            <main className="px-4 lg:px-8 py-5 max-w-2xl mx-auto space-y-4 pb-16">

                {/* ── Scanner Card ── */}
                <div className="rounded-2xl overflow-hidden border border-white/8 shadow-2xl shadow-black/40">

                    {/* Camera viewport */}
                    <div className="relative aspect-square">
                        <div id="qr-reader" className="w-full h-full" />

                        {/* Scan frame — corners only */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="relative w-52 h-52">
                                {/* TL */}
                                <span className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
                                {/* TR */}
                                <span className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
                                {/* BL */}
                                <span className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
                                {/* BR */}
                                <span className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />

                                {/* Scanline */}
                                <span className="absolute left-2 right-2 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-bounce opacity-80" />
                            </div>
                        </div>

                        {/* Bottom label */}
                        <div className="absolute bottom-0 inset-x-0 flex items-end justify-center pb-3 pointer-events-none">
                            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <ScanLine size={11} className="text-blue-400" />
                                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Align QR code in frame</span>
                            </div>
                        </div>
                    </div>

                    {/* Scanner controls label strip */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <Zap size={13} className="text-blue-400" />
                            <span className="text-xs font-semibold text-slate-400">Auto-detects camera &amp; file upload</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-800 px-2 py-0.5 rounded-md">10 fps</span>
                    </div>
                </div>

                {/* ── How to Use (collapsible) ── */}
                <div className="rounded-2xl border border-white/8 bg-slate-900 overflow-hidden">
                    <button
                        onClick={() => setShowInstructions(v => !v)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer border-0 bg-transparent hover:bg-white/3 transition-colors"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                                <Info size={13} className="text-blue-400" />
                            </div>
                            <span className="text-sm font-bold text-white">How to Use</span>
                        </div>
                        {showInstructions
                            ? <ChevronUp size={15} className="text-slate-500" />
                            : <ChevronDown size={15} className="text-slate-500" />
                        }
                    </button>

                    {showInstructions && (
                        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white/5">
                            {STEPS.map(({ icon: Icon, title, desc, badge }) => (
                                <div
                                    key={badge}
                                    className="flex gap-3 bg-slate-800/50 rounded-xl p-4 border border-white/5"
                                >
                                    <div className="shrink-0 flex flex-col items-center gap-1.5">
                                        <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                                            <Icon size={14} className="text-blue-400" />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-600 tabular-nums">{badge}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white mb-0.5">{title}</p>
                                        <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Tip banner */}
                            <div className="sm:col-span-2 flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3">
                                <span className="text-amber-400 mt-0.5 shrink-0">⚠</span>
                                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                                    <strong className="text-amber-300">Tip:</strong> Each QR code can only be released once. If an order shows "already received", it was previously released in the system.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Error State ── */}
                {scanError && (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/8 p-4 flex items-start gap-3.5">
                        <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                            <AlertCircle size={15} className="text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-xs font-bold text-red-300 mb-1">Scan Failed</p>
                            <p className="text-[11px] text-red-400/80 leading-relaxed">{scanError}</p>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="text-red-500/50 hover:text-red-400 transition-colors cursor-pointer border-0 bg-transparent p-1.5 rounded-lg hover:bg-red-500/10 shrink-0"
                        >
                            <X size={15} />
                        </button>
                    </div>
                )}

                {/* ── Released Success ── */}
                {released && (
                    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={30} className="text-emerald-400" />
                        </div>
                        <p className="text-lg font-black text-white mb-1 tracking-tight">Item Released!</p>
                        <p className="text-xs text-emerald-400/70 font-medium">Marked as picked up. Ready to scan next order.</p>
                        <div className="mt-4 inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            <CheckCircle2 size={11} />
                            Status updated
                        </div>
                    </div>
                )}

                {/* ── Order Detail Card ── */}
                {!released && scannedOrder && (
                    <div className="rounded-2xl border border-white/8 bg-slate-900 overflow-hidden shadow-xl shadow-black/30">

                        {/* Card header */}
                        <div className="flex items-center gap-3 px-5 py-4 bg-emerald-500/8 border-b border-emerald-500/15">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white">Order Found</p>
                                <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">{scannedOrder._id}</p>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="text-slate-600 hover:text-slate-300 transition-colors cursor-pointer border-0 bg-transparent p-1.5 rounded-lg hover:bg-white/5 shrink-0"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Details grid */}
                        <div className="p-5">
                            <div className="grid grid-cols-2 gap-2.5 mb-4">
                                {orderDetails.map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="bg-slate-800/60 rounded-xl p-3.5 border border-white/5">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Icon size={11} className="text-blue-400 shrink-0" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
                                        </div>
                                        <p className="text-xs font-bold text-white truncate">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Type badge */}
                            <div className="mb-4 flex">
                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${scannedOrder.isBooking ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${scannedOrder.isBooking ? 'bg-purple-400' : 'bg-blue-400'}`} />
                                    {scannedOrder.isBooking ? 'Booking' : 'Order'}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2.5">
                                <button
                                    onClick={handleRelease}
                                    disabled={isReleasing}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-wait text-white text-xs font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border-0 tracking-wide shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                                >
                                    {isReleasing
                                        ? <><Loader size={14} className="animate-spin" /> Releasing…</>
                                        : <><PackageCheck size={14} /> Release Item</>
                                    }
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isReleasing}
                                    className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-wait text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer border border-white/8 hover:border-white/15"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}