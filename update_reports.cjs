const fs = require('fs');

let code = fs.readFileSync('src/pages/Reports.jsx', 'utf-8');

// The original reports has basic charts.
// We need to inject the new cards.
const importFix = `import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useState, useMemo } from 'react';
import { FileText, Download, Printer, TrendingUp, DollarSign, PieChart, ShoppingBag, TrendingDown, Star, Clock, AlertTriangle, CreditCard, Banknote, Smartphone } from 'lucide-react';
`;
code = code.replace(/import \{.*\} from 'lucide-react';/, "import { FileText, Download, Printer, TrendingUp, DollarSign, PieChart, ShoppingBag, TrendingDown, Star, Clock, AlertTriangle, CreditCard, Banknote, Smartphone } from 'lucide-react';");

code = code.replace(
  "export default function Reports() {",
  `export default function Reports() {
  const allSales = useLiveQuery(() => db.sales.toArray()) || [];
  const allExpenses = useLiveQuery(() => db.expenses.toArray()) || [];
  const allPurchases = useLiveQuery(() => db.purchases?.toArray()) || [];
`
);

const kpiLogic = `
  const kpis = useMemo(() => {
    // Filter by timeframe
    const now = new Date();
    let start = new Date(0);
    if (timeframe === 'today') {
      start = new Date(now.setHours(0,0,0,0));
    } else if (timeframe === 'week') {
      start = new Date(now.setDate(now.getDate() - 7));
    } else if (timeframe === 'month') {
      start = new Date(now.setMonth(now.getMonth() - 1));
    }
    const isoStart = start.toISOString();
    
    const fSales = allSales.filter(s => s.date >= isoStart);
    const fExp = allExpenses.filter(e => e.date >= isoStart);
    const fPurchases = allPurchases.filter(p => p.date >= isoStart);

    const grossSales = fSales.reduce((acc, s) => acc + s.total, 0);
    const refunds = fSales.filter(s => s.status === 'REFUNDED').reduce((acc, s) => acc + s.total, 0);
    const netSales = grossSales - refunds;
    const expenses = fExp.reduce((acc, e) => acc + e.amount, 0);
    const purchases = fPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
    const netProfit = netSales - purchases - expenses;

    // Payment Breakdown
    let pCash = 0, pUpi = 0, pCard = 0, pWallet = 0, pSplit = 0;
    fSales.filter(s => s.status !== 'REFUNDED').forEach(s => {
      const mode = s.paymentMode?.toUpperCase() || 'CASH';
      if (mode === 'CASH') pCash += s.total;
      else if (mode === 'UPI') pUpi += s.total;
      else if (mode === 'CARD') pCard += s.total;
      else if (mode === 'WALLET') pWallet += s.total;
      else pSplit += s.total;
    });
    const totalPayments = pCash + pUpi + pCard + pWallet + pSplit;

    // Insights
    const itemCounts = {};
    const hourCounts = {};
    fSales.filter(s => s.status !== 'REFUNDED').forEach(s => {
      s.items.forEach(i => {
        itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty;
      });
      const hour = new Date(s.date).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + s.total;
    });

    let bestSeller = { name: 'N/A', qty: 0 };
    let worstSeller = { name: 'N/A', qty: Infinity };
    Object.entries(itemCounts).forEach(([name, qty]) => {
      if (qty > bestSeller.qty) bestSeller = { name, qty };
      if (qty < worstSeller.qty && qty > 0) worstSeller = { name, qty };
    });
    if (worstSeller.qty === Infinity) worstSeller = { name: 'N/A', qty: 0 };

    let peakHour = 'N/A';
    let maxHourSales = 0;
    Object.entries(hourCounts).forEach(([hour, total]) => {
      if (total > maxHourSales) {
        maxHourSales = total;
        const h = parseInt(hour);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        peakHour = \`\${displayH} \${ampm} - \${displayH + 1 === 13 ? 1 : displayH + 1} \${displayH === 11 ? (ampm==='AM'?'PM':'AM') : ampm}\`;
      }
    });

    return {
      grossSales, netSales, expenses, purchases, netProfit,
      payments: { cash: pCash, upi: pUpi, card: pCard, wallet: pWallet, split: pSplit, total: totalPayments },
      insights: { bestSeller, worstSeller, peakHour }
    };
  }, [allSales, allExpenses, allPurchases, timeframe]);
`;

code = code.replace("const [timeframe, setTimeframe] = useState('today');", "const [timeframe, setTimeframe] = useState('today');\n" + kpiLogic);

