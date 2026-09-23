const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf-8');

c = c.replace(/perm="dashboard"/g, 'perm="reports_dashboard"');
c = c.replace(/perm="billing"/g, 'perm="billing_access"');
c = c.replace(/perm="orders"/g, 'perm="orders_view"');
c = c.replace(/perm="menu"/g, 'perm="menu_view"');
c = c.replace(/perm="inventory"/g, 'perm="inventory_view"');
c = c.replace(/perm="purchase"/g, 'perm="purchases_view"');
c = c.replace(/perm="customers"/g, 'perm="customers_view"');
// For employees, they can either have employees_view or attendance_mark
// Let's modify ProtectedRoute logic directly to support prefix matching exactly like Sidebar!
fs.writeFileSync('src/App.jsx', c);
