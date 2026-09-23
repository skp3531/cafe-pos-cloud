import React from 'react';
import { useLiveQuery } from '../db/db';
import { db } from '../db/db';
import { Clock, Download, Printer } from 'lucide-react';

export default function Shifts() {
  const shifts = useLiveQuery(async () => {
    try { return db.shifts ? await db.shifts.orderBy('startTime').reverse().toArray() : []; } catch (e) { return []; }
  }) || [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-ui-text">Shift History</h1>
          <p className="text-sm font-medium text-ui-muted">Audit trail of all register shifts</p>
        </div>
      </div>

      <div className="bg-ui-card rounded-3xl border border-ui-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ui-bg border-b border-ui-border text-xs uppercase font-black text-ui-muted">
                <th className="p-4 whitespace-nowrap">Shift Date</th>
                <th className="p-4 whitespace-nowrap">Time</th>
                <th className="p-4 whitespace-nowrap">User</th>
                <th className="p-4 whitespace-nowrap text-right">Opening (₹)</th>
                <th className="p-4 whitespace-nowrap text-right">Expected (₹)</th>
                <th className="p-4 whitespace-nowrap text-right">Closing (₹)</th>
                <th className="p-4 whitespace-nowrap text-right">Difference</th>
                <th className="p-4 whitespace-nowrap text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-ui-text">
              {shifts.map(s => {
                const diff = s.difference || 0;
                const diffColor = diff === 0 ? 'text-green-500' : Math.abs(diff) < 50 ? 'text-orange-500' : 'text-red-500';
                return (
                  <tr key={s.id} className="border-b border-ui-border hover:bg-ui-bg/50 transition-colors">
                    <td className="p-4 whitespace-nowrap">{new Date(s.startTime).toLocaleDateString()}</td>
                    <td className="p-4 whitespace-nowrap">
                      {new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                      {s.endTime ? new Date(s.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}
                    </td>
                    <td className="p-4 whitespace-nowrap">{s.userId || 'User'}</td>
                    <td className="p-4 whitespace-nowrap text-right">{s.openingCash?.toFixed(2)}</td>
                    <td className="p-4 whitespace-nowrap text-right">{s.expectedCash?.toFixed(2) || '-'}</td>
                    <td className="p-4 whitespace-nowrap text-right">{s.closingCash?.toFixed(2) || '-'}</td>
                    <td className={`p-4 whitespace-nowrap text-right ${diffColor}`}>
                      {s.status === 'closed' ? `${diff > 0 ? '+' : ''}${diff.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-4 whitespace-nowrap text-center">
                      {s.status === 'active' ? (
                        <span className="bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-md text-[10px] uppercase">Active</span>
                      ) : (
                        <span className="bg-ui-muted/10 text-ui-muted px-2 py-1 rounded-md text-[10px] uppercase">Closed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {shifts.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-ui-muted">
                    No shift records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
