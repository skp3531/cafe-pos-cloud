const fs = require('fs');

let code = fs.readFileSync('src/pages/Billing.jsx', 'utf-8');

// The corrupted block is:
//     if (!activeShift) {
//       return (
// 
//       <div className="flex h-full relative">
// {/* HELD BILLS MODAL */}
// ...
//       )}
// 
//         <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
// ...
//       );
//     }
//   
//   return (
//     
//       {/* ITEM GRID */}

const startCorrupted = code.indexOf("if (!activeShift) {");
const endCorrupted = code.indexOf("{/* ITEM GRID */}");

const correctedBlock = `if (!activeShift) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-brand-danger/10 text-brand-danger rounded-full flex items-center justify-center"><AlertCircle size={40}/></div>
          <h2 className="text-2xl font-bold text-ui-text">Shift is Closed</h2>
          <p className="text-ui-muted max-w-md">You must start a shift from the Dashboard before you can access the Billing module.</p>
        </div>
      );
    }
  
  return (
    <div className="flex h-full relative">
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

if (startCorrupted !== -1 && endCorrupted !== -1) {
   const corrupted = code.substring(startCorrupted, endCorrupted);
   code = code.replace(corrupted, correctedBlock);
}

fs.writeFileSync('src/pages/Billing.jsx', code);
