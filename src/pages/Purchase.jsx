import React, { useState } from 'react';
import { useLiveQuery } from '../db/db';
import { db } from '../db/db';
import { exportToCSV, printReportPDF } from '../utils/exportUtils';
import { useAuthStore } from '../store/useAuthStore';
import clsx from 'clsx';
import { Plus, Building2, Download, Printer, Receipt, ArrowUpRight, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

export default function Purchase() {
  const [activeTab, setActiveTab] = useState('entry');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isSupModalOpen, setIsSupModalOpen] = useState(false);
  
  // Supplier State
  const [supName, setSupName] = useState('');
  const [supMobile, setSupMobile] = useState('');
  
  // Purchase State
  const [selectedSupId, setSelectedSupId] = useState('');
  const [selectedInvId, setSelectedInvId] = useState('');
  const [qty, setQty] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [dateFilter, setDateFilter] = useState('TODAY');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [expandedPurchaseId, setExpandedPurchaseId] = useState(null);
  const [purchaseItems, setPurchaseItems] = useState([]);

  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  const inventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const purchases = useLiveQuery(() => db.purchases.orderBy('date').reverse().toArray()) || [];

  const user = useAuthStore(state => state.user);
  const canAdd = user?.role === 'owner' || user?.permissions?.includes('purchases_create');
  const canEdit = user?.role === 'owner' || user?.permissions?.includes('purchase_edit');
  const canDelete = user?.role === 'owner' || user?.permissions?.includes('purchase_delete');


  
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


  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!supName) return;
    await db.suppliers.add({ name: supName, mobile: supMobile, outstandingBalance: 0 });
    setSupName(''); setSupMobile(''); setIsSupModalOpen(false);
  };

  const selectedInvItem = inventory.find(i => i.id === parseInt(selectedInvId));
  const unitLabel = selectedInvItem ? selectedInvItem.unit : 'units';
  
  const handleAddItemToPurchase = (e) => {
    e.preventDefault();
    if (!selectedInvId || !qty) return;
    const iId = parseInt(selectedInvId);
    const invItem = inventory.find(i => i.id === iId);
    setPurchaseItems([...purchaseItems, { 
      inventoryId: iId, 
      qty: parseFloat(qty), 
      multiplier: 1,
      invName: invItem?.name,
      unit: invItem?.unit || 'unit'
    }]);
    setSelectedInvId('');
    setQty('');
      };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    if (!selectedSupId) {
      alert("Please select a Supplier. If you don't have one, please create one first.");
      return;
    }
    if (purchaseItems.length === 0) {
      alert("Please add at least one material to the bill by clicking '+ Add Item'.");
      return;
    }
    if (!amount) {
      alert("Please enter the Total Bill Amount.");
      return;
    }
    const sId = parseInt(selectedSupId);
    const amt = parseFloat(amount);
    
    await db.purchases.add({
      supplierId: sId,
      date: new Date(purchaseDate).toISOString(),
      items: purchaseItems.map(pi => ({ inventoryId: pi.inventoryId, qty: pi.qty, multiplier: pi.multiplier })),
      totalAmount: amt,
      paymentMode: paymentMode,
      paidAmount: paymentMode !== 'credit' ? amt : 0,
      createdBy: user?.name || 'Unknown'
    });
    
    for (let pi of purchaseItems) {
      const inv = await db.inventory.get(pi.inventoryId);
      if (inv) {
        await db.inventory.update(pi.inventoryId, { currentStock: inv.currentStock + (pi.qty * pi.multiplier) });
      }
    }
    
    if (paymentMode === 'credit') {
      const sup = await db.suppliers.get(sId);
      await db.suppliers.update(sId, { outstandingBalance: (sup.outstandingBalance || 0) + amt });
    } else {
      const sup = await db.suppliers.get(sId);
      await db.expenses.add({
        date: new Date().toISOString(),
        category: 'Purchases',
        amount: amt,
        description: `Purchase from ${sup ? sup.name : 'Supplier'}`
      });
    }
    
    setPurchaseItems([]); setSelectedSupId(''); setAmount(''); setPaymentMode('cash'); setIsEntryModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Supplier', 'Created By', 'Item Name', 'Quantity', 'Total Amount', 'Payment Mode'];
    const rows = filteredPurchases.map(p => {
      const sup = suppliers.find(s => s.id === p.supplierId);
      const itemNames = p.items.map(i => { const inv = inventory.find(x => x.id === i.inventoryId); return inv ? inv.name : 'Item'; }).join('\n');
      const itemQtys = p.items.map(i => i.qty).join('\n');
      return [
        new Date(p.date).toLocaleString('en-IN'),
        sup ? sup.name : 'Unknown',
        p.createdBy || 'Unknown',
        itemNames,
        itemQtys,
        p.totalAmount,
        p.paymentMode || 'CASH'
      ];
    });
    exportToCSV(`Purchases_${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
  };

  const handlePrintPDF = () => {
    const headers = ['Date', 'Supplier', 'Created By', 'Items', 'Total Amount', 'Payment Mode'];
    const rows = filteredPurchases.map(p => {
      const sup = suppliers.find(s => s.id === p.supplierId);
      const itemsStr = p.items.map(i => { const inv = inventory.find(x => x.id === i.inventoryId); return `${i.qty}x ${inv ? inv.name : 'Item'}`; }).join('<br/>');
      return [
        new Date(p.date).toLocaleString('en-IN'),
        sup ? sup.name : 'Unknown',
        p.createdBy || 'Unknown',
        itemsStr,
        `Rs. ${p.totalAmount}`,
        p.paymentMode || 'CASH'
      ];
    });
    printReportPDF('Purchase History Report', headers, rows);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8 overflow-hidden">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <h1 className="text-3xl font-bold text-ui-text tracking-tight">Purchase & Suppliers</h1>
        {activeTab === 'entry' && (
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="bg-ui-card text-ui-text px-4 py-2 rounded-xl font-bold border border-ui-border hover:bg-ui-bg flex items-center gap-2 transition-all shadow-sm"><Download size={18}/> CSV</button>
            <button onClick={handlePrintPDF} className="bg-ui-card text-ui-text px-4 py-2 rounded-xl font-bold border border-ui-border hover:bg-ui-bg flex items-center gap-2 transition-all shadow-sm"><Printer size={18}/> Print</button>
          </div>
        )}
      </div>
      
      <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border mb-8 max-w-md shadow-sm shrink-0">
        <button className={clsx("flex-1 py-2 font-bold rounded-xl transition-all", activeTab === 'entry' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('entry')}>Purchase Entry</button>
        <button className={clsx("flex-1 py-2 font-bold rounded-xl transition-all", activeTab === 'suppliers' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('suppliers')}>Suppliers</button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-10">

      {activeTab === 'suppliers' && (
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-ui-text">Suppliers Directory</h2>
            {canAdd && <button onClick={() => setIsSupModalOpen(true)} className="bg-brand-primary text-white px-5 py-2.5 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all whitespace-nowrap">+ Add Supplier</button>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 h-fit">
            {suppliers.map(s => (
              <div key={s.id} className="bg-ui-card p-5 rounded-3xl border border-ui-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-ui-bg rounded-2xl flex items-center justify-center text-brand-primary"><Building2 size={24}/></div>
                <div className="flex-1">
                  <h3 className="font-bold text-ui-text">{s.name}</h3>
                  <p className="text-ui-muted text-sm font-medium mt-1">{s.mobile || 'No mobile'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ui-muted font-bold mb-1">To Pay</p>
                  <div className="font-bold text-brand-danger">₹{s.outstandingBalance || 0}</div>
                </div>
              </div>
            ))}
          </div>
          
          {isSupModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-ui-card w-full max-w-sm rounded-3xl border border-ui-border shadow-2xl flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-ui-border shrink-0">
                  <h2 className="text-xl font-bold text-ui-text">New Supplier</h2>
                  <button onClick={() => setIsSupModalOpen(false)} className="text-ui-muted hover:text-ui-text p-1 bg-ui-bg rounded-lg"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto">
            <form onSubmit={handleAddSupplier} className="space-y-4">
              <input type="text" placeholder="Supplier Name" required value={supName} onChange={e => setSupName(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
              <input type="tel" placeholder="Mobile Number" value={supMobile} onChange={e => setSupMobile(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
              <button type="submit" className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all mt-4">Save Supplier</button>
            </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'entry' && (
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-ui-text">Purchase History</h2>
            {canAdd && <button onClick={() => setIsEntryModalOpen(true)} className="bg-brand-primary text-white px-5 py-2.5 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all whitespace-nowrap">+ Purchase Entry</button>}
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
          {isEntryModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-ui-card w-full max-w-lg rounded-3xl border border-ui-border shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-ui-border shrink-0">
                  <h2 className="text-xl font-bold text-ui-text">Purchase Entry</h2>
                  <button onClick={() => { setIsEntryModalOpen(false); setPurchaseItems([]); }} className="text-ui-muted hover:text-ui-text p-1 bg-ui-bg rounded-lg"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto hide-scrollbar space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-ui-muted mb-2">Supplier</label>
                      <select value={selectedSupId} onChange={e => setSelectedSupId(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium">
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="border border-ui-border p-4 rounded-2xl bg-ui-bg/50">
                      <form onSubmit={handleAddItemToPurchase} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-ui-muted mb-2">Add Material to Bill</label>
                          <select required value={selectedInvId} onChange={e => setSelectedInvId(e.target.value)} className="w-full p-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium">
                            <option value="">Select Material</option>
                            {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-ui-muted mb-2">Qty {selectedInvId && `(${unitLabel})`}</label>
                          <input type="number" step="0.01" required value={qty} onChange={e => setQty(e.target.value)} className="w-full p-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                        </div>
                        <button type="submit" className="w-full bg-ui-border text-ui-text p-3 rounded-xl font-bold hover:bg-ui-muted/20 transition-all text-sm">+ Add Item</button>
                      </form>
                    </div>

                    {purchaseItems.length > 0 && (
                      <div className="space-y-2">
                        {purchaseItems.map((pi, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-ui-bg border border-ui-border p-3 rounded-xl">
                            <div>
                              <div className="font-bold text-ui-text text-sm">{pi.invName}</div>
                              <div className="text-xs text-ui-muted">{pi.qty} {pi.unit}</div>
                            </div>
                            <button onClick={() => setPurchaseItems(purchaseItems.filter((_, i) => i !== idx))} className="text-ui-muted hover:text-brand-danger p-1"><X size={16}/></button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ui-border">
                      <div>
                        <label className="block text-sm font-semibold text-ui-muted mb-2">Purchase Date</label>
                        <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-ui-muted mb-2">Total Bill Amount</label>
                        <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-ui-muted mb-2">Payment Terms</label>
                        <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium">
                          <option value="cash">Paid in Cash</option>
                          <option value="drawer">Paid from Drawer (Cash)</option>
                          <option value="upi">Paid via UPI</option>
                          <option value="credit">Buy on Credit</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-ui-border bg-ui-bg shrink-0 rounded-b-3xl">
                  <button onClick={handleAddPurchase} className={clsx("w-full text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2", (purchaseItems.length === 0 || !amount || !selectedSupId) ? 'bg-brand-primary/50' : 'bg-brand-primary')}>
                    <Plus size={20}/> Record Purchase
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="w-full">
            
            <div className="space-y-4">
              {filteredPurchases.length === 0 && <div className="text-ui-muted text-center py-10 bg-ui-card rounded-3xl border border-ui-border border-dashed font-medium">No purchases recorded yet.</div>}
              {filteredPurchases.map(p => {
                const sup = suppliers.find(s => s.id === p.supplierId);
                const isPending = p.totalAmount > p.paidAmount;
                const isExpanded = expandedPurchaseId === p.id;
                return (
                  <div key={p.id} className="bg-ui-card rounded-3xl border border-ui-border shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={() => setExpandedPurchaseId(isExpanded ? null : p.id)}>
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-ui-bg rounded-2xl flex items-center justify-center text-ui-muted"><Receipt size={24}/></div>
                        <div>
                          <h3 className="font-bold text-ui-text">{sup ? sup.name : 'Unknown Supplier'}</h3>
                          <p className="text-ui-muted text-sm font-medium mt-1">{format(new Date(p.date), 'dd MMM yyyy, p')} • By: {p.createdBy || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-6 bg-ui-bg p-3 rounded-2xl border border-ui-border">
                          <div className="text-center">
                            <div className="text-xs text-ui-muted font-bold">Total</div>
                            <div className="font-bold text-ui-text">₹{p.totalAmount}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-ui-muted font-bold">Paid</div>
                            <div className="font-bold text-brand-accent">₹{p.paidAmount}</div>
                          </div>
                          {isPending && (
                            <div className="text-center">
                              <div className="text-xs text-brand-danger font-bold">Due</div>
                              <div className="font-bold text-brand-danger">₹{p.totalAmount - p.paidAmount}</div>
                            </div>
                          )}
                        </div>
                        <div className="text-ui-muted hidden sm:block">
                          {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-ui-border bg-ui-bg/50">
                        <h4 className="font-bold text-ui-text text-sm mb-3">Items Purchased:</h4>
                        <div className="space-y-2">
                          {(p.items || []).map((item, idx) => {
                            const invItem = inventory.find(i => i.id === item.inventoryId);
                            return (
                              <div key={idx} className="flex justify-between items-center bg-ui-card p-3 rounded-xl border border-ui-border shadow-sm">
                                <span className="font-bold text-ui-text text-sm">{invItem ? invItem.name : 'Unknown Item'}</span>
                                <span className="text-ui-muted text-sm font-medium">{item.qty * (item.multiplier || 1)} {invItem?.unit || 'unit'}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
