const fs = require('fs');

let file = fs.readFileSync('src/pages/Menu.jsx', 'utf8');

// 1. Add state for modal
file = file.replace(
  `const [activeCatFilter, setActiveCatFilter] = useState('All');`,
  `const [activeCatFilter, setActiveCatFilter] = useState('All');\n  const [isAddModalOpen, setIsAddModalOpen] = useState(false);`
);

// 2. Change grid item size from h-24 to h-16
file = file.replace(/h-24/g, 'h-16');

// 3. Instead of static sidebar form, use a modal overlay for the form.
// In Menu.jsx, the layout is probably:
// <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//   <div className="lg:col-span-2">...grid...</div>
//   <div className="bg-ui-card p-6 rounded-3xl...">...form...</div>
// </div>

// We need to find the <form onSubmit={handleSaveItem}> and wrap it in a modal, and add an "Add New Item" button in the header.
// Let's first add the Add New button
file = file.replace(
  `<div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm mb-6 w-fit mx-auto md:mx-0 overflow-x-auto hide-scrollbar">`,
  `<div className="flex justify-between items-center mb-6">
        <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm w-fit overflow-x-auto hide-scrollbar">
          {['Menu Items', 'Categories', 'Recipes'].map(tab => (
            <button key={tab} className={\`px-6 py-2 font-bold rounded-xl transition-all whitespace-nowrap \${activeTab === tab ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text'}\`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>
        {activeTab === 'Menu Items' && <button onClick={() => { resetItemForm(); setIsAddModalOpen(true); }} className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold hover:opacity-90">+ Add Item</button>}
      </div>
      <div className="hidden">` // Hide the original tabs code so we can just replace it
);

file = file.replace(
  `{['Menu Items', 'Categories', 'Recipes'].map(tab => (
            <button key={tab} className={clsx("px-6 py-2 font-bold rounded-xl transition-all whitespace-nowrap", activeTab === tab ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>`,
  `</div>`
); // close the hidden div


// Now we make the grid take full width: lg:col-span-2 -> lg:col-span-3 (or just remove the grid)
file = file.replace(/className="lg:col-span-2"/g, 'className="w-full"');
file = file.replace(/className="grid grid-cols-1 lg:grid-cols-3 gap-6"/g, 'className="w-full"');

// And we wrap the form in a modal
const formStart = `<form onSubmit={handleSaveItem}>`;
const modalStart = `
{isAddModalOpen && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-ui-card w-full max-w-md rounded-3xl border border-ui-border shadow-2xl flex flex-col max-h-[90vh]">
      <div className="flex justify-between items-center p-5 border-b border-ui-border">
        <h2 className="text-xl font-bold text-ui-text">{editingItemId ? 'Edit Item' : 'Add New Item'}</h2>
        <button onClick={() => {setIsAddModalOpen(false); resetItemForm();}} className="text-ui-muted hover:text-ui-text"><X size={20}/></button>
      </div>
      <div className="overflow-y-auto p-5">
        <form onSubmit={(e) => { handleSaveItem(e); setIsAddModalOpen(false); }}>
`;
file = file.replace(formStart, modalStart);

const formEnd = `</form>\n            </div>`;
const modalEnd = `</form>\n      </div>\n    </div>\n  </div>\n)}`;
file = file.replace(formEnd, modalEnd);

// Also need to make clicking edit open the modal
file = file.replace(
  `setEditingItemId(item.id);`,
  `setEditingItemId(item.id); setIsAddModalOpen(true);`
);

fs.writeFileSync('src/pages/Menu.jsx', file);
