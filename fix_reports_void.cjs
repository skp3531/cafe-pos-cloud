const fs = require('fs');

let code = fs.readFileSync('src/pages/Reports.jsx', 'utf-8');

code = code.replace(
  "const refunds = fSales.filter(s => s.status === 'REFUNDED').reduce((acc, s) => acc + s.total, 0);",
  "const refunds = fSales.filter(s => s.status === 'REFUNDED' || s.status === 'VOIDED').reduce((acc, s) => acc + s.total, 0);"
);

code = code.replace(
  "fSales.filter(s => s.status !== 'REFUNDED').forEach(s => {",
  "fSales.filter(s => s.status !== 'REFUNDED' && s.status !== 'VOIDED').forEach(s => {"
);
code = code.replace(
  "fSales.filter(s => s.status !== 'REFUNDED').forEach(s => {",
  "fSales.filter(s => s.status !== 'REFUNDED' && s.status !== 'VOIDED').forEach(s => {"
);

fs.writeFileSync('src/pages/Reports.jsx', code);
