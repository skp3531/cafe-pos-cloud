const fs = require('fs');
let file = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

const newTabBar = `
      <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border mb-8 max-w-3xl shadow-sm shrink-0 overflow-x-auto hide-scrollbar">
        <button className={clsx("flex-1 px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap", activeTab === 'profile' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('profile')}>Business Profile</button>
        <button className={clsx("flex-1 px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap", activeTab === 'print' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('print')}>Print Layout</button>
        <button className={clsx("flex-1 px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap", activeTab === 'loyalty' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('loyalty')}>Loyalty</button>
        <button className={clsx("flex-1 px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap", activeTab === 'staff' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('staff')}>Staff & Access</button>
        <button className={clsx("flex-1 px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap", activeTab === 'backup' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab('backup')}>Backup & Sync</button>
      </div>
`;

file = file.replace(
  /<div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border mb-8 max-w-2xl shadow-sm shrink-0 overflow-x-auto hide-scrollbar">[\s\S]*?<\/div>/,
  newTabBar.trim()
);

fs.writeFileSync('src/pages/Settings.jsx', file);
