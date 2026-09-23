const fs = require('fs');
let code = fs.readFileSync('src/pages/Orders.jsx', 'utf-8');
code = code.replace("const itemsStr = o.items.map(i => `${i.qty}x ${i.name}`).join('\n');", "const itemsStr = o.items.map(i => `${i.qty}x ${i.name}`).join('\\n');");
fs.writeFileSync('src/pages/Orders.jsx', code);
