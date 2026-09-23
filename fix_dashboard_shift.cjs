const fs = require('fs');

let code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf-8');

if (!code.includes("showStartShift")) {
  code = code.replace(
    "export default function Dashboard() {",
    `export default function Dashboard() {
  const [showStartShift, setShowStartShift] = useState(false);
  const [showEndShift, setShowEndShift] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [actualCash, setActualCash] = useState('');`
  );

  code = code.replace(
    "const activeShift = useLiveQuery(async () => {",
    `
  const handleStartShift = async (e) => {
    e.preventDefault();
    await db.shifts.add({
      startTime: new Date().toISOString(),
      userId: 'currentUser', 
      openingCash: parseFloat(openingCash) || 0,
      status: 'active',
      closingCash: 0,
      expectedCash: 0,
      notes: ''
    });
    setShowStartShift(false);
    setOpeningCash('');
  };

  const calculateExpectedCash = () => {
    if (!activeShift) return 0;
    const shiftStart = activeShift.startTime;
    const shiftSales = allSales.filter(s => s.date >= shiftStart && s.paymentMode === 'CASH' && s.status !== 'REFUNDED');
    const cashSales = shiftSales.reduce((acc, s) => acc + s.total, 0);
    const expected = (activeShift.openingCash || 0) + cashSales;
    return expected;
  };

  const handleEndShift = async (e) => {
    e.preventDefault();
    if (!activeShift) return;
    const expected = calculateExpectedCash();
    const actual = parseFloat(actualCash) || 0;
    
    await db.shifts.update(activeShift.id, {
      endTime: new Date().toISOString(),
      status: 'closed',
      expectedCash: expected,
      closingCash: actual,
      difference: actual - expected
    });
    
    setShowEndShift(false);
    setActualCash('');
  };

  const activeShift = useLiveQuery(async () => {`
  );

  const shiftUi = `
      {/* SHIFT MANAGEMENT BLOCK */}
      <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ui-text">Shift Management</h2>
          <p className="text-sm text-ui-muted mt-1">
            {activeShift 
              ? 'Current shift active since ' + new Date(activeShift.startTime).toLocaleTimeString() 
              : 'No active shift. Start a shift to begin billing.'}
          </p>
        </div>
        <div>
          {!activeShift ? (
            <button onClick={() => setShowStartShift(true)} className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2">
              <Play size={18} /> Start Shift
            </button>
          ) : (
            <button onClick={() => setShowEndShift(true)} className="bg-brand-danger text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2">
              <Square size={18} /> End Shift
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showStartShift && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-ui-card w-full max-w-sm p-6 rounded-3xl shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-ui-text">Start Shift</h2>
            <form onSubmit={handleStartShift} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Opening Cash (₹)</label>
                <input type="number" required autoFocus value={openingCash} onChange={e=>setOpeningCash(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowStartShift(false)} className="flex-1 p-4 rounded-2xl font-bold bg-ui-bg text-ui-text hover:bg-ui-border transition-colors">Cancel</button>
                <button type="submit" className="flex-1 p-4 rounded-2xl font-bold bg-brand-primary text-white shadow-md">Start</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEndShift && activeShift && (() => {
        const expected = calculateExpectedCash();
        const diff = (parseFloat(actualCash)||0) - expected;
        const color = Math.abs(diff) === 0 ? 'text-green-500' : Math.abs(diff) < 50 ? 'text-orange-500' : 'text-red-500';
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-ui-card w-full max-w-sm p-6 rounded-3xl shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-ui-text">End Shift</h2>
              <div className="bg-ui-bg p-4 rounded-2xl border border-ui-border mb-4 space-y-2 text-sm font-medium">
                <div className="flex justify-between text-ui-muted"><span>Opening Cash:</span><span>₹{activeShift.openingCash}</span></div>
                <div className="flex justify-between text-ui-text font-bold"><span>Expected Cash:</span><span>₹{expected}</span></div>
              </div>
              <form onSubmit={handleEndShift} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Actual Cash Counted (₹)</label>
                  <input type="number" required autoFocus value={actualCash} onChange={e=>setActualCash(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text text-xl" />
                </div>
                {actualCash !== '' && (
                  <div className={\`flex justify-between font-bold \${color}\`}>
                    <span>Difference:</span>
                    <span>{diff > 0 ? '+' : ''}₹{diff.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowEndShift(false)} className="flex-1 p-4 rounded-2xl font-bold bg-ui-bg text-ui-text hover:bg-ui-border transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 p-4 rounded-2xl font-bold bg-brand-danger text-white shadow-md">Close Shift</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
  `;
  
  code = code.replace(
    '<div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">',
    '<div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">\n' + shiftUi
  );

  // add imports
  if (!code.includes("useState")) {
     code = code.replace("import React from 'react';", "import React, { useState } from 'react';");
  }
  if (!code.includes("Play")) {
     code = code.replace("import { TrendingUp,", "import { Play, Square, TrendingUp,");
  }

  fs.writeFileSync('src/pages/Dashboard.jsx', code);
}
