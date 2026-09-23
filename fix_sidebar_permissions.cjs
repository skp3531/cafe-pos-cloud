const fs = require('fs');

let file = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');

// Change ALL_NAV_ITEMS format to include a unique permission key
// We'll replace the hardcoded roles array with a required permission string
file = file.replace(
  /const ALL_NAV_ITEMS = \[\s+([\s\S]*?)\];/,
  `const ALL_NAV_ITEMS = [
  { name: 'Dashboard', icon: Home, path: '/', perm: 'dashboard' },
  { name: 'Billing', icon: Receipt, path: '/billing', perm: 'billing' },
  { name: 'Orders', icon: ReceiptText, path: '/orders', perm: 'orders' },
  { name: 'Menu', icon: MenuSquare, path: '/menu', perm: 'menu' },
  { name: 'Inventory', icon: Package, path: '/inventory', perm: 'inventory' },
  { name: 'Purchase', icon: ShoppingCart, path: '/purchase', perm: 'purchase' },
  { name: 'Customers', icon: Users, path: '/customers', perm: 'customers' },
  { name: 'Expenses', icon: Wallet, path: '/expenses', perm: 'expenses' },
  { name: 'Reports', icon: BarChart3, path: '/reports', perm: 'reports' },
  { name: 'Settings', icon: Settings, path: '/settings', perm: 'settings' },
];`
);

// Update navItems logic
// Owner bypasses everything.
// Otherwise, check if user.permissions includes the item's perm.
const navLogic = `
  const navItems = ALL_NAV_ITEMS.filter(item => {
    if (user?.role === 'owner') return true;
    if (user?.permissions && user.permissions.includes(item.perm)) return true;
    // Fallback for old accounts
    if (!user?.permissions && (item.perm === 'billing' || item.perm === 'orders' || item.perm === 'customers')) return true;
    return false;
  });
`;

file = file.replace(
  `const navItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(user?.role || 'cashier'));`,
  navLogic.trim()
);

fs.writeFileSync('src/components/Sidebar.jsx', file);
