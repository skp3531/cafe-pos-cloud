const fs = require('fs');
let file = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

file = file.replace(
  `import { TrendingUp, ShoppingBag, Receipt, ArrowUpRight, LockKeyhole, AlertTriangle, Truck } from 'lucide-react';`,
  `import { TrendingUp, ShoppingBag, Receipt, ArrowUpRight, LockKeyhole, AlertTriangle, Truck, Printer } from 'lucide-react';`
);

fs.writeFileSync('src/pages/Dashboard.jsx', file);
