const fs = require('fs');

let file = fs.readFileSync('src/pages/Reports.jsx', 'utf8');

// 1. Add dayClosings
file = file.replace(
  `const items = useLiveQuery(() => db.items.toArray()) || [];`,
  `const items = useLiveQuery(() => db.items.toArray()) || [];\n  const dayClosings = useLiveQuery(() => db.day_closing.toArray()) || [];`
);

// 2. Add Shifts Table (Wait, we need to inject the table again because it failed last time)
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
  `{filteredReturns.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-ui-muted">No returned bills found for this period.</td></tr>}
              </tbody>
            </table>
          )}`,
  `{filteredReturns.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-ui-muted">No returned bills found for this period.</td></tr>}
              </tbody>
            </table>
          )}\n${tableInjection}`
);

// 3. Add Returns export back! Since I accidentally deleted it.
const exportReturnsStr = `
    } else if (activeTab === 'returns') {
      const headers = ["Invoice Number", "Return Date", "Original Total"];
      const rows = filteredReturns.map(r => [r.invoiceNumber || r.id, new Date(r.date).toLocaleString(), r.total.toFixed(2)]);
      downloadCSV(headers, rows, \`Returns_Report_\${dateFilter}\`);
    } else if (activeTab === 'shifts') {
`;
file = file.replace(`} else if (activeTab === 'shifts') {`, exportReturnsStr.trim() + ' {');

fs.writeFileSync('src/pages/Reports.jsx', file);
