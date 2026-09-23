const fs = require('fs');

let code = fs.readFileSync('src/pages/Reports.jsx', 'utf-8');

// 1. Safe items mapping
code = code.replace(
  "sale.items.forEach(cartItem => {",
  "(sale.items || []).forEach(cartItem => {"
);

// 2. Safe revenue
code = code.replace(
  "map[creator].revenue += s.total;",
  "map[creator].revenue += (parseFloat(s.total) || 0);"
);

// 3. Safe totalAmount mapping for purchases (in Reports)
code = code.replace(
  "p.totalAmount.toFixed(2)",
  "(p.totalAmount || 0).toFixed(2)"
);
code = code.replace(
  "p.totalAmount.toFixed(2)",
  "(p.totalAmount || 0).toFixed(2)"
);
code = code.replace(
  "acc + p.totalAmount",
  "acc + (parseFloat(p.totalAmount) || 0)"
);

// 4. Safe sales mapping
code = code.replace(
  "r.total.toFixed(2)",
  "(r.total || 0).toFixed(2)"
);
code = code.replace(
  "s.total.toFixed(2)",
  "(s.total || 0).toFixed(2)"
);

fs.writeFileSync('src/pages/Reports.jsx', code);
