import React, { useState, useEffect } from 'react';
import { useLiveQuery } from '../db/db';
import { db } from '../db/db';
import { Plus, TrendingDown, Trash2, CalendarDays, Wallet, Settings } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function Expenses() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [filterMode, setFilterMode] = useState('today');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newCatModal, setNewCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const DEFAULT_CATEGORIES = ['Raw Materials', 'Salary', 'Utility Bill', 'Marketing', 'Maintenance', 'Petty Cash', 'Refund', 'Other'];
  
  const customCategories = useLiveQuery(() => db.settings.get('expenseCategories')) || { id: 'expenseCategories', list: [] };
  const EXPENSE_CATEGORIES = [...DEFAULT_CATEGORIES, ...(customCategories.list || [])];

  const allExpenses = useLiveQuery(() => db.expenses.reverse().toArray()) || [];

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!amount || !category) return;
    await db.expenses.add({ 
      date: new Date().toISOString(), 
      amount: parseFloat(amount), 
      category, 
      description,
      paymentMode 
    });
    setAmount(''); setCategory(''); setDescription(''); setPaymentMode('CASH');
    setShowAddModal(false);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    const currentList = customCategories.list || [];
    if (!EXPENSE_CATEGORIES.includes(newCatName)) {
      await db.settings.put({ id: 'expenseCategories', list: [...currentList, newCatName] });
    }
    setCategory(newCatName);
    setNewCatName('');
    setNewCatModal(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      await db.expenses.delete(id);
    }
  };

  // Filtering
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const expenses = allExpenses.filter(e => {
    const d = new Date(e.date);
    if (filterMode === 'today') return d >= startToday;
    if (filterMode === 'month') return d >= startMonth;
    return true; // all
  });

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const cashAmount = expenses.filter(e => !e.paymentMode || e.paymentMode === 'CASH').reduce((sum, e) => sum + e.amount, 0);
  const upiAmount = expenses.filter(e => e.paymentMode === 'UPI').reduce((sum, e) => sum + e.amount, 0);
  
  // Breakdown by Category
  const breakdown = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});
  const breakdownArr = Object.entries(breakdown).sort((a,b) => b[1] - a[1]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8 h-full overflow-y-auto hide-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-ui-text tracking-tight">Expenses</h1>
          <button onClick={() => setShowAddModal(true)} className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all flex items-center gap-2"><Plus size={18}/> Add Expense</button>
        </div>
        <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm">
          {[{id: 'today', label: 'Today'}, {id: 'month', label: 'This Month'}, {id: 'all', label: 'All Time'}].map(f => (
            <button key={f.id} onClick={() => setFilterMode(f.id)} className={clsx("px-4 py-2 text-sm font-bold rounded-xl transition-all", filterMode === f.id ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
          <div className="text-ui-muted text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><TrendingDown size={16}/> Total Expenses</div>
          <div className="text-3xl font-black text-brand-danger">₹{totalAmount.toFixed(2)}</div>
        </div>
        <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
          <div className="text-ui-muted text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Wallet size={16}/> Paid in Cash</div>
          <div className="text-2xl font-bold text-ui-text">₹{cashAmount.toFixed(2)}</div>
          <p className="text-xs font-medium text-brand-danger mt-1">Deducted from drawer</p>
        </div>
        <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
          <div className="text-ui-muted text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Wallet size={16}/> Paid via UPI/Bank</div>
          <div className="text-2xl font-bold text-ui-text">₹{upiAmount.toFixed(2)}</div>
          <p className="text-xs font-medium text-ui-muted mt-1">Direct from account</p>
        </div>
      </div>
      
      {/* Category Segregation */}
      {breakdownArr.length > 0 && (
        <div className="mb-8 bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
          <h2 className="text-sm font-bold text-ui-text mb-4 uppercase tracking-wider">Category Breakdown</h2>
          <div className="flex flex-wrap gap-4">
            {breakdownArr.map(([cat, amt]) => (
              <div key={cat} className="flex-1 min-w-[150px] bg-ui-bg p-4 rounded-2xl border border-ui-border">
                <div className="text-xs font-bold text-ui-muted uppercase mb-1">{cat}</div>
                <div className="text-lg font-bold text-ui-text">₹{amt.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-4 max-w-4xl mx-auto">
        {expenses.length === 0 && <div className="text-ui-muted text-center py-10 bg-ui-card rounded-3xl border border-ui-border border-dashed font-medium">No expenses recorded for this period.</div>}
        {expenses.map(exp => (
          <div key={exp.id} className="bg-ui-card p-5 rounded-3xl border border-ui-border shadow-sm flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-danger/10 text-brand-danger rounded-2xl flex items-center justify-center shrink-0"><TrendingDown size={24}/></div>
              <div>
                <h3 className="font-bold text-ui-text text-lg flex items-center gap-2">
                  {exp.category} 
                  <span className="text-[10px] bg-ui-bg text-ui-muted px-2 py-0.5 rounded uppercase border border-ui-border">{exp.paymentMode || 'CASH'}</span>
                </h3>
                <p className="text-ui-text text-sm font-medium mt-0.5">{exp.description || 'No description'}</p>
                <p className="text-ui-muted text-xs font-medium mt-1 flex items-center gap-1"><CalendarDays size={12}/> {format(new Date(exp.date), 'PPPP, p')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xl font-bold text-brand-danger text-right">-₹{exp.amount.toFixed(2)}</div>
              <button onClick={() => handleDelete(exp.id)} className="w-10 h-10 rounded-xl bg-brand-danger/10 text-brand-danger flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-danger hover:text-white shrink-0"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Add Expense Modal */}
      {showAddModal && !newCatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-ui-card w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6 text-ui-text">Record Expense</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-ui-muted uppercase ml-1 block">Expense Category</label>
                  <button type="button" onClick={() => setNewCatModal(true)} className="text-xs font-bold text-brand-primary hover:underline">Add Custom</button>
                </div>
                <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium appearance-none cursor-pointer">
                  <option value="" disabled>Select Category</option>
                  {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-ui-muted uppercase ml-1 mb-1 block">Total Amount</label>
                <input type="number" placeholder="₹0.00" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-bold text-xl" />
              </div>

              <div>
                <label className="text-xs font-bold text-ui-muted uppercase ml-1 mb-1 block">Payment Mode</label>
                <div className="flex bg-ui-bg p-1 rounded-2xl border border-ui-border">
                  {['CASH', 'UPI', 'CARD'].map(mode => (
                    <button key={mode} type="button" onClick={() => setPaymentMode(mode)} className={clsx("flex-1 py-2.5 text-sm font-bold rounded-xl transition-all", paymentMode === mode ? 'bg-ui-card text-brand-primary shadow-sm border border-ui-border' : 'text-ui-muted hover:text-ui-text')}>{mode}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ui-muted uppercase ml-1 mb-1 block">Description (Optional)</label>
                <textarea placeholder="What was this for?" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium resize-none h-24" />
              </div>

              <div className="flex gap-4 mt-8 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 p-4 rounded-2xl font-bold text-ui-muted bg-ui-bg hover:bg-ui-border transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Plus size={20}/> Save</button>
              </div>
            </form>
          </div>}
        </div>
      )}

      {/* Add Custom Category Modal */}
      {newCatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-ui-card w-full max-w-xs rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-ui-text">New Category</h2>
            <form onSubmit={handleAddCategory}>
              <input type="text" required placeholder="Category Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-bold mb-4" autoFocus />
              <div className="flex gap-2">
                <button type="button" onClick={() => setNewCatModal(false)} className="flex-1 p-3 rounded-xl font-bold text-ui-muted hover:bg-ui-bg">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-primary text-white p-3 rounded-xl font-bold hover:shadow-lg">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
