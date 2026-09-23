const fs = require('fs');

let code = fs.readFileSync('src/pages/Settings.jsx', 'utf-8');

// 1. Add definitions
const defs = `
const PERMISSION_GROUPS = [
  { name: 'Billing', permissions: [
    { id: 'billing_access', label: 'Access Billing' }, { id: 'billing_create', label: 'Create Bill' }, { id: 'billing_edit', label: 'Edit Bill' }, { id: 'billing_delete_item', label: 'Delete Item' }, { id: 'billing_change_price', label: 'Change Item Price' }, { id: 'billing_discount', label: 'Apply Discount' }, { id: 'billing_custom_discount', label: 'Apply Custom Discount' }, { id: 'billing_hold', label: 'Hold Order' }, { id: 'billing_recall', label: 'Recall Order' }, { id: 'billing_split', label: 'Split Bill' }, { id: 'billing_merge', label: 'Merge Bill' }, { id: 'billing_reprint', label: 'Reprint Bill' }, { id: 'billing_void', label: 'Void Bill' }, { id: 'billing_refund', label: 'Refund Bill' }
  ]},
  { name: 'Orders', permissions: [
    { id: 'orders_view', label: 'View Orders' }, { id: 'orders_edit', label: 'Edit Orders' }, { id: 'orders_cancel', label: 'Cancel Orders' }, { id: 'orders_void', label: 'Void Orders' }, { id: 'orders_history', label: 'Order History' }
  ]},
  { name: 'Menu', permissions: [
    { id: 'menu_view', label: 'View Menu' }, { id: 'menu_add', label: 'Add Menu Item' }, { id: 'menu_edit', label: 'Edit Menu Item' }, { id: 'menu_delete', label: 'Delete Menu Item' }, { id: 'menu_categories', label: 'Category Management' }
  ]},
  { name: 'Inventory', permissions: [
    { id: 'inventory_view', label: 'View Inventory' }, { id: 'inventory_adjust', label: 'Stock Adjustment' }, { id: 'inventory_add', label: 'Add Stock' }, { id: 'inventory_edit', label: 'Edit Stock' }, { id: 'inventory_physical', label: 'Physical Stock Count' }, { id: 'inventory_wastage', label: 'Wastage Entry' }
  ]},
  { name: 'Purchases', permissions: [
    { id: 'purchases_view', label: 'View Purchase' }, { id: 'purchases_create', label: 'Create Purchase' }, { id: 'purchases_edit', label: 'Edit Purchase' }, { id: 'purchases_delete', label: 'Delete Purchase' }, { id: 'purchases_payment', label: 'Supplier Payment' }
  ]},
  { name: 'Customers', permissions: [
    { id: 'customers_view', label: 'View Customers' }, { id: 'customers_add', label: 'Add Customers' }, { id: 'customers_edit', label: 'Edit Customers' }, { id: 'customers_delete', label: 'Delete Customers' }, { id: 'customers_loyalty', label: 'Loyalty Access' }
  ]},
  { name: 'Expenses', permissions: [
    { id: 'expenses_view', label: 'View Expense' }, { id: 'expenses_add', label: 'Add Expense' }, { id: 'expenses_edit', label: 'Edit Expense' }, { id: 'expenses_delete', label: 'Delete Expense' }
  ]},
  { name: 'Reports', permissions: [
    { id: 'reports_dashboard', label: 'Dashboard Access' }, { id: 'reports_sales', label: 'Sales Reports' }, { id: 'reports_items', label: 'Item Reports' }, { id: 'reports_inventory', label: 'Inventory Reports' }, { id: 'reports_expenses', label: 'Expense Reports' }, { id: 'reports_attendance', label: 'Attendance Reports' }, { id: 'reports_gst', label: 'GST Reports' }, { id: 'reports_export_excel', label: 'Export Excel' }, { id: 'reports_export_pdf', label: 'Export PDF' }
  ]},
  { name: 'Attendance', permissions: [
    { id: 'attendance_mark', label: 'Mark Attendance' }, { id: 'attendance_view_own', label: 'View Own Attendance' }, { id: 'attendance_view_all', label: 'View All Attendance' }, { id: 'attendance_edit', label: 'Edit Attendance' }, { id: 'attendance_gps_override', label: 'GPS Override' }
  ]},
  { name: 'Employees', permissions: [
    { id: 'employees_view', label: 'View Employees' }, { id: 'employees_add', label: 'Add Employees' }, { id: 'employees_edit', label: 'Edit Employees' }, { id: 'employees_delete', label: 'Delete Employees' }, { id: 'employees_salary', label: 'Salary Access' }
  ]},
  { name: 'Settings', permissions: [
    { id: 'settings_business', label: 'Business Profile' }, { id: 'settings_printing', label: 'Printing Settings' }, { id: 'settings_tax', label: 'Tax Settings' }, { id: 'settings_loyalty', label: 'Loyalty Settings' }, { id: 'settings_backup', label: 'Backup & Restore' }, { id: 'settings_staff', label: 'Staff Management' }, { id: 'settings_permissions', label: 'Permission Management' }
  ]},
  { name: 'Cash Management', permissions: [
    { id: 'cash_start_shift', label: 'Start Shift' }, { id: 'cash_end_shift', label: 'End Shift' }, { id: 'cash_open_drawer', label: 'Open Drawer' }, { id: 'cash_in', label: 'Cash In' }, { id: 'cash_out', label: 'Cash Out' }, { id: 'cash_view_summary', label: 'View Cash Summary' }
  ]}
];

const ROLE_TEMPLATES = {
  manager: [
    'billing_access', 'billing_create', 'billing_edit', 'billing_delete_item', 'billing_change_price', 'billing_discount', 'billing_custom_discount', 'billing_hold', 'billing_recall', 'billing_split', 'billing_merge', 'billing_reprint', 'billing_void', 'billing_refund',
    'orders_view', 'orders_edit', 'orders_cancel', 'orders_void', 'orders_history',
    'menu_view', 'menu_add', 'menu_edit', 'menu_delete', 'menu_categories',
    'inventory_view', 'inventory_adjust', 'inventory_add', 'inventory_edit', 'inventory_physical', 'inventory_wastage',
    'purchases_view', 'purchases_create', 'purchases_edit', 'purchases_delete', 'purchases_payment',
    'customers_view', 'customers_add', 'customers_edit', 'customers_delete', 'customers_loyalty',
    'expenses_view', 'expenses_add', 'expenses_edit', 'expenses_delete',
    'reports_dashboard', 'reports_sales', 'reports_items', 'reports_inventory', 'reports_expenses', 'reports_attendance', 'reports_gst', 'reports_export_excel', 'reports_export_pdf',
    'attendance_mark', 'attendance_view_own', 'attendance_view_all', 'attendance_edit', 'attendance_gps_override',
    'cash_start_shift', 'cash_end_shift', 'cash_open_drawer', 'cash_in', 'cash_out', 'cash_view_summary'
  ],
  cashier: [
    'billing_access', 'billing_create', 'billing_hold', 'billing_recall', 'billing_split', 'billing_reprint',
    'orders_view', 'orders_history',
    'customers_view', 'customers_add', 'customers_loyalty',
    'attendance_mark', 'attendance_view_own',
    'cash_start_shift', 'cash_end_shift'
  ],
  staff: [
    'attendance_mark', 'attendance_view_own'
  ]
};

function toggleGroup(groupPerms, currentPerms, setPerms) {
  const groupIds = groupPerms.map(p => p.id);
  const allSelected = groupIds.every(id => currentPerms.includes(id));
  if (allSelected) {
    setPerms(currentPerms.filter(id => !groupIds.includes(id)));
  } else {
    setPerms([...new Set([...currentPerms, ...groupIds])]);
  }
}
`;

