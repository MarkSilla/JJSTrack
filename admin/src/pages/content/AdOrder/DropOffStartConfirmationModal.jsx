import React from 'react';
import { AlertTriangle, PackageCheck, X } from 'lucide-react';

export default function DropOffStartConfirmationModal({
    isOpen,
    order = null,
    onClose,
    onConfirm,
}) {
    if (!isOpen || !order) return null;

    const visibleOrderId = order.displayId || order.orderId || order.bookingId || order.id || order._id;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                            <PackageCheck size={22} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-600">Start Production</p>
                            <h2 className="mt-1 text-xl font-black text-slate-900">Mark as Dropped Off?</h2>
                            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                                Clicking <span className="font-bold text-slate-900">Yes</span> will start the work progress for this order and open the production assignment step next.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="border-none bg-transparent p-0 text-slate-400 transition-colors hover:text-slate-700 cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4 px-6 py-5">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Order ID</p>
                                <p className="mt-1 text-sm font-bold text-slate-900">{visibleOrderId}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Customer</p>
                                <p className="mt-1 text-sm font-bold text-slate-900">{order.customer || order.invoice?.billTo?.name || 'Unknown'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                            <div>
                                <p className="text-sm font-bold text-amber-900">What happens next</p>
                                <p className="mt-1 text-sm leading-relaxed text-amber-800">
                                    The order status will move to <span className="font-bold">In Progress</span>, then you will assign the responsible
                                    <span className="font-bold"> Tailor</span>, <span className="font-bold">Presser</span>, and
                                    <span className="font-bold"> Layout Artist</span> before production continues.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="rounded-2xl border-none bg-slate-900 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 cursor-pointer"
                    >
                        Yes, Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
