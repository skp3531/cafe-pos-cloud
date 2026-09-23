const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.jsx', 'utf-8');

code = code.replace(
  "const [printerModule, setPrinterModule] = useState('browser');",
  "const [printerModule, setPrinterModule] = useState('browser');\n  const [invoiceFormat, setInvoiceFormat] = useState('standard');"
);

code = code.replace(
  "setPrinterModule(printData.printerModule || 'browser');",
  "setPrinterModule(printData.printerModule || 'browser');\n      setInvoiceFormat(printData.invoiceFormat || 'standard');"
);

code = code.replace(
  "showCustomer, showCashier, showTime, printerModule, customFooter",
  "showCustomer, showCashier, showTime, printerModule, customFooter, invoiceFormat"
);

code = code.replace(
  "<label className=\"text-xs font-bold text-ui-muted uppercase mb-1 block\">Paper Width</label>",
  "<label className=\"text-xs font-bold text-ui-muted uppercase mb-1 block\">Invoice Format</label>\n                    <select value={invoiceFormat} onChange={e=>setInvoiceFormat(e.target.value)} className=\"w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text mb-4\">\n                      <option value=\"standard\">Standard (T1-YYYYMMDD-0001)</option>\n                      <option value=\"short\">Short (T1-0001)</option>\n                      <option value=\"minimal\">Minimal (0001)</option>\n                    </select>\n                    <label className=\"text-xs font-bold text-ui-muted uppercase mb-1 block\">Paper Width</label>"
);

fs.writeFileSync('src/pages/Settings.jsx', code);
