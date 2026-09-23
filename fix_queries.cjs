const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf-8');
  
  // Billing
  code = code.replace(
    "const activeShift = useLiveQuery(() => db.shifts ? db.shifts.where('status').equals('active').first() : null);",
    `const activeShift = useLiveQuery(async () => {
    try { return db.shifts ? await db.shifts.where('status').equals('active').first() : null; } catch (e) { return null; }
  });`
  );

  // Dashboard
  code = code.replace(
    "const activeShift = useLiveQuery(() => db.shifts ? db.shifts.where('status').equals('active').first() : null);",
    `const activeShift = useLiveQuery(async () => {
    try { return db.shifts ? await db.shifts.where('status').equals('active').first() : null; } catch (e) { return null; }
  });`
  );

  // Shifts
  code = code.replace(
    "const shifts = useLiveQuery(() => db.shifts ? db.shifts.orderBy('startTime').reverse().toArray() : []) || [];",
    `const shifts = useLiveQuery(async () => {
    try { return db.shifts ? await db.shifts.orderBy('startTime').reverse().toArray() : []; } catch (e) { return []; }
  }) || [];`
  );
  
  fs.writeFileSync(file, code);
}

fixFile('src/pages/Billing.jsx');
fixFile('src/pages/Dashboard.jsx');
fixFile('src/pages/Shifts.jsx');
