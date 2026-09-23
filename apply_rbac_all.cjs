const fs = require('fs');

function patch(file, replacements) {
  let code = fs.readFileSync(file, 'utf-8');
  for (let [search, replace] of replacements) {
    if (search instanceof RegExp) {
      code = code.replace(search, replace);
    } else {
      code = code.split(search).join(replace);
    }
  }
  fs.writeFileSync(file, code);
}

// Orders.jsx
patch('src/pages/Orders.jsx', [
  [
    "const canEdit = user?.role === 'owner' || user?.permissions?.includes('orders_edit');",
    "const canEdit = user?.role === 'owner' || user?.permissions?.includes('orders_edit');"
  ],
  [
    "const canDelete = user?.role === 'owner' || user?.permissions?.includes('orders_edit');",
    "const canDelete = user?.role === 'owner' || user?.permissions?.includes('orders_void');"
  ],
  [
    "const canRefund = user?.role === 'owner' || user?.permissions?.includes('billing_refund');\n  const canDelete",
    "const canDelete" // cleanup if needed
  ],
  [
    "const canDelete = user?.role === 'owner' || user?.permissions?.includes('orders_void');",
    "const canDelete = user?.role === 'owner' || user?.permissions?.includes('orders_void');\n  const canRefund = user?.role === 'owner' || user?.permissions?.includes('billing_refund');"
  ],
  [
    "{canEdit && <button onClick={() => handleRefund",
    "{canRefund && <button onClick={() => handleRefund"
  ]
]);

// Menu.jsx
patch('src/pages/Menu.jsx', [
  [
    "const canAdd = user?.role === 'owner' || user?.permissions?.includes('menu_edit');",
    "const canAdd = user?.role === 'owner' || user?.permissions?.includes('menu_add');"
  ],
  [
    "const canDelete = user?.role === 'owner' || user?.permissions?.includes('menu_edit');",
    "const canDelete = user?.role === 'owner' || user?.permissions?.includes('menu_delete');"
  ]
]);

// Inventory.jsx
patch('src/pages/Inventory.jsx', [
  [
    "const canEdit = user?.role === 'owner' || user?.permissions?.includes('inventory_edit');",
    "const canEdit = user?.role === 'owner' || user?.permissions?.includes('inventory_edit');\n  const canAdd = user?.role === 'owner' || user?.permissions?.includes('inventory_add');\n  const canAdjust = user?.role === 'owner' || user?.permissions?.includes('inventory_adjust');"
  ],
  [
    "{canEdit && (<div className=\"bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm col-span-1 md:col-span-1 h-fit\">\n            <h2 className=\"text-xl font-bold mb-6 text-ui-text\">Add Item</h2>",
    "{canAdd && (<div className=\"bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm col-span-1 md:col-span-1 h-fit\">\n            <h2 className=\"text-xl font-bold mb-6 text-ui-text\">Add Item</h2>"
  ],
  [
    "{canEdit && <button onClick={() => handleAdjust",
    "{canAdjust && <button onClick={() => handleAdjust"
  ],
  [
    "{canEdit && <button onClick={saveAudit}",
    "{canAdjust && <button onClick={saveAudit}"
  ],
  [
    "disabled={!canEdit} onChange={(e) => handleAuditInput",
    "disabled={!canAdjust} onChange={(e) => handleAuditInput"
  ]
]);

// Purchases.jsx (need to add auth store and canEdit)
let pCode = fs.readFileSync('src/pages/Purchase.jsx', 'utf-8');
if (!pCode.includes('useAuthStore')) {
  pCode = pCode.replace(
    "import { format } from 'date-fns';",
    "import { format } from 'date-fns';\nimport { useAuthStore } from '../store/useAuthStore';"
  );
  pCode = pCode.replace(
    "const [paidAmt, setPaidAmt] = useState('');",
    "const [paidAmt, setPaidAmt] = useState('');\n  const user = useAuthStore(state => state.user);\n  const canCreate = user?.role === 'owner' || user?.permissions?.includes('purchases_create');\n  const canDelete = user?.role === 'owner' || user?.permissions?.includes('purchases_delete');"
  );
  pCode = pCode.replace(
    /<div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm">[\s\S]*?<form onSubmit=\{handleSavePurchase\}/,
    `{canCreate && (<div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-ui-text">Record Purchase Invoice</h2>
            <form onSubmit={handleSavePurchase}`
  );
  pCode = pCode.replace(
    "</form>\n          </div>",
    "</form>\n          </div>)}"
  );
  // delete button
  pCode = pCode.replace(
    /<button onClick=\{\(\) => handleDeletePurchase\(p\.id\)\}/g,
    "{canDelete && <button onClick={() => handleDeletePurchase(p.id)}"
  ).replace(
    /<Trash2 size=\{18\}\/><\/button>/g,
    "<Trash2 size={18}/></button>}"
  );
  fs.writeFileSync('src/pages/Purchase.jsx', pCode);
}

