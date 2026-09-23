const fs = require('fs');

function addImport(file) {
  let code = fs.readFileSync(file, 'utf-8');
  if (!code.includes("import { printOrderReceipt } from '../utils/printUtils';")) {
    code = code.replace(
      "import { db, generateInvoiceNumber } from '../db/db';",
      "import { db, generateInvoiceNumber } from '../db/db';\nimport { printOrderReceipt } from '../utils/printUtils';"
    );
    // if generateInvoiceNumber wasn't there (Orders.jsx)
    code = code.replace(
      "import { db } from '../db/db';",
      "import { db } from '../db/db';\nimport { printOrderReceipt } from '../utils/printUtils';"
    );
    fs.writeFileSync(file, code);
  }
}

addImport('src/pages/Billing.jsx');
addImport('src/pages/Orders.jsx');
