const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.jsx', 'utf-8');
code = code.replace(
  "import { FileText, Download",
  "import { useAuthStore } from '../store/useAuthStore';\nimport { FileText, Download"
);
fs.writeFileSync('src/pages/Reports.jsx', code);
