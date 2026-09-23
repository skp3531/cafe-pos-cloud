const fs = require('fs');

let code = fs.readFileSync('src/pages/Employees.jsx', 'utf-8');

code = code.replace(
  /<button\s+onClick=\{\(\) => setIsDayCloseOpen\(true\)\}[\s\S]*?<\/button>/,
  ""
);

fs.writeFileSync('src/pages/Employees.jsx', code);
