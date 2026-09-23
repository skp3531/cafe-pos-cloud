const fs = require('fs');
let file = fs.readFileSync('src/pages/Purchase.jsx', 'utf8');

// 1. Add state for dateFilter
file = file.replace(
  `const [multiplier, setMultiplier] = useState(1);`,
  `const [multiplier, setMultiplier] = useState(1);
  const [dateFilter, setDateFilter] = useState('TODAY');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');`
);

// 2. Add filteredPurchases logic
const filteredLogic = `
  const filteredPurchases = purchases.filter(p => {
    if (dateFilter === 'TODAY') {
      const todayStr = new Date().toISOString().split('T')[0];
      return p.date.startsWith(todayStr);
    } else if (dateFilter === 'CUSTOM' && customStart && customEnd) {
      const sDate = new Date(customStart).toISOString();
      const eDate = new Date(customEnd + 'T23:59:59').toISOString();
      return p.date >= sDate && p.date <= eDate;
    }
    return true;
  });
`;
file = file.replace(
  `const handleAddSupplier = async (e) => {`,
  `${filteredLogic}\n\n  const handleAddSupplier = async (e) => {`
);

// 3. Remove duplicate "Purchase History" header and replace map with filtered map
file = file.replace(
  `<h2 className="text-xl font-bold mb-6 text-ui-text">Purchase History</h2>`,
  ``
);

file = file.replace(
  `{purchases.length === 0 &&`,
  `{filteredPurchases.length === 0 &&`
);

file = file.replace(
  `{purchases.map(p => {`,
  `{filteredPurchases.map(p => {`
);

// 4. Add the date filter UI right below the Header that has "+ Purchase Entry"
const entryHeaderWithDateFilter = `
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-ui-text">Purchase History</h2>
            {canEdit && <button onClick={() => setIsEntryModalOpen(true)} className="bg-brand-primary text-white px-5 py-2.5 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all whitespace-nowrap">+ Purchase Entry</button>}
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto mb-6">
            <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm w-fit">
              {['TODAY', 'ALL_DATES', 'CUSTOM'].map(f => (
                 <button key={f} className={clsx("px-4 py-2 font-bold rounded-xl transition-all text-sm whitespace-nowrap", dateFilter === f ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setDateFilter(f)}>
                   {f === 'ALL_DATES' ? 'All Dates' : f === 'TODAY' ? 'Today' : 'Custom'}
                 </button>
              ))}
            </div>
            
            {dateFilter === 'CUSTOM' && (
              <div className="flex items-center gap-2 bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm px-3 w-fit">
                <input type="date" className="bg-transparent outline-none text-sm font-bold text-ui-text" value={customStart} onChange={e=>setCustomStart(e.target.value)}/>
                <span className="text-ui-muted text-sm">to</span>
                <input type="date" className="bg-transparent outline-none text-sm font-bold text-ui-text" value={customEnd} onChange={e=>setCustomEnd(e.target.value)}/>
              </div>
            )}
          </div>
`;

file = file.replace(
  /<div className="w-full">\s*<div className="flex justify-between items-center mb-6">\s*<h2 className="text-xl font-bold text-ui-text">Purchase History<\/h2>[\s\S]*?<\/div>/,
  entryHeaderWithDateFilter.trim()
);

fs.writeFileSync('src/pages/Purchase.jsx', file);
