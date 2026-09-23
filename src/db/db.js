import { addDoc, collection, updateDoc, deleteDoc, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';
import { db as firestore } from './firebase';
import useDataStore from '../store/useDataStore';
import { useState, useEffect } from 'react';

// Wait, we need a way to read from the store synchronously for the mock queries!
const getStoreCollection = (name) => {
    return useDataStore.getState()[name] || [];
};

class MockQuery {
    constructor(collectionName, dataArray) {
        this.collectionName = collectionName;
        this.data = dataArray || getStoreCollection(collectionName);
    }
    
    where(key) {
        this.filterKey = key;
        return this;
    }
    
    equals(val) {
        this.data = this.data.filter(item => item[this.filterKey] === val);
        return this;
    }
    
    notEqual(val) {
        this.data = this.data.filter(item => item[this.filterKey] !== val);
        return this;
    }
    
    aboveOrEqual(val) {
        this.data = this.data.filter(item => item[this.filterKey] >= val);
        return this;
    }
    
    startsWith(val) {
        this.data = this.data.filter(item => typeof item[this.filterKey] === 'string' && item[this.filterKey].startsWith(val));
        return this;
    }
    
    orderBy(key) {
        this.data = [...this.data].sort((a, b) => {
            if (a[key] < b[key]) return -1;
            if (a[key] > b[key]) return 1;
            return 0;
        });
        return this;
    }
    
    reverse() {
        this.data = [...this.data].reverse();
        return this;
    }
    
    limit(n) {
        this.data = this.data.slice(0, n);
        return this;
    }
    
    async toArray() {
        return this.data;
    }
    
    async count() {
        return this.data.length;
    }

    async first() {
        return this.data[0] || undefined;
    }
}

class MockCollection {
    constructor(name) {
        this.name = name;
    }
    
    async add(data) {
        data.id = data.id || Date.now();
        await setDoc(doc(firestore, this.name, data.id.toString()), data);
        return data.id;
    }
    
    async update(id, changes) {
        await updateDoc(doc(firestore, this.name, id.toString()), changes);
    }
    
    async delete(id) {
        await deleteDoc(doc(firestore, this.name, id.toString()));
    }
    
    async put(data, id) {
        const docId = id || data.id || Date.now();
        data.id = docId;
        await setDoc(doc(firestore, this.name, docId.toString()), data);
        return docId;
    }
    
    async get(id) {
        // First check in-memory store for instant resolve if possible
        const local = getStoreCollection(this.name).find(x => x.id === id || x.id === id?.toString() || x.id === Number(id));
        if (local) return local;
        
        // Fallback to firestore
        const d = await getDoc(doc(firestore, this.name, id.toString()));
        return d.exists() ? {id: d.id, ...d.data()} : undefined;
    }
    
    async bulkAdd(arr) {
        for (const item of arr) {
            await this.add(item);
        }
    }
    
    where(key) {
        return new MockQuery(this.name).where(key);
    }
    
    orderBy(key) {
        return new MockQuery(this.name).orderBy(key);
    }
    
    reverse() {
        return new MockQuery(this.name).reverse();
    }
    
    limit(n) {
        return new MockQuery(this.name).limit(n);
    }
    
    async toArray() {
        return new MockQuery(this.name).toArray();
    }
    
    async count() {
        return getStoreCollection(this.name).length;
    }
    
    toCollection() {
        return {
            modify: (fn) => {}
        };
    }
}

class MockDB {
    constructor() {
        this.categories = new MockCollection('categories');
        this.items = new MockCollection('items');
        this.recipes = new MockCollection('recipes');
        this.inventory = new MockCollection('inventory');
        this.inventory_logs = new MockCollection('inventory_logs');
        this.suppliers = new MockCollection('suppliers');
        this.purchases = new MockCollection('purchases');
        this.customers = new MockCollection('customers');
        this.sales = new MockCollection('sales');
        this.expenses = new MockCollection('expenses');
        this.settings = new MockCollection('settings');
        this.day_closing = new MockCollection('day_closing');
        this.users = new MockCollection('users');
        this.stock_audits = new MockCollection('stock_audits');
        this.audit_logs = new MockCollection('audit_logs');
        this.employees = new MockCollection('employees');
        this.attendance = new MockCollection('attendance');
        this.payroll = new MockCollection('payroll');
        this.salary_slips = new MockCollection('salary_slips');
        this.shifts = new MockCollection('shifts');
        this.held_orders = new MockCollection('held_orders');
    }
    
    on(event, cb) {
        // ignore
    }
    
    version() {
        return {
            stores: () => this,
            upgrade: () => this
        };
    }
    
    close() {}
}

export const db = new MockDB();

export function useLiveQuery(queryFn) {
    const store = useDataStore(); // re-renders component when store updates
    const [result, setResult] = useState(undefined);
    
    // We stringify the store briefly just to trigger effect if data actually changed, 
    // or we just depend on store object reference since Zustand creates a new reference.
    useEffect(() => {
        let isMounted = true;
        Promise.resolve(queryFn()).then(res => {
            if (isMounted) setResult(res);
        }).catch(err => {
            console.error("useLiveQuery error:", err);
            if (isMounted) setResult(undefined);
        });
        return () => { isMounted = false; };
    }, [store, queryFn]);
    
    return result;
}

export const generateInvoiceNumber = async () => {
  const profile = await db.settings.get('profile');
  const printAdvanced = await db.settings.get('printAdvanced');
  const printSettings = printAdvanced?.data || (await db.settings.get('print'));
  
  const prefix = profile?.terminalId || 'T1';
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayCount = (await db.sales.where('date').aboveOrEqual(todayStart.toISOString()).toArray()).length;
  
  const offset = parseInt(printSettings?.customInvoiceStart, 10);
  const seqVal = todayCount + (isNaN(offset) ? 1 : offset);
  const seq = String(seqVal).padStart(4, '0');
  
  const format = printSettings?.invoiceFormat || 'standard';
  if (format === 'short') return `${prefix}-${seq}`;
  if (format === 'minimal') return `${seq}`;
  return `${prefix}-${dateStr}-${seq}`;
};

export const hashPin = async (pin) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'neopos_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
