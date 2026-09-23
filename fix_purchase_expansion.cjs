const fs = require('fs');
let file = fs.readFileSync('src/pages/Purchase.jsx', 'utf8');

// 1. Add expanded state
file = file.replace(
  `const [customEnd, setCustomEnd] = useState('');`,
  `const [customEnd, setCustomEnd] = useState('');\n  const [expandedPurchaseId, setExpandedPurchaseId] = useState(null);`
);

// We need ChevronDown/Up from lucide-react
file = file.replace(
  `ArrowUpRight, X } from 'lucide-react';`,
  `ArrowUpRight, X, ChevronDown, ChevronUp } from 'lucide-react';`
);

// 2. Modify the mapping logic
const originalMapBody = `
                return (
                  <div key={p.id} className="bg-ui-card p-5 rounded-3xl border border-ui-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-ui-bg rounded-2xl flex items-center justify-center text-ui-muted"><Receipt size={24}/></div>
                      <div>
                        <h3 className="font-bold text-ui-text">{sup ? sup.name : 'Unknown Supplier'}</h3>
                        <p className="text-ui-muted text-sm font-medium mt-1">{format(new Date(p.date), 'dd MMM yyyy, p')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 bg-ui-bg p-3 rounded-2xl border border-ui-border">
                      <div className="text-center">
                        <div className="text-xs text-ui-muted font-bold">Total</div>
                        <div className="font-bold text-ui-text">₹{p.totalAmount}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-ui-muted font-bold">Paid</div>
                        <div className="font-bold text-brand-accent">₹{p.paidAmount}</div>
                      </div>
                      {isPending && (
                        <div className="text-center">
                          <div className="text-xs text-brand-danger font-bold">Due</div>
                          <div className="font-bold text-brand-danger">₹{p.totalAmount - p.paidAmount}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
`;

const newMapBody = `
                const isExpanded = expandedPurchaseId === p.id;
                return (
                  <div key={p.id} className="bg-ui-card rounded-3xl border border-ui-border shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={() => setExpandedPurchaseId(isExpanded ? null : p.id)}>
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-ui-bg rounded-2xl flex items-center justify-center text-ui-muted"><Receipt size={24}/></div>
                        <div>
                          <h3 className="font-bold text-ui-text">{sup ? sup.name : 'Unknown Supplier'}</h3>
                          <p className="text-ui-muted text-sm font-medium mt-1">{format(new Date(p.date), 'dd MMM yyyy, p')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-6 bg-ui-bg p-3 rounded-2xl border border-ui-border">
                          <div className="text-center">
                            <div className="text-xs text-ui-muted font-bold">Total</div>
                            <div className="font-bold text-ui-text">₹{p.totalAmount}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-ui-muted font-bold">Paid</div>
                            <div className="font-bold text-brand-accent">₹{p.paidAmount}</div>
                          </div>
                          {isPending && (
                            <div className="text-center">
                              <div className="text-xs text-brand-danger font-bold">Due</div>
                              <div className="font-bold text-brand-danger">₹{p.totalAmount - p.paidAmount}</div>
                            </div>
                          )}
                        </div>
                        <div className="text-ui-muted hidden sm:block">
                          {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-ui-border bg-ui-bg/50">
                        <h4 className="font-bold text-ui-text text-sm mb-3">Items Purchased:</h4>
                        <div className="space-y-2">
                          {(p.items || []).map((item, idx) => {
                            const invItem = inventory.find(i => i.id === item.inventoryId);
                            return (
                              <div key={idx} className="flex justify-between items-center bg-ui-card p-3 rounded-xl border border-ui-border shadow-sm">
                                <span className="font-bold text-ui-text text-sm">{invItem ? invItem.name : 'Unknown Item'}</span>
                                <span className="text-ui-muted text-sm font-medium">{item.qty} x {item.multiplier} {invItem?.unit || 'unit'}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
`;

file = file.replace(originalMapBody.trim(), newMapBody.trim());

fs.writeFileSync('src/pages/Purchase.jsx', file);
