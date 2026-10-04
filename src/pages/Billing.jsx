import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from '../db/db';
import { db, generateInvoiceNumber, logInventoryMovement } from '../db/db';
import { printOrderReceipt, printOrderKOT } from '../utils/printUtils';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import clsx from 'clsx';
import { Lock, Trash2, FileText, AlertCircle, ShoppingCart, Minus, Plus, CreditCard, Banknote, Smartphone, Pause, X, SplitSquareHorizontal, Award, Percent, UserPlus, Search, Tag, Clock, ScanBarcode, MessageSquare, RotateCcw, Activity, Users, FileClock, Printer, ClipboardList, Check } from 'lucide-react';

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
    try { 
        if (!db.shifts || !user?.name) return null;
        const shifts = await db.shifts.where('status').equals('active').toArray();
        return shifts.find(s => s.startedBy === user.name) || null;
    } catch (e) { return null; }
  }) || null;
  const [search, setSearch] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSplitOpen, setIsSplitOpen] = useState(false);

  // Advanced POS States
  const [orderType, setOrderType] = useState('Dine In');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTenderOpen, setIsTenderOpen] = useState(false);
  const [checkoutPrompt, setCheckoutPrompt] = useState(null);
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [noteItem, setNoteItem] = useState(null); // item for which notes are being added
  const [noteText, setNoteText] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const calculateExpectedCash = () => {
    if (!activeShift) return 0;
    const cSales = todaySales.filter(s => s.paymentMode === 'CASH').reduce((sum, s) => sum + s.total, 0);
    const spCash = todaySales.filter(s => s.paymentMode === 'SPLIT').reduce((sum, s) => sum + (s.splitDetails?.cash || 0), 0);
    const drawerPurchases = todayPurchases.filter(p => p.paymentMode === 'drawer').reduce((sum, p) => sum + p.totalAmount, 0);
    return parseFloat(activeShift.openingCash) + cSales + spCash - drawerPurchases;
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
  const [variantItem, setVariantItem] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isHeldOpen, setIsHeldOpen] = useState(false);
  const todayPurchases = useLiveQuery(async () => {
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    return await db.purchases.where('date').aboveOrEqual(todayStart.toISOString()).toArray();
  }) || [];
  
  const todaySales = useLiveQuery(async () => {
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const s = await db.sales.where('date').aboveOrEqual(todayStart.toISOString()).toArray();
    return s.filter(order => order.status === 'PAID');
  }) || [];
  const heldOrders = useLiveQuery(() => db.held_orders ? db.held_orders.toArray() : []) || [];
  const inventory = useLiveQuery(() => db.inventory.toArray()) || [];

  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');
  const [discPercent, setDiscPercent] = useState('');
  const [discFixed, setDiscFixed] = useState('');
  const [newCusName, setNewCusName] = useState('');
  const [newCusMobile, setNewCusMobile] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const categories = useLiveQuery(() => db.categories.orderBy('displayOrder').toArray()) || [];
  const items = useLiveQuery(() => db.items.where('status').equals('active').toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const loyaltySettings = useLiveQuery(() => db.settings.get('loyalty')) || { earnRatio: 100, pointValue: 1 };
  const profileSettings = useLiveQuery(() => db.settings.get('profile')) || {};
  const printBasic = useLiveQuery(() => db.settings.get('print')) || {};
  const printAdvanced = useLiveQuery(() => db.settings.get('printAdvanced')) || {};
  const printSettings = printAdvanced.data || printBasic;

  // Filter items based on category and search
  let filteredItems = items.filter(item => {
    const matchCat = activeCat === 'all' || item.categoryId === activeCat;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const recentCustomers = customers.slice().reverse().slice(0, 5);
  const filteredCustomers = customerSearch ? customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.mobile.includes(customerSearch)
  ).slice(0, 5) : recentCustomers;

  const topProducts = React.useMemo(() => {
    if (!todaySales || todaySales.length === 0) return items.slice(0, 6);
    const counts = {};
    todaySales.forEach(order => {
       order.items.forEach(item => {
          counts[item.id] = (counts[item.id] || 0) + item.qty;
       });
    });
    const sortedIds = Object.keys(counts).sort((a,b) => counts[b] - counts[a]).slice(0, 6);
    return sortedIds.map(id => items.find(i => String(i.id) === String(id))).filter(Boolean);
  }, [todaySales, items]);

  const dashboardMetrics = React.useMemo(() => {
    const totalSales = todaySales.reduce((acc, order) => acc + order.total, 0);
    const orderCount = todaySales.length;
    const avgBill = orderCount > 0 ? (totalSales / orderCount) : 0;
    return { totalSales, orderCount, avgBill };
  }, [todaySales]);
  
  const recentOrders = todaySales.slice().reverse().slice(0, 5);

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
  const updateItemNotes = useCartStore(state => state.updateItemNotes);

  const redeemPts = useCartStore(state => state.redeemPoints);
  const ptVal = useCartStore(state => state.pointValue);
  const { subtotal, discountAmt, total } = getTotals();
  const finalTotal = total;

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' && e.target.id !== 'product-search' && e.target.id !== 'customer-search') return;
      if (e.key === 'F2') { e.preventDefault(); searchInputRef.current?.focus(); }
      if (e.key === 'F3') { e.preventDefault(); document.getElementById('customer-search')?.focus(); }
      if (e.key === 'F4') { e.preventDefault(); if (cart.length > 0) handleCheckout('', true); }
      if (e.key === 'F5') { e.preventDefault(); if (cart.length > 0) setIsDiscountOpen(true); }
      if (e.key === 'Escape') { e.preventDefault(); clearCart(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

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

  const processAutoDeduction = async (cartItems, saleId) => {
    const recipes = await db.recipes.toArray();
    const deductions = {};

    for (let cartItem of cartItems) {
      const baseId = cartItem.id;
      const itemRecipe = recipes.find(r => String(r.itemId) === String(baseId) && r.ingredients?.length > 0) || recipes.find(r => String(r.itemId) === String(baseId));
      if (itemRecipe) {
        for (let ing of itemRecipe.ingredients) {
          if (!deductions[ing.inventoryId]) {
             deductions[ing.inventoryId] = { qty: 0, names: [] };
          }
          deductions[ing.inventoryId].qty += (ing.qty * cartItem.qty);
          deductions[ing.inventoryId].names.push(`${cartItem.qty}x ${cartItem.name}`);
        }
      }
    }

    const promises = Object.keys(deductions).map(inventoryId => {
      const deduction = -deductions[inventoryId].qty;
      const note = `Sold ${deductions[inventoryId].names.join(', ')}`;
      return logInventoryMovement(inventoryId, deduction, 'SALE', saleId, note);
    });

    await Promise.all(promises);
  };

  const printReceipt = (order, cName) => { 
    try { printOrderReceipt(order, cName, printSettings, profileSettings); } 
    catch (e) { alert("Print Error: " + e.message); console.error(e); }
  };

  const finalizeCheckout = async (paymentMode, hold, splitData, printOption) => {
    if (cart.length === 0 || isProcessing) return;
    const actualTendered = (paymentMode === 'CASH' && !hold) ? (tenderedAmount || finalTotal.toString()) : tenderedAmount;
    setIsProcessing(true);
    try {
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
        orderType,
        tenderedCash: paymentMode === 'CASH' ? parseFloat(actualTendered) : null,
        createdBy: user?.name || 'Cashier',
      };
      const saleId = await db.sales.add(orderData);
      orderData.id = saleId;

      clearCart();
      setIsCartOpen(false);
      setIsSplitOpen(false);
      setIsTenderOpen(false);
      setCheckoutPrompt(null);
      setTenderedAmount('');
      setCustomerSearch('');
      searchInputRef.current?.focus();

      if (!hold) {
        const postSalePromises = [];
        postSalePromises.push(processAutoDeduction(cart, saleId));
        if (customer) {
          const pointsEarned = Math.floor(finalTotal / loyaltySettings.earnRatio);
          const updated = customer.loyaltyPoints - redeemPts + pointsEarned;
          postSalePromises.push(
            db.customers.get(customer.id).then(c => 
              db.customers.update(customer.id, { loyaltyPoints: Math.max(0, updated), visits: (c.visits||0) + 1 })
            )
          );
        }
        Promise.all(postSalePromises).catch(console.error);

        // Printing Logic
        if (printOption === 'INVOICE') {
           try { printOrderReceipt(orderData, customer?.name || 'Guest', printSettings, profileSettings); } catch (e) { console.error(e); }
        } else if (printOption === 'KOT') {
           try { printOrderKOT(orderData, printSettings, profileSettings); } catch (e) { console.error(e); }
        }

      } else {
        db.held_orders.add({ ...orderData, customerName: customer?.name || 'Guest' }).catch(console.error);
        alert('Order placed on Hold.');
      }
    } catch (e) {
      alert("Checkout Error: " + e.message); console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async (paymentMode, hold = false, splitData = null) => {
    if (hold) {
      return finalizeCheckout(paymentMode, hold, splitData, 'NONE');
    }
    setCheckoutPrompt({ paymentMode, hold, splitData });
  };

  const handleResumeBill = async (held) => {
    clearCart();
    if (held.customerId) {
       const cus = await db.customers.get(held.customerId);
       if(cus) { setCustomer(cus); setCustomerSearch(cus.name); }
    } else {
       setCustomer(null); setCustomerSearch('');
    }
    setOrderType(held.orderType || 'Dine In');
    held.items.forEach(i => addItem(i));
    if (held.discount > 0) setDiscount(0, held.discount);
    await db.held_orders.delete(held.id);
    setIsHeldOpen(false);
  };

  const handleRepeatOrder = (order) => {
    clearCart();
    order.items.forEach(i => addItem({ ...i, cartId: undefined }));
    if (order.customerId) {
       const cus = customers.find(c => c.id === order.customerId);
       if (cus) { setCustomer(cus); setCustomerSearch(cus.name); }
    } else {
       setCustomer(null); setCustomerSearch('');
    }
    setOrderType(order.orderType || 'Dine In');
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
    const id = await db.customers.add({ name: newCusName, mobile: newCusMobile, loyaltyPoints: 0, visits: 0 });
    const newC = await db.customers.get(id);
    setCustomer(newC);
    setCustomerSearch(newC.name);
    setNewCusName(''); setNewCusMobile('');
    setIsCustomerOpen(false);
  };

  const applyNote = (preset) => {
    const existing = noteText ? noteText + ', ' + preset : preset;
    setNoteText(existing);
  };
  
  const saveNote = () => {
    updateItemNotes(noteItem.cartId || (noteItem.id + '-' + noteItem.name), noteText);
    setNoteItem(null); setNoteText('');
  };

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-ui-bg w-full">
        <div className="bg-ui-card p-8 rounded-3xl shadow-float border border-ui-border max-w-sm w-full">
          <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={40}/></div>
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
    <div className="flex flex-col h-full w-full bg-ui-bg relative overflow-hidden">
      
      {/* SMART BILLING HEADER */}
      <div className="bg-ui-card px-4 py-2.5 flex justify-between items-center overflow-x-auto hide-scrollbar md:whitespace-nowrap flex-wrap md:flex-nowrap border-b border-ui-border shrink-0 z-10 shadow-sm gap-4 md:gap-4 md:flex-row">
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-bold text-green-600 text-sm">Shift Open</span>
          </div>
          <div className="text-sm font-bold text-ui-muted flex items-center gap-2">
            <Banknote size={16} className="text-brand-primary"/>
            Opening: <span className="text-ui-text">₹{parseFloat(activeShift.openingCash).toFixed(2)}</span>
          </div>
        </div>
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-6">
          <button onClick={() => setIsHeldOpen(true)} className="relative flex items-center gap-2 text-sm font-bold text-ui-muted hover:text-brand-primary transition-colors">
            <Pause size={16}/> Held Bills
            {heldOrders.length > 0 && <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{heldOrders.length}</span>}
          </button>
          <div className="w-px h-6 bg-ui-border"></div>
          <span className="text-sm font-bold text-ui-muted flex items-center gap-2"><CreditCard size={16}/> {user?.name || 'Cashier'}</span>
          <span className="text-sm font-bold text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
             <Clock size={16}/> {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
          <button onClick={() => setShowEndShift(true)} className="bg-brand-danger/10 text-brand-danger px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-brand-danger/20 transition-colors border border-brand-danger/20 active:scale-95">End Shift</button>
        </div>
      </div>

      <div className="flex-1 flex w-full h-full overflow-hidden">
        
        {/* LEFT: CATEGORIES (Sticky, Compact, Vertical on Mobile) */}
        <div className="w-[85px] md:w-[130px] lg:w-[150px] flex flex-col gap-1.5 md:gap-2 p-1.5 md:p-2 overflow-y-auto hide-scrollbar shrink-0 bg-ui-card border-r border-ui-border">
          <button className={clsx("shrink-0 p-2 md:px-4 md:py-2 rounded-lg md:rounded-xl font-bold transition-all text-center md:text-left text-[10px] md:text-xs leading-tight break-words shadow-sm", activeCat === 'all' ? 'bg-brand-primary text-white' : 'bg-ui-bg text-ui-muted hover:bg-ui-border')} onClick={() => setActiveCat('all')}>🌟<br className="md:hidden"/> All</button>
          {categories.map(cat => (
            <button key={cat.id} className={clsx("shrink-0 p-2 md:px-4 md:py-2 rounded-lg md:rounded-xl font-bold transition-all text-center md:text-left text-[10px] md:text-xs leading-tight break-words shadow-sm", activeCat === cat.id ? 'bg-brand-primary text-white' : 'bg-ui-bg text-ui-muted hover:bg-ui-border')} onClick={() => setActiveCat(cat.id)}>{cat.name}</button>
          ))}
        </div>

        {/* CENTER: PRODUCTS (Max Space, Compact Grid) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-ui-bg">
          <div className="relative shrink-0 p-3 pb-2 flex flex-col gap-2">
            <div className="relative flex-1">
              <ScanBarcode size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ui-muted" />
              <input id="product-search" ref={searchInputRef} type="text" placeholder="Search or scan barcode [F2]..." className="w-full pl-11 p-3 rounded-xl bg-ui-card border border-ui-border shadow-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all text-ui-text text-sm font-bold" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            
            {/* Quick Products Row removed */}
          </div>

          <div className="flex-1 overflow-y-auto p-3 pt-0 pb-24 md:pb-3 hide-scrollbar">
            {/* Grid layout from 2 to 5 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
            {filteredItems.map(item => {
              const cartItem = cart.find(c => c.id === item.id);
              const hasVariants = item.variants?.length > 0;
              const linkedRecipe = inventory.find(i => i.name === item.name);
              const isLowStock = linkedRecipe && linkedRecipe.currentStock <= linkedRecipe.minStock;
              
              return (
                <div key={item.id} className={clsx("bg-ui-card border rounded-xl p-2 shadow-sm hover:shadow-md cursor-pointer active:scale-95 transition-all select-none flex flex-col justify-between min-h-[85px] relative group", cartItem && !hasVariants ? "border-brand-primary bg-brand-primary/5" : "border-ui-border")} onClick={() => handleItemClick(item)}>
                  {isLowStock && <div className="absolute top-0 right-0 bg-brand-danger text-white text-[9px] font-black px-1.5 py-0.5 rounded-bl-lg z-10">⚠ Low</div>}
                  
                  {/* Intelligent wrapping instead of line-clamp */}
                  <div className="font-bold text-ui-text text-[13px] leading-snug pr-4 group-hover:text-brand-primary transition-colors">{item.name}</div>
                  
                  <div className="flex items-end justify-between mt-1">
                    <div className="text-[14px] font-black text-brand-primary tracking-tight">₹{item.sellingPrice}</div>
                    {hasVariants && <Tag size={10} className="text-brand-accent mb-0.5"/>}
                    {cartItem && !hasVariants && <div className="bg-brand-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">x{cartItem.qty}</div>}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>

        {/* Floating Cart Button for Mobile */}
        {!isCartOpen && (
          <button 
            className="md:hidden fixed bottom-20 right-4 bg-brand-primary text-white rounded-full p-4 shadow-xl z-40 flex items-center justify-center animate-bounce-short"
            onClick={() => setIsCartOpen(true)}
          >
            <div className="relative">
              <ShoppingCart size={24} />
              {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-brand-danger text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-brand-primary">{cart.reduce((a,c)=>a+c.qty,0)}</span>}
            </div>
          </button>
        )}

        {/* RIGHT: CART & SUMMARY (30-35% width, max 400px) */}
        <div className={clsx(
          "w-full md:w-[320px] xl:w-[350px] bg-ui-card border-l border-ui-border shadow-sm flex flex-col h-full shrink-0 z-50 transition-transform duration-300 md:transform-none fixed md:relative right-0 top-0 bottom-0",
          isCartOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        )}>
          
          <div className="p-3 border-b border-ui-border bg-ui-bg shrink-0 flex justify-between items-center">
            {/* Mobile Close Cart */}
            <button onClick={() => setIsCartOpen(false)} className="md:hidden w-10 h-10 bg-ui-card border border-ui-border rounded-xl flex items-center justify-center text-ui-muted mr-2 hover:bg-ui-border"><X size={16}/></button>
             <div className="flex gap-1 p-1 bg-ui-card rounded-xl border border-ui-border shadow-sm flex-1 mr-2">
              {['Dine In', 'Takeaway', 'Delivery'].map(type => (
                <button key={type} onClick={() => setOrderType(type)} className={clsx("flex-1 text-xs font-bold py-2 rounded-lg transition-colors", orderType === type ? 'bg-brand-primary text-white shadow-sm' : 'text-ui-muted hover:text-ui-text hover:bg-ui-bg')}>{type}</button>
              ))}
            </div>
            {/* Clear Cart Button separated out to top right */}
            <button onClick={() => clearCart()} disabled={cart.length === 0} className="w-10 h-10 bg-ui-card border border-ui-border rounded-xl flex items-center justify-center text-ui-muted hover:text-brand-danger hover:border-brand-danger/30 transition-colors disabled:opacity-50"><Trash2 size={16}/></button>
          </div>

          {/* Customer */}
          <div className="px-4 py-3 border-b border-ui-border bg-ui-card shrink-0">
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-muted" />
                  <input
                    id="customer-search"
                    type="text"
                    placeholder="Customer (F3)..."
                    value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); if (!e.target.value) setCustomer(null); }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text text-sm"
                  />
                </div>
                <button onClick={() => setIsCustomerOpen(true)} className="bg-brand-primary text-white px-3 rounded-xl hover:bg-brand-primary/90 transition-colors shadow-sm"><UserPlus size={16}/></button>
              </div>
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-ui-card border border-ui-border rounded-xl shadow-float z-[60] overflow-hidden">
                  {!customerSearch && <div className="px-4 py-1.5 bg-ui-bg text-[10px] font-bold text-ui-muted uppercase tracking-wider">Recent Customers</div>}
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
              {customer && (
                <div className="mt-2 bg-brand-primary/5 border border-brand-primary/20 p-2.5 rounded-xl flex justify-between items-center shadow-inner">
                  <div>
                    <div className="font-bold text-brand-primary text-sm leading-tight">{customer.name}</div>
                    <div className="text-xs text-ui-muted font-medium">{customer.mobile}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-brand-warning flex items-center justify-end gap-1"><Award size={12}/> {customer.loyaltyPoints} pts</div>
                    <div className="text-xs font-medium text-ui-muted">Visits: {customer.visits || 1}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cart Items or Live Dashboard */}
          <div className="flex-1 overflow-y-auto p-3 hide-scrollbar bg-ui-bg space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col h-full items-center justify-center space-y-4 opacity-30">
                 <ShoppingCart size={48} />
                 <div className="text-center">
                    <p className="font-bold text-lg">Cart is empty</p>
                    <p className="text-xs font-medium">Search or select items to begin</p>
                 </div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.cartId || (item.id + '-' + item.name)} className="flex flex-col bg-ui-card p-2.5 rounded-xl border border-ui-border shadow-sm group relative">
                  <div className="flex justify-between items-start mb-1.5 pr-2">
                    <span className="font-bold text-ui-text text-sm leading-tight">{item.name}</span>
                    <span className="font-black text-ui-text text-sm tracking-tight">₹{(item.sellingPrice * item.qty).toFixed(2)}</span>
                  </div>
                  {item.notes && <div className="text-xs text-brand-warning font-bold mb-1.5 line-clamp-1 italic text-ellipsis">📝 {item.notes}</div>}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ui-muted bg-ui-bg px-2 py-1 rounded-md border border-ui-border">₹{item.sellingPrice} × {item.qty}</span>
                      <button onClick={() => { setNoteItem(item); setNoteText(item.notes || ''); }} className="text-ui-muted hover:text-brand-primary p-1 bg-ui-bg rounded-md border border-ui-border transition-colors"><MessageSquare size={14}/></button>
                    </div>
                    <div className="flex items-center gap-0.5 bg-ui-bg rounded-lg border border-ui-border p-0.5 shadow-sm">
                      <button className="w-7 h-7 rounded-md flex items-center justify-center text-ui-muted hover:bg-brand-danger/10 hover:text-brand-danger transition-colors active:scale-95" onClick={() => updateQty(item.cartId || (item.id + '-' + item.name), item.qty - 1)}><Minus size={14}/></button>
                      <span className="font-bold w-6 text-center text-ui-text text-sm">{item.qty}</span>
                      <button className="w-7 h-7 rounded-md flex items-center justify-center text-ui-muted hover:bg-brand-primary/10 hover:text-brand-primary transition-colors active:scale-95" onClick={() => updateQty(item.cartId || (item.id + '-' + item.name), item.qty + 1)}><Plus size={14}/></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sticky Total Summary & Actions */}
          <div className="bg-ui-card border-t border-ui-border pb-safe shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <div className="p-3">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => handleCheckout('', true)} disabled={cart.length === 0} className="bg-orange-500/10 text-orange-600 border border-orange-500/20 py-2.5 rounded-xl font-black text-xs hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5"><Pause size={14}/><span>Hold [F4]</span></button>
                <button onClick={() => setIsDiscountOpen(true)} disabled={cart.length === 0} className="bg-green-500/10 text-green-600 border border-green-500/20 py-2.5 rounded-xl font-black text-xs hover:bg-green-500 hover:text-white transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5"><Percent size={14}/><span>Disc [F5]</span></button>
              </div>

              <div className="space-y-1 mb-2 bg-ui-bg p-2 rounded-xl border border-ui-border text-xs">
                <div className="flex justify-between font-bold text-ui-muted"><span>Items</span><span>{cart.reduce((s,i)=>s+i.qty,0)}</span></div>
                <div className="flex justify-between font-bold text-ui-muted"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                {(discountAmt - (redeemPts * ptVal)) > 0 && <div className="flex justify-between text-green-600 font-bold"><span>Discount</span><span>-₹{(discountAmt - (redeemPts * ptVal)).toFixed(2)}</span></div>}
                {redeemPts > 0 && <div className="flex justify-between text-orange-500 font-bold"><span>Points</span><span>-₹{(redeemPts * ptVal).toFixed(2)}</span></div>}
              </div>

              <div className="flex justify-between items-end mb-3 px-1">
                <span className="text-lg font-black text-ui-muted">TOTAL</span>
                <span className="text-4xl font-black text-brand-primary tracking-tighter leading-none drop-shadow-sm">₹{finalTotal.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button disabled={cart.length === 0} className="bg-brand-accent text-white py-3 rounded-xl font-black flex flex-col items-center justify-center shadow-lg active:scale-95 disabled:opacity-50 transition-all hover:bg-brand-accent/90" onClick={() => handleCheckout('CASH')}>
                  <Banknote size={20} className="mb-0.5"/><span className="text-[11px] uppercase tracking-wider">Cash</span>
                </button>
                <button disabled={cart.length === 0} className="bg-brand-primary text-white py-3 rounded-xl font-black flex flex-col items-center justify-center shadow-lg active:scale-95 disabled:opacity-50 transition-all hover:bg-brand-primary/90" onClick={() => handleCheckout('UPI')}>
                  <Smartphone size={20} className="mb-0.5"/><span className="text-[11px] uppercase tracking-wider">UPI</span>
                </button>
                <button disabled={cart.length === 0} className="bg-ui-bg text-ui-text border-2 border-ui-border py-3 rounded-xl font-black flex flex-col items-center justify-center shadow-sm active:scale-95 disabled:opacity-50 transition-all hover:border-brand-primary/30 hover:bg-brand-primary/5" onClick={() => setIsSplitOpen(true)}>
                  <SplitSquareHorizontal size={20} className="mb-0.5"/><span className="text-[11px] uppercase tracking-wider">Split</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      {/* CHECKOUT PROMPT MODAL */}
      {checkoutPrompt && (
        <div className="fixed inset-0 bg-ui-bg/90 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-ui-card border border-ui-border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center">
            <h2 className="text-xl font-bold text-ui-text mb-4">Complete Order</h2>
            <p className="text-ui-muted text-sm font-medium mb-6">Order saved successfully! Would you like to print a receipt or KOT before continuing?</p>
            <div className="space-y-3">
              <button onClick={() => finalizeCheckout(checkoutPrompt.paymentMode, checkoutPrompt.hold, checkoutPrompt.splitData, 'INVOICE')} className="w-full p-4 rounded-xl font-bold bg-brand-primary text-white hover:bg-brand-primary/90 flex justify-center items-center gap-2 shadow-sm"><Printer size={18} /> Print Invoice</button>
              <button onClick={() => finalizeCheckout(checkoutPrompt.paymentMode, checkoutPrompt.hold, checkoutPrompt.splitData, 'KOT')} className="w-full p-4 rounded-xl font-bold bg-brand-accent text-white hover:bg-brand-accent/90 flex justify-center items-center gap-2 shadow-sm"><ClipboardList size={18} /> Print KOT</button>
              <button onClick={() => finalizeCheckout(checkoutPrompt.paymentMode, checkoutPrompt.hold, checkoutPrompt.splitData, 'NONE')} className="w-full p-4 rounded-xl font-bold bg-ui-bg border border-ui-border text-ui-text hover:bg-ui-border flex justify-center items-center gap-2 transition-all"><Check size={18} /> No, Execute Order</button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK NOTES MODAL */}
      {noteItem && (
        <div className="fixed inset-0 bg-ui-bg/90 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-ui-card border border-ui-border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-ui-border flex justify-between items-center bg-ui-bg">
              <h2 className="text-lg font-bold text-ui-text">Add Note to {noteItem.name}</h2>
              <button className="text-ui-muted hover:text-ui-text" onClick={() => setNoteItem(null)}><X size={20}/></button>
            </div>
            <div className="p-5 space-y-4">
               <input type="text" autoFocus value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Type custom note..." className="w-full p-4 rounded-xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-sm text-ui-text"/>
               
               <div className="grid grid-cols-2 gap-2">
                 {['Less Sugar', 'No Sugar', 'No Ice', 'Extra Ice', 'Extra Chocolate', 'Thick Shake'].map(preset => (
                    <button key={preset} type="button" onClick={() => applyNote(preset)} className="p-2 bg-ui-bg border border-ui-border rounded-xl text-xs font-bold text-ui-muted hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/30 transition-colors">{preset}</button>
                 ))}
               </div>
               
               <button onClick={saveNote} className="w-full bg-brand-primary text-white p-3 rounded-xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all text-sm mt-2">Save Note</button>
            </div>
          </div>
        </div>
      )}


      {/* HELD BILLS MODAL */}
      {isHeldOpen && (
        <div className="fixed inset-0 bg-ui-bg/90 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-ui-card border border-ui-border w-full max-w-md p-6 rounded-3xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ui-text">Held Bills</h2>
              <button onClick={() => setIsHeldOpen(false)} className="text-ui-muted hover:text-ui-text bg-ui-bg p-2 rounded-full"><X size={20}/></button>
            </div>
            <div className="overflow-y-auto space-y-3 flex-1 hide-scrollbar">
              {heldOrders.length === 0 ? (
                <div className="text-center text-ui-muted py-8 font-bold text-sm bg-ui-bg rounded-2xl border border-ui-border border-dashed">No held bills.</div>
              ) : heldOrders.map(h => (
                <div key={h.id} className="bg-ui-card border border-ui-border p-4 rounded-2xl flex justify-between items-center shadow-sm">
                  <div>
                    <div className="font-bold text-ui-text text-sm mb-1">{h.customerName} <span className="text-xs bg-ui-bg px-2 py-0.5 rounded-md text-ui-muted ml-2">{h.orderType}</span></div>
                    <div className="text-xs font-bold text-ui-muted">{new Date(h.date).toLocaleTimeString()} • {h.items.length} items</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-black text-brand-primary">₹{h.total.toFixed(2)}</div>
                    <button onClick={() => handleResumeBill(h)} className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold shadow-sm active:scale-95 text-sm">Resume</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                <button key={i} onClick={() => handleVariantSelect(v)} className="w-full flex justify-between items-center p-4 bg-ui-bg border border-ui-border rounded-2xl hover:border-brand-primary hover:bg-brand-primary/5 active:scale-95 transition-all group shadow-sm">
                  <span className="font-bold text-ui-text group-hover:text-brand-primary text-sm">{v.name}</span>
                  <span className="text-xl font-black text-brand-primary">₹{v.price}</span>
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
              <input type="text" required value={newCusName} onChange={e => setNewCusName(e.target.value)} placeholder="Customer Name" className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text text-sm" />
              <input type="tel" required value={newCusMobile} onChange={e => setNewCusMobile(e.target.value)} placeholder="Mobile Number" className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text text-sm" />
            </div>
            <button type="submit" className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all shadow-sm">Save Customer</button>
          </form>
        </div>
      )}

      {/* SPLIT PAYMENT MODAL */}
      {isSplitOpen && (
        <div className="fixed inset-0 bg-ui-bg/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-ui-card border border-ui-border rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ui-text flex items-center gap-2"><SplitSquareHorizontal size={20}/> Split Payment</h2>
              <button className="text-ui-muted bg-ui-bg p-2 rounded-full hover:text-ui-text" onClick={() => setIsSplitOpen(false)}><X size={16}/></button>
            </div>
            <div className="text-center mb-6 bg-ui-bg py-4 rounded-2xl border border-ui-border">
              <p className="text-ui-muted text-xs font-bold uppercase tracking-wider mb-1">Total Bill</p>
              <p className="text-4xl font-black text-ui-text tracking-tighter">₹{finalTotal.toFixed(2)}</p>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-ui-muted flex items-center gap-1.5 mb-2 uppercase tracking-wider"><Banknote size={14}/> Cash Amount</label>
                <input type="number" value={splitCash} onChange={e => setSplitCash(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-black text-2xl text-ui-text" placeholder="0"/>
              </div>
              <div>
                <label className="text-xs font-bold text-ui-muted flex items-center gap-1.5 mb-2 uppercase tracking-wider"><Smartphone size={14}/> UPI Amount</label>
                <input type="number" value={splitUpi} onChange={e => setSplitUpi(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-black text-2xl text-ui-text" placeholder="0"/>
              </div>
            </div>
            <button onClick={() => handleCheckout('SPLIT', false, { cash: parseFloat(splitCash || 0), upi: parseFloat(splitUpi || 0) })} className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all text-lg">Confirm Split Pay</button>
          </div>
        </div>
      )}

      {/* DISCOUNT MODAL */}
      {isDiscountOpen && (
        <div className="fixed inset-0 bg-ui-bg/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-ui-card border border-ui-border rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ui-text flex items-center gap-2"><Percent size={20}/> Add Discount</h2>
              <button className="text-ui-muted bg-ui-bg p-2 rounded-full hover:text-ui-text" onClick={() => setIsDiscountOpen(false)}><X size={16}/></button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-ui-muted uppercase tracking-wider block mb-2">Percentage (%)</label>
                <input type="number" autoFocus value={discPercent} onChange={e => { setDiscPercent(e.target.value); setDiscFixed(''); }} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-black text-xl text-ui-text" placeholder="0"/>
              </div>
              <div className="text-center font-bold text-ui-muted text-xs uppercase tracking-wider">— OR —</div>
              <div>
                <label className="text-xs font-bold text-ui-muted uppercase tracking-wider block mb-2">Flat Amount (₹)</label>
                <input type="number" value={discFixed} onChange={e => { setDiscFixed(e.target.value); setDiscPercent(''); }} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-black text-xl text-ui-text" placeholder="0"/>
              </div>
            </div>
            <button onClick={applyDiscount} className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all text-lg">Apply to Bill</button>
          </div>
        </div>
      )}
    
      {/* END SHIFT MODAL */}
      {showEndShift && activeShift && (() => {
        const expected = calculateExpectedCash();
        const diff = (parseFloat(actualCash)||0) - expected;
        const color = Math.abs(diff) === 0 ? 'text-green-500' : Math.abs(diff) < 50 ? 'text-orange-500' : 'text-red-500';
        return (
          <div className="fixed inset-0 bg-ui-bg/90 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="bg-ui-card w-full max-w-sm p-6 rounded-3xl shadow-2xl border border-ui-border">
              <h2 className="text-xl font-bold mb-4 text-ui-text">Close Drawer (End Shift)</h2>
              <div className="bg-ui-bg p-4 rounded-2xl border border-ui-border mb-6 space-y-3 text-sm font-medium">
                <div className="flex justify-between text-ui-muted"><span>Opening Cash:</span><span className="font-bold text-ui-text">₹{activeShift.openingCash}</span></div>
                {user?.role === 'owner' ? <div className="flex justify-between text-ui-text font-bold"><span>Expected Cash:</span><span className="font-black text-brand-primary text-lg">₹{expected}</span></div> : <div className="flex justify-between text-brand-primary font-bold"><span>Expected Cash:</span><span>HIDDEN (Blind Close)</span></div>}
              </div>
              <form onSubmit={handleEndShift} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-ui-muted uppercase tracking-wider mb-2 block">Actual Cash Counted (₹)</label>
                  <input type="number" required autoFocus value={actualCash} onChange={e=>setActualCash(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border-2 border-brand-primary/20 focus:ring-2 focus:border-brand-primary focus:ring-brand-primary outline-none font-black text-ui-text text-3xl text-center" />
                </div>
                {actualCash !== '' && user?.role === 'owner' && (
                  <div className={`flex justify-between items-center font-bold text-lg bg-ui-bg p-3 rounded-xl border border-ui-border ${color}`}>
                    <span className="text-sm">Difference:</span>
                    <span>{diff > 0 ? '+' : ''}₹{diff.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowEndShift(false)} className="flex-1 p-4 rounded-2xl font-bold bg-ui-bg text-ui-text border border-ui-border hover:bg-ui-border active:scale-95 transition-all">Cancel</button>
                  <button type="submit" className="flex-1 p-4 rounded-2xl font-bold bg-brand-danger text-white shadow-lg active:scale-95 transition-all text-lg">Close Register</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
