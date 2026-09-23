const fs = require('fs');
let code = fs.readFileSync('src/db/db.js', 'utf-8');

// Add version 9
const v8Block = `db.version(8).stores({
  employees: '++id, empId, name, phone, address, joinDate, designation, department, monthlySalary, status',
  attendance: '++id, employeeId, date, checkIn, checkOut, status, [employeeId+date]',
  payroll: '++id, employeeId, month, year, status',
  salary_slips: '++id, employeeId, month, year'
}).upgrade(trans => {
  trans.employees.toCollection().modify(emp => {
    emp.empId = emp.empId || \`EMP\${emp.id.toString().padStart(4, '0')}\`;
    emp.monthlySalary = emp.monthlySalary || emp.baseSalary || 0;
    emp.department = emp.department || 'Billing';
    emp.designation = emp.designation || emp.role || 'Staff';
    emp.joinDate = emp.joinDate || new Date().toISOString().split('T')[0];
    emp.address = emp.address || '';
  });
});`;

const v9Block = `\n// v9: Shifts Management
db.version(9).stores({
  shifts: '++id, startTime, endTime, userId, status' // status: 'active', 'closed'
});`;

if (!code.includes('db.version(9)')) {
  code = code.replace(v8Block, v8Block + v9Block);
}

// Replace generateInvoiceNumber
const oldGen = `export const generateInvoiceNumber = async () => {
  const profile = await db.settings.get('profile');
  const printSettings = await db.settings.get('print');
  const prefix = profile?.terminalId || 'T1';
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = await db.sales.where('date').aboveOrEqual(todayStart.toISOString()).count();
  const seq = String(todayCount + 1).padStart(4, '0');
  
  const format = printSettings?.invoiceFormat || 'standard';
  if (format === 'short') return \`\${prefix}-\${seq}\`;
  if (format === 'minimal') return \`\${seq}\`;
  return \`\${prefix}-\${dateStr}-\${seq}\`;
};`;

const newGen = `export const generateInvoiceNumber = async () => {
  const profile = await db.settings.get('profile');
  const printAdvanced = await db.settings.get('printAdvanced');
  const printSettings = printAdvanced?.data || (await db.settings.get('print'));
  
  const prefix = profile?.terminalId || 'T1';
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayCount = await db.sales.where('date').aboveOrEqual(todayStart.toISOString()).count();
  
  const offset = parseInt(printSettings?.customInvoiceStart, 10);
  const seqVal = todayCount + (isNaN(offset) ? 1 : offset);
  const seq = String(seqVal).padStart(4, '0');
  
  const format = printSettings?.invoiceFormat || 'standard';
  if (format === 'short') return \`\${prefix}-\${seq}\`;
  if (format === 'minimal') return \`\${seq}\`;
  return \`\${prefix}-\${dateStr}-\${seq}\`;
};`;

code = code.replace(oldGen, newGen);
fs.writeFileSync('src/db/db.js', code);
