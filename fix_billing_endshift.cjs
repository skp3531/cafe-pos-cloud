const fs = require('fs');

let code = fs.readFileSync('src/pages/Billing.jsx', 'utf-8');

// 1. Add states
if (!code.includes("const [showEndShift, setShowEndShift]")) {
  code = code.replace(
    "const [isStartingShift, setIsStartingShift] = useState(false);",
    "const [isStartingShift, setIsStartingShift] = useState(false);\n  const [showEndShift, setShowEndShift] = useState(false);\n  const [actualCash, setActualCash] = useState('');"
  );
}

// 2. Add todaySales query
if (!code.includes("const todaySales =")) {
  code = code.replace(
    "const heldOrders = useLiveQuery",
    "const todaySales = useLiveQuery(() => db.orders ? db.orders.where('date').startsWith(new Date().toISOString().split('T')[0]).toArray() : []) || [];\n  const heldOrders = useLiveQuery"
  );
}

// 3. Add handleEndShift logic
const endShiftLogic = `
  const calculateExpectedCash = () => {
    if (!activeShift) return 0;
    const cashSales = todaySales.filter(s => s.paymentMode === 'cash').reduce((sum, s) => sum + s.total, 0);
    return parseFloat(activeShift.openingCash) + cashSales;
  };

  const handleEndShift = async (e) => {
    e.preventDefault();
    const expected = calculateExpectedCash();
    const actual = parseFloat(actualCash) || 0;
    await db.shifts.update(activeShift.id, {
      endTime: new Date().toISOString(),
      closingCash: actual,
      expectedCash: expected,
      variance: actual - expected,
      status: 'closed',
      endedBy: user?.name || 'Unknown'
    });
    setShowEndShift(false);
    setActualCash('');
  };
`;

if (!code.includes("const handleEndShift =")) {
  code = code.replace(
    "const handleStartShift = async",
    endShiftLogic + "\n  const handleStartShift = async"
  );
}

// 4. Add the Close Drawer button to the header
if (!code.includes("Close Drawer")) {
  code = code.replace(
    '<div className="relative flex-1">',
    `<button onClick={() => setShowEndShift(true)} className="bg-brand-danger/10 text-brand-danger border border-brand-danger/20 px-4 py-4 rounded-2xl font-bold shadow-sm hover:bg-brand-danger/20 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap">
      <Lock size={18} /> Close Drawer
    </button>\n          <div className="relative flex-1">`
  );
}

// 5. Add Lock to Lucide imports
if (!code.includes("Lock,")) {
  code = code.replace("import { ", "import { Lock, ");
}

// 6. Add End Shift Modal
const modalHtml = `
      {showEndShift && activeShift && (() => {
        const expected = calculateExpectedCash();
        const diff = (parseFloat(actualCash)||0) - expected;
        const color = Math.abs(diff) === 0 ? 'text-green-500' : Math.abs(diff) < 50 ? 'text-orange-500' : 'text-red-500';
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-ui-card w-full max-w-sm p-6 rounded-3xl shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-ui-text">Close Drawer (End Shift)</h2>
              <div className="bg-ui-bg p-4 rounded-2xl border border-ui-border mb-4 space-y-2 text-sm font-medium">
                <div className="flex justify-between text-ui-muted"><span>Opening Cash:</span><span>₹{activeShift.openingCash}</span></div>
                {user?.role === 'owner' ? <div className="flex justify-between text-ui-text font-bold"><span>Expected Cash:</span><span>₹{expected}</span></div> : <div className="flex justify-between text-brand-primary font-bold"><span>Expected Cash:</span><span>HIDDEN (Blind Close)</span></div>}
              </div>
              <form onSubmit={handleEndShift} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Actual Cash Counted (₹)</label>
                  <input type="number" required autoFocus value={actualCash} onChange={e=>setActualCash(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text text-xl" />
                </div>
                {actualCash !== '' && user?.role === 'owner' && (
                  <div className={\`flex justify-between font-bold \${color}\`}>
                    <span>Difference:</span>
                    <span>{diff > 0 ? '+' : ''}₹{diff.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowEndShift(false)} className="flex-1 p-4 rounded-2xl font-bold bg-ui-bg text-ui-text hover:bg-ui-border transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 p-4 rounded-2xl font-bold bg-brand-danger text-white shadow-md">Close Register</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
`;

if (!code.includes("Close Drawer (End Shift)")) {
  // insert before the final closing div of Billing.jsx
  const endDiv = code.lastIndexOf("</div>\n  );\n}");
  if (endDiv !== -1) {
    code = code.substring(0, endDiv) + "\n" + modalHtml + "\n" + code.substring(endDiv);
  }
}

fs.writeFileSync('src/pages/Billing.jsx', code);
