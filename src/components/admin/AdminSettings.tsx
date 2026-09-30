import React, { useState, useEffect } from 'react';
import {
  Settings,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Truck,
  CreditCard,
  AlertTriangle,
  Clock,
  Sparkles,
  MessageSquare,
  Key,
  Smartphone,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react';
import { db } from '../../services/db';
import { OtpService } from '../../services/otpService';
import { AdminHeroCarouselSettings } from './AdminHeroCarouselSettings';
import { Image as ImageIcon } from 'lucide-react';

interface AdminSettingsProps {
  onCatalogReset: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onCatalogReset }) => {
  const [settings, setSettings] = useState(db.getSettings());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [testMobile, setTestMobile] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'CAROUSEL' | 'GENERAL'>('CAROUSEL');

  useEffect(() => {
    const handleSync = () => {
      setSettings(db.getSettings());
    };
    window.addEventListener('style1_data_changed', handleSync);
    return () => window.removeEventListener('style1_data_changed', handleSync);
  }, []);

  const handleTestSms = async () => {
    if (!testMobile || testMobile.replace(/\D/g, '').length < 10) {
      alert('Please enter a valid 10-digit mobile number for test SMS');
      return;
    }
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const demoOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const res = await OtpService.sendOtp(testMobile, demoOtp);
      setTestResult({
        success: res.success,
        message: `${res.message} (Test OTP: ${demoOtp})`,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to trigger test SMS',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetCatalog = () => {
    if (
      confirm(
        'Are you sure you want to reset all products, demo orders, and categories back to the initial 200+ demo garment catalog?'
      )
    ) {
      setIsResetting(true);
      setTimeout(() => {
        db.resetToDemoData();
        setIsResetting(false);
        onCatalogReset();
        alert('TRYatHOME catalog and orders successfully reset to factory defaults!');
      }, 500);
    }
  };

  return (
    <div id="admin-settings-view" className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-black text-slate-900">E-Commerce Store & Checkout Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure delivery thresholds, GST calculation, Cash on Delivery, and demo data presets.
        </p>
      </div>

      {/* Sub-Tabs: Hero Carousel vs Store Rules */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setSettingsTab('CAROUSEL')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
            settingsTab === 'CAROUSEL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-amber-400" />
          <span>HERO CAROUSEL SETTINGS</span>
          <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded">
            Live
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSettingsTab('GENERAL')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
            settingsTab === 'GENERAL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4 text-indigo-400" />
          <span>E-Commerce & Store Rules</span>
        </button>
      </div>

      {settingsTab === 'CAROUSEL' ? (
        <AdminHeroCarouselSettings />
      ) : (
        <>
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Store settings saved and synchronized live!</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSave} className="space-y-6">
        {/* Shipping & Delivery */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Truck className="w-5 h-5 text-indigo-600" />
            <h2 className="font-extrabold text-sm text-slate-900">Delivery Rules & Shipping</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Standard Delivery Charge (₹)
              </label>
              <input
                type="number"
                min={0}
                value={settings.delivery_charge}
                onChange={(e) =>
                  setSettings({ ...settings, delivery_charge: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Applied to orders below the free delivery minimum
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Free Delivery Threshold (₹)
              </label>
              <input
                type="number"
                min={0}
                value={settings.free_delivery_threshold}
                onChange={(e) =>
                  setSettings({ ...settings, free_delivery_threshold: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Orders equal or above this get ₹0 shipping
              </span>
            </div>
          </div>
        </div>

        {/* Taxes & GST */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="font-extrabold text-sm text-slate-900">Indian GST / Taxation</h2>
          </div>

          <div className="max-w-xs text-xs">
            <label className="font-bold text-slate-700 block mb-1">GST Percentage (%)</label>
            <input
              type="number"
              min={0}
              max={28}
              value={settings.gst_percentage}
              onChange={(e) =>
                setSettings({ ...settings, gst_percentage: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Standard garment GST tier is 5% in India
            </span>
          </div>
        </div>

        {/* Try at Home Doorstep Trial Duration & Timer Settings */}
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-200 shadow-2xs space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-100 relative">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-950 flex items-center gap-2">
                  <span>Try at Home Doorstep Timer Settings</span>
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Core Feature
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Configure trial duration (minutes) for doorstep delivery & decision window
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-black bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-lg">
              {settings.try_at_home_duration_minutes || 30} Minutes Set
            </span>
          </div>

          <div className="space-y-4 text-xs relative">
            <div>
              <label className="font-bold text-slate-900 block mb-1.5 flex items-center justify-between">
                <span>Doorstep Trial Duration Limit (in Minutes)</span>
                <span className="text-slate-400 font-normal text-[11px]">Default: 30 minutes</span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-44">
                  <input
                    type="number"
                    min={1}
                    max={360}
                    value={settings.try_at_home_duration_minutes || 30}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        try_at_home_duration_minutes: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="w-full pl-3 pr-10 py-2 border-2 border-indigo-300 focus:border-indigo-600 rounded-xl font-black text-base text-slate-900 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 font-bold text-xs text-slate-400">
                    mins
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick Presets:</span>
                  {[15, 30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          try_at_home_duration_minutes: mins,
                        })
                      }
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        (settings.try_at_home_duration_minutes || 30) === mins
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                यह समय सीमा केवल <strong>Try at Home</strong> ऑर्डर्स पर लागू होगी। डिलीवरी बॉय जैसे ही ऑर्डर डिलीवर करेगा, ग्राहक के ऑर्डर हिस्ट्री में तुरंत यह टाइमर ऑन हो जाएगा। सामान्य ऑर्डर्स पर टाइमर नहीं दिखेगा।
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl border border-indigo-100 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.try_at_home_auto_close_on_expiry !== false}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      try_at_home_auto_close_on_expiry: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Auto-Close Try at Home Window on Expiry
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    जब उल्लिखित मिनट पूरे होंगे, ग्राहक को 'Try at Home Closed' का स्पष्ट अलर्ट दिखेगा और ट्रायल विंडो समाप्त हो जाएगी।
                  </span>
                </div>
              </label>
            </div>

            {/* Try at Home Extra Charge / Convenience Fee (Non-Refundable) */}
            <div className="pt-3 border-t border-slate-100">
              <label className="font-bold text-slate-900 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-indigo-950 font-black">
                  <span>Try at Home Extra Charge / Service Fee (₹)</span>
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Non-Refundable
                  </span>
                </span>
                <span className="text-slate-400 font-normal text-[11px]">Default: ₹99</span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-44">
                  <span className="absolute left-3 top-2.5 font-bold text-base text-slate-400">₹</span>
                  <input
                    type="number"
                    min={0}
                    max={2000}
                    value={settings.try_at_home_charge !== undefined ? settings.try_at_home_charge : 99}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        try_at_home_charge: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="w-full pl-7 pr-3 py-2 border-2 border-indigo-300 focus:border-indigo-600 rounded-xl font-black text-base text-slate-900 focus:outline-none"
                    placeholder="99"
                  />
                </div>

                {/* Quick Presets for TAH Charge */}
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">Fee Presets:</span>
                  {[0, 49, 79, 99, 149, 199].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          try_at_home_charge: fee,
                        })
                      }
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        (settings.try_at_home_charge !== undefined ? settings.try_at_home_charge : 99) === fee
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {fee === 0 ? 'Free (₹0)' : `₹${fee}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2.5 p-3 bg-indigo-50/70 border border-indigo-200/70 rounded-xl space-y-1">
                <p className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>नियम: जितना चार्ज यहाँ सेट रहेगा, सभी Try at Home ऑर्डर्स के बिल में ऑटोमैटिक जुड़ जाएगा।</span>
                </p>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  यह शुल्क <strong>Non-refundable</strong> रहेगा। अगर ग्राहक ट्रायल के बाद <strong>सभी कपड़े रिटर्न (All Items Return)</strong> भी कर देता है, तब भी डिलीवरी बॉय द्वारा यह सर्विस चार्ज कैश कलेक्ट किया जाएगा।
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="font-extrabold text-sm text-slate-900">Payment Gateway Toggles</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={settings.cod_enabled}
                onChange={(e) => setSettings({ ...settings, cod_enabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <div>
                <span className="font-bold text-slate-900 block">Enable Cash on Delivery (COD)</span>
                <span className="text-[11px] text-slate-500">
                  Allow customers across Indian pincodes to pay upon physical delivery
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={settings.razorpay_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, razorpay_enabled: e.target.checked })
                }
                className="w-4 h-4 rounded text-indigo-600"
              />
              <div>
                <span className="font-bold text-slate-900 block">
                  Enable Online Payment (UPI, Cards, NetBanking, Wallets)
                </span>
                <span className="text-[11px] text-slate-500">
                  Instant secure confirmation via UPI apps (GPay, PhonePe, Paytm) and cards
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* SMS & Twilio Gateway Configuration */}
        <div id="admin-sms-settings-card" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-900">SMS Gateway & OTP Provider Settings</h2>
                <p className="text-[11px] text-slate-500">
                  Subabase database me saved demo credentials. Bad me real Twilio / SMS provider change kar sakte hain.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowTokens(!showTokens)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {showTokens ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showTokens ? 'Hide Keys' : 'Reveal Keys'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SMS Provider Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                SMS Provider
              </label>
              <select
                value={settings.sms_provider || 'demo'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sms_provider: e.target.value as 'demo' | 'twilio' | 'fast2sms' | 'msg91',
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="demo">Demo SMS Gateway (Free / Pre-configured in Subabase)</option>
                <option value="twilio">Twilio SMS (International / India)</option>
                <option value="fast2sms">Fast2SMS (India Quick OTP)</option>
                <option value="msg91">MSG91 (Enterprise SMS & OTP)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Demo mode me OTP instant simulated gateway se send aur log hota hai without extra charges.
              </p>
            </div>

            {/* SMS Sender ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                SMS Sender ID / Header
              </label>
              <input
                type="text"
                value={settings.sms_sender_id || 'TRYHOM'}
                onChange={(e) => setSettings({ ...settings, sms_sender_id: e.target.value })}
                placeholder="e.g. TRYHOM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                6-character alphanumeric DLT sender ID for transactional SMS (Default: TRYHOM)
              </p>
            </div>

            {/* SMS API Key */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>SMS API Key</span>
                <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Subabase Sync Active
                </span>
              </label>
              <div className="relative">
                <input
                  type={showTokens ? 'text' : 'password'}
                  value={settings.sms_api_key || ''}
                  onChange={(e) => setSettings({ ...settings, sms_api_key: e.target.value })}
                  placeholder="e.g. DEMO_KEY_TRYATHOME_SMS_2026 or your live API key"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <Key className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Twilio Account SID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Twilio Account SID
              </label>
              <input
                type={showTokens ? 'text' : 'password'}
                value={settings.twilio_account_sid || ''}
                onChange={(e) => setSettings({ ...settings, twilio_account_sid: e.target.value })}
                placeholder="e.g. AC_DEMO_TWILIO_ACCOUNT_SID_SUBABASE"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Twilio Auth Token */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Twilio Auth Token
              </label>
              <input
                type={showTokens ? 'text' : 'password'}
                value={settings.twilio_auth_token || ''}
                onChange={(e) => setSettings({ ...settings, twilio_auth_token: e.target.value })}
                placeholder="e.g. AUTH_DEMO_TWILIO_SECRET_TOKEN"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Twilio From Phone */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Twilio From Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.twilio_from_phone || ''}
                  onChange={(e) => setSettings({ ...settings, twilio_from_phone: e.target.value })}
                  placeholder="e.g. +18005550199 or +91..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <Smartphone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Test SMS Quick Dispatch */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-extrabold text-slate-800">Test SMS Gateway Live</span>
              </div>
              <span className="text-[10px] text-slate-500">
                Active Provider: <strong className="text-slate-700 uppercase">{settings.sms_provider || 'demo'}</strong>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="tel"
                value={testMobile}
                onChange={(e) => setTestMobile(e.target.value)}
                placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                maxLength={10}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleTestSms}
                disabled={isSendingTest}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-pulse' : ''}`} />
                <span>{isSendingTest ? 'Dispatching...' : 'Send Test OTP'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs"
        >
          Save Configuration
        </button>
      </form>

      {/* Danger Zone: Factory Demo Reset */}
      <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-rose-800">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-black text-sm">Demo Catalog & Factory Reset</h3>
        </div>

        <p className="text-xs text-rose-700 leading-relaxed">
          Need to test afresh? This will replenish the full 200+ sample garment database across all
          10 categories (Jeans, T-shirts, Shirts, Pants, Kurtis, Dresses, Kids, Track Pants,
          Jackets) and restore default demo orders and test customer accounts.
        </p>

        <button
          type="button"
          onClick={handleResetCatalog}
          disabled={isResetting}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-extrabold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 transition-colors"
        >
          <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Restoring Catalog...' : 'Reset to 200+ Demo Garments'}</span>
        </button>
      </div>
    </>
  )}
</div>
  );
};
