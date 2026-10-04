import { create } from 'zustand';
import { db } from '../db/firebase';
import { collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';

const useDataStore = create((set) => ({
  sales: [],
  expenses: [],
  purchases: [],
  items: [],
  day_closing: [],
  audit_logs: [],
  users: [],
  settings: {},
  customers: [],
  categories: [],
  suppliers: [],
  loyalty_transactions: [],
  stock_audits: [],
  attendance: [],
  isLoaded: false,

  initSync: () => {
    const unsubscribes = [];

    // Settings (stored as documents in a settings collection)
    const settingsUnsub = onSnapshot(collection(db, 'settings'), (snapshot) => {
      const settingsObj = {};
      snapshot.forEach(doc => {
        settingsObj[doc.id] = doc.data();
      });
      set({ settings: settingsObj });
    });
    unsubscribes.push(settingsUnsub);

    const collections = [
      'sales', 'expenses', 'purchases', 'items', 'day_closing', 
      'audit_logs', 'users', 'customers', 'categories', 'inventory_categories', 'suppliers', 
      'loyalty_transactions', 'stock_audits', 'attendance', 'inventory', 'inventory_logs', 'recipes', 'employees', 'payroll', 'salary_slips', 'shifts', 'held_orders'
    ];

    collections.forEach(colName => {
      // Basic limit to prevent massive memory overload on client
      // For a real production app, pagination should be used.
      // But for a POS replacing Dexie, pulling 1000 latest records is fine for dashboard.
      let q = query(collection(db, colName));
      
      // Let's not limit for now, wait let's just sync all for simplicity (like Dexie)
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        set({ [colName]: data });
      });
      unsubscribes.push(unsub);
    });

    set({ isLoaded: true });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }
}));

export default useDataStore;
