import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from '../db/db';
import { db, hashPin } from '../db/db';
import DayCloseModal from '../components/DayCloseModal';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, UserCircle, CalendarCheck, Wallet, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, LayoutDashboard, MapPin, LockKeyhole } from 'lucide-react';
import { format, startOfMonth, endOfMonth, getDaysInMonth, isSameDay } from 'date-fns';
import clsx from 'clsx';

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function Employees() {
  const user = useAuthStore(state => state.user);
  const isEmployee = user?.role === 'employee';
  
  const [activeTab, setActiveTab] = useState(isEmployee ? 'portal' : 'dashboard');
  const [isDayCloseOpen, setIsDayCloseOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const todayDate = new Date().toISOString().split('T')[0];
  const [newEmp, setNewEmp] = useState({ name: '', phone: '', address: '', department: 'Billing', designation: 'Staff', monthlySalary: '', joinDate: todayDate });

  const employees = useLiveQuery(() => db.employees.where('status').notEqual('inactive').toArray()) || [];
  const allAttendance = useLiveQuery(() => db.attendance.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('profile')) || {};
  const [attDate, setAttDate] = useState(todayDate);

  // Manager dashboard logic
  const dashboardStats = useMemo(() => {
    const todayAtt = allAttendance.filter(a => a.date === todayDate);
    const present = todayAtt.filter(a => a.status === 'Present').length;
    const half = todayAtt.filter(a => a.status === 'Half Day').length;
    const late = todayAtt.filter(a => a.status === 'Late').length;
    const absent = todayAtt.filter(a => a.status === 'Absent').length;
    const totalStaff = employees.length;
    
    const salaryLiability = employees.reduce((sum, emp) => sum + (parseFloat(emp.monthlySalary) || 0), 0);
    const attPercent = totalStaff > 0 ? Math.round(((present + half) / totalStaff) * 100) : 0;
    
    return { present, half, late, absent, totalStaff, salaryLiability, attPercent };
  }, [allAttendance, employees, todayDate]);

  // Employee Portal Logic
  const portalEmp = employees.find(e => e.name === user?.name);
  const [checkInLoading, setCheckInLoading] = useState(false);

  const handleGPSAction = async (actionType) => {
    if (!portalEmp) return;
    setCheckInLoading(true);
    
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setCheckInLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const storeLat = parseFloat(settings.storeLat);
        const storeLng = parseFloat(settings.storeLng);
        const radius = parseFloat(settings.attendanceRadius) || 100;

        if (storeLat && storeLng) {
          const dist = getDistance(latitude, longitude, storeLat, storeLng);
          if (dist > radius) {
            alert(`Outside Attendance Area (Distance: ${Math.round(dist)}m, Allowed: ${radius}m). Please move closer to the store.`);
            setCheckInLoading(false);
            return;
          }
        }

        const now = new Date();
        const existing = await db.attendance.where({ employeeId: portalEmp.id, date: todayDate }).first();
        
        if (actionType === 'checkin') {
          if (existing && existing.checkIn) {
            alert("Already checked in today!");
          } else {
            // Determine if late (e.g. after 10 AM) - simplified logic
            let status = 'Present';
            if (now.getHours() >= 10 && now.getMinutes() > 0) status = 'Late';
            
            if (existing) {
              await db.attendance.update(existing.id, { checkIn: now.toISOString(), status });
            } else {
              await db.attendance.add({ employeeId: portalEmp.id, date: todayDate, checkIn: now.toISOString(), checkOut: null, status });
            }
            alert("Checked in successfully!");
          }
        } else if (actionType === 'checkout') {
          if (!existing || !existing.checkIn) {
            alert("You need to check in first!");
          } else if (existing.checkOut) {
            alert("Already checked out today!");
          } else {
            await db.attendance.update(existing.id, { checkOut: now.toISOString() });
            alert("Checked out successfully!");
          }
        }
      } catch (err) {
        console.error(err);
        alert("Error processing attendance.");
      }
      setCheckInLoading(false);
    }, (error) => {
      alert("Unable to retrieve your location. Please ensure location permissions are granted.");
      setCheckInLoading(false);
    }, (error) => {
      console.error(error);
      alert('GPS Error: ' + error.message + '\nPlease ensure location permissions are granted in your browser.');
      setCheckInLoading(false);
    }, { timeout: 10000 });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.phone) return;
    const empId = await db.employees.add({ ...newEmp, monthlySalary: parseFloat(newEmp.monthlySalary) || 0, status: 'active' });
    
    // Auto-create user for login
    // Generate an 8-character password: first 4 letters of name + last 4 digits of phone
    const namePart = (newEmp.name.replace(/\s+/g, '').padEnd(4, 'a').slice(0, 4).toLowerCase());
    const phonePart = (newEmp.phone.padEnd(4, '0').slice(-4));
    const pin = namePart + phonePart;
    
    const hashed = await hashPin(pin);
    await db.users.add({ name: newEmp.name, pin: hashed, role: 'employee', permissions: ['employees'] });
    
    alert(`Employee added! Login Password is: ${pin}`);
    setNewEmp({ name: '', phone: '', address: '', department: 'Billing', designation: 'Staff', monthlySalary: '', joinDate: todayDate });
    setShowAddModal(false);
  };

  const handleMarkAttendance = async (empId, status) => {
    const existing = await db.attendance.where({ employeeId: empId, date: attDate }).first();
    if (existing) {
      await db.attendance.update(existing.id, { status });
    } else {
      await db.attendance.add({ employeeId: empId, date: attDate, status });
    }
  };

  const getEmpAttendance = (empId) => {
    const record = allAttendance.find(a => a.employeeId === empId && a.date === attDate);
    return record ? record.status : null;
  };

  // --- Payroll Logic ---
  const [payrollMonth, setPayrollMonth] = useState(startOfMonth(new Date()));
  const prevMonth = () => { const d = new Date(payrollMonth); d.setMonth(d.getMonth() - 1); setPayrollMonth(d); };
  const nextMonth = () => { const d = new Date(payrollMonth); d.setMonth(d.getMonth() + 1); setPayrollMonth(d); };

  const payrollData = useMemo(() => {
    const sDate = startOfMonth(payrollMonth).toISOString().split('T')[0];
    const eDate = endOfMonth(payrollMonth).toISOString().split('T')[0];
    const daysInMonth = getDaysInMonth(payrollMonth);

    return employees.map(emp => {
      const att = allAttendance.filter(a => a.employeeId === emp.id && a.date >= sDate && a.date <= eDate);
      const presents = att.filter(a => ['Present', 'Late'].includes(a.status)).length;
      const halfDays = att.filter(a => a.status === 'Half Day').length;
      const effectiveDays = presents + (halfDays * 0.5);
      const salary = parseFloat(emp.monthlySalary) || 0;
      const earned = (salary / daysInMonth) * effectiveDays;

      return { ...emp, effectiveDays, earned, presents, halfDays };
    });
  }, [employees, allAttendance, payrollMonth]);


  if (isEmployee) {
    const myAtt = allAttendance.filter(a => a.employeeId === portalEmp?.id).sort((a,b) => b.date.localeCompare(a.date));
    const todayMyAtt = myAtt.find(a => a.date === todayDate);

    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
        <h1 className="text-3xl font-bold text-ui-text tracking-tight mb-8">My Portal</h1>
        
        <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm mb-8 text-center">
          <h2 className="text-2xl font-bold text-ui-text mb-2">GPS Attendance</h2>
          <p className="text-ui-muted text-sm mb-6">Ensure you are near the store to check in.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button 
              disabled={checkInLoading || (todayMyAtt && todayMyAtt.checkIn)} 
              onClick={() => handleGPSAction('checkin')} 
              className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg disabled:opacity-50 flex items-center gap-2">
              <MapPin size={20} /> Check In
            </button>
            <button 
              disabled={checkInLoading || !todayMyAtt?.checkIn || todayMyAtt?.checkOut} 
              onClick={() => handleGPSAction('checkout')} 
              className="px-8 py-4 bg-ui-text text-ui-bg rounded-2xl font-bold shadow-lg disabled:opacity-50 flex items-center gap-2">
              <Clock size={20} /> Check Out
            </button>
            
          </div>
        </div>

        <DayCloseModal isOpen={isDayCloseOpen} onClose={() => setIsDayCloseOpen(false)} />

        <div className="bg-ui-card border border-ui-border rounded-3xl overflow-hidden shadow-sm">
          <h3 className="p-6 font-bold text-lg text-ui-text border-b border-ui-border">Attendance History</h3>
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-ui-bg text-ui-muted text-xs uppercase tracking-wider"><th className="p-4 font-bold">Date</th><th className="p-4 font-bold">Check In</th><th className="p-4 font-bold">Check Out</th><th className="p-4 font-bold text-right">Status</th></tr></thead>
            <tbody className="divide-y divide-ui-border text-sm font-medium text-ui-text">
              {myAtt.map(a => (
                <tr key={a.id}>
                  <td className="p-4">{a.date}</td>
                  <td className="p-4">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '-'}</td>
                  <td className="p-4">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '-'}</td>
                  <td className="p-4 text-right font-bold">{a.status}</td>
                </tr>
              ))}
              {myAtt.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-ui-muted">No attendance records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // MANAGER VIEW
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-ui-text tracking-tight">Staff Management</h1>
        <div className="flex bg-ui-card p-1 rounded-2xl border border-ui-border shadow-sm overflow-x-auto hide-scrollbar w-full md:w-auto">
          <button onClick={() => setActiveTab('dashboard')} className={clsx("px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'dashboard' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')}><LayoutDashboard size={16}/> Dashboard</button>
          <button onClick={() => setActiveTab('attendance')} className={clsx("px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'attendance' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')}><CalendarCheck size={16}/> Attendance</button>
          <button onClick={() => setActiveTab('payroll')} className={clsx("px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'payroll' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')}><Wallet size={16}/> Salary</button>
          <button onClick={() => setActiveTab('directory')} className={clsx("px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap", activeTab === 'directory' ? 'bg-ui-bg text-brand-primary shadow-sm' : 'text-ui-muted hover:text-ui-text')}><UserCircle size={16}/> Employees</button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
              <p className="text-sm font-bold text-ui-muted uppercase">Present Today</p>
              <p className="text-3xl font-black text-brand-primary mt-2">{dashboardStats.present}</p>
            </div>
            <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
              <p className="text-sm font-bold text-ui-muted uppercase">Absent Today</p>
              <p className="text-3xl font-black text-brand-danger mt-2">{dashboardStats.absent}</p>
            </div>
            <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
              <p className="text-sm font-bold text-ui-muted uppercase">Half Day / Late</p>
              <p className="text-3xl font-black text-brand-warning mt-2">{dashboardStats.half} / {dashboardStats.late}</p>
            </div>
            <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
              <p className="text-sm font-bold text-ui-muted uppercase">Attendance %</p>
              <p className="text-3xl font-black text-brand-accent mt-2">{dashboardStats.attPercent}%</p>
            </div>
          </div>
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm">
            <p className="text-sm font-bold text-ui-muted uppercase">Monthly Salary Liability</p>
            <p className="text-3xl font-black text-ui-text mt-2">₹{dashboardStats.salaryLiability.toLocaleString()}</p>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-ui-text">Daily Attendance</h2>
            <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} className="p-3 rounded-xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none text-ui-text font-bold" />
          </div>
          
          <div className="bg-ui-card border border-ui-border rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead><tr className="bg-ui-bg text-ui-muted text-xs uppercase tracking-wider"><th className="p-4 font-bold">Employee</th><th className="p-4 font-bold">Dept</th><th className="p-4 font-bold">Check In/Out</th><th className="p-4 font-bold text-right">Mark Status</th></tr></thead>
              <tbody className="divide-y divide-ui-border text-sm font-medium text-ui-text">
                {employees.map(emp => {
                  const attRecord = allAttendance.find(a => a.employeeId === emp.id && a.date === attDate);
                  const status = attRecord ? attRecord.status : null;
                  return (
                    <tr key={emp.id} className="hover:bg-ui-bg transition-colors">
                      <td className="p-4 font-bold text-base">{emp.name}</td>
                      <td className="p-4"><span className="bg-ui-border/50 text-ui-muted px-2 py-1 rounded-md text-xs font-bold uppercase">{emp.department}</span></td>
                      <td className="p-4 text-xs">
                        <div className="text-brand-primary">{attRecord?.checkIn ? new Date(attRecord.checkIn).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '-'}</div>
                        <div className="text-ui-muted">{attRecord?.checkOut ? new Date(attRecord.checkOut).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '-'}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex bg-ui-bg p-1 rounded-xl border border-ui-border">
                          <button onClick={() => handleMarkAttendance(emp.id, 'Present')} className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", status === 'Present' ? 'bg-brand-primary text-white shadow-sm' : 'text-ui-muted hover:text-ui-text')}>Present</button>
                          <button onClick={() => handleMarkAttendance(emp.id, 'Half Day')} className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", status === 'Half Day' ? 'bg-brand-accent text-white shadow-sm' : 'text-ui-muted hover:text-ui-text')}>Half Day</button>
                          <button onClick={() => handleMarkAttendance(emp.id, 'Late')} className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", status === 'Late' ? 'bg-brand-warning text-white shadow-sm' : 'text-ui-muted hover:text-ui-text')}>Late</button>
                          <button onClick={() => handleMarkAttendance(emp.id, 'Absent')} className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", status === 'Absent' ? 'bg-brand-danger text-white shadow-sm' : 'text-ui-muted hover:text-ui-text')}>Absent</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {employees.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-ui-muted">No employees found. Please add them in the Employees tab.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-ui-card p-6 rounded-3xl border border-ui-border shadow-sm flex items-center justify-between">
            <h2 className="text-xl font-bold text-ui-text">Salary Management</h2>
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="p-2 bg-ui-bg hover:bg-ui-border rounded-lg transition-colors"><ChevronLeft size={20}/></button>
              <div className="font-bold text-lg min-w-[120px] text-center">{format(payrollMonth, 'MMMM yyyy')}</div>
              <button onClick={nextMonth} className="p-2 bg-ui-bg hover:bg-ui-border rounded-lg transition-colors"><ChevronRight size={20}/></button>
            </div>
          </div>

          <div className="bg-ui-card border border-ui-border rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead><tr className="bg-ui-bg text-ui-muted text-xs uppercase tracking-wider"><th className="p-4 font-bold">Employee</th><th className="p-4 font-bold text-right">Monthly Salary</th><th className="p-4 font-bold text-center">Present / Half</th><th className="p-4 font-bold text-right">Net Payable</th><th className="p-4 font-bold text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-ui-border text-sm font-medium text-ui-text">
                {payrollData.map(data => (
                  <tr key={data.id}>
                    <td className="p-4 font-bold text-base">{data.name}</td>
                    <td className="p-4 text-right">₹{parseFloat(data.monthlySalary || 0).toLocaleString()}</td>
                    <td className="p-4 text-center">{data.presents} / {data.halfDays}</td>
                    <td className="p-4 text-right font-black text-brand-primary">₹{data.earned.toFixed(0)}</td>
                    <td className="p-4 text-right">
                       <button className="px-4 py-2 bg-ui-bg border border-ui-border rounded-xl font-bold text-xs hover:bg-ui-border">Gen. Slip PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'directory' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setShowAddModal(true)} className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all flex items-center gap-2"><Plus size={18}/> Add Employee</button>
          </div>
          <div className="bg-ui-card border border-ui-border rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead><tr className="bg-ui-bg text-ui-muted text-xs uppercase tracking-wider"><th className="p-4 font-bold">ID</th><th className="p-4 font-bold">Employee Name</th><th className="p-4 font-bold">Dept</th><th className="p-4 font-bold">Mobile</th><th className="p-4 font-bold text-right">Salary</th></tr></thead>
              <tbody className="divide-y divide-ui-border text-sm font-medium text-ui-text">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-ui-bg transition-colors">
                    <td className="p-4 text-ui-muted text-xs font-mono">{emp.empId}</td>
                    <td className="p-4 font-bold text-base">{emp.name}</td>
                    <td className="p-4"><span className="bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-md text-xs font-bold uppercase">{emp.department}</span></td>
                    <td className="p-4">{emp.phone || '-'}</td>
                    <td className="p-4 text-right font-bold text-ui-text">₹{emp.monthlySalary}</td>
                  </tr>
                ))}
                {employees.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-ui-muted">No employees found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Directory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-ui-card w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-ui-text">Add New Employee</h2>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Full Name" required value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                <input type="tel" placeholder="Mobile Number" required value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-medium text-ui-text" />
                <textarea placeholder="Address" value={newEmp.address} onChange={e => setNewEmp({...newEmp, address: e.target.value})} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-medium text-ui-text md:col-span-2 resize-none h-24" />
                
                <div>
                   <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Department</label>
                   <select value={newEmp.department} onChange={e => setNewEmp({...newEmp, department: e.target.value})} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-medium text-ui-text">
                     <option value="Billing">Billing</option>
                     <option value="Kitchen">Kitchen</option>
                     <option value="Service">Service</option>
                     <option value="Delivery">Delivery</option>
                     <option value="Store">Store</option>
                     <option value="Manager">Manager</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Designation</label>
                   <input type="text" placeholder="Designation" value={newEmp.designation} onChange={e => setNewEmp({...newEmp, designation: e.target.value})} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-medium text-ui-text" />
                </div>
                <div>
                   <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Monthly Salary (₹)</label>
                   <input type="number" placeholder="Salary" required value={newEmp.monthlySalary} onChange={e => setNewEmp({...newEmp, monthlySalary: e.target.value})} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-bold text-ui-text" />
                </div>
                <div>
                   <label className="text-xs font-bold text-ui-muted uppercase mb-1 block">Joining Date</label>
                   <input type="date" required value={newEmp.joinDate} onChange={e => setNewEmp({...newEmp, joinDate: e.target.value})} className="w-full p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none font-medium text-ui-text" />
                </div>
              </div>
              
              <div className="flex gap-4 mt-8 pt-4 border-t border-ui-border">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 p-4 rounded-2xl font-bold text-ui-muted bg-ui-bg hover:bg-ui-border transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-primary text-white p-4 rounded-2xl font-bold hover:shadow-lg active:scale-95 transition-all">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
