const fs = require('fs');

// Purchase
let purCode = fs.readFileSync('src/pages/Purchase.jsx', 'utf-8');
purCode = purCode.replace(
  "const headers = ['Date', 'Supplier', 'Created By', 'Items', 'Total Amount', 'Payment Mode'];",
  "const headers = ['Date', 'Supplier', 'Created By', 'Item Name', 'Quantity', 'Total Amount', 'Payment Mode'];"
);
purCode = purCode.replace(
  "const itemsStr = p.items.map(i => { const inv = inventory.find(x => x.id === i.inventoryId); return `${i.qty}x ${inv ? inv.name : 'Item'}`; }).join('\\n');",
  "const itemNames = p.items.map(i => { const inv = inventory.find(x => x.id === i.inventoryId); return inv ? inv.name : 'Item'; }).join('\\n');\n      const itemQtys = p.items.map(i => i.qty).join('\\n');"
);
purCode = purCode.replace(
  "p.createdBy || 'Unknown',\n        itemsStr,\n        p.totalAmount,",
  "p.createdBy || 'Unknown',\n        itemNames,\n        itemQtys,\n        p.totalAmount,"
);
fs.writeFileSync('src/pages/Purchase.jsx', purCode);

// Orders
let ordCode = fs.readFileSync('src/pages/Orders.jsx', 'utf-8');
ordCode = ordCode.replace(
  "const headers = ['Invoice', 'Date', 'Customer', 'Created By', 'Items', 'Total Amount', 'Status', 'Payment Mode'];",
  "const headers = ['Invoice', 'Date', 'Customer', 'Created By', 'Item Name', 'Quantity', 'Total Amount', 'Status', 'Payment Mode'];"
);
ordCode = ordCode.replace(
  "const itemsStr = o.items.map(i => `${i.qty}x ${i.name}`).join('\\n');",
  "const itemNames = o.items.map(i => i.name).join('\\n');\n      const itemQtys = o.items.map(i => i.qty).join('\\n');"
);
ordCode = ordCode.replace(
  "o.createdBy || 'Unknown',\n        itemsStr,\n        o.total,",
  "o.createdBy || 'Unknown',\n        itemNames,\n        itemQtys,\n        o.total,"
);
fs.writeFileSync('src/pages/Orders.jsx', ordCode);
