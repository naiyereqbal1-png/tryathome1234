import React, { useState } from 'react';
import { X, Lock, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { AdminUser } from '../../types';
import { db } from '../../services/db';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (admin: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [identifier, setIdentifier] = useState('admin@tryathome.in');
  const [password, setPassword] = useState('tryathome');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const res = db.adminLogin(identifier.trim(), password);
      setLoading(false);
      if (res.success && res.admin) {
        onLoginSuccess(res.admin);
        onClose();
      } else {
        setError(res.error || 'Invalid credentials. Please check and try again.');
      }
    }, 400);
  };

  const handle1ClickDemo = () => {
    setIdentifier('admin@tryathome.in');
    setPassword('tryathome');
    const res = db.adminLogin('admin@tryathome.in', 'tryathome');
    if (res.success && res.admin) {
      onLoginSuccess(res.admin);
      onClose();
    }
  };

  return (
    <div
      id="admin-login-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            id="admin-login-close-btn"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-black tracking-tight">TRYatHOME</span>
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">
              MERCHANT ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Sign in to manage garments, inventory, Excel bulk import, and live orders.
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Admin Email / Mobile
              </label>
              <input
                id="admin-identifier-input"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@tryathome.in"
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl outline-hidden focus:border-indigo-600 font-semibold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl outline-hidden focus:border-indigo-600 font-semibold text-slate-900"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Quick Demo Credentials Info */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="text-[11px] text-slate-600">
                <span className="font-bold block text-slate-800">Admin Credentials:</span>
                <code>admin@tryathome.in</code> / <code>tryathome</code>
              </div>
              <button
                type="button"
                id="admin-1click-login-btn"
                onClick={handle1ClickDemo}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>1-Click Test</span>
              </button>
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <span>Verifying Admin...</span>
              ) : (
                <>
                  <span>LOGIN TO ADMIN PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Role-Based Access Control • TRYatHOME Internal System</span>
          </div>
        </div>
      </div>
    </div>
  );
};
