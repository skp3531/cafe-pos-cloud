import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-brand-warning text-ui-bg text-center py-1.5 font-bold flex justify-center items-center gap-2 z-[60] fixed top-0 w-full shadow-md text-sm">
      <WifiOff size={16} />
      Working Offline - Data is saved locally
    </div>
  );
}
