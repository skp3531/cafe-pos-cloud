const fs = require('fs');
let code = fs.readFileSync('src/pages/Billing.jsx', 'utf-8');

code = code.replace("import { Lock, useLiveQuery } from 'dexie-react-hooks';", "import { useLiveQuery } from 'dexie-react-hooks';");
if (!code.includes("Lock,")) {
  code = code.replace("import { Trash2", "import { Lock, Trash2");
}

fs.writeFileSync('src/pages/Billing.jsx', code);
