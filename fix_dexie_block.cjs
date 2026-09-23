const fs = require('fs');

let code = fs.readFileSync('src/db/db.js', 'utf-8');

if (!code.includes("db.on('versionchange'")) {
  code = code.replace(
    "export const db = new Dexie('RestaurantPOS');",
    "export const db = new Dexie('RestaurantPOS');\n\ndb.on('versionchange', function(event) {\n  db.close();\n  window.location.reload();\n});"
  );
}

fs.writeFileSync('src/db/db.js', code);
