import { buildESCPOSBytes, browserDriver, bluetoothDriver, usbDriver, networkDriver, getDriver } from './printerDrivers.js';

/**
 * Build the full receipt HTML string.
 * Shared by Browser Print (iframe) and Live Preview.
 */
export const buildReceiptHTML = (order, cName, printSettings = {}, profileSettings = {}) => {
  const storeHeader   = printSettings.storeHeader ?? true;
  const businessName  = printSettings.businessName ?? true;
  const storeLogo     = printSettings.storeLogo ?? false;
  const headerAddress = printSettings.headerAddress ?? false;
  const headerPhone   = printSettings.headerPhone ?? false;
  const headerEmail   = printSettings.headerEmail ?? false;
  const headerGstin   = printSettings.headerGstin ?? false;
  const headerFssai   = printSettings.headerFssai ?? false;
  const advTaxMode    = printSettings.advTaxMode ?? false;
  const advEstimate   = printSettings.advEstimate ?? false;
  const showTime      = printSettings.showTime ?? true;
  const orderType     = printSettings.orderType ?? true;
  const customerName  = printSettings.customerName ?? true;
  const customerMobile = printSettings.customerMobile ?? false;
  const customerAddress = printSettings.customerAddress ?? false;
  const customerGstin = printSettings.customerGstin ?? false;
  const cashierName   = printSettings.cashierName ?? true;
  const billingStaff  = printSettings.billingStaff ?? false;
  const itemSku       = printSettings.itemSku ?? false;
  const itemHsn       = printSettings.itemHsn ?? false;
  const itemUnit      = printSettings.itemUnit ?? false;
  const itemQuantity  = printSettings.itemQuantity ?? true;
  const itemRate      = printSettings.itemRate ?? true;
  const itemDiscount  = printSettings.itemDiscount ?? false;
  const summarySubtotal = printSettings.summarySubtotal ?? true;
  const summaryDiscount = printSettings.summaryDiscount ?? true;
  const summaryGst    = printSettings.summaryGst ?? true;
  const summaryRoundOff = printSettings.summaryRoundOff ?? false;
  const summaryTotal  = printSettings.summaryTotal ?? true;
  const summarySavings = printSettings.summarySavings ?? false;
  const paymentMethod = printSettings.paymentMethod ?? true;
  const splitPayments = printSettings.splitPayments ?? false;
  const qrUpi         = printSettings.qrUpi ?? true;
  const footerMessage = printSettings.footerMessage ?? true;
  const customFooterText = printSettings.customFooterText || printSettings.customFooter || 'Thank You. Visit again.';
  const advReprintTrack = printSettings.advReprintTrack ?? true;
  const advVoidWatermark = printSettings.advVoidWatermark ?? false;
  const storeLogoUrl  = printSettings.storeLogoUrl || '';

  const theme = printSettings.theme || 'standard';
  const fontFamily = printSettings.fontFamily || 'monospace';
  const receiptPadding = printSettings.receiptPadding || '10px';
  const lineSpacing = printSettings.lineSpacing === 'compact' ? '1.2' : printSettings.lineSpacing === 'relaxed' ? '1.6' : '1.4';

  const bName    = profileSettings.name || 'The Vitamin Bar';
  const bAddress = profileSettings.address || '';
  const bPhone   = profileSettings.phone || '';
  const bGstin   = profileSettings.gstin || '';
  const bFssai   = profileSettings.fssai || '';
  const bEmail   = profileSettings.email || '';

  const fontSize   = printSettings.fontSize || '13px';
  const paperWidth = printSettings.paperWidth || '300px';

  let themeCSS = '';
  if (theme === 'standard') {
    themeCSS = `
      .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
      .border-top { border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
    `;
  } else if (theme === 'modern') {
    themeCSS = `
      .border-bottom { border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 8px; }
      .border-top { border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px; }
    `;
  } else if (theme === 'minimal') {
    themeCSS = `
      .border-bottom { margin-bottom: 12px; }
      .border-top { margin-top: 12px; }
    `;
  } else if (theme === 'bold') {
    themeCSS = `
      .border-bottom { border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 4px; }
      .border-top { border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; }
      .bold { font-weight: 900; text-transform: uppercase; }
    `;
  } else if (theme === 'elegant') {
    themeCSS = `
      .border-bottom { border-bottom: 3px double #333; padding-bottom: 6px; margin-bottom: 6px; }
      .border-top { border-top: 3px double #333; padding-top: 6px; margin-top: 6px; }
      .center { text-align: center; }
    `;
  }

  let itemsHtml = '';
  (order.items || []).forEach(i => {
    const price = i.sellingPrice || i.price || 0;
    itemsHtml += `<div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
        <div style="flex:1">
          <div>${i.name}</div>
          ${itemSku ? `<div style="font-size: 0.75em; color: #555;">SKU: ${i.inventoryId || ''}</div>` : ''}
          ${itemHsn ? `<div style="font-size: 0.75em; color: #555;">HSN: -</div>` : ''}
        </div>
        ${itemQuantity ? `<div style="width:30px; text-align:center;">${i.qty}${itemUnit ? ' pc' : ''}</div>` : ''}
        ${itemRate ? `<div style="width:50px; text-align:right;">${price.toFixed(2)}</div>` : ''}
        <div style="width:60px; text-align:right;">${(i.qty * price).toFixed(2)}</div>
      </div>`;
  });

  return `<!DOCTYPE html>
<html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: ${fontFamily}; font-size: ${fontSize}; line-height: ${lineSpacing}; margin: 0; padding: ${receiptPadding}; width: ${paperWidth}; box-sizing: border-box; color: #000; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .flex { display: flex; justify-content: space-between; }
        .void-watermark { position: absolute; top: 30%; left: 10%; font-size: 40px; font-weight: 900; color: rgba(255,0,0,0.2); transform: rotate(-45deg); pointer-events: none; }
        ${themeCSS}
      </style>
    </head>
    <body>
      ${advVoidWatermark && order.status !== 'PAID' ? '<div class="void-watermark">VOID</div>' : ''}

      ${storeHeader ? `<div class="center border-bottom">
          ${storeLogo ? (storeLogoUrl ? `<div><img src="${storeLogoUrl}" style="max-height: 60px; max-width: 100%; object-fit: contain; margin-bottom: 5px;" /></div>` : '<div>[LOGO]</div>') : ''}
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
        <div class="flex"><span>Date: ${new Date(order.date || Date.now()).toLocaleDateString()}</span> ${showTime ? `<span>Time: ${new Date(order.date || Date.now()).toLocaleTimeString()}</span>` : ''}</div>
        <div class="flex"><span>Inv: ${order.invoiceNumber || order.id}</span> ${orderType ? `<span>${order.orderType || 'Walk-In'}</span>` : ''}</div>
        ${(customerName || customerMobile || customerAddress || customerGstin) ? `<div class="border-top">
            ${customerName ? `<div>To: ${cName}</div>` : ''}
            ${customerMobile && order.customerPhone ? `<div>Ph: ${order.customerPhone}</div>` : ''}
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
        ${summarySubtotal ? `<div class="flex"><span>Subtotal</span><span>${(order.subtotal || order.total || 0).toFixed(2)}</span></div>` : ''}
        ${summaryDiscount && order.discount ? `<div class="flex"><span>Discount</span><span>-${order.discount.toFixed(2)}</span></div>` : ''}
        ${summaryTotal ? `<div class="flex bold" style="font-size:1.1em; margin-top:4px;"><span>TOTAL</span><span>₹${(order.total || 0).toFixed(2)}</span></div>` : ''}
      </div>

      <div class="border-bottom center" style="font-size:0.8em;">
        ${paymentMethod ? `<div>Paid via ${order.paymentMode || 'CASH'}</div>` : ''}
        ${splitPayments && order.splitDetails ? `<div>${JSON.stringify(order.splitDetails)}</div>` : ''}
      </div>

      ${qrUpi ? '<div class="center border-bottom"><div style="border:1px solid #000; display:inline-block; padding:10px; margin:5px 0;">UPI QR</div></div>' : ''}

      ${footerMessage ? `<div class="center" style="font-size:0.8em; margin-top:5px;">${customFooterText}</div>` : ''}
      ${advReprintTrack ? '<div class="center" style="font-size:0.7em; margin-top:4px;">Reprint: No</div>' : ''}
    </body>
  </html>`;
};

/**
 * Generate a sample/test order for test prints.
 */
export const sampleOrder = {
  id: 'TEST-001',
  invoiceNumber: 'TEST-001',
  date: new Date().toISOString(),
  orderType: 'Dine In',
  createdBy: 'Owner',
  items: [
    { name: 'Watermelon Juice', qty: 2, sellingPrice: 79 },
    { name: 'Classic Cold Coffee', qty: 1, sellingPrice: 49 },
    { name: 'Add On: Peanut Butter', qty: 1, sellingPrice: 20 },
  ],
  subtotal: 227,
  discount: 0,
  total: 227,
  paymentMode: 'UPI',
  status: 'PAID',
};

/**
 * Main entry point: route to the correct driver based on printerModule setting.
 * Used by Billing.jsx and the Test Print buttons.
 */
export const printOrderReceipt = async (order, cName, printSettings = {}, profileSettings = {}) => {
  const module = printSettings.printerModule || 'browser';

  if (module === 'browser') {
    const html = buildReceiptHTML(order, cName, printSettings, profileSettings);
    return browserDriver.print(html);
  }

  if (module === 'thermal_bt') {
    if (!bluetoothDriver.isConnected()) {
      throw new Error('Bluetooth printer is not connected. Please connect it in Settings → Print Layout.');
    }
    const bytes = buildESCPOSBytes(order, printSettings, profileSettings);
    return bluetoothDriver.print(bytes);
  }

  if (module === 'thermal_usb') {
    if (!usbDriver.isConnected()) {
      throw new Error('USB printer is not connected. Please connect it in Settings → Print Layout.');
    }
    const bytes = buildESCPOSBytes(order, printSettings, profileSettings);
    return usbDriver.print(bytes);
  }

  if (module === 'thermal_escpos') {
    const ip   = printSettings.networkIp || '';
    const port = printSettings.networkPort || 9100;
    if (!ip) throw new Error('Network printer IP is not configured. Please set it in Settings → Print Layout.');
    const bytes = buildESCPOSBytes(order, printSettings, profileSettings);
    return networkDriver.print(bytes, ip, port);
  }

  // Fallback
  const html = buildReceiptHTML(order, cName, printSettings, profileSettings);
  return browserDriver.print(html);
};

export const buildKOTHTML = (order, profileSettings = {}) => {
  let itemsHtml = '';
  (order.items || []).forEach(i => {
    itemsHtml += `
      <div style="display:flex; justify-content:space-between; margin-bottom: 5px; font-size:1.1em; font-weight:bold;">
        <div style="flex:1;">
          <div>${i.name}</div>
          ${i.notes ? `<div style="font-size: 0.8em; font-weight:normal; font-style:italic;">Note: ${i.notes}</div>` : ''}
        </div>
        <div style="width:40px; text-align:right;">x${i.qty}</div>
      </div>
    `;
  });

  return `<!DOCTYPE html>
<html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: monospace; font-size: 14px; line-height: 1.4; margin: 0; padding: 10px; width: 300px; color: #000; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .border-bottom { border-bottom: 2px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
      </style>
    </head>
    <body>
      <div class="center bold border-bottom" style="font-size: 1.2em;">KITCHEN ORDER TICKET (KOT)</div>
      <div class="border-bottom" style="font-size:0.9em;">
        <div>Order: ${order.invoiceNumber || order.id}</div>
        <div>Type: ${order.orderType || 'Walk-In'}</div>
        <div>Time: ${new Date(order.date || Date.now()).toLocaleTimeString()}</div>
      </div>
      <div class="border-bottom">
        <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom: 5px;">
          <span>Item</span>
          <span>Qty</span>
        </div>
        ${itemsHtml}
      </div>
    </body>
  </html>`;
};


export const buildESCPOSKOT = (order, profileSettings = {}) => {
  const bytes = [];
  const ESC = 0x1b;
  const GS  = 0x1d;

  const ESCPOS = {
    INIT:           [ESC, 0x40],
    ALIGN_LEFT:     [ESC, 0x61, 0x00],
    ALIGN_CENTER:   [ESC, 0x61, 0x01],
    BOLD_ON:        [ESC, 0x45, 0x01],
    BOLD_OFF:       [ESC, 0x45, 0x00],
    DOUBLE_HEIGHT:  [ESC, 0x21, 0x10],
    NORMAL_SIZE:    [ESC, 0x21, 0x00],
    FEED_LINE:      [0x0a],
    CUT_PAPER:      [GS, 0x56, 0x42, 0x00]
  };

  const push = (...cmds) => cmds.forEach(cmd => {
    if (Array.isArray(cmd)) bytes.push(...cmd);
    else bytes.push(cmd);
  });
  const text = (str) => {
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i) & 0xff);
    }
  };
  const line = (str = '') => { text(str); push(...ESCPOS.FEED_LINE); };
  
  const dashedLine = (w) => '-'.repeat(w);

  push(...ESCPOS.INIT);
  push(...ESCPOS.ALIGN_CENTER, ...ESCPOS.BOLD_ON, ...ESCPOS.DOUBLE_HEIGHT);
  line("KOT");
  push(...ESCPOS.NORMAL_SIZE, ...ESCPOS.BOLD_OFF);
  line(dashedLine(32));

  push(...ESCPOS.ALIGN_LEFT);
  line("Order: " + (order.invoiceNumber || order.id));
  line("Type:  " + (order.orderType || "Walk-In"));
  line("Time:  " + new Date(order.date || Date.now()).toLocaleTimeString());
  line(dashedLine(32));

  push(...ESCPOS.BOLD_ON);
  const qtyTitle = "Qty";
  const itemTitle = "Item";
  // Item (26) + Qty (6) = 32
  let headerSpaces = 32 - itemTitle.length - qtyTitle.length;
  line(itemTitle + " ".repeat(Math.max(1, headerSpaces)) + qtyTitle);
  push(...ESCPOS.BOLD_OFF);
  line(dashedLine(32));

  (order.items || []).forEach(i => {
    push(...ESCPOS.BOLD_ON);
    let n = String(i.name).substring(0, 26);
    let q = "x" + String(i.qty);
    let spaces = 32 - n.length - q.length;
    line(n + " ".repeat(Math.max(1, spaces)) + q);
    push(...ESCPOS.BOLD_OFF);
    if (i.notes) {
      line("  Note: " + String(i.notes).substring(0, 28));
    }
  });

  line(dashedLine(32));
  line();
  line();
  line();
  push(...ESCPOS.CUT_PAPER);
  return new Uint8Array(bytes);
};
export const printOrderKOT = async (order, printSettings = {}, profileSettings = {}) => {
  const module = printSettings.printerModule || 'browser';
  
  if (module === 'thermal_bt') {
    if (!bluetoothDriver.isConnected()) throw new Error('Bluetooth printer not connected.');
    return bluetoothDriver.print(buildESCPOSKOT(order, profileSettings));
  }
  if (module === 'thermal_usb') {
    if (!usbDriver.isConnected()) throw new Error('USB printer not connected.');
    return usbDriver.print(buildESCPOSKOT(order, profileSettings));
  }
  if (module === 'thermal_escpos') {
    const ip = printSettings.networkIp || '';
    const port = printSettings.networkPort || 9100;
    if (!ip) throw new Error('Network printer IP not configured.');
    return networkDriver.print(buildESCPOSKOT(order, profileSettings), ip, port);
  }
  
  const html = buildKOTHTML(order, profileSettings);
  return browserDriver.print(html);
};