const fs = require('fs');

let code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf-8');

const shiftUi = `
      {/* SHIFT MANAGEMENT BLOCK */}
      <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
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
              <Square size={18} /> End Shift (Drawer)
            </button>
          )}
        </div>
      </div>
`;

if (!code.includes("SHIFT MANAGEMENT BLOCK")) {
  const headerEnd = code.indexOf("</button>\n      </div>");
  if (headerEnd !== -1) {
    const insertPos = headerEnd + "</button>\n      </div>".length;
    code = code.substring(0, insertPos) + "\n" + shiftUi + code.substring(insertPos);
  }
}

// Rename the old "End Shift" to "Close Day" to prevent confusion
code = code.replace(
  "<LockKeyhole size={20}/> End Shift",
  "<LockKeyhole size={20}/> Close Day"
);

fs.writeFileSync('src/pages/Dashboard.jsx', code);
