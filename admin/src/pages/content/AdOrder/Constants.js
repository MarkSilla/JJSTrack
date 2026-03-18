import { AlertCircle } from 'lucide-react';
import { MdDesktopWindows, MdLocalShipping, MdLocalPrintshop, MdMoveToInbox } from 'react-icons/md';
import { GiSewingMachine, GiScissors } from 'react-icons/gi';

export const EMPLOYEE_POOL = [
    { id: 'EMP-001', name: 'Juan Dela Cruz', role: 'Tailor', dept: 'Production' },
    { id: 'EMP-002', name: 'Maria Santos', role: 'Tailor', dept: 'Production' },
    { id: 'EMP-003', name: 'Remy Cruz', role: 'Tailor', dept: 'Production' },
    { id: 'EMP-004', name: 'Marco Reyes', role: 'Sewing Staff', dept: 'Production' },
    { id: 'EMP-005', name: 'Ana Villanueva', role: 'Sewing Staff', dept: 'Production' },
    { id: 'EMP-006', name: 'Ben Aquino', role: 'Production Staff', dept: 'Production' },
];

export const ASSIGNABLE_ROLES = ['Tailor', 'Sewing Staff', 'Production Staff'];
export const ASSIGNABLE_EMPLOYEES = EMPLOYEE_POOL.filter(e => ASSIGNABLE_ROLES.includes(e.role));

export const STATUS_CONFIG = {
    "For Approval":      { color: "bg-violet-100 text-violet-700",      label: "For Approval" },
    "Completed":         { color: "bg-emerald-100 text-emerald-700", label: "Completed" },
    "Complete":          { color: "bg-emerald-100 text-emerald-700", label: "Completed" },
    "In-Progress":       { color: "bg-blue-100 text-blue-700",       label: "In Progress" },
    "In Progress":       { color: "bg-blue-100 text-blue-700",       label: "In Progress" },
    "Pending":           { color: "bg-amber-100 text-amber-700",     label: "Pending"  },
    "Ready":             { color: "bg-green-100 text-green-700",     label: "Ready" },
    "Overdue":           { color: "bg-red-100 text-red-600",         label: "Overdue" },
    "Cancel/Incomplete": { color: "bg-red-100 text-red-600",         label: "Cancelled" },
};

export const TYPE_CONFIG = {
    "Team Jersey":  { color: "bg-indigo-100 text-indigo-700" },
    "Organization": { color: "bg-teal-100 text-teal-700" },
    "Repair":       { color: "bg-orange-100 text-orange-700" },
};

export const SERVICE_STEPS = {
    "Team Jersey":  ["Dropped Off", "Layout", "Printing", "Sewing", "Pick-up"],
    "Organization": ["Dropped Off", "Layout", "Printing", "Sewing", "Pick-up"],
    "Repair":       ["Drop Off", "Cutting", "Sewing", "Pick-up"],
};

export const PRIORITY_CONFIG = {
    "Rush":         { color: "text-red-600 bg-red-50 border-red-200",     icon: AlertCircle },
    "Normal":       { color: "text-gray-600 bg-gray-50 border-gray-200",  icon: null },
    "Low Priority": { color: "text-slate-500 bg-slate-50 border-slate-200", icon: null },
};

export const PIECE_RATES = {
    'Jersey': 35, 'Shorts': 30, 'Polo': 40, 'T-Shirt': 28, 'Jacket': 65, 'Pants': 45,
};


export const STEP_ICON = {
    'dropped off': MdMoveToInbox,
    'drop off':    MdMoveToInbox,
    'layout':      MdDesktopWindows,
    'printing':    MdLocalPrintshop,
    'cutting':     GiScissors,
    'sewing':      GiSewingMachine,
    'pick-up':     MdLocalShipping,
};
