const fs = require('fs');

// Fix Expenses
let eCode = fs.readFileSync('src/pages/Expenses.jsx', 'utf-8');
eCode = eCode.replace(/<button onClick=\{\(\) => handleDelete\(exp\.id\)\}/g, "{canDelete && <button onClick={() => handleDelete(exp.id)}");
eCode = eCode.replace(/<Trash2 size=\{18\}\/><\/button>\}/g, "<Trash2 size={18}/></button>}"); // If it matched twice
fs.writeFileSync('src/pages/Expenses.jsx', eCode);

// Fix Reports
let rCode = fs.readFileSync('src/pages/Reports.jsx', 'utf-8');
rCode = rCode.replace(
  "        [\n            {id: 'sales'",
  "        {[\n            {id: 'sales'"
);
rCode = rCode.replace(
  "         ].filter(t => user?.role === 'owner' || user?.permissions?.includes(t.perm)).map(tab => (",
  "         ].filter(t => user?.role === 'owner' || user?.permissions?.includes(t.perm)).map(tab => ("
);
// wait the end of map in reports might be missing the closing curly brace
// The old code had: ...].map(tab => (...))}`
// I only replaced the opening part! So the closing brace `}` should still be there at the end of the map.
fs.writeFileSync('src/pages/Reports.jsx', rCode);

