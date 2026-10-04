import React, { useState, useRef } from 'react';
import { useLiveQuery } from '../db/db';
import { db } from '../db/db';
import { useAuthStore } from '../store/useAuthStore';
import clsx from 'clsx';
import { Plus, Trash2, ChefHat, ImagePlus, Tag, X, Pencil } from 'lucide-react';

export default function Menu() {
  const [activeTab, setActiveTab] = useState('items');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeCatFilter, setActiveCatFilter] = useState('all');
  const [newItemName, setNewItemName] = useState('');
  const [newCatId, setNewCatId] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newImageBase64, setNewImageBase64] = useState(null);
  const [newVariants, setNewVariants] = useState([]);
  const [variantName, setVariantName] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const imageInputRef = useRef();

  const [editingItemId, setEditingItemId] = useState(null);
  const [editingCatId, setEditingCatId] = useState(null);

  // Recipe State
  const [selectedItemForRecipe, setSelectedItemForRecipe] = useState('');
  const [ingredientId, setIngredientId] = useState('');
  const [ingredientQty, setIngredientQty] = useState('');

  // Category state
  const [newCatName, setNewCatName] = useState('');

  const categories = useLiveQuery(() => db.categories.toArray()) || [];
  const items = useLiveQuery(() => db.items.toArray()) || [];
  const inventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const recipes = useLiveQuery(() => db.recipes.toArray()) || [];

  const user = useAuthStore(state => state.user);
  const canAdd = user?.role === 'owner' || user?.permissions?.includes('menu_add');
  const canEdit = user?.role === 'owner' || user?.permissions?.includes('menu_edit');
  const canDelete = user?.role === 'owner' || user?.permissions?.includes('menu_delete');


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNewImageBase64(ev.target.result);
    reader.readAsDataURL(file);
  };

  const addVariant = () => {
    if (!variantName || !variantPrice) return;
    setNewVariants(prev => [...prev, { name: variantName, price: parseFloat(variantPrice) }]);
    setVariantName(''); setVariantPrice('');
  };

  const handleAddOrUpdateItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !newPrice || !newCatId) return;
    
    if (editingItemId) {
      await db.items.update(editingItemId, {
        name: newItemName,
        categoryId: parseInt(newCatId),
        sellingPrice: parseFloat(newPrice),
        costPrice: parseFloat(newCostPrice || 0),
        imageBase64: newImageBase64 || null,
        variants: newVariants,
      });
      setEditingItemId(null);
    } else {
      await db.items.add({
        name: newItemName,
        categoryId: parseInt(newCatId),
        sellingPrice: parseFloat(newPrice),
        costPrice: parseFloat(newCostPrice || 0),
        status: 'active',
        imageBase64: newImageBase64 || null,
        variants: newVariants,
      });
    }
    resetItemForm();
  };

  const resetItemForm = () => {
    setEditingItemId(null);
    setNewItemName(''); setNewPrice(''); setNewCostPrice(''); setNewCatId('');
    setNewImageBase64(null); setNewVariants([]);
  };

  const startEditItem = (item) => {
    setEditingItemId(item.id); setIsAddModalOpen(true); setIsAddModalOpen(true);
    setNewItemName(item.name);
    setNewCatId(item.categoryId);
    setNewPrice(item.sellingPrice);
    setNewCostPrice(item.costPrice || '');
    setNewImageBase64(item.imageBase64 || null);
    setNewVariants(item.variants || []);
  };

  const handleAddOrUpdateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    if (editingCatId) {
      await db.categories.update(editingCatId, { name: newCatName });
      setEditingCatId(null);
    } else {
      await db.categories.add({ name: newCatName, displayOrder: categories.length + 1 });
    }
    setNewCatName('');
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Delete this item?')) {
      await db.items.delete(id);
      await db.recipes.where('itemId').equals(id).delete();
    }
  };

  const handleDeleteCategory = async (id) => {
    const count = await db.items.where('categoryId').equals(id).count();
    if (count > 0) { alert('Remove all items in this category first.'); return; }
    if (window.confirm('Delete this category?')) await db.categories.delete(id);
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    if (!selectedItemForRecipe || !ingredientId || !ingredientQty) return;
    const itemId = parseInt(selectedItemForRecipe);
    const existingRecipe = await db.recipes.where('itemId').equals(itemId).first();
    const newIngredient = { inventoryId: parseInt(ingredientId), qty: parseFloat(ingredientQty) };
    if (existingRecipe) {
      await db.recipes.update(existingRecipe.id, { ingredients: [...existingRecipe.ingredients, newIngredient] });
    } else {
      await db.recipes.add({ itemId, ingredients: [newIngredient] });
    }
    setIngredientId(''); setIngredientQty('');
  };

  const handleRemoveIngredient = async (recipeId, index) => {
    const recipe = await db.recipes.get(recipeId);
    const newIngredients = [...recipe.ingredients];
    newIngredients.splice(index, 1);
    await db.recipes.update(recipeId, { ingredients: newIngredients });
  };

  const activeRecipe = selectedItemForRecipe ? (
    recipes.find(r => String(r.itemId) === String(selectedItemForRecipe) && r.ingredients?.length > 0) ||
    recipes.find(r => String(r.itemId) === String(selectedItemForRecipe))
  ) : null;

  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8 overflow-hidden">
      <h1 className="text-3xl font-bold text-ui-text tracking-tight mb-8 shrink-0">Menu & Recipes</h1>
      
      <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border mb-8 max-w-xl shadow-sm overflow-x-auto hide-scrollbar shrink-0">
        {['items', 'categories', 'recipes'].map(tab => (
          <button key={tab} className={clsx("flex-1 py-2 font-bold rounded-xl transition-all capitalize whitespace-nowrap px-2", activeTab === tab ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab(tab)}>
            {tab === 'items' ? 'Menu Items' : tab === 'categories' ? 'Categories' : 'Recipes'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-10">
      {/* ── ITEMS TAB ── */}
      {activeTab === 'items' && (
        <div className="w-full">
          <div className="w-full flex h-full overflow-hidden">
            
            {/* Vertical Categories Sidebar */}
            <div className="w-32 lg:w-40 flex flex-col gap-2 pr-4 overflow-y-auto hide-scrollbar shrink-0 pb-20 md:pb-0">
               <button className={clsx("px-4 py-3 rounded-2xl font-semibold transition-all shadow-sm text-left leading-tight text-sm", activeCatFilter === 'all' ? 'bg-brand-primary text-white' : 'bg-ui-card text-ui-muted hover:bg-ui-border')} onClick={() => setActiveCatFilter('all')}>All Items</button>
               {categories.map(cat => (
                  <button key={cat.id} className={clsx("px-4 py-3 rounded-2xl font-semibold transition-all shadow-sm text-left leading-tight text-sm", activeCatFilter === cat.id ? 'bg-brand-primary text-white' : 'bg-ui-card text-ui-muted hover:bg-ui-border')} onClick={() => setActiveCatFilter(cat.id)}>{cat.name}</button>
               ))}
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="mb-4 flex justify-end shrink-0">
                {canAdd && <button onClick={() => { resetItemForm(); setIsAddModalOpen(true); }} className="bg-brand-primary text-white px-5 py-2.5 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all whitespace-nowrap">+ Add Item</button>}
              </div>
              
              <div className="overflow-y-auto pb-20 md:pb-0 hide-scrollbar flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.filter(i => activeCatFilter === 'all' || i.categoryId === activeCatFilter).map(item => {
              const cat = categories.find(c => c.id === item.categoryId);
              return (
                <div key={item.id} className="bg-ui-card border border-ui-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-ui-text">{item.name}</h3>
                        <p className="text-ui-muted text-xs font-medium mt-0.5">{cat?.name || 'Uncategorized'}</p>
                      </div>
                      <div className="flex gap-2">
                        {canEdit && <button onClick={() => startEditItem(item)} className="text-ui-muted hover:text-brand-primary transition-colors p-1"><Pencil size={16}/></button>}
                        {canDelete && <button onClick={() => handleDeleteItem(item.id)} className="text-ui-muted hover:text-brand-danger transition-colors p-1"><Trash2 size={16}/></button>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-xl font-bold text-sm">₹{item.sellingPrice}</span>
                      {item.variants?.length > 0 && (
                        <span className="text-xs text-brand-accent font-bold bg-brand-accent/10 px-2 py-1 rounded-lg flex items-center gap-1"><Tag size={12}/> {item.variants.length} sizes</span>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-ui-border">
                      {(() => {
                        const hasRecipe = recipes.some(r => String(r.itemId) === String(item.id) && r.ingredients?.length > 0);
                        return (
                          <div className="flex items-center justify-between">
                            <span className={clsx("text-xs font-bold", hasRecipe ? "text-brand-accent" : "text-ui-muted")}>
                              {hasRecipe ? "Recipe Configured ✓" : "Recipe Not Configured"}
                            </span>
                            <button onClick={() => { setSelectedItemForRecipe(item.id); setActiveTab('recipes'); }} className="text-xs font-bold text-brand-primary hover:underline">
                              Edit Recipe
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
            </div>
            </div>
          </div>

          
          {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-ui-card w-full max-w-lg rounded-3xl border border-ui-border shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-ui-border shrink-0">
                  <h2 className="text-xl font-bold text-ui-text">{editingItemId ? 'Edit Item' : 'Add New Item'}</h2>
                  <button onClick={() => { setIsAddModalOpen(false); resetItemForm(); }} className="text-ui-muted hover:text-ui-text p-1 bg-ui-bg rounded-lg"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto hide-scrollbar space-y-4">

            <form onSubmit={(e) => { handleAddOrUpdateItem(e); setIsAddModalOpen(false); }} className="space-y-3">

              <input type="text" placeholder="Item Name" required value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full p-3 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
              <select required value={newCatId} onChange={e => setNewCatId(e.target.value)} className="w-full p-3 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium">
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-ui-muted font-bold block mb-1">Selling Price ₹</label>
                  <input type="number" required value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full p-3 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-bold" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-ui-muted font-bold block mb-1">Cost Price ₹</label>
                  <input type="number" value={newCostPrice} onChange={e => setNewCostPrice(e.target.value)} className="w-full p-3 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-bold" />
                </div>
              </div>

              {/* Variants */}
              <div className="border-t border-ui-border pt-3">
                <p className="text-xs text-ui-muted font-bold mb-2 flex items-center gap-1"><Tag size={12}/> Size Variants (optional)</p>
                {newVariants.map((v, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-ui-bg rounded-xl px-3 py-2 mb-2 border border-ui-border">
                    <span className="font-bold text-ui-text">{v.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-brand-primary font-bold">₹{v.price}</span>
                      <button type="button" onClick={() => setNewVariants(prev => prev.filter((_, idx) => idx !== i))} className="text-brand-danger"><X size={14}/></button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input type="text" placeholder="Size name" value={variantName} onChange={e => setVariantName(e.target.value)} className="flex-[2] p-2 rounded-xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-sm font-medium text-ui-text" />
                  <input type="number" placeholder="₹" value={variantPrice} onChange={e => setVariantPrice(e.target.value)} className="flex-1 p-2 rounded-xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-sm font-bold text-ui-text" />
                  <button type="button" onClick={addVariant} className="bg-ui-card border border-ui-border rounded-xl px-2 text-brand-primary hover:bg-brand-primary/10 transition-colors"><Plus size={16}/></button>
                </div>
              </div>

              <button type="submit" className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                 {editingItemId ? 'Update Item' : <><Plus size={20}/> Save Item</>}
              </button>
            </form>

                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── CATEGORIES TAB ── */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="grid grid-cols-2 gap-4 h-fit">
            {categories.map(c => (
              <div key={c.id} className="bg-ui-card p-5 rounded-3xl border border-ui-border shadow-sm flex items-center justify-between">
                <span className="font-bold text-ui-text">{c.name}</span>
                <div className="flex gap-3">
                  <button onClick={() => { setEditingCatId(c.id); setNewCatName(c.name); }} className="text-ui-muted hover:text-brand-primary transition-colors"><Pencil size={16}/></button>
                  <button onClick={() => handleDeleteCategory(c.id)} className="text-ui-muted hover:text-brand-danger transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm h-fit">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-ui-text">{editingCatId ? 'Edit Category' : 'New Category'}</h2>
               {editingCatId && <button onClick={() => { setEditingCatId(null); setNewCatName(''); }} className="text-ui-muted text-sm font-bold hover:text-ui-text">Cancel</button>}
            </div>
            <form onSubmit={handleAddOrUpdateCategory} className="space-y-4">
              <input type="text" placeholder="Category Name" required value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
              <button type="submit" className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all">
                 {editingCatId ? 'Update Category' : 'Save Category'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── RECIPES TAB ── */}
      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm h-fit">
            <h2 className="text-xl font-bold mb-4 text-ui-text">Select Item</h2>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 hide-scrollbar">
              {items.map(item => {
                const hasRecipe = recipes.find(r => String(r.itemId) === String(item.id) && r.ingredients?.length > 0);
                return (
                  <button key={item.id} onClick={() => setSelectedItemForRecipe(item.id)} className={clsx("w-full text-left p-4 rounded-2xl font-bold transition-all flex items-center justify-between", selectedItemForRecipe === item.id ? "bg-brand-primary text-white" : "bg-ui-bg text-ui-text hover:bg-ui-border")}>
                    <span>{item.name}</span>
                    {hasRecipe && <ChefHat size={16} className={selectedItemForRecipe === item.id ? 'text-white/80' : 'text-brand-accent'}/>}
                  </button>
                );
              })}
            </div>
          </div>
          
          {selectedItemForRecipe ? (
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
                
                {(() => {
                   const selItem = items.find(i => i.id === parseInt(selectedItemForRecipe));
                   let totalRecipeCost = 0;
                   const ings = activeRecipe?.ingredients || [];
                   
                   ings.forEach(ing => {
                     const invItem = inventory.find(i => i.id === ing.inventoryId);
                     if (invItem) {
                       totalRecipeCost += (invItem.costPerBaseUnit || 0) * ing.qty;
                     }
                   });

                   const sellingPrice = selItem?.sellingPrice || 0;
                   const grossProfit = sellingPrice - totalRecipeCost;
                   const grossMargin = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;

                   return (
                     <>
                        <h2 className="text-xl font-black text-ui-text mb-6 uppercase tracking-wider">RECIPE — {selItem?.name} <span className="text-brand-primary ml-2">₹{sellingPrice}</span></h2>
                        
                        <div className="overflow-x-auto mb-6">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-ui-bg text-ui-muted text-xs uppercase tracking-wider">
                                <th className="p-3 font-bold">Ingredient</th>
                                <th className="p-3 font-bold text-center">Qty</th>
                                <th className="p-3 font-bold text-center">Unit</th>
                                <th className="p-3 font-bold text-right">Cost</th>
                                <th className="p-3"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-ui-border text-sm font-medium">
                              {ings.length === 0 && (
                                <tr>
                                  <td colSpan="5" className="p-6 text-center text-ui-muted font-bold">No ingredients configured.</td>
                                </tr>
                              )}
                              {ings.map((ing, idx) => {
                                const invItem = inventory.find(i => i.id === ing.inventoryId);
                                const cost = ((invItem?.costPerBaseUnit || 0) * ing.qty).toFixed(2);
                                return (
                                  <tr key={idx} className="hover:bg-ui-bg transition-colors">
                                    <td className="p-3 font-bold text-ui-text">{invItem?.name || 'Unknown'}</td>
                                    <td className="p-3 text-center font-black text-brand-accent">{ing.qty}</td>
                                    <td className="p-3 text-center text-ui-muted">{invItem?.baseUnit || invItem?.unit || '-'}</td>
                                    <td className="p-3 text-right font-bold text-ui-text">₹{cost}</td>
                                    <td className="p-3 text-right">
                                      <button onClick={() => handleRemoveIngredient(activeRecipe.id, idx)} className="text-ui-muted hover:text-brand-danger transition-colors p-1"><Trash2 size={16}/></button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 bg-ui-bg p-4 rounded-2xl border border-ui-border mb-6">
                          <div className="flex-1">
                            <div className="text-xs font-bold text-ui-muted uppercase tracking-wider mb-1">Total Recipe Cost</div>
                            <div className="text-2xl font-black text-ui-text">₹{totalRecipeCost.toFixed(2)}</div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-ui-muted uppercase tracking-wider mb-1">Gross Profit</div>
                            <div className="text-2xl font-black text-brand-accent">₹{grossProfit.toFixed(2)}</div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-ui-muted uppercase tracking-wider mb-1">Gross Margin %</div>
                            <div className="text-2xl font-black text-brand-primary">{grossMargin.toFixed(2)}%</div>
                          </div>
                        </div>
                     </>
                   );
                })()}

                <h3 className="text-sm font-bold text-ui-text uppercase tracking-wider mb-4 border-t border-ui-border pt-6">Add Ingredient</h3>
                <form onSubmit={handleAddIngredient} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-ui-muted mb-2 uppercase">Raw Material</label>
                    <select required value={ingredientId} onChange={e => setIngredientId(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-bold">
                      <option value="">Search & Select...</option>
                      {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Cost: ₹{i.costPerBaseUnit || 0}/{i.baseUnit || i.unit})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ui-muted mb-2 uppercase">Quantity</label>
                    <input type="number" step="0.01" required value={ingredientQty} onChange={e => setIngredientQty(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-bold" placeholder="e.g. 180" />
                  </div>
                  <button type="submit" className="sm:col-span-3 w-full bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2"><Plus size={20}/> Save Ingredient</button>
                </form>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm flex items-center justify-center text-ui-muted font-bold py-32 text-center text-lg">
              <div>
                <ChefHat size={48} className="mx-auto mb-4 text-ui-border" />
                Select a menu item<br/>to configure its recipe and view costing.
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
