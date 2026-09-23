const fs = require('fs');
let file = fs.readFileSync('src/pages/Employees.jsx', 'utf8');

file = file.replace(
  /description: .*/,
  "description: (payModal.type === 'advance' ? 'Advance' : 'Salary') + ' for ' + payModal.emp.name,"
);

fs.writeFileSync('src/pages/Employees.jsx', file);
