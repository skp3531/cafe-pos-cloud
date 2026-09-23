const fs = require('fs');
let file = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

// 1. Replace expenses calculation
const oldExpLine = `const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);`;
const newExpLine = `
  const cashExpenses = expenses.filter(e => !e.paymentMode || e.paymentMode === 'CASH').reduce((acc, curr) => acc + curr.amount, 0);
  const otherExpenses = expenses.filter(e => e.paymentMode && e.paymentMode !== 'CASH').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = cashExpenses + otherExpenses;
`;
file = file.replace(oldExpLine, newExpLine.trim());

// 2. Replace expectedCashInDrawer calculation
file = file.replace(
  `const expectedCashInDrawer = totalCashCollected - totalExpenses;`,
  `const expectedCashInDrawer = totalCashCollected - cashExpenses;`
);

// 3. Update Z-Report HTML
file = file.replace(
  `<div class="flex"><span>Total Expenses</span><span>-Rs.\${data.expensesPaid.toFixed(2)}</span></div>`,
  `<div class="flex"><span>Cash Expenses</span><span>-Rs.\${data.cashExpenses?.toFixed(2) || '0.00'}</span></div>
        <div class="flex"><span>Other Expenses</span><span>-Rs.\${data.otherExpenses?.toFixed(2) || '0.00'}</span></div>
        <div class="flex"><span>Total Expenses</span><span>-Rs.\${data.expensesPaid.toFixed(2)}</span></div>`
);

// 4. Update handleDayClose reportData
const oldReportData = `
    const reportData = {
      date: new Date().toISOString(),
      openingCash: 0, 
      totalSales: totalSalesAmount,
      cashCollected: totalCashCollected,
      upiCollected: totalUpiCollected,
      cardCollected: totalCardCollected,
      expensesPaid: totalExpenses,
      expectedCash: expectedCashInDrawer,
      closingCash: actualCash,
      variance: variance,
      remarks: closingRemarks
    };
`;
const newReportData = `
    const reportData = {
      date: new Date().toISOString(),
      openingCash: 0, 
      totalSales: totalSalesAmount,
      cashCollected: totalCashCollected,
      upiCollected: totalUpiCollected,
      cardCollected: totalCardCollected,
      expensesPaid: totalExpenses,
      cashExpenses: cashExpenses,
      otherExpenses: otherExpenses,
      expectedCash: expectedCashInDrawer,
      closingCash: actualCash,
      variance: variance,
      remarks: closingRemarks
    };
`;
file = file.replace(oldReportData.trim(), newReportData.trim());


// 5. Update UI Modal
const oldUiBlock = `
                     <div className="flex justify-between"><span className="text-ui-muted">Total Expenses</span><span className="text-brand-danger">- ₹{totalExpenses.toFixed(2)}</span></div>
                   </div>
                   
                   <div className="bg-brand-accent/10 border border-brand-accent/20 rounded-2xl p-4 text-center mb-4">
                     <p className="text-brand-accent text-sm font-bold mb-1">Blind Cash Count</p>
`;
const newUiBlock = `
                     <div className="flex justify-between"><span className="text-ui-muted">Cash Expenses</span><span className="text-brand-danger">- ₹{cashExpenses.toFixed(2)}</span></div>
                     <div className="flex justify-between"><span className="text-ui-muted">Other Expenses</span><span className="text-brand-danger">- ₹{otherExpenses.toFixed(2)}</span></div>
                   </div>
                   
                   <div className="bg-brand-accent/10 border border-brand-accent/20 rounded-2xl p-4 text-center mb-4">
                     <p className="text-brand-accent text-sm font-bold mb-1">Blind Cash Count</p>
`;
file = file.replace(oldUiBlock.trim(), newUiBlock.trim());

fs.writeFileSync('src/pages/Dashboard.jsx', file);
