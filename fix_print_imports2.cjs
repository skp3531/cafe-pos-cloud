const fs = require('fs');

function updateFile(file) {
  let code = fs.readFileSync(file, 'utf-8');
  
  if (!code.includes("import { printOrderReceipt } from '../utils/printUtils';")) {
    code = code.replace("import { db } from '../db/db';", "import { db } from '../db/db';\nimport { printOrderReceipt } from '../utils/printUtils';");
  }

  const start = code.indexOf("const printReceipt = async (order, cName) => {");
  if (start !== -1) {
     let braces = 0;
     let end = -1;
     for (let i = start; i < code.length; i++) {
        if (code[i] === '{') braces++;
        if (code[i] === '}') {
           braces--;
           if (braces === 0) {
              end = i + 1;
              break;
           }
        }
     }
     
     if (end !== -1) {
       const oldFunc = code.substring(start, end);
       const newFunc = "const printReceipt = async (order, cName) => { await printOrderReceipt(order, cName); };";
       code = code.replace(oldFunc, newFunc);
       fs.writeFileSync(file, code);
       console.log(`Updated ${file}`);
     }
  }
}

updateFile('src/pages/Billing.jsx');
updateFile('src/pages/Orders.jsx');