if (!code.includes("PERMISSION_GROUPS")) {
  code = code.replace(
    "export default function Settings() {",
    defs + "\nexport default function Settings() {"
  );
}

// 2. Add Role Template handler
code = code.replace(
  "onChange={e=>setStaffRole(e.target.value)}",
  "onChange={e=>{ const r = e.target.value; setStaffRole(r); if(ROLE_TEMPLATES[r]) setStaffPermissions([...ROLE_TEMPLATES[r]]); else if(r==='custom') setStaffPermissions([]); }}"
);

// Add Custom Role option
code = code.replace(
  '<option value="cashier">Cashier</option>',
  '<option value="cashier">Cashier</option><option value="staff">Staff</option><option value="custom">Custom Role</option>'
);

// 3. Replace the old permissions block with the new collapsible card UI
// Since we have ChevronDown, ChevronRight, we need to import them.
if (!code.includes("ChevronDown")) {
  code = code.replace("import { Store", "import { Store, ChevronDown, ChevronRight");
}

// Wait, I need a state for expanded groups!
if (!code.includes("const [expandedGroups")) {
  code = code.replace(
    "const [staffPermissions, setStaffPermissions] = useState",
    "const [expandedGroups, setExpandedGroups] = useState({});\n  const [staffPermissions, setStaffPermissions] = useState"
  );
}

