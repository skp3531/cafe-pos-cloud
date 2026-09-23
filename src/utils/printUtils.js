import { db } from '../db/db';

export const printOrderReceipt = async (order, cName) => {
  const printAdvanced = await db.settings.get('printAdvanced');
  const printSettings = printAdvanced?.data || (await db.settings.get('print')) || {};
  const profileSettings = (await db.settings.get('profile')) || {};

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  // Backwards compatibility with old settings if new ones don't exist
  const storeHeader = printSettings.storeHeader ?? (printSettings.showHeader !== false);
  const businessName = printSettings.businessName ?? true;
  const storeLogo = printSettings.storeLogo ?? false;
  const headerAddress = printSettings.headerAddress ?? false;
  const headerPhone = printSettings.headerPhone ?? false;
  const headerEmail = printSettings.headerEmail ?? false;
  const headerGstin = printSettings.headerGstin ?? false;
  const headerFssai = printSettings.headerFssai ?? false;
  
  const advTaxMode = printSettings.advTaxMode ?? false;
  const advEstimate = printSettings.advEstimate ?? false;
  
  const showTime = printSettings.showTime ?? true;
  const orderType = printSettings.orderType ?? true;
  
  const customerName = printSettings.customerName ?? (printSettings.showCustomer !== false);
  const customerMobile = printSettings.customerMobile ?? false;
  const customerAddress = printSettings.customerAddress ?? false;
  const customerGstin = printSettings.customerGstin ?? false;

  const cashierName = printSettings.cashierName ?? (printSettings.showCashier !== false);
  const billingStaff = printSettings.billingStaff ?? false;
  
  const itemSku = printSettings.itemSku ?? false;
  const itemHsn = printSettings.itemHsn ?? false;
  const itemUnit = printSettings.itemUnit ?? false;
  const itemQuantity = printSettings.itemQuantity ?? true;
  const itemRate = printSettings.itemRate ?? true;
  const itemDiscount = printSettings.itemDiscount ?? false;
  
  const summarySubtotal = printSettings.summarySubtotal ?? true;
  const summaryDiscount = printSettings.summaryDiscount ?? true;
  const summaryGst = printSettings.summaryGst ?? true;
  const summaryRoundOff = printSettings.summaryRoundOff ?? false;
  const summaryTotal = printSettings.summaryTotal ?? true;
  const summarySavings = printSettings.summarySavings ?? false;
  
  const paymentMethod = printSettings.paymentMethod ?? true;
  const splitPayments = printSettings.splitPayments ?? false;
  
  const qrUpi = printSettings.qrUpi ?? true;
  
  const footerMessage = printSettings.footerMessage ?? (printSettings.showFooter !== false);
  const customFooterText = printSettings.customFooterText || printSettings.customFooter || 'Thank You. Visit again.';
  const advReprintTrack = printSettings.advReprintTrack ?? true;
  const advVoidWatermark = printSettings.advVoidWatermark ?? false;

  const bName = profileSettings.name || 'The Vitamin Bar';
  const bAddress = profileSettings.address || '';
  const bPhone = profileSettings.phone || '';
  const bGstin = profileSettings.gstin || '';
  const bFssai = profileSettings.fssai || '';
  const bEmail = profileSettings.email || '';

  const fontSize = printSettings.fontSize || '13px';
  const paperWidth = printSettings.paperWidth || '300px';

  let itemsHtml = '';
  order.items.forEach(i => {
    itemsHtml += `<div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
        <div style="flex:1">
          <div>${i.name}</div>
          ${itemSku ? `<div style="font-size: 0.75em; color: #555;">SKU: ${i.inventoryId||''}</div>` : ''}
          ${itemHsn ? `<div style="font-size: 0.75em; color: #555;">HSN: -</div>` : ''}
        </div>
        ${itemQuantity ? `<div style="width:30px; text-align:center;">${i.qty}</div>` : ''}
        ${itemRate ? `<div style="width:50px; text-align:right;">${i.price.toFixed(2)}</div>` : ''}
        <div style="width:60px; text-align:right;">${(i.qty * i.price).toFixed(2)}</div>
      </div>`;
  });

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<html>
      <head>
        <style>
          body { font-family: monospace; font-size: ${fontSize}; margin: 0; padding: 10px; width: ${paperWidth}; box-sizing: border-box; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
          .border-top { border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
          .flex { display: flex; justify-content: space-between; }
          .void-watermark { position: absolute; top: 30%; left: 10%; font-size: 40px; font-weight: 900; color: rgba(255,0,0,0.2); transform: rotate(-45deg); pointer-events: none; }
        </style>
      </head>
      <body>
        ${advVoidWatermark && order.status !== 'PAID' ? '<div class="void-watermark">VOID</div>' : ''}
        
        ${storeHeader ? `<div class="center border-bottom">
            ${storeLogo ? '<div>[LOGO]</div>' : ''}
            ${businessName ? `<div class="bold" style="font-size:1.2em; text-transform:uppercase;">${bName}</div>` : ''}
            ${headerAddress && bAddress ? `<div style="font-size:0.8em;">${bAddress}</div>` : ''}
            ${headerPhone && bPhone ? `<div style="font-size:0.8em;">Ph: ${bPhone}</div>` : ''}
            ${headerEmail && bEmail ? `<div style="font-size:0.8em;">${bEmail}</div>` : ''}
            ${headerGstin && bGstin ? `<div style="font-size:0.8em;">GSTIN: ${bGstin}</div>` : ''}
            ${headerFssai && bFssai ? `<div style="font-size:0.8em;">FSSAI: ${bFssai}</div>` : ''}
          </div>` : ''}
        
        ${advTaxMode ? '<div class="center bold border-bottom">TAX INVOICE</div>' : ''}
        ${advEstimate ? '<div class="center bold border-bottom">ESTIMATE ONLY</div>' : ''}

        <div style="font-size:0.9em;" class="border-bottom">
          <div class="flex"><span>Date: ${new Date(order.date).toLocaleDateString()}</span> ${showTime ? `<span>Time: ${new Date(order.date).toLocaleTimeString()}</span>` : ''}</div>
          <div class="flex"><span>Inv: ${order.invoiceNumber || order.id}</span> ${orderType ? '<span>Walk-In</span>' : ''}</div>
          
          ${(customerName || customerMobile || customerAddress || customerGstin) ? `<div class="border-top">
              ${customerName ? `<div>To: ${cName}</div>` : ''}
            </div>` : ''}
          
          ${(cashierName || billingStaff) ? `<div class="border-top flex">
              ${cashierName ? `<div>Cashier: ${order.createdBy || 'Owner'}</div>` : ''}
            </div>` : ''}
        </div>

        <div class="border-bottom" style="font-size:0.9em;">
          <div class="flex bold border-bottom" style="margin-bottom: 5px;">
            <span style="flex:1">Item</span>
            ${itemQuantity ? '<span style="width:30px; text-align:center;">Qty</span>' : ''}
            ${itemRate ? '<span style="width:50px; text-align:right;">Rate</span>' : ''}
            <span style="width:60px; text-align:right;">Amt</span>
          </div>
          ${itemsHtml}
        </div>

        <div class="border-bottom" style="font-size:0.9em;">
          ${summarySubtotal ? `<div class="flex"><span>Subtotal</span><span>${order.subtotal?.toFixed(2) || order.total.toFixed(2)}</span></div>` : ''}
          ${summaryDiscount && order.discount ? `<div class="flex"><span>Discount</span><span>${order.discount.toFixed(2)}</span></div>` : ''}
          ${summaryTotal ? `<div class="flex bold" style="font-size:1.1em; margin-top:4px;"><span>TOTAL</span><span>${order.total.toFixed(2)}</span></div>` : ''}
        </div>

        <div class="border-bottom center" style="font-size:0.8em;">
          ${paymentMethod ? `<div>Paid via ${order.paymentMode}</div>` : ''}
        </div>
        
        ${qrUpi ? '<div class="center border-bottom"><div style="border:1px solid #000; display:inline-block; padding:10px; margin:5px 0;">UPI QR</div></div>' : ''}

        ${footerMessage ? `<div class="center" style="font-size:0.8em; margin-top:5px;">${customFooterText}</div>` : ''}
      </body>
    </html>`);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
};