const fs = require('fs');

function updateFile(file) {
  let code = fs.readFileSync(file, 'utf-8');
  
  if (!code.includes("import { printOrderReceipt } from '../utils/printUtils';")) {
    code = code.replace("import { db } from '../db/db';", "import { db } from '../db/db';\nimport { printOrderReceipt } from '../utils/printUtils';");
  }

  // We need to replace the entire printReceipt function.
  // A regex can be tricky due to brackets. Let's find index.
  const start = code.indexOf("const printReceipt = async (order, cName) => {");
  if (start !== -1) {
    let end = code.indexOf("};", start);
    // Find the NEXT }; which closes the function
    // But there are multiple }; inside.
    const searchStr = `    }, 1000);
  }, 500);
};`;
    end = code.indexOf(searchStr, start);
    if (end !== -1) {
       end += searchStr.length;
       const oldFunc = code.substring(start, end);
       const newFunc = "const printReceipt = async (order, cName) => { await printOrderReceipt(order, cName); };";
       code = code.replace(oldFunc, newFunc);
       fs.writeFileSync(file, code);
       console.log(`Updated ${file}`);
    } else {
       console.log(`Could not find end of printReceipt in ${file}`);
    }
  } else {
    console.log(`Could not find start of printReceipt in ${file}`);
  }
}

updateFile('src/pages/Billing.jsx');
updateFile('src/pages/Orders.jsx');