const newPermBlock = `
                   {staffRole !== 'owner' && (
                     <div className="mt-6 border border-ui-border rounded-2xl bg-ui-bg overflow-hidden">
                       <div className="p-4 bg-ui-card border-b border-ui-border flex justify-between items-center">
                         <label className="text-xs font-bold text-ui-muted uppercase tracking-widest">Module Access & Permissions</label>
                         <button type="button" onClick={() => {
                            const all = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p=>p.id));
                            setStaffPermissions(all);
                            setStaffRole('custom');
                         }} className="text-xs font-bold text-brand-primary">Select All</button>
                       </div>
                       
                       <div className="max-h-96 overflow-y-auto hide-scrollbar p-2">
                         {PERMISSION_GROUPS.map(group => {
                           const groupIds = group.permissions.map(p=>p.id);
                           const selectedCount = groupIds.filter(id => staffPermissions.includes(id)).length;
                           const allSelected = selectedCount === groupIds.length;
                           const isExpanded = expandedGroups[group.name];
                           
                           return (
                             <div key={group.name} className="mb-2 bg-ui-card rounded-xl border border-ui-border overflow-hidden">
                               <div className="flex items-center justify-between p-3 bg-ui-bg cursor-pointer hover:bg-ui-border/50 transition-colors" onClick={() => setExpandedGroups({...expandedGroups, [group.name]: !isExpanded})}>
                                 <div className="flex items-center gap-3">
                                   {isExpanded ? <ChevronDown size={16} className="text-ui-muted"/> : <ChevronRight size={16} className="text-ui-muted"/>}
                                   <span className="font-bold text-ui-text text-sm">{group.name}</span>
                                   {selectedCount > 0 && <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{selectedCount}/{groupIds.length}</span>}
                                 </div>
                                 <button type="button" onClick={(e) => { e.stopPropagation(); setStaffRole('custom'); toggleGroup(group.permissions, staffPermissions, setStaffPermissions); }} className="text-xs font-bold text-ui-muted hover:text-ui-text p-1">
                                   {allSelected ? 'Deselect All' : 'Select All'}
                                 </button>
                               </div>
                               {isExpanded && (
                                 <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 border-t border-ui-border">
                                   {group.permissions.map(perm => (
                                     <label key={perm.id} className="flex items-start gap-3 text-sm font-semibold text-ui-text cursor-pointer hover:opacity-80 transition-opacity">
                                       <input type="checkbox" checked={staffPermissions.includes(perm.id)} onChange={(e) => {
                                         setStaffRole('custom');
                                         if (e.target.checked) setStaffPermissions([...staffPermissions, perm.id]);
                                         else setStaffPermissions(staffPermissions.filter(p => p !== perm.id));
                                       }} className="mt-1 w-4 h-4 text-brand-primary rounded border-ui-border focus:ring-brand-primary" />
                                       <span className="leading-tight">{perm.label}</span>
                                     </label>
                                   ))}
                                 </div>
                               )}
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}
`;

code = code.replace(
  /\{staffRole !== 'owner' && \([\s\S]*?<\/div>\n                   \)\}/,
  newPermBlock.trim()
);

fs.writeFileSync('src/pages/Settings.jsx', code);
