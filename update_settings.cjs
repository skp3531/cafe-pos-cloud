const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.jsx', 'utf-8');

// Add import
code = code.replace(
  "import { Cloud, Download, Upload, Printer } from 'lucide-react';",
  "import { Cloud, Download, Upload, Printer } from 'lucide-react';\nimport PrintLayoutSettings from '../components/PrintLayoutSettings';"
);

// We need to replace the entire activeTab === 'print' block.
// Since it's large, we'll use a regex or string replacement.
const startStr = "{activeTab === 'print' && (";
const endStr = "          {activeTab === 'loyalty' && (";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const oldPrintBlock = code.substring(startIndex, endIndex);
  const newPrintBlock = "{activeTab === 'print' && (\n            <div className=\"mt-4\">\n              <PrintLayoutSettings />\n            </div>\n          )}\n\n          ";
  code = code.replace(oldPrintBlock, newPrintBlock);
  fs.writeFileSync('src/pages/Settings.jsx', code);
} else {
  console.log("Could not find print block bounds");
}
