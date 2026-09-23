const fs = require('fs');
let c = fs.readFileSync('src/pages/Purchase.jsx', 'utf-8');
c = c.replace(/purchase_add/g, 'purchases_create');
fs.writeFileSync('src/pages/Purchase.jsx', c);
