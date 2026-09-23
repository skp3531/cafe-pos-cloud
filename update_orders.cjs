const fs = require('fs');

let file = fs.readFileSync('src/pages/Orders.jsx', 'utf8');

// 1. Add date states
const states = `
  const [dateFilter, setDateFilter] = useState('TODAY');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
`;

file = file.replace(
  `const [filter, setFilter] = useState('ALL');`,
  `const [filter, setFilter] = useState('ALL');\n${states}`
);

// 2. Modify filteredSales logic
const filterLogic = `
  const filteredSales = sales.filter(s => {
    const c = customers.find(c => c.id === s.customerId);
    const cName = c ? c.name.toLowerCase() : '';
    const inv = s.invoiceNumber ? s.invoiceNumber.toLowerCase() : String(s.id);
    const matchesSearch = inv.includes(search.toLowerCase()) || cName.includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || s.status === filter;
    
    let matchesDate = true;
    if (dateFilter === 'TODAY') {
      const todayStr = new Date().toISOString().split('T')[0];
      matchesDate = s.date.startsWith(todayStr);
    } else if (dateFilter === 'CUSTOM' && customStart && customEnd) {
      const sDate = new Date(customStart).toISOString();
      const eDate = new Date(customEnd + 'T23:59:59').toISOString();
      matchesDate = s.date >= sDate && s.date <= eDate;
    }
    
    return matchesSearch && matchesFilter && matchesDate;
  });
`;

file = file.replace(
  /const filteredSales = sales\.filter[\s\S]*?return matchesSearch && matchesFilter;\n  }\);/,
  filterLogic.trim()
);

// 3. Add Date Filter UI
const dateUI = `
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm">
            {['TODAY', 'ALL_DATES', 'CUSTOM'].map(f => (
               <button key={f} className={clsx("px-4 py-2 font-bold rounded-xl transition-all text-sm whitespace-nowrap", dateFilter === f ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setDateFilter(f)}>
                 {f === 'ALL_DATES' ? 'All Dates' : f === 'TODAY' ? 'Today' : 'Custom'}
               </button>
            ))}
          </div>
          
          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center gap-2 bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm px-3">
              <input type="date" className="bg-transparent outline-none text-sm font-bold text-ui-text" value={customStart} onChange={e=>setCustomStart(e.target.value)}/>
              <span className="text-ui-muted text-sm">to</span>
              <input type="date" className="bg-transparent outline-none text-sm font-bold text-ui-text" value={customEnd} onChange={e=>setCustomEnd(e.target.value)}/>
            </div>
          )}
        </div>
`;

file = file.replace(
  `</form>\n      </div>`, // Wait, Orders doesn't have form.
  ``
);

// Let's use a regex to find where to insert dateUI in Orders.jsx
// Right after:
//         <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm w-full md:w-auto">
//           {['ALL', 'PAID', 'HOLD', 'RETURNED'].map(f => ( ... ))}
//         </div>

file = file.replace(
  `</div>\n      </div>\n\n      <div className="flex-1 overflow-y-auto`,
  `</div>\n        ${dateUI}\n      </div>\n\n      <div className="flex-1 overflow-y-auto`
);


// 4. Update Print Receipt to use settings
file = file.replace(
  `const profileSettings = useLiveQuery(() => db.settings.get('profile')) || {};`,
  `const profileSettings = useLiveQuery(() => db.settings.get('profile')) || {};\n  const printSettings = useLiveQuery(() => db.settings.get('print')) || {};`
);

file = file.replace(
  `body{font-family:monospace;width:300px;margin:0 auto;padding:16px;text-align:center;color:#000;font-size:13px}`,
  `body{font-family:monospace;width:\${printSettings.paperWidth || '300px'};margin:0 auto;padding:16px;text-align:center;color:#000;font-size:\${printSettings.fontSize || '13px'}}`
);

// Add condition for Header and Footer
file = file.replace(
  `<h2>\${profileSettings.name || 'Shake Sphere Cafe'}</h2>`,
  `\${printSettings.showHeader !== false ? \`<h2>\${profileSettings.name || 'Shake Sphere Cafe'}</h2>\` : ''}`
);
file = file.replace(
  `<p>\${profileSettings.address || ''}</p>`,
  `\${printSettings.showHeader !== false ? \`<p>\${profileSettings.address || ''}</p>\` : ''}`
);
file = file.replace(
  `<p>\${profileSettings.phone ? 'Ph: ' + profileSettings.phone : ''}</p>`,
  `\${printSettings.showHeader !== false ? \`<p>\${profileSettings.phone ? 'Ph: ' + profileSettings.phone : ''}</p>\` : ''}`
);
file = file.replace(
  `\${profileSettings.gstin ? \`<p>GSTIN: \${profileSettings.gstin}</p>\` : ''}`,
  `\${printSettings.showHeader !== false && profileSettings.gstin ? \`<p>GSTIN: \${profileSettings.gstin}</p>\` : ''}`
);

file = file.replace(
  `<p>\${profileSettings.footer || 'Thank you! Visit again.'}</p>`,
  `\${printSettings.showFooter !== false ? \`<p>\${profileSettings.footer || 'Thank you! Visit again.'}</p>\` : ''}`
);

// Add Loyalty Redeem points to Receipt!
// It is stored in order.discount, but we want to show it explicitly if it was points.
// Currently the POS saves it as discount. If they want point redeemed shown explicitly, we might need to modify how Billing saves it (save it as `pointsRedeemed: X`).

fs.writeFileSync('src/pages/Orders.jsx', file);
