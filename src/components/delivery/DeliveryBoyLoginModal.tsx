import React, { useState } from 'react';
import { Truck, Phone, Lock, X, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { DeliveryBoy } from '../../types';
import { db } from '../../services/db';

interface DeliveryBoyLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (boy: DeliveryBoy) => void;
}

export const DeliveryBoyLoginModal: React.FC<DeliveryBoyLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleQuickDemoFill = () => {
    const boys = db.getDeliveryBoys();
    const demoBoy = boys[0];
    if (demoBoy) {
      setMobile(demoBoy.mobile);
      setPassword(demoBoy.password || 'delivery123');
      setError('');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanMobile = mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    const res = db.deliveryBoyLogin(cleanMobile, password);
    if (!res.success || !res.deliveryBoy) {
      setError(res.error || 'Invalid mobile number or password. Check credentials or contact Store Admin.');
      return;
    }

    onLoginSuccess(res.deliveryBoy);
  };

  return (
    <div
      id="delivery-boy-login-modal"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Delivery Partner Portal</h3>
              <p className="text-[11px] text-slate-400">TRYatHOME Logistics & Fleet Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs">
          {/* Demo account quick banner */}
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-teal-900 text-xs block">Demo Delivery Partner:</span>
              <span className="text-[11px] text-teal-700 font-mono block">
                9876543210 / delivery123
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-extrabold rounded-md shadow-2xs transition-colors"
            >
              Fill Demo
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Registered Mobile Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">
                +91
              </span>
              <input
                id="delivery-login-mobile"
                type="tel"
                required
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full pl-11 pr-3 py-2.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:border-teal-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Partner Password
            </label>
            <div className="relative">
              <input
                id="delivery-login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-xs focus:border-teal-600 focus:outline-hidden font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <button
            id="delivery-partner-signin-btn"
            type="submit"
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <span>Sign In to Deliveries</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center text-slate-400 text-[11px] flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Authorized delivery personnel & logistics team only</span>
          </div>
        </form>
      </div>
    </div>
  );
};
