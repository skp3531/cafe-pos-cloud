const fs = require('fs');

function restore(file) {
  let c = fs.readFileSync(file, 'utf-8');
  c = c.replace(/\{canDelete && <button/g, "<button"); // revert the opening wrapper
  // re-apply correctly
  c = c.replace(/<button([^>]*handleDelete[^>]*)>([\s\S]*?)<\/button>/g, "{canDelete && <button$1>$2</button>}");
  fs.writeFileSync(file, c);
}

restore('src/pages/Expenses.jsx');
restore('src/pages/Purchase.jsx');
