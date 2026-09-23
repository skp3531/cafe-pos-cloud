const fs = require('fs');

let code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf-8');

// Remove the Shift Management Block
code = code.replace(
  /\{\/\* SHIFT MANAGEMENT BLOCK \*\/\}.*?<\/div>\n      <\/div>/s,
  ""
);

fs.writeFileSync('src/pages/Dashboard.jsx', code);
