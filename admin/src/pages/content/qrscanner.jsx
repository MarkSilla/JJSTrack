import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5Qrcode } from 'html5-qrcode';
import {
    QrCode, CheckCircle2, AlertCircle, AlertTriangle, X,
    PackageCheck, Loader,
    User, Wrench, CalendarDays, Hash,
    Camera, Info, ChevronDown, ChevronUp,
    ImageUp, ScanQrCode, Sun
} from 'lucide-react';
import { orderApi } from '../../services/orderApi';
import { bookingApi } from '../../services/bookingApi';
import { toast } from 'sonner';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { font-family: 'Inter', sans-serif; box-sizing: border-box; }

  @keyframes scan-travel {
    0%   { top: 4px; opacity: 0; }
    6%   { opacity: 1; }
    94%  { opacity: 1; }
    100% { top: calc(100% - 4px); opacity: 0; }
  }
  .scan-line {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, #60a5fa, #93c5fd, #60a5fa, transparent);
    animation: scan-travel 2.4s ease-in-out infinite;
    border-radius: 999px;
    box-shadow: 0 0 8px rgba(96,165,250,0.6);
  }

  @keyframes corner-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .cpulse { animation: corner-pulse 2.4s ease-in-out infinite; }

  @keyframes result-enter {
    from { opacity: 0; transform: translateX(32px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes success-ring {
    0%   { transform: scale(1);   opacity: 0.6; }
    70%  { transform: scale(1.55); opacity: 0; }
    100% { transform: scale(1.55); opacity: 0; }
  }
  @keyframes error-shake {
    0%,100%{ transform: translateX(0); }
    20%   { transform: translateX(-6px); }
    40%   { transform: translateX(6px); }
    60%   { transform: translateX(-4px); }
    80%   { transform: translateX(4px); }
  }

  @media (max-width: 768px) {
    .mobile-fullscreen {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 1000 !important;
      background: #000 !important;
      margin: 0 !important;
      border-radius: 0 !important;
      display: flex !important;
      flex-direction: column !important;
    }
    .mobile-fullscreen-content {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
    }
  }

  .result-enter  { animation: result-enter 0.4s cubic-bezier(0.22,1,0.36,1) both; }
  .fade-up       { animation: fade-up 0.35s ease both; }
  .error-shake   { animation: error-shake 0.4s ease; }
  
  /* Hide chat widget when scanner page is open */
  #admin-chat-bubble { display: none !important; }
  .success-ring::before {
    content:''; position:absolute; inset:-6px; border-radius:9999px;
    border:2px solid #4ade80;
    animation: success-ring 1.4s ease-out infinite;
    pointer-events:none;
  }

  #qr-reader { 
    width: 100% !important; 
    height: 100% !important; 
    border: none !important; 
    background: #000 !important; 
    position: relative !important; 
    overflow: hidden !important; 
  }
  #qr-reader video { 
    width: 100% !important; 
    height: 100% !important; 
    object-fit: cover !important; 
    border-radius: 0 !important; 
    display: block !important; 
  }
  #qr-reader canvas { display: none !important; }
  #qr-reader video:nth-of-type(n+2) { display: none !important; }
  #qr-reader__scan_region { background: transparent !important; border: none !important; min-height: 0 !important; }
  #qr-reader__dashboard { display: none !important; }
  #qr-reader__filescan_input { display: none !important; }
  #qr-reader__scan_region > div { border: none !important; }

  ::-webkit-scrollbar { width:3px; }
  ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:99px; }
