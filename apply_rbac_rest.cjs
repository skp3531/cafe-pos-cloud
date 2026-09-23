const fs = require('fs');

function patch(file, replacements) {
  let code = fs.readFileSync(file, 'utf-8');
  for (let [search, replace] of replacements) {
    if (search instanceof RegExp) {
      code = code.replace(search, replace);
    } else {
      code = code.split(search).join(replace);
    }
  }
  fs.writeFileSync(file, code);
}

// Customers.jsx
let cCode = fs.readFileSync('src/pages/Customers.jsx', 'utf-8');
if (!cCode.includes('useAuthStore')) {
  cCode = cCode.replace(
    "import { UserPlus, Search, Gift, Phone, MapPin, Download, Trash2, Pencil } from 'lucide-react';",
    "import { UserPlus, Search, Gift, Phone, MapPin, Download, Trash2, Pencil } from 'lucide-react';\nimport { useAuthStore } from '../store/useAuthStore';"
  );
  cCode = cCode.replace(
    "const [cAddr, setCAddr] = useState('');",
    "const [cAddr, setCAddr] = useState('');\n  const user = useAuthStore(state => state.user);\n  const canAdd = user?.role === 'owner' || user?.permissions?.includes('customers_add');\n  const canEdit = user?.role === 'owner' || user?.permissions?.includes('customers_edit');\n  const canDelete = user?.role === 'owner' || user?.permissions?.includes('customers_delete');"
  );
  cCode = cCode.replace(
    /<div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm h-fit">[\s\S]*?<form onSubmit=\{handleSaveCustomer\}/,
    `{canAdd && (<div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm h-fit">
            <h2 className="text-xl font-bold mb-6 text-ui-text">{editingId ? 'Edit Customer' : 'Add New Customer'}</h2>
            <form onSubmit={handleSaveCustomer}`
  );
  cCode = cCode.replace(
    "</form>\n          </div>",
    "</form>\n          </div>)}"
  );
  cCode = cCode.replace(
    /<button onClick=\{\(\) => startEdit\(c\)\}/g,
    "{canEdit && <button onClick={() => startEdit(c)}"
  ).replace(
    /<Pencil size=\{16\}\/><\/button>/g,
    "<Pencil size={16}/></button>}"
  );
  cCode = cCode.replace(
    /<button onClick=\{\(\) => handleDelete\(c\.id\)\}/g,
    "{canDelete && <button onClick={() => handleDelete(c.id)}"
  ).replace(
    /<Trash2 size=\{16\}\/><\/button>/g,
    "<Trash2 size={16}/></button>}"
  );
  fs.writeFileSync('src/pages/Customers.jsx', cCode);
}

// Expenses.jsx
let eCode = fs.readFileSync('src/pages/Expenses.jsx', 'utf-8');
if (!eCode.includes('useAuthStore')) {
  eCode = eCode.replace(
    "import { Plus, Trash2, Download, Search, Wallet, TrendingUp, Calendar, Tag, ArrowRight } from 'lucide-react';",
    "import { Plus, Trash2, Download, Search, Wallet, TrendingUp, Calendar, Tag, ArrowRight } from 'lucide-react';\nimport { useAuthStore } from '../store/useAuthStore';"
  );
  eCode = eCode.replace(
    "const [exCategory, setExCategory] = useState('');",
    "const [exCategory, setExCategory] = useState('');\n  const user = useAuthStore(state => state.user);\n  const canAdd = user?.role === 'owner' || user?.permissions?.includes('expenses_add');\n  const canDelete = user?.role === 'owner' || user?.permissions?.includes('expenses_delete');"
  );
  eCode = eCode.replace(
    /<div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm">[\s\S]*?<form onSubmit=\{handleAddExpense\}/,
    `{canAdd && (<div className="bg-ui-card p-6 md:p-8 rounded-3xl border border-ui-border shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-ui-text">Record Expense</h2>
            <form onSubmit={handleAddExpense}`
  );
  eCode = eCode.replace(
    "</form>\n          </div>",
    "</form>\n          </div>)}"
  );
  eCode = eCode.replace(
    /<button onClick=\{\(\) => handleDelete\(e\.id\)\}/g,
    "{canDelete && <button onClick={() => handleDelete(e.id)}"
  ).replace(
    /<Trash2 size=\{18\}\/><\/button>/g,
    "<Trash2 size={18}/></button>}"
  );
  fs.writeFileSync('src/pages/Expenses.jsx', eCode);
}

