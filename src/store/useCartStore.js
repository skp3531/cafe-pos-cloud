import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  cart: [],
  customer: null,
  discountPercent: 0,
  discountFixed: 0,
  redeemPoints: 0,
  pointValue: 1,
  
  addItem: (item) => set((state) => {
    const cartItemId = item.cartId || (item.id + '-' + item.name);
    const existing = state.cart.find(i => (i.cartId || (i.id + '-' + i.name)) === cartItemId);
    
    if (existing) {
      return { 
        cart: state.cart.map(i => 
          (i.cartId || (i.id + '-' + i.name)) === cartItemId 
            ? { ...i, qty: i.qty + 1 } 
            : i
        ) 
      };
    }
    return { cart: [...state.cart, { ...item, cartId: cartItemId, qty: 1 }] };
  }),
  
  updateQty: (cartId, qty) => set((state) => {
    if (qty <= 0) {
      return { cart: state.cart.filter(i => (i.cartId || (i.id + '-' + i.name)) !== cartId) };
    }
    return { 
      cart: state.cart.map(i => 
        (i.cartId || (i.id + '-' + i.name)) === cartId 
          ? { ...i, qty } 
          : i
      ) 
    };
  }),
  
  removeItem: (cartId) => set((state) => ({ 
    cart: state.cart.filter(i => (i.cartId || (i.id + '-' + i.name)) !== cartId) 
  })),

  updateItemNotes: (cartId, notes) => set((state) => ({
    cart: state.cart.map(i => 
      (i.cartId || (i.id + '-' + i.name)) === cartId 
        ? { ...i, notes } 
        : i
    )
  })),
  
  clearCart: () => set({ cart: [], customer: null, discountPercent: 0, discountFixed: 0, redeemPoints: 0 }),
  
  setCustomer: (customer) => set({ customer, redeemPoints: 0 }),
  setDiscount: (percent, fixed) => set({ discountPercent: percent, discountFixed: fixed }),
  setRedeemPoints: (points, value) => set({ redeemPoints: points, pointValue: value }),
  
  getTotals: () => {
    const { cart, discountPercent, discountFixed, redeemPoints, pointValue } = get();
    const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.qty), 0);
    const pointsDiscount = redeemPoints * pointValue;
    const discountAmt = discountFixed + (subtotal * discountPercent / 100) + pointsDiscount;
    const total = subtotal - discountAmt;
    return { subtotal, discountAmt, total: Math.max(0, total) };
  }
}));
