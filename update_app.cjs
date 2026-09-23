const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf-8');

// Add import
code = code.replace("import Reports from './pages/Reports';", "import Reports from './pages/Reports';\nimport Shifts from './pages/Shifts';");

// Add route
code = code.replace("<Route path=\"/reports\" element={<Reports />} />", "<Route path=\"/reports\" element={<Reports />} />\n              <Route path=\"/shifts\" element={<Shifts />} />");

// Add Sidebar nav link
code = code.replace("<NavItem to=\"/reports\" icon={<BarChart3 size={20} />} label=\"Reports\" />", "<NavItem to=\"/reports\" icon={<BarChart3 size={20} />} label=\"Reports\" />\n          <NavItem to=\"/shifts\" icon={<Clock size={20} />} label=\"Shift History\" />");

// Wait, the icon for shift history? We need to import Clock in App.jsx.
if (!code.includes("Clock")) {
   code = code.replace("import { LayoutDashboard, Receipt, Tag", "import { LayoutDashboard, Receipt, Tag, Clock");
}

fs.writeFileSync('src/App.jsx', code);
