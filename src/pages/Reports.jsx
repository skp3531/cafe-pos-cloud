import React, { useState, useMemo } from 'react';
import { useLiveQuery } from '../db/db';
import { db } from '../db/db';
import clsx from 'clsx';
import { useAuthStore } from '../store/useAuthStore';
import { FileText, Download, Printer, TrendingUp, DollarSign, PieChart, ShoppingBag, TrendingDown, Star, Clock, AlertTriangle, CreditCard, Banknote, Smartphone, IndianRupee, RefreshCcw, Package, Users } from 'lucide-react';

export default function Reports() {
  const allSales = useLiveQuery(() => db.sales.toArray()) || [];
  const allExpenses = useLiveQuery(() => db.expenses.toArray()) || [];
  const allPurchases = useLiveQuery(() => db.purchases?.toArray()) || [];

  const [dateFilter, setDateFilter] = useState('today'); // today, yesterday, week, month, custom
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const user = useAuthStore(state => state.user);
  const [activeTab, setActiveTab] = useState('sales'); // sales, purchases, items, returns
  
  const sales = useLiveQuery(() => db.sales.toArray()) || [];
  const purchases = useLiveQuery(() => db.purchases.toArray()) || [];
  const items = useLiveQuery(() => db.items.toArray()) || [];
  const dayClosings = useLiveQuery(() => db.day_closing.toArray()) || [];
  const shifts = useLiveQuery(() => db.shifts.toArray()) || [];
  const auditLogs = useLiveQuery(() => db.audit_logs.toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];
  const inventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const recipes = useLiveQuery(() => db.recipes.toArray()) || [];

  // Date Filtering Logic
  const getDateRange = () => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    
    if (dateFilter === 'today') {
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
    } else if (dateFilter === 'yesterday') {
      start.setDate(now.getDate() - 1);
      start.setHours(0,0,0,0);
      end.setDate(now.getDate() - 1);
      end.setHours(23,59,59,999);
    } else if (dateFilter === 'week') {
      start.setDate(now.getDate() - 7);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
    } else if (dateFilter === 'month') {
      start.setMonth(now.getMonth() - 1);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
    } else if (dateFilter === 'custom' && customStart && customEnd) {
      return { 
        sDate: new Date(customStart).toISOString(), 
        eDate: new Date(customEnd + 'T23:59:59').toISOString() 
      };
    }
    return { sDate: start.toISOString(), eDate: end.toISOString() };
  };

  const { sDate, eDate } = getDateRange();

  // Processed Data
  const filteredSales = sales.filter(s => s.status === 'PAID' && s.date >= sDate && s.date <= eDate);
  const filteredReturns = sales.filter(s => s.status === 'RETURNED' && s.date >= sDate && s.date <= eDate);
  const filteredPurchases = purchases.filter(p => p.date >= sDate && p.date <= eDate);
  const filteredShiftsData = shifts.filter(s => s.startTime >= sDate && s.startTime <= eDate);

  const totalSales = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalPurchases = filteredPurchases.reduce((acc, p) => acc + (parseFloat(p.totalAmount) || 0), 0);
  
  const itemWiseData = useMemo(() => {
    const itemMap = {};
    filteredSales.forEach(sale => {
      (sale.items || []).forEach(cartItem => {
        if (!itemMap[cartItem.name]) {
          itemMap[cartItem.name] = { name: cartItem.name, qty: 0, revenue: 0 };
        }
        itemMap[cartItem.name].qty += cartItem.qty;
        itemMap[cartItem.name].revenue += (cartItem.sellingPrice * cartItem.qty);
      });
    });
    return Object.values(itemMap).sort((a,b) => b.qty - a.qty);
  }, [filteredSales]);

  const recipeData = useMemo(() => {
    // 1. Calculate how many of each menu item was sold
    const itemSales = {};
    filteredSales.forEach(sale => {
      (sale.items || []).forEach(cartItem => {
        itemSales[cartItem.id] = (itemSales[cartItem.id] || 0) + cartItem.qty;
      });
    });

    // 2. Generate report lines per recipe
    const res = [];
    recipes.forEach(r => {
      const menuItem = items.find(i => i.id === parseInt(r.itemId));
      if (!menuItem) return;
      
      let recipeCost = 0;
      r.ingredients.forEach(ing => {
        const inv = inventory.find(i => i.id === ing.inventoryId);
        if (inv) recipeCost += (inv.costPerBaseUnit || 0) * ing.qty;
      });

      const qtySold = itemSales[menuItem.id] || 0;
      const sp = menuItem.sellingPrice || 0;
      const gp = sp - recipeCost;
      const gm = sp > 0 ? (gp / sp) * 100 : 0;

      res.push({
        name: menuItem.name,
        sp,
        recipeCost,
        gp,
        gm,
        qtySold
      });
    });
    return res.sort((a,b) => b.qtySold - a.qtySold);
  }, [filteredSales, recipes, items, inventory]);

  // Exports
  const downloadCSV = (headers, rows, filename) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredShifts = dayClosings.filter(d => {
    if (d.date >= sDate && d.date <= eDate) return true;
    return false;
  }).sort((a,b) => new Date(b.date) - new Date(a.date));
  
  
  const staffActivity = useMemo(() => {
    const map = {};
    users.forEach(u => map[u.name] = { name: u.name, role: u.role, loginTime: '-', bills: 0, revenue: 0, returns: 0, cashSale: 0, upiSale: 0, openingCash: 0, actualCash: 0 });
    
    filteredSales.forEach(s => {
      const creator = s.createdBy || 'Owner';
      if (!map[creator]) map[creator] = { name: creator, role: 'Cashier', loginTime: '-', bills: 0, revenue: 0, returns: 0, cashSale: 0, upiSale: 0, openingCash: 0, actualCash: 0 };
      if (s.status === 'PAID') {
        map[creator].bills += 1;
        map[creator].revenue += (parseFloat(s.total) || 0);
        if (s.paymentMode === 'CASH') map[creator].cashSale += (parseFloat(s.total) || 0);
        if (s.paymentMode === 'UPI') map[creator].upiSale += (parseFloat(s.total) || 0);
        if (s.paymentMode === 'SPLIT') {
           map[creator].cashSale += (s.splitDetails?.cash || 0);
           map[creator].upiSale += (s.splitDetails?.upi || 0);
        }
      } else if (s.status === 'RETURNED') {
        map[creator].returns += 1;
      }
    });

    filteredShiftsData.forEach(s => {
      const starter = s.startedBy || 'Unknown';
      if (!map[starter]) map[starter] = { name: starter, role: 'Cashier', loginTime: '-', bills: 0, revenue: 0, returns: 0, cashSale: 0, upiSale: 0, openingCash: 0, actualCash: 0 };
      map[starter].openingCash += (parseFloat(s.openingCash) || 0);
      map[starter].actualCash += (parseFloat(s.closingCash) || 0);
    });

    auditLogs.forEach(log => {
      if (log.action === 'LOGIN' && log.timestamp >= sDate && log.timestamp <= eDate) {
        const creator = log.userName;
        if (!map[creator]) map[creator] = { name: creator, role: 'Unknown', loginTime: '-', bills: 0, revenue: 0, returns: 0, cashSale: 0, upiSale: 0, openingCash: 0, actualCash: 0 };
        if (map[creator].loginTime === '-') {
          map[creator].loginTime = new Date(log.timestamp).toLocaleTimeString('en-IN');
        }
      }
    });

    return Object.values(map);
  }, [users, filteredSales, filteredShiftsData, auditLogs, sDate, eDate]);

  const exportCurrentTab = () => {
    if (activeTab === 'sales') {
      const headers = ["Invoice Number", "Date", "Customer ID", "Payment Mode", "Total Amount"];
      const rows = filteredSales.map(s => [s.invoiceNumber || s.id, new Date(s.date).toLocaleString(), s.customerId || 'Walk-in', s.paymentMode, (s.total || 0).toFixed(2)]);
      downloadCSV(headers, rows, `Sales_Report_${dateFilter}`);
    } else if (activeTab === 'purchases') {
      const headers = ["Date", "Supplier ID", "Payment Mode", "Total Amount"];
      const rows = filteredPurchases.map(p => [new Date(p.date).toLocaleString(), p.supplierId, p.paymentMode, (p.totalAmount || 0).toFixed(2)]);
      downloadCSV(headers, rows, `Purchase_Report_${dateFilter}`);
    } else if (activeTab === 'items') {
      const headers = ["Item Name", "Quantity Sold", "Revenue Generated"];
      const rows = itemWiseData.map(i => [i.name, i.qty, (i.revenue || 0).toFixed(2)]);
      downloadCSV(headers, rows, `ItemWise_Report_${dateFilter}`);
    } else if (activeTab === 'returns') {
      const headers = ["Invoice Number", "Return Date", "Original Total"];
      const rows = filteredReturns.map(r => [r.invoiceNumber || r.id, new Date(r.date).toLocaleString(), (r.total || 0).toFixed(2)]);
      downloadCSV(headers, rows, `Returns_Report_${dateFilter}`);
    
    } else if (activeTab === 'staff') {
      const headers = ["Staff Name", "Role", "Latest Login", "Bills Handled", "Revenue", "Returns Processed"];
      const rows = staffActivity.map(s => [s.name, s.role, s.loginTime, s.bills, (s.revenue || 0).toFixed(2), s.returns]);
      downloadCSV(headers, rows, `Staff_Activity_${dateFilter}`);
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
      downloadCSV(headers, rows, `Z_Reports_${dateFilter}`);
    } else if (activeTab === 'recipes') {
      const headers = ["Item Name", "Selling Price", "Recipe Cost", "Gross Profit", "Margin %", "Qty Sold"];
      const rows = recipeData.map(r => [r.name, r.sp.toFixed(2), r.recipeCost.toFixed(2), r.gp.toFixed(2), r.gm.toFixed(2), r.qtySold]);
      downloadCSV(headers, rows, `Recipe_Costing_${dateFilter}`);
    } else if (activeTab === 'audit') {
      const headers = ["Timestamp", "User", "Action", "Reference ID", "Old Value", "New Value", "Reason"];
      const logs = auditLogs.filter(a => a.timestamp >= sDate && a.timestamp <= eDate).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
      const rows = logs.map(a => [new Date(a.timestamp).toLocaleString(), a.user, a.action, a.refId, a.oldValue, a.newValue, a.reason]);
      downloadCSV(headers, rows, `Audit_Logs_${dateFilter}`);
    }
  };

  const printCurrentTab = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-[1400px] mx-auto pb-24 md:pb-6 overflow-hidden">
      <h1 className="text-2xl font-bold text-ui-text tracking-tight mb-4 shrink-0 print:hidden">Reports</h1>
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
      
            {/* Report Tabs (Vertical Navigation) */}
      <div className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto hide-scrollbar pb-2 md:pb-0 pr-0 md:pr-2 bg-transparent print:hidden">
        {[
            {id: 'sales', label: 'Sales', perm: 'reports_sales'}, 
            {id: 'purchases', label: 'Purchases', perm: 'reports_inventory'}, 
            {id: 'items', label: 'Items', perm: 'reports_items'}, 
            {id: 'recipes', label: 'Recipes Costing', perm: 'reports_items'}, 
            {id: 'returns', label: 'Returns', perm: 'reports_sales'}, 
            {id: 'shifts', label: 'Z-Reports', perm: 'reports_sales'}, 
            {id: 'staff', label: 'Staff Activity', perm: 'reports_attendance'},
            {id: 'audit', label: 'Security & Audit', perm: 'reports_audit'}
          ].filter(t => user?.role === 'owner' || user?.permissions?.includes(t.perm)).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx("px-4 py-3 font-bold rounded-xl transition-all whitespace-nowrap text-left", activeTab === tab.id ? 'bg-brand-primary/10 text-brand-primary' : 'text-ui-muted hover:bg-ui-card hover:text-ui-text')}>{tab.label}</button>
        ))}
      </div>
      
      {/* Content wrapper */}
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-10 w-full h-full flex flex-col min-w-0">

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 shrink-0 print:hidden gap-4">
        {/* Date Filters (Second Level) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm overflow-x-auto hide-scrollbar">
            {['today', 'yesterday', 'week', 'month', 'custom'].map(f => (
              <button key={f} className={clsx("px-4 py-2 font-bold rounded-xl transition-all capitalize whitespace-nowrap", dateFilter === f ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setDateFilter(f)}>{f}</button>
            ))}
          </div>
          
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm">
              <input type="date" className="p-2 bg-transparent text-ui-text font-medium outline-none text-sm" value={customStart} onChange={e=>setCustomStart(e.target.value)} />
              <span className="text-ui-muted">to</span>
              <input type="date" className="p-2 bg-transparent text-ui-text font-medium outline-none text-sm" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} />
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button onClick={exportCurrentTab} className="bg-ui-card text-ui-text border border-ui-border px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-ui-border transition-colors"><Download size={16}/> CSV</button>
          <button onClick={printCurrentTab} className="bg-brand-primary text-white px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"><Printer size={16}/> Print / PDF</button>
        </div>
      </div>

      {/* Dynamic Overview Cards based on Tab */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 shrink-0">
        {activeTab === 'sales' && (
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 text-ui-muted mb-2 font-bold text-sm uppercase tracking-wider"><TrendingUp size={18}/> Total Sales</div>
            <div className="text-3xl font-black text-ui-text">₹{(totalSales || 0).toFixed(2)}</div>
          </div>
        )}
        {activeTab === 'purchases' && (
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 text-ui-muted mb-2 font-bold text-sm uppercase tracking-wider"><IndianRupee size={18}/> Total Purchases</div>
            <div className="text-3xl font-black text-ui-text">₹{(totalPurchases || 0).toFixed(2)}</div>
          </div>
        )}
        {activeTab === 'returns' && (
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 text-ui-muted mb-2 font-bold text-sm uppercase tracking-wider"><RefreshCcw size={18}/> Total Returns</div>
            <div className="text-3xl font-black text-brand-danger">{filteredReturns.length} Bills</div>
          </div>
        )}
        {activeTab === 'items' && (
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 text-ui-muted mb-2 font-bold text-sm uppercase tracking-wider"><Package size={18}/> Total Units Sold</div>
            <div className="text-3xl font-black text-brand-primary">{itemWiseData.reduce((acc, i) => acc + i.qty, 0)} Units</div>
          </div>
        )}
      </div>

      {/* Printable Report Title */}
      <div className="hidden print:block mb-6 text-center">
        <h2 className="text-2xl font-bold uppercase">{activeTab} Report</h2>
        <p className="text-sm font-medium mt-1 text-gray-500">Period: {new Date(sDate).toLocaleDateString()} to {new Date(eDate).toLocaleDateString()}</p>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-10">
        <div className="bg-ui-card border border-ui-border rounded-3xl overflow-hidden shadow-sm">
          
          {activeTab === 'sales' && (
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-ui-bg text-ui-muted text-xs uppercase tracking-wider"><th className="p-4 font-bold">Invoice #</th><th className="p-4 font-bold">Date & Time</th><th className="p-4 font-bold">Payment</th><th className="p-4 font-bold text-right">Total</th></tr></thead>
              <tbody className="divide-y divide-ui-border text-sm font-medium text-ui-text">
                {filteredSales.map(s => (
                  <tr key={s.id} className="hover:bg-ui-bg transition-colors">
                    <td className="p-4 font-bold">{s.invoiceNumber || s.id}</td>
                    <td className="p-4">{new Date(s.date).toLocaleString('en-IN')}</td>
                    <td className="p-4"><span className="bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-md text-xs font-bold">{s.paymentMode}</span></td>
                    <td className="p-4 text-right font-bold text-base">₹{(s.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {filteredSales.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-ui-muted">No sales found for this period.</td></tr>}
              </tbody>
            </table>
          )}

          {activeTab === 'purchases' && (
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-ui-bg text-ui-muted text-xs uppercase tracking-wider"><th className="p-4 font-bold">Date</th><th className="p-4 font-bold">Supplier ID</th><th className="p-4 font-bold">Payment Mode</th><th className="p-4 font-bold text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-ui-border text-sm font-medium text-ui-text">
                {filteredPurchases.map(p => (
                  <tr key={p.id} className="hover:bg-ui-bg transition-colors">
                    <td className="p-4">{new Date(p.date).toLocaleString('en-IN')}</td>
                    <td className="p-4 font-bold">#{p.supplierId}</td>
                    <td className="p-4"><span className="bg-brand-accent/10 text-brand-accent px-2 py-1 rounded-md text-xs font-bold uppercase">{p.paymentMode}</span></td>
                    <td className="p-4 text-right font-bold text-base">₹{(p.totalAmount || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {filteredPurchases.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-ui-muted">No purchases found for this period.</td></tr>}
              </tbody>
            </table>
          )}

          {activeTab === 'items' && (
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-ui-bg text-ui-muted text-xs uppercase tracking-wider"><th className="p-4 font-bold">Item Name</th><th className="p-4 font-bold text-center">Qty Sold</th><th className="p-4 font-bold text-right">Revenue</th></tr></thead>
              <tbody className="divide-y divide-ui-border text-sm font-medium text-ui-text">
                {itemWiseData.map((item, i) => (
                  <tr key={i} className="hover:bg-ui-bg transition-colors">
                    <td className="p-4 font-bold">{item.name}</td>
                    <td className="p-4 text-center font-black text-brand-primary">{item.qty}</td>
                    <td className="p-4 text-right font-bold text-base">₹{(item.revenue || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {itemWiseData.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-ui-muted">No item sales found for this period.</td></tr>}
              </tbody>
            </table>
          )}

          {activeTab === 'returns' && (
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-ui-bg text-ui-muted text-xs uppercase tracking-wider"><th className="p-4 font-bold">Invoice #</th><th className="p-4 font-bold">Return Date</th><th className="p-4 font-bold text-right">Refunded Total</th></tr></thead>
              <tbody className="divide-y divide-ui-border text-sm font-medium text-ui-text">
                {filteredReturns.map(r => (
                  <tr key={r.id} className="hover:bg-ui-bg transition-colors">
                    <td className="p-4 font-bold text-brand-danger">{r.invoiceNumber || r.id}</td>
                    <td className="p-4">{new Date(r.date).toLocaleString('en-IN')}</td>
                    <td className="p-4 text-right font-bold text-base">₹{(r.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {filteredReturns.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-ui-muted">No returned bills found for this period.</td></tr>}
              </tbody>
            </table>
          )}

          {activeTab === 'recipes' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ui-bg text-ui-muted text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Item Name</th>
                  <th className="p-4 font-bold text-right">Selling Price</th>
                  <th className="p-4 font-bold text-right">Recipe Cost</th>
                  <th className="p-4 font-bold text-right">Gross Profit</th>
                  <th className="p-4 font-bold text-center">Margin %</th>
                  <th className="p-4 font-bold text-center">Qty Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-border text-sm font-medium text-ui-text">
                {recipeData.map((r, i) => (
                  <tr key={i} className="hover:bg-ui-bg transition-colors">
                    <td className="p-4 font-bold">{r.name}</td>
                    <td className="p-4 text-right">₹{r.sp.toFixed(2)}</td>
                    <td className="p-4 text-right text-brand-danger">₹{r.recipeCost.toFixed(2)}</td>
                    <td className="p-4 text-right font-black text-brand-accent">₹{r.gp.toFixed(2)}</td>
                    <td className="p-4 text-center font-bold text-brand-primary">{r.gm.toFixed(2)}%</td>
                    <td className="p-4 text-center font-black">{r.qtySold}</td>
                  </tr>
                ))}
                {recipeData.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-ui-muted">No recipe data available.</td></tr>}
              </tbody>
            </table>
          )}

          
        {activeTab === 'staff' && (
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 text-ui-muted mb-2 font-bold text-sm uppercase tracking-wider"><Users size={18}/> Active Staff</div>
            <div className="text-3xl font-black text-brand-primary">{staffActivity.filter(s => s.bills > 0 || s.loginTime !== '-').length} Staff</div>
          </div>
        )}
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

          {activeTab === 'staff' && (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead><tr className="bg-ui-bg text-ui-muted text-xs uppercase tracking-wider"><th className="p-4 font-bold">Staff Name</th><th className="p-4 font-bold text-center">First Login</th><th className="p-4 font-bold text-center">Bills Handled</th><th className="p-4 font-bold text-right text-brand-primary">Cash Sale</th><th className="p-4 font-bold text-right text-brand-accent">UPI Sale</th><th className="p-4 font-bold text-right">Opening Cash</th><th className="p-4 font-bold text-right">Actual Cash</th><th className="p-4 font-bold text-right">Total Revenue</th></tr></thead>
              <tbody className="divide-y divide-ui-border text-sm font-medium text-ui-text">
                {staffActivity.map((s, idx) => (
                  <tr key={idx} className="hover:bg-ui-bg transition-colors">
                    <td className="p-4">
                      <div className="font-bold">{s.name}</div>
                      <div className="text-xs text-ui-muted uppercase">{s.role}</div>
                    </td>
                    <td className="p-4 text-center">{s.loginTime}</td>
                    <td className="p-4 text-center font-black text-ui-text">{s.bills}</td>
                    <td className="p-4 text-right font-bold text-brand-primary">₹{(s.cashSale || 0).toFixed(2)}</td>
                    <td className="p-4 text-right font-bold text-brand-accent">₹{(s.upiSale || 0).toFixed(2)}</td>
                    <td className="p-4 text-right text-ui-muted">₹{(s.openingCash || 0).toFixed(2)}</td>
                    <td className="p-4 text-right font-bold text-ui-text">₹{(s.actualCash || 0).toFixed(2)}</td>
                    <td className="p-4 text-right font-black text-brand-primary">₹{(s.revenue || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {staffActivity.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-ui-muted font-bold">No staff activity found.</td></tr>}
              </tbody>
            </table>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead><tr className="bg-ui-bg text-ui-muted text-xs uppercase tracking-wider"><th className="p-4 font-bold">Timestamp</th><th className="p-4 font-bold">User</th><th className="p-4 font-bold">Action</th><th className="p-4 font-bold">Ref ID</th><th className="p-4 font-bold">Changes</th><th className="p-4 font-bold">Reason</th></tr></thead>
              <tbody className="divide-y divide-ui-border text-sm font-medium text-ui-text">
                {(() => {
                  const logs = auditLogs.filter(a => a.timestamp >= sDate && a.timestamp <= eDate).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
                  if (logs.length === 0) return <tr><td colSpan="6" className="p-8 text-center text-ui-muted font-bold">No audit logs found for this period.</td></tr>;
                  return logs.map((a, idx) => (
                    <tr key={idx} className="hover:bg-ui-bg transition-colors">
                      <td className="p-4 text-xs font-bold text-ui-muted">{new Date(a.timestamp).toLocaleString('en-IN')}</td>
                      <td className="p-4 font-bold">{a.user}</td>
                      <td className="p-4"><span className="bg-ui-bg border border-ui-border px-2 py-1 rounded text-xs font-bold">{a.action}</span></td>
                      <td className="p-4 text-brand-accent font-bold text-xs">{a.refId || '-'}</td>
                      <td className="p-4 text-xs"><span className="text-ui-muted line-through mr-1">{a.oldValue}</span> <span className="text-brand-primary font-bold">{a.newValue}</span></td>
                      <td className="p-4 text-xs font-medium text-ui-muted whitespace-pre-wrap max-w-xs truncate" title={a.reason}>{a.reason}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
            </div>
          )}

        </div>
            </div>
    </div>
    </div></div>
  );
}
