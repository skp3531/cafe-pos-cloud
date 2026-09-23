const fs = require('fs');
let code = fs.readFileSync('src/components/PrintLayoutSettings.jsx', 'utf-8');

code = code.replace(
  "invoiceFormat: 'standard', autoPrint: false, printDuplicate: false, compactMode: false,",
  "invoiceFormat: 'standard', customInvoiceStart: 1, autoPrint: false, printDuplicate: false, compactMode: false,"
);

code = code.replace(
  "{ id: 'invoiceFormat', label: 'Invoice Format', type: 'select', options: [{v:'standard',l:'Standard'}, {v:'short',l:'Short'}, {v:'minimal',l:'Minimal'}] },",
  "{ id: 'invoiceFormat', label: 'Invoice Format', type: 'select', options: [{v:'standard',l:'Standard'}, {v:'short',l:'Short'}, {v:'minimal',l:'Minimal'}] },\n      { id: 'customInvoiceStart', label: 'Start Sequence Today At', type: 'number' },"
);

code = code.replace(
  "f.type==='text' || f.type==='select' ? 'flex-col items-start gap-2' : ''",
  "f.type==='text' || f.type==='number' || f.type==='select' ? 'flex-col items-start gap-2' : ''"
);

code = code.replace(
  "f.type === 'text' && (",
  "(f.type === 'text' || f.type === 'number') && (\n                        <input type={f.type} value={settings[f.id]} onChange={e=>setSettings({...settings, [f.id]: f.type==='number'?parseInt(e.target.value)||0:e.target.value})} className=\"w-full p-2.5 rounded-lg bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-sm font-bold text-ui-text\" />\n                      )}\n                      {false && ("
);

// We need to fix the live preview invoice offset as well
code = code.replace(
  "settings.invoiceFormat==='standard' ? 'T1-20260923-0001' : settings.invoiceFormat==='short' ? 'T1-0001' : '0001'",
  "(() => {\n                  const seq = String(settings.customInvoiceStart || 1).padStart(4, '0');\n                  if (settings.invoiceFormat === 'short') return `T1-${seq}`;\n                  if (settings.invoiceFormat === 'minimal') return seq;\n                  return `T1-20260923-${seq}`;\n                })()"
);

fs.writeFileSync('src/components/PrintLayoutSettings.jsx', code);
