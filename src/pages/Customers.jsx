import React, { useState } from 'react';
import { useLiveQuery } from '../db/db';
import { db } from '../db/db';
import { Plus, Gift, CreditCard, Clock, Award, ChevronDown, ChevronUp, ReceiptText } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function Customers() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const sales = useLiveQuery(() => db.sales.where('status').equals('PAID').toArray()) || [];

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!name || !mobile) return;
    const exists = await db.customers.where('mobile').equals(mobile).first();
    if (exists) {
      alert("A customer with this mobile number already exists.");
      return;
    }
    await db.customers.add({ name, mobile, loyaltyPoints: 0 });
    setName(''); setMobile('');
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.mobile.includes(search)
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
      <h1 className="text-3xl font-bold text-ui-text tracking-tight mb-8">Customers & CRM</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <input type="text" placeholder="Search customers..." className="w-full p-4 rounded-2xl bg-ui-card border border-ui-border shadow-sm focus:ring-2 focus:ring-brand-primary outline-none font-medium text-ui-text" value={search} onChange={e => setSearch(e.target.value)} />
          
          <div className="space-y-4">
            {filteredCustomers.length === 0 && <div className="text-ui-muted text-center py-10 bg-ui-card rounded-3xl border border-ui-border border-dashed font-medium">No customers found.</div>}
            
            {filteredCustomers.map(customer => {
              const customerOrders = sales.filter(s => s.customerId === customer.id).sort((a,b) => new Date(b.date) - new Date(a.date));
              const totalSpend = customerOrders.reduce((acc, curr) => acc + curr.total, 0);
              const lastVisit = customerOrders.length > 0 ? customerOrders[0].date : null;
              const isExpanded = expandedId === customer.id;
              
              return (
                <div key={customer.id} className="bg-ui-card rounded-3xl border border-ui-border shadow-sm overflow-hidden">
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : customer.id)}>
                    <div>
                      <h3 className="font-bold text-ui-text text-lg">{customer.name}</h3>
                      <p className="text-ui-muted font-medium mt-1">{customer.mobile}</p>
                      {customer.loyaltyPoints > 0 && (
                        <div className="mt-3 inline-flex items-center gap-1.5 bg-brand-warning/10 text-brand-warning px-3 py-1 rounded-lg text-sm font-bold border border-brand-warning/20">
                          <Award size={16}/> {customer.loyaltyPoints} Points
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="flex gap-4 sm:gap-6 bg-ui-bg p-4 rounded-2xl border border-ui-border">
                        <div>
                           <p className="text-xs font-bold text-ui-muted flex items-center gap-1 mb-1"><CreditCard size={14}/> Total Spend</p>
                           <p className="font-bold text-brand-primary">₹{totalSpend.toFixed(2)}</p>
                        </div>
                        <div>
                           <p className="text-xs font-bold text-ui-muted flex items-center gap-1 mb-1"><Gift size={14}/> Orders</p>
                           <p className="font-bold text-ui-text">{customerOrders.length}</p>
                        </div>
                        <div className="hidden sm:block">
                           <p className="text-xs font-bold text-ui-muted flex items-center gap-1 mb-1"><Clock size={14}/> Last Visit</p>
                           <p className="font-bold text-ui-text text-sm">{lastVisit ? format(new Date(lastVisit), 'MMM dd, yy') : 'Never'}</p>
                        </div>
                      </div>
                      <button className="text-ui-muted hover:text-ui-text p-2 bg-ui-bg rounded-full border border-ui-border">
                        {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                      </button>
                    </div>
                  </div>

                  {/* ORDER HISTORY EXPANSION */}
                  {isExpanded && (
                    <div className="border-t border-ui-border bg-ui-bg/50 p-6">
                      <h4 className="font-bold text-ui-text mb-4 text-sm flex items-center gap-2"><ReceiptText size={16}/> Order History</h4>
                      {customerOrders.length === 0 ? (
                        <p className="text-sm text-ui-muted font-medium">No previous orders.</p>
                      ) : (
                        <div className="space-y-3">
                          {customerOrders.slice(0, 10).map(order => (
                            <div key={order.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-ui-card p-4 rounded-2xl border border-ui-border gap-3">
                              <div>
                                <div className="font-bold text-ui-text text-sm mb-1">{order.invoiceNumber || `Order #${order.id}`}</div>
                                <div className="text-xs text-ui-muted font-medium">{format(new Date(order.date), 'dd MMM yyyy, p')}</div>
                              </div>
                              <div className="text-sm font-medium text-ui-muted flex-1">
                                {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-ui-text">₹{order.total.toFixed(2)}</div>
                                <div className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded inline-block mt-1">{order.paymentMode}</div>
                              </div>
                            </div>
                          ))}
                          {customerOrders.length > 10 && <div className="text-center text-xs text-ui-muted font-bold mt-2">Showing last 10 orders</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-6 text-ui-text">New Customer</h2>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
            <input type="tel" placeholder="Mobile Number" required value={mobile} onChange={e => setMobile(e.target.value)} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-medium" />
            <button type="submit" className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"><Plus size={20}/> Save Profile</button>
          </form>
        </div>
      </div>
    </div>
  );
}
