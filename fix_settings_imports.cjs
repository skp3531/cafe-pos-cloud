const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.jsx', 'utf-8');
code = code.replace(
  "import { Download, Upload, Cloud, Heart, Store, FileText, Users, Plus, Trash2, Printer, Pencil } from 'lucide-react';",
  "import { Download, Upload, Cloud, Heart, Store, FileText, Users, Plus, Trash2, Printer, Pencil, ChevronDown, ChevronRight } from 'lucide-react';"
);
fs.writeFileSync('src/pages/Settings.jsx', code);
