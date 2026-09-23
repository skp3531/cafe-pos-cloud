const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.jsx', 'utf-8');

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

// Remove the old PERMISSION_GROUPS definition block
code = code.replace(/const PERMISSION_GROUPS = \[[\s\S]*?\}\];/g, '');

// Prepend the new defs right after imports
code = code.replace("export default function Settings() {", defs + "\nexport default function Settings() {");

fs.writeFileSync('src/pages/Settings.jsx', code);
