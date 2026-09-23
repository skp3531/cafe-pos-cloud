const fs = require('fs');
let code = fs.readFileSync('src/pages/Shifts.jsx', 'utf-8');
code = code.replace(
  "db.shifts?.orderBy('startTime').reverse().toArray()",
  "db.shifts ? db.shifts.orderBy('startTime').reverse().toArray() : []"
);
fs.writeFileSync('src/pages/Shifts.jsx', code);
