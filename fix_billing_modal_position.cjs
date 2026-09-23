const fs = require('fs');

let code = fs.readFileSync('src/pages/Billing.jsx', 'utf-8');

// I need to find the modal block and move it inside the main div.
// Or just wrap the whole return in a Fragment.
code = code.replace("return (", "return ( <>");
// Need to add closing fragment at the very end of the component.
const endBracket = code.lastIndexOf(");");
code = code.substring(0, endBracket) + "\n</>\n" + code.substring(endBracket);

fs.writeFileSync('src/pages/Billing.jsx', code);
