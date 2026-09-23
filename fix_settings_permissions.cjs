const fs = require('fs');

let code = fs.readFileSync('src/pages/Settings.jsx', 'utf-8');

const permBlock = `
                   {staffRole !== 'owner' && (
                     <div className="mt-4 p-4 border border-ui-border rounded-2xl bg-ui-bg">
                       <label className="text-xs font-bold text-ui-muted uppercase mb-3 block">Module Access</label>
                       <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                         {['dashboard', 'billing', 'orders', 'menu', 'inventory', 'purchase', 'customers', 'employees', 'expenses', 'reports', 'settings'].map(perm => (
                           <label key={perm} className="flex items-center gap-2 text-sm font-bold text-ui-text cursor-pointer hover:opacity-80 transition-opacity">
                             <input type="checkbox" checked={staffPermissions.includes(perm)} onChange={(e) => {
                               if (e.target.checked) setStaffPermissions([...staffPermissions, perm]);
                               else setStaffPermissions(staffPermissions.filter(p => p !== perm));
                             }} className="w-4 h-4 text-brand-primary rounded border-ui-border" />
                             <span className="capitalize">{perm}</span>
                           </label>
                         ))}
                       </div>
                     </div>
                   )}
`;

code = code.replace(
  "</select>\n                   </div>\n                   <button type=\"submit\"",
  "</select>\n                   </div>" + permBlock + "\n                   <button type=\"submit\""
);

// Also need to handle Edit Staff populating the permissions
code = code.replace(
  "setStaffRole(u.role);",
  "setStaffRole(u.role); setStaffPermissions(u.permissions || []);"
);
code = code.replace(
  "setStaffRole('cashier');}",
  "setStaffRole('cashier'); setStaffPermissions(['billing', 'orders', 'customers']);}"
);

fs.writeFileSync('src/pages/Settings.jsx', code);
