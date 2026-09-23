const fs = require('fs');
let file = fs.readFileSync('src/pages/Purchase.jsx', 'utf8');

// Remove multiplier state
file = file.replace(`const [multiplier, setMultiplier] = useState(1);\n`, ``);
file = file.replace(`setMultiplier(1);\n`, ``);

// Update handleAddItemToPurchase
file = file.replace(
  `multiplier: parseFloat(multiplier) || 1,`,
  `multiplier: 1,`
);

// Update the Form inputs
const oldInputs = `
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-ui-muted mb-2">Packs/Boxes Bought</label>
                            <input type="number" step="0.01" required value={qty} onChange={e => setQty(e.target.value)} className="w-full p-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-ui-muted mb-2">{unitLabel} per Pack</label>
                            <input type="number" step="0.01" required value={multiplier} onChange={e => setMultiplier(e.target.value)} className="w-full p-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" title="If buying 1 box of 10kg but you track in kg, enter 10" />
                          </div>
                        </div>
`;

const newInputs = `
                        <div>
                          <label className="block text-sm font-semibold text-ui-muted mb-2">Qty {selectedInvId && \`(\${unitLabel})\`}</label>
                          <input type="number" step="0.01" required value={qty} onChange={e => setQty(e.target.value)} className="w-full p-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                        </div>
`;
file = file.replace(oldInputs.trim(), newInputs.trim());

// Remove multiplier from UI displays (Purchase Items List)
file = file.replace(
  `<div className="text-xs text-ui-muted">{pi.qty} x {pi.multiplier} {pi.unit}</div>`,
  `<div className="text-xs text-ui-muted">{pi.qty} {pi.unit}</div>`
);

// Remove multiplier from History display
file = file.replace(
  `<span className="text-ui-muted text-sm font-medium">{item.qty} x {item.multiplier} {invItem?.unit || 'unit'}</span>`,
  `<span className="text-ui-muted text-sm font-medium">{item.qty * (item.multiplier || 1)} {invItem?.unit || 'unit'}</span>`
);

fs.writeFileSync('src/pages/Purchase.jsx', file);
