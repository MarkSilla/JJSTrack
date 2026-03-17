import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    Search, Filter, MoreHorizontal, CheckCircle2, CalendarClock,
    User, Phone, Check, AlertCircle, Clock, Edit, XCircle, ChevronDown,
    UserCheck, X
} from 'lucide-react';
import {
    MdDesktopWindows, MdLocalShipping, MdLocalPrintshop, MdMoveToInbox
} from 'react-icons/md';
import { GiSewingMachine, GiScissors } from 'react-icons/gi';
import { orderApi } from '../../services/orderApi.js';
import { bookingApi } from '../../services/bookingApi.js';

const EMPLOYEE_POOL = [
    { id: 'EMP-001', name: 'Juan Dela Cruz', role: 'Tailor', dept: 'Production' },
    { id: 'EMP-002', name: 'Maria Santos', role: 'Tailor', dept: 'Production' },
    { id: 'EMP-003', name: 'Remy Cruz', role: 'Tailor', dept: 'Production' },
    { id: 'EMP-004', name: 'Marco Reyes', role: 'Sewing Staff', dept: 'Production' },
    { id: 'EMP-005', name: 'Ana Villanueva', role: 'Sewing Staff', dept: 'Production' },
    { id: 'EMP-006', name: 'Ben Aquino', role: 'Production Staff', dept: 'Production' },
];
const ASSIGNABLE_ROLES = ['Tailor', 'Sewing Staff', 'Production Staff'];
const ASSIGNABLE_EMPLOYEES = EMPLOYEE_POOL.filter(e => ASSIGNABLE_ROLES.includes(e.role));

const STATUS_CONFIG = {
    "Completed": { color: "bg-emerald-100 text-emerald-700", label: "Completed" },
    "Complete": { color: "bg-emerald-100 text-emerald-700", label: "Completed" },
    "In-Progress": { color: "bg-blue-100 text-blue-700", label: "In Progress" },
    "In Progress": { color: "bg-blue-100 text-blue-700", label: "In Progress" },
    "Pending": { color: "bg-amber-100 text-amber-700", label: "Pending" },
    "Ready": { color: "bg-green-100 text-green-700", label: "Ready" },
    "Overdue": { color: "bg-red-100 text-red-600", label: "Overdue" },
    "Cancel/Incomplete": { color: "bg-red-100 text-red-600", label: "Cancelled" },
};
const TYPE_CONFIG = {
    "Team Jersey": { color: "bg-indigo-100 text-indigo-700" },
    "Organization": { color: "bg-teal-100 text-teal-700" },
    "Repair": { color: "bg-orange-100 text-orange-700" },
};
const SERVICE_STEPS = {
    "Team Jersey": ["Dropped Off", "Layout", "Printing", "Sewing", "Pick-up"],
    "Organization": ["Dropped Off", "Layout", "Printing", "Sewing", "Pick-up"],
    "Repair": ["Drop Off", "Cutting", "Sewing", "Pick-up"],
};
const PRIORITY_CONFIG = {
    "Rush": { color: "text-red-600 bg-red-50 border-red-200", icon: <AlertCircle size={12} className="mr-1" /> },
    "Normal": { color: "text-gray-600 bg-gray-50 border-gray-200", icon: null },
    "Low Priority": { color: "text-slate-500 bg-slate-50 border-slate-200", icon: null },
};
const STEP_ICON = {
    'dropped off': MdMoveToInbox,
    'drop off': MdMoveToInbox,
    'layout': MdDesktopWindows,
    'printing': MdLocalPrintshop,
    'cutting': GiScissors,
    'sewing': GiSewingMachine,
    'pick-up': MdLocalShipping,
};
const PIECE_RATES = {
    'Jersey': 35, 'Shorts': 30, 'Polo': 40, 'T-Shirt': 28, 'Jacket': 65, 'Pants': 45,
};

const isOverdue = (dueDateStr) => {
    if (!dueDateStr) return false;
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
};
const getDerivedStatus = (order) => {
    if (order.status !== 'Completed' && order.status !== 'Complete' && isOverdue(order.invoice?.dueDate)) return "Overdue";
    if (order.status === "In Progress" || order.status === "In-Progress") return "In Progress";
    if (order.status === "Ready") return "Ready";
    if (order.status === "Completed" || order.status === "Complete") return "Completed";
    return "Pending";
};
const getActiveStepIndex = (order, orderTracking) => {
    if (!order) return 0;
    if (orderTracking[order.id] !== undefined) return orderTracking[order.id];
    if (order.steps && order.steps.length > 0) {
        const activeIdx = order.steps.findIndex(s => s.active);
        if (activeIdx !== -1) return activeIdx;
        const notDoneIdx = order.steps.findIndex(s => !s.done);
        return notDoneIdx !== -1 ? notDoneIdx : order.steps.length - 1;
    }
    const steps = SERVICE_STEPS[order.serviceType] || SERVICE_STEPS["Team Jersey"];
    if (order.status === "Complete" || order.status === "Completed") return steps.length - 1;
    if (order.status === "In Progress" || order.status === "In-Progress") return 1;
    return 0;
};
const getNextActionLabel = (currentIdx, steps) => {
    if (currentIdx >= steps.length - 1) return "Mark Ready for Pickup";
    const nextStep = steps[currentIdx + 1]?.label || steps[currentIdx + 1];
    if (nextStep === "Pick-up") return "Mark Ready for Pickup";
    return `Start ${nextStep}`;
};
const computeOrderEarnings = (order, employeeId) => {
    if (!employeeId) return null;
    const items = order.invoice?.items || [];
    let total = 0;
    const lines = items.map(item => {
        const key = item.itemType || item.description;
        const rate = PIECE_RATES[key] || 0;
        const earned = rate * item.qty;
        total += earned;
        return { label: item.description, qty: item.qty, rate, earned };
    }).filter(l => l.rate > 0);
    return lines.length > 0 ? { lines, total } : null;
};
const fmt = (n) => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0 });

