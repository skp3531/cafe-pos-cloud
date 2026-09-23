const fs = require('fs');
const esbuild = require('esbuild');

async function test() {
  try {
    const code = fs.readFileSync('src/pages/Billing.jsx', 'utf-8');
    await esbuild.transform(code, { loader: 'jsx' });
    console.log("esbuild transform OK");
  } catch (e) {
    console.error(e);
  }
}
test();
