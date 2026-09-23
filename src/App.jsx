import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Orders from './pages/Orders';
import Menu from './pages/Menu';
import Inventory from './pages/Inventory';
import Purchase from './pages/Purchase';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Shifts from './pages/Shifts';
import Settings from './pages/Settings';
import OfflineBanner from './components/OfflineBanner';
import LoginScreen from './components/LoginScreen';
import { useAuthStore } from './store/useAuthStore';
import useDataStore from './store/useDataStore';
import { useEffect } from 'react';

function ProtectedRoute({ children, perm }) {
  const user = useAuthStore(state => state.user);
  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role === 'owner') return children;
  
  // The explicit employee restriction has been removed.
  // Standard permission checks will now apply to all roles.
  
  const p = user.permissions || [];
  let hasPerm = false;
  switch(perm) {
    case 'reports_dashboard': hasPerm = p.includes('reports_dashboard'); break;
    case 'billing_access': hasPerm = p.includes('billing_access'); break;
    case 'orders_view': hasPerm = p.includes('orders_view'); break;
    case 'menu_view': hasPerm = p.includes('menu_view'); break;
    case 'inventory_view': hasPerm = p.includes('inventory_view'); break;
    case 'purchases_view': hasPerm = p.includes('purchases_view'); break;
    case 'customers_view': hasPerm = p.includes('customers_view'); break;
    case 'employees': hasPerm = p.some(x => x.startsWith('employees_') || x.startsWith('attendance_')); break;
    case 'expenses_view': hasPerm = p.includes('expenses_view'); break;
    case 'reports': hasPerm = p.some(x => x.startsWith('reports_')); break;
    case 'settings': hasPerm = p.some(x => x.startsWith('settings_')); break;
    default: hasPerm = false;
  }
  if (!hasPerm) {
    const firstPerm = user.permissions?.[0] || 'billing';
    
    return <Navigate to={user.role === 'cashier' ? '/billing' : '/'} replace />;
  }
  
  return children;
}

function App() {
  useEffect(() => {
    const unsub = useDataStore.getState().initSync();
    return () => unsub();
  }, []);

  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <BrowserRouter>
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <ProtectedRoute perm="reports_dashboard"><Dashboard /></ProtectedRoute>
          } />
          <Route path="billing" element={
            <ProtectedRoute perm="billing_access"><Billing /></ProtectedRoute>
          } />
          <Route path="orders" element={
            <ProtectedRoute perm="orders_view"><Orders /></ProtectedRoute>
          } />
          <Route path="menu" element={
            <ProtectedRoute perm="menu_view"><Menu /></ProtectedRoute>
          } />
          <Route path="inventory" element={
            <ProtectedRoute perm="inventory_view"><Inventory /></ProtectedRoute>
          } />
          <Route path="purchase" element={
            <ProtectedRoute perm="purchases_view"><Purchase /></ProtectedRoute>
          } />
          <Route path="customers" element={
            <ProtectedRoute perm="customers_view"><Customers /></ProtectedRoute>
          } />
          <Route path="employees" element={
            <ProtectedRoute perm="employees"><Employees /></ProtectedRoute>
          } />
          <Route path="expenses" element={
            <ProtectedRoute perm="expenses"><Expenses /></ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute perm="reports"><Reports /></ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute perm="settings"><Settings /></ProtectedRoute>
          } />
          {/* Catch all fallback */}
          <Route path="*" element={<Navigate to={user?.role === 'cashier' ? '/billing' : '/'} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
