const fs = require('fs');

let code = fs.readFileSync('src/pages/Billing.jsx', 'utf-8');

// Undo the <> at the top
code = code.replace("return ( <>", "return (");

// Remove the \n</>\n that I added near the end
code = code.replace("\n</>\n);", ");");
code = code.replace("\n</>\n  );", "  );");

// Let's just wrap the return block correctly
// I'll extract the modal code and put it inside the existing `<div className="flex h-full relative">`
const modalStart = code.indexOf("{/* HELD BILLS MODAL */}");
const relativeDiv = code.indexOf('<div className="flex h-full relative">');

if (modalStart !== -1 && relativeDiv !== -1 && modalStart < relativeDiv) {
   const modalBlock = code.substring(modalStart, relativeDiv);
   code = code.replace(modalBlock, "");
   code = code.replace('<div className="flex h-full relative">', '<div className="flex h-full relative">\n' + modalBlock);
}

fs.writeFileSync('src/pages/Billing.jsx', code);