// We need to inject UI.
const reportUiInject = `
        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-ui-card p-4 rounded-3xl border border-ui-border shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-ui-muted text-xs font-bold uppercase mb-1 flex items-center gap-1"><ShoppingBag size={14}/> Gross Sales</div>
            <div className="text-xl font-black text-ui-text">₹{kpis.grossSales.toFixed(2)}</div>
          </div>
          <div className="bg-ui-card p-4 rounded-3xl border border-ui-border shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-brand-primary">
            <div className="text-ui-muted text-xs font-bold uppercase mb-1 flex items-center gap-1"><TrendingUp size={14}/> Net Sales</div>
            <div className="text-xl font-black text-brand-primary">₹{kpis.netSales.toFixed(2)}</div>
          </div>
          <div className="bg-ui-card p-4 rounded-3xl border border-ui-border shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-ui-muted text-xs font-bold uppercase mb-1 flex items-center gap-1"><TrendingDown size={14} className="text-brand-danger"/> Expenses</div>
            <div className="text-xl font-black text-brand-danger">₹{kpis.expenses.toFixed(2)}</div>
          </div>
          <div className="bg-ui-card p-4 rounded-3xl border border-ui-border shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-ui-muted text-xs font-bold uppercase mb-1 flex items-center gap-1"><ShoppingBag size={14} className="text-orange-500"/> Purchases</div>
            <div className="text-xl font-black text-orange-500">₹{kpis.purchases.toFixed(2)}</div>
          </div>
          <div className="bg-ui-card p-4 rounded-3xl border border-ui-border shadow-sm flex flex-col items-center justify-center text-center border-b-4 border-b-green-500 bg-green-500/5">
            <div className="text-ui-muted text-xs font-bold uppercase mb-1 flex items-center gap-1"><DollarSign size={14} className="text-green-600"/> Net Profit</div>
            <div className="text-xl font-black text-green-600">₹{kpis.netProfit.toFixed(2)}</div>
          </div>
        </div>

        {/* SECOND ROW: PAYMENTS & INSIGHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Payment Breakdown */}
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
            <h3 className="text-lg font-bold text-ui-text mb-4 flex items-center gap-2"><CreditCard size={18}/> Payment Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Cash', amount: kpis.payments.cash, icon: Banknote, color: 'text-green-500', bg: 'bg-green-500/10' },
                { label: 'UPI', amount: kpis.payments.upi, icon: Smartphone, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
                { label: 'Card', amount: kpis.payments.card, icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                { label: 'Wallet', amount: kpis.payments.wallet, icon: PieChart, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { label: 'Split Payments', amount: kpis.payments.split, icon: PieChart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              ].map(p => {
                 const pct = kpis.payments.total > 0 ? ((p.amount / kpis.payments.total) * 100).toFixed(1) : 0;
                 return (
                  <div key={p.label} className="flex items-center justify-between p-3 rounded-xl bg-ui-bg border border-ui-border">
                    <div className="flex items-center gap-3">
                      <div className={\`w-10 h-10 rounded-xl flex items-center justify-center \${p.bg} \${p.color}\`}><p.icon size={18}/></div>
                      <div>
                        <div className="font-bold text-sm text-ui-text">{p.label}</div>
                        <div className="text-xs font-medium text-ui-muted">{pct}% of Sales</div>
                      </div>
                    </div>
                    <div className="font-bold text-ui-text">₹{p.amount.toFixed(2)}</div>
                  </div>
                 );
              })}
            </div>
          </div>

          {/* Top Insights */}
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
            <h3 className="text-lg font-bold text-ui-text mb-4 flex items-center gap-2"><Star size={18}/> Business Insights</h3>
            <div className="space-y-4">
              
              <div className="flex items-center gap-4 p-4 bg-green-500/5 border border-green-500/20 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0"><Star size={24}/></div>
                <div>
                  <div className="text-xs font-bold text-green-600/80 uppercase">Best Seller</div>
                  <div className="font-black text-ui-text text-lg">{kpis.insights.bestSeller.name}</div>
                  <div className="text-sm font-medium text-ui-muted">{kpis.insights.bestSeller.qty} units sold</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0"><AlertTriangle size={24}/></div>
                <div>
                  <div className="text-xs font-bold text-red-600/80 uppercase">Worst Seller</div>
                  <div className="font-black text-ui-text text-lg">{kpis.insights.worstSeller.name}</div>
                  <div className="text-sm font-medium text-ui-muted">{kpis.insights.worstSeller.qty} units sold</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0"><Clock size={24}/></div>
                <div>
                  <div className="text-xs font-bold text-blue-600/80 uppercase">Peak Sales Hour</div>
                  <div className="font-black text-ui-text text-lg">{kpis.insights.peakHour}</div>
                  <div className="text-sm font-medium text-ui-muted">Busiest time of day</div>
                </div>
              </div>

            </div>
          </div>
        </div>
`;

// Insert the UI block right after the timeframe buttons header
const headerEnd = code.indexOf('</div>\n      </div>\n\n      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">');
if (headerEnd !== -1) {
  code = code.replace('</div>\n      </div>\n\n      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">', '</div>\n      </div>\n\n' + reportUiInject + '\n\n      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">');
}

fs.writeFileSync('src/pages/Reports.jsx', code);