const getDropDate = (order) => {
    if (!order || !order.steps) return 'N/A';
    try {
        console.log('Getting drop date for order:', order.id, 'Steps:', order.steps);
        // Look for any step with "drop" in the label
        const droppedOffStep = order.steps.find(s => {
            const label = s.label || '';
            console.log('Checking step:', label, 'has date?', s.date);
            return label.toLowerCase().includes('drop');
        });
        console.log('Found dropped off step:', droppedOffStep);
        if (droppedOffStep?.date) {
            const dateObj = new Date(droppedOffStep.date);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
        }
    } catch (e) {
        console.error('Date formatting error:', e);
    }
    return 'N/A';
};

const AssignEmployeeDropdown = ({ currentId, onAssign }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const current = ASSIGNABLE_EMPLOYEES.find(e => e.id === currentId);
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all w-full cursor-pointer
                    ${current ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
                <UserCheck size={15} className={current ? 'text-blue-500' : 'text-gray-400'} />
                <span className="flex-1 text-left truncate">{current ? current.name : 'Select Employee'}</span>
                <ChevronDown size={14} className={`shrink-0 transition-transform text-gray-400 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute top-full mt-1.5 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-2xl z-40 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-50">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Production Staff</span>
                    </div>
                    <div className="py-1 max-h-52 overflow-y-auto">
                        <button onClick={() => { onAssign(null); setOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors text-left border-none cursor-pointer
                                ${!currentId ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                            <div className="w-7 h-7 rounded-full border border-dashed border-gray-300 flex items-center justify-center shrink-0">
                                <X size={10} className="text-gray-300" />
                            </div>
                            <span className="font-medium">Unassigned</span>
                        </button>
                        {ASSIGNABLE_EMPLOYEES.map(emp => (
                            <button key={emp.id} onClick={() => { onAssign(emp.id); setOpen(false); }}
                                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors text-left border-none cursor-pointer
                                    ${currentId === emp.id ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                                    {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate">{emp.name}</div>
                                    <div className="text-[10px] text-gray-400">{emp.role}</div>
                                </div>
                                {currentId === emp.id && <Check size={13} className="text-blue-500 shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function AdOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [activeOrderId, setActiveOrderId] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [orderTracking, setOrderTracking] = useState(() => {
        try {
            const saved = localStorage.getItem('orderTracking');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });
    const [assignments, setAssignments] = useState(() => {
        try {
            const saved = localStorage.getItem('assignments');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const [assignConfirm, setAssignConfirm] = useState({
        show: false,
        orderId: null,
        empId: null,
    });

    // Fetch orders and bookings from API
    useEffect(() => {
        const fetchOrdersAndBookings = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch both orders and bookings in parallel
                const [orderResponse, bookingResponse] = await Promise.allSettled([
                    orderApi.getAllOrders(),
                    bookingApi.getAllBookings()
                ]);

                let allItems = [];

                // Process orders
                if (orderResponse.status === 'fulfilled') {
                    console.log('Order Response:', orderResponse.value);
                    const orderData = orderResponse.value?.orders || orderResponse.value?.data || [];
                    const ordersArray = Array.isArray(orderData) ? orderData : [];
                    console.log('Orders Array:', ordersArray);
                    allItems.push(...ordersArray);
                }

                // Process bookings and convert to order format
                if (bookingResponse.status === 'fulfilled') {
                    console.log('Booking Response:', bookingResponse.value);
                    const bookingData = bookingResponse.value?.bookings || bookingResponse.value?.data || [];
                    const bookingsArray = Array.isArray(bookingData) ? bookingData : [];
                    console.log('Bookings Array:', bookingsArray);

                    // Convert bookings to order-like format
                    const convertedBookings = bookingsArray.map(booking => {
                        // Ensure valid date - use pickupDate, createdAt, or default to today
                        let validDate = null;
                        if (booking.pickupDate) {
                            const parsed = new Date(booking.pickupDate);
                            if (!isNaN(parsed.getTime())) validDate = parsed.toISOString();
                        }
                        if (!validDate && booking.createdAt) {
                            const parsed = new Date(booking.createdAt);
                            if (!isNaN(parsed.getTime())) validDate = parsed.toISOString();
                        }
                        if (!validDate) {
                            validDate = new Date().toISOString(); // Fallback to today
                        }

                        // Format drop date from the "Dropped Off" / "Drop Off" step only
                        let dropDate = 'N/A';
                        try {
                            // Look for Dropped Off or Drop Off step with a date
                            const droppedOffStep = booking.steps?.find(s => 
                                s.label?.toLowerCase().includes('drop') && s.date
                            );
                            
                            if (droppedOffStep?.date) {
                                const dateObj = new Date(droppedOffStep.date);
                                if (!isNaN(dateObj.getTime())) {
                                    dropDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                }
                            }
                            // Don't show anything if not dropped off yet
                        } catch (e) {
                            console.error('Date formatting error:', e);
                        }

                        return {
                            ...booking,
                            id: booking.id || booking._id,
                            orderId: booking._id,
                            customer: booking.contact?.fullName || booking.customerName || 'Unknown',
                            item: booking.service || booking.bookingType || 'Service',
                            serviceType: booking.bookingType === 'jersey' ? 'Team Jersey' 
                                        : booking.bookingType === 'organizational' ? 'Organization'
                                        : booking.bookingType === 'repair' ? 'Repair' : 'Service',
                            status: booking.status || 'Pending',
                            isBooking: true,
                            date: dropDate,
                            createdAt: booking.createdAt,
                            // Format invoice with items
                            invoice: { 
                                dueDate: validDate,
                                billTo: {
                                    name: booking.contact?.fullName || 'Unknown',
                                    phone: booking.contact?.phone,
                                    email: booking.contact?.email,
                                    address: booking.contact?.address,
                                },
                                items: booking.items && booking.items.length > 0 
                                    ? booking.items 
                                    : booking.selectedOptions && booking.selectedOptions.length > 0
                                    ? booking.selectedOptions.map(opt => ({
                                        description: opt.name || 'Service',
                                        qty: opt.quantity || 1,
                                        unitPrice: opt.price || 0,
                                        addOnPrice: 0,
                                      }))
                                    : [
                                        {
                                            description: booking.service || booking.bookingType || 'Service',
                                            qty: 1,
                                            unitPrice: 0,
                                            addOnPrice: 0,
                                        }
                                    ],
                            },
                            // Preserve contact information
                            contact: booking.contact || {},
                            phone: booking.contact?.phone || 'N/A',
                            email: booking.contact?.email || 'N/A',
                            address: booking.contact?.address || 'N/A',
                        };
                    });
                    allItems.push(...convertedBookings);
                }

                // Sort by date (newest first)
                allItems.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

                setOrders(allItems);

                // Set first order as active if exists
                if (allItems.length > 0) {
                    setActiveOrderId(allItems[0].id || allItems[0]._id);
                }
            } catch (err) {
                console.error('Failed to fetch orders and bookings:', err);
                setError('Failed to load orders.');
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrdersAndBookings();
    }, []);

    const filteredOrders = useMemo(() => {
        let result = orders.filter(o =>
            (o.customer || o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.id || o._id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.item || o.itemType || o.serviceType || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filterStatus === 'In Progress') result = result.filter(o => getDerivedStatus(o) === 'In Progress');
        else if (filterStatus === 'Ready') result = result.filter(o => getDerivedStatus(o) === 'Ready');
        else if (filterStatus === 'Overdue') result = result.filter(o => getDerivedStatus(o) === 'Overdue');
        return result;
    }, [searchQuery, filterStatus, orders]);

    const counts = useMemo(() => {
        const c = { All: 0, 'In Progress': 0, 'Ready': 0, 'Overdue': 0 };
        orders.forEach(o => { c.All++; const s = getDerivedStatus(o); if (c[s] !== undefined) c[s]++; });
        return c;
    }, [orders]);

    const activeOrder = useMemo(() => {
        const orderId = activeOrderId;
        if (!orderId) return null;
        return orders.find(o => (o.id || o._id) === orderId);
    }, [activeOrderId, orders]);
    const activeOrderSteps = useMemo(() =>
        activeOrder?.steps || (activeOrder ? (SERVICE_STEPS[activeOrder.serviceType] || SERVICE_STEPS['Team Jersey']).map(label => ({ label })) : []),
        [activeOrder]
    );
    const currentStepIdx = useMemo(() => getActiveStepIndex(activeOrder, orderTracking), [activeOrder, orderTracking]);
    const assignedEmployee = useMemo(() => {
        if (!activeOrder) return null;
        const empId = assignments[activeOrder.id || activeOrder._id];
        return empId ? EMPLOYEE_POOL.find(e => e.id === empId) : null;
    }, [activeOrder, assignments]);
    const earningsPreview = useMemo(() => {
        if (!activeOrder) return null;
        return computeOrderEarnings(activeOrder, assignments[activeOrder.id || activeOrder._id]);
    }, [activeOrder, assignments]);

    const handleStepClick = (orderId, stepIndex) => {
        console.log('handleStepClick called:', orderId, stepIndex);
        
        // First, update the step date in the order data
        const orderToUpdate = orders.find(o => (o.id || o._id) === orderId);
        setOrders(prev =>
            prev.map(order => {
                if ((order.id || order._id) === orderId && order.steps) {
                    console.log('Updating order steps for:', orderId);
                    const updatedSteps = [...order.steps];
                    if (updatedSteps[stepIndex]) {
                        console.log('Step before update:', updatedSteps[stepIndex]);
                        updatedSteps[stepIndex] = {
                            ...updatedSteps[stepIndex],
                            date: new Date().toISOString().split('T')[0], 
                            done: true,
                            active: true,
                        };
                        console.log('Step after update:', updatedSteps[stepIndex]);
                        
                        // Persist to backend
                        const isBooking = !!order.bookingType;
                        const orderIdToUse = order._id || order.id;
                        if (isBooking) {
                            bookingApi.updateBooking(orderIdToUse, { steps: updatedSteps })
                                .then(() => console.log('Booking steps persisted to backend'))
                                .catch(err => console.error('Failed to persist booking steps:', err));
                        } else {
                            orderApi.updateOrder(orderIdToUse, { steps: updatedSteps })
                                .then(() => console.log('Order steps persisted to backend'))
                                .catch(err => console.error('Failed to persist order steps:', err));
                        }
                    }
                    return { ...order, steps: updatedSteps };
                }
                return order;
            })
        );

        // Now update orderTracking to auto-advance to next uncompleted step
        setOrderTracking(prev => {
            let nextStepIdx = stepIndex + 1;
            
            // Check if the updated order has more steps
            if (orderToUpdate && orderToUpdate.steps && nextStepIdx < orderToUpdate.steps.length) {
                // Skip any already-done steps
                while (nextStepIdx < orderToUpdate.steps.length && orderToUpdate.steps[nextStepIdx]?.done) {
                    nextStepIdx++;
                }
            }
            
            const updated = { ...prev, [orderId]: nextStepIdx };
            localStorage.setItem('orderTracking', JSON.stringify(updated));
            console.log(`Auto-advanced tracking from ${stepIndex} to ${nextStepIdx}`);
            return updated;
        });
    };
    const handleAssign = (orderId, empId) => {
        setAssignConfirm({
            show: true,
            orderId,
            empId,
        });
    };

    const confirmAssign = () => {
        const { orderId, empId } = assignConfirm;
        
        // Find the employee name
        const employee = EMPLOYEE_POOL.find(e => e.id === empId);
        const assignedTailorName = employee ? employee.name : empId;

        setAssignments(prev => {
            const updated = { ...prev, [orderId]: empId };
            localStorage.setItem('assignments', JSON.stringify(updated));
            return updated;
        });

        // Persist to backend
        setOrders(prev =>
            prev.map(order => {
                if ((order.id || order._id) === orderId) {
                    const isBooking = !!order.bookingType;
                    const orderIdToUse = order._id || order.id;

                    if (isBooking) {
                        bookingApi.updateBooking(orderIdToUse, { assignedTailor: assignedTailorName })
                            .then(() => console.log('Booking tailor assigned:', assignedTailorName))
                            .catch(err => console.error('Failed to assign tailor to booking:', err));
                    } else {
                        orderApi.assignEmployee(orderIdToUse, empId)
                            .then(() => console.log('Order tailor assigned:', assignedTailorName))
                            .catch(err => console.error('Failed to assign tailor to order:', err));
                    }

                    // Update local state
                    return { ...order, assignedTailor: assignedTailorName };
                }
                return order;
            })
        );

        // Close modal
        setAssignConfirm({ show: false, orderId: null, empId: null });
    };

    const cancelAssign = () => {
        setAssignConfirm({ show: false, orderId: null, empId: null });
    };

    // Show loading state
    if (loading) {
        return (
            <div className="font-inter min-h-screen bg-slate-50 flex flex-col p-3 lg:p-6 pb-20">
                <div className="flex items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black text-gray-800 tracking-tight">Orders</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your orders</p>
                    </div>
                </div>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 text-sm font-medium">Loading orders...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Show error state
    if (error && orders.length === 0) {
        return (
            <div className="font-inter min-h-screen bg-slate-50 flex flex-col p-3 lg:p-6 pb-20">
                <div className="flex items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black text-gray-800 tracking-tight">Orders</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your orders</p>
                    </div>
                </div>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-gray-700 font-medium">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="font-inter min-h-screen bg-slate-50flex flex-col p-3 lg:p-6 pb-20">
            <div className="flex items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl  lg:text-3xl  font-black text-gray-800 tracking-tight">Orders</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your orders</p>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total Orders', value: counts.All, icon: CheckCircle2, color: '#2563EB', sub: 'All appointments' },
                    { label: 'In Progress', value: counts['In Progress'], icon: Clock, color: '#D97706', sub: 'Currently active' },
                    { label: 'Ready', value: counts.Ready, icon: Check, color: '#059669', sub: 'Ready for pickup' },
                    { label: 'Overdue', value: counts.Overdue, icon: AlertCircle, color: '#DC2626', sub: 'Past due date' },
                ].map(card => (
                    <div
                        key={card.label}
                        className="bg-white rounded-2xl py-4 px-5 relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
                    >
                        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: card.color }} />
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: card.color + "18", border: `1.5px solid ${card.color}30` }}>
                                <card.icon size={18} color={card.color} strokeWidth={2} />
                            </div>
                            <div>
                                <div className="text-[13px] font-semibold text-gray-500">{card.label}</div>
                                <div className="text-[18px] font-extrabold text-gray-900 leading-none mt-0.5">{card.value}</div>
                            </div>

                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-6">
                {/* LEFT LIST */}
                <div className={`w-full lg:w-[380px] xl:w-[420px] shrink-0 flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-64px)] ${activeOrder ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-5 lg:p-6 pb-4 border-b border-gray-50 shrink-0 relative">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Orders</h2>
                        </div>
                        <div className="flex gap-2 relative">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" placeholder="Search orders..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-50 border border-transparent focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-3 pl-10 pr-4 text-sm font-medium text-gray-700 placeholder:text-gray-400 outline-none transition-all" />
                            </div>
                            <div className="relative">
                                <button onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={`p-3 rounded-2xl border transition-all flex items-center justify-center cursor-pointer
                                    ${isFilterOpen || filterStatus !== 'All' ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}>
                                    <Filter size={18} />
                                    {filterStatus !== 'All' && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full" />}
                                </button>
                                {isFilterOpen && (
                                    <div className="absolute right-0 top-14 w-64 bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 z-30">
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Filters</h3>
                                            <button onClick={() => setFilterStatus('All')} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tighter bg-transparent border-none cursor-pointer">Reset</button>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Order Status</label>
                                            <div className="flex flex-col gap-1.5">
                                                {['All', 'In Progress', 'Ready', 'Overdue'].map(tab => (
                                                    <button key={tab} onClick={() => setFilterStatus(tab)}
                                                        className={`px-3 py-2 text-[11px] font-bold rounded-lg border transition-all flex items-center justify-between cursor-pointer
                                                        ${filterStatus === tab ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'}`}>
                                                        {tab}
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${filterStatus === tab ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{counts[tab]}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 custom-scrollbar">
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-sm font-medium">No orders found</div>
                        ) : (
                            filteredOrders.map(order => {
                                const orderId = order.id || order._id;
                                const isSelected = activeOrderId === orderId;
                                const derivedStatus = getDerivedStatus(order);
                                const statusConf = STATUS_CONFIG[derivedStatus] || STATUS_CONFIG['Pending'];
                                const orderStepIdx = getActiveStepIndex(order, orderTracking);
                                const orderSteps = order.steps || SERVICE_STEPS[order.serviceType] || SERVICE_STEPS['Team Jersey'];
                                const currentStageLabel = orderSteps[orderStepIdx]?.label || orderSteps[orderStepIdx] || 'Pending';
                                const priorityConf = order.priority ? PRIORITY_CONFIG[order.priority] : null;
                                const typeConf = TYPE_CONFIG[order.serviceType] || TYPE_CONFIG['Team Jersey'];
                                const listAssignee = assignments[orderId] ? EMPLOYEE_POOL.find(e => e.id === assignments[orderId]) : null;
                                return (
                                    <div key={orderId} onClick={() => setActiveOrderId(orderId)}
                                        className={`cursor-pointer rounded-2xl relative transition-all duration-200 border overflow-hidden
                                        ${isSelected ? 'bg-blue-50/30 border-blue-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'}`}>
                                        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                                        <div className="p-4 pl-5">
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-[11px] font-bold text-gray-500 tracking-wider">{orderId}</span>
                                                <div className="flex items-center gap-1.5">
                                                    {order.isBooking && (
                                                        <span className="text-[9px] font-black uppercase px-2 py-1 rounded border border-purple-200 bg-purple-50 text-purple-600 tracking-wider">Booking</span>
                                                    )}
                                                    {priorityConf && order.priority === 'Rush' && (
                                                        <span className={`flex items-center text-[9px] font-black uppercase px-2 py-1 rounded border tracking-wider ${priorityConf.color}`}>{priorityConf.icon} {order.priority}</span>
                                                    )}
                                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-wider ${statusConf.color}`}>{statusConf.label}</span>
                                                </div>
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-900 mb-1 leading-tight">{order.customer || order.customerName || 'Unknown'}</h3>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeConf.color}`}>{order.serviceType || order.orderType || 'Service'}</span>
                                                <span className="text-xs font-medium text-gray-500 truncate max-w-[160px]" title={order.item}>{order.item || order.itemType || 'Item'}</span>
                                            </div>
                                            {listAssignee && (
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-black text-blue-600 shrink-0">
                                                        {listAssignee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-blue-600 truncate">{listAssignee.name}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100/80">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                                                    <div className={`w-2 h-2 rounded-full ${derivedStatus === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                    {currentStageLabel}
                                                </div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                                    Due: <span className={derivedStatus === 'Overdue' ? 'text-red-500' : 'text-gray-600'}>
                                                        {new Date(order.invoice?.dueDate || order.estimatedCompletion).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT DETAIL */}
                <div className={`flex-1 flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-64px)] ${activeOrder ? 'flex' : 'hidden lg:flex'}`}>
                    {activeOrder ? (
                        <div className="flex flex-col h-full">
                            <div className="p-5 lg:px-8 lg:py-6 border-b border-gray-50 shrink-0">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setActiveOrderId(null)} className="lg:hidden p-1.5 -ml-2 mr-1 text-gray-400 hover:text-gray-700 bg-gray-50 rounded-lg border-none cursor-pointer">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                        </button>
                                        <span className="text-[11px] lg:text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg tracking-wider">{activeOrder.id}</span>
                                        {activeOrder.isBooking && (
                                            <span className="text-[11px] lg:text-xs font-bold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg tracking-wider">BOOKING</span>
                                        )}
                                        {activeOrder.priority === 'Rush' && (
                                            <span className="flex items-center gap-1 text-[11px] lg:text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg tracking-wider"><AlertCircle size={14} /> RUSH</span>
                                        )}
                                        {getDerivedStatus(activeOrder) === 'Overdue' && (
                                            <span className="text-[11px] lg:text-xs font-bold text-white bg-red-500 px-3 py-1.5 rounded-lg tracking-wider">OVERDUE</span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-white rounded-xl transition-all shadow-sm bg-transparent cursor-pointer"><MoreHorizontal size={20} /></button>
                                        {isMenuOpen && (
                                            <div className="absolute right-0 top-12 w-48 bg-white border border-gray-100 shadow-xl rounded-2xl py-2 z-20">
                                                <button className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors bg-transparent border-none cursor-pointer"><Edit size={16} className="text-gray-400" /> Edit Order</button>
                                                <a href="/admin/appointment" className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 block"><CalendarClock size={16} className="text-gray-400" /> Reschedule</a>
                                                <button className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors mt-1 bg-transparent border-none cursor-pointer"><XCircle size={16} className="text-red-500" /> Cancel Order</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h1 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight flex items-baseline gap-2">
                                    <span className="text-gray-400 font-bold capitalize">{activeOrder.serviceType}</span>
                                    <span className="text-gray-300">-</span>
                                    {activeOrder.item}
                                </h1>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mt-4 opacity-90">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600"><User size={16} className="text-gray-400" />{activeOrder.invoice?.billTo?.name || activeOrder.customer}</div>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600"><Phone size={16} className="text-gray-400" />{activeOrder.invoice?.billTo?.phone || activeOrder.phone || activeOrder.contact?.phone || 'N/A'}</div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 lg:p-8 custom-scrollbar relative" onClick={() => setIsMenuOpen(false)}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                                    <div className="col-span-2 flex flex-col gap-8">
                                        {/* PROGRESS BAR */}
                                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400">Workflow Progress</h3>
                                                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                                                    {currentStepIdx >= activeOrderSteps.length - 1
                                                        ? 'Ready for Pickup'
                                                        : `Step ${currentStepIdx + 1} of ${activeOrderSteps.length}`}
                                                </span>
                                            </div>
                                            <div className="relative flex justify-between items-start px-4">
                                                <div className="absolute top-4 left-4 right-4 h-1 bg-gray-100 rounded-full z-0" />
                                                <div
                                                    className="absolute top-4 left-4 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full z-0 transition-all duration-500"
                                                    style={{
                                                        width: activeOrderSteps.length <= 1
                                                            ? '0%'
                                                            : `${Math.min(100, (currentStepIdx / (activeOrderSteps.length - 1)) * 100)}%`
                                                    }}
                                                />
                                                {activeOrderSteps.map((step, idx) => {
                                                    const isCompleted = idx < currentStepIdx;
                                                    const isCurrent = idx === currentStepIdx;
                                                    const label = step.label || step;
                                                    const Icon = STEP_ICON[label.toLowerCase()] || null;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="relative z-10 flex flex-col items-center gap-2 flex-1 group cursor-pointer"
                                                            onClick={() => handleStepClick(activeOrder.id, idx)}
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ring-4 ring-white shadow-sm shrink-0
                                                            ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-gray-300 text-white ring-slate-100' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                                                                {isCompleted
                                                                    ? <Check size={14} strokeWidth={3} />
                                                                    : Icon ? <Icon size={14} /> : null
                                                                }
                                                            </div>
                                                            <span className={`text-[10px] font-bold text-center leading-tight px-0.5 max-w-[60px] break-words
                                                            ${isCompleted ? 'text-green-600' : isCurrent ? 'text-green-600' : 'text-gray-400'}`}>
                                                                {label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {/* TIMELINE */}
                                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                            <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2"><Clock size={18} className="text-blue-500" />Production Progress</h3>
                                            <div className="relative pl-4 space-y-6">
                                                <div className="absolute left-[15px] top-3 bottom-5 w-0.5 bg-gray-100" />
                                                {activeOrderSteps.map((step, idx) => {
                                                    const isCompleted = idx < currentStepIdx || step.done;
                                                    const isCurrent = idx === currentStepIdx;
                                                    const label = step.label || step;
                                                    return (
                                                        <div key={idx} className="relative flex items-start gap-4 cursor-pointer group" onClick={() => handleStepClick(activeOrder.id, idx)}>
                                                            <div className="relative z-10 bg-white py-1">
                                                                {isCompleted ? (
                                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 ring-4 ring-white -ml-2.5"><Check size={16} strokeWidth={3} /></div>
                                                                ) : isCurrent ? (
                                                                    <div className="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-50 -ml-0.5" />
                                                                ) : (
                                                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white -ml-0.5" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 -mt-1 pb-4">
                                                                <div className={`text-sm font-black tracking-wide transition-colors flex items-center justify-between ${(isCompleted || isCurrent) ? 'text-gray-900' : 'text-gray-400'}`}>
                                                                    <span>{label}</span>
                                                                    {(isCompleted || isCurrent) && step.worker && (
                                                                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-md"><User size={10} className="inline mr-1" />{step.worker}</span>
                                                                    )}
                                                                </div>
                                                                {(step.time || step.date) && (isCompleted || isCurrent) && (
                                                                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100/50">
                                                                        <div><span className="font-semibold text-gray-400">Started:</span> {step.date} - {step.time}</div>
                                                                        {step.endTime && <div><span className="font-semibold text-gray-400">Completed:</span> {step.endTime}</div>}
                                                                        {step.duration && <div><span className="font-semibold text-gray-400">Duration:</span> {step.duration}</div>}
                                                                    </div>
                                                                )}
                                                                {isCurrent && !isCompleted && idx < activeOrderSteps.length && (
                                                                    <button onClick={e => { e.stopPropagation(); handleStepClick(activeOrder.id, idx); }} className="mt-3 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm w-full sm:w-auto border-none cursor-pointer">
                                                                        Mark as {label}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {activeOrder.players && activeOrder.players.length > 0 && (
                                            <div className="bg-white border text-sm border-gray-100 rounded-2xl p-6 shadow-sm">
                                                <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2"><User size={18} className="text-orange-500" />Team Roster</h3>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="border-b-2 border-gray-100">
                                                                <th className="pb-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Player Name</th>
                                                                <th className="pb-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider text-center">Number</th>
                                                                <th className="pb-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider text-center">Size</th>
                                                                <th className="pb-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider text-right">Name Print</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {activeOrder.players.map((player, idx) => (
                                                                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors last:border-0">
                                                                    <td className="py-3 font-bold text-gray-900">{player.name}</td>
                                                                    <td className="py-3 text-center font-semibold text-gray-600">{player.number}</td>
                                                                    <td className="py-3 text-center font-black text-blue-600 bg-blue-50/30 rounded">{player.size}</td>
                                                                    <td className="py-3 text-right font-medium text-gray-600">
                                                                        {(player.namePrint === 'Yes' || player.hasPocketShorts) ? (
                                                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-md text-[11px] font-bold">YES</span>
                                                                        ) : (
                                                                            <span className="px-2.5 py-1 bg-white border border-gray-200 text-gray-400 rounded-md text-[11px] font-bold">NO</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-1 flex flex-col gap-6 lg:gap-8">
                                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-3">
                                            <h4 className="text-[11px] font-black tracking-wider uppercase mb-2 text-gray-400">Quick Actions</h4>
                                            <button className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border-none cursor-pointer"><Edit size={18} /> Edit Order Details</button>
                                            <a href="/admin/appointment" className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 text-center"><CalendarClock size={18} /> Reschedule Delivery</a>
                                        </div>

                                        {/* aDD*/}
                                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="bg-blue-50/60 px-5 py-4 border-b border-blue-100/60">
                                                <h4 className="text-[11px] font-black text-blue-900 tracking-wider uppercase flex items-center gap-2">
                                                    <UserCheck size={13} className="text-blue-600" />Assigned Tailor / Staff
                                                </h4>
                                            </div>
                                            <div className="p-5 flex flex-col gap-4">
                                                <AssignEmployeeDropdown currentId={assignments[activeOrder.id]} onAssign={(empId) => handleAssign(activeOrder.id, empId)} />
                                                {assignedEmployee ? (
                                                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3.5 py-3 border border-gray-100">
                                                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[12px] font-black text-blue-700 shrink-0">
                                                            {assignedEmployee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-bold text-gray-900 truncate">{assignedEmployee.name}</div>
                                                            <div className="text-[11px] text-gray-400">{assignedEmployee.role} · {assignedEmployee.dept}</div>
                                                        </div>
                                                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-[12px] text-gray-400 bg-gray-50 rounded-xl px-3.5 py-3 border border-dashed border-gray-200">
                                                        <User size={14} className="text-gray-300" />No one assigned yet
                                                    </div>
                                                )}
                                                {assignedEmployee && activeOrder.invoice?.items?.length > 0 && (
                                                    <div className="mt-1">
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Work Items</div>
                                                        <div className="flex flex-col gap-1.5">
                                                            {activeOrder.invoice.items.map((item, i) => (
                                                                <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                                                    <span className="font-semibold text-gray-700">{item.description}</span>
                                                                    <span className="font-black text-gray-900">{item.qty} pcs</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {earningsPreview && (
                                                    <div className="mt-1 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                                                        <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Earnings Preview</div>
                                                        <div className="flex flex-col gap-1.5 mb-2.5">
                                                            {earningsPreview.lines.map((line, i) => (
                                                                <div key={i} className="flex justify-between text-[11px]">
                                                                    <span className="text-blue-600 font-medium">{line.qty} {line.label}s × {fmt(line.rate)}</span>
                                                                    <span className="font-bold text-blue-900">{fmt(line.earned)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex justify-between pt-2 border-t border-blue-200">
                                                            <span className="text-[11px] font-bold text-blue-800">Total Salary</span>
                                                            <span className="text-sm font-black text-blue-900">{fmt(earningsPreview.total)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Summary */}
                                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="bg-blue-50/50 p-5 border-b border-gray-50">
                                                <h4 className="text-[11px] font-black text-blue-900 tracking-wider uppercase mb-5">Order Details</h4>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center text-sm"><span className="font-semibold text-gray-500">Drop Date</span><span className="font-bold text-gray-900">{getDropDate(activeOrder)}</span></div>
                                                    <div className="flex justify-between items-center text-sm"><span className="font-semibold text-gray-500">Due Date</span><span className={`font-bold ${isOverdue(activeOrder.invoice?.dueDate || activeOrder.estimatedCompletion) ? 'text-red-500' : 'text-gray-900'}`}>{activeOrder.invoice?.dueDate ? new Date(activeOrder.invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : activeOrder.estimatedCompletion || 'N/A'}</span></div>
                                                    <div className="flex justify-between items-center text-sm"><span className="font-semibold text-gray-500">Assigned To</span><span className="font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded">{assignedEmployee?.name || activeOrder.assignedTailor || activeOrder.tailor || 'Unassigned'}</span></div>
                                                </div>
                                            </div>
                                            <div className="p-5 bg-white">
                                                <div className="space-y-3 mb-5">
                                                    {activeOrder.invoice?.items?.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-start text-sm">
                                                            <div className="pr-4"><div className="font-semibold text-gray-800 line-clamp-1">{item.description}</div><div className="text-[11px] font-medium text-gray-400 mt-0.5">Qty: {item.qty}</div></div>
                                                            <div className="font-bold text-gray-900 whitespace-nowrap">₱{((item.qty * item.unitPrice) + (item.addOnPrice || 0)).toLocaleString()}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                                    <span className="text-xs uppercase tracking-wider font-bold text-gray-500">Total Price</span>
                                                    <span className="text-lg font-black text-gray-900">₱{activeOrder.invoice?.items?.reduce((s, i) => s + i.unitPrice * i.qty + (i.addOnPrice || 0), 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            <p className="font-medium text-sm text-gray-400">Select an order to view production details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Assignment Confirmation Modal */}
            {assignConfirm.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                        <div className="bg-[#0F172A] p-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <AlertCircle size={20} />
                                Assign Tailor
                            </h3>
                        </div>
                        <div className="p-6">
                            {(() => {
                                const employee = EMPLOYEE_POOL.find(e => e.id === assignConfirm.empId);
                                const empName = employee ? employee.name : assignConfirm.empId;
                                return (
                                    <>
                                        <p className="text-gray-600 text-sm mb-2">Are you sure you want to assign</p>
                                        <p className="text-gray-900 font-bold text-lg mb-6 bg-blue-50 p-3 rounded-lg">"{empName}"</p>
                                        <p className="text-gray-600 text-sm">to this order? This action cannot be undone.</p>
                                    </>
                                );
                            })()}
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
                            <button
                                onClick={cancelAssign}
                                className="px-4 py-2 rounded-lg font-bold text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAssign}
                                className="px-4 py-2 rounded-lg font-bold text-sm text-white bg-[#0F172A] hover:bg-slate-900 transition-colors cursor-pointer"
                            >
                                Confirm Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}