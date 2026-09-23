const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.jsx', 'utf-8');

if (!code.includes('const user = useAuthStore')) {
  code = code.replace(
    "import { format } from 'date-fns';",
    "import { format } from 'date-fns';\nimport { useAuthStore } from '../store/useAuthStore';"
  );
  
  code = code.replace(
    "const [activeTab, setActiveTab] = useState('sales');",
    "const user = useAuthStore(state => state.user);\n  const [activeTab, setActiveTab] = useState('sales');"
  );

  const tabsArray = `[
            {id: 'sales', label: 'Sales', perm: 'reports_sales'}, 
            {id: 'purchases', label: 'Purchases', perm: 'reports_inventory'}, 
            {id: 'items', label: 'Items', perm: 'reports_items'}, 
            {id: 'returns', label: 'Returns', perm: 'reports_sales'}, 
            {id: 'shifts', label: 'Z-Reports', perm: 'reports_sales'}, 
            {id: 'staff', label: 'Staff Activity', perm: 'reports_attendance'}
          ].filter(t => user?.role === 'owner' || user?.permissions?.includes(t.perm)).map(tab => (`;

  code = code.replace(
    /\{\[\{id: 'sales', label: 'Sales'\}, \{id: 'purchases', label: 'Purchases'\}, \{id: 'items', label: 'Items'\}, \{id: 'returns', label: 'Returns'\}, \{id: 'shifts', label: 'Z-Reports'\}, \{id: 'staff', label: 'Staff Activity'\}\]\.map\(tab => \(/,
    tabsArray
  );

  fs.writeFileSync('src/pages/Reports.jsx', code);
}
