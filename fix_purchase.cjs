const fs = require('fs');
let c = fs.readFileSync('src/pages/Purchase.jsx', 'utf-8');
c = c.replace("{canAdd && <button onClick={() => setIsSupModalOpen(true)} className=\"bg-brand-primary text-white px-5 py-2.5 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all whitespace-nowrap\">+ Add Supplier</button>", "{canAdd && <button onClick={() => setIsSupModalOpen(true)} className=\"bg-brand-primary text-white px-5 py-2.5 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all whitespace-nowrap\">+ Add Supplier</button>}");
fs.writeFileSync('src/pages/Purchase.jsx', c);
