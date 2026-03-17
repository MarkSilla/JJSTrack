import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import {
    QrCode,
    CheckCircle2,
    AlertCircle,
    X,
    PackageCheck,
    ChevronLeft
} from 'lucide-react';
import { mockOrders } from '../../data/mockdata';

export default function QRScanner() {
    const navigate = useNavigate();
    const [scanResult, setScanResult] = useState(null);
    const [scannedOrder, setScannedOrder] = useState(null);
    const [scanError, setScanError] = useState(null);

    const handleScan = (detectedCodes) => {
        if (detectedCodes && detectedCodes.length > 0) {
            const code = detectedCodes[0].rawValue;

            // Avoid re-processing the same code repeatedly quickly
            if (scanResult === code) return;

            setScanResult(code);
            setScanError(null);

            // Find the order in the mock database
            const order = mockOrders.find(o => o.id === code);

            if (order) {
                // Check if already released
                const existingReleased = JSON.parse(localStorage.getItem('releasedItems') || '[]');
                const alreadyReleased = existingReleased.find(r => r.id === order.id);
                if (alreadyReleased) {
                    setScanError(`Order ${order.id} has already been released on ${alreadyReleased.releaseDate}.`);
                    setScannedOrder(null);
                } else {
                    setScannedOrder(order);
                }
            } else {
                setScannedOrder(null);
                setScanError(`Order ID "${code}" not found in the system.`);
            }
        }
    };

    const handleRelease = () => {
        if (!scannedOrder) return;
        const existingReleased = JSON.parse(localStorage.getItem('releasedItems') || '[]');

        const releaseRecord = {
            ...scannedOrder,
            releaseDate: new Date().toLocaleDateString('en-CA'),
            status: "Released"
        };

        localStorage.setItem('releasedItems', JSON.stringify([...existingReleased, releaseRecord]));

        setScannedOrder(null);
        setScanResult(null);
        setScanError(null);

        alert(`Successfully released Order: ${releaseRecord.id}`);
    };

    const handleCancel = () => {
        setScannedOrder(null);
        setScanResult(null);
        setScanError(null);
    };

    return (
        <div className="font-inter fixed inset-0 z-30 lg:relative lg:inset-auto lg:z-auto bg-black bg-slate-50 flex flex-col lg:p-8">
            <div className="lg:hidden absolute top-6 left-4 z-50">
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="bg-black/50 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
            </div>

            <div className="w-full h-full lg:max-w-3xl lg:w-full lg:mx-auto flex flex-col lg:block relative">
                <div className="mb-6 text-center hidden lg:block">
                    <h1 className="lg:text-4xl font-bold text-gray-900 tracking-tight gap-3">
                        Scan QRCode
                    </h1>
                    <p className="text-gray-500 font-medium lg:text-sm mt-1">
                        Scan an order's QR code before you release the item
                    </p>
                </div>

                <div className="flex-1 lg:flex-none lg:bg-white lg:rounded-3xl lg:p-2 lg:shadow-sm lg:border lg:border-gray-100 overflow-hidden relative flex flex-col">
                    <div className="flex-1 lg:aspect-video lg:w-full lg:rounded-2xl overflow-hidden bg-black relative">
                        <Scanner
                            onScan={handleScan}
                            onError={(error) => console.log(error?.message)}
                            components={{
                                audio: false,
                                zoom: false,
                                finder: true,
                            }}
                            styles={{
                                container: { width: '100%', height: '100%', objectFit: 'cover' },
                                video: { objectFit: 'cover' }
                            }}
                        />
                        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] hidden lg:block"></div>
                        <div className="absolute top-24 lg:top-4 left-4 right-4 text-center">
                            <span className="bg-black/50 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md">
                                Default Camera Active
                            </span>
                        </div>
                    </div>
                </div>
                <div className="shrink-0 p-8 lg:p-0 lg:mt-4 text-center z-10 bg-transparent">
                    <p className="text-white lg:text-gray-500 font-medium text-sm lg:text-base">
                        Point your camera at a QR code.
                    </p>
                </div>

                <div className="absolute bottom-4 left-4 right-4 lg:static lg:mt-0 z-50">
                    {scanError && (
                        <div className="mt-6 bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
                            <div className="bg-red-100 p-2 rounded-full shrink-0">
                                <AlertCircle size={20} className="text-red-600" />
                            </div>
                            <div className="flex-1 mt-0.5">
                                <h3 className="text-sm font-bold text-red-900">Scan Error</h3>
                                <p className="text-sm font-medium text-red-700/80 mt-1">{scanError}</p>
                            </div>
                            <button onClick={handleCancel} className="text-red-400 hover:text-red-600">
                                <X size={20} />
                            </button>
                        </div>
                    )}

                    {scannedOrder && (
                        <div className="mt-6 bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-100 p-2.5 rounded-full">
                                            <CheckCircle2 size={24} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-green-900 font-bold text-lg">Successfully Scanned</h3>
                                            <p className="text-green-700/70 font-medium text-xs">Match found for this Order ID</p>
                                        </div>
                                    </div>
                                    <span className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-lg text-xs tracking-wider">
                                        {scannedOrder.id}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-[#F8FAFC] rounded-2xl p-4 border border-gray-100 mb-6">
                                    <div>
                                        <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Customer</div>
                                        <div className="text-sm font-bold text-gray-900">{scannedOrder.customer}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Service</div>
                                        <div className="text-sm font-bold text-gray-900">{scannedOrder.serviceType}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Item</div>
                                        <div className="text-sm font-bold text-gray-900">{scannedOrder.item}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Payment</div>
                                        <div className="text-sm font-bold text-emerald-600">{scannedOrder.invoice?.status || 'Pending'}</div>
                                    </div>
                                </div>


                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleRelease}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer text-sm"
                                    >
                                        <PackageCheck size={18} />
                                        Release Item
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="px-6 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
