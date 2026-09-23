const fs = require('fs');
let file = fs.readFileSync('src/pages/Purchase.jsx', 'utf8');

// I need to close the form and modal right before the <div className="lg:col-span-2"> Purchase History </div> block
const toReplace = `</form>\n          </div>\n          \n          <div className="lg:col-span-2">`;
const replacement = `</form>\n                </div>\n              </div>\n            </div>\n          )}\n          <div className="w-full">`;

file = file.replace(toReplace, replacement);

fs.writeFileSync('src/pages/Purchase.jsx', file);
