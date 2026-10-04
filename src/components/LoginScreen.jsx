import React, { useState, useEffect } from 'react';
import { db, hashPin } from '../db/db';
import { useAuthStore } from '../store/useAuthStore';
import useDataStore from '../store/useDataStore';
import { Lock, ShieldAlert } from 'lucide-react';

export default function LoginScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(state => state.login);

  useEffect(() => {
    const seedUsers = () => {
      setTimeout(async () => {
        const users = useDataStore.getState().users || [];
        if (users.length === 0) {
          const hashed = await hashPin('admin123');
          // Use put with fixed ID to prevent duplication
          await db.users.put({ id: 'default_owner', name: 'Owner', pin: hashed, role: 'owner', isDefaultPin: true });
        } else {
          // Cleanup duplicates
          const owners = users.filter(u => (u.name === 'Owner' || u.name === 'owner') && u.role === 'owner');
          if (owners.length > 1) {
              const [keep, ...rest] = owners;
              for (const dup of rest) {
                  await db.users.delete(dup.id);
              }
          }
          
          // Migrate old default pin
          const oldHashed = await hashPin('1234');
          const defaultOwner = users.find(u => u.pin === oldHashed);
          if (defaultOwner) {
            const newHashed = await hashPin('admin123');
            await db.users.update(defaultOwner.id, { pin: newHashed });
          }
        }
      }, 2500); // give firestore time to load initial data
    };

    seedUsers();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const hashed = await hashPin(pin);
      let user = await db.users.where('pin').equals(hashed).first();
      
      // Fallback for legacy plaintext PINs from before the hashing update
      if (!user) {
        const legacyUser = await db.users.where('pin').equals(pin).first();
        if (legacyUser) {
          await db.users.update(legacyUser.id, { pin: hashed });
          user = { ...legacyUser, pin: hashed };
        }
      }

      if (user) {
        login(user);
        db.audit_logs.add({ userId: user.id, userName: user.name, action: 'LOGIN', timestamp: new Date().toISOString() });
      } else {
        setError('Invalid Password. Please try again.');
        setPin('');
      }
    } catch (err) {
      setError('Login error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-ui-bg">
      <div className="bg-ui-card p-8 rounded-3xl shadow-float border border-ui-border w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-ui-text">Vitamin Bar</h1>
          <p className="text-ui-muted text-sm mt-1">Enter your Password to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            
            autoFocus
            value={pin}
            onChange={e => { setPin(e.target.value); setError(''); }}
            className="w-full text-center text-2xl tracking-[0.5em] p-4 rounded-2xl bg-ui-bg border border-ui-border focus:ring-2 focus:ring-brand-primary outline-none transition-all text-ui-text font-bold"
            placeholder="Password"
          />
          {error && (
            <div className="flex items-center gap-2 text-brand-danger text-sm font-bold bg-brand-danger/10 px-4 py-3 rounded-xl border border-brand-danger/20">
              <ShieldAlert size={16} /> {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || pin.length < 8}
            className="w-full bg-brand-primary text-white p-4 rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Login'}
          </button>
        </form>
        
      </div>
    </div>
  );
}
