const fs = require('fs');

// 1. Sidebar.jsx
let sidebar = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');

// Add UserCircle to imports if not there
if (!sidebar.includes('UserCircle')) {
  sidebar = sidebar.replace(/Users,/g, 'Users, UserCircle,');
}

// Add to ALL_NAV_ITEMS
const employeesItem = `  { name: 'Employees', icon: UserCircle, path: '/employees', perm: 'employees' },`;
if (!sidebar.includes("name: 'Employees'")) {
  sidebar = sidebar.replace(
    `{ name: 'Customers', icon: Users, path: '/customers', perm: 'customers' },`,
    `{ name: 'Customers', icon: Users, path: '/customers', perm: 'customers' },\n${employeesItem}`
  );
}

fs.writeFileSync('src/components/Sidebar.jsx', sidebar);

// 2. App.jsx
let app = fs.readFileSync('src/App.jsx', 'utf8');

const employeesRoute = `          <Route path="employees" element={
            <ProtectedRoute perm="employees"><Employees /></ProtectedRoute>
          } />`;

if (!app.includes('path="employees"')) {
  app = app.replace(
    `<Route path="customers" element={
            <ProtectedRoute perm="customers"><Customers /></ProtectedRoute>
          } />`,
    `<Route path="customers" element={
            <ProtectedRoute perm="customers"><Customers /></ProtectedRoute>
          } />\n${employeesRoute}`
  );
}

fs.writeFileSync('src/App.jsx', app);
console.log("Fixed routes");
