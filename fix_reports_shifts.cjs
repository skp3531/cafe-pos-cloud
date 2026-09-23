const fs = require('fs');

let file = fs.readFileSync('src/pages/Reports.jsx', 'utf8');

// Add dayClosings query
file = file.replace(
  `const returns = useLiveQuery(() => db.sales.where('isRefunded').equals(true).toArray()) || [];`,
  `const returns = useLiveQuery(() => db.sales.where('isRefunded').equals(true).toArray()) || [];\n  const dayClosings = useLiveQuery(() => db.day_closing.toArray()) || [];`
);

// Add filteredShifts
const filteredShiftsInjection = `
  const filteredShifts = dayClosings.filter(d => {
    if (d.date >= sDate && d.date <= eDate) return true;
    return false;
  }).sort((a,b) => new Date(b.date) - new Date(a.date));
  
  const exportCurrentTab = () => {`;
file = file.replace(`const exportCurrentTab = () => {`, filteredShiftsInjection.trim());

// Add export support for shifts
const exportShiftsInjection = `
    } else if (activeTab === 'shifts') {
      const headers = ["Date", "Sales", "Cash", "UPI", "Card", "Expected Cash", "Actual Cash", "Variance", "Remarks"];
      const rows = filteredShifts.map(s => [
        new Date(s.date).toLocaleString(), 
        s.totalSales?.toFixed(2) || '0', 
        s.cashCollected?.toFixed(2) || '0',
        s.upiCollected?.toFixed(2) || '0',
        s.cardCollected?.toFixed(2) || '0',
        s.expectedCash?.toFixed(2) || '0',
        s.closingCash?.toFixed(2) || '0',
        s.variance?.toFixed(2) || '0',
        s.remarks || ''
      ]);
      downloadCSV(headers, rows, \`Z_Reports_\${dateFilter}\`);
    }
  };`;
file = file.replace(`} else if (activeTab === 'returns') {
      const headers = ["Invoice Number", "Return Date", "Original Total"];
      const rows = filteredReturns.map(r => [r.invoiceNumber || r.id, new Date(r.date).toLocaleString(), r.total.toFixed(2)]);
      downloadCSV(headers, rows, \`Returns_Report_\${dateFilter}\`);
    }
  };`, exportShiftsInjection.trim());


// Add tab button
file = file.replace(
  `{[{id: 'sales', label: 'Sales'}, {id: 'purchases', label: 'Purchases'}, {id: 'items', label: 'Items'}, {id: 'returns', label: 'Returns'}].map(tab => (`,
  `{[{id: 'sales', label: 'Sales'}, {id: 'purchases', label: 'Purchases'}, {id: 'items', label: 'Items'}, {id: 'returns', label: 'Returns'}, {id: 'shifts', label: 'Z-Reports'}].map(tab => (`
);

// Add Overview Card
const overviewInjection = `
        {activeTab === 'shifts' && (
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 text-ui-muted mb-2 font-bold text-sm uppercase tracking-wider"><RefreshCcw size={18}/> Shift Closings</div>
            <div className="text-3xl font-black text-brand-primary">{filteredShifts.length} Records</div>
          </div>
        )}
        <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
`;
file = file.replace(
  `<div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">\n            <div className="flex items-center gap-3 text-ui-muted mb-2 font-bold text-sm uppercase tracking-wider"><IndianRupee size={18}/> Net Profit</div>`,
  overviewInjection.trim() + '\n            <div className="flex items-center gap-3 text-ui-muted mb-2 font-bold text-sm uppercase tracking-wider"><IndianRupee size={18}/> Net Profit</div>'
);

// Add table view
const tableInjection = `
          {activeTab === 'shifts' && (
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-ui-bg text-ui-muted text-xs uppercase tracking-wider"><th className="p-4 font-bold">Date & Time</th><th className="p-4 font-bold text-right">Total Sales</th><th className="p-4 font-bold text-right">Expected Cash</th><th className="p-4 font-bold text-right">Actual Cash</th><th className="p-4 font-bold text-right">Variance</th><th className="p-4 font-bold hidden md:table-cell">Remarks</th></tr></thead>
              <tbody className="divide-y divide-ui-border text-sm font-medium text-ui-text">
                {filteredShifts.map((s, idx) => (
                  <tr key={idx} className="hover:bg-ui-bg transition-colors">
                    <td className="p-4">
                      <div className="font-bold">{new Date(s.date).toLocaleDateString()}</div>
                      <div className="text-xs text-ui-muted">{new Date(s.date).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-4 text-right">₹{s.totalSales?.toFixed(2) || '0.00'}</td>
                    <td className="p-4 text-right">₹{s.expectedCash?.toFixed(2) || '0.00'}</td>
                    <td className="p-4 text-right font-bold text-brand-primary">₹{s.closingCash?.toFixed(2) || '0.00'}</td>
                    <td className={"p-4 text-right font-black " + (s.variance < 0 ? "text-brand-danger" : s.variance > 0 ? "text-brand-accent" : "text-ui-muted")}>
                      {s.variance > 0 ? '+' : ''}₹{s.variance?.toFixed(2) || '0.00'}
                    </td>
                    <td className="p-4 text-ui-muted text-xs hidden md:table-cell max-w-[200px] truncate">{s.remarks || '-'}</td>
                  </tr>
                ))}
                {filteredShifts.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-ui-muted font-bold">No Z-Reports in this period.</td></tr>}
              </tbody>
            </table>
          )}
`;
file = file.replace(
  `{filteredReturns.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-ui-muted font-bold">No returns found in this period.</td></tr>}
              </tbody>
            </table>
          )}`,
  `{filteredReturns.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-ui-muted font-bold">No returns found in this period.</td></tr>}
              </tbody>
            </table>
          )}
          ${tableInjection}
`
);

fs.writeFileSync('src/pages/Reports.jsx', file);
