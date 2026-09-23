const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.jsx', 'utf-8');

code = code.replace(/s\.total\.toFixed\(2\)/g, "(s.total || 0).toFixed(2)");
code = code.replace(/p\.totalAmount\.toFixed\(2\)/g, "(p.totalAmount || 0).toFixed(2)");
code = code.replace(/i\.revenue\.toFixed\(2\)/g, "(i.revenue || 0).toFixed(2)");
code = code.replace(/r\.total\.toFixed\(2\)/g, "(r.total || 0).toFixed(2)");

fs.writeFileSync('src/pages/Reports.jsx', code);
