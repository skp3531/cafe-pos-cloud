const fs = require('fs');
let file = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

// Add Pencil to imports
file = file.replace(/Trash2, Printer/, 'Trash2, Printer, Pencil');

// Fix the replace
const staffActionReplace = `
                     <div className="flex gap-3">
                       <button onClick={() => startEditStaff(u)} className="text-ui-muted hover:text-brand-primary transition-colors"><Pencil size={18}/></button>
                       <button onClick={() => handleDeleteStaff(u.id)} className="text-brand-danger hover:text-brand-danger/70 transition-colors"><Trash2 size={18}/></button>
                     </div>
`;
file = file.replace(
  /<button onClick=\{\(\) => handleDeleteStaff\(u\.id\)\} className="text-brand-danger hover:text-brand-danger\/70 transition-colors"><Trash2 size=\{18\}\/><\/button>/,
  staffActionReplace.trim()
);

fs.writeFileSync('src/pages/Settings.jsx', file);
