const esbuild = require('esbuild');
const fs = require('fs');

async function check(file) {
  try {
    await esbuild.transform(fs.readFileSync(file, 'utf8'), { loader: 'jsx' });
    console.log(file, "OK");
  } catch (e) {
    console.error(file, "ERROR", e.message);
  }
}
check('src/pages/Dashboard.jsx');
check('src/pages/Billing.jsx');
