const fs = require('fs');

let code = fs.readFileSync('src/pages/Expenses.jsx', 'utf-8');

// Looking for the main container layout
// Currently it might be: `<div className="flex h-full flex-col">` or `<div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">`
// Usually pages have a wrapper. Let's see what it is.
if (code.includes('<div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">')) {
  // It's probably just not scrollable because the parent of this div in Layout.jsx has overflow hidden?
  // No, Layout.jsx has overflow-y-auto on the <main> block.
  // Wait, if it's overflowing with NO scrolling, maybe there's a fixed height somewhere.
  // Let's change the wrapper to ensure it scrolls.
  code = code.replace(
    '<div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">',
    '<div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 h-full overflow-y-auto hide-scrollbar pb-24">'
  );
}

fs.writeFileSync('src/pages/Expenses.jsx', code);
