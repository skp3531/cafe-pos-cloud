const fs = require('fs');
let code = fs.readFileSync('src/pages/Purchase.jsx', 'utf-8');

code = code.replace(
  "const itemsStr = p.items.map(i => `${i.qty}x ${i.invName || 'Item'}`).join(' | ');",
  "const itemsStr = p.items.map(i => { const inv = inventory.find(x => x.id === i.inventoryId); return `${i.qty}x ${inv ? inv.name : 'Item'}`; }).join('\\n');"
);

code = code.replace(
  "const itemsStr = p.items.map(i => `${i.qty}x ${i.invName || 'Item'}`).join('<br/>');",
  "const itemsStr = p.items.map(i => { const inv = inventory.find(x => x.id === i.inventoryId); return `${i.qty}x ${inv ? inv.name : 'Item'}`; }).join('<br/>');"
);

fs.writeFileSync('src/pages/Purchase.jsx', code);
