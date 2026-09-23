const fs = require('fs');
let code = fs.readFileSync('src/pages/Orders.jsx', 'utf-8');
const search = `    printReportPDF('Orders Ledger Report', headers, rows);
  };
      
      <div className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 mb-6 shrink-0">
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8 flex flex-col h-full">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <h1 className="text-3xl font-bold text-ui-text tracking-tight">Orders Ledger</h1>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="bg-ui-card text-ui-text px-4 py-2 rounded-xl font-bold border border-ui-border hover:bg-ui-bg flex items-center gap-2 transition-all shadow-sm"><Download size={18}/> CSV</button>
          <button onClick={handlePrintPDF} className="bg-ui-card text-ui-text px-4 py-2 rounded-xl font-bold border border-ui-border hover:bg-ui-bg flex items-center gap-2 transition-all shadow-sm"><Printer size={18}/> Print</button>
        </div>
      </div>`;
const replace = `    printReportPDF('Orders Ledger Report', headers, rows);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8 flex flex-col h-full">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <h1 className="text-3xl font-bold text-ui-text tracking-tight">Orders Ledger</h1>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="bg-ui-card text-ui-text px-4 py-2 rounded-xl font-bold border border-ui-border hover:bg-ui-bg flex items-center gap-2 transition-all shadow-sm"><Download size={18}/> CSV</button>
          <button onClick={handlePrintPDF} className="bg-ui-card text-ui-text px-4 py-2 rounded-xl font-bold border border-ui-border hover:bg-ui-bg flex items-center gap-2 transition-all shadow-sm"><Printer size={18}/> Print</button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 mb-6 shrink-0">`;
code = code.replace(search, replace);
fs.writeFileSync('src/pages/Orders.jsx', code);
