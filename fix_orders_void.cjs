const fs = require('fs');

let code = fs.readFileSync('src/pages/Orders.jsx', 'utf-8');

// Replace handleDelete with handleVoid
const oldDeleteFunc = `  const handleDelete = async (order, c) => {
    if (user?.role === 'cashier') {
      const pin = window.prompt("Admin/Owner Password required to delete:");
      if (!pin) return;
      const hashed = await hashPin(pin);
      const admin = await db.users.where('pin').equals(hashed).first();
      if (!admin || admin.role !== 'owner') {
        alert("Invalid Admin Password. Deletion aborted.");
        return;
      }
    }
    if (!window.confirm(\`PERMANENTLY DELETE Invoice \${order.invoiceNumber || order.id}? This cannot be undone.\`)) return;
    
    // Reverse Inventory
    const recipes = await db.recipes.toArray();
    for (let cartItem of order.items) {
      const itemRecipe = recipes.find(r => r.itemId === cartItem.id);
      if (itemRecipe) {
        for (let ing of itemRecipe.ingredients) {
          const inv = await db.inventory.get(ing.inventoryId);
          if (inv) await db.inventory.update(ing.inventoryId, { currentStock: inv.currentStock + (ing.qty * cartItem.qty) });
        }
      }
    }
    
    // Reverse Points
    if (c) {
      if (order.pointsEarned) {
        await db.customers.update(c.id, { loyaltyPoints: Math.max(0, c.loyaltyPoints - order.pointsEarned) });
      }
      if (order.pointsRedeemed) {
        await db.customers.update(c.id, { loyaltyPoints: c.loyaltyPoints + order.pointsRedeemed });
      }
    }

    await db.sales.delete(order.id);
  };`;

const newVoidFunc = `  const handleVoid = async (order, c) => {
    if (user?.role === 'cashier') {
      const pin = window.prompt("Admin/Owner Password required to void:");
      if (!pin) return;
      const hashed = await hashPin(pin);
      const admin = await db.users.where('pin').equals(hashed).first();
      if (!admin || admin.role !== 'owner') {
        alert("Invalid Admin Password. Void aborted.");
        return;
      }
    }
    const reason = window.prompt(\`Enter reason to VOID Invoice \${order.invoiceNumber || order.id}:\`);
    if (!reason) return;
    
    // Reverse Inventory
    const recipes = await db.recipes.toArray();
    for (let cartItem of order.items) {
      const itemRecipe = recipes.find(r => r.itemId === cartItem.id);
      if (itemRecipe) {
        for (let ing of itemRecipe.ingredients) {
          const inv = await db.inventory.get(ing.inventoryId);
          if (inv) await db.inventory.update(ing.inventoryId, { currentStock: inv.currentStock + (ing.qty * cartItem.qty) });
        }
      }
    }
    
    // Reverse Points
    if (c) {
      if (order.pointsEarned) {
        await db.customers.update(c.id, { loyaltyPoints: Math.max(0, c.loyaltyPoints - order.pointsEarned) });
      }
      if (order.pointsRedeemed) {
        await db.customers.update(c.id, { loyaltyPoints: c.loyaltyPoints + order.pointsRedeemed });
      }
    }

    await db.sales.update(order.id, { status: 'VOIDED', voidReason: reason });
  };`;

code = code.replace(oldDeleteFunc, newVoidFunc);

// Update UI button
code = code.replace(
  `onClick={() => handleDelete(order, c)} className="bg-brand-danger text-white p-3 rounded-xl font-bold flex flex-col items-center justify-center shadow-md active:scale-95 transition-all w-16 h-16"><span className="text-[10px]">Delete</span>`,
  `onClick={() => handleVoid(order, c)} className="bg-brand-danger text-white p-3 rounded-xl font-bold flex flex-col items-center justify-center shadow-md active:scale-95 transition-all w-16 h-16"><span className="text-[10px]">Void</span>`
);

fs.writeFileSync('src/pages/Orders.jsx', code);
