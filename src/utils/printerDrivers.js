/**
 * printerDrivers.js
 * Real printer driver implementations for all 4 connection types.
 * - BrowserPrinterDriver   : window.print() via iframe
 * - BluetoothPrinterDriver : Web Bluetooth API (Chrome/Edge only)
 * - USBPrinterDriver       : WebUSB API (Chrome/Edge only)
 * - NetworkPrinterDriver   : ESC/POS over HTTP relay → TCP port 9100
 */

// ─────────────────────────────────────────────────────────────
// ESC/POS Byte Commands
// ─────────────────────────────────────────────────────────────
const ESC = 0x1b;
const GS  = 0x1d;

export const ESCPOS = {
  INIT:           [ESC, 0x40],
  ALIGN_LEFT:     [ESC, 0x61, 0x00],
  ALIGN_CENTER:   [ESC, 0x61, 0x01],
  ALIGN_RIGHT:    [ESC, 0x61, 0x02],
  BOLD_ON:        [ESC, 0x45, 0x01],
  BOLD_OFF:       [ESC, 0x45, 0x00],
  DOUBLE_HEIGHT:  [ESC, 0x21, 0x10],
  NORMAL_SIZE:    [ESC, 0x21, 0x00],
  FEED_LINE:      [0x0a],
  FEED_LINES: (n) => [ESC, 0x64, n],
  CUT_PAPER:      [GS, 0x56, 0x42, 0x00],
  UNDERLINE_ON:   [ESC, 0x2d, 0x01],
  UNDERLINE_OFF:  [ESC, 0x2d, 0x00],
};

/** Encode a string to Uint8Array (latin1 for ESC/POS) */
function encodeText(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) & 0xff);
  }
  return bytes;
}

/** Center-pad a string within a given column width */
function centerStr(str, width = 32) {
  str = String(str).substring(0, width);
  const pad = Math.max(0, Math.floor((width - str.length) / 2));
  return ' '.repeat(pad) + str;
}

/** Left-right two-column row */
function twoCol(left, right, width = 32) {
  left = String(left);
  right = String(right);
  const space = Math.max(1, width - left.length - right.length);
  return left + ' '.repeat(space) + right;
}

/** Dashed separator line */
function dashedLine(width = 32) {
  return '-'.repeat(width) + '\n';
}

/**
 * Build an ESC/POS byte array from an order and print settings.
 * Returns Uint8Array.
 */
