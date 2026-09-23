const fs = require('fs');

const modalStr = `
      {/* SHIFT CLOSE MODAL */}
      {isDayCloseOpen && (
        <div className="fixed inset-0 bg-ui-bg/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-ui-card border border-ui-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
             <div className="p-6 border-b border-ui-border bg-ui-bg text-center">
                <h2 className="text-2xl font-bold text-ui-text">Shift Close</h2>
                <p className="text-ui-muted text-sm font-medium mt-1">{format(new Date(), 'PPPP')}</p>
             </div>
             
             <div className="p-6 space-y-4 flex-1 overflow-y-auto hide-scrollbar">
               {dayCloseStep === 1 && (
                 <>
                   <div className="bg-ui-bg rounded-2xl p-4 border border-ui-border space-y-2 text-sm font-bold">
                     <div className="flex justify-between"><span className="text-ui-muted">Cash Sales</span><span className="text-ui-text">₹{totalCashCollected.toFixed(2)}</span></div>
                     <div className="flex justify-between"><span className="text-ui-muted">UPI Sales</span><span className="text-ui-text">₹{totalUpiCollected.toFixed(2)}</span></div>
                     <div className="flex justify-between"><span className="text-ui-muted">Card Sales</span><span className="text-ui-text">₹{totalCardCollected.toFixed(2)}</span></div>
                     <div className="w-full h-px bg-ui-border my-2"></div>
                     <div className="flex justify-between"><span className="text-ui-muted">Total Expenses</span><span className="text-brand-danger">- ₹{totalExpenses.toFixed(2)}</span></div>
                   </div>
                   
                   <div className="bg-brand-accent/10 border border-brand-accent/20 rounded-2xl p-4 text-center mb-4">
                     <p className="text-brand-accent text-sm font-bold mb-1">Blind Cash Count</p>
                     <p className="text-xs text-brand-accent/80 font-medium">Please count your drawer and enter the exact physical cash below.</p>
                   </div>
                   
                   <div>
                     <label className="text-sm font-bold text-ui-muted mb-2 block">Actual Physical Cash</label>
                     <input type="number" value={closingCash} onChange={e=>setClosingCash(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-lg text-center" placeholder="Enter total physical cash..." autoFocus/>
                   </div>
                 </>
               )}

               {dayCloseStep === 2 && (
                 <div className="space-y-4">
                   <div className="bg-ui-bg rounded-2xl p-4 border border-ui-border space-y-3 text-sm font-bold">
                     <h3 className="text-brand-primary text-center mb-2">Verification Report</h3>
                     <div className="flex justify-between"><span className="text-ui-muted">Expected System Cash</span><span className="text-ui-text">₹{expectedCashInDrawer.toFixed(2)}</span></div>
                     <div className="flex justify-between"><span className="text-ui-muted">Actual Physical Cash</span><span className="text-ui-text">₹{parseFloat(closingCash || 0).toFixed(2)}</span></div>
                     <div className="w-full h-px bg-ui-border my-2"></div>
                     <div className="flex justify-between text-lg">
                       <span className="text-ui-muted">Variance</span>
                       <span className={(parseFloat(closingCash || 0) - expectedCashInDrawer) >= 0 ? "text-brand-accent" : "text-brand-danger"}>
                         {(parseFloat(closingCash || 0) - expectedCashInDrawer) >= 0 ? '+' : ''}₹{(parseFloat(closingCash || 0) - expectedCashInDrawer).toFixed(2)}
                       </span>
                     </div>
                   </div>
                   
                   <div>
                     <label className="text-sm font-bold text-ui-muted mb-2 block">Shift Remarks (Optional)</label>
                     <textarea value={closingRemarks} onChange={e=>setClosingRemarks(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-sm resize-none h-24" placeholder="Explain any variance or leave a note..."></textarea>
                   </div>
                 </div>
               )}
             </div>
             
             <div className="p-6 bg-ui-bg border-t border-ui-border flex gap-4 shrink-0">
               {dayCloseStep === 1 ? (
                 <>
                   <button onClick={()=>{setIsDayCloseOpen(false); setClosingCash('');}} className="flex-1 p-4 rounded-2xl font-bold bg-ui-card border border-ui-border hover:bg-ui-bg transition-all">Cancel</button>
                   <button onClick={()=>setDayCloseStep(2)} disabled={!closingCash} className="flex-1 p-4 rounded-2xl font-bold bg-brand-primary text-white hover:bg-brand-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50">Verify Count</button>
                 </>
               ) : (
                 <>
                   <button onClick={()=>setDayCloseStep(1)} className="flex-1 p-4 rounded-2xl font-bold bg-ui-card border border-ui-border hover:bg-ui-bg transition-all">Back</button>
                   <button onClick={handleDayClose} className="flex-1 p-4 rounded-2xl font-bold bg-brand-warning text-white hover:bg-brand-warning/90 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"><Printer size={18}/> Print & End</button>
                 </>
               )}
             </div>
          </div>
        </div>
      )}
`;

let file = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

const startIdx = file.indexOf('{/* SHIFT CLOSE MODAL */}');
const endIdx = file.indexOf('      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">');

if (startIdx !== -1 && endIdx !== -1) {
  const toReplace = file.substring(startIdx, endIdx);
  file = file.replace(toReplace, modalStr + '\n');
  fs.writeFileSync('src/pages/Dashboard.jsx', file);
  console.log("Fixed!");
}
