const fs = require('fs');
let file = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

// I might have messed up replacing the button. Let's check where the buttons are rendered.
const buttons = `
          {['profile', 'loyalty', 'staff', 'print', 'backup'].map(tab => (
            <button key={tab} className={clsx("px-4 py-2 font-bold rounded-xl transition-all whitespace-nowrap capitalize", activeTab === tab ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')} onClick={() => setActiveTab(tab)}>
              {tab === 'profile' ? 'Business Profile' : tab === 'print' ? 'Print Settings' : tab === 'staff' ? 'Staff & Access' : tab}
            </button>
          ))}
`;

// Replace whatever is currently there for the tabs
// Original might have been mapped, or hardcoded buttons. Let's look for `<button className={clsx("flex-1 px-4 py-2...`
file = file.replace(
  /<div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm mb-6 overflow-x-auto hide-scrollbar">[\s\S]*?<\/div>/,
  `<div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm mb-6 overflow-x-auto hide-scrollbar">\n${buttons.trim()}\n        </div>`
);

fs.writeFileSync('src/pages/Settings.jsx', file);
