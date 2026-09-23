import React, { useState } from 'react';
import { useLiveQuery } from '../db/db';
import { db, generateInvoiceNumber } from '../db/db';
import { printOrderReceipt } from '../utils/printUtils';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import clsx from 'clsx';
import { Lock, Trash2, FileText, AlertCircle, ShoppingCart, Minus, Plus, CreditCard, Banknote, Smartphone, Pause, X, SplitSquareHorizontal, Award, Percent, UserPlus, Search, Tag } from 'lucide-react';

export default function Billing() {
  const user = useAuthStore(state => state.user);
  const [activeCat, setActiveCat] = useState('all');
  const [openingCash, setOpeningCash] = useState('');
  const [isStartingShift, setIsStartingShift] = useState(false);
  const [showEndShift, setShowEndShift] = useState(false);
  const [actualCash, setActualCash] = useState('');
    const canDiscount = user?.role === 'owner' || user?.permissions?.includes('billing_discount');
  const canHold = user?.role === 'owner' || user?.permissions?.includes('billing_hold');
  const canSplit = user?.role === 'owner' || user?.permissions?.includes('billing_split');
  const canDelete = user?.role === 'owner' || user?.permissions?.includes('billing_delete_item');
  const activeShift = useLiveQuery(async () => {
    try { return db.shifts ? await db.shifts.where('status').equals('active').first() : null; } catch (e) { return null; }
  }) || null;
  const [search, setSearch] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSplitOpen, setIsSplitOpen] = useState(false);

  
  const calculateExpectedCash = () => {
    if (!activeShift) return 0;
    const cashSales = todaySales.filter(s => s.paymentMode === 'cash').reduce((sum, s) => sum + s.total, 0);
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
    setActualCash('');
  };

  const handleStartShift = async (e) => {
    e.preventDefault();
    setIsStartingShift(true);
    try {
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
      setOpeningCash('');
    } catch(err) {
      console.error(err);
    } finally {
      setIsStartingShift(false);
    }
  };

  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [variantItem, setVariantItem] = useState(null); // item waiting for variant pick
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isHeldOpen, setIsHeldOpen] = useState(false);
  const todaySales = useLiveQuery(() => db.orders ? db.orders.where('date').startsWith(new Date().toISOString().split('T')[0]).toArray() : []) || [];
  const heldOrders = useLiveQuery(() => db.held_orders ? db.held_orders.toArray() : []) || [];

  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');
  const [discPercent, setDiscPercent] = useState('');
  const [discFixed, setDiscFixed] = useState('');
  const [newCusName, setNewCusName] = useState('');
  const [newCusMobile, setNewCusMobile] = useState('');

  const categories = useLiveQuery(() => db.categories.orderBy('displayOrder').toArray()) || [];
  const items = useLiveQuery(() => db.items.where('status').equals('active').toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const loyaltySettings = useLiveQuery(() => db.settings.get('loyalty')) || { earnRatio: 100, pointValue: 1 };
  const profileSettings = useLiveQuery(() => db.settings.get('profile')) || {};
  const printSettings = useLiveQuery(() => db.settings.get('print')) || {};

  const filteredItems = items.filter(item => {
    const matchCat = activeCat === 'all' || item.categoryId === activeCat;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.mobile.includes(customerSearch)
  ).slice(0, 5);

  const cart = useCartStore(state => state.cart);
  const addItem = useCartStore(state => state.addItem);
  const updateQty = useCartStore(state => state.updateQty);
  const clearCart = useCartStore(state => state.clearCart);
  const getTotals = useCartStore(state => state.getTotals);
  const customer = useCartStore(state => state.customer);
  const setCustomer = useCartStore(state => state.setCustomer);
  const redeemPoints = useCartStore(state => state.redeemPoints);
  const setRedeemPoints = useCartStore(state => state.setRedeemPoints);
  const setDiscount = useCartStore(state => state.setDiscount);

  const redeemPts = useCartStore(state => state.redeemPoints);
  const ptVal = useCartStore(state => state.pointValue);
  const { subtotal, discountAmt, total } = getTotals();
  const finalTotal = total;

  // Click on item: show variant picker if variants exist, else add directly
  const handleItemClick = (item) => {
    if (item.variants && item.variants.length > 0) {
      setVariantItem(item);
    } else {
      addItem(item);
    }
  };

  const handleVariantSelect = (variant) => {
    addItem({ ...variantItem, sellingPrice: variant.price, name: `${variantItem.name} (${variant.name})` });
    setVariantItem(null);
  };

  const processAutoDeduction = async (cartItems) => {
    const recipes = await db.recipes.toArray();
    for (let cartItem of cartItems) {
      const baseId = cartItem.id;
      const itemRecipe = recipes.find(r => r.itemId === baseId);
      if (itemRecipe) {
        for (let ing of itemRecipe.ingredients) {
          const inv = await db.inventory.get(ing.inventoryId);
          if (inv) await db.inventory.update(ing.inventoryId, { currentStock: inv.currentStock - (ing.qty * cartItem.qty) });
        }
      }
    }
  };

  const printReceipt = async (order, cName) => { await printOrderReceipt(order, cName); };;

  const checkInventoryAvailability = async (cartItems) => {
    const recipes = await db.recipes.toArray();
    const inventory = await db.inventory.toArray();
    const required = {};
    for (let cartItem of cartItems) {
      const itemRecipe = recipes.find(r => r.itemId === cartItem.id);
      if (itemRecipe) {
        for (let ing of itemRecipe.ingredients) {
          required[ing.inventoryId] = (required[ing.inventoryId] || 0) + (ing.qty * cartItem.qty);
        }
      }
    }
    for (let invId in required) {
      const invItem = inventory.find(i => i.id === parseInt(invId));
      if (!invItem || invItem.currentStock < required[invId]) {
        return { ok: false, msg: `Insufficient stock for ${invItem?.name || 'Unknown'}. Needed: ${required[invId]}, Available: ${invItem?.currentStock || 0}` };
      }
    }
    return { ok: true };
  };

  const handleCheckout = async (paymentMode, hold = false, splitData = null) => {
    if (cart.length === 0) return;
    
    if (!hold) {
      const check = await checkInventoryAvailability(cart);
      if (!check.ok) {
        alert("Checkout Blocked: " + check.msg);
        return;
      }
    }

    const invoiceNumber = await generateInvoiceNumber();
    const orderData = {
      date: new Date().toISOString(),
      customerId: customer?.id || null,
      items: cart,
      subtotal,
      discount: discountAmt,
      pointsRedeemed: redeemPts,
      pointsValue: redeemPts * ptVal,
      tax: 0,
      total: finalTotal,
      paymentMode: splitData ? 'SPLIT' : paymentMode,
      splitDetails: splitData || null,
      status: hold ? 'HOLD' : 'PAID',
      invoiceNumber,
      createdBy: user?.name || 'Cashier',
    };
    await db.sales.add(orderData);

    if (!hold) {
      await processAutoDeduction(cart);
      if (customer) {
        const pointsEarned = Math.floor(finalTotal / loyaltySettings.earnRatio);
        const updated = customer.loyaltyPoints - redeemPoints + pointsEarned;
        await db.customers.update(customer.id, { loyaltyPoints: Math.max(0, updated) });
      }
      // Auto-print after checkout
      const cName = customer?.name || 'Guest';
      printReceipt(orderData, cName);
    }

    clearCart();
    setIsCartOpen(false);
    setIsSplitOpen(false);
    setCustomerSearch('');
  };

  const toggleRedeem = () => {
    if (redeemPoints > 0) setRedeemPoints(0, loyaltySettings.pointValue);
    else setRedeemPoints(customer.loyaltyPoints, loyaltySettings.pointValue);
  };

  const applyDiscount = () => {
    setDiscount(parseFloat(discPercent || 0), parseFloat(discFixed || 0));
    setIsDiscountOpen(false);
    setDiscPercent(''); setDiscFixed('');
  };

  const quickAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCusName || !newCusMobile) return;
    const id = await db.customers.add({ name: newCusName, mobile: newCusMobile, loyaltyPoints: 0 });
    const newC = await db.customers.get(id);
    setCustomer(newC);
    setCustomerSearch(newC.name);
    setNewCusName(''); setNewCusMobile('');
    setIsCustomerOpen(false);
  };

  
    
    
    if (!activeShift) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-ui-bg w-full">
          <div className="bg-ui-card p-8 rounded-3xl shadow-float border border-ui-border max-w-sm w-full">
            <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-6">
               <AlertCircle size={40}/>
            </div>
            <h2 className="text-2xl font-bold text-ui-text mb-2">Register Closed</h2>
            <p className="text-ui-muted text-sm mb-8">Start a new shift to begin billing.</p>
            <form onSubmit={handleStartShift} className="space-y-4">
              <div className="text-left">
                <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Opening Cash Drawer (₹)</label>
                <input type="number" required autoFocus value={openingCash} onChange={e=>setOpeningCash(e.target.value)} placeholder="0.00" className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text text-xl" />
              </div>
              <button type="submit" disabled={isStartingShift} className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50">
                {isStartingShift ? 'Starting...' : 'Start Shift'}
              </button>
            </form>
          </div>
        </div>
      );
    }
