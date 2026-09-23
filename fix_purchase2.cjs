const fs = require('fs');
let c = fs.readFileSync('src/pages/Purchase.jsx', 'utf-8');
c = c.replace("{canAdd && <button onClick={() => setIsEntryModalOpen(true)} className=\"bg-brand-primary text-white px-5 py-2.5 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all whitespace-nowrap\">+ Purchase Entry</button>", "{canAdd && <button onClick={() => setIsEntryModalOpen(true)} className=\"bg-brand-primary text-white px-5 py-2.5 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all whitespace-nowrap\">+ Purchase Entry</button>}");
fs.writeFileSync('src/pages/Purchase.jsx', c);