export function buildESCPOSBytes(order, settings = {}, profileSettings = {}) {
  const width = settings.paperWidth === '200px' ? 32 : 42; // 58mm=32, 80mm=42
  const bytes = [];

  const push = (...cmds) => cmds.forEach(cmd => {
    if (Array.isArray(cmd)) bytes.push(...cmd);
    else bytes.push(cmd);
  });
  const text = (str) => push(...encodeText(str));
  const line = (str = '') => { text(str); push(...ESCPOS.FEED_LINE); };

  const bName = profileSettings.name || 'The Vitamin Bar';
  const bAddress = profileSettings.address || '';
  const bPhone = profileSettings.phone || '';
  const bGstin = profileSettings.gstin || '';
  const bFssai = profileSettings.fssai || '';
  const bEmail = profileSettings.email || '';

  // Init
  push(...ESCPOS.INIT);

  // ── Header ──
  if (settings.storeHeader !== false) {
    push(...ESCPOS.ALIGN_CENTER);
    if (settings.businessName !== false) {
      push(...ESCPOS.BOLD_ON, ...ESCPOS.DOUBLE_HEIGHT);
      line(bName.toUpperCase());
      push(...ESCPOS.NORMAL_SIZE, ...ESCPOS.BOLD_OFF);
    }
    if (settings.headerAddress && bAddress) line(bAddress);
    if (settings.headerPhone && bPhone) line('Ph: ' + bPhone);
    if (settings.headerEmail && bEmail) line(bEmail);
    if (settings.headerGstin && bGstin) line('GSTIN: ' + bGstin);
    if (settings.headerFssai && bFssai) line('FSSAI: ' + bFssai);
    push(...ESCPOS.ALIGN_LEFT);
    line(dashedLine(width));
  }

  // ── Tax/Estimate Label ──
  if (settings.advTaxMode) {
    push(...ESCPOS.ALIGN_CENTER, ...ESCPOS.BOLD_ON);
    line('TAX INVOICE');
    push(...ESCPOS.BOLD_OFF, ...ESCPOS.ALIGN_LEFT);
    line(dashedLine(width));
  }

  // ── Order Info ──
  const date = new Date(order.date || Date.now());
  line(twoCol('Date: ' + date.toLocaleDateString(), settings.showTime !== false ? 'Time: ' + date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '', width));
  const inv = order.invoiceNumber || order.id || 'N/A';
  line(twoCol('Inv: ' + inv, settings.orderType !== false ? (order.orderType || 'Walk-In') : '', width));
  if (settings.customerName !== false && order.customerName) line('To: ' + order.customerName);
  if (settings.cashierName !== false) line('Cashier: ' + (order.createdBy || 'Owner'));
  line(dashedLine(width));

  // ── Items ──
  push(...ESCPOS.BOLD_ON);
  line(twoCol('Item', 'Qty  Rate   Amt', width));
  push(...ESCPOS.BOLD_OFF);
  line(dashedLine(width));

  (order.items || []).forEach(item => {
    const price = item.sellingPrice || item.price || 0;
    const amt = (item.qty * price).toFixed(2);
    const rate = price.toFixed(2);
    const rightCol = `${item.qty}  ${rate.padStart(6)} ${amt.padStart(7)}`;
    const nameWidth = Math.max(1, width - rightCol.length - 1);
    const name = (item.name || '').substring(0, nameWidth);
    line(twoCol(name, rightCol, width));
  });

  line(dashedLine(width));

  // ── Summary ──
  if (settings.summarySubtotal !== false) line(twoCol('Subtotal', '₹' + (order.subtotal || order.total || 0).toFixed(2), width));
  if (settings.summaryDiscount && order.discount) line(twoCol('Discount', '-₹' + order.discount.toFixed(2), width));
  push(...ESCPOS.BOLD_ON, ...ESCPOS.DOUBLE_HEIGHT);
  line(twoCol('TOTAL', '₹' + (order.total || 0).toFixed(2), width));
  push(...ESCPOS.BOLD_OFF, ...ESCPOS.NORMAL_SIZE);
  line(dashedLine(width));

  // ── Payment ──
  if (settings.paymentMethod !== false) line('Paid via: ' + (order.paymentMode || 'CASH'));
  line(dashedLine(width));

  // ── Footer ──
  push(...ESCPOS.ALIGN_CENTER);
  const footerText = settings.customFooterText || settings.customFooter || 'Thank you! Visit again.';
  if (settings.footerMessage !== false) line(footerText);
  push(...ESCPOS.ALIGN_LEFT);

  // Feed + Cut
  push(...ESCPOS.FEED_LINES(4));
  push(...ESCPOS.CUT_PAPER);

  return new Uint8Array(bytes);
}

// ─────────────────────────────────────────────────────────────
// Browser Print Driver
// ─────────────────────────────────────────────────────────────
export class BrowserPrinterDriver {
  isSupported() { return true; }
  isConnected() { return true; }
  getStatus() { return 'ready'; }

  async print(htmlContent) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
    return { success: true };
  }


  async disconnect() {}
}

// ─────────────────────────────────────────────────────────────
// Bluetooth Thermal Driver
// ─────────────────────────────────────────────────────────────