`;

const STEPS = [
    { icon: Camera, title: 'Allow Camera', desc: 'Grant camera permission when prompted.', badge: '01' },
    { icon: QrCode, title: 'Align QR Code', desc: 'Position the QR code inside the blue frame.', badge: '02' },
    { icon: Sun, title: 'Good Lighting', desc: 'Make sure the QR code is well lit for accuracy.', badge: '03' },
    { icon: ImageUp, title: 'Upload an Image', desc: 'Desktop only: upload a QR image as alternative.', badge: '04' },
];

function Corner({ pos }) {
    const map = {
        tl: 'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
        tr: 'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
        bl: 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
        br: 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
    };
    return <span className={`absolute w-6 h-6 cpulse border-blue-400 ${map[pos]}`} />;
}

function DetailChip({ icon: Icon, label, value }) {
    return (
        <div className="rounded-xl p-3 bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={10} className="text-blue-400 shrink-0" />
                <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
            </div>
            <p className="text-xs font-semibold text-gray-800 truncate">{value}</p>
        </div>
    );
}

const parseScanPayload = (decodedText) => {
    const fallbackValue = String(decodedText || '').trim();

    try {
        const parsed = JSON.parse(decodedText);
        const orderId = typeof parsed?.orderId === 'string' ? parsed.orderId.trim() : '';
        const bookingId = typeof parsed?.bookingId === 'string' ? parsed.bookingId.trim() : '';
        const genericId = typeof parsed?.id === 'string' ? parsed.id.trim() : '';

        return {
            scannedId: orderId || bookingId || genericId || fallbackValue,
            isOrderPayload: Boolean(orderId),
            isBookingPayload: Boolean(bookingId),
        };
    } catch {
        return {
            scannedId: fallbackValue,
            isOrderPayload: false,
            isBookingPayload: false,
        };
    }
};

const extractScannedRecord = (response) => response?.data || response?.order || response?.booking || null;

const getAlreadyHandledMessage = (isBooking = false, message = '') => {
    const normalizedMessage = String(message || '').toLowerCase();

    if (normalizedMessage.includes('picked up')) {
        return 'Already picked up.';
    }

    if (normalizedMessage.includes('released')) {
        return 'Already released.';
    }

    return isBooking ? 'Already picked up.' : 'Already released.';
};

const getSuccessMessage = (isBooking = false) =>
    isBooking ? 'Item marked as picked up and payment recorded.' : 'Item released and payment recorded.';

export default function QRScanner() {
    const navigate = useNavigate();
    const [scannedOrder, setScannedOrder] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isReleasing, setIsReleasing] = useState(false);
    const [released, setReleased] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [scanState, setScanState] = useState('idle');
    const [lowLight, setLowLight] = useState(false);
    const [resultKey, setResultKey] = useState(0);
    const [isPaid, setIsPaid] = useState(false);
    const [proofImage, setProofImage] = useState(null);
    const [proofNotes, setProofNotes] = useState('');
    const html5QrcodeScanner = useRef(null);
    const scanResultRef = useRef(null);
    const videoCheckRef = useRef(null);
    const fileInputRef = useRef(null);

    const [isProofCameraOpen, setIsProofCameraOpen] = useState(false);
    const proofVideoRef = useRef(null);
    const proofCanvasRef = useRef(null);
    const proofStreamRef = useRef(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        let isCleaningUp = false;
        if (html5QrcodeScanner.current) return;

        const scanner = new Html5QrcodeScanner(
            'qr-reader',
            {
                fps: 10,
                qrbox: { width: 200, height: 200 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                showZoomSliderIfSupported: true,
                supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA, Html5QrcodeScanType.SCAN_TYPE_FILE],
            },
            false
        );

        scanner.render(onScanSuccess, () => { });
        html5QrcodeScanner.current = scanner;

        const obs = new MutationObserver(() => {
            const hasVideo = !!document.querySelector('#qr-reader video');
            setCameraActive(prev => {
                if (hasVideo && !prev) { startLightCheck(); return true; }
                if (!hasVideo && prev) { clearInterval(videoCheckRef.current); setLowLight(false); return false; }
                return prev;
            });
        });
        obs.observe(document.getElementById('qr-reader') || document.body, { childList: true, subtree: true });

        return () => {
            obs.disconnect();
            clearInterval(videoCheckRef.current);
            if (html5QrcodeScanner.current) {
                html5QrcodeScanner.current.clear().catch(err => {
                    console.error("Failed to clear scanner:", err);
                });
                html5QrcodeScanner.current = null;
            }
        };
    }, []);

    const startLightCheck = () => {
        videoCheckRef.current = setInterval(() => {
            const video = document.querySelector('#qr-reader video');
            if (!video) return;
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 40; canvas.height = 40;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, 40, 40);
                const d = ctx.getImageData(0, 0, 40, 40).data;
                let b = 0;
                for (let i = 0; i < d.length; i += 4) b += (d[i] + d[i + 1] + d[i + 2]) / 3;
                setLowLight((b / (d.length / 4)) < 45);
            } catch { }
        }, 2000);
    };

    const finalizeSuccessfulScan = (record) => {
        setScannedOrder(record);
        setResultKey(k => k + 1);
        setScanState('success');
        setReleased(true);
        setIsPaid(true);
        scanResultRef.current = null;

        setTimeout(() => {
            setReleased(false);
            setScannedOrder(null);
            setScanError(null);
            setScanState('idle');
            setIsPaid(false);
            scanResultRef.current = null;
            setProofImage(null);
            setProofNotes('');
        }, 3000);
    };

    const releaseScannedRecord = async (record, proofImg = null, pNotes = '') => {
        if (!record) return;

        setIsReleasing(true);

        try {
            const releaseId = record.isBooking ? record._id : (record.orderId || record._id);
            const res = record.isBooking ? await bookingApi.markAsPickedUp(releaseId, proofImg, pNotes) : await orderApi.markAsReleased(releaseId, proofImg, pNotes);

            if (res.success) {
                finalizeSuccessfulScan(record);
            } else {
                const m = res.message || (record.isBooking ? 'Failed to mark as picked up.' : 'Failed to release.');
                setScanError(m.toLowerCase().includes('already') ? getAlreadyHandledMessage(record.isBooking, m) : m);
                setResultKey(k => k + 1);
                setScanState('error');
                setScannedOrder(null);
            }
        } catch (err) {
            setScanError(err.message?.toLowerCase().includes('already') ? getAlreadyHandledMessage(record.isBooking, err.message) : `Error: ${err.message}`);
            setResultKey(k => k + 1);
            setScanState('error');
            setScannedOrder(null);
        } finally {
            setIsReleasing(false);
        }
    };

    const onScanSuccess = async (decodedText) => {
        if (scanResultRef.current === decodedText) return;
        scanResultRef.current = decodedText;
        setScanError(null);
        setIsLoading(true);
        setScanState('scanning');

        try {
            const { scannedId, isOrderPayload, isBookingPayload } = parseScanPayload(decodedText);

            if (!scannedId) {
                setScanError('Invalid QR code.');
                setResultKey(k => k + 1);
                setScanState('error');
                return;
            }

            let order = null, isBooking = false;
            const shouldCheckOrder = !isBookingPayload;
            const shouldCheckBooking = !isOrderPayload;

            if (shouldCheckOrder) {
                try {
                    const r = await orderApi.getOrderById(scannedId);
                    order = extractScannedRecord(r);
                } catch (e) {
                    if (e.response?.status && e.response.status !== 404) {
                        console.error('Order lookup failed:', e);
                    }
                }
            }

            if (!order && shouldCheckBooking) {
                try {
                    const r = await bookingApi.getBookingById(scannedId);
                    const booking = extractScannedRecord(r);
                    if (booking) {
                        order = booking;
                        isBooking = true;
                    }
                } catch (err) {
                    const s = err.response?.status;
                    if (s === 404 || s === 500) {
                        try {
                            const rel = await bookingApi.markAsPickedUp(scannedId);
                            if (rel?.success) { finalizeSuccessfulScan({ _id: scannedId, isBooking: true, paid: true }); return; }
                            else { const m = rel?.message || ''; if (m.toLowerCase().includes('already')) { setScanError(getAlreadyHandledMessage(true, m)); setResultKey(k => k + 1); setScanState('error'); return; } }
                        } catch (re) {
                            if (re.response?.status === 400) {
                                const m = re.response?.data?.message || '';
                                setScanError(m.toLowerCase().includes('not found') ? `Order "${scannedId}" not found.` : m.toLowerCase().includes('already') ? getAlreadyHandledMessage(true, m) : m || 'Invalid order ID.');
                                setResultKey(k => k + 1); setScanState('error'); return;
                            }
                        }
                    }
                }
            }

            if (order) {
                const scannedRecord = { ...order, isBooking };
                const alreadyHandled = order.status === 'Released' || order.released || order.isReleased || order.isPickedUp;
                if (alreadyHandled) { setScanError(getAlreadyHandledMessage(isBooking, order.status)); setResultKey(k => k + 1); setScanState('error'); setScannedOrder(null); }
                else {
                    setScannedOrder(scannedRecord);
                    setResultKey(k => k + 1);
                    setScanState('proof');
                    setProofImage(null);
                    setProofNotes('');
                }
            } else {
                setScanError(`Order "${scannedId}" not found. QR may be invalid or expired.`);
                setResultKey(k => k + 1); setScanState('error');
            }
        } catch (err) {
            setScanError(`Error: ${err.message}`);
            setResultKey(k => k + 1); setScanState('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setScannedOrder(null);
        setScanError(null);
        setScanState('idle');
        scanResultRef.current = null;
        setProofImage(null);
        setProofNotes('');
        stopProofCamera();
    };

    const startProofCamera = async () => {
        setIsProofCameraOpen(true);
        triggerStopCamera(); // Stop QR scanner
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            proofStreamRef.current = stream;
            if (proofVideoRef.current) {
                proofVideoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            toast.error('Could not access camera for proof.');
            setIsProofCameraOpen(false);
        }
    };

    const stopProofCamera = () => {
        if (proofStreamRef.current) {
            proofStreamRef.current.getTracks().forEach(track => track.stop());
            proofStreamRef.current = null;
        }
        setIsProofCameraOpen(false);
    };

    const captureProofPhoto = () => {
        if (proofVideoRef.current && proofCanvasRef.current) {
            const video = proofVideoRef.current;
            const canvas = proofCanvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setProofImage(dataUrl);
            stopProofCamera();
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        let decodedText = null;

        if ('BarcodeDetector' in window) {
            try {
                const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
                const url = URL.createObjectURL(file);
                const img = new Image();
                await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
                const barcodes = await detector.detect(img);
                URL.revokeObjectURL(url);
                if (barcodes.length > 0) decodedText = barcodes[0].rawValue;
            } catch (_) { }
        }
        if (!decodedText) {
            const tempId = 'qr-file-scan-temp-' + Date.now();
            const div = document.createElement('div');
            div.id = tempId;
            div.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:300px;height:300px;overflow:hidden;';
            document.body.appendChild(div);
            const scanner = new Html5Qrcode(tempId);
            try {
                decodedText = await scanner.scanFile(file, true);
            } catch (_) { /* decoding failed */ }
            finally {
                try { await scanner.clear(); } catch (_) { }
                if (document.body.contains(div)) document.body.removeChild(div);
            }
        }

        if (decodedText) {
            await onScanSuccess(decodedText);
        } else {
            setScanError('Could not read QR code from image. Make sure the image contains a clear, complete QR code.');
            setResultKey(k => k + 1);
            setScanState('error');
        }
    };

    const triggerStartCamera = () => {
        document.getElementById('html5-qrcode-button-camera-start')?.click() ||
            document.getElementById('html5-qrcode-button-camera-permission')?.click() ||
            document.querySelector('#qr-reader button')?.click();
    };
    const triggerStopCamera = () => document.getElementById('html5-qrcode-button-camera-stop')?.click();

    const hasResult = scanState === 'processing' || scanState === 'success' || scanState === 'error' || scanState === 'proof';

    const orderDetails = scannedOrder ? [
        { icon: User, label: 'Customer', value: scannedOrder.contact?.fullName || scannedOrder.customer || 'N/A' },
        { icon: Wrench, label: 'Service', value: scannedOrder.service || scannedOrder.serviceType || 'N/A' },
        { icon: Hash, label: 'Item', value: scannedOrder.item || 'N/A' },
        { icon: CalendarDays, label: 'Date', value: new Date(scannedOrder.createdAt || scannedOrder.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
    ] : [];

    return (
        <>
            <style>{STYLES}</style>
            <div className="min-h-screen bg-transparent">
                <div className="max-w-5xl mx-auto px-4 pt-6 pb-20">
                    <div className="flex items-center gap-3 mb-6">
                        <div>
                            <h1 className="text-xl font-black text-gray-800 leading-tight">QR Scanner</h1>
                            <p className="text-[11px] text-gray-400 leading-tight">Scan QR codes quickly and securely</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                            style={{ borderColor: isLoading ? '#fde68a' : '#bbf7d0', background: isLoading ? '#fffbeb' : '#f0fdf4' }}>
                            <span className="w-1.5 h-1.5 rounded-full"
                                style={{ background: isLoading ? '#f59e0b' : '#16a34a', boxShadow: `0 0 5px ${isLoading ? '#f59e0b' : '#16a34a'}` }} />
                            <span className="text-[9px] font-bold uppercase tracking-widest"
                                style={{ color: isLoading ? '#b45309' : '#16a34a' }}>
                                {isLoading ? (isReleasing ? 'Updating' : 'Reading') : 'Ready'}
                            </span>
                        </div>
                    </div>
                    {lowLight && cameraActive && (
                        <div className="mb-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 fade-up">
                            <Sun size={13} className="text-amber-500 shrink-0" />
                            <p className="text-xs text-amber-700 font-medium">
                                The environment appears to be too dark, please move to a brighter area for better scanning.
                            </p>
                        </div>
                    )}
                    {/* ── Split layout ── */}
                    <div className="flex flex-col lg:flex-row gap-4 items-start transition-all duration-500 ease-in-out">

                        {/* QR Code */}
                        <div className={`transition-all duration-500 ease-in-out w-full 
                            ${hasResult ? 'lg:w-1/2' : 'max-w-md mx-auto'}`}>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">QR Code</p>
                            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm w-full bg-white">
                                <div className="relative bg-gray-950 w-full" style={{ paddingBottom: '100%' }}>
                                    <div className="absolute inset-0">
                                        {!cameraActive && (
                                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-950">
                                                <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                                                    <Camera size={26} className="text-gray-500" />
                                                </div>
                                                <p className="text-xs text-gray-400 font-medium">Camera not active</p>
                                                <p className="text-[10px] text-gray-600">Tap "Start Camera" below</p>
                                            </div>
                                        )}
                                        <div id="qr-reader" className="absolute inset-0 z-0" />
                                        {cameraActive && (
                                            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                                <div className="absolute inset-0"
                                                    style={{ background: 'radial-gradient(ellipse 55% 55% at center, transparent 38%, rgba(0,0,0,0.55) 100%)' }} />
                                                <div className="relative z-10" style={{ width: 200, height: 200 }}>
                                                    <Corner pos="tl" />
                                                    <Corner pos="tr" />
                                                    <Corner pos="bl" />
                                                    <Corner pos="br" />
                                                    <div className="absolute inset-2 rounded border border-blue-400/10 bg-blue-400/[0.03]" />
                                                    <div className="scan-line" />
                                                </div>
                                            </div>
                                        )}
                                        {isLoading && (
                                            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/35">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader size={22} className="text-blue-400 animate-spin" />
                                                    <p className="text-[10px] text-blue-300 font-medium">{isReleasing ? 'Updating status…' : 'Reading QR…'}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 inset-x-0 z-30 flex justify-center pb-3 pointer-events-none">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur border border-white/10">
                                                <span className="w-1 h-1 rounded-full bg-blue-400" />
                                                <span className="text-[9px] font-medium text-white/60 uppercase tracking-widest">
                                                    {cameraActive ? 'Align QR inside frame' : 'Camera preview'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3.5 py-3 border-t border-gray-100 bg-white">
                                    {!cameraActive ? (
                                        <button onClick={triggerStartCamera}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-semibold transition-all cursor-pointer border-none">
                                            <Camera size={13} />
                                            Start Camera
                                        </button>
                                    ) : (
                                        <button onClick={triggerStopCamera}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 text-xs font-semibold transition-all cursor-pointer">
                                            <Camera size={13} />
                                            Stop Camera
                                        </button>
                                    )}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="hidden sm:flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold transition-all cursor-pointer shrink-0"
                                    >
                                        <ImageUp size={13} />
                                        <span className="inline">Upload Image</span>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Result */}
                        {hasResult && (
                            <div key={resultKey} className="w-full lg:w-1/2 result-enter">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Result</p>
                                {scanState === 'success' && (
                                    <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center fade-up">
                                        <div className="relative w-16 h-16 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mx-auto mb-4 success-ring">
                                            <CheckCircle2 size={28} className="text-green-500" />
                                        </div>
                                        <p className="text-lg font-bold text-gray-800 mb-1">Scan Successful!</p>
                                        <p className="text-xs text-green-600 mb-3">{getSuccessMessage(scannedOrder?.isBooking)}</p>
                                        <div className="flex items-center gap-2 justify-center mb-2">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 border border-green-200 text-[9px] font-bold uppercase tracking-widest text-green-600">
                                                <CheckCircle2 size={10} />
                                                Status updated
                                            </div>
                                            {isPaid && (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-[9px] font-bold uppercase tracking-widest text-blue-600">
                                                    <CheckCircle2 size={10} />
                                                    Payment recorded
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {/* Error validation */}
                                {scanState === 'error' && scanError && (
                                    <div className={`rounded-2xl border p-5 error-shake fade-up ${scanError.toLowerCase().includes('already') ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${scanError.toLowerCase().includes('already') ? 'bg-amber-100 border-amber-200' : 'bg-red-100 border-red-200'}`}>
                                                {scanError.toLowerCase().includes('already') ? <AlertTriangle size={16} className="text-amber-500" /> : <AlertCircle size={16} className="text-red-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold mb-1 ${scanError.toLowerCase().includes('already') ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {scanError.toLowerCase().includes('already') ? 'Already Scanned' : 'Scan Failed'}
                                                </p>
                                                <p className={`text-xs leading-relaxed ${scanError.toLowerCase().includes('already') ? 'text-amber-600' : 'text-red-500'}`}>
                                                    {scanError}
                                                </p>
                                            </div>
                                            <button onClick={handleCancel}
                                                className={`p-1.5 rounded-lg transition-all cursor-pointer border-none bg-transparent shrink-0 ${scanError.toLowerCase().includes('already') ? 'text-amber-400 hover:text-amber-600 hover:bg-amber-100' : 'text-red-300 hover:text-red-500 hover:bg-red-100'}`}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <button onClick={handleCancel}
                                            className={`mt-4 w-full py-2.5 rounded-xl border bg-white text-xs font-semibold transition-all cursor-pointer ${scanError.toLowerCase().includes('already') ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-red-200 text-red-500 hover:bg-red-50'}`}>
                                            Try Again
                                        </button>
                                    </div>
                                )}
                                {scanState === 'proof' && scannedOrder && (
                                    <div className={`rounded-2xl border border-blue-200 bg-white overflow-hidden shadow-sm fade-up ${isMobile ? 'mobile-fullscreen-content border-none rounded-none' : ''}`}>
                                        <div className="flex items-center gap-3 px-4 py-3.5 bg-blue-50 border-b border-blue-100">
                                            <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                                                <div className="flex items-center justify-center w-full h-full">
                                                    <Info size={13} className="text-blue-500" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-gray-800">Additional Proof Recommended</p>
                                                <p className="text-[10px] text-blue-600 mt-1 leading-relaxed">
                                                    For additional proof, Take a photo or get a signature from the receiver.
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`p-3  flex flex-col gap-2 ${isMobile ? 'flex-1 justify-center' : ''}`}>
                                            <div>

                                                {proofImage ? (
                                                    <div className={`relative rounded-xl overflow-hidden border border-gray-200 w-full bg-gray-50 flex items-center justify-center group ${isMobile ? 'h-80' : 'h-64'}`}>
                                                        <img src={proofImage} alt="Proof" className="max-h-full object-contain" />
                                                        <button
                                                            onClick={() => setProofImage(null)}
                                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity cursor-pointer border-none"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ) : isProofCameraOpen ? (
                                                    <div className="relative rounded-xl overflow-hidden border border-gray-200 w-full bg-black flex flex-col items-center">
                                                        <video ref={proofVideoRef} autoPlay playsInline className={`w-full object-cover ${isMobile ? 'h-96' : 'h-80'}`} />
                                                        <canvas ref={proofCanvasRef} className="hidden" />
                                                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                                                            <button onClick={stopProofCamera} className="px-4 py-1.5 bg-white text-gray-800 rounded-full font-semibold text-xs border-none cursor-pointer shadow-md hover:bg-gray-100">Cancel</button>
                                                            <button onClick={captureProofPhoto} className="px-4 py-1.5 bg-blue-500 text-white rounded-full font-semibold text-xs border-none cursor-pointer shadow-md hover:bg-blue-600">Take Photo</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all ${isMobile ? 'h-96' : 'h-80'}`} onClick={startProofCamera}>
                                                        <Camera size={20} className="text-gray-400" />
                                                        <span className="text-[10px] text-gray-500 font-medium">Open Camera</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Signature / Notes</label>
                                                <textarea
                                                    value={proofNotes}
                                                    onChange={e => setProofNotes(e.target.value)}
                                                    placeholder="e.g. Received by Someone"
                                                    className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none resize-none h-12"
                                                />
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => {
                                                        setScanState('processing');
                                                        releaseScannedRecord(scannedOrder, null, '');
                                                    }}
                                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 text-xs font-semibold transition-all cursor-pointer"
                                                >
                                                    Skip Proof
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setScanState('processing');
                                                        releaseScannedRecord(scannedOrder, proofImage, proofNotes);
                                                    }}
                                                    className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white border-none text-xs font-semibold transition-all cursor-pointer"
                                                >
                                                    Save & Release
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {scanState === 'processing' && scannedOrder && (
                                    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm fade-up">
                                        <div className="flex items-center gap-3 px-4 py-3.5 bg-blue-50 border-b border-blue-100">
                                            <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                                                <Loader size={13} className="text-blue-500 animate-spin" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-gray-800">QR Verified</p>
                                                <p className="text-[9px] text-gray-400 truncate mt-0.5">{scannedOrder.orderId || scannedOrder.bookingId || scannedOrder._id}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${scannedOrder.isBooking ? 'bg-purple-50 border border-purple-200 text-purple-500' : 'bg-blue-100 border border-blue-200 text-blue-500'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${scannedOrder.isBooking ? 'bg-purple-400' : 'bg-blue-400'}`} />
                                                    {scannedOrder.isBooking ? 'Booking' : 'Order'}
                                                </span>
                                                {scannedOrder.paid && (
                                                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-green-50 border border-green-200 text-green-600">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                                        Paid
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <div className="grid grid-cols-2 gap-2 mb-4">
                                                {orderDetails.map(d => <DetailChip key={d.label} {...d} />)}
                                            </div>
                                            <div className="h-px bg-gray-100 mb-4" />
                                            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-center">
                                                <div className="inline-flex items-center gap-2 text-blue-600 text-xs font-semibold">
                                                    <PackageCheck size={14} />
                                                    {scannedOrder.isBooking ? 'Automatically marking as picked up...' : 'Automatically releasing item...'}
                                                </div>
                                                <p className="text-[11px] text-blue-500 mt-1">No confirmation needed. This scan updates the status immediately.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* tuts*/}
                    <div className="mt-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
                        <button onClick={() => setShowInstructions(v => !v)}
                            className="w-full flex items-center justify-between px-4 py-3.5 text-left cursor-pointer bg-transparent border-none hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                    <Info size={11} className="text-blue-400" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700">How to Use</span>
                            </div>
                            {showInstructions
                                ? <ChevronUp size={13} className="text-gray-400" />
                                : <ChevronDown size={13} className="text-gray-400" />}
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showInstructions ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="px-3.5 pb-3.5 pt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 border-t border-gray-100">
                                {STEPS.map(({ icon: Icon, title, desc, badge }) => (
                                    <div key={badge} className="flex gap-2.5 rounded-xl p-3 border border-gray-100 bg-gray-50">
                                        <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                <Icon size={13} className="text-blue-400" />
                                            </div>
                                            <span className="text-[8px] font-bold text-gray-400 tabular-nums">{badge}</span>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold text-gray-700 mb-0.5">{title}</p>
                                            <p className="text-[10px] text-gray-500 leading-relaxed">{desc}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="sm:col-span-2 lg:col-span-4 flex items-start gap-2 rounded-xl px-3 py-2.5 bg-amber-50 border border-amber-200">
                                    <span className="text-amber-500 text-xs shrink-0 mt-0.5">⚠</span>
                                    <p className="text-[10px] text-amber-700 leading-relaxed">
                                        <strong>Tip:</strong> Each QR can only be released once. "Already received" means it was previously processed.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div >
        </>
    );
}
