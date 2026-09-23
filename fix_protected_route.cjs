const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf-8');

const newLogic = `
  const p = user.permissions || [];
  let hasPerm = false;
  switch(perm) {
    case 'reports_dashboard': hasPerm = p.includes('reports_dashboard'); break;
    case 'billing_access': hasPerm = p.includes('billing_access'); break;
    case 'orders_view': hasPerm = p.includes('orders_view'); break;
    case 'menu_view': hasPerm = p.includes('menu_view'); break;
    case 'inventory_view': hasPerm = p.includes('inventory_view'); break;
    case 'purchases_view': hasPerm = p.includes('purchases_view'); break;
    case 'customers_view': hasPerm = p.includes('customers_view'); break;
    case 'employees': hasPerm = p.some(x => x.startsWith('employees_') || x.startsWith('attendance_')); break;
    case 'expenses_view': hasPerm = p.includes('expenses_view'); break;
    case 'reports': hasPerm = p.some(x => x.startsWith('reports_')); break;
    case 'settings': hasPerm = p.some(x => x.startsWith('settings_')); break;
    default: hasPerm = false;
  }
`;

c = c.replace(/const hasPerm = [\s\S]*?(?=\n  if \(!hasPerm\))/, newLogic.trim());
fs.writeFileSync('src/App.jsx', c);
