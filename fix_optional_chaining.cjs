const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf-8');
  code = code.replace(
    "db.shifts?.where('status').equals('active').first()",
    "db.shifts ? db.shifts.where('status').equals('active').first() : null"
  );
  code = code.replace(
    "db.shifts?.toArray()",
    "db.shifts ? db.shifts.toArray() : []"
  );
  fs.writeFileSync(file, code);
  console.log('Fixed', file);
}

fixFile('src/pages/Billing.jsx');
fixFile('src/pages/Dashboard.jsx');
fixFile('src/pages/Shifts.jsx');
