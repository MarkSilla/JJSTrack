// Unified Mock Data Source
// This file contains all mock data for both active orders and archived records.

export const CURRENT_STAFF = "Marco Reyes";

export const MOCK_ORDERS = [
    // 1. TEAM JERSEY
    {
        id: "ord-act-001",
        type: "TEAM_JERSEY",
        status: "In Progress",
        serviceTitle: "Team Jersey",
        category: "Full Set (Jersey + Shorts)",
        teamName: "Eagles Basketball",
        customerName: "Mark Emel Silla",
        contact: "+639991234567",
        workflowStep: 2,
        workflowTotal: 5,
        assignedTo: "Marco Reyes",
        assignedBy: "Admin",
        dropDate: "2026-03-20",
        dueDate: "2026-04-15",
        items: [
            { name: "Full Set", qty: 12 },
            { name: "Pocket", qty: 4 },
            { name: "Longsleeve", qty: 2 }
        ],
        totalQty: 12,
        teamRoster: [
            { surname: "Silla", number: 1, jerseySize: "M", shortSize: "M", addOns: ["Pocket"] },
            { surname: "Reyes", number: 10, jerseySize: "L", shortSize: "L", addOns: ["Longsleeve"] },
            { surname: "Santos", number: 5, jerseySize: "S", shortSize: "S", addOns: ["Pocket"] },
            { surname: "Pineda", number: 7, jerseySize: "M", shortSize: "M", addOns: [] },
            { surname: "Castillo", number: 8, jerseySize: "L", shortSize: "L", addOns: ["Pocket", "Hoodie Tshirt"] },
            { surname: "Torres", number: 23, jerseySize: "XL", shortSize: "XL", addOns: ["Longsleeve"] },
            { surname: "Mendoza", number: 11, jerseySize: "M", shortSize: "M", addOns: [] },
            { surname: "Lopez", number: 15, jerseySize: "L", shortSize: "L", addOns: ["Pocket"] },
            { surname: "Garcia", number: 2, jerseySize: "S", shortSize: "S", addOns: [] },
            { surname: "Bautista", number: 4, jerseySize: "M", shortSize: "M", addOns: [] },
            { surname: "Velasco", number: 9, jerseySize: "L", shortSize: "L", addOns: [] },
            { surname: "Dizon", number: 3, jerseySize: "M", shortSize: "M", addOns: [] },
        ],
        productionProgress: [
            { step: "Dropped Off", date: "Mar 20, 2026", worker: "Ana V." },
            { step: "Layout", date: "Mar 21, 2026", worker: "Marco Reyes" },
            { step: "Printing", active: true },
            { step: "Sewing" },
            { step: "Pick-up" }
        ],
    },
    // 2. REPAIR
    {
        id: "ord-act-002",
        type: "REPAIR",
        status: "Pending",
        serviceTitle: "Uniform Alteration",
        category: "School Uniform Repair",
        customerName: "Carlos Dela Cruz",
        contact: "+639281112233",
        assignedTo: "Marco Reyes",
        assignedBy: "Admin",
        dropDate: "2026-04-05",
        dueDate: "2026-04-12",
        items: [
            { name: "Zipper Replacement", qty: 2 },
            { name: "Hemming", qty: 1 }
        ],
        totalQty: 3,
        teamRoster: [],
        productionProgress: [
            { step: "Dropped Off", date: "Apr 5, 2026", worker: "Ana V.", done: true },
            { step: "Sewing", active: true },
            { step: "Quality Check" },
            { step: "Pick-up" }
        ],
    },
    // 3. ORGANIZATIONAL
    {
        id: "ord-act-003",
        type: "ORGANIZATIONAL",
        status: "In Progress",
        serviceTitle: "Corporate Polos",
        category: "Staff Uniform",
        teamName: "Luzon University",
        customerName: "Dr. Aris Ramos",
        contact: "+639178881122",
        assignedTo: "Marco Reyes",
        assignedBy: "Admin",
        dropDate: "2026-04-01",
        dueDate: "2026-04-20",
        items: [
            { name: "Polo Shirt", qty: 30 }
        ],
        totalQty: 30,
        lineupImage: "/mock/lineup-luzon.png", 
        teamRoster: [],
        productionProgress: [
            { step: "Dropped Off", date: "Apr 1, 2026", worker: "Ana V.", done: true },
            { step: "Layout", date: "Apr 3, 2026", worker: "Marco Reyes", done: true },
            { step: "Printing", active: true },
            { step: "Sewing" },
            { step: "Pick-up" }
        ],
    }
];

