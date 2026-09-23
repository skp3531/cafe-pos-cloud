const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.jsx', 'utf-8');
code = code.replace(
  "onSubmit={e => { e.preventDefault(); saveStaff(); }}",
  "onSubmit={handleAddStaff}"
);
fs.writeFileSync('src/pages/Settings.jsx', code);
