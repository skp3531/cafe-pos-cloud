const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.jsx', 'utf-8');

code = code.replace(
  `<div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Invoice Format</label>
                    <select value={invoiceFormat} onChange={e=>setInvoiceFormat(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text mb-4">
                      <option value="standard">Standard (T1-YYYYMMDD-0001)</option>
                      <option value="short">Short (T1-0001)</option>
                      <option value="minimal">Minimal (0001)</option>
                    </select>
                    <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Paper Width</label>`,
  `<div>
                  <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Invoice Format</label>
                  <select value={invoiceFormat} onChange={e=>setInvoiceFormat(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text">
                    <option value="standard">Standard (T1-YYYYMMDD-0001)</option>
                    <option value="short">Short (T1-0001)</option>
                    <option value="minimal">Minimal (0001)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Paper Width</label>`
);

fs.writeFileSync('src/pages/Settings.jsx', code);
