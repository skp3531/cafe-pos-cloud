const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.jsx', 'utf-8');

code = code.replace(
  "import { FileText, Download, Printer, TrendingUp, DollarSign, PieChart, ShoppingBag, TrendingDown, Star, Clock, AlertTriangle, CreditCard, Banknote, Smartphone } from 'lucide-react';",
  "import { FileText, Download, Printer, TrendingUp, DollarSign, PieChart, ShoppingBag, TrendingDown, Star, Clock, AlertTriangle, CreditCard, Banknote, Smartphone, IndianRupee, RefreshCcw, Package, Users } from 'lucide-react';"
);

fs.writeFileSync('src/pages/Reports.jsx', code);
