const fs = require('fs');
let file = fs.readFileSync('src/pages/Expenses.jsx', 'utf8');

// 1. Add showAddModal state
file = file.replace(
  `const [filterMode, setFilterMode] = useState('today');`,
  `const [filterMode, setFilterMode] = useState('today');\n  const [showAddModal, setShowAddModal] = useState(false);`
);

// 2. Add "Add Expense" button to header
const headerRegex = /<h1 className="text-3xl font-bold text-ui-text tracking-tight">Expenses<\/h1>/;
const newHeader = `
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-ui-text tracking-tight">Expenses</h1>
          <button onClick={() => setShowAddModal(true)} className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all flex items-center gap-2"><Plus size={18}/> Add Expense</button>
        </div>
`;
file = file.replace(headerRegex, newHeader.trim());

// 3. Close modal on add
file = file.replace(
  `setAmount(''); setCategory(''); setDescription(''); setPaymentMode('CASH');`,
  `setAmount(''); setCategory(''); setDescription(''); setPaymentMode('CASH');\n    setShowAddModal(false);`
);

// 4. Change grid layout (remove the right column for the form)
// We have: <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// Let's make it 1 column
file = file.replace(
  `<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">\n        <div className="lg:col-span-2 space-y-4">`,
  `<div className="space-y-4 max-w-4xl">`
);

// 5. Remove the inline form and add the modal
const formCodeRegex = /<div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm h-fit sticky top-6">[\s\S]*?<\/div>\n      <\/div>/;

const modalCode = `
      </div>
      
      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-ui-card w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6 text-ui-text">Record Expense</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              
              <div>
                <label className="text-xs font-bold text-ui-muted uppercase ml-1 mb-1 block">Expense Category</label>
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
                <button type="submit" className="flex-1 bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Plus size={20}/> Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

file = file.replace(formCodeRegex, modalCode.trim());

// Add X icon to lucide-react if needed (we used Cancel button instead, so we don't strictly need X icon, but let's check imports)
// X is not imported, but Cancel button is fine.

fs.writeFileSync('src/pages/Expenses.jsx', file);
console.log("Updated Expenses to use Modal");
