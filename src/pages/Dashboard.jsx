import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLiveQuery } from '../db/db';

import { Play, Square, AlertCircle } from 'lucide-react';
import { db } from '../db/db';
import { TrendingUp, ShoppingBag, Receipt, ArrowUpRight, LockKeyhole, AlertTriangle, Truck, Printer } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import DayCloseModal from '../components/DayCloseModal';

export default function Dashboard() {
  const user = useAuthStore(state => state.user);
  const [showStartShift, setShowStartShift] = useState(false);
  const [showEndShift, setShowEndShift] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [actualCash, setActualCash] = useState('');
  
  
  const handleStartShift = async (e) => {
    e.preventDefault();
    await db.shifts.add({
      startTime: new Date().toISOString(),
      endTime: null,
      openingCash: parseFloat(openingCash) || 0,
      closingCash: null,
      expectedCash: null,
      variance: null,
      status: 'active',
      startedBy: user?.name || 'Unknown'
    });
    setShowStartShift(false);
  };

  const calculateExpectedCash = () => {
    if (!activeShift) return 0;
    // sum up cash sales for today
    const cashSales = todaySales.filter(s => s.paymentMode === 'cash').reduce((sum, s) => sum + s.total, 0);
    // add to opening
    return parseFloat(activeShift.openingCash) + cashSales;
  };

  const handleEndShift = async (e) => {
    e.preventDefault();
    const expected = calculateExpectedCash();
    const actual = parseFloat(actualCash) || 0;
    
    await db.shifts.update(activeShift.id, {
      endTime: new Date().toISOString(),
      closingCash: actual,
      expectedCash: expected,
      variance: actual - expected,
      status: 'closed',
      endedBy: user?.name || 'Unknown'
    });
    setShowEndShift(false);
  };

  const activeShift = useLiveQuery(async () => {
    try { return db.shifts ? await db.shifts.where('status').equals('active').first() : null; } catch (e) { return null; }
  });
  const allShifts = useLiveQuery(() => db.shifts ? db.shifts.toArray() : []) || [];

  const [isDayCloseOpen, setIsDayCloseOpen] = useState(false);
  const [closingCash, setClosingCash] = useState('');
  const [dayCloseStep, setDayCloseStep] = useState(1);
  const [closingRemarks, setClosingRemarks] = useState('');
  
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  
  const sales = useLiveQuery(() => db.sales.where('date').aboveOrEqual(todayStart.toISOString()).toArray()) || [];
  const expenses = useLiveQuery(() => db.expenses.where('date').aboveOrEqual(todayStart.toISOString()).toArray()) || [];
  const inventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  const allSales = useLiveQuery(() => db.sales.where('status').equals('PAID').toArray()) || [];
  
  // Calculate Shift Metrics
  const todaySales = sales.filter(s => s.status === 'PAID');
  const totalSalesAmount = todaySales.reduce((acc, curr) => acc + curr.total, 0);
  const cashExpenses = expenses.filter(e => !e.paymentMode || e.paymentMode === 'CASH').reduce((acc, curr) => acc + curr.amount, 0);
  const otherExpenses = expenses.filter(e => e.paymentMode && e.paymentMode !== 'CASH').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = cashExpenses + otherExpenses;
  const avgBill = todaySales.length ? (totalSalesAmount / todaySales.length).toFixed(2) : 0;
  
  // Collections
  const cashSales = todaySales.filter(s => s.paymentMode === 'CASH').reduce((a, c) => a + c.total, 0);
  const upiSales = todaySales.filter(s => s.paymentMode === 'UPI').reduce((a, c) => a + c.total, 0);
  const cardSales = todaySales.filter(s => s.paymentMode === 'CARD').reduce((a, c) => a + c.total, 0);
  
  const splitCash = todaySales.filter(s => s.paymentMode === 'SPLIT').reduce((a, c) => a + (c.splitDetails?.cash || 0), 0);
  const splitUpi = todaySales.filter(s => s.paymentMode === 'SPLIT').reduce((a, c) => a + (c.splitDetails?.upi || 0), 0);
  
  const totalCashCollected = cashSales + splitCash;
  const totalUpiCollected = upiSales + splitUpi;
  const totalCardCollected = cardSales;
  
  const expectedCashInDrawer = totalCashCollected - cashExpenses;
  
  const printZReport = async (data) => {
    const printSettings = (await db.settings.get('print')) || {};
    const profileSettings = (await db.settings.get('profile')) || {};

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const showHeader = printSettings.showHeader !== false;
    const footerMsg = printSettings.customFooter || profileSettings.footer || '';

    const content = `
      <html><head><style>
        body{font-family:monospace;width:${printSettings.paperWidth || '300px'};margin:0 auto;padding:16px;text-align:center;color:#000;font-size:${printSettings.fontSize || '13px'}}
        .divider{border-bottom:1px dashed #000;margin:8px 0}
        .flex{display:flex;justify-content:space-between}
        h2{margin:4px 0;font-size:16px}h3{margin:4px 0}p{margin:2px 0}
      </style></head><body>
        ${showHeader ? `<h2>${profileSettings.name || 'Store'}</h2>` : ''}
        <h3>END OF DAY (Z-REPORT)</h3>
        <div class="divider"></div>
        <div class="flex"><span>Date:</span><span>${new Date(data.date).toLocaleString('en-IN')}</span></div>
        <div class="divider"></div>
        <div class="flex"><span>Total Sales</span><span>Rs.${data.totalSales.toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="flex"><span>System Cash</span><span>Rs.${data.cashCollected.toFixed(2)}</span></div>
        <div class="flex"><span>System UPI</span><span>Rs.${data.upiCollected.toFixed(2)}</span></div>
        <div class="flex"><span>System Card</span><span>Rs.${data.cardCollected.toFixed(2)}</span></div>
        <div class="flex"><span>Cash Expenses</span><span>-Rs.${data.cashExpenses?.toFixed(2) || '0.00'}</span></div>
        <div class="flex"><span>Other Expenses</span><span>-Rs.${data.otherExpenses?.toFixed(2) || '0.00'}</span></div>
        <div class="flex"><span>Total Expenses</span><span>-Rs.${data.expensesPaid.toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="flex"><span>Expected Cash</span><span>Rs.${data.expectedCash.toFixed(2)}</span></div>
        <div class="flex"><span>Physical Cash</span><span>Rs.${data.closingCash.toFixed(2)}</span></div>
        <div class="flex"><span>Variance (Short/Over)</span><span>Rs.${data.variance.toFixed(2)}</span></div>
        ${data.remarks ? `<div class="divider"></div><p>Remarks: ${data.remarks}</p>` : ''}
        <div class="divider"></div>
        <p>${footerMsg}</p>
      </body></html>
    `;
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(content);
    doc.close();
    
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => { document.body.removeChild(iframe); }, 2000);
  };



  const handleDayClose = async () => {
    const actualCash = parseFloat(closingCash || 0);
    const variance = actualCash - expectedCashInDrawer;
    
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

    await db.day_closing.add(reportData);
        
    printZReport(reportData);
    
    setIsDayCloseOpen(false);
    setDayCloseStep(1);
    setClosingCash('');
    setClosingRemarks('');
  };

  const lowStockItems = inventory.filter(i => i.currentStock <= i.minStock);
  const pendingSuppliers = suppliers.filter(s => s.balance > 0);

  // Calculate top selling items
  const itemCounts = {};
  allSales.forEach(order => {
    order.items.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
    });
  });
  const topItems = Object.entries(itemCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-ui-text tracking-tight">Today's Overview</h1>
        
      </div>

      


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm flex flex-col justify-between">
           <div className="w-12 h-12 bg-ui-bg rounded-2xl flex items-center justify-center text-ui-muted mb-4"><TrendingUp size={24} /></div>
           <p className="text-ui-muted font-bold text-sm mb-1">Gross Sales</p>
           <h2 className="text-3xl font-bold text-ui-text">₹{totalSalesAmount.toFixed(2)}</h2>
        </div>
        <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm flex flex-col justify-between">
           <div className="w-12 h-12 bg-ui-bg rounded-2xl flex items-center justify-center text-ui-muted mb-4"><ShoppingBag size={24} /></div>
           <p className="text-ui-muted font-bold text-sm mb-1">Total Orders</p>
           <h2 className="text-3xl font-bold text-ui-text">{todaySales.length}</h2>
        </div>
        <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm flex flex-col justify-between">
           <div className="w-12 h-12 bg-ui-bg rounded-2xl flex items-center justify-center text-ui-muted mb-4"><Receipt size={24} /></div>
           <p className="text-ui-muted font-bold text-sm mb-1">Avg Bill Value</p>
           <h2 className="text-3xl font-bold text-ui-text">₹{avgBill}</h2>
        </div>
        <div className="bg-gradient-to-br from-brand-primary to-brand-primary/80 p-6 rounded-3xl border border-brand-primary shadow-lg shadow-brand-primary/20 flex flex-col justify-between text-white">
           <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-4"><ArrowUpRight size={24} /></div>
           <p className="text-white/80 font-bold text-sm mb-1">Est. Net Profit</p>
           <h2 className="text-3xl font-bold">₹{(totalSalesAmount * 0.4).toFixed(2)}</h2>
           <p className="text-xs text-white/60 mt-1 mt-auto">~40% margin assumed</p>
        </div>
      </div>
      
      
      {/* SHIFT CLOSE MODAL */}
      {isDayCloseOpen && (
        <div className="fixed inset-0 bg-ui-bg/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-ui-card border border-ui-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
             <div className="p-6 border-b border-ui-border bg-ui-bg text-center">
                <h2 className="text-2xl font-bold text-ui-text">Shift Close</h2>
                <p className="text-ui-muted text-sm font-medium mt-1">{format(new Date(), 'PPPP')}</p>
             </div>
             
             <div className="p-6 space-y-4 flex-1 overflow-y-auto hide-scrollbar">
               {dayCloseStep === 1 && (
                 <>
                   <div className="bg-ui-bg rounded-2xl p-4 border border-ui-border space-y-2 text-sm font-bold">
                     <div className="flex justify-between"><span className="text-ui-muted">Cash Sales</span><span className="text-ui-text">₹{totalCashCollected.toFixed(2)}</span></div>
                     <div className="flex justify-between"><span className="text-ui-muted">UPI Sales</span><span className="text-ui-text">₹{totalUpiCollected.toFixed(2)}</span></div>
                     <div className="flex justify-between"><span className="text-ui-muted">Card Sales</span><span className="text-ui-text">₹{totalCardCollected.toFixed(2)}</span></div>
                     <div className="w-full h-px bg-ui-border my-2"></div>
                     <div className="flex justify-between"><span className="text-ui-muted">Cash Expenses</span><span className="text-brand-danger">- ₹{cashExpenses.toFixed(2)}</span></div>
                     <div className="flex justify-between"><span className="text-ui-muted">Other Expenses</span><span className="text-brand-danger">- ₹{otherExpenses.toFixed(2)}</span></div>
                   </div>
                   
                   <div className="bg-brand-accent/10 border border-brand-accent/20 rounded-2xl p-4 text-center mb-4">
                     <p className="text-brand-accent text-sm font-bold mb-1">Blind Cash Count</p>
                     <p className="text-xs text-brand-accent/80 font-medium">Please count your drawer and enter the exact physical cash below.</p>
                   </div>
                   
                   <div>
                     <label className="text-sm font-bold text-ui-muted mb-2 block">Actual Physical Cash</label>
                     <input type="number" value={closingCash} onChange={e=>setClosingCash(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-lg text-center" placeholder="Enter total physical cash..." autoFocus/>
                   </div>
                 </>
               )}

               {dayCloseStep === 2 && (
                 <div className="space-y-4">
                   <div className="bg-ui-bg rounded-2xl p-4 border border-ui-border space-y-3 text-sm font-bold">
                     <h3 className="text-brand-primary text-center mb-2">Verification Report</h3>
                     <div className="flex justify-between"><span className="text-ui-muted">Expected System Cash</span><span className="text-ui-text">₹{expectedCashInDrawer.toFixed(2)}</span></div>
                     <div className="flex justify-between"><span className="text-ui-muted">Actual Physical Cash</span><span className="text-ui-text">₹{parseFloat(closingCash || 0).toFixed(2)}</span></div>
                     <div className="w-full h-px bg-ui-border my-2"></div>
                     <div className="flex justify-between text-lg">
                       <span className="text-ui-muted">Variance</span>
                       <span className={(parseFloat(closingCash || 0) - expectedCashInDrawer) >= 0 ? "text-brand-accent" : "text-brand-danger"}>
                         {(parseFloat(closingCash || 0) - expectedCashInDrawer) >= 0 ? '+' : ''}₹{(parseFloat(closingCash || 0) - expectedCashInDrawer).toFixed(2)}
                       </span>
                     </div>
                   </div>
                   
                   <div>
                     <label className="text-sm font-bold text-ui-muted mb-2 block">Shift Remarks (Optional)</label>
                     <textarea value={closingRemarks} onChange={e=>setClosingRemarks(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-sm resize-none h-24" placeholder="Explain any variance or leave a note..."></textarea>
                   </div>
                 </div>
               )}
             </div>
             
             <div className="p-6 bg-ui-bg border-t border-ui-border flex gap-4 shrink-0">
               {dayCloseStep === 1 ? (
                 <>
                   <button onClick={()=>{setIsDayCloseOpen(false); setClosingCash('');}} className="flex-1 p-4 rounded-2xl font-bold bg-ui-card border border-ui-border hover:bg-ui-bg transition-all">Cancel</button>
                   <button onClick={()=>setDayCloseStep(2)} disabled={!closingCash} className="flex-1 p-4 rounded-2xl font-bold bg-brand-primary text-white hover:bg-brand-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50">Verify Count</button>
                 </>
               ) : (
                 <>
                   <button onClick={()=>setDayCloseStep(1)} className="flex-1 p-4 rounded-2xl font-bold bg-ui-card border border-ui-border hover:bg-ui-bg transition-all">Back</button>
                   <button onClick={handleDayClose} className="flex-1 p-4 rounded-2xl font-bold bg-brand-warning text-white hover:bg-brand-warning/90 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"><Printer size={18}/> Print & End</button>
                 </>
               )}
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* RECENT ORDERS */}
        <div className="lg:col-span-2 bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-ui-text">Recent Orders</h2>
            <Link to="/orders" className="text-brand-primary font-bold text-sm hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {todaySales.slice(0,5).map(sale => (
              <div key={sale.id} className="bg-ui-bg p-4 rounded-2xl border border-ui-border shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs", sale.paymentMode === 'UPI' ? 'bg-brand-primary/10 text-brand-primary' : sale.paymentMode === 'CASH' ? 'bg-brand-accent/10 text-brand-accent' : sale.paymentMode === 'SPLIT' ? 'bg-brand-warning/10 text-brand-warning' : 'bg-ui-card text-ui-text border border-ui-border')}>
                    {sale.paymentMode}
                  </div>
                  <div>
                    <h3 className="font-bold text-ui-text">Order #{sale.id}</h3>
                    <p className="text-ui-muted text-xs font-medium mt-0.5">{format(new Date(sale.date), 'p')} • {sale.items.length} items</p>
                  </div>
                </div>
                <div className="font-bold text-ui-text text-lg">
                  ₹{sale.total.toFixed(2)}
                </div>
              </div>
            ))}
            {todaySales.length === 0 && <div className="text-center py-4 text-ui-muted font-medium">No sales today yet.</div>}
          </div>
        </div>
        
        {/* WIDGETS RIGHT COLUMN */}
        <div className="space-y-6">
          
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg font-bold text-ui-text flex items-center gap-2"><AlertTriangle size={18} className="text-brand-danger"/> Low Stock</h2>
               <Link to="/inventory" className="text-brand-primary font-bold text-sm hover:underline">Manage</Link>
             </div>
             <div className="space-y-2">
               {lowStockItems.length === 0 && <p className="text-ui-muted text-sm font-medium">All stock levels good.</p>}
               {lowStockItems.slice(0,4).map(item => (
                 <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-ui-bg rounded-lg border border-ui-border">
                   <span className="font-bold text-ui-text">{item.name}</span>
                   <span className="font-bold text-brand-danger bg-brand-danger/10 px-2 py-0.5 rounded">{item.currentStock} {item.unit}</span>
                 </div>
               ))}
             </div>
          </div>

          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
             <h2 className="text-lg font-bold text-ui-text mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-brand-accent"/> Top Sellers</h2>
             <div className="space-y-3">
               {topItems.length === 0 && <p className="text-ui-muted text-sm font-medium">No data yet.</p>}
               {topItems.map((item, idx) => (
                 <div key={item[0]} className="flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2">
                     <span className="text-ui-muted font-bold text-xs">{idx+1}.</span>
                     <span className="font-bold text-ui-text">{item[0]}</span>
                   </div>
                   <span className="font-bold text-ui-muted">{item[1]} sold</span>
                 </div>
               ))}
             </div>
          </div>

          {pendingSuppliers.length > 0 && (
            <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-bold text-ui-text flex items-center gap-2"><Truck size={18} className="text-brand-warning"/> Pending Dues</h2>
                 <Link to="/purchase" className="text-brand-primary font-bold text-sm hover:underline">Pay</Link>
               </div>
               <div className="space-y-2">
                 {pendingSuppliers.slice(0,3).map(sup => (
                   <div key={sup.id} className="flex justify-between items-center text-sm p-2 bg-ui-bg rounded-lg border border-ui-border">
                     <span className="font-bold text-ui-text">{sup.name}</span>
                     <span className="font-bold text-brand-warning">₹{sup.balance}</span>
                   </div>
                 ))}
               </div>
            </div>
          )}

          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg font-bold text-ui-text flex items-center gap-2">👨‍💼 Staff Today</h2>
               <Link to="/employees" className="text-brand-primary font-bold text-sm hover:underline">Manage</Link>
             </div>
             <p className="text-sm font-medium text-ui-muted mb-2">Check staff attendance and manage payroll.</p>
             <Link to="/employees" className="block w-full text-center bg-ui-bg border border-ui-border p-3 rounded-xl font-bold text-ui-text hover:bg-ui-border transition-colors">
               Go to Staff Management
             </Link>
          </div>

        </div>
      </div>
    

      {/* SHIFT MODALS */}
      {showStartShift && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-ui-card w-full max-w-sm p-6 rounded-3xl shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-ui-text">Start Shift</h2>
            <form onSubmit={handleStartShift} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Opening Cash (₹)</label>
                <input type="number" required autoFocus value={openingCash} onChange={e=>setOpeningCash(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowStartShift(false)} className="flex-1 p-4 rounded-2xl font-bold bg-ui-bg text-ui-text hover:bg-ui-border transition-colors">Cancel</button>
                <button type="submit" className="flex-1 p-4 rounded-2xl font-bold bg-brand-primary text-white shadow-md">Start</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEndShift && activeShift && (() => {
        const expected = calculateExpectedCash();
        const diff = (parseFloat(actualCash)||0) - expected;
        const color = Math.abs(diff) === 0 ? 'text-green-500' : Math.abs(diff) < 50 ? 'text-orange-500' : 'text-red-500';
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-ui-card w-full max-w-sm p-6 rounded-3xl shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-ui-text">End Shift</h2>
              <div className="bg-ui-bg p-4 rounded-2xl border border-ui-border mb-4 space-y-2 text-sm font-medium">
                <div className="flex justify-between text-ui-muted"><span>Opening Cash:</span><span>₹{activeShift.openingCash}</span></div>
                {user?.role === 'owner' ? <div className="flex justify-between text-ui-text font-bold"><span>Expected Cash:</span><span>₹{expected}</span></div> : <div className="flex justify-between text-brand-primary font-bold"><span>Expected Cash:</span><span>HIDDEN (Blind Close)</span></div>}
              </div>
              <form onSubmit={handleEndShift} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Actual Cash Counted (₹)</label>
                  <input type="number" required autoFocus value={actualCash} onChange={e=>setActualCash(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text text-xl" />
                </div>
                {actualCash !== '' && user?.role === 'owner' && (
                  <div className={`flex justify-between font-bold ${color}`}>
                    <span>Difference:</span>
                    <span>{diff > 0 ? '+' : ''}₹{diff.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowEndShift(false)} className="flex-1 p-4 rounded-2xl font-bold bg-ui-bg text-ui-text hover:bg-ui-border transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 p-4 rounded-2xl font-bold bg-brand-danger text-white shadow-md">Close Shift</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

</div>
  );
}
