const fs = require('fs');

let file = fs.readFileSync('src/pages/Billing.jsx', 'utf8');

const target = `{discountAmt > 0 && <div className="flex justify-between text-brand-accent font-bold"><span>Discount</span><span>-₹{discountAmt.toFixed(2)}</span></div>}`;

const replacement = `
              {(discountAmt - (redeemPts * ptVal)) > 0 && <div className="flex justify-between text-brand-accent font-bold"><span>Discount</span><span>-₹{(discountAmt - (redeemPts * ptVal)).toFixed(2)}</span></div>}
              {redeemPts > 0 && <div className="flex justify-between text-brand-warning font-bold"><span>Points ({redeemPts} pts)</span><span>-₹{(redeemPts * ptVal).toFixed(2)}</span></div>}
`.trim();

file = file.replace(target, replacement);

fs.writeFileSync('src/pages/Billing.jsx', file);
