const fs = require('fs');

let code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf-8');

const modalCode = `
      {/* SHIFT MODALS */}
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
                  <button type="submit" className="flex-1 p-4 rounded-2xl font-bold bg-brand-danger text-white shadow-md">Close Shift</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
`;

if (!code.includes("SHIFT MODALS")) {
  const lastDiv = code.lastIndexOf("</div>\n  );\n}");
  if (lastDiv !== -1) {
    code = code.substring(0, lastDiv) + "\n" + modalCode + "\n" + code.substring(lastDiv);
  }
}

fs.writeFileSync('src/pages/Dashboard.jsx', code);
