import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Receipt, 
  MenuSquare, 
  Package, 
  ShoppingCart, 
  Users, UserCircle, 
  Wallet, 
  BarChart3, 
  Settings,
  LogOut, LayoutGrid,
  ReceiptText
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../store/useAuthStore';
import { db } from '../db/db';
import { useLiveQuery } from '../db/db';

const ALL_NAV_ITEMS = [
  { name: 'Dashboard', icon: Home, path: '/', perm: 'reports_dashboard' },
  { name: 'Billing', icon: Receipt, path: '/billing', perm: 'billing_access' },
  { name: 'Orders', icon: ReceiptText, path: '/orders', perm: 'orders_view' },
  { name: 'Menu', icon: MenuSquare, path: '/menu', perm: 'menu_view' },
  { name: 'Inventory', icon: Package, path: '/inventory', perm: 'inventory_view' },
  { name: 'Purchase', icon: ShoppingCart, path: '/purchase', perm: 'purchases_view' },
  { name: 'Customers', icon: Users, path: '/customers', perm: 'customers_view' },
  { name: 'Employees', icon: UserCircle, path: '/employees', perm: 'attendance_mark' },
  { name: 'Expenses', icon: Wallet, path: '/expenses', perm: 'expenses_view' },
  { name: 'Reports', icon: BarChart3, path: '/reports', perm: 'reports_sales' },
  { name: 'Settings', icon: Settings, path: '/settings', perm: 'settings_staff' },
];

export default function Sidebar() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const profileSettings = useLiveQuery(() => db.settings.get('profile')) || {};
  
  const navItems = ALL_NAV_ITEMS.filter(item => {
    if (user?.role === 'owner') return true;
    if (!user?.permissions) return false;
    
    const p = user.permissions;
    switch(item.name) {
      case 'Dashboard': return p.includes('reports_dashboard');
      case 'Billing': return p.includes('billing_access');
      case 'Orders': return p.includes('orders_view');
      case 'Menu': return p.includes('menu_view');
      case 'Inventory': return p.includes('inventory_view');
      case 'Purchase': return p.includes('purchases_view');
      case 'Customers': return p.includes('customers_view');
      case 'Employees': return false; // Hidden for non-owners
      case 'Expenses': return p.includes('expenses_view');
      case 'Reports': return p.some(x => x.startsWith('reports_'));
      case 'Settings': return p.some(x => x.startsWith('settings_'));
      default: return false;
    }
  });

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex w-20 lg:w-52 h-screen bg-ui-card border-r border-ui-border flex-col transition-all duration-300 z-40">
        <div className="p-4 flex flex-col items-center justify-center lg:items-start lg:px-6 h-20 border-b border-ui-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md">
              {profileSettings.name ? profileSettings.name.substring(0, 1).toUpperCase() : 'S'}
            </div>
            <div className="hidden lg:block">
              <span className="font-bold text-lg text-ui-text line-clamp-1">{profileSettings.name || 'Vitamin Bar'}</span>
              <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded capitalize">{user?.role}</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto hide-scrollbar">
          <ul className="space-y-1.5 px-3">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => clsx(
                    "flex items-center p-3 rounded-2xl transition-all font-bold group relative",
                    isActive ? "bg-brand-primary text-white shadow-md" : "text-ui-muted hover:bg-ui-bg hover:text-ui-text"
                  )}
                >
                  <item.icon className={clsx("w-6 h-6 shrink-0 transition-transform group-active:scale-95")} />
                  <span className="ml-3 hidden lg:block">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-ui-border shrink-0">
           <button onClick={logout} className="w-full flex items-center justify-center lg:justify-start p-3 rounded-2xl text-ui-muted hover:bg-brand-danger/10 hover:text-brand-danger transition-colors font-bold group">
             <LogOut className="w-6 h-6 shrink-0 group-active:scale-95 transition-transform" />
             <span className="ml-3 hidden lg:block">Logout</span>
           </button>
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-ui-card border-t border-ui-border pb-safe z-40 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)] flex items-center justify-around px-2 min-h-[64px]">
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setIsMoreOpen(false)}
            className={({ isActive }) => clsx(
              "flex flex-col items-center justify-center w-16 py-1.5 transition-all relative group",
              isActive && !isMoreOpen ? "text-brand-primary" : "text-ui-muted hover:text-ui-text"
            )}
          >
            {({ isActive }) => (
              <>
                <div className={clsx("absolute top-0 w-8 h-1 rounded-b-full transition-all duration-300", isActive && !isMoreOpen ? "bg-brand-primary" : "bg-transparent")} />
                <div className={clsx("p-1.5 rounded-xl transition-all duration-300", isActive && !isMoreOpen ? "bg-brand-primary/10" : "")}>
                  <item.icon className={clsx("w-[22px] h-[22px] transition-transform duration-300", (isActive && !isMoreOpen) && "scale-110")} strokeWidth={isActive && !isMoreOpen ? 2.5 : 2} />
                </div>
                <span className={clsx("text-[10px] font-bold mt-0.5 transition-all duration-300", isActive && !isMoreOpen ? "opacity-100" : "opacity-70")}>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
        {navItems.length > 4 && (
          <button 
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={clsx("flex flex-col items-center justify-center w-16 py-1.5 transition-all relative group", isMoreOpen ? "text-brand-primary" : "text-ui-muted hover:text-ui-text")}
          >
            <div className={clsx("absolute top-0 w-8 h-1 rounded-b-full transition-all duration-300", isMoreOpen ? "bg-brand-primary" : "bg-transparent")} />
            <div className={clsx("p-1.5 rounded-xl transition-all duration-300", isMoreOpen ? "bg-brand-primary/10" : "")}>
              <LayoutGrid className={clsx("w-[22px] h-[22px] transition-transform duration-300", isMoreOpen && "scale-110")} strokeWidth={isMoreOpen ? 2.5 : 2} />
            </div>
            <span className={clsx("text-[10px] font-bold mt-0.5 transition-all duration-300", isMoreOpen ? "opacity-100" : "opacity-70")}>More</span>
          </button>
        )}
      </div>

      {/* MOBILE MORE MENU */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setIsMoreOpen(false)}>
          <div 
            className="absolute bottom-16 left-0 right-0 bg-ui-card rounded-t-3xl border-t border-ui-border p-4 shadow-2xl animate-in slide-in-from-bottom-10"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-ui-text mb-4 px-2">All Modules</h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {navItems.slice(4).map(item => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMoreOpen(false)}
                  className={({ isActive }) => clsx(
                    "flex flex-col items-center justify-center p-3 rounded-2xl transition-all",
                    isActive ? "bg-brand-primary text-white shadow-md" : "bg-ui-bg text-ui-text hover:bg-ui-border"
                  )}
                >
                  <item.icon className="w-6 h-6 mb-2" />
                  <span className="text-[10px] font-bold text-center">{item.name}</span>
                </NavLink>
              ))}
            </div>
            <div className="pt-4 border-t border-ui-border">
              <button onClick={logout} className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-brand-danger/10 text-brand-danger font-bold hover:bg-brand-danger hover:text-white transition-all">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
