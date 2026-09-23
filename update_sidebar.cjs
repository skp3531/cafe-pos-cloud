const fs = require('fs');

let code = fs.readFileSync('src/components/Sidebar.jsx', 'utf-8');

code = code.replace(
  "perm: 'dashboard'", "perm: 'reports_dashboard'"
).replace(
  "perm: 'billing'", "perm: 'billing_access'"
).replace(
  "perm: 'orders'", "perm: 'orders_view'"
).replace(
  "perm: 'menu'", "perm: 'menu_view'"
).replace(
  "perm: 'inventory'", "perm: 'inventory_view'"
).replace(
  "perm: 'purchase'", "perm: 'purchases_view'"
).replace(
  "perm: 'customers'", "perm: 'customers_view'"
).replace(
  "perm: 'employees'", "perm: 'attendance_mark'"
).replace(
  "perm: 'expenses'", "perm: 'expenses_view'"
).replace(
  "perm: 'reports'", "perm: 'reports_sales'"
).replace(
  "perm: 'settings'", "perm: 'settings_staff'"
);

// We need to update the filter logic so it works with ANY matching prefix or exact match, which it already does:
// user.permissions.some(p => p === item.perm || p.startsWith(item.perm + '_'))
// Actually, `attendance_mark` doesn't cover `employees_view`.
// Let's replace the `filter` logic to be robust.

const filterLogic = `
  const navItems = ALL_NAV_ITEMS.filter(item => {
    if (user?.role === 'owner') return true;
    if (!user?.permissions) return false;
    
    const p = user.permissions;
    switch(item.name) {
      case 'Dashboard': return p.includes('reports_dashboard');
      case 'Billing': return p.includes('billing_access');
      case 'Orders': return p.includes('orders_view');
      case 'Menu': return p.includes('menu_view');
      case 'Inventory': return p.includes('inventory_view');
      case 'Purchase': return p.includes('purchases_view');
      case 'Customers': return p.includes('customers_view');
      case 'Employees': return p.some(x => x.startsWith('employees_') || x.startsWith('attendance_'));
      case 'Expenses': return p.includes('expenses_view');
      case 'Reports': return p.some(x => x.startsWith('reports_'));
      case 'Settings': return p.some(x => x.startsWith('settings_'));
      default: return false;
    }
  });
`;

code = code.replace(
  /const navItems = ALL_NAV_ITEMS\.filter\(item => \{[\s\S]*?\}\);/,
  filterLogic.trim()
);

fs.writeFileSync('src/components/Sidebar.jsx', code);
