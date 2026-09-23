const fs = require('fs');
let dbjs = fs.readFileSync('src/db/db.js', 'utf8');

const v6Code = `
// v6: Audit Logs
db.version(6).stores({
  audit_logs: '++id, userId, userName, action, timestamp'
});
`;

if (!dbjs.includes('v6: Audit Logs')) {
  dbjs = dbjs.replace('// Generate invoice number', v6Code + '\n// Generate invoice number');
  fs.writeFileSync('src/db/db.js', dbjs);
  console.log("Added v6 audit_logs");
}
