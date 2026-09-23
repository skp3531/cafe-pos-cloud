const fs = require('fs');
let file = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

const printStateStr = `
  const [fontSize, setFontSize] = useState('13px');
  const [paperWidth, setPaperWidth] = useState('300px');
  const [printHeader, setPrintHeader] = useState(true);
  const [printFooter, setPrintFooter] = useState(true);
  const [showCustomer, setShowCustomer] = useState(true);
  const [showCashier, setShowCashier] = useState(true);
  const [showTime, setShowTime] = useState(true);
  const [printerModule, setPrinterModule] = useState('browser');
  const [customFooter, setCustomFooter] = useState('');
`;

file = file.replace(
  `const users = useLiveQuery(() => db.users.toArray()) || [];`,
  `const users = useLiveQuery(() => db.users.toArray()) || [];\n${printStateStr}`
);

fs.writeFileSync('src/pages/Settings.jsx', file);
