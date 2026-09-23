const fs = require('fs');
let dbjs = fs.readFileSync('src/db/db.js', 'utf8');

const v7Code = `
// v7: Employee Management
db.version(7).stores({
  employees: '++id, name, phone, role, baseSalary, status',
  attendance: '++id, employeeId, date, status', // date like YYYY-MM-DD
  salary_payments: '++id, employeeId, date, amount, type' // type: 'salary', 'advance'
});
`;

if (!dbjs.includes('v7: Employee Management')) {
  dbjs = dbjs.replace('// Generate invoice number', v7Code + '\n// Generate invoice number');
  fs.writeFileSync('src/db/db.js', dbjs);
  console.log("Added v7 employee stores");
} else {
  console.log("v7 already exists");
}
