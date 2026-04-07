export const MOCK_ORDERS = [
  {
    id: "69bb11e3340feed225968f61",
    type: "BOOKING",
    status: "OVERDUE",
    serviceTitle: "Team Jersey",
    category: "Full Set (Jersey + Shorts)",
    teamName: "Eagles Basketball",
    customerName: "Mark Emel Silla",
    contact: "+639991925251",
    workflowStep: 2,
    workflowTotal: 5,
    productionProgress: [
      { step: "Dropped Off", date: "2026-03-18", worker: "Ana V." },
      { step: "Layout", date: "2026-03-18", worker: "Ben A." },
      { step: "Printing", active: true, action: "Mark as Printed" },
      { step: "Sewing" },
      { step: "Pick-up" }
    ],
    teamRoster: [
      { 
        surname: "Silla", 
        number: 3, 
        productType: "Full Set", 
        jerseySize: "S", 
        shortSize: "S", 
        addOns: ["Long Sleeve", "Pockets"] 
      },
      { 
        surname: "Reyes", 
        number: 10, 
        productType: "Jersey Only", 
        jerseySize: "M", 
        shortSize: "-", 
        addOns: [] 
      },
      { 
        surname: "Santos", 
        number: 7, 
        productType: "Full Set", 
        jerseySize: "L", 
        shortSize: "L", 
        addOns: ["Hoodie"] 
      }
    ],
    assignedTo: "Marco Reyes",
    assignedBy: "Admin",
    dropDate: "2026-03-18",
    createdAt: "2026-03-19",
    dueDate: "2026-03-25",
    items: [
      { name: "Jersey Only", qty: 1 },
      { name: "Full Set", qty: 2 },
      { name: "Pocket", qty: 1 },
      { name: "Long Sleeve", qty: 1 },
      { name: "Hoodie", qty: 1 }
    ],
    totalPrice: 2550
  },
  {
    id: "69c3902f8bd1d962e20800fd",
    type: "BOOKING",
    status: "OVERDUE",
    serviceTitle: "Repair",
    category: "School Uniform Alteration",
    customerName: "John Lourence Lingad",
    contact: "+639513164112",
    workflowStep: 1,
    workflowTotal: 5,
    productionProgress: [
      { step: "Dropped Off", action: "Mark as Dropped Off" },
      { step: "Layout" },
      { step: "Printing" },
      { step: "Sewing" },
      { step: "Pick-up" }
    ],
    teamRoster: [],
    assignedTo: "Unassigned",
    assignedBy: "Admin",
    dropDate: "2026-03-20",
    createdAt: "2026-03-21",
    dueDate: "2026-03-27",
    items: [
      { name: "Zipper Replacement", qty: 1 }
    ],
    totalPrice: 150
  }
];

// Simulated logged-in staff
export const CURRENT_STAFF = "Marco Reyes";
