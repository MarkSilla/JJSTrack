const fs = require('fs');
const file = 'c:\\Users\\Lorenxo\\Documents\\capstone\\JJSTrack\\admin\\src\\pages\\content\\AdOrder.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add OrderList import
content = content.replace(
    /import KPICards from '\.\/AdOrder\/Kpicards';/,
    import KPICards from './AdOrder/Kpicards';\r\nimport OrderList from './AdOrder/Orderlist';
);

// 2. Add isFilterOpen state
content = content.replace(
    /const \[selectedOrderId, setSelectedOrderId\] = useState\(null\);/,
    const [selectedOrderId, setSelectedOrderId] = useState(null);\r\n    const [isFilterOpen, setIsFilterOpen] = useState(false);
);

// 3. Update OrderList props
content = content.replace(
    /activeOrderId=\{activeOrderId\}/g,
    ctiveOrderId={selectedOrderId}
);
content = content.replace(
    /setActiveOrderId=\{setActiveOrderId\}/g,
    setActiveOrderId={setSelectedOrderId}
);

// 4. Handle end truncation
const searchStr = '                <AssignConfirmationModal';
const cutoff = content.indexOf(searchStr);

if (cutoff !== -1) {
    const ender =             </div>\r\n\r\n            <AssignConfirmationModal\r\n                assignConfirm={assignConfirm}\r\n                onConfirm={confirmAssign}\r\n                onCancel={cancelAssign}\r\n            />\r\n        </div>\r\n    );\r\n}\r\n;
    content = content.substring(0, cutoff) + ender;
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed AdOrder.jsx');
