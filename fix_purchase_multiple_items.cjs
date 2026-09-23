const fs = require('fs');
let file = fs.readFileSync('src/pages/Purchase.jsx', 'utf8');

// 1. Add purchaseItems state
file = file.replace(
  `const [expandedPurchaseId, setExpandedPurchaseId] = useState(null);`,
  `const [expandedPurchaseId, setExpandedPurchaseId] = useState(null);\n  const [purchaseItems, setPurchaseItems] = useState([]);`
);

// 2. Add handleAddItemToPurchase
const newFunctions = `
  const handleAddItemToPurchase = (e) => {
    e.preventDefault();
    if (!selectedInvId || !qty) return;
    const iId = parseInt(selectedInvId);
    const invItem = inventory.find(i => i.id === iId);
    setPurchaseItems([...purchaseItems, { 
      inventoryId: iId, 
      qty: parseFloat(qty), 
      multiplier: parseFloat(multiplier) || 1,
      invName: invItem?.name,
      unit: invItem?.unit || 'unit'
    }]);
    setSelectedInvId('');
    setQty('');
    setMultiplier(1);
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    if (!selectedSupId || purchaseItems.length === 0 || !amount) return;
    const sId = parseInt(selectedSupId);
    const amt = parseFloat(amount);
    
    await db.purchases.add({
      supplierId: sId,
      date: new Date().toISOString(),
      items: purchaseItems.map(pi => ({ inventoryId: pi.inventoryId, qty: pi.qty, multiplier: pi.multiplier })),
      totalAmount: amt,
      paymentMode: paymentMode,
      paidAmount: paymentMode === 'cash' ? amt : 0
    });
    
    for (let pi of purchaseItems) {
      const inv = await db.inventory.get(pi.inventoryId);
      if (inv) {
        await db.inventory.update(pi.inventoryId, { currentStock: inv.currentStock + (pi.qty * pi.multiplier) });
      }
    }
    
    if (paymentMode === 'credit') {
      const sup = await db.suppliers.get(sId);
      await db.suppliers.update(sId, { outstandingBalance: (sup.outstandingBalance || 0) + amt });
    } else {
      const sup = await db.suppliers.get(sId);
      await db.expenses.add({
        date: new Date().toISOString(),
        category: 'Purchases',
        amount: amt,
        description: \`Purchase from \${sup ? sup.name : 'Supplier'}\`
      });
    }
    
    setPurchaseItems([]); setSelectedSupId(''); setAmount(''); setPaymentMode('cash'); setIsEntryModalOpen(false);
  };
`;

// Replace handleAddPurchase
file = file.replace(
  /const handleAddPurchase = async \(e\) => \{[\s\S]*?setSelectedInvId\(''\); setQty\(''\); setAmount\(''\); setMultiplier\(1\); setIsEntryModalOpen\(false\);\n  \};/,
  newFunctions.trim()
);

// 3. Replace the modal form HTML
const modalHTML = `
          {isEntryModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-ui-card w-full max-w-lg rounded-3xl border border-ui-border shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-ui-border shrink-0">
                  <h2 className="text-xl font-bold text-ui-text">Purchase Entry</h2>
                  <button onClick={() => { setIsEntryModalOpen(false); setPurchaseItems([]); }} className="text-ui-muted hover:text-ui-text p-1 bg-ui-bg rounded-lg"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto hide-scrollbar space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-ui-muted mb-2">Supplier</label>
                      <select value={selectedSupId} onChange={e => setSelectedSupId(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium">
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="border border-ui-border p-4 rounded-2xl bg-ui-bg/50">
                      <form onSubmit={handleAddItemToPurchase} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-ui-muted mb-2">Add Material to Bill</label>
                          <select required value={selectedInvId} onChange={e => setSelectedInvId(e.target.value)} className="w-full p-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium">
                            <option value="">Select Material</option>
                            {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-ui-muted mb-2">Qty</label>
                            <input type="number" step="0.01" required value={qty} onChange={e => setQty(e.target.value)} className="w-full p-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-ui-muted mb-2">UOM Multiplier</label>
                            <input type="number" step="0.01" required value={multiplier} onChange={e => setMultiplier(e.target.value)} className="w-full p-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                          </div>
                        </div>
                        <button type="submit" className="w-full bg-ui-border text-ui-text p-3 rounded-xl font-bold hover:bg-ui-muted/20 transition-all text-sm">+ Add Item</button>
                      </form>
                    </div>

                    {purchaseItems.length > 0 && (
                      <div className="space-y-2">
                        {purchaseItems.map((pi, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-ui-bg border border-ui-border p-3 rounded-xl">
                            <div>
                              <div className="font-bold text-ui-text text-sm">{pi.invName}</div>
                              <div className="text-xs text-ui-muted">{pi.qty} x {pi.multiplier} {pi.unit}</div>
                            </div>
                            <button onClick={() => setPurchaseItems(purchaseItems.filter((_, i) => i !== idx))} className="text-ui-muted hover:text-brand-danger p-1"><X size={16}/></button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ui-border">
                      <div>
                        <label className="block text-sm font-semibold text-ui-muted mb-2">Total Bill Amount</label>
                        <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-ui-muted mb-2">Payment Terms</label>
                        <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium">
                          <option value="cash">Paid in Cash</option>
                          <option value="credit">Buy on Credit</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-ui-border bg-ui-bg shrink-0 rounded-b-3xl">
                  <button onClick={handleAddPurchase} disabled={purchaseItems.length === 0 || !amount || !selectedSupId} className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Plus size={20}/> Record Purchase
                  </button>
                </div>
              </div>
            </div>
          )}
`;

file = file.replace(
  /\{isEntryModalOpen && \([\s\S]*?<\/form>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/,
  modalHTML.trim()
);


fs.writeFileSync('src/pages/Purchase.jsx', file);
