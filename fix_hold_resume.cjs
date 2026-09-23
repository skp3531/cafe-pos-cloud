const fs = require('fs');

let code = fs.readFileSync('src/pages/Billing.jsx', 'utf-8');

// We need to add state for Held Bills
if (!code.includes("isHeldOpen")) {
  code = code.replace(
    "const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);",
    "const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);\n  const [isHeldOpen, setIsHeldOpen] = useState(false);\n  const heldOrders = useLiveQuery(() => db.held_orders ? db.held_orders.toArray() : []) || [];"
  );
}

const holdBillLogic = `
  const handleHoldBill = async () => {
    if (cart.length === 0) return;
    await db.held_orders.add({
      date: new Date().toISOString(),
      customerId: customer?.id || null,
      customerName: customer?.name || 'Guest',
      items: cart,
      subtotal,
      discount: discountAmt,
      total
    });
    clearCart();
  };

  const handleResumeBill = async (h) => {
    clearCart();
    for (let item of h.items) {
       addItem(item);
       updateQty(item.cartId || (item.id + '-' + item.name), item.qty);
    }
    if (h.customerId) {
       const cus = await db.customers.get(h.customerId);
       if (cus) setCustomer(cus);
    }
    await db.held_orders.delete(h.id);
    setIsHeldOpen(false);
  };
`;

if (!code.includes("handleHoldBill")) {
  code = code.replace(
    "const handleCheckout = async (paymentMode) => {",
    holdBillLogic + "\n  const handleCheckout = async (paymentMode) => {"
  );
}

// Add the Hold buttons next to clear cart
const oldButtons = `<button onClick={clearCart} className="bg-brand-danger/10 text-brand-danger hover:bg-brand-danger hover:text-white p-3 md:p-4 rounded-2xl font-bold transition-all"><Trash2 size={24} /></button>`;
const newButtons = `<button onClick={clearCart} className="bg-brand-danger/10 text-brand-danger hover:bg-brand-danger hover:text-white p-3 md:p-4 rounded-2xl font-bold transition-all" title="Clear"><Trash2 size={24} /></button>
              <button onClick={handleHoldBill} className="bg-ui-border text-ui-text hover:bg-ui-muted hover:text-white p-3 md:p-4 rounded-2xl font-bold transition-all" title="Hold Bill"><Pause size={24} /></button>
              <button onClick={() => setIsHeldOpen(true)} className="bg-ui-border text-ui-text hover:bg-ui-muted hover:text-white p-3 md:p-4 rounded-2xl font-bold transition-all relative" title="Resume Bill">
                <FileText size={24} />
                {heldOrders.length > 0 && <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">{heldOrders.length}</span>}
              </button>`;

if (!code.includes("handleHoldBill")) {
  // if not injected properly, fallback. Wait, let's just replace.
  code = code.replace(oldButtons, newButtons);
}

// Add modal for Resume Bill
const modalCode = `
      {/* HELD BILLS MODAL */}
      {isHeldOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-ui-card w-full max-w-md p-6 rounded-3xl shadow-xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-ui-text">Held Bills</h2>
              <button onClick={() => setIsHeldOpen(false)} className="text-ui-muted hover:text-ui-text"><X size={24}/></button>
            </div>
            <div className="overflow-y-auto space-y-3 flex-1 hide-scrollbar">
              {heldOrders.length === 0 ? (
                <div className="text-center text-ui-muted py-8 font-medium">No held bills.</div>
              ) : heldOrders.map(h => (
                <div key={h.id} className="bg-ui-bg border border-ui-border p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-ui-text">{h.customerName}</div>
                    <div className="text-sm text-ui-muted">{new Date(h.date).toLocaleTimeString()} - {h.items.length} items</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-black text-brand-primary">₹{h.total.toFixed(2)}</div>
                    <button onClick={() => handleResumeBill(h)} className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold shadow-sm active:scale-95">Resume</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
`;
code = code.replace("return (", "return (\n" + modalCode);

if (!code.includes("Trash2")) {
   code = code.replace("import { AlertCircle,", "import { Trash2, FileText, AlertCircle,");
} else if (!code.includes("FileText")) {
   code = code.replace("Trash2,", "Trash2, FileText,");
}

fs.writeFileSync('src/pages/Billing.jsx', code);
