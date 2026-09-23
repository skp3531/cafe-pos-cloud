const fs = require('fs');
let file = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

// Update PERMISSIONS array in Settings.jsx to include some specific sub rights
const newPerms = `
  const PERMISSIONS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'billing', label: 'Billing' },
    { id: 'orders', label: 'Orders (View/Print)' },
    { id: 'orders_delete', label: 'Orders (Delete)' },
    { id: 'orders_edit', label: 'Orders (Edit/Refund)' },
    { id: 'menu', label: 'Menu' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'purchase', label: 'Purchase' },
    { id: 'customers', label: 'Customers' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' }
  ];
`;

file = file.replace(/const PERMISSIONS = \[[\s\S]*?\];/, newPerms.trim());

fs.writeFileSync('src/pages/Settings.jsx', file);

// Update Orders.jsx to respect these sub rights
let orders = fs.readFileSync('src/pages/Orders.jsx', 'utf8');

const orderAccess = `
  const canEdit = user?.role === 'owner' || user?.permissions?.includes('orders_edit');
  const canDelete = user?.role === 'owner' || user?.permissions?.includes('orders_delete');
`;

// Insert the access checks
orders = orders.replace(
  `const navigate = useNavigate();`,
  `const navigate = useNavigate();\n  const { user } = useAuthStore();\n${orderAccess}`
);

// We need to remove the hardcoded `user?.role === 'owner'` check in Orders UI
// Original:
// {user?.role === 'owner' && (
//   <button onClick={() => handleEdit(order, c)} className="px-4 py-2 bg-ui-bg text-ui-text border border-ui-border rounded-xl font-bold hover:bg-ui-border transition-colors text-xs flex items-center justify-center">Edit</button>
//   <button onClick={() => handleDelete(order)} className="px-4 py-2 bg-brand-danger text-white rounded-xl font-bold hover:opacity-90 transition-opacity text-xs flex items-center justify-center">Delete</button>
// )}

orders = orders.replace(
  /\{user\?.role === 'owner' && \(\s*<button onClick=\{\(\) => handleEdit.*?<\/button>\s*<button onClick=\{\(\) => handleDelete.*?<\/button>\s*\)\}/gs,
  `{canEdit && <button onClick={() => handleEdit(order, c)} className="px-4 py-2 bg-ui-bg text-ui-text border border-ui-border rounded-xl font-bold hover:bg-ui-border transition-colors text-xs flex items-center justify-center">Edit</button>}
                        {canDelete && <button onClick={() => handleDelete(order)} className="px-4 py-2 bg-brand-danger text-white rounded-xl font-bold hover:opacity-90 transition-opacity text-xs flex items-center justify-center">Delete</button>}`
);

fs.writeFileSync('src/pages/Orders.jsx', orders);
