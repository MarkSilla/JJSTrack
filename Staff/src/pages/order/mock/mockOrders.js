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
      { surname: "Silla", number: 3, productType: "Full Set", jerseySize: "S", shortSize: "S", addOns: ["Long Sleeve", "Pockets"] },
      { surname: "Reyes", number: 10, productType: "Jersey Only", jerseySize: "M", shortSize: "-", addOns: [] },
      { surname: "Santos", number: 7, productType: "Full Set", jerseySize: "L", shortSize: "L", addOns: ["Hoodie"] },
      { surname: "Cruz", number: 24, productType: "Jersey Only", jerseySize: "XL", shortSize: "-", addOns: [] },
      { surname: "Garcia", number: 11, productType: "Full Set", jerseySize: "M", shortSize: "M", addOns: ["Pockets", "Hoodie Tshirt"] },
      { surname: "Ramos", number: 30, productType: "Full Set", jerseySize: "L", shortSize: "L", addOns: [] },
      { surname: "Torres", number: 2, productType: "Full Set", jerseySize: "S", shortSize: "S", addOns: ["Hoodie Long Sleeve"] },
      { surname: "Villafuerte", number: 15, productType: "Jersey Only", jerseySize: "XXL", shortSize: "-", addOns: [] },
      { surname: "Lopez", number: 23, productType: "Full Set", jerseySize: "XL", shortSize: "XL", addOns: ["Pockets"] },
      { surname: "Mendoza", number: 5, productType: "Full Set", jerseySize: "M", shortSize: "M", addOns: [] },
      { surname: "Castro", number: 1, productType: "Full Set", jerseySize: "S", shortSize: "S", addOns: ["Hoodie"] }
    ],
    assignedTo: "Marco Reyes",
    assignedBy: "Admin",
    dropDate: "2026-03-18",
    createdAt: "2026-03-19",
    dueDate: "2026-03-25",
    items: [
      { name: "Full Set", qty: 8 },
      { name: "Jersey Only", qty: 3 },
      { name: "Pockets", qty: 3 },
      { name: "Long Sleeve", qty: 1 },
      { name: "Hoodie", qty: 2 },
      { name: "Hoodie Tshirt", qty: 1 },
      { name: "Hoodie Long Sleeve", qty: 1 }
    ],
    totalPrice: 8450
  },
  {
    id: "69c3902f8bd1d962e20800fd",
    type: "REPAIR",
    status: "PENDING",
    serviceTitle: "Uniform Alteration",
    category: "School Uniform Repair",
    customerName: "John Lourence Lingad",
    contact: "+639513164112",
    workflowStep: 1,
    workflowTotal: 4,
    productionProgress: [
      { step: "Dropped Off", date: "2026-03-20", worker: "Ana V." },
      { step: "Sewing", active: true, action: "Mark as Repaired" },
      { step: "Quality Check" },
      { step: "Pick-up" }
    ],
    teamRoster: [],
    assignedTo: "Marco Reyes",
    assignedBy: "Admin",
    dropDate: "2026-03-20",
    createdAt: "2026-03-21",
    dueDate: "2026-03-24",
    items: [
      { name: "Zipper Replacement", qty: 2 },
      { name: "Hemming", qty: 1 },
      { name: "Patching", qty: 3 }
    ],
    totalPrice: 450
  }
];

// Simulated logged-in staff
export const CURRENT_STAFF = "Marco Reyes";
