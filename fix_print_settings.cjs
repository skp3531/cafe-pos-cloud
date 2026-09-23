const fs = require('fs');
let file = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

// Add new state variables
file = file.replace(
  `const [printFooter, setPrintFooter] = useState(true);`,
  `const [printFooter, setPrintFooter] = useState(true);\n  const [showCustomer, setShowCustomer] = useState(true);\n  const [showCashier, setShowCashier] = useState(true);\n  const [showTime, setShowTime] = useState(true);\n  const [printerModule, setPrinterModule] = useState('browser');\n  const [customFooter, setCustomFooter] = useState('');`
);

// Load from DB
const loadStr = `
      setPrintHeader(printData.showHeader ?? true);
      setPrintFooter(printData.showFooter ?? true);
      setShowCustomer(printData.showCustomer ?? true);
      setShowCashier(printData.showCashier ?? true);
      setShowTime(printData.showTime ?? true);
      setPrinterModule(printData.printerModule || 'browser');
      setCustomFooter(printData.customFooter || 'Thank you! Visit again.');
`;
file = file.replace(
  /setPrintHeader\(printData\.showHeader \?\? true\);\s*setPrintFooter\(printData\.showFooter \?\? true\);/,
  loadStr.trim()
);

// Save to DB
const saveStr = `
  const savePrintSettings = async () => {
    await db.settings.put({ 
      id: 'print', fontSize, paperWidth, 
      showHeader: printHeader, showFooter: printFooter,
      showCustomer, showCashier, showTime, printerModule, customFooter
    });
    alert('Print settings saved!');
  };
`;
file = file.replace(
  /const savePrintSettings = async \(\) => \{[\s\S]*?\n  \};/,
  saveStr.trim()
);

// Update UI
const uiStr = `
          {activeTab === 'print' && (
            <div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm">
              <div className="w-12 h-12 bg-ui-bg rounded-2xl flex items-center justify-center text-brand-primary mb-6"><Printer size={24}/></div>
              <h2 className="text-xl font-bold mb-2 text-ui-text">Advanced Print & Thermal Layout</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Printer Module Connection</label>
                  <select value={printerModule} onChange={e=>setPrinterModule(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text">
                    <option value="browser">Standard Browser Print (PDF / System)</option>
                    <option value="thermal_escpos">ESC/POS Thermal Network Printer</option>
                    <option value="thermal_usb">WebUSB Direct Thermal</option>
                    <option value="thermal_bt">Bluetooth Thermal Printer</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Paper Width</label>
                    <select value={paperWidth} onChange={e=>setPaperWidth(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text">
                      <option value="200px">2 inch (58mm)</option>
                      <option value="300px">3 inch (80mm)</option>
                      <option value="100%">A4 / Full Width</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Font Size</label>
                    <select value={fontSize} onChange={e=>setFontSize(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text">
                      <option value="11px">Small (11px)</option>
                      <option value="13px">Medium (13px)</option>
                      <option value="15px">Large (15px)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Custom Footer Message</label>
                  <input type="text" value={customFooter} onChange={e=>setCustomFooter(e.target.value)} placeholder="Thank you! Visit again." className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 bg-ui-bg p-4 rounded-2xl border border-ui-border">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-ui-text text-sm">
                    <input type="checkbox" checked={printHeader} onChange={e=>setPrintHeader(e.target.checked)} className="w-5 h-5 rounded accent-brand-primary"/> Store Header
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-ui-text text-sm">
                    <input type="checkbox" checked={printFooter} onChange={e=>setPrintFooter(e.target.checked)} className="w-5 h-5 rounded accent-brand-primary"/> Footer Msg
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-ui-text text-sm">
                    <input type="checkbox" checked={showCustomer} onChange={e=>setShowCustomer(e.target.checked)} className="w-5 h-5 rounded accent-brand-primary"/> Customer Name
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-ui-text text-sm">
                    <input type="checkbox" checked={showCashier} onChange={e=>setShowCashier(e.target.checked)} className="w-5 h-5 rounded accent-brand-primary"/> Cashier Name
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-ui-text text-sm">
                    <input type="checkbox" checked={showTime} onChange={e=>setShowTime(e.target.checked)} className="w-5 h-5 rounded accent-brand-primary"/> Date & Time
                  </label>
                </div>
              </div>
              <button onClick={savePrintSettings} className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all">Save Print Layout</button>
            </div>
          )}
`;

file = file.replace(
  /\{activeTab === 'print' && \([\s\S]*?<\/div>\s*\)\}/,
  uiStr.trim()
);

fs.writeFileSync('src/pages/Settings.jsx', file);