return (
    <div className="flex h-full relative">
      {/* HELD BILLS MODAL */}
      {isHeldOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-ui-card w-full max-w-md p-6 rounded-3xl shadow-xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-ui-text">Held Bills</h2>
              <button onClick={() => setIsHeldOpen(false)} className="text-ui-muted hover:text-ui-text"><X size={24}/></button>
            </div>
            <div className="overflow-y-auto space-y-3 flex-1 hide-scrollbar">
              {heldOrders.length === 0 ? (
                <div className="text-center text-ui-muted py-8 font-medium">No held bills.</div>
              ) : heldOrders.map(h => (
                <div key={h.id} className="bg-ui-bg border border-ui-border p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-ui-text">{h.customerName}</div>
                    <div className="text-sm text-ui-muted">{new Date(h.date).toLocaleTimeString()} - {h.items.length} items</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-black text-brand-primary">₹{h.total.toFixed(2)}</div>
                    <button onClick={() => handleResumeBill(h)} className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold shadow-sm active:scale-95">Resume</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ITEM GRID */}
      <div className="flex-1 flex flex-col p-4 md:p-6 w-full h-full overflow-hidden">
        <div className="flex justify-between items-center mb-4 shrink-0 gap-3">
          <button onClick={() => setShowEndShift(true)} className="bg-brand-danger/10 text-brand-danger border border-brand-danger/20 px-4 py-4 rounded-2xl font-bold shadow-sm hover:bg-brand-danger/20 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap">
      <Lock size={18} /> Close Drawer
    </button>
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ui-muted" />
            <input type="text" placeholder="Search items..." className="w-full pl-11 p-4 rounded-2xl bg-ui-card border border-ui-border shadow-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all text-ui-text" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="mb-4 flex overflow-x-auto pb-2 gap-3 hide-scrollbar shrink-0">
          <button className={clsx("px-5 py-2.5 rounded-2xl whitespace-nowrap font-semibold transition-all shadow-sm", activeCat === 'all' ? 'bg-brand-primary text-white' : 'bg-ui-card text-ui-muted hover:bg-ui-border')} onClick={() => setActiveCat('all')}>All</button>
          {categories.map(cat => (
            <button key={cat.id} className={clsx("px-5 py-2.5 rounded-2xl whitespace-nowrap font-semibold transition-all shadow-sm", activeCat === cat.id ? 'bg-brand-primary text-white' : 'bg-ui-card text-ui-muted hover:bg-ui-border')} onClick={() => setActiveCat(cat.id)}>{cat.name}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0 hide-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => {
              const cartItem = cart.find(c => c.id === item.id);
              const hasVariants = item.variants?.length > 0;
              
              return (
                <div key={item.id} className="bg-ui-card border border-ui-border rounded-2xl shadow-sm hover:shadow-md cursor-pointer active:scale-95 transition-all overflow-hidden select-none flex flex-col" onClick={() => handleItemClick(item)}>
                  {item.imageBase64 ? (
                    <img src={item.imageBase64} alt={item.name} className="w-full h-24 object-contain bg-ui-bg" />
                  ) : (
                    <div className="w-full h-24 bg-ui-bg flex items-center justify-center text-3xl font-black text-ui-muted/30">{item.name.substring(0, 2).toUpperCase()}</div>
                  )}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div className="font-semibold text-ui-text text-sm line-clamp-1 mb-1">{item.name}</div>
                    
                    {cartItem && !hasVariants ? (
                      <div className="flex items-center justify-between bg-ui-bg rounded-lg p-1 border border-brand-primary/30" onClick={e => e.stopPropagation()}>
                        <button className="w-7 h-7 rounded flex items-center justify-center text-ui-muted hover:text-brand-danger bg-ui-card shadow-sm" onClick={() => updateQty(cartItem.cartId || (cartItem.id + '-' + cartItem.name), cartItem.qty - 1)}><Minus size={14}/></button>
                        <span className="font-bold text-sm px-2 text-ui-text">{cartItem.qty}</span>
                        <button className="w-7 h-7 rounded flex items-center justify-center text-brand-primary bg-ui-card shadow-sm" onClick={() => updateQty(cartItem.cartId || (cartItem.id + '-' + cartItem.name), cartItem.qty + 1)}><Plus size={14}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-base font-bold text-brand-primary">₹{item.sellingPrice}</div>
                        {hasVariants && <Tag size={12} className="text-brand-accent"/>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MOBILE CART FAB */}
      <button className="md:hidden absolute bottom-6 right-6 w-16 h-16 bg-brand-primary text-white rounded-2xl shadow-float flex items-center justify-center active:scale-95 transition-transform z-40" onClick={() => setIsCartOpen(true)}>
        <ShoppingCart size={24} />
        {cart.length > 0 && <div className="absolute -top-2 -right-2 bg-brand-danger text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-ui-bg">{cart.length}</div>}
      </button>

      {/* CART PANEL */}
      <div className={clsx("fixed inset-0 bg-ui-bg/80 backdrop-blur-sm z-50 md:relative md:inset-auto md:bg-transparent md:backdrop-blur-none transition-opacity duration-200", isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto")} onClick={() => setIsCartOpen(false)}>
        <div className={clsx("absolute md:relative right-0 bottom-0 top-0 w-full sm:w-[400px] bg-ui-card border-l border-ui-border shadow-2xl md:shadow-none flex flex-col transition-transform duration-300 md:transform-none z-50 md:flex-shrink-0 h-full", isCartOpen ? "translate-x-0" : "translate-x-full")} onClick={e => e.stopPropagation()}>

          <div className="p-5 border-b border-ui-border bg-ui-bg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-ui-text">Current Order</h2>
              <button className="md:hidden p-2 bg-ui-card rounded-xl text-ui-muted" onClick={() => setIsCartOpen(false)}><X size={20}/></button>
            </div>

            {/* Customer search with live dropdown */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-muted" />
                  <input
                    type="text"
                    placeholder="Customer name or mobile..."
                    value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); if (!e.target.value) setCustomer(null); }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-ui-card border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-medium text-ui-text text-sm"
                  />
                </div>
                <button onClick={() => setIsCustomerOpen(true)} className="bg-brand-primary text-white px-3 rounded-xl hover:bg-brand-primary/90 transition-colors"><UserPlus size={18}/></button>
              </div>
              {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-ui-card border border-ui-border rounded-2xl shadow-float z-10 overflow-hidden">
                  {filteredCustomers.map(c => (
                    <button key={c.id} className="w-full flex items-center justify-between px-4 py-3 hover:bg-ui-bg transition-colors text-left" onClick={() => { setCustomer(c); setCustomerSearch(c.name); setShowCustomerDropdown(false); }}>
                      <div>
                        <div className="font-bold text-ui-text text-sm">{c.name}</div>
                        <div className="text-xs text-ui-muted">{c.mobile}</div>
                      </div>
                      {c.loyaltyPoints > 0 && <span className="text-xs text-brand-warning font-bold bg-brand-warning/10 px-2 py-0.5 rounded-lg">{c.loyaltyPoints} pts</span>}
                    </button>
                  ))}
                </div>
              )}
              {customer && <div className="mt-1.5 text-xs text-brand-accent font-bold px-1">✓ {customer.name} ({customer.loyaltyPoints} pts)</div>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 hide-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-ui-muted">
                <ShoppingCart size={48} className="mb-4 opacity-20" />
                <p className="font-medium text-lg">Cart is empty</p>
                <p className="text-sm">Tap an item to add it</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.cartId || (item.id + '-' + item.name)} className="flex justify-between items-center bg-ui-bg p-3 rounded-2xl border border-ui-border shadow-sm">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="font-semibold text-ui-text text-sm truncate">{item.name}</div>
                    <div className="text-brand-primary font-bold text-xs mt-0.5">₹{item.sellingPrice}</div>
                  </div>
                  <div className="flex items-center gap-2 bg-ui-card rounded-xl border border-ui-border p-1 shadow-sm shrink-0">
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-ui-muted hover:text-brand-danger transition-colors" onClick={() => updateQty(item.cartId || (item.id + '-' + item.name), item.qty - 1)}><Minus size={14}/></button>
                    <span className="font-bold w-5 text-center text-ui-text text-sm">{item.qty}</span>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-primary hover:bg-brand-primary/10 transition-colors" onClick={() => updateQty(item.cartId || (item.id + '-' + item.name), item.qty + 1)}><Plus size={14}/></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 bg-ui-bg border-t border-ui-border pb-safe">
            {customer && customer.loyaltyPoints > 0 && (
              <div className="mb-3 bg-brand-warning/10 border border-brand-warning/20 p-3 rounded-2xl flex justify-between items-center">
                <div className="flex items-center gap-2 text-brand-warning font-bold text-sm"><Award size={16}/> {customer.loyaltyPoints} pts</div>
                <button onClick={toggleRedeem} className="bg-brand-warning text-white px-3 py-1 rounded-lg text-xs font-bold">{redeemPoints > 0 ? 'Cancel' : 'Redeem'}</button>
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <button onClick={() => handleCheckout('', true)} disabled={cart.length === 0} className="flex-1 bg-brand-warning/10 text-brand-warning p-3 rounded-xl font-bold flex items-center justify-center gap-1 text-sm hover:bg-brand-warning/20 disabled:opacity-50 transition-colors"><Pause size={16}/> Hold</button>
              <button onClick={() => setIsDiscountOpen(true)} disabled={cart.length === 0} className="flex-1 bg-brand-accent/10 text-brand-accent p-3 rounded-xl font-bold flex items-center justify-center gap-1 text-sm hover:bg-brand-accent/20 disabled:opacity-50 transition-colors"><Percent size={16}/> Disc</button>
              <button onClick={() => clearCart()} disabled={cart.length === 0} className="flex-1 bg-brand-danger/10 text-brand-danger p-3 rounded-xl font-bold flex items-center justify-center gap-1 text-sm hover:bg-brand-danger/20 disabled:opacity-50 transition-colors"><X size={16}/> Clear</button>
            </div>

            <div className="space-y-1 mb-3 border-b border-ui-border pb-3 text-sm">
              <div className="flex justify-between text-ui-muted font-medium"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              {(discountAmt - (redeemPts * ptVal)) > 0 && <div className="flex justify-between text-brand-accent font-bold"><span>Discount</span><span>-₹{(discountAmt - (redeemPts * ptVal)).toFixed(2)}</span></div>}
              {redeemPts > 0 && <div className="flex justify-between text-brand-warning font-bold"><span>Points ({redeemPts} pts)</span><span>-₹{(redeemPts * ptVal).toFixed(2)}</span></div>}
            </div>

            <div className="flex justify-between mb-4 text-2xl font-bold text-ui-text tracking-tight">
              <span>Total</span><span>₹{finalTotal.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button disabled={cart.length === 0} className="bg-brand-accent text-white p-3 rounded-xl font-bold flex flex-col items-center justify-center shadow-md active:scale-95 disabled:opacity-50 transition-all" onClick={() => handleCheckout('CASH')}>
                <Banknote size={18} className="mb-1"/><span className="text-[10px]">Cash</span>
              </button>
              <button disabled={cart.length === 0} className="bg-brand-primary text-white p-3 rounded-xl font-bold flex flex-col items-center justify-center shadow-md active:scale-95 disabled:opacity-50 transition-all" onClick={() => handleCheckout('UPI')}>
                <Smartphone size={18} className="mb-1"/><span className="text-[10px]">UPI</span>
              </button>
              <button disabled={cart.length === 0} className="bg-ui-text text-ui-bg p-3 rounded-xl font-bold flex flex-col items-center justify-center shadow-md active:scale-95 disabled:opacity-50 transition-all" onClick={() => handleCheckout('CARD')}>
                <CreditCard size={18} className="mb-1"/><span className="text-[10px]">Card</span>
              </button>
              <button disabled={cart.length === 0} className="bg-ui-card text-ui-text border border-ui-border p-3 rounded-xl font-bold flex flex-col items-center justify-center shadow-sm active:scale-95 disabled:opacity-50 transition-all" onClick={() => setIsSplitOpen(true)}>
                <SplitSquareHorizontal size={18} className="mb-1"/><span className="text-[10px]">Split</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VARIANT PICKER MODAL */}
      {variantItem && (
        <div className="fixed inset-0 bg-ui-bg/90 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-4">
          <div className="bg-ui-card border border-ui-border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b border-ui-border">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-ui-text">{variantItem.name}</h2>
                <button className="text-ui-muted hover:text-ui-text" onClick={() => setVariantItem(null)}><X size={20}/></button>
              </div>
              <p className="text-ui-muted text-sm font-medium mt-1">Choose a size</p>
            </div>
            <div className="p-4 space-y-3">
              {variantItem.variants.map((v, i) => (
                <button key={i} onClick={() => handleVariantSelect(v)} className="w-full flex justify-between items-center p-4 bg-ui-bg border border-ui-border rounded-2xl hover:border-brand-primary hover:bg-brand-primary/5 active:scale-95 transition-all group">
                  <span className="font-bold text-ui-text group-hover:text-brand-primary text-lg">{v.name}</span>
                  <span className="text-2xl font-black text-brand-primary">₹{v.price}</span>
                </button>
              ))}
              <button onClick={() => handleVariantSelect({ name: 'Regular', price: variantItem.sellingPrice })} className="w-full p-3 text-sm text-ui-muted hover:text-ui-text font-bold border border-dashed border-ui-border rounded-2xl transition-colors">
                Add at base price ₹{variantItem.sellingPrice}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CUSTOMER MODAL */}
      {isCustomerOpen && (
        <div className="fixed inset-0 bg-ui-bg/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <form onSubmit={quickAddCustomer} className="bg-ui-card border border-ui-border rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ui-text">Quick Add Customer</h2>
              <button type="button" className="text-ui-muted" onClick={() => setIsCustomerOpen(false)}><X size={20}/></button>
            </div>
            <div className="space-y-4 mb-6">
              <input type="text" required value={newCusName} onChange={e => setNewCusName(e.target.value)} placeholder="Customer Name" className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
              <input type="tel" required value={newCusMobile} onChange={e => setNewCusMobile(e.target.value)} placeholder="Mobile Number" className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
            </div>
            <button type="submit" className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all">Save Customer</button>
          </form>
        </div>
      )}

      {/* SPLIT PAYMENT MODAL */}
      {isSplitOpen && (
        <div className="fixed inset-0 bg-ui-bg/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-ui-card border border-ui-border rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ui-text">Split Payment</h2>
              <button className="text-ui-muted" onClick={() => setIsSplitOpen(false)}><X size={20}/></button>
            </div>
            <div className="text-center mb-6">
              <p className="text-ui-muted text-sm font-bold">Total</p>
              <p className="text-3xl font-bold text-ui-text">₹{finalTotal.toFixed(2)}</p>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-bold text-ui-muted flex items-center gap-2 mb-2"><Banknote size={16}/> Cash Amount</label>
                <input type="number" value={splitCash} onChange={e => setSplitCash(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-lg text-ui-text" placeholder="0"/>
              </div>
              <div>
                <label className="text-sm font-bold text-ui-muted flex items-center gap-2 mb-2"><Smartphone size={16}/> UPI Amount</label>
                <input type="number" value={splitUpi} onChange={e => setSplitUpi(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-lg text-ui-text" placeholder="0"/>
              </div>
            </div>
            <button onClick={() => handleCheckout('SPLIT', false, { cash: parseFloat(splitCash || 0), upi: parseFloat(splitUpi || 0) })} className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all">Confirm Split Pay</button>
          </div>
        </div>
      )}

      {/* DISCOUNT MODAL */}
      {isDiscountOpen && (
        <div className="fixed inset-0 bg-ui-bg/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-ui-card border border-ui-border rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ui-text">Apply Discount</h2>
              <button className="text-ui-muted" onClick={() => setIsDiscountOpen(false)}><X size={20}/></button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-bold text-ui-muted block mb-2">Percentage (%)</label>
                <input type="number" value={discPercent} onChange={e => { setDiscPercent(e.target.value); setDiscFixed(''); }} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-lg text-ui-text" placeholder="0"/>
              </div>
              <div className="text-center font-bold text-ui-muted text-sm">— OR —</div>
              <div>
                <label className="text-sm font-bold text-ui-muted block mb-2">Flat Amount (₹)</label>
                <input type="number" value={discFixed} onChange={e => { setDiscFixed(e.target.value); setDiscPercent(''); }} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-lg text-ui-text" placeholder="0"/>
              </div>
            </div>
            <button onClick={applyDiscount} className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all">Apply to Bill</button>
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
              <h2 className="text-xl font-bold mb-4 text-ui-text">Close Drawer (End Shift)</h2>
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
                  <button type="submit" className="flex-1 p-4 rounded-2xl font-bold bg-brand-danger text-white shadow-md">Close Register</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

</div>
  );
}
