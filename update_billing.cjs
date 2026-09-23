const fs = require('fs');

let file = fs.readFileSync('src/pages/Billing.jsx', 'utf8');

// Get point vars in Billing
file = file.replace(
  `const { subtotal, discountAmt, total } = getTotals();`,
  `const redeemPts = useCartStore(state => state.redeemPoints);\n  const ptVal = useCartStore(state => state.pointValue);\n  const { subtotal, discountAmt, total } = getTotals();`
);

// Add to orderData
file = file.replace(
  `discount: discountAmt,`,
  `discount: discountAmt,\n      pointsRedeemed: redeemPts,\n      pointsValue: redeemPts * ptVal,`
);

// Add to print receipt html
// Needs to add it before Total or where discount is
const printLogic = `
        \${order.discount > 0 ? \`<div class="flex"><span>Discount</span><span>-Rs.\${order.discount.toFixed(2)}</span></div>\` : ''}
        \${order.pointsRedeemed > 0 ? \`<div class="flex"><span>Points Redeemed</span><span>\${order.pointsRedeemed} pts (-Rs.\${order.pointsValue.toFixed(2)})</span></div>\` : ''}
`;
file = file.replace(
  `\${order.discount > 0 ? \`<div class="flex"><span>Discount</span><span>-Rs.\${order.discount.toFixed(2)}</span></div>\` : ''}`,
  printLogic.trim()
);

// Also need to update Orders.jsx print HTML to do this.
fs.writeFileSync('src/pages/Billing.jsx', file);
