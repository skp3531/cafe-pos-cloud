import React, { useState } from 'react';
import { useLiveQuery } from '../db/db';
import { db, logInventoryMovement } from '../db/db';
import clsx from 'clsx';
import { Plus, Minus, AlertTriangle, CheckCircle2, ClipboardCheck, Pencil, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('stock');
  const [activeCatFilter, setActiveCatFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  const [newItemName, setNewItemName] = useState('');
  const [minStock, setMinStock] = useState('');
  const [baseUnit, setBaseUnit] = useState('ml');
  const [purchaseUnit, setPurchaseUnit] = useState('L');
  const [conversionFactor, setConversionFactor] = useState(1000);
  const [costPerBaseUnit, setCostPerBaseUnit] = useState('');
  const [category, setCategory] = useState('');
  
  const [auditQuantities, setAuditQuantities] = useState({});
  const user = useAuthStore(state => state.user);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  const [newCatName, setNewCatName] = useState('');

  const canEdit = user?.role === 'owner' || user?.permissions?.includes('inventory_edit');
  const canAdd = user?.role === 'owner' || user?.permissions?.includes('inventory_add');
  const canAdjust = user?.role === 'owner' || user?.permissions?.includes('inventory_adjust');

  const inventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const audits = useLiveQuery(() => db.stock_audits?.reverse().toArray()) || [];
  const inventoryCategories = useLiveQuery(() => db.inventory_categories?.toArray()) || [];

  const openAddModal = () => {
    setEditingItemId(null);
    setNewItemName('');
    setMinStock('');
    setBaseUnit('ml');
    setPurchaseUnit('L');
    setConversionFactor(1000);
    setCostPerBaseUnit('');
    setCategory(inventoryCategories.length > 0 ? inventoryCategories[0].name : '');
    setIsMaterialModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItemId(item.id);
    setNewItemName(item.name);
    setMinStock(item.minStock);
    setBaseUnit(item.baseUnit || item.unit);
    setPurchaseUnit(item.purchaseUnit || item.baseUnit);
    setConversionFactor(item.conversionFactor || 1);
    setCostPerBaseUnit(item.costPerBaseUnit || 0);
    setCategory(item.category || '');
    setIsMaterialModalOpen(true);
  };

  const handleAddOrUpdateItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !minStock || !baseUnit) return;
    
    if (editingItemId) {
      await db.inventory.update(editingItemId, {
        name: newItemName, 
        category,
        baseUnit,
        purchaseUnit,
        conversionFactor: parseFloat(conversionFactor) || 1,
        costPerBaseUnit: parseFloat(costPerBaseUnit) || 0,
        minStock: parseFloat(minStock), 
        unit: baseUnit
      });
    } else {
      await db.inventory.add({ 
        name: newItemName, 
        category,
        baseUnit,
        purchaseUnit,
        conversionFactor: parseFloat(conversionFactor) || 1,
        costPerBaseUnit: parseFloat(costPerBaseUnit) || 0,
        currentStock: 0, 
        minStock: parseFloat(minStock), 
        unit: baseUnit, 
        active: true,
        createdAt: new Date().toISOString()
      });
    }
    setIsMaterialModalOpen(false);
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this inventory item?")) {
      await db.inventory.delete(id);
    }
  };

  const updateStock = async (id, delta) => {
    await logInventoryMovement(id, delta, 'MANUAL_ADJUSTMENT', null, 'Manual adjustment from Live Stock');
  };

  const handleAuditChange = (id, val) => {
    setAuditQuantities(prev => ({ ...prev, [id]: val }));
  };

  const submitAudit = async () => {
    const entries = [];
    const auditId = 'AUDIT-' + Date.now();
    for (let id in auditQuantities) {
      if (auditQuantities[id] !== '') {
        const item = inventory.find(i => String(i.id) === String(id));
        const physical = parseFloat(auditQuantities[id]);
        if (item && item.currentStock !== physical) {
           const variance = physical - (item.currentStock || 0);
           entries.push({ inventoryId: item.id, name: item.name, system: item.currentStock, physical, variance, unit: item.baseUnit || item.unit });
           await logInventoryMovement(item.id, variance, 'PHYSICAL_AUDIT', auditId, 'Physical audit adjustment');
        }
      }
    }
    
    if (entries.length > 0) {
       await db.stock_audits.add({ id: auditId, date: new Date().toISOString(), entries });
       alert('Audit recorded and inventory updated!');
    } else {
       alert('No variance found. Inventory is accurate.');
    }
    setAuditQuantities({});
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await db.inventory_categories.add({ name: newCatName.trim() });
    setNewCatName('');
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Delete this category? Items will remain but lose this category tag.')) {
      await db.inventory_categories.delete(id);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8 flex flex-col h-full overflow-hidden">
      <h1 className="text-3xl font-bold text-ui-text tracking-tight mb-8 shrink-0">Inventory Management</h1>
      
      <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border mb-6 max-w-2xl shadow-sm shrink-0">
        <button className={clsx("flex-1 py-2 font-bold rounded-xl transition-all", activeTab === 'stock' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('stock')}>Live Stock</button>
        <button className={clsx("flex-1 py-2 font-bold rounded-xl transition-all", activeTab === 'categories' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('categories')}>Categories</button>
        <button className={clsx("flex-1 py-2 font-bold rounded-xl transition-all", activeTab === 'wastage' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('wastage')}>Log Wastage</button>
        <button className={clsx("flex-1 py-2 font-bold rounded-xl transition-all", activeTab === 'audit' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('audit')}>Physical Audit</button>
      </div>

      {activeTab === 'stock' && (
        <div className="w-full flex h-full overflow-hidden">
          <div className="w-32 lg:w-40 flex flex-col gap-2 shrink-0 border-r border-ui-border pr-4 mr-4 overflow-y-auto hide-scrollbar">
            <button className={clsx("px-4 py-3 font-bold rounded-xl text-left transition-all shadow-sm", activeCatFilter === 'all' ? 'bg-brand-primary text-white' : 'bg-ui-card text-ui-muted')} onClick={() => setActiveCatFilter('all')}>All</button>
            <button className={clsx("px-4 py-3 font-bold rounded-xl text-left transition-all shadow-sm", activeCatFilter === 'Low Stock' ? 'bg-brand-danger text-white' : 'bg-ui-card text-ui-muted')} onClick={() => setActiveCatFilter('Low Stock')}>Low Stock</button>
            {inventoryCategories.map(c => (
              <button key={c.id} className={clsx("px-4 py-3 font-bold rounded-xl text-left transition-all shadow-sm", activeCatFilter === c.name ? 'bg-brand-primary text-white' : 'bg-ui-card text-ui-muted')} onClick={() => setActiveCatFilter(c.name)}>{c.name}</button>
            ))}
          </div>

          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-4 gap-4 shrink-0">
              <input type="text" placeholder="Search material..." value={search} onChange={e => setSearch(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-card border border-ui-border outline-none text-ui-text font-medium shadow-sm" />
              {canAdd && <button onClick={openAddModal} className="bg-brand-primary text-white px-5 py-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all whitespace-nowrap">+ Add Material</button>}
            </div>

            <div className="overflow-y-auto pb-20 md:pb-0 hide-scrollbar flex-1 space-y-4">
              {inventory.filter(item => {
                if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
                if (activeCatFilter === 'all') return true;
                if (activeCatFilter === 'Low Stock') return item.currentStock <= item.minStock;
                return item.category === activeCatFilter;
              }).map(item => {
                const isLow = item.currentStock <= item.minStock;
                const percent = Math.min(100, Math.max(0, (item.currentStock / (item.minStock * 3)) * 100));
                return (
                  <div key={item.id} className="bg-ui-card p-5 rounded-3xl border border-ui-border shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative group">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity">
                       {canEdit && <button onClick={() => openEditModal(item)} className="text-ui-muted hover:text-brand-primary p-2 bg-ui-bg rounded-xl shadow-sm"><Pencil size={16}/></button>}
                       {canEdit && <button onClick={() => handleDeleteItem(item.id)} className="text-ui-muted hover:text-brand-danger p-2 bg-ui-bg rounded-xl shadow-sm"><Trash2 size={16}/></button>}
                    </div>

                    <div className="flex-1 pr-16 xl:pr-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-ui-text text-lg">{item.name}</h3>
                        {isLow ? (
                          <span className="bg-brand-danger/10 text-brand-danger px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1"><AlertTriangle size={14}/> Low</span>
                        ) : (
                          <span className="bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14}/> Good</span>
                        )}
                      </div>
                      <div className="h-2 w-full max-w-sm bg-ui-bg rounded-full overflow-hidden mb-2">
                        <div className={clsx("h-full transition-all rounded-full", isLow ? "bg-brand-danger" : "bg-brand-accent")} style={{ width: `${percent}%` }}></div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs font-bold text-ui-muted">
                        <span>Cat: <span className="text-ui-text">{item.category || 'Uncategorized'}</span></span>
                        <span>Alert: <span className="text-ui-text">{item.minStock} {item.baseUnit || item.unit}</span></span>
                        <span>Cost: <span className="text-ui-text">₹{item.costPerBaseUnit || 0} / {item.baseUnit || item.unit}</span></span>
                        <span>Value: <span className="text-ui-text">₹{((item.currentStock || 0) * (item.costPerBaseUnit || 0)).toFixed(2)}</span></span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-start gap-4 bg-ui-bg p-2 rounded-2xl border border-ui-border shrink-0 mt-2 xl:mt-0 w-fit">
                      <button className="w-10 h-10 rounded-xl bg-ui-card shadow-sm flex items-center justify-center text-ui-muted hover:text-brand-danger active:scale-95 transition-all" onClick={() => updateStock(item.id, -1)}><Minus size={20}/></button>
                      <div className="font-bold text-xl w-16 text-center text-ui-text">{item.currentStock?.toFixed(2)}<span className="text-xs text-ui-muted ml-1">{item.baseUnit || item.unit||''}</span></div>
                      <button className="w-10 h-10 rounded-xl bg-ui-card shadow-sm flex items-center justify-center text-brand-primary hover:bg-brand-primary/10 active:scale-95 transition-all" onClick={() => updateStock(item.id, 1)}><Plus size={20}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="max-w-xl">
           <form onSubmit={handleAddCategory} className="flex gap-4 mb-8">
             <input type="text" placeholder="New Category Name" required value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1 p-4 rounded-2xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
             <button type="submit" className="bg-brand-primary text-white px-6 py-4 rounded-2xl font-bold shadow-sm active:scale-95 transition-all whitespace-nowrap">Add Category</button>
           </form>

           <div className="space-y-3">
             {inventoryCategories.length === 0 && <p className="text-ui-muted font-medium">No inventory categories yet.</p>}
             {inventoryCategories.map(cat => (
               <div key={cat.id} className="flex justify-between items-center bg-ui-card p-4 rounded-2xl border border-ui-border shadow-sm">
                 <span className="font-bold text-ui-text">{cat.name}</span>
                 <button onClick={() => handleDeleteCategory(cat.id)} className="text-ui-muted hover:text-brand-danger transition-colors p-2 bg-ui-bg rounded-xl shadow-sm"><Trash2 size={16}/></button>
               </div>
             ))}
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
                     <span className="text-ui-muted text-xs font-bold">System: {item.currentStock} {item.baseUnit || item.unit}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <input type="number" step="0.01" placeholder="Physical Qty" value={auditQuantities[item.id] || ''} onChange={e => handleAuditChange(item.id, e.target.value)} className="w-24 p-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-center font-bold text-ui-text" />
                     <span className="text-ui-muted font-bold text-sm w-6">{item.baseUnit || item.unit}</span>
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
                 const auditId = 'WASTE-' + Date.now();
                 for (let id in auditQuantities) {
                   if (auditQuantities[id] && parseFloat(auditQuantities[id]) > 0) {
                     const item = inventory.find(i => String(i.id) === String(id));
                     const waste = parseFloat(auditQuantities[id]);
                     if (item && item.currentStock >= waste) {
                        entries.push({ inventoryId: item.id, name: item.name, waste, unit: item.baseUnit || item.unit });
                        await logInventoryMovement(item.id, -waste, 'WASTAGE', auditId, 'Wastage reported from Inventory UI');
                     }
                   }
                 }
                 if (entries.length > 0) {
                    await db.stock_audits.add({ id: auditId, date: new Date().toISOString(), type: 'WASTAGE', entries });
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
                     <span className="text-ui-muted text-xs font-bold">Stock: {item.currentStock} {item.baseUnit || item.unit}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <input type="number" step="0.01" min="0" max={item.currentStock} placeholder="Loss Qty" value={auditQuantities[item.id] || ''} onChange={e => handleAuditChange(item.id, e.target.value)} className="w-24 p-3 rounded-xl bg-ui-card border border-brand-danger/20 focus:ring-2 focus:ring-brand-danger outline-none text-center font-bold text-ui-text" />
                     <span className="text-ui-muted font-bold text-sm w-6">{item.baseUnit || item.unit}</span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      )}

      {isMaterialModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ui-card w-full max-w-lg rounded-3xl border border-ui-border shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-ui-border shrink-0">
              <h2 className="text-2xl font-bold text-ui-text">{editingItemId ? 'Edit Material' : 'New Material'}</h2>
              <button onClick={() => setIsMaterialModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ui-bg text-ui-muted transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto hide-scrollbar">
              <form onSubmit={handleAddOrUpdateItem} className="space-y-4">
                <input type="text" placeholder="Material Name (e.g. Milk)" required value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-ui-muted">Category</label>
                  <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-bold">
                    <option value="">Select Category</option>
                    {inventoryCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex gap-4">
                   <div className="flex-1">
                     <label className="text-sm font-bold text-ui-muted mb-2 block">Base Unit (Recipe)</label>
                     <select required value={baseUnit} onChange={e => setBaseUnit(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-bold">
                       <option value="ml">ml</option>
                       <option value="g">g</option>
                       <option value="pcs">pcs</option>
                     </select>
                   </div>
                   <div className="flex-1">
                     <label className="text-sm font-bold text-ui-muted mb-2 block">Min Alert Level</label>
                     <input type="number" required value={minStock} onChange={e => setMinStock(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                   </div>
                </div>

                <div className="flex gap-4">
                   <div className="flex-1">
                     <label className="text-sm font-bold text-ui-muted mb-2 block">Purchase Unit</label>
                     <select required value={purchaseUnit} onChange={e => setPurchaseUnit(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-bold">
                       <option value="L">L</option>
                       <option value="kg">kg</option>
                       <option value="ml">ml</option>
                       <option value="g">g</option>
                       <option value="pcs">pcs</option>
                       <option value="box">box</option>
                     </select>
                   </div>
                   <div className="flex-1">
                     <label className="text-sm font-bold text-ui-muted mb-2 block">Conv. Factor</label>
                     <input type="number" required value={conversionFactor} onChange={e => setConversionFactor(e.target.value)} placeholder="e.g. 1000" className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                   </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-ui-muted">Cost per Base Unit (₹)</label>
                  <input type="number" step="0.001" required value={costPerBaseUnit} onChange={e => setCostPerBaseUnit(e.target.value)} placeholder="e.g. 0.06 for Milk" className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
                </div>

                <button type="submit" className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all mt-4 flex justify-center items-center gap-2">
                  <CheckCircle2 size={20}/> {editingItemId ? 'Update Material' : 'Save Material'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
