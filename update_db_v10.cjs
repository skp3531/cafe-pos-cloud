const fs = require('fs');

let code = fs.readFileSync('src/db/db.js', 'utf-8');

const v10Block = `
// v10: Held Orders (Cart Suspend)
db.version(10).stores({
  held_orders: '++id, date, customerId, customerName, items, subtotal, discount, total'
});
`;

if (!code.includes('db.version(10)')) {
  code = code.replace(
    "export const generateInvoiceNumber",
    v10Block + "\nexport const generateInvoiceNumber"
  );
}

fs.writeFileSync('src/db/db.js', code);
