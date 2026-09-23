const fs = require('fs');

let code = fs.readFileSync('src/db/db.js', 'utf-8');

code = code.replace(
  "db.on('versionchange', function(event) {\\n  db.close();\\n  window.location.reload();\\n});",
  "db.on('versionchange', function(event) {\\n  db.close();\\n});"
);
// wait, my replace might fail due to exact whitespace.
code = code.replace("window.location.reload();", "console.log('Database version changed. Connection closed.');");

fs.writeFileSync('src/db/db.js', code);
