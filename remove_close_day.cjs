const fs = require('fs');

let code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf-8');

code = code.replace(
  /<button onClick=\{\(\) => setIsDayCloseOpen\(true\)\}[\s\S]*?<\/button>/,
  ""
);

fs.writeFileSync('src/pages/Dashboard.jsx', code);
