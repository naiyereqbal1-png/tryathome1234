import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  PhoneCall,
  User,
  Truck,
  Shield,
  HelpCircle,
  ArrowLeft,
  Mail,
  Lock,
  Terminal,
  Cpu,
} from 'lucide-react';
import { UserRole, AuthSession, Customer, DeliveryBoy, AdminAccount } from '../../types';
import { db } from '../../services/db';
import { OtpService, SendOtpResult } from '../../services/otpService';

interface TryAtHomeLoginProps {
  onLoginSuccess: (session: AuthSession) => void;
}

type AuthViewMode = 'ENTER_MOBILE' | 'ENTER_OTP' | 'UNREGISTERED_OPTIONS' | 'CREATE_USER' | 'CONTACT_ADMIN';

export const TryAtHomeLogin: React.FC<TryAtHomeLoginProps> = ({ onLoginSuccess }) => {
  const [viewMode, setViewMode] = useState<AuthViewMode>('ENTER_MOBILE');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [demoApiInfo, setDemoApiInfo] = useState<SendOtpResult['apiMetadata'] | null>(null);
  const [showApiInspector, setShowApiInspector] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Identified user and role
  const [detectedRole, setDetectedRole] = useState<UserRole | null>(null);
  const [detectedUser, setDetectedUser] = useState<Customer | DeliveryBoy | AdminAccount | null>(null);

  // New User Registration Form State
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');

  // Store Settings for Contact Info
  const settings = db.getSettings();

  // Resend OTP countdown
  useEffect(() => {
    let timer: any;
    if (viewMode === 'ENTER_OTP' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [viewMode, countdown]);

  const cleanMobileInput = (val: string) => val.replace(/\D/g, '').slice(0, 10);

  // Step 1: Check mobile number and route accordingly
  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const clean = cleanMobileInput(mobile);
    if (clean.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Step 2: Check registered database records
      const roleCheck = db.checkMobileRole(clean);

      if (!roleCheck.exists || !roleCheck.role) {
        // Mobile number is not registered in CUSTOMER, DELIVERY_BOY, or ADMIN
        setLoading(false);
        setDetectedRole(null);
        setDetectedUser(null);
        setRegMobile(clean);
        setViewMode('UNREGISTERED_OPTIONS');
        return;
      }

      // User exists!
      setDetectedRole(roleCheck.role);
      setDetectedUser(roleCheck.user || null);

      const otpResult = db.sendAuthOtp(clean);
      setLoading(false);

      if (otpResult.success) {
        setDemoOtp(otpResult.otp);
        setOtp(otpResult.otp); // Prefill for immediate testing ease
        setCountdown(30);
        setViewMode('ENTER_OTP');
        setSuccessMsg(`Verification code sent to +91 ${clean} via Demo API`);
        OtpService.sendOtpViaDemoApi(clean, otpResult.otp).then((apiRes) => {
          if (apiRes.apiMetadata) {
            setDemoApiInfo(apiRes.apiMetadata);
          }
        });
      } else {
        setError(otpResult.error || otpResult.message || 'Failed to send verification code.');
      }
    }, 350);
  };

  // Step 3: Verify OTP and complete login
  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const clean = cleanMobileInput(mobile);
    const cleanEnteredOtp = otp.trim();

    if (!cleanEnteredOtp || cleanEnteredOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const verifyRes = db.verifyAuthOtp(clean, cleanEnteredOtp);
      setLoading(false);

      if (verifyRes.success && verifyRes.session) {
        onLoginSuccess(verifyRes.session);
      } else {
        setError(verifyRes.error || 'Verification failed. Please check the code.');
      }
    }, 400);
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (countdown > 0) return;
    setError('');
    const clean = cleanMobileInput(mobile);
    const res = db.sendAuthOtp(clean);
    if (res.success) {
      setDemoOtp(res.otp);
      setOtp(res.otp);
      setCountdown(30);
      setSuccessMsg('A new OTP has been delivered via Demo API.');
      OtpService.sendOtpViaDemoApi(clean, res.otp).then((apiRes) => {
        if (apiRes.apiMetadata) {
          setDemoApiInfo(apiRes.apiMetadata);
        }
      });
    } else {
      setError(res.error || res.message);
    }
  };

  // Handle New Customer Registration Submission
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const clean = cleanMobileInput(regMobile);
    if (!regName.trim() || regName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (clean.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (regEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // 1. Check again and create customer
      const regRes = db.registerNewCustomer({
        name: regName.trim(),
        mobile: clean,
        email: regEmail.trim(),
      });

      if (!regRes.success || !regRes.customer) {
        setLoading(false);
        setError(regRes.error || 'Registration failed. Please try again.');
        return;
      }

      // 2. Send OTP to newly registered customer
      setMobile(clean);
      setDetectedRole('CUSTOMER');
      setDetectedUser(regRes.customer);

      const otpResult = db.sendAuthOtp(clean);
      setLoading(false);

      if (otpResult.success) {
        setDemoOtp(otpResult.otp);
        setOtp(otpResult.otp);
        setCountdown(30);
        setViewMode('ENTER_OTP');
        setSuccessMsg(`Account created! Enter the verification code sent to +91 ${clean} via Demo API`);
        OtpService.sendOtpViaDemoApi(clean, otpResult.otp).then((apiRes) => {
          if (apiRes.apiMetadata) {
            setDemoApiInfo(apiRes.apiMetadata);
          }
        });
      } else {
        setError(otpResult.error || otpResult.message || 'Customer created but failed to send OTP.');
      }
    }, 400);
  };

  // Quick Demo Account Helper Fill
  const handleQuickFill = (testNum: string) => {
    setMobile(testNum);
    setError('');
    setSuccessMsg('');
    setViewMode('ENTER_MOBILE');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-between text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Bar / Header Branding */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-400 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/30">
              T
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">TRYatHOME</span>
              <span className="hidden sm:inline-block ml-2 text-xs uppercase tracking-widest text-indigo-300 font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30">
                Secure Portal
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Role-Based Authentication</span>
          </div>
        </div>
      </header>

      {/* Main Centered Login Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Prominent "Try at Home" Title Card */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              Garment & Fashion Fitting at Home
            </div>
            <h1
              id="try-at-home-title"
              className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm mb-2"
            >
              Try at Home
            </h1>
            <p className="text-sm text-slate-300 max-w-xs mx-auto">
              Select your garments, try them at home before you pay, and keep only what fits.
            </p>
          </div>

          {/* Authentication Card */}
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header of Auth Box */}
            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900 text-base">
                  {viewMode === 'ENTER_MOBILE' && 'Sign In to Your Account'}
                  {viewMode === 'ENTER_OTP' && 'Verify OTP'}
                  {viewMode === 'UNREGISTERED_OPTIONS' && 'Customer Not Registered'}
                  {viewMode === 'CREATE_USER' && 'Create User Account'}
                  {viewMode === 'CONTACT_ADMIN' && 'Contact Administrator'}
                </h2>
                <p className="text-xs text-slate-500">
                  {viewMode === 'ENTER_MOBILE' && 'Step 1 — Mobile Number'}
                  {viewMode === 'ENTER_OTP' && 'Step 2 — Enter Verification Code'}
                  {viewMode === 'UNREGISTERED_OPTIONS' && 'Role or Account Resolution'}
                  {viewMode === 'CREATE_USER' && 'Quick Customer Registration'}
                  {viewMode === 'CONTACT_ADMIN' && 'Staff & Partner Verification'}
                </p>
              </div>

              {viewMode !== 'ENTER_MOBILE' && (
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setViewMode('ENTER_MOBILE');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors text-xs flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}
            </div>

            <div className="p-6">
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1">{successMsg}</div>
                </div>
              )}

              {/* VIEW 1: ENTER MOBILE NUMBER */}
              {viewMode === 'ENTER_MOBILE' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label
                      htmlFor="mobile-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Enter Mobile Number
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 flex items-center gap-1.5 text-slate-500 font-semibold text-sm border-r border-slate-200 pr-2.5">
                        <span className="text-base leading-none">🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        id="mobile-input"
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(cleanMobileInput(e.target.value))}
                        placeholder="98765 43210"
                        maxLength={10}
                        autoFocus
                        className="w-full pl-24 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-base tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 placeholder:tracking-normal"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      We will check your registered account role and send an OTP.
                    </p>
                  </div>

                  <button
                    id="send-otp-btn"
                    type="submit"
                    disabled={loading || cleanMobileInput(mobile).length !== 10}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:pointer-events-none text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Checking Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Send OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* VIEW 2: ENTER OTP */}
              {viewMode === 'ENTER_OTP' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* Role Indicator Badge */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {detectedRole === 'ADMIN' && <Shield className="w-4 h-4" />}
                        {detectedRole === 'DELIVERY_BOY' && <Truck className="w-4 h-4" />}
                        {detectedRole === 'CUSTOMER' && <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800">
                          {detectedRole === 'ADMIN' && 'Administrator'}
                          {detectedRole === 'DELIVERY_BOY' && 'Delivery Boy'}
                          {detectedRole === 'CUSTOMER' && 'Customer'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">+91 {mobile}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('ENTER_MOBILE');
                        setOtp('');
                        setError('');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                    >
                      Change
                    </button>
                  </div>

                  {/* Demo API / Testing OTP Banner */}
                  {demoOtp && (
                    <div className="space-y-2">
                      <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs shadow-xs">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-amber-950">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Demo API (Simulated SMS Gateway)</span>
                          </div>
                          <span className="text-[10px] text-emerald-800 bg-emerald-100 font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
                            200 OK
                          </span>
                        </div>

                        <div className="flex items-center justify-between bg-white/80 p-2.5 rounded-lg border border-amber-200/70 mb-2">
                          <div className="flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-slate-700">
                              Verification Code: <strong className="font-mono text-base tracking-widest text-slate-900">{demoOtp}</strong>
                            </span>
                          </div>
                          {otp !== demoOtp && (
                            <button
                              type="button"
                              onClick={() => setOtp(demoOtp)}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                            >
                              Auto Fill
                            </button>
                          )}
                        </div>

                        <div className="text-[11px] text-amber-800 leading-snug">
                          <span className="font-medium text-amber-950">Simulated SMS: </span>
                          "{demoApiInfo?.smsText || `Your TRYatHOME verification code is ${demoOtp}. Valid for 5 minutes.`}"
                        </div>

                        {/* Demo API Inspector Toggle */}
                        <div className="mt-2 pt-2 border-t border-amber-200/50 flex items-center justify-between text-[11px]">
                          <span className="text-amber-700">Endpoint: <code className="bg-amber-100/70 px-1 py-0.5 rounded text-[10px] font-mono">POST /api/v1/auth/demo-send-otp</code></span>
                          <button
                            type="button"
                            onClick={() => setShowApiInspector(!showApiInspector)}
                            className="text-amber-800 hover:text-amber-950 font-medium underline flex items-center gap-1"
                          >
                            <Terminal className="w-3 h-3" />
                            <span>{showApiInspector ? 'Hide API Log' : 'Inspect API'}</span>
                          </button>
                        </div>

                        {showApiInspector && (
                          <div className="mt-2 p-2.5 bg-slate-900 text-slate-200 rounded-lg font-mono text-[10px] space-y-1 overflow-x-auto">
                            <div className="text-emerald-400 font-bold">HTTP/1.1 200 OK</div>
                            <div className="text-slate-400">Content-Type: application/json</div>
                            <pre className="text-amber-300">
{JSON.stringify({
  success: true,
  provider: "DEMO_SMS_GATEWAY",
  message_id: demoApiInfo?.messageId || "MSG-DEMO-2026",
  recipient: `+91${cleanMobileInput(mobile)}`,
  delivered_at: demoApiInfo?.deliveredAt || "Just now",
  status: "DELIVERED_SIMULATED",
  code: demoOtp,
}, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="otp-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Enter OTP
                    </label>
                    <input
                      id="otp-input"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit OTP"
                      maxLength={6}
                      autoFocus
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-900 font-mono text-xl tracking-[0.4em] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Didn't receive code?</span>
                    {countdown > 0 ? (
                      <span className="font-medium text-slate-400">Resend in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <button
                    id="verify-login-btn"
                    type="submit"
                    disabled={loading || otp.trim().length !== 6}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:pointer-events-none text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying & Redirecting...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Login</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* VIEW 3: UNREGISTERED MOBILE NUMBER OPTIONS */}
              {viewMode === 'UNREGISTERED_OPTIONS' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    <div className="flex items-center gap-2 font-bold text-sm mb-1 text-amber-950">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Customer not registered</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      The mobile number <strong className="font-mono text-slate-900">+91 {regMobile}</strong> is not
                      associated with any registered customer account.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Option 1: Create User (Customer) */}
                    <button
                      id="create-user-option-btn"
                      type="button"
                      onClick={() => {
                        setError('');
                        setViewMode('CREATE_USER');
                      }}
                      className="w-full p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserPlus className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-bold">Create User</div>
                          <div className="text-[11px] text-indigo-100 font-normal">
                            Register as a new customer with this mobile
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Option 2: Contact Administrator (Delivery Boy / Staff) */}
                    <button
                      id="contact-admin-option-btn"
                      type="button"
                      onClick={() => {
                        setError('');
                        setViewMode('CONTACT_ADMIN');
                      }}
                      className="w-full p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-medium text-sm transition-all border border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <PhoneCall className="w-5 h-5 text-slate-600" />
                        <div className="text-left">
                          <div className="font-bold text-slate-900">Contact Administrator</div>
                          <div className="text-[11px] text-slate-500 font-normal">
                            For Delivery Boys or Staff requesting access
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 4: CREATE USER FORM (CUSTOMER REGISTRATION) */}
              {viewMode === 'CREATE_USER' && (
                <form onSubmit={handleCreateCustomerSubmit} className="space-y-3.5">
                  <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs mb-2">
                    Enter your details to create your <strong>Try at Home</strong> customer profile.
                  </div>

                  <div>
                    <label
                      htmlFor="reg-name"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                    >
                      Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="reg-name"
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Full Name (e.g. Ananya Sen)"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-mobile"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                    >
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-1 text-slate-500 font-semibold text-xs border-r border-slate-200 pr-2">
                        <span>+91</span>
                      </div>
                      <input
                        id="reg-mobile"
                        type="tel"
                        required
                        value={regMobile}
                        onChange={(e) => setRegMobile(cleanMobileInput(e.target.value))}
                        placeholder="98765 43210"
                        maxLength={10}
                        className="w-full pl-16 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
                    >
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="user@example.com (optional)"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    id="create-account-btn"
                    type="submit"
                    disabled={loading || !regName.trim() || cleanMobileInput(regMobile).length !== 10}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Registering Customer...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* VIEW 5: CONTACT ADMINISTRATOR */}
              {viewMode === 'CONTACT_ADMIN' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold leading-relaxed text-rose-950">
                        Your mobile number is not registered as a Delivery Boy. Please contact the Administrator.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Administrator Support Desk
                    </div>
                    <div className="text-xs text-slate-600 space-y-2">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="w-4 h-4 text-slate-500" />
                        <span>Helpline: <strong className="text-slate-900">{settings.contact_phone}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span>Email: <strong className="text-slate-900">{settings.contact_email}</strong></span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                      Delivery Boy accounts are created and activated exclusively by Administrators via the Admin Panel.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('ENTER_MOBILE');
                      setError('');
                    }}
                    className="w-full py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Demo Test Accounts Bar (for immediate verification of all 5 scenarios) */}
          <div className="mt-6 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-slate-300 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Quick Test Accounts (Click to Fill):
              </span>
              <span className="text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Demo API: Active
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('9876543210')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-left transition-colors"
                title="Customer: Aarav Sharma"
              >
                <div className="font-bold text-white text-[11px]">Customer</div>
                <div className="font-mono text-[10px] text-slate-400">9876543210</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('9810101010')}
                className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-colors"
                title="Shopkeeper: Rajesh Mehra (Rajesh Ethnic Trends)"
              >
                <div className="font-bold text-amber-300 text-[11px]">Shopkeeper</div>
                <div className="font-mono text-[10px] text-amber-200">9810101010</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('9876543201')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-left transition-colors"
                title="Delivery Boy: Ramesh Kumar"
              >
                <div className="font-bold text-white text-[11px]">Delivery Boy</div>
                <div className="font-mono text-[10px] text-slate-400">9876543201</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('9999999999')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-left transition-colors"
                title="Admin: TRYatHOME Lead"
              >
                <div className="font-bold text-white text-[11px]">Admin</div>
                <div className="font-mono text-[10px] text-slate-400">9999999999</div>
              </button>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 text-center">
              Enter any other 10-digit number (e.g. <span className="font-mono text-slate-300">9811223344</span>) to test unregistered flow / new customer registration.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 px-6 py-4 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} {settings.store_name} • Try at Home Fashion Portal. All rights reserved.</p>
      </footer>
    </div>
  );
};