export const ARCHIVED_ORDERS = [
    // 1. REPAIR TYPE
    {
        id: "arc-rep-101",
        type: "REPAIR",
        status: "Completed",
        serviceTitle: "Uniform Alteration",
        category: "School Uniform Repair",
        customerName: "Carlos Dela Cruz",
        contact: "+639281112233",
        assignedTo: "Marco Reyes",
        assignedBy: "Admin",
        dropDate: "2026-03-05",
        dueDate: "2026-03-12",
        completedAt: "2026-03-11",
        items: [
            { name: "Zipper Replacement", qty: 2 },
            { name: "Hemming", qty: 1 }
        ],
        totalQty: 3,
        teamRoster: [],
        productionProgress: [
            { step: "Dropped Off", date: "Mar 5, 2026", worker: "Ana V." },
            { step: "Sewing", date: "Mar 7, 2026", worker: "Marco Reyes" },
            { step: "Quality Check", date: "Mar 9, 2026", worker: "Marco Reyes" },
            { step: "Pick-up", date: "Mar 11, 2026", worker: "Marco Reyes" },
        ],
    },

    // 2. TEAM JERSEY (12 Players)
    {
        id: "arc-tm-202",
        type: "TEAM_JERSEY",
        status: "Completed",
        serviceTitle: "Team Jersey",
        category: "Full Set (Jersey + Shorts)",
        teamName: "Wolves Basketball",
        customerName: "Janice Ramos",
        contact: "+639175556677",
        assignedTo: "Marco Reyes",
        assignedBy: "Admin",
        dropDate: "2026-03-10",
        dueDate: "2026-03-20",
        completedAt: "2026-03-19",
        items: [
            { name: "Full Set", qty: 12 },
            { name: "Pocket", qty: 12 }
        ],
        totalQty: 12,
        teamRoster: [
            { surname: "Ramos", number: 10, jerseySize: "M", shortSize: "M", addOns: ["Pocket"] },
            { surname: "Santos", number: 5, jerseySize: "L", shortSize: "L", addOns: ["Pocket"] },
            { surname: "Garcia", number: 7, jerseySize: "S", shortSize: "S", addOns: ["Pocket"] },
            { surname: "Torres", number: 23, jerseySize: "XL", shortSize: "XL", addOns: ["Pocket"] },
            { surname: "Mendoza", number: 1, jerseySize: "M", shortSize: "M", addOns: ["Pocket"] },
            { surname: "Lopez", number: 15, jerseySize: "L", shortSize: "L", addOns: ["Pocket"] },
            { surname: "Castillo", number: 8, jerseySize: "S", shortSize: "S", addOns: ["Pocket"] },
            { surname: "Pineda", number: 12, jerseySize: "M", shortSize: "M", addOns: ["Pocket"] },
            { surname: "Dizon", number: 3, jerseySize: "L", shortSize: "L", addOns: ["Pocket"] },
            { surname: "Velasco", number: 11, jerseySize: "S", shortSize: "S", addOns: ["Pocket"] },
            { surname: "Mercado", number: 9, jerseySize: "XL", shortSize: "XL", addOns: ["Pocket"] },
            { surname: "Bautista", number: 4, jerseySize: "M", shortSize: "M", addOns: ["Pocket"] },
        ],
        productionProgress: [
            { step: "Dropped Off", date: "Mar 10, 2026", worker: "Ana V." },
            { step: "Layout", date: "Mar 12, 2026", worker: "Marco Reyes" },
            { step: "Printing", date: "Mar 14, 2026", worker: "Marco Reyes" },
            { step: "Sewing", date: "Mar 16, 2026", worker: "Marco Reyes" },
            { step: "Pick-up", date: "Mar 19, 2026", worker: "Marco Reyes" },
        ],
    },

    // 3. ORGANIZATIONAL (Image Lineup)
    {
        id: "arc-org-303",
        type: "ORGANIZATIONAL",
        status: "Completed",
        serviceTitle: "Office Polos",
        category: "Corporate Uniform",
        teamName: "JJS Tech Solutions",
        customerName: "Rica Gomez",
        contact: "+639198889900",
        assignedTo: "Marco Reyes",
        assignedBy: "Admin",
        dropDate: "2026-03-15",
        dueDate: "2026-03-25",
        completedAt: "2026-03-24",
        items: [
            { name: "Polo Shirt", qty: 50 }
        ],
        totalQty: 50,
        lineupImage: "/mock/sample-lineup.jpg", 
        teamRoster: [],
        productionProgress: [
            { step: "Dropped Off", date: "Mar 15, 2026", worker: "Ana V." },
            { step: "Printing", date: "Mar 18, 2026", worker: "Marco Reyes" },
            { step: "Sewing", date: "Mar 21, 2026", worker: "Marco Reyes" },
            { step: "Pick-up", date: "Mar 24, 2026", worker: "Marco Reyes" },
        ],
    }
];

export const ARCHIVE_ACTIVITY = [
    { id: 1, action: "Archived Order", target: "JJS Tech Solutions", staffName: "Marco Reyes", timestamp: "2026-03-24T14:30:00Z", type: "completion" },
    { id: 2, action: "Archived Order", target: "Wolves Basketball", staffName: "Marco Reyes", timestamp: "2026-03-19T10:15:00Z", type: "completion" },
    { id: 3, action: "Archived Order", target: "Carlos Dela Cruz", staffName: "Marco Reyes", timestamp: "2026-03-11T16:45:00Z", type: "completion" },
];
