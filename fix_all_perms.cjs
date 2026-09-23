const fs = require('fs');
let file = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

// Replace PERMISSIONS
const newPerms = `
  const PERMISSIONS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'billing', label: 'Billing' },
    { id: 'orders', label: 'Orders (View)' },
    { id: 'orders_edit', label: 'Orders (Edit)' },
    { id: 'orders_delete', label: 'Orders (Delete)' },
    { id: 'menu', label: 'Menu (View)' },
    { id: 'menu_edit', label: 'Menu (Edit)' },
    { id: 'menu_delete', label: 'Menu (Delete)' },
    { id: 'inventory', label: 'Inventory (View)' },
    { id: 'inventory_edit', label: 'Inventory (Edit)' },
    { id: 'inventory_delete', label: 'Inventory (Delete)' },
    { id: 'purchase', label: 'Purchase (View)' },
    { id: 'purchase_edit', label: 'Purchase (Edit)' },
    { id: 'purchase_delete', label: 'Purchase (Delete)' },
    { id: 'customers', label: 'Customers (View)' },
    { id: 'customers_edit', label: 'Customers (Edit)' },
    { id: 'customers_delete', label: 'Customers (Delete)' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' }
  ];
`;

file = file.replace(/const PERMISSIONS = \[[\s\S]*?\];/, newPerms.trim());

// Also make the permissions grid dense and small
file = file.replace(
  /<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">/,
  `<div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 h-64 overflow-y-auto pr-2 hide-scrollbar">`
);
file = file.replace(
  /<label key=\{p\.id\} className="flex items-center gap-2 cursor-pointer font-bold text-ui-text text-sm p-2 bg-ui-bg rounded-lg border border-ui-border">/g,
  `<label key={p.id} className="flex items-center gap-2 cursor-pointer font-bold text-ui-text text-xs p-1.5 bg-ui-bg rounded border border-ui-border">`
);

fs.writeFileSync('src/pages/Settings.jsx', file);
