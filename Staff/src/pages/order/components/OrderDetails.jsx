import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, Mail, MapPin, Clock, Check, Users, Package, Calendar } from 'lucide-react';
import OrderStatusTracker from './OrderStatusTracker';
import useOrderDetails from '../hooks/useOrderDetails';

const STATUS_CONFIG = {
    "Completed": { color: "bg-emerald-100 text-emerald-700", label: "Completed" },
    "In Progress": { color: "bg-blue-100 text-blue-700", label: "In Progress" },
    "Pending": { color: "bg-amber-100 text-amber-700", label: "Pending" },
    "Overdue": { color: "bg-red-100 text-red-700", label: "Overdue" },
    "OVERDUE": { color: "bg-red-100 text-red-700", label: "Overdue" },
};

const OrderDetails = ({ orderId, onBack }) => {
    const { order, steps: initialSteps, currentStepIdx: initialStepIdx, statusLabel } = useOrderDetails(orderId);
    
    const [productionSteps, setProductionSteps] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);

    useEffect(() => {
        if (initialSteps?.length > 0) {
            setProductionSteps(JSON.parse(JSON.stringify(initialSteps)));
            setCurrentIdx(initialStepIdx);
        }
    }, [initialSteps, initialStepIdx]);

    if (!order) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <p className="text-sm font-semibold text-gray-500">Order not found</p>
                <button
                    onClick={onBack}
                    className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer"
                >
                    ← Back to orders
                </button>
            </div>
        );
    }

    const handleStepClick = (index) => {
        if (index !== currentIdx) return;

        const now = new Date();
        const finishDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const finishTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const updatedSteps = productionSteps.map((step, idx) => {
            const stepObj = typeof step === 'string' ? { step: step } : { ...step };
            
            if (idx === index) {
                return { 
                    ...stepObj, 
                    done: true, 
                    active: false, 
                    date: finishDate, 
                    time: finishTime, 
                    worker: 'Marco Reyes' 
                };
            }
            if (idx === index + 1) {
                const nextStep = productionSteps[idx];
                const nextStepObj = typeof nextStep === 'string' ? { step: nextStep } : { ...nextStep };
                return { ...nextStepObj, active: true };
            }
            return step;
        });

        setProductionSteps(updatedSteps);
        if (index + 1 < updatedSteps.length) {
          setCurrentIdx(index + 1);
        } else {
          setCurrentIdx(updatedSteps.length);
        }
    };

    const statusConf = STATUS_CONFIG[statusLabel] || STATUS_CONFIG[order?.status] || STATUS_CONFIG['Pending'];
    const customerName = order.customerName || order.customer;
    const items = order.items || order.invoice?.items || [];
    const teamRoster = order.teamRoster || order.players || [];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 bg-transparent border-none cursor-pointer transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Orders
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg tracking-wider font-mono">
                            {order.id}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1.5 rounded-md tracking-wider ${statusConf.color}`}>
                            {currentIdx >= productionSteps.length ? 'Completed' : statusConf.label}
                        </span>
                    </div>
                </div>

                <h1 className="text-lg font-black text-gray-900 tracking-tight flex items-baseline gap-2 mb-2">
                    <span className="text-gray-400 font-bold capitalize">{order.serviceTitle || order.serviceType}</span>
                    <span className="text-gray-300">—</span>
                    {order.teamName || order.team || order.category || order.item}
                </h1>

                {/* Assigned By Badge */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[11px] font-semibold text-gray-400">Assigned by</span>
                    <span className="text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-lg">
                        {order.assignedBy || 'Admin'}
                    </span>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-600">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                            <User size={16} className="text-gray-400" />
                        </div>
                        {customerName}
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-600">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                            <Phone size={16} className="text-gray-400" />
                        </div>
                        {order.contact || order.phone || 'N/A'}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 flex flex-col gap-5">
                    
                    <OrderStatusTracker 
                      steps={productionSteps} 
                      currentStepIdx={currentIdx} 
                      onStepClick={handleStepClick}
                    />

                    {/* Vertical Step Breakdown */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
                            <Clock size={18} className="text-blue-500" />
                            Production Progress
                        </h3>
                        <div className="relative pl-4 space-y-5">
                            <div className="absolute left-[15px] top-3 bottom-5 w-0.5 bg-gray-100" />
                            {productionSteps.map((step, idx) => {
                                const isCompleted = idx < currentIdx || step.done;
                                const isCurrent = idx === currentIdx;
                                const label = step.step || step.label || step;

                                return (
                                    <div key={idx} className="relative flex items-start gap-4">
                                        <div className="relative z-10 bg-white py-1">
                                            {isCompleted ? (
                                                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 ring-4 ring-white -ml-2 transition-all duration-300">
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                            ) : isCurrent ? (
                                                <div className="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-50 -ml-0.5 animate-pulse" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white -ml-0.5" />
                                            )}
                                        </div>
                                        <div className="flex-1 -mt-1 pb-3">
                                            <div className={`text-sm font-bold tracking-wide flex items-center justify-between ${(isCompleted || isCurrent) ? 'text-gray-900' : 'text-gray-400'}`}>
                                                <span>{typeof label === 'object' ? (label.step || label.label || 'Step') : String(label)}</span>
                                                {(isCompleted || isCurrent) && (step.worker || step.date) && (
                                                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                                        {step.worker && <><User size={10} className="inline mr-1" />{step.worker}</>}
                                                        {(step.date || step.time) && (
                                                            <span className={step.worker ? 'ml-2' : ''}>
                                                                {step.date}{step.time && ` @ ${step.time}`}
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            {isCurrent && (
                                                <div className="mt-2">
                                                    <button 
                                                        onClick={() => handleStepClick(idx)}
                                                        className="bg-blue-600 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-all border-none cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
                                                    >
                                                        Mark as Finished
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Team Roster TABLE */}
                    {teamRoster.length > 0 && (
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Users size={18} className="text-indigo-500" />
                                Team Roster ({teamRoster.length} players)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="pb-3 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-3">Surname</th>
                                            <th className="pb-3 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Jersey No.</th>
                                            <th className="pb-3 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Type</th>
                                            <th className="pb-3 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Jersey</th>
                                            <th className="pb-3 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Short</th>
                                            <th className="pb-3 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-3">Add-ons</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {teamRoster.map((player, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0 text-black">
                                                <td className="py-3 text-sm font-bold pl-3">
                                                    {player.surname || player.name || '-'}
                                                </td>
                                                <td className="py-3 text-sm font-medium text-center">
                                                    {player.number !== undefined ? `#${player.number}` : '-'}
                                                </td>
                                                <td className="py-3 text-sm font-medium">
                                                    {player.productType || '-'}
                                                </td>
                                                <td className="py-3 text-sm font-medium text-center">
                                                    {player.jerseySize || '-'}
                                                </td>
                                                <td className="py-3 text-sm font-medium text-center">
                                                    {player.shortSize || '-'}
                                                </td>
                                                <td className="py-3 text-sm font-medium pl-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {player.addOns && player.addOns.length > 0 ? (
                                                            player.addOns.map((addon, aIdx) => (
                                                                <span key={aIdx} className="after:content-[','] last:after:content-[''] mr-1">
                                                                    {addon}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-800">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-5">
                    {/* Summary Section */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-blue-50/50 p-4 border-b border-gray-100">
                            <h4 className="text-[11px] font-black text-blue-900 tracking-wider uppercase mb-3 flex items-center gap-2">
                                <Calendar size={14} />
                                Schedule
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-blue-900/40">Drop Date</span>
                                    <span className="font-bold text-blue-900">{order.dropDate || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-blue-900/40">Assigned Date</span>
                                    <span className="font-bold text-blue-900">{order.createdAt || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-blue-900/40">Due Date</span>
                                    <span className="font-bold text-blue-900">{order.dueDate || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white">
                            <h4 className="text-[11px] font-black text-gray-400 tracking-wider uppercase mb-3 flex items-center gap-2">
                                <Package size={14} />
                                Order Items
                            </h4>
                            <div className="space-y-2">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-1.5">
                                        <div className="text-sm font-bold text-gray-800 pr-4 leading-tight">
                                            {item.name || item.description}
                                        </div>
                                        <div className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md shrink-0 uppercase tracking-wider">
                                            Qty: {item.qty}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-50 text-xs">
                                <span className="font-semibold text-gray-400">Current Status</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${statusConf.color}`}>
                                  {currentIdx >= productionSteps.length ? 'Completed' : statusConf.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
                        <h4 className="text-[11px] font-black text-blue-800 tracking-wider uppercase mb-2">Staff Reminder</h4>
                        <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                            Please follow the production timeline. Ensure the items printed match the total count in the group roster.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
