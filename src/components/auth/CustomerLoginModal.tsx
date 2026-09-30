import React, { useState, useEffect } from 'react';
import { X, Smartphone, KeyRound, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Customer } from '../../types';
import { db } from '../../services/db';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (customer: Customer) => void;
}

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({
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

  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const clean = mobile.replace(/\D/g, '');
    if (clean.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = db.sendOtp(clean);
      setLoading(false);
      if (res.success) {
        setDemoOtp(res.otp);
        setStep('OTP');
        setCountdown(30);
      } else {
        setError(res.message);
      }
    }, 400);
  };

  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = db.verifyOtp(mobile, otp);
      setLoading(false);
      if (res.success && res.customer) {
        onLoginSuccess(res.customer);
        onClose();
      } else {
        setError(res.error || 'Verification failed. Please check OTP.');
      }
    }, 500);
  };

  const autoFillDemoOtp = () => {
    if (demoOtp) {
      setOtp(demoOtp);
    }
  };

  return (
    <div
      id="customer-login-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 relative">
          <button
            id="login-modal-close-btn"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-black tracking-tight">TRYatHOME</span>
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              SECURE ACCESS
            </span>
          </div>
          <p className="text-xs text-slate-300">
            {step === 'MOBILE'
              ? 'Login or Register to track orders, manage address & cart'
              : `Verify OTP sent to +91 ${mobile}`}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div
              id="login-error-banner"
              className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2"
            >
              <span>{error}</span>
            </div>
          )}

          {step === 'MOBILE' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1.5 text-sm font-bold text-slate-600 border-r border-slate-300 pr-2 pointer-events-none">
                    <span>🇮🇳 +91</span>
                  </div>
                  <input
                    id="login-mobile-input"
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10 digit mobile"
                    className="w-full pl-24 pr-4 py-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl text-base font-semibold text-slate-900 outline-hidden tracking-wider transition-all"
                    autoFocus
                  />
                  <Smartphone className="w-5 h-5 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  We'll send a one-time verification password via SMS.
                </p>
              </div>

              {/* Quick test buttons for easy demo testing */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium block mb-1.5">
                  Demo Quick Accounts:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMobile('9876543210')}
                    className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-300 rounded-lg hover:border-indigo-500 hover:text-indigo-600"
                  >
                    Aarav (9876543210)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobile('9898989898')}
                    className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-300 rounded-lg hover:border-indigo-500 hover:text-indigo-600"
                  >
                    Priya (9898989898)
                  </button>
                </div>
              </div>

              <button
                id="send-otp-submit-btn"
                type="submit"
                disabled={loading || mobile.length !== 10}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>CONTINUE & GET OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-[11px] text-slate-500">
                  By continuing, you agree to TRYatHOME’s{' '}
                  <span className="text-indigo-600 underline">Terms of Use</span> and{' '}
                  <span className="text-indigo-600 underline">Privacy Policy</span>.
                </span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Demo OTP Banner with 1-click Auto Fill */}
              {demoOtp && (
                <div
                  id="demo-otp-banner"
                  className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      Demo SMS Simulator:
                    </span>
                    <span className="text-base font-extrabold text-slate-900 tracking-widest">
                      {demoOtp}
                    </span>
                  </div>
                  <button
                    id="autofill-demo-otp-btn"
                    type="button"
                    onClick={autoFillDemoOtp}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-2xs transition-colors"
                  >
                    1-Tap Autofill
                  </button>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Enter 6-Digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('MOBILE')}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    Change Number
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-otp-input"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full text-center py-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl text-xl font-bold tracking-[0.4em] text-slate-900 outline-hidden transition-all"
                    autoFocus
                  />
                  <KeyRound className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Didn't receive OTP?</span>
                {countdown > 0 ? (
                  <span>Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    id="resend-otp-btn"
                    onClick={handleSendOtp}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                id="verify-otp-submit-btn"
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>VERIFY & LOG IN</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-slate-400 text-xs">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 256-bit Encrypted
            </span>
            <span>•</span>
            <span>TRYatHOME Trust Shield</span>
          </div>
        </div>
      </div>
    </div>
  );
};
