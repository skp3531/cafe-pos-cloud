const fs = require('fs');
const printLogic = `
  const printReceipt = async (order, cName) => {
    const printSettings = (await db.settings.get('print')) || {};
    const profileSettings = (await db.settings.get('profile')) || {};

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const showHeader = printSettings.showHeader !== false;
    const showFooter = printSettings.showFooter !== false;
    const showCustomer = printSettings.showCustomer !== false;
    const showCashier = printSettings.showCashier !== false;
    const showTime = printSettings.showTime !== false;
    const footerMsg = printSettings.customFooter || profileSettings.footer || 'Thank you! Visit again.';

    const content = \`
      <html><head><style>
        body{font-family:monospace;width:\${printSettings.paperWidth || '300px'};margin:0 auto;padding:16px;text-align:center;color:#000;font-size:\${printSettings.fontSize || '13px'}}
        .divider{border-bottom:1px dashed #000;margin:8px 0}
        .flex{display:flex;justify-content:space-between}
        h2{margin:4px 0;font-size:16px}h3{margin:4px 0}p{margin:2px 0}
      </style></head><body>
        \${showHeader ? \`<h2>\${profileSettings.name || 'Store'}</h2>\` : ''}
        \${showHeader ? \`<p>\${profileSettings.address || ''}</p>\` : ''}
        \${showHeader ? \`<p>\${profileSettings.phone ? 'Ph: ' + profileSettings.phone : ''}</p>\` : ''}
        \${showHeader && profileSettings.gstin ? \`<p>GSTIN: \${profileSettings.gstin}</p>\` : ''}
        <div class="divider"></div>
        <div class="flex"><span>Invoice:</span><span>\${order.invoiceNumber || order.id}</span></div>
        \${showTime ? \`<div class="flex"><span>Date:</span><span>\${new Date(order.date).toLocaleString('en-IN')}</span></div>\` : ''}
        \${showCustomer ? \`<div class="flex"><span>Customer:</span><span>\${cName}</span></div>\` : ''}
        \${showCashier && order.createdBy ? \`<div class="flex"><span>Cashier:</span><span>\${order.createdBy}</span></div>\` : ''}
        <div class="divider"></div>
        \${order.items.map(i => \`<div class="flex"><span>\${i.name} x\${i.qty}</span><span>Rs.\${(i.sellingPrice * i.qty).toFixed(2)}</span></div>\`).join('')}
        <div class="divider"></div>
        <div class="flex"><span>Subtotal</span><span>Rs.\${order.subtotal.toFixed(2)}</span></div>
        \${order.discount > 0 ? \`<div class="flex"><span>Discount</span><span>-Rs.\${order.discount.toFixed(2)}</span></div>\` : ''}
        \${order.pointsRedeemed > 0 ? \`<div class="flex"><span>Points Redeemed</span><span>\${order.pointsRedeemed} pts</span></div>\` : ''}
        <div class="divider"></div>
        <h3 class="flex"><span>TOTAL</span><span>Rs.\${order.total.toFixed(2)}</span></h3>
        <p>Paid via \${order.paymentMode}</p>
        <div class="divider"></div>
        \${showFooter ? \`<p>\${footerMsg}</p>\` : ''}
      </body></html>
    \`;
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(content);
    doc.close();
    
    if (printSettings.printerModule && printSettings.printerModule !== 'browser') {
      console.log(\`Sending raw ESC/POS to \${printSettings.printerModule}...\`);
    }
    
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  };
`;

const replacePrintLogic = (filePath) => {
  let file = fs.readFileSync(filePath, 'utf8');
  
  const startStr = 'const printReceipt = ';
  const endStr = 'setTimeout(() => document.body.removeChild(iframe), 2000);\n  };';
  
  const startIdx = file.indexOf(startStr);
  const endIdx = file.indexOf(endStr);
  
  if (startIdx !== -1 && endIdx !== -1) {
    const toReplace = file.substring(startIdx, endIdx + endStr.length);
    file = file.replace(toReplace, printLogic.trim());
    fs.writeFileSync(filePath, file);
    console.log("Updated", filePath);
  }
};

replacePrintLogic('src/pages/Orders.jsx');
replacePrintLogic('src/pages/Billing.jsx');
