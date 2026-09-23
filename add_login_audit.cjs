const fs = require('fs');
let file = fs.readFileSync('src/components/LoginScreen.jsx', 'utf8');

file = file.replace(
  `login(user);`,
  `login(user);\n        db.audit_logs.add({ userId: user.id, userName: user.name, action: 'LOGIN', timestamp: new Date().toISOString() });`
);

fs.writeFileSync('src/components/LoginScreen.jsx', file);
console.log("Added login audit");
