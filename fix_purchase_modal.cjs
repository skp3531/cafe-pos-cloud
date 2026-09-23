const fs = require('fs');
let file = fs.readFileSync('src/pages/Purchase.jsx', 'utf8');

// Add modal state for entry and supplier
file = file.replace(
  `const [activeTab, setActiveTab] = useState('entry');`,
  `const [activeTab, setActiveTab] = useState('entry');\n  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);\n  const [isSupModalOpen, setIsSupModalOpen] = useState(false);`
);

// We need X from lucide-react if not present
file = file.replace(
  `ArrowUpRight } from 'lucide-react';`,
  `ArrowUpRight, X } from 'lucide-react';`
);

// Also need auth store and permissions
const perms = `
  const user = useAuthStore(state => state.user);
  const canEdit = user?.role === 'owner' || user?.permissions?.includes('purchase_edit');
  const canDelete = user?.role === 'owner' || user?.permissions?.includes('purchase_delete');
`;
file = file.replace(
  `const purchases = useLiveQuery(() => db.purchases.orderBy('date').reverse().toArray()) || [];`,
  `const purchases = useLiveQuery(() => db.purchases.orderBy('date').reverse().toArray()) || [];\n${perms}`
);
if (!file.includes('useAuthStore')) {
  file = file.replace(
    `import { db } from '../db/db';`,
    `import { db } from '../db/db';\nimport { useAuthStore } from '../store/useAuthStore';`
  );
}

// Close modals on submit
file = file.replace(
  `setSupName(''); setSupMobile('');\n  };`,
  `setSupName(''); setSupMobile(''); setIsSupModalOpen(false);\n  };`
);
file = file.replace(
  `setSelectedInvId(''); setQty(''); setAmount(''); setMultiplier(1);\n  };`,
  `setSelectedInvId(''); setQty(''); setAmount(''); setMultiplier(1); setIsEntryModalOpen(false);\n  };`
);

// We want to add a "+ Supplier" button to Suppliers tab, and "+ Purchase" button to Entry tab
const supHeaderReplace = `
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-ui-text">Suppliers Directory</h2>
            {canEdit && <button onClick={() => setIsSupModalOpen(true)} className="bg-brand-primary text-white px-5 py-2.5 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all whitespace-nowrap">+ Add Supplier</button>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 h-fit">
`;
file = file.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">\s*<div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit">/,
  supHeaderReplace.trim()
);

const entryHeaderReplace = `
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-ui-text">Purchase History</h2>
            {canEdit && <button onClick={() => setIsEntryModalOpen(true)} className="bg-brand-primary text-white px-5 py-2.5 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all whitespace-nowrap">+ Purchase Entry</button>}
          </div>
`;
file = file.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">/,
  entryHeaderReplace.trim()
);

// Now wrap the actual forms in modals
const supFormReplace = `
          </div>
          
          {isSupModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-ui-card w-full max-w-sm rounded-3xl border border-ui-border shadow-2xl flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-ui-border shrink-0">
                  <h2 className="text-xl font-bold text-ui-text">New Supplier</h2>
                  <button onClick={() => setIsSupModalOpen(false)} className="text-ui-muted hover:text-ui-text p-1 bg-ui-bg rounded-lg"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto">
`;
file = file.replace(
  /<\/div>\s*<div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm h-fit sticky top-6">\s*<h2 className="text-xl font-bold mb-6 text-ui-text">New Supplier<\/h2>/,
  supFormReplace.trim()
);

// End Supplier form
file = file.replace(
  /<\/form>\s*<\/div>\s*<\/div>/,
  `</form>\n                </div>\n              </div>\n            </div>\n          )}\n        </div>`
);

// Replace Entry form container
const entryFormReplace = `
          {isEntryModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-ui-card w-full max-w-md rounded-3xl border border-ui-border shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-ui-border shrink-0">
                  <h2 className="text-xl font-bold text-ui-text">Purchase Entry</h2>
                  <button onClick={() => setIsEntryModalOpen(false)} className="text-ui-muted hover:text-ui-text p-1 bg-ui-bg rounded-lg"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto hide-scrollbar space-y-4">
`;

// Looking for Entry form start
file = file.replace(
  /<div className="lg:col-span-1 bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm h-fit">\s*<h2 className="text-xl font-bold mb-6 text-ui-text">Purchase Entry<\/h2>/,
  entryFormReplace.trim()
);

// End Entry form - Note: it's wrapped in `<div className="lg:col-span-2...` for history
// We need to replace the closing tags of the entry form, and then fix the container of history.
// Original structure:
// <div className="lg:col-span-1 ..."> form </div>
// <div className="lg:col-span-2 space-y-4"> history </div>
file = file.replace(
  /<\/form>\s*<\/div>\s*<div className="lg:col-span-2 space-y-4">/,
  `</form>\n                </div>\n              </div>\n            </div>\n          )}\n          <div className="w-full space-y-4">`
);


fs.writeFileSync('src/pages/Purchase.jsx', file);
