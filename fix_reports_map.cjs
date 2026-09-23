const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.jsx', 'utf-8');

code = code.replace(
  /\{s\.items\.map/g,
  "{(s.items || []).map"
);

code = code.replace(
  /\{r\.items\.map/g,
  "{(r.items || []).map"
);

fs.writeFileSync('src/pages/Reports.jsx', code);
