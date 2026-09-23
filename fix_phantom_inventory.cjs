const fs = require('fs');

let code = fs.readFileSync('src/pages/Billing.jsx', 'utf-8');

// Replace the clamp logic
code = code.replace(
  "if (inv) await db.inventory.update(ing.inventoryId, { currentStock: Math.max(0, inv.currentStock - (ing.qty * cartItem.qty)) });",
  "if (inv) await db.inventory.update(ing.inventoryId, { currentStock: inv.currentStock - (ing.qty * cartItem.qty) });"
);

fs.writeFileSync('src/pages/Billing.jsx', code);