// Common ESC/POS GATT service UUIDs (generic serial + thermal-specific)
const BT_PRINT_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // ESC/POS Printer
  '00001101-0000-1000-8000-00805f9b34fb', // SPP
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // BlueTooth Printer
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC
  '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent
  '0000ff00-0000-1000-8000-00805f9b34fb', // Generic
  '0000ff01-0000-1000-8000-00805f9b34fb',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb', // UART
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb', // Generic BLE
  '0000ae30-0000-1000-8000-00805f9b34fb',
  '0000af30-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // PT210
  '0000a000-0000-1000-8000-00805f9b34fb',
  '0000a001-0000-1000-8000-00805f9b34fb',
  '00000000-0000-1000-8000-00805f9b34fb', // Default generic
  0x18F0, 0xFF00, 0xFFE0, 0xFEE7, 0x1101, 0xAE30, 0xAF30, 0xFFF0
];

const BT_PRINT_CHARACTERISTICS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '0000ffe1-0000-1000-8000-00805f9b34fb', // BLE UART char
  '0000ff01-0000-1000-8000-00805f9b34fb',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000ae01-0000-1000-8000-00805f9b34fb',
  '0000af01-0000-1000-8000-00805f9b34fb'
];

const LS_BT_DEVICE_KEY = 'pos_bt_printer_device_id';
const LS_BT_DEVICE_NAME_KEY = 'pos_bt_printer_device_name';

export class BluetoothPrinterDriver {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this._status = 'disconnected'; // disconnected | connecting | connected | error
    this._lastError = null;
    this._onStatusChange = null;
  }

  isSupported() {
    return typeof navigator !== 'undefined' && !!navigator.bluetooth;
  }

  isConnected() {
    return this._status === 'connected' && this.characteristic !== null;
  }

  getStatus() { return this._status; }
  getLastError() { return this._lastError; }
  getDeviceName() { return this.device?.name || localStorage.getItem(LS_BT_DEVICE_NAME_KEY) || null; }
  getSavedDeviceName() { return localStorage.getItem(LS_BT_DEVICE_NAME_KEY); }

  onStatusChange(fn) { this._onStatusChange = fn; }

  _setStatus(s, err = null) {
    this._status = s;
    this._lastError = err;
    if (this._onStatusChange) this._onStatusChange(s, err);
  }

  async scan() {
    if (!this.isSupported()) throw new Error('Web Bluetooth is not supported in this browser. Use Chrome or Edge on Android/Desktop.');
    this._setStatus('connecting');
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BT_PRINT_SERVICES,
      });
      return device; // caller stores and then calls connect(device)
    } catch (e) {
      this._setStatus('disconnected', e.message);
      throw e;
    }
  }

  async connect(device) {
    this._setStatus('connecting');
    this.device = device;

    // Handle unexpected disconnection
    const onDisconnect = () => {
      this.characteristic = null;
      this.server = null;
      this._setStatus('disconnected', 'Device disconnected unexpectedly');
    };
    device.addEventListener('gattserverdisconnected', onDisconnect);

    let characteristic = null;
    let service = null;
    let retries = 3;
    let lastError = null;

    while (retries > 0 && !characteristic) {
      try {
        this.server = await device.gatt.connect();
        
        // Wait a tiny bit for the connection to stabilize (Android bug workaround)
        await new Promise(resolve => setTimeout(resolve, 600));

        // Try getting services one by one from our list to avoid full discovery timeout
        for (const svcUUID of BT_PRINT_SERVICES) {
          try {
            const svc = await this.server.getPrimaryService(svcUUID);
            const chars = await svc.getCharacteristics();
            const writableChar = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
            if (writableChar) {
              characteristic = writableChar;
              service = svc;
              break;
            }
          } catch (e) {
            // Service not found or error, continue to next
          }
        }
        
        if (characteristic) {
          break; // success
        } else {
          throw new Error('No writable characteristic found in supported services.');
        }

      } catch (err) {
        lastError = err;
        retries--;
        if (retries > 0) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!characteristic) {
      this._setStatus('error', "GATT Connection failed. " + (lastError ? lastError.message : "Unknown"));
      throw new Error("GATT Connection failed after retries. Error: " + (lastError ? lastError.message : "Unknown"));
    }

    this.characteristic = characteristic;
    this._setStatus('connected');
    return true;
  }

  async autoReconnect() {
    const savedName = localStorage.getItem(LS_BT_DEVICE_NAME_KEY);
    if (!savedName || !this.isSupported()) return false;
    try {
      const devices = await navigator.bluetooth.getDevices();
      const saved = devices.find(d => d.name === savedName);
      if (saved) {
        await this.connect(saved);
        return true;
      }
    } catch { /* silent */ }
    return false;
  }

  async print(escposBytes) {
    if (!this.isConnected()) throw new Error('Bluetooth printer not connected');
    const CHUNK_SIZE = 512;
    const useWriteWithoutResponse = this.characteristic.properties.writeWithoutResponse;
    try {
      for (let offset = 0; offset < escposBytes.length; offset += CHUNK_SIZE) {
        const chunk = escposBytes.slice(offset, offset + CHUNK_SIZE);
        if (useWriteWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.characteristic.writeValue(chunk);
        }
        // Small delay to prevent buffer overflow on cheap printers
        await new Promise(r => setTimeout(r, 20));
      }
      return { success: true };
    } catch (e) {
      this._setStatus('error', e.message);
      throw e;
    }
  }

  savePreferred() {
    if (this.device && this.device.name) {
      localStorage.setItem('pos_bt_printer_device_name', this.device.name);
    }
    if (this.device && this.device.id) {
      localStorage.setItem('pos_bt_printer_device_id', this.device.id);
    }
  }

  async disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      try { this.device.gatt.disconnect(); } catch (e) { /* ignore */ }
    }
    this.characteristic = null;
    this.server = null;
    this.device = null;
    this._setStatus('disconnected');
    localStorage.removeItem('pos_bt_printer_device_name');
    localStorage.removeItem('pos_bt_printer_device_id');
  }
}

