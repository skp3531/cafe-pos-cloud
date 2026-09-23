const fs = require('fs');

let code = fs.readFileSync('src/pages/Billing.jsx', 'utf-8');

// I need to add state variables for openingCash
if (!code.includes("const [openingCash, setOpeningCash]")) {
  code = code.replace(
    "const [activeCat, setActiveCat] = useState('all');",
    "const [activeCat, setActiveCat] = useState('all');\n  const [openingCash, setOpeningCash] = useState('');\n  const [isStartingShift, setIsStartingShift] = useState(false);"
  );
}

// I need to add handleStartShift to Billing.jsx
const startShiftLogic = `
  const handleStartShift = async (e) => {
    e.preventDefault();
    setIsStartingShift(true);
    try {
      await db.shifts.add({
        startTime: new Date().toISOString(),
        endTime: null,
        openingCash: parseFloat(openingCash) || 0,
        closingCash: null,
        expectedCash: null,
        variance: null,
        status: 'active',
        startedBy: user?.name || 'Unknown'
      });
      setOpeningCash('');
    } catch(err) {
      console.error(err);
    } finally {
      setIsStartingShift(false);
    }
  };
`;

if (!code.includes("const handleStartShift")) {
   code = code.replace(
     "const [isSplitOpen, setIsSplitOpen] = useState(false);",
     "const [isSplitOpen, setIsSplitOpen] = useState(false);\n" + startShiftLogic
   );
}

// Replace the generic "Shift is Closed" message with the Start Shift Form
const newLockout = `
    if (!activeShift) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-ui-bg w-full">
          <div className="bg-ui-card p-8 rounded-3xl shadow-float border border-ui-border max-w-sm w-full">
            <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-6">
               <AlertCircle size={40}/>
            </div>
            <h2 className="text-2xl font-bold text-ui-text mb-2">Register Closed</h2>
            <p className="text-ui-muted text-sm mb-8">Start a new shift to begin billing.</p>
            <form onSubmit={handleStartShift} className="space-y-4">
              <div className="text-left">
                <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Opening Cash Drawer (₹)</label>
                <input type="number" required autoFocus value={openingCash} onChange={e=>setOpeningCash(e.target.value)} placeholder="0.00" className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text text-xl" />
              </div>
              <button type="submit" disabled={isStartingShift} className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50">
                {isStartingShift ? 'Starting...' : 'Start Shift'}
              </button>
            </form>
          </div>
        </div>
      );
    }
`;

// It might be formatted slightly differently. Let's replace by slicing it exactly.
const startIndex = code.indexOf("if (!activeShift) {");
const endIndex = code.indexOf("return (\n    <div className=\"flex h-full relative\">");

if (startIndex !== -1 && endIndex !== -1) {
   code = code.substring(0, startIndex) + newLockout + code.substring(endIndex);
}

fs.writeFileSync('src/pages/Billing.jsx', code);
