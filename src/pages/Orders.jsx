import React, { useState } from 'react';
import { useLiveQuery } from '../db/db';
import { db, hashPin, logInventoryMovement } from '../db/db';
import { exportToCSV, printReportPDF } from '../utils/exportUtils';
import { printOrderReceipt } from '../utils/printUtils';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Search, Download, ReceiptText, Printer, RotateCcw, Play, Copy } from 'lucide-react';
import { format } from 'date-fns';

export default function Orders() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const [dateFilter, setDateFilter] = useState('TODAY');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  
  const canEdit = user?.role === 'owner' || user?.permissions?.includes('orders_edit');
  const canDelete = user?.role === 'owner' || user?.permissions?.includes('orders_void');
  const canRefund = user?.role === 'owner' || user?.permissions?.includes('billing_refund');

  
  const sales = useLiveQuery(() => db.sales.reverse().limit(1000).toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const profileSettings = useLiveQuery(() => db.settings.get('profile')) || {};
  const printBasic = useLiveQuery(() => db.settings.get('print')) || {};
  const printAdvanced = useLiveQuery(() => db.settings.get('printAdvanced')) || {};
  const printSettings = printAdvanced.data || printBasic;

  const clearCart = useCartStore(state => state.clearCart);
  const addItem = useCartStore(state => state.addItem);
  const updateQty = useCartStore(state => state.updateQty);
  const setCustomer = useCartStore(state => state.setCustomer);
  const setDiscount = useCartStore(state => state.setDiscount);

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
    
    let matchesOwner = true;
    if (user?.role !== 'owner') {
      matchesOwner = (s.createdBy === user?.name);
    }
    
    return matchesSearch && matchesFilter && matchesDate && matchesOwner;
  });

  const printReceipt = (order, cName) => { 
    try {
      printOrderReceipt(order, cName, printSettings, profileSettings); 
    } catch(e) {
      alert("Print Error: " + e.message);
      console.error(e);
    }
  };

  

  const handleRefund = async (order, c) => {
    if (user?.role === 'cashier') {
      const pin = window.prompt("Admin/Owner Password required to process returns:");
      if (!pin) return;
      const hashed = await hashPin(pin);
      const admin = await db.users.where('pin').equals(hashed).first();
      if (!admin || admin.role !== 'owner') {
        alert("Invalid Admin Password. Refund aborted.");
        return;
      }
    }

    if (!window.confirm(`Are you sure you want to refund Invoice ${order.invoiceNumber || order.id}?`)) return;
    
    // Reverse Inventory
    const recipes = await db.recipes.toArray();
    for (let cartItem of order.items) {
      const itemRecipe = recipes.find(r => String(r.itemId) === String(cartItem.id) && r.ingredients?.length > 0) || recipes.find(r => String(r.itemId) === String(cartItem.id));
      if (itemRecipe) {
        for (let ing of itemRecipe.ingredients) {
          const addition = (ing.qty * cartItem.qty);
          await logInventoryMovement(ing.inventoryId, addition, 'SALE_REVERSAL', order.id, `Refund ${cartItem.qty}x ${cartItem.name}`);
        }
      }
    }

    // Revoke Loyalty
    if (c) {
      const loyaltySettings = await db.settings.get('loyalty') || { earnRatio: 100 };
      const pointsEarned = Math.floor(order.total / loyaltySettings.earnRatio);
      await db.customers.update(c.id, { loyaltyPoints: Math.max(0, c.loyaltyPoints - pointsEarned) });
    }

    await db.sales.update(order.id, { status: 'RETURNED' });
    await db.audit_logs.add({
        user: user?.name || 'Cashier',
        timestamp: new Date().toISOString(),
        action: 'REFUND_BILL',
        refId: order.invoiceNumber || order.id,
        oldValue: 'PAID',
        newValue: 'RETURNED',
        reason: 'Manual refund from Orders page'
    });
    alert('Order successfully refunded and inventory reversed.');
  };

  const repopulateCart = async (order, c) => {
    clearCart();
    const dbItems = await db.items.toArray();
    
    for (let item of order.items) {
      const masterItem = dbItems.find(i => i.id === item.id);
      let currentPrice = item.sellingPrice;
      
      if (masterItem) {
        // Try to find if it was a variant
        if (masterItem.variants && masterItem.variants.length > 0) {
          const variant = masterItem.variants.find(v => item.name.includes(v.name));
          if (variant) currentPrice = variant.price;
          else currentPrice = masterItem.sellingPrice;
        } else {
          currentPrice = masterItem.sellingPrice;
        }
      }
      
      addItem({ ...item, sellingPrice: currentPrice });
      updateQty(item.cartId || (item.id + '-' + item.name), item.qty);
    }
    if (c) setCustomer(c);
  };

  const handleEdit = async (order, c) => {
    if (!window.confirm(`Are you sure you want to EDIT this order? It will be voided and returned to the cart.`)) return;
    
    // Reverse Inventory correctly using logInventoryMovement
    const recipes = await db.recipes.toArray();
    for (let cartItem of order.items) {
      const itemRecipe = recipes.find(r => String(r.itemId) === String(cartItem.id) && r.ingredients?.length > 0) || recipes.find(r => String(r.itemId) === String(cartItem.id));
      if (itemRecipe) {
        for (let ing of itemRecipe.ingredients) {
          const addition = (ing.qty * cartItem.qty);
          await logInventoryMovement(ing.inventoryId, addition, 'SALE_REVERSAL', order.id, `Edit void ${cartItem.qty}x ${cartItem.name}`);
        }
      }
    }
    // Revoke Loyalty
    if (c && order.status === 'PAID') {
      const loyaltySettings = await db.settings.get('loyalty') || { earnRatio: 100 };
      const pointsEarned = Math.floor(order.total / loyaltySettings.earnRatio);
      await db.customers.update(c.id, { loyaltyPoints: Math.max(0, c.loyaltyPoints - pointsEarned) });
    }

    await repopulateCart(order, c);
    if (order.discount > 0) setDiscount(0, order.discount);
    await db.audit_logs.add({
        user: user?.name || 'Cashier',
        timestamp: new Date().toISOString(),
        action: 'VOID_BILL',
        refId: order.invoiceNumber || order.id,
        oldValue: order.total,
        newValue: 0,
        reason: 'Bill edited and voided back to cart'
    });
    await db.sales.delete(order.id);
    navigate('/billing');
  };

  const handleDelete = async (order, c) => {
    if (!window.confirm(`Are you sure you want to completely DELETE this order?`)) return;
    
    // Reverse Inventory
    const recipes = await db.recipes.toArray();
    for (let cartItem of order.items) {
      const itemRecipe = recipes.find(r => String(r.itemId) === String(cartItem.id));
      if (itemRecipe) {
        for (let ing of itemRecipe.ingredients) {
          const inv = await db.inventory.get(ing.inventoryId);
          if (inv) await db.inventory.update(ing.inventoryId, { currentStock: inv.currentStock + (ing.qty * cartItem.qty) });
        }
      }
    }
    // Revoke Loyalty
    if (c && order.status === 'PAID') {
      const loyaltySettings = await db.settings.get('loyalty') || { earnRatio: 100 };
      const pointsEarned = Math.floor(order.total / loyaltySettings.earnRatio);
      await db.customers.update(c.id, { loyaltyPoints: Math.max(0, c.loyaltyPoints - pointsEarned) });
    }

    await db.sales.delete(order.id);
  };

  // True Hold Recall: Pushes order back to cart and deletes the hold record
  const handleRecall = async (order, c) => {
    await repopulateCart(order, c);
    if (order.discount > 0) setDiscount(0, order.discount); // Apply as flat discount
    await db.sales.delete(order.id); // Remove from HOLD
    navigate('/billing');
  };

  // Duplicate Order: Pushes order back to cart without deleting original
  const handleDuplicate = async (order, c) => {
    await repopulateCart(order, c);
    navigate('/billing');
  };

  const handleExportCSV = () => {
    const headers = ['Invoice', 'Date', 'Customer', 'Created By', 'Item Name', 'Quantity', 'Total Amount', 'Status', 'Payment Mode'];
    const rows = filteredSales.map(o => {
      const c = customers.find(x => x.id === o.customerId);
      const cName = c ? c.name : 'Walk-in Customer';
      const itemNames = o.items.map(i => i.name).join('\n');
      const itemQtys = o.items.map(i => i.qty).join('\n');
      return [
        o.invoiceNumber || `Order #${o.id}`,
        new Date(o.date).toLocaleString('en-IN'),
        cName,
        o.createdBy || 'Unknown',
        itemNames,
        itemQtys,
        o.total,
        o.status,
        o.paymentMode
      ];
    });
    exportToCSV(`Orders_${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
  };

  const handlePrintPDF = () => {
    try {
      const headers = ['Invoice', 'Date', 'Customer', 'Created By', 'Items', 'Total Amount', 'Status', 'Payment Mode'];
      const rows = filteredSales.map(o => {
        const c = customers.find(x => x.id === o.customerId);
        const cName = c ? c.name : 'Walk-in Customer';
        const itemsStr = o.items.map(i => `${i.qty}x ${i.name}`).join('<br/>');
        return [
          o.invoiceNumber || `Order #${o.id}`,
          new Date(o.date).toLocaleString('en-IN'),
          cName,
          o.createdBy || 'Unknown',
          itemsStr,
          `Rs. ${o.total}`,
          o.status,
          o.paymentMode
        ];
      });
      printReportPDF('Orders Ledger Report', headers, rows);
    } catch(e) {
      alert("Ledger Print Error: " + e.message);
      console.error(e);
    }
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
      
      <div className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div className="relative w-full md:max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ui-muted" />
          <input type="text" placeholder="Search by Invoice # or Customer..." className="w-full pl-11 p-4 rounded-2xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-medium text-ui-text shadow-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        
        <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm w-full md:w-auto">
          {['ALL', 'PAID', 'HOLD', 'RETURNED'].map(f => (
             <button key={f} className={clsx("flex-1 md:px-6 py-2 font-bold rounded-xl transition-all text-sm", filter === f ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        
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

      </div>

      <div className="flex-1 overflow-y-auto space-y-4 hide-scrollbar">
        {filteredSales.length === 0 && <div className="text-ui-muted text-center py-10 bg-ui-card rounded-3xl border border-ui-border border-dashed font-medium">No orders found matching criteria.</div>}
        
        {filteredSales.map(order => {
          const c = customers.find(c => c.id === order.customerId);
          const cName = c ? c.name : 'Walk-in Customer';
          return (
            <div key={order.id} className="bg-ui-card rounded-3xl p-5 md:p-6 border border-ui-border shadow-sm hover:shadow-md transition-shadow flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", order.status === 'PAID' ? 'bg-brand-primary/10 text-brand-primary' : order.status === 'HOLD' ? 'bg-brand-warning/10 text-brand-warning' : 'bg-brand-danger/10 text-brand-danger')}>
                  <ReceiptText size={28}/>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-ui-text text-lg">{order.invoiceNumber || `Order #${order.id}`}</h3>
                    <span className={clsx("text-xs font-bold px-2 py-1 rounded-md", order.status === 'PAID' ? 'bg-brand-primary/10 text-brand-primary' : order.status === 'HOLD' ? 'bg-brand-warning/10 text-brand-warning' : 'bg-brand-danger/10 text-brand-danger')}>{order.status}</span>
                  </div>
                  <p className="text-ui-muted text-sm font-medium">{format(new Date(order.date), 'dd MMM yyyy, p')} • {cName} • By: {order.createdBy || 'Unknown'}</p>
                  <p className="text-ui-muted text-xs font-medium mt-1.5 flex flex-wrap gap-1">
                    {order.items.map(i => <span key={i.id + i.name} className="bg-ui-bg px-2 py-0.5 rounded-md border border-ui-border">{i.qty}x {i.name}</span>)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between xl:justify-end gap-6 w-full xl:w-auto shrink-0 border-t xl:border-t-0 border-ui-border pt-4 xl:pt-0">
                <div className="text-left xl:text-right">
                  <p className="text-xs text-ui-muted font-bold mb-1">Total Amount</p>
                  <div className="font-bold text-ui-text text-xl">₹{order.total.toFixed(2)}</div>
                  {order.paymentMode && <p className="text-[10px] text-brand-primary font-bold bg-brand-primary/10 inline-block px-1.5 py-0.5 rounded mt-1">{order.paymentMode}</p>}
                </div>
                
                <div className="flex flex-wrap gap-2 justify-end">
                  {order.status === 'HOLD' && (
                     <button onClick={() => handleRecall(order, c)} className="bg-brand-warning text-white p-3 rounded-xl font-bold flex flex-col items-center justify-center shadow-md active:scale-95 transition-all w-16 h-16"><Play size={20} className="mb-1"/><span className="text-[10px]">Recall</span></button>
                  )}
                  
                  {order.status === 'PAID' && (
                     <>
                       <button onClick={() => printReceipt(order, cName)} className="bg-brand-primary text-white p-3 rounded-xl font-bold flex flex-col items-center justify-center shadow-md active:scale-95 transition-all w-16 h-16"><Printer size={20} className="mb-1"/><span className="text-[10px]">Print</span></button>
                       <button onClick={() => handleDuplicate(order, c)} className="bg-ui-text text-ui-bg p-3 rounded-xl font-bold flex flex-col items-center justify-center shadow-md active:scale-95 transition-all w-16 h-16"><Copy size={20} className="mb-1"/><span className="text-[10px]">Repeat</span></button>
                       {canRefund && <button onClick={() => handleRefund(order, c)} className="bg-brand-danger/10 text-brand-danger hover:bg-brand-danger hover:text-white p-3 rounded-xl font-bold flex flex-col items-center justify-center shadow-sm active:scale-95 transition-all w-16 h-16"><RotateCcw size={20} className="mb-1"/><span className="text-[10px]">Refund</span></button>}
                     </>
                  )}
                  
                  {user?.role === 'owner' && (
                     <>
                       {canEdit && <button onClick={() => handleEdit(order, c)} className="bg-ui-bg text-ui-text border border-ui-border hover:bg-ui-border p-3 rounded-xl font-bold flex flex-col items-center justify-center shadow-sm active:scale-95 transition-all w-16 h-16"><span className="text-[10px]">Edit</span></button>}
                       {canDelete && <button onClick={() => handleDelete(order, c)} className="bg-brand-danger text-white p-3 rounded-xl font-bold flex flex-col items-center justify-center shadow-md active:scale-95 transition-all w-16 h-16"><span className="text-[10px]">Void</span></button>}
                     </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