// ─────────────────────────────────────────────────────────────
// WebUSB Printer Driver
// ─────────────────────────────────────────────────────────────

// USB class 0x07 = Printer class (covers Epson, Xprinter, Star, etc.)
export class USBPrinterDriver {
  constructor() {
    this.device = null;
    this._status = 'disconnected';
    this._lastError = null;
    this._endpointOut = null;
    this._onStatusChange = null;
  }

  isSupported() {
    return typeof navigator !== 'undefined' && !!navigator.usb;
  }

  isConnected() { return this._status === 'connected'; }
  getStatus() { return this._status; }
  getLastError() { return this._lastError; }
  getDeviceName() {
    if (!this.device) return null;
    return `${this.device.manufacturerName || ''} ${this.device.productName || ''}`.trim() || 'USB Printer';
  }

  onStatusChange(fn) { this._onStatusChange = fn; }
  _setStatus(s, err = null) {
    this._status = s;
    this._lastError = err;
    if (this._onStatusChange) this._onStatusChange(s, err);
  }

  async detect() {
    if (!this.isSupported()) throw new Error('WebUSB is not supported in this browser. Use Chrome or Edge.');
    try {
      const device = await navigator.usb.requestDevice({
        filters: [{ classCode: 0x07 }], // USB Printer class
      });
      return device;
    } catch (e) {
      throw new Error(e.message === 'No device selected.' ? 'No USB printer selected.' : e.message);
    }
  }

  async connect(device) {
    this._setStatus('connecting');
    this.device = device;
    try {
      await device.open();
      if (device.configuration === null) await device.selectConfiguration(1);

      // Find printer interface
      let iface = null;
      let endpoint = null;
      for (const cfg of device.configurations) {
        for (const intf of cfg.interfaces) {
          for (const alt of intf.alternates) {
            if (alt.interfaceClass === 0x07) {
              iface = intf;
              endpoint = alt.endpoints.find(e => e.direction === 'out');
              break;
            }
          }
          if (endpoint) break;
        }
        if (endpoint) break;
      }

      if (!iface || !endpoint) {
        // Fallback: use first OUT bulk endpoint
        const cfg = device.configurations[0];
        for (const intf of cfg.interfaces) {
          await device.claimInterface(intf.interfaceNumber);
          for (const alt of intf.alternates) {
            const ep = alt.endpoints.find(e => e.direction === 'out' && e.type === 'bulk');
            if (ep) { endpoint = ep; iface = intf; break; }
          }
          if (endpoint) break;
          else await device.releaseInterface(intf.interfaceNumber);
        }
      } else {
        await device.claimInterface(iface.interfaceNumber);
      }

      if (!endpoint) throw new Error('Could not find a usable USB bulk-out endpoint on this device.');

      this._endpointOut = endpoint.endpointNumber;
      this._setStatus('connected');
      return true;
    } catch (e) {
      this._setStatus('error', e.message);
      throw e;
    }
  }

