const fs = require('fs');

// 1. Sidebar.jsx
let sidebar = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');
const employeesIconImport = `Users, `
if (!sidebar.includes('UserCircle')) {
  sidebar = sidebar.replace(`Users } from`, `Users, UserCircle } from`);
} else if (!sidebar.includes('UserCircle')) {
  // fallback
}
const employeesLink = `
        <NavLink to="/employees" className={({isActive}) => clsx("flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold", isActive ? "bg-brand-primary text-white shadow-md" : "text-ui-muted hover:bg-ui-border hover:text-ui-text")}>
          <UserCircle size={20} /> <span className="hidden md:block">Employees</span>
        </NavLink>`;
sidebar = sidebar.replace(`{/* <NavLink to="/settings"`, employeesLink.trim() + '\n        {/* <NavLink to="/settings"');
// Actually let's just insert it before Customers
sidebar = sidebar.replace(
  `<NavLink to="/customers"`, 
  `<NavLink to="/employees" className={({isActive}) => clsx("flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold", isActive ? "bg-brand-primary text-white shadow-md" : "text-ui-muted hover:bg-ui-border hover:text-ui-text")}>
          <UserCircle size={20} /> <span className="hidden md:block">Employees</span>
        </NavLink>\n        <NavLink to="/customers"`
);
// Import UserCircle if missing
if (!sidebar.includes('UserCircle')) {
  sidebar = sidebar.replace(/import \{ (.*?) \} from 'lucide-react';/, `import { $1, UserCircle } from 'lucide-react';`);
}
fs.writeFileSync('src/components/Sidebar.jsx', sidebar);

// 2. App.jsx
let app = fs.readFileSync('src/App.jsx', 'utf8');
const importEmployees = `import Employees from './pages/Employees';`;
app = app.replace(`import Customers from './pages/Customers';`, `import Customers from './pages/Customers';\nimport Employees from './pages/Employees';`);
app = app.replace(
  `<Route path="customers" element={<Customers />} />`,
  `<Route path="customers" element={<Customers />} />\n          <Route path="employees" element={<Employees />} />`
);
fs.writeFileSync('src/App.jsx', app);

console.log("Routes updated");
