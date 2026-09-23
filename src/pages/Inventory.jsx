import React, { useState } from 'react';
import { useLiveQuery } from '../db/db';
import { db } from '../db/db';
import clsx from 'clsx';
import { Plus, Minus, AlertTriangle, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('stock');
  const [newItemName, setNewItemName] = useState('');
  const [minStock, setMinStock] = useState('');
  const [unit, setUnit] = useState('L');
  
  const [auditQuantities, setAuditQuantities] = useState({});
  const user = useAuthStore(state => state.user);
  const canEdit = user?.role === 'owner' || user?.permissions?.includes('inventory_edit');
  const canAdd = user?.role === 'owner' || user?.permissions?.includes('inventory_add');
  const canAdjust = user?.role === 'owner' || user?.permissions?.includes('inventory_adjust');

  const inventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const audits = useLiveQuery(() => db.stock_audits?.reverse().toArray()) || [];

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !minStock || !unit) return;
    await db.inventory.add({ name: newItemName, currentStock: 0, minStock: parseFloat(minStock), unit });
    setNewItemName(''); setMinStock(''); setUnit('L');
  };

  const updateStock = async (id, delta) => {
    const item = await db.inventory.get(id);
    await db.inventory.update(id, { currentStock: Math.max(0, item.currentStock + delta) });
  };

  const handleAuditChange = (id, val) => {
    setAuditQuantities(prev => ({ ...prev, [id]: val }));
  };

  const submitAudit = async () => {
    const entries = [];
    for (let id in auditQuantities) {
      if (auditQuantities[id] !== '') {
        const item = inventory.find(i => i.id === parseInt(id));
        const physical = parseFloat(auditQuantities[id]);
        if (item && item.currentStock !== physical) {
           const variance = physical - item.currentStock;
           entries.push({ inventoryId: item.id, name: item.name, system: item.currentStock, physical, variance, unit: item.unit });
           await db.inventory.update(item.id, { currentStock: physical });
        }
      }
    }
    
    if (entries.length > 0) {
       await db.stock_audits.add({ date: new Date().toISOString(), entries });
       alert('Audit recorded and inventory updated!');
    } else {
       alert('No variance found. Inventory is accurate.');
    }
    setAuditQuantities({});
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
      <h1 className="text-3xl font-bold text-ui-text tracking-tight mb-8">Inventory Management</h1>
      
      <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border mb-8 max-w-xl shadow-sm">
        <button className={clsx("flex-1 py-2 font-bold rounded-xl transition-all", activeTab === 'stock' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('stock')}>Live Stock</button>
        <button className={clsx("flex-1 py-2 font-bold rounded-xl transition-all", activeTab === 'wastage' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('wastage')}>Log Wastage</button>
        <button className={clsx("flex-1 py-2 font-bold rounded-xl transition-all", activeTab === 'audit' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('audit')}>Physical Audit</button>
      </div>

      {activeTab === 'stock' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4 h-fit">
            {inventory.map(item => {
              const isLow = item.currentStock <= item.minStock;
              const percent = Math.min(100, Math.max(0, (item.currentStock / (item.minStock * 3)) * 100));
              return (
                <div key={item.id} className="bg-ui-card p-5 rounded-3xl border border-ui-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-ui-text text-lg">{item.name}</h3>
                      {isLow ? (
                        <span className="bg-brand-danger/10 text-brand-danger px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1"><AlertTriangle size={14}/> Low</span>
                      ) : (
                        <span className="bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14}/> Good</span>
                      )}
                    </div>
                    <div className="h-2 w-full bg-ui-bg rounded-full overflow-hidden">
                      <div className={clsx("h-full transition-all rounded-full", isLow ? "bg-brand-danger" : "bg-brand-accent")} style={{ width: `${percent}%` }}></div>
                    </div>
                    <p className="text-ui-muted text-xs font-bold mt-2">Alert at: {item.minStock} {item.unit || 'units'}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-ui-bg p-2 rounded-2xl border border-ui-border shrink-0">
                    <button className="w-10 h-10 rounded-xl bg-ui-card shadow-sm flex items-center justify-center text-ui-muted hover:text-brand-danger active:scale-95 transition-all" onClick={() => updateStock(item.id, -1)}><Minus size={20}/></button>
                    <div className="font-bold text-xl w-16 text-center text-ui-text">{item.currentStock}<span className="text-xs text-ui-muted ml-1">{item.unit||''}</span></div>
                    <button className="w-10 h-10 rounded-xl bg-ui-card shadow-sm flex items-center justify-center text-brand-primary hover:bg-brand-primary/10 active:scale-95 transition-all" onClick={() => updateStock(item.id, 1)}><Plus size={20}/></button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm h-fit sticky top-6">
            <h2 className="text-xl font-bold mb-6 text-ui-text">New Material</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <input type="text" placeholder="Material Name (e.g. Milk)" required value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
              <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="text-sm font-bold text-ui-muted mb-2 block">Min Alert Level</label>
                   <input type="number" required value={minStock} onChange={e => setMinStock(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                 </div>
                 <div className="w-1/3">
                   <label className="text-sm font-bold text-ui-muted mb-2 block">Unit</label>
                   <select required value={unit} onChange={e => setUnit(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-bold">
                     <option value="L">L</option>
                     <option value="ml">ml</option>
                     <option value="Kg">Kg</option>
                     <option value="gm">gm</option>
                     <option value="pcs">pcs</option>
                   </select>
                 </div>
              </div>
              <button type="submit" className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all mt-4 flex justify-center items-center gap-2"><Plus size={20}/> Save Material</button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-ui-text flex items-center gap-2"><ClipboardCheck/> Physical Count</h2>
               <button onClick={submitAudit} className="bg-brand-primary text-white px-6 py-3 rounded-2xl font-bold shadow-sm active:scale-95 transition-all hover:bg-brand-primary/90">Submit Audit</button>
             </div>
             <p className="text-ui-muted text-sm font-medium mb-6">Enter the exact physical quantity you just counted. System will automatically adjust stock and log any variance.</p>
             
             <div className="space-y-3">
               {inventory.map(item => (
                 <div key={item.id} className="flex justify-between items-center p-4 bg-ui-bg rounded-2xl border border-ui-border">
                   <div>
                     <span className="font-bold text-ui-text text-lg block">{item.name}</span>
                     <span className="text-ui-muted text-xs font-bold">System: {item.currentStock} {item.unit}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <input type="number" step="0.01" placeholder="Physical Qty" value={auditQuantities[item.id] || ''} onChange={e => handleAuditChange(item.id, e.target.value)} className="w-24 p-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-center font-bold text-ui-text" />
                     <span className="text-ui-muted font-bold text-sm w-6">{item.unit}</span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
           
           <div className="lg:col-span-1">
             <h2 className="text-xl font-bold mb-6 text-ui-text">Audit History</h2>
             <div className="space-y-4">
               {audits.length === 0 && <div className="text-ui-muted text-center py-10 bg-ui-card rounded-3xl border border-ui-border border-dashed font-medium">No audits recorded.</div>}
               {audits.map(audit => (
                 <div key={audit.id} className="bg-ui-card p-5 rounded-3xl border border-ui-border shadow-sm">
                   <p className="text-ui-text font-bold mb-3">{format(new Date(audit.date), 'dd MMM yyyy, p')}</p>
                   <div className="space-y-2">
                     {audit.entries.map((e, idx) => (
                       <div key={idx} className="flex justify-between items-center text-sm bg-ui-bg p-2 rounded-lg border border-ui-border">
                         <span className="font-medium text-ui-text">{e.name}</span>
                         <span className={clsx("font-bold px-2 py-1 rounded-md", e.variance < 0 ? 'bg-brand-danger/10 text-brand-danger' : 'bg-brand-accent/10 text-brand-accent')}>
                           {e.variance > 0 ? '+' : ''}{e.variance} {e.unit}
                         </span>
                       </div>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      )}

      {activeTab === 'wastage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-ui-text flex items-center gap-2"><AlertTriangle/> Log Wastage / Spoilage</h2>
               <button onClick={async () => {
                 const entries = [];
                 let totalLoss = 0;
                 for (let id in auditQuantities) {
                   if (auditQuantities[id] && parseFloat(auditQuantities[id]) > 0) {
                     const item = inventory.find(i => i.id === parseInt(id));
                     const waste = parseFloat(auditQuantities[id]);
                     if (item && item.currentStock >= waste) {
                        entries.push({ inventoryId: item.id, name: item.name, waste, unit: item.unit });
                        await db.inventory.update(item.id, { currentStock: item.currentStock - waste });
                     }
                   }
                 }
                 if (entries.length > 0) {
                    await db.stock_audits.add({ date: new Date().toISOString(), type: 'WASTAGE', entries });
                    alert('Wastage logged successfully and inventory deducted.');
                    setAuditQuantities({});
                 } else {
                    alert('Please enter valid quantities to waste. (Cannot waste more than current stock)');
                 }
               }} className="bg-brand-danger text-white px-6 py-3 rounded-2xl font-bold shadow-sm active:scale-95 transition-all">Submit Loss</button>
             </div>
             <p className="text-ui-muted text-sm font-medium mb-6">Enter the exact amount wasted (e.g. spilled milk, expired buns). This immediately deducts from current stock.</p>
             
             <div className="space-y-3">
               {inventory.map(item => (
                 <div key={item.id} className="flex justify-between items-center p-4 bg-ui-bg rounded-2xl border border-ui-border">
                   <div>
                     <span className="font-bold text-ui-text text-lg block">{item.name}</span>
                     <span className="text-ui-muted text-xs font-bold">Stock: {item.currentStock} {item.unit}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <input type="number" step="0.01" min="0" max={item.currentStock} placeholder="Loss Qty" value={auditQuantities[item.id] || ''} onChange={e => handleAuditChange(item.id, e.target.value)} className="w-24 p-3 rounded-xl bg-ui-card border border-brand-danger/20 focus:ring-2 focus:ring-brand-danger outline-none text-center font-bold text-ui-text" />
                     <span className="text-ui-muted font-bold text-sm w-6">{item.unit}</span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
