const fs = require('fs');
let code = fs.readFileSync('src/pages/Orders.jsx', 'utf-8');

code = code.replace(
  "const canDelete = user?.role === 'owner' || user?.permissions?.includes('orders_delete');",
  "const canDelete = user?.role === 'owner' || user?.permissions?.includes('orders_edit');"
);

code = code.replace(
  "<button onClick={() => handleRefund(order, c)}",
  "{canEdit && <button onClick={() => handleRefund(order, c)}"
);
code = code.replace(
  "<span className=\"text-[10px]\">Refund</span></button>",
  "<span className=\"text-[10px]\">Refund</span></button>}"
);

code = code.replace(
  "<button onClick={() => handleEdit(order, c)}",
  "{canEdit && <button onClick={() => handleEdit(order, c)}"
);
code = code.replace(
  "<span className=\"text-[10px]\">Edit</span></button>",
  "<span className=\"text-[10px]\">Edit</span></button>}"
);

code = code.replace(
  "<button onClick={() => handleVoid(order, c)}",
  "{canDelete && <button onClick={() => handleVoid(order, c)}"
);
code = code.replace(
  "<span className=\"text-[10px]\">Void</span></button>",
  "<span className=\"text-[10px]\">Void</span></button>}"
);

fs.writeFileSync('src/pages/Orders.jsx', code);
