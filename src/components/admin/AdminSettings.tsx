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
  MapPin,
  Plus,
  Trash2,
  MapPinOff,
  Download,
  Server,
  Globe,
  FileText,
  Terminal,
  Copy,
  ExternalLink,
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
  const [settingsTab, setSettingsTab] = useState<'CAROUSEL' | 'GENERAL' | 'PINCODES' | 'HOSTINGER'>('CAROUSEL');
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeMessage, setPincodeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadFullZip = async () => {
    setIsZipping(true);
    try {
      const { downloadFullProjectZip } = await import('../../utils/downloadProjectZip');
      await downloadFullProjectZip();
    } catch (err: any) {
      alert('Failed to generate project zip: ' + (err?.message || err));
    } finally {
      setIsZipping(false);
    }
  };

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

  const currentAllowedPincodes = db.getServiceablePincodes();

  const handleAddPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pincodeInput.replace(/\D/g, '').trim();
    if (clean.length !== 6) {
      setPincodeMessage({ type: 'error', text: 'Please enter a valid 6-digit Indian Pincode.' });
      return;
    }
    const added = db.addServiceablePincode(clean);
    if (added) {
      setPincodeMessage({ type: 'success', text: `✓ Pincode ${clean} added to allowed delivery list!` });
      setPincodeInput('');
      setSettings(db.getSettings());
      setTimeout(() => setPincodeMessage(null), 3000);
    } else {
      setPincodeMessage({ type: 'error', text: 'Failed to add pincode.' });
    }
  };

  const handleRemovePincode = (pin: string) => {
    if (pin === '822114') {
      setPincodeMessage({ type: 'error', text: 'Pincode 822114 (Garhwa) is the mandatory default store pincode and cannot be removed.' });
      setTimeout(() => setPincodeMessage(null), 3500);
      return;
    }
    if (confirm(`Remove pincode ${pin} from allowed delivery list? Customers with this pincode will no longer be able to place orders.`)) {
      db.removeServiceablePincode(pin);
      setPincodeMessage({ type: 'success', text: `Pincode ${pin} removed.` });
      setSettings(db.getSettings());
      setTimeout(() => setPincodeMessage(null), 3000);
    }
  };

  const getEnvContentString = () => {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://mjpwgqgc7t6bi7asag5uqa.supabase.co';
    const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcHdnaHFjN3Q2Ymk3YXNhZzV1cWEiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNjQ1NDQwMCwiZXhwIjoyMDUyMDMwNDAwfQ...';

    return `# TRYatHOME Environment Configuration for Hostinger Deployment
# App & Store Identity
VITE_APP_TITLE="TRYatHOME - Garment Try at Home"
VITE_STORE_NAME="TRYatHOME"
VITE_DEFAULT_PINCODE="822114"

# Supabase Production Database & Realtime Sync
VITE_SUPABASE_URL="${supabaseUrl}"
VITE_SUPABASE_ANON_KEY="${supabaseAnonKey}"

# Server Runtime Configuration (For Hostinger VPS / Node Express)
PORT=3000
NODE_ENV=production
`;
  };

  const handleDownloadEnvFile = () => {
    const content = getEnvContentString();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '.env';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtaccessFile = () => {
    const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
`;
    const blob = new Blob([htaccessContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '.htaccess';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyEnvText = () => {
    const text = getEnvContentString();
    navigator.clipboard.writeText(text);
    setEnvCopied(true);
    setTimeout(() => setEnvCopied(false), 2500);
  };

  const currentAdmin = db.getCurrentAdmin();
  const activeFilter = db.getActiveStoreFilter();
  const isSuperAdmin = currentAdmin?.role === 'super_admin' && (!activeFilter || activeFilter === 'ALL');

  return (
    <div id="admin-settings-view" className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-black text-slate-900">E-Commerce Store & Checkout Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure delivery thresholds, GST calculation, Cash on Delivery, and demo data presets.
        </p>
      </div>

      {/* Sub-Tabs: Hero Carousel vs Store Rules vs Pincodes (Super Admin Only) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
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

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setSettingsTab('PINCODES')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              settingsTab === 'PINCODES'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>ALLOWED PINCODES</span>
            <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.2 rounded">
              {currentAllowedPincodes.length} Active
            </span>
          </button>
        )}

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

        <button
          type="button"
          onClick={() => setSettingsTab('HOSTINGER')}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
            settingsTab === 'HOSTINGER'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <Server className="w-4 h-4 text-purple-400" />
          <span>🚀 HOSTINGER DEPLOYMENT & .ENV</span>
          <span className="text-[10px] bg-purple-600 text-white font-bold px-1.5 py-0.2 rounded">
            Export
          </span>
        </button>
      </div>

      {settingsTab === 'CAROUSEL' ? (
        <AdminHeroCarouselSettings />
      ) : settingsTab === 'HOSTINGER' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-600" />
                Hostinger Deployment & Environment Config (.env)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Download preconfigured environment variables, Apache rewrite rules (.htaccess), and complete deployment steps for Hostinger Web Hosting & VPS.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadFullZip}
                disabled={isZipping}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md inline-flex items-center gap-2 transition-all transform hover:scale-[1.02]"
              >
                <Download className={`w-4 h-4 ${isZipping ? 'animate-bounce' : ''}`} />
                <span>{isZipping ? 'Creating Project ZIP...' : '📦 Download Full Project Source (.zip)'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadEnvFile}
                className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs rounded-xl inline-flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-purple-600" />
                <span>Download .env</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadHtaccessFile}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs inline-flex items-center gap-2 transition-colors"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Download .htaccess</span>
              </button>
            </div>
          </div>

          {/* Quick Copy Box */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-2 text-purple-400 font-bold">
                <Terminal className="w-4 h-4" />
                .env (Hostinger Production Variables)
              </span>
              <button
                type="button"
                onClick={handleCopyEnvText}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                {envCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy .env Text</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs font-mono text-purple-200 bg-slate-900 p-4 rounded-xl overflow-x-auto whitespace-pre leading-relaxed border border-slate-800/80">
              {getEnvContentString()}
            </pre>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method A: Hostinger Shared Hosting */}
            <div className="bg-purple-50/50 border border-purple-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 font-black text-xs text-purple-900">
                <Globe className="w-4 h-4 text-purple-600" />
                <span>METHOD 1: Hostinger Web Hosting (cPanel / hPanel)</span>
              </div>
              <ol className="text-xs text-purple-950 space-y-2 font-medium list-decimal pl-4">
                <li>
                  Run <code className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-mono font-bold">npm run build</code> locally to create the <code className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-mono font-bold">dist</code> folder.
                </li>
                <li>
                  Open <strong>Hostinger hPanel &gt; File Manager</strong> and go to <code className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-mono font-bold">public_html</code>.
                </li>
                <li>
                  Upload all contents from the <code className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-mono font-bold">dist/</code> folder directly into <code className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-mono font-bold">public_html</code>.
                </li>
                <li>
                  Upload the downloaded <code className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-mono font-bold">.htaccess</code> file to <code className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-mono font-bold">public_html</code> (enables SPA page refreshes).
                </li>
              </ol>
            </div>

            {/* Method B: Hostinger VPS / Node.js Express */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 font-black text-xs text-slate-900">
                <Server className="w-4 h-4 text-indigo-600" />
                <span>METHOD 2: Hostinger VPS / Node.js Server</span>
              </div>
              <ol className="text-xs text-slate-700 space-y-2 font-medium list-decimal pl-4">
                <li>
                  Upload project files to your Hostinger VPS directory.
                </li>
                <li>
                  Place the downloaded <code className="bg-slate-200 text-slate-900 px-1.5 py-0.5 rounded font-mono font-bold">.env</code> file in the root folder.
                </li>
                <li>
                  Run <code className="bg-slate-200 text-slate-900 px-1.5 py-0.5 rounded font-mono font-bold">npm install</code> and <code className="bg-slate-200 text-slate-900 px-1.5 py-0.5 rounded font-mono font-bold">npm run build</code>.
                </li>
                <li>
                  Start server with <code className="bg-slate-200 text-slate-900 px-1.5 py-0.5 rounded font-mono font-bold">pm2 start server.ts --name tryathome</code> or <code className="bg-slate-200 text-slate-900 px-1.5 py-0.5 rounded font-mono font-bold">npm start</code>.
                </li>
              </ol>
            </div>
          </div>
        </div>
      ) : (settingsTab === 'PINCODES' && isSuperAdmin) ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Serviceable Delivery Pincodes Management
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Only customers entering or selecting an allowed pincode from this list can place orders or add delivery addresses. Unserviceable pincodes are rejected automatically.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold rounded-full shrink-0">
              {currentAllowedPincodes.length} Allowed Locations
            </span>
          </div>

          {pincodeMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
              pincodeMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border border-rose-300 text-rose-800'
            }`}>
              {pincodeMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{pincodeMessage.text}</span>
            </div>
          )}

          {/* Add Pincode Form */}
          <form onSubmit={handleAddPincode} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                Add New 6-Digit Delivery Pincode
              </label>
              <input
                type="text"
                maxLength={6}
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 822114, 834001, 800001"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-hidden focus:border-emerald-600"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0 w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add Serviceable Pincode</span>
            </button>
          </form>

          {/* Allowed Pincodes List */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-800 mb-3 flex items-center justify-between">
              <span>Active Allowed Pincodes List</span>
              <span className="text-slate-400 font-normal">Default Fallback: 822114 (Garhwa)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {currentAllowedPincodes.map((pin) => {
                const isDefaultGarhwa = pin === '822114';
                return (
                  <div
                    key={pin}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isDefaultGarhwa
                        ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-black'
                        : 'bg-white border-slate-200 text-slate-900 font-bold hover:border-emerald-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className={`w-4 h-4 shrink-0 ${isDefaultGarhwa ? 'text-amber-600' : 'text-emerald-600'}`} />
                      <div className="truncate">
                        <span className="text-sm font-extrabold block">{pin}</span>
                        {isDefaultGarhwa && (
                          <span className="text-[10px] text-amber-700 font-bold block -mt-0.5">DEFAULT GARHWA</span>
                        )}
                      </div>
                    </div>

                    {!isDefaultGarhwa ? (
                      <button
                        type="button"
                        onClick={() => handleRemovePincode(pin)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                        title="Remove Pincode"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-black bg-amber-200/60 px-1.5 py-0.5 rounded">
                        Mandatory
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
