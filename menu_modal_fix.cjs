const fs = require('fs');
let file = fs.readFileSync('src/pages/Menu.jsx', 'utf8');

// 1. Add state
file = file.replace(
  `const [activeTab, setActiveTab] = useState('items');`,
  `const [activeTab, setActiveTab] = useState('items');\n  const [isAddModalOpen, setIsAddModalOpen] = useState(false);`
);

// 2. Add button at top of items tab
const itemsHeader = `
        <div className="w-full">
          <div className="w-full flex flex-col h-fit">
            <div className="mb-6 flex justify-between items-center gap-3">
              <div className="flex overflow-x-auto pb-2 gap-3 hide-scrollbar shrink-0 flex-1">
                <button className={clsx("px-5 py-2.5 rounded-2xl whitespace-nowrap font-semibold transition-all shadow-sm", activeCatFilter === 'all' ? 'bg-brand-primary text-white' : 'bg-ui-card text-ui-muted hover:bg-ui-border')} onClick={() => setActiveCatFilter('all')}>All Items</button>
                {categories.map(cat => (
                  <button key={cat.id} className={clsx("px-5 py-2.5 rounded-2xl whitespace-nowrap font-semibold transition-all shadow-sm", activeCatFilter === cat.id ? 'bg-brand-primary text-white' : 'bg-ui-card text-ui-muted hover:bg-ui-border')} onClick={() => setActiveCatFilter(cat.id)}>{cat.name}</button>
                ))}
              </div>
              {canEdit && <button onClick={() => { resetItemForm(); setIsAddModalOpen(true); }} className="bg-brand-primary text-white px-5 py-2.5 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all whitespace-nowrap shrink-0">+ Add Item</button>}
            </div>
`;
file = file.replace(
  /<div className="w-full">\s*<div className="w-full flex flex-col h-fit">\s*<div className="mb-6 flex overflow-x-auto pb-2 gap-3 hide-scrollbar shrink-0">/,
  itemsHeader.trim()
);
// Also remove the old map logic if the regex was incomplete:
file = file.replace(
  /<button className=\{clsx\("px-5 py-2\.5 rounded-2xl whitespace-nowrap font-semibold transition-all shadow-sm", activeCatFilter === 'all'.*?<\/button>\s*\{categories\.map\(cat => \(\s*<button key=\{cat\.id\}.*?<\/button>\s*\)\)\}\s*<\/div>/,
  ''
);

// 3. Make startEditItem open the modal
file = file.replace(
  `setEditingItemId(item.id);`,
  `setEditingItemId(item.id); setIsAddModalOpen(true);`
);

// 4. Update form to be a modal
// Current form starts with `<div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm sticky top-6 space-y-4">`
// We need to wrap it in our modal overlay.

const modalOverlayStart = `
          {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-ui-card w-full max-w-lg rounded-3xl border border-ui-border shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-ui-border shrink-0">
                  <h2 className="text-xl font-bold text-ui-text">{editingItemId ? 'Edit Item' : 'Add New Item'}</h2>
                  <button onClick={() => { setIsAddModalOpen(false); resetItemForm(); }} className="text-ui-muted hover:text-ui-text p-1 bg-ui-bg rounded-lg"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto hide-scrollbar space-y-4">
`;
const modalOverlayEnd = `
                </div>
              </div>
            </div>
          )}
`;

// It ends before `{/* ── CATEGORIES TAB ── */}`
// The form ends with `</form>\n          </div>\n        </div>\n      )}`
// We replace the container div
file = file.replace(
  /<div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm sticky top-6 space-y-4">[\s\S]*?<h2 className="text-xl font-bold text-ui-text">\{editingItemId \? 'Edit Item' : 'Add New Item'\}<\/h2>[\s\S]*?<\/div>\s*<form onSubmit=\{handleAddOrUpdateItem\} className="space-y-3">/,
  `${modalOverlayStart}\n            <form onSubmit={(e) => { handleAddOrUpdateItem(e); setIsAddModalOpen(false); }} className="space-y-3">`
);

// Close the overlay
file = file.replace(
  /<\/form>\s*<\/div>\s*<\/div>\s*\)\}/,
  `</form>\n${modalOverlayEnd}\n        </div>\n      )}`
);

fs.writeFileSync('src/pages/Menu.jsx', file);
