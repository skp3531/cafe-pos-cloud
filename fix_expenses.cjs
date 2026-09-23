const fs = require('fs');
let c = fs.readFileSync('src/pages/Expenses.jsx', 'utf-8');
c = c.replace(/<\/div>\)\}/g, '</div>}');
fs.writeFileSync('src/pages/Expenses.jsx', c);
