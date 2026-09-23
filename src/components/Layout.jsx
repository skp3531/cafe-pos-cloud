import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../store/useAuthStore';

export default function Layout() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen bg-ui-bg overflow-hidden text-ui-text">
      <Sidebar />
      <main className="flex-1 h-full w-full overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
}
