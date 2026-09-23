const fs = require('fs');

function clean(file) {
  let c = fs.readFileSync(file, 'utf-8');
  c = c.replace(/<\/button>\}/g, "</button>");
  c = c.replace(/<\/div>\)\}/g, "</div>)}");
  // wait, } is valid if it closes the expression
  fs.writeFileSync(file, c);
}
clean('src/pages/Billing.jsx');
clean('src/pages/Expenses.jsx');
clean('src/pages/Purchase.jsx');
