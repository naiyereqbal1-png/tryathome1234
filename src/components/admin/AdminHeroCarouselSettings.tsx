import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Upload,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Eye,
  Sparkles,
  Info,
} from 'lucide-react';
import { db } from '../../services/db';
import { DEFAULT_HERO_SLIDES } from '../catalog/HeroCarousel';
import { uploadProductImage } from '../../utils/supabase/storage';

interface ImageSlotState {
  url: string;
  isValid: boolean | null; // null = unvalidated/empty, true = loaded, false = error
  errorMsg?: string;
  isChecking?: boolean;
}

export const AdminHeroCarouselSettings: React.FC = () => {
  const [currentAdmin] = useState(() => db.getCurrentAdmin());
  const initialSettings = db.getSettings();

  const [slot1, setSlot1] = useState<string>(initialSettings.hero_image_1 || '');
  const [slot2, setSlot2] = useState<string>(initialSettings.hero_image_2 || '');
  const [slot3, setSlot3] = useState<string>(initialSettings.hero_image_3 || '');
  const [slotBg, setSlotBg] = useState<string>(initialSettings.hero_background_image || '');

  const [status1, setStatus1] = useState<ImageSlotState>({ url: slot1, isValid: null });
  const [status2, setStatus2] = useState<ImageSlotState>({ url: slot2, isValid: null });
  const [status3, setStatus3] = useState<ImageSlotState>({ url: slot3, isValid: null });
  const [statusBg, setStatusBg] = useState<ImageSlotState>({ url: slotBg, isValid: null });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<number>(0);

  // Validate an image URL by loading it into an Image object
  const validateUrl = (url: string, setStatus: React.Dispatch<React.SetStateAction<ImageSlotState>>) => {
    const trimmed = url.trim();
    if (!trimmed) {
      setStatus({ url: '', isValid: null });
      return;
    }

    // Basic URL pattern test
    const isLikelyUrl = /^(https?:\/\/|\/|data:image\/)/i.test(trimmed);
    if (!isLikelyUrl) {
      setStatus({
        url: trimmed,
        isValid: false,
        errorMsg: 'Invalid URL format. Must start with https://, http://, or data:image/',
      });
      return;
    }

    setStatus({ url: trimmed, isValid: null, isChecking: true });

    const img = new Image();
    img.onload = () => {
      setStatus({ url: trimmed, isValid: true, isChecking: false });
    };
    img.onerror = () => {
      setStatus({
        url: trimmed,
        isValid: false,
        errorMsg: 'Broken image link. Image could not be loaded from this URL.',
        isChecking: false,
      });
    };
    img.src = trimmed;
  };

  // Run initial validation on mount
  useEffect(() => {
    if (slot1) validateUrl(slot1, setStatus1);
    if (slot2) validateUrl(slot2, setStatus2);
    if (slot3) validateUrl(slot3, setStatus3);
    if (slotBg) validateUrl(slotBg, setStatusBg);
  }, []);

  // Handle direct file upload to Supabase Storage
  const handleFileUpload = async (slotIndex: number, file: File) => {
    try {
      setUploadingSlot(slotIndex);
      const publicUrl = await uploadProductImage(file, `hero-banner-${slotIndex}-${Date.now()}`);
      if (slotIndex === 1) {
        setSlot1(publicUrl);
        validateUrl(publicUrl, setStatus1);
      } else if (slotIndex === 2) {
        setSlot2(publicUrl);
        validateUrl(publicUrl, setStatus2);
      } else if (slotIndex === 3) {
        setSlot3(publicUrl);
        validateUrl(publicUrl, setStatus3);
      } else if (slotIndex === 4) {
        setSlotBg(publicUrl);
        validateUrl(publicUrl, setStatusBg);
      }
    } catch (err: any) {
      alert(`Image upload failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      // Direct update to Supabase source of truth with admin verification
      const res = await db.updateHeroCarouselSettingsAsync(slot1, slot2, slot3, slotBg);
      setSaveSuccessMsg(res.message || 'Hero carousel settings updated successfully.');
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      setSaveErrorMsg(err?.message || 'Failed to save settings to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setSlot1(DEFAULT_HERO_SLIDES[0]);
    setSlot2(DEFAULT_HERO_SLIDES[1]);
    setSlot3(DEFAULT_HERO_SLIDES[2]);
    setSlotBg('');
    validateUrl(DEFAULT_HERO_SLIDES[0], setStatus1);
    validateUrl(DEFAULT_HERO_SLIDES[1], setStatus2);
    validateUrl(DEFAULT_HERO_SLIDES[2], setStatus3);
    setStatusBg({ url: '', isValid: null });
  };

  const handleClearAll = () => {
    setSlot1('');
    setSlot2('');
    setSlot3('');
    setSlotBg('');
    setStatus1({ url: '', isValid: null });
    setStatus2({ url: '', isValid: null });
    setStatus3({ url: '', isValid: null });
    setStatusBg({ url: '', isValid: null });
  };

  // Preview images list (using fallback for empty or broken URLs)
  const previewImages = [
    status1.isValid && slot1 ? slot1 : DEFAULT_HERO_SLIDES[0],
    status2.isValid && slot2 ? slot2 : DEFAULT_HERO_SLIDES[1],
    status3.isValid && slot3 ? slot3 : DEFAULT_HERO_SLIDES[2],
  ];

  return (
    <div id="hero-carousel-settings-panel" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Customer Storefront Customization</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              HERO CAROUSEL SETTINGS
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Configure the 3-slide image carousel displayed in the Customer Panel Hero Section.
              Changes are saved directly to Supabase as the source of truth and sync live to all customers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Use Default Presets</span>
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Security / Role indicator */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Authorized Admin Role:{' '}
              <strong className="text-slate-800 uppercase">{currentAdmin?.role || 'Administrator'}</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Database: Supabase (store_settings)</span>
        </div>
      </div>

      {/* Success Alert */}
      {saveSuccessMsg && (
        <div
          id="hero-settings-success-alert"
          className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-sm font-bold flex items-center gap-3 shadow-xs animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {saveErrorMsg && (
        <div
          id="hero-settings-error-alert"
          className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-sm font-bold flex items-center gap-3 shadow-xs animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* Form & Live Preview Grid */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Section (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Slot 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                    1
                  </span>
                  <label htmlFor="hero-image-1-input" className="text-sm font-black text-slate-900">
                    Hero Image 1 (Slide 1)
                  </label>
                </div>
                {status1.isValid === true && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3 h-3" /> Valid Image
                  </span>
                )}
                {status1.isValid === false && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                    <AlertCircle className="w-3 h-3" /> Broken URL
                  </span>
                )}
                {status1.isValid === null && !slot1 && (
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    Fallback to Default
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  id="hero-image-1-input"
                  type="text"
                  value={slot1}
                  onChange={(e) => {
                    setSlot1(e.target.value);
                    validateUrl(e.target.value, setStatus1);
                  }}
                  placeholder="Paste public image URL (e.g., https://.../banner1.jpg)"
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
                <label className="cursor-pointer px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingSlot === 1 ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingSlot === 1}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(1, f);
                    }}
                  />
                </label>
              </div>

              {status1.errorMsg && (
                <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {status1.errorMsg}
                </p>
              )}
            </div>

            {/* Slot 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  <label htmlFor="hero-image-2-input" className="text-sm font-black text-slate-900">
                    Hero Image 2 (Slide 2)
                  </label>
                </div>
                {status2.isValid === true && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3 h-3" /> Valid Image
                  </span>
                )}
                {status2.isValid === false && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                    <AlertCircle className="w-3 h-3" /> Broken URL
                  </span>
                )}
                {status2.isValid === null && !slot2 && (
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    Fallback to Default
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  id="hero-image-2-input"
                  type="text"
                  value={slot2}
                  onChange={(e) => {
                    setSlot2(e.target.value);
                    validateUrl(e.target.value, setStatus2);
                  }}
                  placeholder="Paste public image URL (e.g., https://.../banner2.jpg)"
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
                <label className="cursor-pointer px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingSlot === 2 ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingSlot === 2}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(2, f);
                    }}
                  />
                </label>
              </div>

              {status2.errorMsg && (
                <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {status2.errorMsg}
                </p>
              )}
            </div>

            {/* Slot 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  <label htmlFor="hero-image-3-input" className="text-sm font-black text-slate-900">
                    Hero Image 3 (Slide 3)
                  </label>
                </div>
                {status3.isValid === true && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3 h-3" /> Valid Image
                  </span>
                )}
                {status3.isValid === false && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                    <AlertCircle className="w-3 h-3" /> Broken URL
                  </span>
                )}
                {status3.isValid === null && !slot3 && (
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    Fallback to Default
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  id="hero-image-3-input"
                  type="text"
                  value={slot3}
                  onChange={(e) => {
                    setSlot3(e.target.value);
                    validateUrl(e.target.value, setStatus3);
                  }}
                  placeholder="Paste public image URL (e.g., https://.../banner3.jpg)"
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
                <label className="cursor-pointer px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingSlot === 3 ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingSlot === 3}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(3, f);
                    }}
                  />
                </label>
              </div>

              {status3.errorMsg && (
                <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {status3.errorMsg}
                </p>
              )}
            </div>

            {/* Hero Background Image Setting (Black Color theme card) */}
            <div id="hero-bg-customizer-card" className="bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center">
                    BG
                  </span>
                  <label htmlFor="hero-background-image-input" className="text-sm font-black text-slate-100">
                    Hero Section Background (Black Theme)
                  </label>
                </div>
                {statusBg.isValid === true && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3 h-3" /> Valid Link
                  </span>
                )}
                {statusBg.isValid === false && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                    <AlertCircle className="w-3 h-3" /> Broken URL
                  </span>
                )}
                {statusBg.isValid === null && !slotBg && (
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md">
                    Standard Dark Slate (Default)
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Configure a custom dark backdrop to set behind the Hero section text. For optimal contrast, use dark textures or black fabric images.
              </p>

              {/* Preset buttons */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Black-Themed Presets:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const url = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80';
                      setSlotBg(url);
                      validateUrl(url, setStatusBg);
                    }}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] text-slate-300 transition-colors"
                  >
                    Luxury Dark Wave
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600&q=80';
                      setSlotBg(url);
                      validateUrl(url, setStatusBg);
                    }}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] text-slate-300 transition-colors"
                  >
                    Premium Textile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = 'https://images.unsplash.com/photo-1541364983171-a8ba01d95cfc?w=1600&q=80';
                      setSlotBg(url);
                      validateUrl(url, setStatusBg);
                    }}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] text-slate-300 transition-colors"
                  >
                    Indigo Craft Weave
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSlotBg('');
                      setStatusBg({ url: '', isValid: null });
                    }}
                    className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-950 border border-rose-900/40 rounded-lg text-[10px] text-rose-300 transition-colors"
                  >
                    Reset Background
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  id="hero-background-image-input"
                  type="text"
                  value={slotBg}
                  onChange={(e) => {
                    setSlotBg(e.target.value);
                    validateUrl(e.target.value, setStatusBg);
                  }}
                  placeholder="Paste public image URL (e.g., https://.../dark-background.jpg)"
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
                <label className="cursor-pointer px-3 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingSlot === 4 ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingSlot === 4}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(4, f);
                    }}
                  />
                </label>
              </div>

              {statusBg.errorMsg && (
                <p className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {statusBg.errorMsg}
                </p>
              )}
            </div>

            {/* Save & Action Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                id="hero-carousel-save-btn"
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-initial px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Supabase Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SAVE & UPDATE CAROUSEL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Live Preview Column (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Admin Live Preview
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Slide {activePreviewTab + 1} of 3
                </span>
              </div>

              {/* Preview Display Window */}
              <div className="relative h-56 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  id={`admin-preview-img-${activePreviewTab + 1}`}
                  src={previewImages[activePreviewTab] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                  alt={`Slide ${activePreviewTab + 1} Preview`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 z-10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-black/60 px-2 py-0.5 rounded">
                    SLIDE {activePreviewTab + 1}
                  </span>
                  <p className="text-white text-xs font-bold mt-1 drop-shadow">
                    {activePreviewTab === 0
                      ? 'Denim & Festive Edit'
                      : activePreviewTab === 1
                      ? 'Cotton Streetwear'
                      : 'Linen & Chikankari'}
                  </p>
                </div>
              </div>

              {/* Slide Selector Tabs */}
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((idx) => {
                  const url = [slot1, slot2, slot3][idx];
                  const hasCustom = url && url.trim().length > 0;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePreviewTab(idx)}
                      className={`p-2 rounded-xl text-left border text-xs transition-all ${
                        activePreviewTab === idx
                          ? 'bg-slate-800 border-amber-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-mono text-[10px] text-amber-400">SLIDE {idx + 1}</div>
                      <div className="text-[11px] truncate">
                        {hasCustom ? 'Custom Image' : 'Default Fallback'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Helpful instructions note */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-300">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Important Notes</span>
                </div>
                <p>• Images will automatically rotate in the Customer Panel.</p>
                <p>• If an image link is blank or fails, the existing black theme fallback is automatically displayed.</p>
                <p>• Saved configurations persist in Supabase across all customer devices.</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
