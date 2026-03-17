export const mockAppointments = [
    { id: 1, service: 'Suit Fitting', date: 'Feb 22, 2026', time: '10:00 AM', status: 'Confirmed' },
    { id: 2, service: 'Team Collection', date: 'Feb 25, 2026', time: '2:30 PM', status: 'Pending' },
]

export const mockOrders = [
    {
        id: 'ORD-2026-001',
        item: 'Team Gilas',
        customer: 'Jhon Doe',
        date: 'Feb 10, 2026',
        estimatedCompletion: 'Feb 22, 2026',
        serviceType: 'Team Jersey',
        assignedTailor: 'Jayson',
        status: 'In Progress',
        priority: 'Normal',
        steps: [
            { label: 'Dropped Off', done: true, date: 'Feb 20', time: '8:00 AM', endTime: '8:30 AM', duration: '30m', worker: 'Lina' },
            { label: 'Layout', active: true, date: 'Feb 21', time: '1:00 PM', worker: 'Marco' },
            { label: 'Printing', done: false },
            { label: 'Sewing', done: false },
            { label: 'Pick-up', done: false },
        ],
        invoice: {
            id: 'INV-2026-001',
            date: 'Feb 10, 2026',
            dueDate: 'Feb 22, 2026',
            status: 'Paid',
            billTo: {
                name: 'Jhon Doe',
                address: 'Blk 24, Gordon Heights',
                city: 'Olongapo City, Zambales',
                phone: '0908 997 2332',
                email: 'jhon123@gmail.com',
            },
            payment: {
                method: 'Gcash',
                transactionId: '189-893829',
                paymentDate: 'Feb 10, 2026',
            },
            items: [
                { description: 'Team Gilas Jersey – Custom Print', type: 'Custom', qty: 1, unitPrice: 5000.00 },
            ],
            taxRate: null,
            discount: { label: 'Discount (Loyalty)', amount: null },
        },
    },
    {
        id: 'ORD-2026-002',
        item: 'Tshirt Repair',
        customer: 'Jhon Doe',
        date: 'Feb 14, 2026',
        estimatedCompletion: 'Feb 20, 2026',
        serviceType: 'Repair',
        assignedTailor: 'Jayson',
        status: 'In Progress',
        priority: 'Low Priority',
        steps: [
            { label: 'Drop Off', done: true, date: 'Feb 14', time: '11:00 AM', endTime: '11:10 AM', duration: '10m', worker: 'Lina' },
            { label: 'Cutting', done: true, date: 'Feb 15', time: '1:00 PM', endTime: '1:30 PM', duration: '30m', worker: 'Ben' },
            { label: 'Sewing', active: true, date: 'Feb 17', time: '9:00 AM', worker: 'Jane' },
            { label: 'Pick-up', done: false },
        ],
        invoice: {
            id: 'INV-2026-002',
            date: 'Feb 14, 2026',
            dueDate: 'Mar 10, 2026',
            status: 'Pending',
            billTo: {
                name: 'Jhon Doe',
                address: 'Blk 24, Gordon Heights',
                city: 'Olongapo City, Zambales',
                phone: '(555) 867-5313',
                email: 'jhondoe@example.com',
            },
            payment: {
                method: 'Gcash',
                transactionId: '189-893830',
                paymentDate: 'Feb 14, 2026',
            },
            items: [
                { description: 'Tshirt Repair – Sewing', type: 'Repair', qty: 1, unitPrice: 250.00 },
            ],
            taxRate: null,
        },
    },
    {
        id: 'ORD-2026-003',
        item: 'Team Heroes - Philippine Heroes Edition',
        customer: 'JJS Sportswear',
        date: 'Feb 20, 2026',
        estimatedCompletion: 'Mar 05, 2026',
        serviceType: 'Team Jersey',
        assignedTailor: 'Jayson',
        status: 'In Progress',
        priority: 'Rush',
        steps: [
            { label: 'Dropped Off', done: true, date: 'Feb 20', time: '8:00 AM', endTime: '8:30 AM', duration: '30m', worker: 'Lina' },
            { label: 'Layout', active: true, date: 'Feb 21', time: '1:00 PM', worker: 'Marco' },
            { label: 'Printing', done: false },
            { label: 'Sewing', done: false },
            { label: 'Pick-up', done: false },
        ],
        players: [
            { name: 'Rizal', number: '01', size: 'M', namePrint: 'Yes' },
            { name: 'Bonifacio', number: '02', size: 'L', namePrint: 'No' },
            { name: 'Mabini', number: '03', size: 'S', namePrint: 'Yes' },
            { name: 'Luna', number: '04', size: 'XL', namePrint: 'Yes' },
            { name: 'Del Pilar', number: '05', size: 'M', namePrint: 'No' },
        ],
        invoice: {
            id: 'INV-2026-003',
            date: 'Feb 20, 2026',
            dueDate: 'Mar 15, 2026',
            status: 'Pending',
            teamName: 'Malolos Republic',
            billTo: {
                name: 'Nat. Historical Commission',
                address: 'TM Kalaw St, Ermita',
                city: 'Manila, Metro Manila',
                phone: '0912 345 6789',
                email: 'nhcp@gov.ph',
            },
            items: [
                { description: 'Jersey (Rizal #01)', type: 'Custom', qty: 1, unitPrice: 650.00, size: 'M', addOn: 'Pocket Short (+100)', addOnPrice: 100 },
                { description: 'Jersey (Bonifacio #02)', type: 'Custom', qty: 1, unitPrice: 650.00, size: 'L', addOn: 'None', addOnPrice: 0 },
                { description: 'Jersey (Mabini #03)', type: 'Custom', qty: 1, unitPrice: 650.00, size: 'S', addOn: 'Pocket Short (+100)', addOnPrice: 100 },
                { description: 'Jersey (Luna #04)', type: 'Custom', qty: 1, unitPrice: 650.00, size: 'XL', addOn: 'Pocket Short (+100)', addOnPrice: 100 },
                { description: 'Jersey (Del Pilar #05)', type: 'Custom', qty: 1, unitPrice: 650.00, size: 'M', addOn: 'None', addOnPrice: 0 },
            ],
        },
    },
]



export const financials = {
    totalSale: 55750,
    revenue: 33250,
    expenses: 18400,
    netProfit: 14850,
};

export const expenseBreakdown = [
    { name: "Materials", value: 38, color: "#3B82F6", amount: 6992 },
    { name: "Salaries", value: 32, color: "#8B5CF6", amount: 5888 },
    { name: "Utilities", value: 15, color: "#F59E0B", amount: 2760 },
    { name: "Rent", value: 10, color: "#10B981", amount: 1840 },
    { name: "Misc", value: 5, color: "#EF4444", amount: 920 },
];

export const TOTAL_EXPENSES = expenseBreakdown.reduce((s, e) => s + e.amount, 0);


export const weeklyOrders = [
    { day: "Mon", orders: 4, completed: 2, cancelled: 0 },
    { day: "Tue", orders: 7, completed: 4, cancelled: 1 },
    { day: "Wed", orders: 5, completed: 3, cancelled: 0 },
    { day: "Thu", orders: 9, completed: 6, cancelled: 1 },
    { day: "Fri", orders: 12, completed: 8, cancelled: 2 },
    { day: "Sat", orders: 15, completed: 10, cancelled: 1 },
    { day: "Sun", orders: 6, completed: 4, cancelled: 0 },
];

export const serviceMix = [
    { name: "Repair", value: 35, color: "#EF4444" },
    { name: "Team Jersey", value: 35, color: "#3B82F6" },
    { name: "Organization", value: 30, color: "#F59E0B" },
];