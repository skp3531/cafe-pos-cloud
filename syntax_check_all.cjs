const esbuild = require('esbuild');
const fs = require('fs');

async function check() {
  const files = ['src/pages/Billing.jsx', 'src/pages/Expenses.jsx', 'src/pages/Purchase.jsx', 'src/pages/Customers.jsx', 'src/pages/Orders.jsx', 'src/pages/Inventory.jsx', 'src/pages/Reports.jsx'];
  for (let file of files) {
    try {
      await esbuild.transform(fs.readFileSync(file, 'utf8'), { loader: 'jsx' });
      console.log(file, "OK");
    } catch (e) {
      console.error(file, "ERROR", e.message);
    }
  }
}
check();
