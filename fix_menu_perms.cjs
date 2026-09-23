const fs = require('fs');
let code = fs.readFileSync('src/pages/Menu.jsx', 'utf-8');

code = code.replace(
  "const canAdd = user?.role === 'owner' || user?.permissions?.includes('menu_add');",
  "const canAdd = user?.role === 'owner' || user?.permissions?.includes('menu_edit');"
);
code = code.replace(
  "const canDelete = user?.role === 'owner' || user?.permissions?.includes('menu_delete');",
  "const canDelete = user?.role === 'owner' || user?.permissions?.includes('menu_edit');"
);

fs.writeFileSync('src/pages/Menu.jsx', code);
