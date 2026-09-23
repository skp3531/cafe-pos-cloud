const fs = require('fs');

function fixFile(path) {
  let file = fs.readFileSync(path, 'utf8');
  
  // Replace the printing logic for discounts
  const regex = /\$\{order\.discount > 0 \? `.*?` : ''\}/g;
  
  const repl = `
        \${(order.discount - (order.pointsValue || 0)) > 0 ? \`<div class="flex"><span>Discount</span><span>-Rs.\${(order.discount - (order.pointsValue || 0)).toFixed(2)}</span></div>\` : ''}
        \${order.pointsRedeemed > 0 ? \`<div class="flex"><span>Points Redeemed (\${order.pointsRedeemed} pts)</span><span>-Rs.\${(order.pointsValue || 0).toFixed(2)}</span></div>\` : ''}
  `.trim();
  
  // Actually, I already replaced it with something similar in Billing.jsx, let's just do a clean replace using a custom string replace to be safe.
  
  file = file.replace(
    /\$\{\(order\.discount.*?pointsRedeemed > 0 \? .*?''\}/gs,
    ""
  ); // Strip if I already added it in Billing
  
  // Let's just find the Subtotal line and append the new logic.
  const subtotalLine = `<div class="flex"><span>Subtotal</span><span>Rs.\${order.subtotal.toFixed(2)}</span></div>`;
  
  // Clean up any existing discount lines right after subtotal
  file = file.replace(
    new RegExp(subtotalLine.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&') + '\\s*(?:\\$\\{.*?\\}\\s*)*<div class="divider"></div>', 'g'),
    `\${subtotalLine}
        \${(order.discount - (order.pointsValue || 0)) > 0 ? \`<div class="flex"><span>Discount</span><span>-Rs.\${(order.discount - (order.pointsValue || 0)).toFixed(2)}</span></div>\` : ''}
        \${order.pointsRedeemed > 0 ? \`<div class="flex"><span>Points (\${order.pointsRedeemed} pts)</span><span>-Rs.\${(order.pointsValue || 0).toFixed(2)}</span></div>\` : ''}
        <div class="divider"></div>`
  );
  
  fs.writeFileSync(path, file);
}

fixFile('src/pages/Billing.jsx');
fixFile('src/pages/Orders.jsx');

