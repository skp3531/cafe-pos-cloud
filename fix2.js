const fs = require('fs');
let code = fs.readFileSync('src/pages/Orders.jsx', 'utf-8');
code = code.replace("          const cName = c ? c.name : 'Walk-in Customer';\n          \n              <div className=\"flex items-start gap-4 flex-1\">",
"          const cName = c ? c.name : 'Walk-in Customer';\n          return (\n            <div key={order.id} className=\"bg-ui-card rounded-3xl p-5 md:p-6 border border-ui-border shadow-sm hover:shadow-md transition-shadow flex flex-col xl:flex-row xl:items-center justify-between gap-6\">\n              <div className=\"flex items-start gap-4 flex-1\">");
fs.writeFileSync('src/pages/Orders.jsx', code);
