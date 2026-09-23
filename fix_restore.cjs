const fs = require('fs');
let file = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

// Add file input and restore logic
const restoreLogic = `
  const fileInputRef = useRef();
  
  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.categories) await db.categories.bulkPut(data.categories);
        if (data.items) await db.items.bulkPut(data.items);
        if (data.sales) await db.sales.bulkPut(data.sales);
        if (data.inventory) await db.inventory.bulkPut(data.inventory);
        if (data.expenses) await db.expenses.bulkPut(data.expenses);
        if (data.customers) await db.customers.bulkPut(data.customers);
        if (data.purchases) await db.purchases.bulkPut(data.purchases);
        if (data.suppliers) await db.suppliers.bulkPut(data.suppliers);
        alert('Backup restored successfully!');
      } catch (err) {
        alert('Failed to restore backup. Invalid file.');
      }
    };
    reader.readAsText(file);
  };
`;

file = file.replace(
  `const downloadBackup = async () => {`,
  `${restoreLogic}\n  const downloadBackup = async () => {`
);

// We need useRef
if (!file.includes('useRef')) {
  file = file.replace(/import React, { useState, useEffect }/, `import React, { useState, useEffect, useRef }`);
}

// Update UI
const restoreUI = `
                <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleRestore} />
                <button onClick={() => fileInputRef.current.click()} className="flex-1 bg-ui-bg text-ui-text border border-ui-border p-4 rounded-2xl font-bold hover:bg-ui-border active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Upload size={20} /> Restore
                </button>
`;

file = file.replace(
  /<button className="flex-1 bg-ui-bg text-ui-text border border-ui-border p-4 rounded-2xl font-bold hover:bg-ui-border active:scale-95 transition-all flex items-center justify-center gap-2">\s*<Upload size=\{20\} \/> Restore\s*<\/button>/,
  restoreUI.trim()
);

fs.writeFileSync('src/pages/Settings.jsx', file);
