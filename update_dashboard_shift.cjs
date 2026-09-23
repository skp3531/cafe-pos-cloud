const fs = require('fs');

const printZReportFn = `
  const printZReport = async (data) => {
    const printSettings = (await db.settings.get('print')) || {};
    const profileSettings = (await db.settings.get('profile')) || {};

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const showHeader = printSettings.showHeader !== false;
    const footerMsg = printSettings.customFooter || profileSettings.footer || '';

    const content = \`
      <html><head><style>
        body{font-family:monospace;width:\${printSettings.paperWidth || '300px'};margin:0 auto;padding:16px;text-align:center;color:#000;font-size:\${printSettings.fontSize || '13px'}}
        .divider{border-bottom:1px dashed #000;margin:8px 0}
        .flex{display:flex;justify-content:space-between}
        h2{margin:4px 0;font-size:16px}h3{margin:4px 0}p{margin:2px 0}
      </style></head><body>
        \${showHeader ? \`<h2>\${profileSettings.name || 'Store'}</h2>\` : ''}
        <h3>END OF DAY (Z-REPORT)</h3>
        <div class="divider"></div>
        <div class="flex"><span>Date:</span><span>\${new Date(data.date).toLocaleString('en-IN')}</span></div>
        <div class="divider"></div>
        <div class="flex"><span>Total Sales</span><span>Rs.\${data.totalSales.toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="flex"><span>System Cash</span><span>Rs.\${data.cashCollected.toFixed(2)}</span></div>
        <div class="flex"><span>System UPI</span><span>Rs.\${data.upiCollected.toFixed(2)}</span></div>
        <div class="flex"><span>System Card</span><span>Rs.\${data.cardCollected.toFixed(2)}</span></div>
        <div class="flex"><span>Total Expenses</span><span>-Rs.\${data.expensesPaid.toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="flex"><span>Expected Cash</span><span>Rs.\${data.expectedCash.toFixed(2)}</span></div>
        <div class="flex"><span>Physical Cash</span><span>Rs.\${data.closingCash.toFixed(2)}</span></div>
        <div class="flex"><span>Variance (Short/Over)</span><span>Rs.\${data.variance.toFixed(2)}</span></div>
        \${data.remarks ? \`<div class="divider"></div><p>Remarks: \${data.remarks}</p>\` : ''}
        <div class="divider"></div>
        <p>\${footerMsg}</p>
      </body></html>
    \`;
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(content);
    doc.close();
    
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => { document.body.removeChild(iframe); }, 2000);
  };
`;

let file = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

// Add states
file = file.replace(
  `const [closingCash, setClosingCash] = useState('');`,
  `const [closingCash, setClosingCash] = useState('');\n  const [dayCloseStep, setDayCloseStep] = useState(1);\n  const [closingRemarks, setClosingRemarks] = useState('');`
);

// Replace handleDayClose
const handleDayCloseRegex = /const handleDayClose = async \(\) => \{[\s\S]*?alert\('Shift Closed Successfully!'\);\n  \};/;
const newHandleDayClose = `
  const handleDayClose = async () => {
    const actualCash = parseFloat(closingCash || 0);
    const variance = actualCash - expectedCashInDrawer;
    
    const reportData = {
      date: new Date().toISOString(),
      openingCash: 0, 
      totalSales: totalSalesAmount,
      cashCollected: totalCashCollected,
      upiCollected: totalUpiCollected,
      cardCollected: totalCardCollected,
      expensesPaid: totalExpenses,
      expectedCash: expectedCashInDrawer,
      closingCash: actualCash,
      variance: variance,
      remarks: closingRemarks
    };

    await db.day_closing.add(reportData);
    
    printZReport(reportData);
    
    setIsDayCloseOpen(false);
    setDayCloseStep(1);
    setClosingCash('');
    setClosingRemarks('');
  };
`;

file = file.replace(handleDayCloseRegex, printZReportFn.trim() + '\n\n' + newHandleDayClose.trim());

// Update the modal rendering
const oldModalStr = `
             <div className="p-6 space-y-4 flex-1 overflow-y-auto">
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
             </div>
             
             <div className="p-6 bg-ui-bg border-t border-ui-border flex gap-4">
               <button onClick={()=>setIsDayCloseOpen(false)} className="flex-1 p-4 rounded-2xl font-bold bg-ui-card border border-ui-border hover:bg-ui-bg transition-all">Cancel</button>
               <button onClick={handleDayClose} className="flex-1 p-4 rounded-2xl font-bold bg-brand-warning text-white hover:bg-brand-warning/90 transition-all shadow-md active:scale-95">End Shift</button>
             </div>
`;

const newModalStr = `
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
`;

// Replace using safe search since it spans multiple lines.
const startIdx = file.indexOf('<div className="p-6 space-y-4 flex-1 overflow-y-auto">');
const endIdx = file.indexOf('</div>\n          </div>\n        </div>\n      )}');
if (startIdx !== -1 && endIdx !== -1) {
  const toReplace = file.substring(startIdx, endIdx);
  file = file.replace(toReplace, newModalStr.trim() + '\n             ');
  fs.writeFileSync('src/pages/Dashboard.jsx', file);
} else {
  console.log("Could not find replacement boundaries.");
}