  async disconnect() {
    if (this.device) {
      try { await this.device.close(); } catch { /* ignore */ }
    }
    this.device = null;
    this._endpointOut = null;
    this._setStatus('disconnected');
  }

  async print(escposBytes) {
    if (!this.isConnected()) throw new Error('USB printer not connected');
    const CHUNK_SIZE = 4096;
    try {
      for (let offset = 0; offset < escposBytes.length; offset += CHUNK_SIZE) {
        const chunk = escposBytes.slice(offset, offset + CHUNK_SIZE);
        await this.device.transferOut(this._endpointOut, chunk);
      }
      return { success: true };
    } catch (e) {
      this._setStatus('error', e.message);
      throw e;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Network (ESC/POS TCP) Printer Driver via HTTP Relay
// ─────────────────────────────────────────────────────────────
export class NetworkPrinterDriver {
  constructor() {
    this._status = 'disconnected';
    this._lastError = null;
    this._onStatusChange = null;
  }

  isSupported() { return true; } // HTTP fetch is always available
  isConnected() { return this._status === 'connected'; }
  getStatus() { return this._status; }
  getLastError() { return this._lastError; }

  onStatusChange(fn) { this._onStatusChange = fn; }
  _setStatus(s, err = null) {
    this._status = s;
    this._lastError = err;
    if (this._onStatusChange) this._onStatusChange(s, err);
  }

  _relayUrl(ip, port) {
    // Default relay runs on localhost:6001 (the companion relay script)
    return `http://localhost:6001/print?ip=${encodeURIComponent(ip)}&port=${encodeURIComponent(port || 9100)}`;
  }

  async testConnection(ip, port = 9100) {
    this._setStatus('connecting');
    try {
      const res = await fetch(
        `http://localhost:6001/ping?ip=${encodeURIComponent(ip)}&port=${encodeURIComponent(port)}`,
        { method: 'GET', signal: AbortSignal.timeout(4000) }
      );
      if (res.ok) {
        this._setStatus('connected');
        return { success: true };
      }
      throw new Error(`Relay responded with ${res.status}`);
    } catch (e) {
      const msg = e.name === 'TimeoutError'
        ? 'Connection timed out. Check that the relay script is running and the printer IP is correct.'
        : e.message.includes('Failed to fetch')
          ? 'Cannot reach the local relay. Make sure the relay script is running (see instructions below).'
          : e.message;
      this._setStatus('error', msg);
      throw new Error(msg);
    }
  }

  async print(escposBytes, ip, port = 9100) {
    try {
      const res = await fetch(this._relayUrl(ip, port), {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: escposBytes,
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Relay error: ${res.status} ${await res.text()}`);
      this._setStatus('connected');
      return { success: true };
    } catch (e) {
      this._setStatus('error', e.message);
      throw e;
    }
  }

  disconnect() {
    this._setStatus('disconnected');
  }
}

// ─────────────────────────────────────────────────────────────
// Singleton instances (shared across the app)
// ─────────────────────────────────────────────────────────────
export const browserDriver    = new BrowserPrinterDriver();
export const bluetoothDriver  = new BluetoothPrinterDriver();
export const usbDriver        = new USBPrinterDriver();
export const networkDriver    = new NetworkPrinterDriver();

export function getDriver(printerModule) {
  switch (printerModule) {
    case 'thermal_bt':    return bluetoothDriver;
    case 'thermal_usb':   return usbDriver;
    case 'thermal_escpos': return networkDriver;
    default:              return browserDriver;
  }
}
