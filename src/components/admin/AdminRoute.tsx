import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { LoadingSpinner } from '../common/LoadingSpinner.js';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <LoadingSpinner label="Checking security credentials..." />
      </div>
    );
  }

  const isAuthorized = user && isAdmin && user.email.toLowerCase() === 'iamzubair708@gmail.com';

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 pt-24 pb-16">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
              Error 403 - Forbidden
            </span>
            <h1 className="text-2xl font-bold text-white pt-2">Access Denied</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              You do not have permission to view the Admin Control Panel. Admin access is strictly reserved for authorized administrator <span className="text-[#00C2FF] font-semibold">iamzubair708@gmail.com</span>.
            </p>
          </div>

          {user && (
            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 text-xs text-slate-400 space-y-1 text-left">
              <div className="flex items-center gap-1.5 font-medium text-slate-300">
                <Lock className="w-3.5 h-3.5 text-slate-500" /> Current Account:
              </div>
              <p className="font-mono text-[11px] text-slate-300 truncate">{user.name} ({user.email})</p>
              <p className="text-[10px] text-rose-400 font-medium pt-1">Role: {user.role.toUpperCase()} (Not authorized for admin panel)</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              to="/"
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Home
            </Link>
            <Link
              to="/login"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#00C2FF] to-[#0047FF] hover:brightness-110 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              Admin Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

