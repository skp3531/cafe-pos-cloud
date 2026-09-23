const fs = require('fs');
let file = fs.readFileSync('src/pages/Purchase.jsx', 'utf8');

// Inside the render function, we can extract selectedItemUnit
const injectStr = `
  const handleAddItemToPurchase = (e) => {`;
const replaceStr = `
  const selectedInvItem = inventory.find(i => i.id === parseInt(selectedInvId));
  const unitLabel = selectedInvItem ? selectedInvItem.unit : 'units';
  
  const handleAddItemToPurchase = (e) => {`;

file = file.replace(injectStr, replaceStr);

// Now update the labels in the modal
const oldLabels = `
                          <div>
                            <label className="block text-sm font-semibold text-ui-muted mb-2">Qty</label>
                            <input type="number" step="0.01" required value={qty} onChange={e => setQty(e.target.value)} className="w-full p-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-ui-muted mb-2">UOM Multiplier</label>
                            <input type="number" step="0.01" required value={multiplier} onChange={e => setMultiplier(e.target.value)} className="w-full p-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                          </div>
`;

const newLabels = `
                          <div>
                            <label className="block text-sm font-semibold text-ui-muted mb-2">Packs/Boxes Bought</label>
                            <input type="number" step="0.01" required value={qty} onChange={e => setQty(e.target.value)} className="w-full p-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-ui-muted mb-2">{unitLabel} per Pack</label>
                            <input type="number" step="0.01" required value={multiplier} onChange={e => setMultiplier(e.target.value)} className="w-full p-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" title="If buying 1 box of 10kg but you track in kg, enter 10" />
                          </div>
`;

file = file.replace(oldLabels.trim(), newLabels.trim());

fs.writeFileSync('src/pages/Purchase.jsx', file);
