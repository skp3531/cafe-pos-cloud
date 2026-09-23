const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.jsx', 'utf-8');

code = code.replace(/s\.revenue\.toFixed\(2\)/g, "(s.revenue || 0).toFixed(2)");
code = code.replace(/item\.revenue\.toFixed\(2\)/g, "(item.revenue || 0).toFixed(2)");
code = code.replace(/totalSales\.toFixed\(2\)/g, "(totalSales || 0).toFixed(2)");
code = code.replace(/totalPurchases\.toFixed\(2\)/g, "(totalPurchases || 0).toFixed(2)");

fs.writeFileSync('src/pages/Reports.jsx', code);
