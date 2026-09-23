const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.jsx', 'utf-8');

const newGrid = `
                         {[
                            {id: 'dashboard', label: 'Dashboard'},
                            {id: 'billing', label: 'Billing'},
                            {id: 'orders', label: 'Orders (View)'},
                            {id: 'orders_edit', label: 'Orders (Edit/Void)'},
                            {id: 'menu', label: 'Menu (View)'},
                            {id: 'menu_edit', label: 'Menu (Edit)'},
                            {id: 'inventory', label: 'Inventory (View)'},
                            {id: 'inventory_edit', label: 'Inventory (Edit)'},
                            {id: 'purchase', label: 'Purchase'},
                            {id: 'customers', label: 'Customers'},
                            {id: 'employees', label: 'Employees'},
                            {id: 'expenses', label: 'Expenses'},
                            {id: 'reports', label: 'Reports'},
                            {id: 'settings', label: 'Settings'}
                         ].map(perm => (
                           <label key={perm.id} className="flex items-center gap-2 text-sm font-bold text-ui-text cursor-pointer hover:opacity-80 transition-opacity">
                             <input type="checkbox" checked={staffPermissions.includes(perm.id)} onChange={(e) => {
                               if (e.target.checked) setStaffPermissions([...staffPermissions, perm.id]);
                               else setStaffPermissions(staffPermissions.filter(p => p !== perm.id));
                             }} className="w-4 h-4 text-brand-primary rounded border-ui-border" />
                             <span>{perm.label}</span>
                           </label>
                         ))}
`;

// we need to replace the old .map block
code = code.replace(
  /\{\['dashboard', 'billing', 'orders', 'menu', 'inventory', 'purchase', 'customers', 'employees', 'expenses', 'reports', 'settings'\]\.map\(perm => \([\s\S]*?<\/label>\n                         \)\)\}/,
  newGrid.trim()
);

fs.writeFileSync('src/pages/Settings.jsx', code);
