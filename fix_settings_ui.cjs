const fs = require('fs');
let file = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

// 1. Make sure 'print' tab exists in the UI.
// The previous script may not have replaced it correctly.
const buttonsRegex = /<div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm mb-6 max-w-xl overflow-x-auto hide-scrollbar shrink-0">[\s\S]*?<\/div>/;

file = file.replace(
  /<div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm mb-6 overflow-x-auto hide-scrollbar shrink-0">[\s\S]*?<\/div>/g, 
  ""
);
file = file.replace(
  /<div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm mb-6 overflow-x-auto hide-scrollbar">[\s\S]*?<\/div>/g, 
  ""
);

// Manually insert the tab bar right after `<h1 className="text-3xl font-bold text-ui-text tracking-tight mb-8 shrink-0">Settings</h1>`
const tabBar = `
      <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm mb-6 overflow-x-auto hide-scrollbar shrink-0">
        {['profile', 'loyalty', 'staff', 'print', 'backup'].map(tab => (
          <button key={tab} className={clsx("px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap capitalize", activeTab === tab ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab(tab)}>
            {tab === 'profile' ? 'Business Profile' : tab === 'print' ? 'Print Settings' : tab === 'staff' ? 'Staff & Access' : tab}
          </button>
        ))}
      </div>
`;
file = file.replace(
  `<h1 className="text-3xl font-bold text-ui-text tracking-tight mb-8 shrink-0">Settings</h1>`,
  `<h1 className="text-3xl font-bold text-ui-text tracking-tight mb-8 shrink-0">Settings</h1>\n${tabBar}`
);

// 2. Show permissions for existing users
const userItemReplace = `
                     <div>
                       <span className="font-bold text-ui-text block">{u.name}</span>
                       <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">{u.role}</span>
                     </div>
`;
const userItemWithPerms = `
                     <div>
                       <span className="font-bold text-ui-text block">{u.name}</span>
                       <div className="flex items-center gap-2 mt-1 flex-wrap">
                         <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider bg-brand-primary/10 px-2 py-0.5 rounded">{u.role}</span>
                         {u.role !== 'owner' && u.permissions?.map(p => (
                           <span key={p} className="text-[10px] font-bold text-ui-muted uppercase tracking-wider border border-ui-border px-1.5 py-0.5 rounded">{p}</span>
                         ))}
                       </div>
                     </div>
`;
file = file.replace(userItemReplace, userItemWithPerms.trim());

fs.writeFileSync('src/pages/Settings.jsx', file);
