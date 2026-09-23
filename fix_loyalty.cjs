const fs = require('fs');
let file = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

// Change UI label
file = file.replace(
  `<label className="text-xs font-bold text-ui-muted mb-1 block">Redeem (1 pt = ₹)</label>`,
  `<label className="text-xs font-bold text-ui-muted mb-1 block">Redeem (Points = ₹1)</label>`
);

// If they type 100, pointValue state is 100.
// But when saved, we want to save the raw value so it loads correctly.
// Let's modify the pointValue state to represent "Points per 1 Rupee"
// So if DB has pointValue = 0.01, the state should show 100.
file = file.replace(
  `setPointValue(loyaltySettings.pointValue || 1);`,
  `setPointValue(loyaltySettings.pointValue ? (1 / loyaltySettings.pointValue).toFixed(0) : 1);`
);

file = file.replace(
  `await db.settings.put({ id: 'loyalty', earnRatio: parseFloat(earnRatio), pointValue: parseFloat(pointValue) });`,
  `await db.settings.put({ id: 'loyalty', earnRatio: parseFloat(earnRatio), pointValue: 1 / parseFloat(pointValue) });`
);

fs.writeFileSync('src/pages/Settings.jsx', file);
