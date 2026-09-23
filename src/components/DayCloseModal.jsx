import React, { useState } from 'react';
import { useLiveQuery } from '../db/db';
import { db } from '../db/db';
import { LockKeyhole, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

export default function DayCloseModal({ isOpen, onClose }) {
  const [closingCash, setClosingCash] = useState('');
  const [dayCloseStep, setDayCloseStep] = useState(1);
  const [closingRemarks, setClosingRemarks] = useState('');
  
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  
  const sales = useLiveQuery(() => db.sales.where('date').aboveOrEqual(todayStart.toISOString()).toArray()) || [];
  const expenses = useLiveQuery(() => db.expenses.where('date').aboveOrEqual(todayStart.toISOString()).toArray()) || [];
  
  const todaySales = sales.filter(s => s.status === 'PAID');
  const totalSalesAmount = todaySales.reduce((acc, curr) => acc + curr.total, 0);
  const cashExpenses = expenses.filter(e => !e.paymentMode || e.paymentMode === 'CASH').reduce((acc, curr) => acc + curr.amount, 0);
  const otherExpenses = expenses.filter(e => e.paymentMode && e.paymentMode !== 'CASH').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = cashExpenses + otherExpenses;
  
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
    
    onClose();
    setDayCloseStep(1);
    setClosingCash('');
    setClosingRemarks('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-ui-card w-full max-w-lg rounded-3xl shadow-2xl border border-ui-border overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 md:p-8 overflow-y-auto">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-brand-danger/10 text-brand-danger rounded-3xl flex items-center justify-center">
              <LockKeyhole size={32}/>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2 text-ui-text">End Shift / Day Close</h2>
          
          {dayCloseStep === 1 ? (
            <div className="space-y-6">
              <p className="text-center text-ui-muted font-medium mb-6">Please count the physical cash in the drawer and enter the total below.</p>
              
              <div>
                <label className="text-xs font-bold text-ui-muted uppercase mb-2 block">Actual Physical Cash</label>
                <input type="number" step="0.01" value={closingCash} onChange={e=>setClosingCash(e.target.value)} className="w-full text-center text-4xl p-6 rounded-3xl bg-ui-bg border border-ui-border focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 outline-none font-bold text-ui-text transition-all" placeholder="₹0.00" autoFocus/>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={onClose} className="flex-1 py-4 font-bold text-ui-muted hover:bg-ui-border rounded-2xl transition-all">Cancel</button>
                <button onClick={() => setDayCloseStep(2)} disabled={!closingCash} className="flex-[2] py-4 bg-brand-primary text-white rounded-2xl font-bold hover:shadow-lg disabled:opacity-50 transition-all">Next Step</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-ui-bg p-6 rounded-3xl border border-ui-border space-y-4">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-ui-muted">Expected Cash</span>
                  <span className="text-ui-text">₹{expectedCashInDrawer.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-ui-muted">Physical Cash Entered</span>
                  <span className="text-ui-text">₹{parseFloat(closingCash || 0).toFixed(2)}</span>
                </div>
                <div className="h-px w-full bg-ui-border border-dashed"></div>
                <div className="flex justify-between items-center text-lg font-black">
                  <span className="text-ui-text">Variance</span>
                  <span className={parseFloat(closingCash || 0) - expectedCashInDrawer < 0 ? 'text-brand-danger' : 'text-brand-primary'}>
                    ₹{(parseFloat(closingCash || 0) - expectedCashInDrawer).toFixed(2)}
                  </span>
                </div>
              </div>

              {(parseFloat(closingCash || 0) - expectedCashInDrawer) !== 0 && (
                <div className="flex items-start gap-3 bg-brand-warning/10 text-brand-warning p-4 rounded-2xl text-sm font-bold">
                  <AlertTriangle size={20} className="shrink-0"/>
                  <p>There is a cash variance. Please double check your drawer or leave a remark below.</p>
                </div>
              )}

              <textarea placeholder="Optional remarks for variance..." value={closingRemarks} onChange={e=>setClosingRemarks(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-medium text-ui-text min-h-[100px]"></textarea>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setDayCloseStep(1)} className="flex-1 py-4 font-bold text-ui-muted hover:bg-ui-border rounded-2xl transition-all">Back</button>
                <button onClick={handleDayClose} className="flex-[2] py-4 bg-brand-danger text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-brand-danger/20 transition-all flex items-center justify-center gap-2">
                  <LockKeyhole size={18}/> Print & Close Shift
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
