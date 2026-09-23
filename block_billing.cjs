const fs = require('fs');

let code = fs.readFileSync('src/pages/Billing.jsx', 'utf-8');

// Add activeShift query
code = code.replace(
  "const [activeCat, setActiveCat] = useState('all');",
  "const [activeCat, setActiveCat] = useState('all');\n  const activeShift = useLiveQuery(() => db.shifts?.where('status').equals('active').first());"
);

// Add block UI at the top of return
const retIndex = code.indexOf("return (");
if (retIndex !== -1) {
   const blockUI = `
    if (activeShift === undefined) return null; // loading
    if (!activeShift) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-brand-danger/10 text-brand-danger rounded-full flex items-center justify-center"><AlertCircle size={40}/></div>
          <h2 className="text-2xl font-bold text-ui-text">Shift is Closed</h2>
          <p className="text-ui-muted max-w-md">You must start a shift from the Dashboard before you can access the Billing module.</p>
        </div>
      );
    }
  `;
  code = code.replace("return (", blockUI + "\n  return (");
  
  // also need to import AlertCircle if not imported
  if (!code.includes("AlertCircle")) {
     code = code.replace("import { Trash2, Plus, Minus, Search", "import { Trash2, Plus, Minus, Search, AlertCircle");
  }
}

fs.writeFileSync('src/pages/Billing.jsx', code);
