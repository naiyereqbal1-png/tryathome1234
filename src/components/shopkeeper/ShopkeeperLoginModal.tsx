import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Phone,
  Sparkles,
} from 'lucide-react';
import { Shopkeeper } from '../../types';
import { db } from '../../services/db';

interface ShopkeeperLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (shopkeeper: Shopkeeper) => void;
}

export const ShopkeeperLoginModal: React.FC<ShopkeeperLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [matchedShopkeeper, setMatchedShopkeeper] = useState<Shopkeeper | null>(null);

  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const cleanMobileInput = (raw: string) => raw.replace(/\D/g, '').slice(-10);

  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const clean = cleanMobileInput(mobile);
    if (clean.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // 1. Verify that this mobile is registered as an ACTIVE shopkeeper
      const shopkeeper = db.getShopkeeperByMobile(clean);
      if (!shopkeeper) {
        setLoading(false);
        const roleCheck = db.checkMobileRole(clean);
        if (roleCheck.exists && roleCheck.role !== 'SHOPKEEPER') {
          setError(
            `Mobile +91 ${clean} is registered as a ${roleCheck.role}. Please log in via the corresponding portal.`
          );
        } else {
          setError(
            `No active Shopkeeper partner found for +91 ${clean}. Please verify the number or contact the Administrator to onboard your store.`
          );
        }
        return;
      }

      setMatchedShopkeeper(shopkeeper);

      // 2. Generate and dispatch OTP
      const res = db.sendAuthOtp(clean);
      setLoading(false);

      if (res.success) {
        setDemoOtp(res.otp);
        setOtp(res.otp);
        setStep('OTP');
        setCountdown(30);
      } else {
        setError(res.error || res.message || 'Failed to send OTP. Please try again.');
      }
    }, 400);
  };

  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const clean = cleanMobileInput(mobile);
    if (otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = db.verifyAuthOtp(clean, otp);
      setLoading(false);

      if (res.success && res.role === 'SHOPKEEPER') {
        const current = db.getCurrentShopkeeper() || matchedShopkeeper;
        if (current) {
          onLoginSuccess(current);
          onClose();
        } else {
          setError('Shopkeeper profile data not found.');
        }
      } else {
        setError(res.error || 'Invalid OTP code. Please check and try again.');
      }
    }, 450);
  };

  const handleQuickFill = (num: string) => {
    setMobile(num);
    setError('');
    setStep('MOBILE');
  };

  return (
    <div
      id="shopkeeper-login-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-5 relative border-b border-slate-800">
          <button
            id="shopkeeper-modal-close-btn"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Shopkeeper Portal</h3>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  Merchant Access
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage inventory, stock IN/OUT & review customer orders
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'MOBILE' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="shop-mobile-input"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Registered Shopkeeper Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1 text-slate-500 font-bold text-xs border-r border-slate-200 pr-2">
                    <span>+91</span>
                  </div>
                  <input
                    id="shop-mobile-input"
                    type="tel"
                    required
                    autoFocus
                    value={mobile}
                    onChange={(e) => setMobile(cleanMobileInput(e.target.value))}
                    placeholder="9810101010"
                    maxLength={10}
                    className="w-full pl-16 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  We will send a 6-digit verification code to this mobile number.
                </p>
              </div>

              <button
                id="shop-send-otp-btn"
                type="submit"
                disabled={loading || cleanMobileInput(mobile).length !== 10}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 text-slate-950 font-black rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Partner Account...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed & Send OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick demo shopkeepers */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Demo Shopkeeper Accounts (Click to autofill):</span>
                </div>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('9810101010')}
                    className="w-full p-2 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-left transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-amber-950">Rajesh Mehra (Rajesh Ethnic Trends)</div>
                      <div className="text-[10px] text-amber-700">Jaipur • Full Stock & Catalog Privileges</div>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-800">9810101010</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('9876543206')}
                    className="w-full p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">Pooja Agarwal (Agarwal Ethnic Studio)</div>
                      <div className="text-[10px] text-slate-500">Surat • Active Partner</div>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-700">9876543206</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-amber-800 font-bold">
                    Partner Store: {matchedShopkeeper?.store_name || matchedShopkeeper?.name}
                  </span>
                  <span className="font-mono text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    {matchedShopkeeper?.shopkeeper_id}
                  </span>
                </div>
                <div className="text-amber-900 text-[11px]">
                  Verification OTP code sent to <strong>+91 {cleanMobileInput(mobile)}</strong>
                </div>
              </div>

              {demoOtp && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Demo OTP Code: <strong className="font-mono tracking-widest">{demoOtp}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtp(demoOtp)}
                    className="text-[11px] font-bold text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
                  >
                    Auto Fill
                  </button>
                </div>
              )}

              <div>
                <label
                  htmlFor="shop-otp-input"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                >
                  Enter 6-Digit OTP Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="shop-otp-input"
                    type="text"
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base tracking-widest font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-center"
                  />
                </div>
              </div>

              <button
                id="shop-verify-otp-btn"
                type="submit"
                disabled={loading || otp.trim().length !== 6}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 text-slate-950 font-black rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authorizing Merchant Session...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Enter Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('MOBILE');
                    setOtp('');
                    setError('');
                  }}
                  className="hover:text-slate-800 underline cursor-pointer"
                >
                  Change Mobile
                </button>

                <div>
                  {countdown > 0 ? (
                    <span>Resend OTP in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="text-amber-600 font-bold hover:underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
