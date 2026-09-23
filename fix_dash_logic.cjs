const fs = require('fs');

let code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf-8');

const logic = `
  const handleStartShift = async (e) => {
    e.preventDefault();
    await db.shifts.add({
      startTime: new Date().toISOString(),
      endTime: null,
      openingCash: parseFloat(openingCash) || 0,
      closingCash: null,
      expectedCash: null,
      variance: null,
      status: 'active',
      startedBy: user?.name || 'Unknown'
    });
    setShowStartShift(false);
  };

  const calculateExpectedCash = () => {
    if (!activeShift) return 0;
    // sum up cash sales for today
    const cashSales = todaySales.filter(s => s.paymentMode === 'cash').reduce((sum, s) => sum + s.total, 0);
    // add to opening
    return parseFloat(activeShift.openingCash) + cashSales;
  };

  const handleEndShift = async (e) => {
    e.preventDefault();
    const expected = calculateExpectedCash();
    const actual = parseFloat(actualCash) || 0;
    
    await db.shifts.update(activeShift.id, {
      endTime: new Date().toISOString(),
      closingCash: actual,
      expectedCash: expected,
      variance: actual - expected,
      status: 'closed',
      endedBy: user?.name || 'Unknown'
    });
    setShowEndShift(false);
  };
`;

if (!code.includes("const handleStartShift")) {
  code = code.replace(
    "const activeShift = useLiveQuery(async () => {",
    logic + "\n  const activeShift = useLiveQuery(async () => {"
  );
}

fs.writeFileSync('src/pages/Dashboard.jsx', code);
