const fs = require('fs');
let file = fs.readFileSync('src/pages/Reports.jsx', 'utf8');

// 1. Add hooks
const usersQuery = `const users = useLiveQuery(() => db.users.toArray()) || [];`;
file = file.replace(
  `const dayClosings = useLiveQuery(() => db.day_closing.toArray()) || [];`,
  `const dayClosings = useLiveQuery(() => db.day_closing.toArray()) || [];\n  const auditLogs = useLiveQuery(() => db.audit_logs.toArray()) || [];\n  const users = useLiveQuery(() => db.users.toArray()) || [];`
);

// 2. Compute Staff Activity
const staffActivityLogic = `
  const staffActivity = useMemo(() => {
    const map = {};
    users.forEach(u => map[u.name] = { name: u.name, role: u.role, loginTime: '-', bills: 0, revenue: 0, returns: 0 });
    
    filteredSales.forEach(s => {
      const creator = s.createdBy || 'Owner';
      if (!map[creator]) map[creator] = { name: creator, role: 'Cashier', loginTime: '-', bills: 0, revenue: 0, returns: 0 };
      if (s.status === 'PAID') {
        map[creator].bills += 1;
        map[creator].revenue += s.total;
      } else if (s.status === 'RETURNED') {
        map[creator].returns += 1;
      }
    });

    auditLogs.forEach(log => {
      if (log.action === 'LOGIN' && log.timestamp >= sDate && log.timestamp <= eDate) {
        const creator = log.userName;
        if (!map[creator]) map[creator] = { name: creator, role: 'Unknown', loginTime: '-', bills: 0, revenue: 0, returns: 0 };
        if (map[creator].loginTime === '-') {
          map[creator].loginTime = new Date(log.timestamp).toLocaleTimeString('en-IN');
        }
      }
    });

    return Object.values(map);
  }, [users, filteredSales, auditLogs, sDate, eDate]);
`;
file = file.replace(`const exportCurrentTab = () => {`, staffActivityLogic + '\n  const exportCurrentTab = () => {');

// 3. Tab Button
file = file.replace(
  `{id: 'shifts', label: 'Z-Reports'}].map(tab => (`,
  `{id: 'shifts', label: 'Z-Reports'}, {id: 'staff', label: 'Staff Activity'}].map(tab => (`
);

// 4. Export Logic
const exportStaffLogic = `
    } else if (activeTab === 'staff') {
      const headers = ["Staff Name", "Role", "Latest Login", "Bills Handled", "Revenue", "Returns Processed"];
      const rows = staffActivity.map(s => [s.name, s.role, s.loginTime, s.bills, s.revenue.toFixed(2), s.returns]);
      downloadCSV(headers, rows, \`Staff_Activity_\${dateFilter}\`);
`;
file = file.replace(`} else if (activeTab === 'shifts') { {`, `} else if (activeTab === 'shifts') {`);
file = file.replace(`} else if (activeTab === 'shifts') {`, exportStaffLogic + `    } else if (activeTab === 'shifts') {`);


// 5. Render Table
const staffTable = `
          {activeTab === 'staff' && (
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-ui-bg text-ui-muted text-xs uppercase tracking-wider"><th className="p-4 font-bold">Staff Name</th><th className="p-4 font-bold text-center">First Login</th><th className="p-4 font-bold text-center">Bills Handled</th><th className="p-4 font-bold text-center">Returns Processed</th><th className="p-4 font-bold text-right">Total Revenue</th></tr></thead>
              <tbody className="divide-y divide-ui-border text-sm font-medium text-ui-text">
                {staffActivity.map((s, idx) => (
                  <tr key={idx} className="hover:bg-ui-bg transition-colors">
                    <td className="p-4">
                      <div className="font-bold">{s.name}</div>
                      <div className="text-xs text-ui-muted uppercase">{s.role}</div>
                    </td>
                    <td className="p-4 text-center">{s.loginTime}</td>
                    <td className="p-4 text-center font-black text-ui-text">{s.bills}</td>
                    <td className="p-4 text-center font-bold text-brand-danger">{s.returns > 0 ? s.returns : '-'}</td>
                    <td className="p-4 text-right font-black text-brand-primary">₹{s.revenue.toFixed(2)}</td>
                  </tr>
                ))}
                {staffActivity.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-ui-muted font-bold">No staff activity found.</td></tr>}
              </tbody>
            </table>
          )}
`;
file = file.replace(`{filteredShifts.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-ui-muted font-bold">No Z-Reports in this period.</td></tr>}
              </tbody>
            </table>
          )}`, `{filteredShifts.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-ui-muted font-bold">No Z-Reports in this period.</td></tr>}
              </tbody>
            </table>
          )}\n${staffTable}`);


// 6. Import Users Icon and add Overview block
const overviewStaff = `
        {activeTab === 'staff' && (
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 text-ui-muted mb-2 font-bold text-sm uppercase tracking-wider"><Users size={18}/> Active Staff</div>
            <div className="text-3xl font-black text-brand-primary">{staffActivity.filter(s => s.bills > 0 || s.loginTime !== '-').length} Staff</div>
          </div>
        )}
`;
file = file.replace(`{activeTab === 'shifts' && (`, overviewStaff + `        {activeTab === 'shifts' && (`);
file = file.replace(`RefreshCcw } from 'lucide-react'`, `RefreshCcw, Users } from 'lucide-react'`);

fs.writeFileSync('src/pages/Reports.jsx', file);
console.log("Added Staff Activity Report");
