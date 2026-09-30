import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  Palette,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings,
  X,
  FileImage,
  Upload,
} from 'lucide-react';
import { db } from '../../services/db';
import { StoreSettings, HeroSlideConfig, FestivalBannerConfig, AdvertisementBannerConfig } from '../../types';

export const AdminThemeSettings: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const raw = db.getSettings();
    return {
      ...raw,
      primary_color: raw.primary_color || raw.theme_primary || '#4f46e5',
      theme_primary: raw.theme_primary || raw.primary_color || '#4f46e5',
      secondary_color: raw.secondary_color || raw.theme_secondary || '#ffffff',
      theme_secondary: raw.theme_secondary || raw.secondary_color || '#ffffff',
      accent_color: raw.accent_color || raw.theme_accent || '#f59e0b',
      theme_accent: raw.theme_accent || raw.accent_color || '#f59e0b',
      bg_color: raw.bg_color || raw.theme_background || '#f8fafc',
      theme_background: raw.theme_background || raw.bg_color || '#f8fafc',
      text_color: raw.text_color || raw.theme_text || '#334155',
      theme_text: raw.theme_text || raw.text_color || '#334155',
      heading_color: raw.heading_color || raw.theme_heading || '#0f172a',
      theme_heading: raw.theme_heading || raw.heading_color || '#0f172a',
      header_bg_color: raw.header_bg_color || raw.theme_header || '#ffffff',
      theme_header: raw.theme_header || raw.header_bg_color || '#ffffff',
      footer_bg_color: raw.footer_bg_color || raw.theme_footer || '#0f172a',
      theme_footer: raw.theme_footer || raw.footer_bg_color || '#0f172a',
      website_logo: raw.website_logo || raw.logo_header || '',
      logo_header: raw.logo_header || raw.website_logo || '',
      logo_footer: raw.logo_footer || raw.website_logo || '',
      favicon: raw.favicon || raw.logo_favicon || '',
      logo_favicon: raw.logo_favicon || raw.favicon || '',
    };
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync state if external changes happen
  useEffect(() => {
    const handleSync = () => {
      const raw = db.getSettings();
      setSettings({
        ...raw,
        primary_color: raw.primary_color || raw.theme_primary || '#4f46e5',
        theme_primary: raw.theme_primary || raw.primary_color || '#4f46e5',
        secondary_color: raw.secondary_color || raw.theme_secondary || '#ffffff',
        theme_secondary: raw.theme_secondary || raw.secondary_color || '#ffffff',
        accent_color: raw.accent_color || raw.theme_accent || '#f59e0b',
        theme_accent: raw.theme_accent || raw.accent_color || '#f59e0b',
        bg_color: raw.bg_color || raw.theme_background || '#f8fafc',
        theme_background: raw.theme_background || raw.bg_color || '#f8fafc',
        text_color: raw.text_color || raw.theme_text || '#334155',
        theme_text: raw.theme_text || raw.text_color || '#334155',
        heading_color: raw.heading_color || raw.theme_heading || '#0f172a',
        theme_heading: raw.theme_heading || raw.heading_color || '#0f172a',
        header_bg_color: raw.header_bg_color || raw.theme_header || '#ffffff',
        theme_header: raw.theme_header || raw.header_bg_color || '#ffffff',
        footer_bg_color: raw.footer_bg_color || raw.theme_footer || '#0f172a',
        theme_footer: raw.theme_footer || raw.footer_bg_color || '#0f172a',
        website_logo: raw.website_logo || raw.logo_header || '',
        logo_header: raw.logo_header || raw.website_logo || '',
        logo_footer: raw.logo_footer || raw.website_logo || '',
        favicon: raw.favicon || raw.logo_favicon || '',
        logo_favicon: raw.logo_favicon || raw.favicon || '',
      });
    };
    window.addEventListener('style1_data_changed', handleSync);
    return () => window.removeEventListener('style1_data_changed', handleSync);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      // Direct async update to Supabase source of truth
      await db.updateThemeAndDesignSettingsAsync(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setSaveError(err?.message || 'Failed to update website theme & design settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to update specific root fields
  const updateField = (key: keyof StoreSettings, value: any) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        [key]: value,
      };

      // Direct real-time mapping to ensure the main stylesheet applies immediately
      if (key === 'primary_color') updated.theme_primary = value;
      if (key === 'secondary_color') updated.theme_secondary = value;
      if (key === 'accent_color') updated.theme_accent = value;
      if (key === 'bg_color') updated.theme_background = value;
      if (key === 'text_color') updated.theme_text = value;
      if (key === 'heading_color') updated.theme_heading = value;
      if (key === 'header_bg_color') updated.theme_header = value;
      if (key === 'footer_bg_color') updated.theme_footer = value;
      if (key === 'website_logo') {
        updated.logo_header = value;
        updated.logo_footer = value;
      }
      if (key === 'favicon') updated.logo_favicon = value;

      return updated;
    });
  };

  // Helper to update slide fields
  const updateSlide = (index: number, key: keyof HeroSlideConfig, value: any) => {
    const slides = [...(settings.hero_slides || [])];
    if (!slides[index]) {
      slides[index] = {
        url: '',
        title: '',
        subtitle: '',
        buttonText: '',
        buttonLink: '',
        enabled: false,
      };
    }
    slides[index] = { ...slides[index], [key]: value };
    updateField('hero_slides', slides);
  };

  // Helper to add a festival banner
  const addFestivalBanner = () => {
    const banners = [...(settings.festival_banners || [])];
    banners.push({
      festivalName: 'New Festival',
      bannerImageUrl: '',
      title: 'Festival Sale Title',
      subtitle: 'Special offer subtitle',
      buttonText: 'Shop Now',
      buttonLink: '#',
      startDate: '',
      endDate: '',
      enabled: true,
    });
    updateField('festival_banners', banners);
  };

  // Helper to update festival banner
  const updateFestivalBanner = (index: number, key: keyof FestivalBannerConfig, value: any) => {
    const banners = [...(settings.festival_banners || [])];
    if (banners[index]) {
      banners[index] = { ...banners[index], [key]: value };
      updateField('festival_banners', banners);
    }
  };

  // Helper to delete festival banner
  const deleteFestivalBanner = (index: number) => {
    const banners = (settings.festival_banners || []).filter((_, i) => i !== index);
    updateField('festival_banners', banners);
  };

  // Helper to add an advertisement banner
  const addAdBanner = () => {
    const ads = [...(settings.advertisement_banners || [])];
    const id = 'ad_' + Date.now() + Math.random().toString(36).substr(2, 4);
    ads.push({
      id,
      position: 'hero_below',
      imageUrl: '',
      title: 'New Advertisement',
      description: 'Promotional description content.',
      buttonText: 'Explore',
      buttonLink: '#',
      startDate: '',
      endDate: '',
      priority: 0,
      order: ads.length,
      enabled: true,
    });
    updateField('advertisement_banners', ads);
  };

  // Helper to update advertisement banner
  const updateAdBanner = (index: number, key: keyof AdvertisementBannerConfig, value: any) => {
    const ads = [...(settings.advertisement_banners || [])];
    if (ads[index]) {
      ads[index] = { ...ads[index], [key]: value };
      updateField('advertisement_banners', ads);
    }
  };

  // Helper to change banner display sequence order (up/down)
  const moveAdBanner = (index: number, direction: 'UP' | 'DOWN') => {
    const ads = [...(settings.advertisement_banners || [])];
    if (direction === 'UP' && index > 0) {
      const temp = ads[index];
      ads[index] = ads[index - 1];
      ads[index - 1] = temp;
    } else if (direction === 'DOWN' && index < ads.length - 1) {
      const temp = ads[index];
      ads[index] = ads[index + 1];
      ads[index + 1] = temp;
    }
    // Re-index orders to match new array layout
    const reordered = ads.map((item, idx) => ({ ...item, order: idx }));
    updateField('advertisement_banners', reordered);
  };

  // Helper to delete advertisement banner
  const deleteAdBanner = (index: number) => {
    const ads = (settings.advertisement_banners || []).filter((_, i) => i !== index);
    updateField('advertisement_banners', ads);
  };

  // Initialize slides if they don't exist
  useEffect(() => {
    if (!settings.hero_slides || settings.hero_slides.length < 3) {
      const initialSlides = [...(settings.hero_slides || [])];
      while (initialSlides.length < 3) {
        initialSlides.push({
          url: '',
          title: '',
          subtitle: '',
          buttonText: '',
          buttonLink: '',
          enabled: false,
        });
      }
      updateField('hero_slides', initialSlides);
    }
  }, []);

  return (
    <div id="admin-theme-settings-view" className="space-y-6">
      {/* Top Banner & Control Board */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h1 className="text-xl font-black text-slate-900">Website Theme & Design Settings</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize colors, logos, promotional carousels, ad banners, and date-ranged festivals live.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              isPreviewMode
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{isPreviewMode ? 'Exit Mockup Preview' : 'Interactive Preview'}</span>
          </button>

          {/* Save & Publish */}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>{isSaving ? 'Publishing...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {/* Status Indicators */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fade-in shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Website settings updated successfully! Your updates are now live on the storefront.</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fade-in shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>Error: {saveError}</span>
        </div>
      )}

      {isPreviewMode ? (
        /* ================= INTERACTIVE PREVIEW MOCKUP ================= */
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider">
              Storefront Layout Mockup Preview
            </h3>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full font-bold">
              Simulated Theme
            </span>
          </div>

          {/* Simulated Header */}
          <div
            className="p-4 rounded-xl flex items-center justify-between"
            style={{
              backgroundColor: settings.header_bg_color || '#000000',
              color: settings.header_text_color || '#ffffff',
            }}
          >
            <div className="flex items-center gap-2">
              {settings.website_logo && settings.website_logo.trim() !== '' ? (
                <img src={settings.website_logo} alt="Logo" className="h-6 object-contain" />
              ) : (
                <span className="font-black tracking-wider text-sm">TRYatHOME</span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs font-bold opacity-80">
              <span>Home</span>
              <span>Products</span>
              <span>Orders</span>
              <span>Cart (0)</span>
            </div>
          </div>

          {/* Simulated Hero Slider */}
          <div className="h-[240px] rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden flex flex-col justify-end p-6">
            {/* Find first enabled slide or render fallback */}
            {(() => {
              const activeSlide = (settings.hero_slides || []).find((s) => s.enabled && s.url);
              if (activeSlide) {
                return (
                  <>
                    <img
                      src={activeSlide.url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                      alt="Hero"
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                    <div className="relative z-10 space-y-2 max-w-md">
                      <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black uppercase">
                        {activeSlide.title || 'Special Edit'}
                      </span>
                      <h4 className="text-lg font-extrabold text-white leading-tight">
                        {activeSlide.subtitle || 'Custom curated slides'}
                      </h4>
                      {activeSlide.buttonText && (
                        <button className="px-3 py-1.5 bg-amber-400 text-slate-950 text-[10px] font-bold rounded-lg mt-1">
                          {activeSlide.buttonText}
                        </button>
                      )}
                    </div>
                  </>
                );
              } else {
                return (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-slate-500 text-xs">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span>No enabled custom Hero Slide configured. Rendering fallback images.</span>
                  </div>
                );
              }
            })()}
          </div>

          {/* Simulated Festival Banner */}
          {(() => {
            const enabledFestival = (settings.festival_banners || []).find((b) => b.enabled);
            if (enabledFestival) {
              return (
                <div className="p-5 rounded-xl bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {enabledFestival.festivalName} Specials
                    </span>
                    <h4 className="font-extrabold text-md">{enabledFestival.title}</h4>
                    <p className="text-white/80 text-xs">{enabledFestival.subtitle}</p>
                  </div>
                  {enabledFestival.buttonText && (
                    <button className="px-3.5 py-1.5 bg-white text-slate-900 font-extrabold text-xs rounded-lg">
                      {enabledFestival.buttonText}
                    </button>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Simulated Ad Banner List */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400">Positioned Advertisement Slots</span>
            {(() => {
              const enabledAds = (settings.advertisement_banners || []).filter((ad) => ad.enabled);
              if (enabledAds.length > 0) {
                return enabledAds.map((ad, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-850 border border-slate-800 flex items-center gap-3"
                  >
                    {ad.imageUrl && (
                      <img
                        src={ad.imageUrl || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                        alt="Ad"
                        className="w-16 h-12 object-cover rounded-md bg-slate-950 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-black px-1.5 py-0.2 rounded uppercase">
                          {ad.position}
                        </span>
                        <h5 className="text-xs font-extrabold truncate text-white">{ad.title}</h5>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{ad.description}</p>
                    </div>
                  </div>
                ));
              }
              return (
                <p className="text-xs text-slate-500">No enabled advertisement banners configured.</p>
              );
            })()}
          </div>

          {/* Simulated Buttons & Theme Accents */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400">Interactive Colors Sample</span>
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: settings.primary_color || '#4f46e5',
                    color: settings.button_text_color || '#ffffff',
                  }}
                >
                  Primary Action
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-xs font-bold border"
                  style={{
                    borderColor: settings.border_color || '#e2e8f0',
                    color: settings.secondary_color || '#020617',
                  }}
                >
                  Secondary Action
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400">Theme Palette HEX Mapping</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded font-mono">
                  Primary: {settings.primary_color || '#4f46e5'}
                </span>
                <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded font-mono">
                  Accent: {settings.accent_color || '#f59e0b'}
                </span>
                <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded font-mono">
                  Heading: {settings.heading_color || '#0f172a'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= THEME SETTINGS CONTROLS ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: Config panels */}
          <div className="lg:col-span-8 space-y-6">
            {/* Segment 1: Theme & Colors */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Palette className="w-4 h-4 text-indigo-600" />
                <h2 className="font-extrabold text-sm text-slate-900">Theme Colors Palette & Identity</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                {/* Primary Color */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Primary Theme Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={settings.primary_color || '#4f46e5'}
                      onChange={(e) => updateField('primary_color', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={settings.primary_color || '#4f46e5'}
                      onChange={(e) => updateField('primary_color', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg outline-hidden text-center font-mono"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Secondary Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={settings.secondary_color || '#4f46e5'}
                      onChange={(e) => updateField('secondary_color', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={settings.secondary_color || '#4f46e5'}
                      onChange={(e) => updateField('secondary_color', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg outline-hidden text-center font-mono"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Accent Accent Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={settings.accent_color || '#f59e0b'}
                      onChange={(e) => updateField('accent_color', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={settings.accent_color || '#f59e0b'}
                      onChange={(e) => updateField('accent_color', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg outline-hidden text-center font-mono"
                    />
                  </div>
                </div>

                {/* Background Body Color */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">App Background Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={settings.bg_color || '#f8fafc'}
                      onChange={(e) => updateField('bg_color', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={settings.bg_color || '#f8fafc'}
                      onChange={(e) => updateField('bg_color', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg outline-hidden text-center font-mono"
                    />
                  </div>
                </div>

                {/* Text Color */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Text Body Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={settings.text_color || '#334155'}
                      onChange={(e) => updateField('text_color', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={settings.text_color || '#334155'}
                      onChange={(e) => updateField('text_color', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg outline-hidden text-center font-mono"
                    />
                  </div>
                </div>

                {/* Heading Color */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Heading Title Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={settings.heading_color || '#0f172a'}
                      onChange={(e) => updateField('heading_color', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={settings.heading_color || '#0f172a'}
                      onChange={(e) => updateField('heading_color', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg outline-hidden text-center font-mono"
                    />
                  </div>
                </div>

                {/* Header Background */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Header Background</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={settings.header_bg_color || '#000000'}
                      onChange={(e) => updateField('header_bg_color', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={settings.header_bg_color || '#000000'}
                      onChange={(e) => updateField('header_bg_color', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg outline-hidden text-center font-mono"
                    />
                  </div>
                </div>

                {/* Header Text */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Header Text/Icons</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={settings.header_text_color || '#ffffff'}
                      onChange={(e) => updateField('header_text_color', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={settings.header_text_color || '#ffffff'}
                      onChange={(e) => updateField('header_text_color', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg outline-hidden text-center font-mono"
                    />
                  </div>
                </div>

                {/* Footer Background */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Footer Background</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={settings.footer_bg_color || '#0f172a'}
                      onChange={(e) => updateField('footer_bg_color', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={settings.footer_bg_color || '#0f172a'}
                      onChange={(e) => updateField('footer_bg_color', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg outline-hidden text-center font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Segment 2: Branding, Logos & Layout */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Settings className="w-4 h-4 text-indigo-600" />
                <h2 className="font-extrabold text-sm text-slate-900">Identity & Branding Assets</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Website Logo Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or raw svg"
                    value={settings.website_logo || ''}
                    onChange={(e) => updateField('website_logo', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-600"
                  />
                  <p className="text-[10px] text-slate-400">Used inside Header area.</p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Favicon Icon Image URL</label>
                  <input
                    type="url"
                    placeholder="https://... favicon path"
                    value={settings.favicon || ''}
                    onChange={(e) => updateField('favicon', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-600"
                  />
                  <p className="text-[10px] text-slate-400">Favicon shortcut icon linked inside index.html.</p>
                </div>
              </div>
            </div>

            {/* Segment 3: Customer Panel Hero Carousel Slides */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <h2 className="font-extrabold text-sm text-slate-900">
                  Interactive Hero Carousel Slides (Max 3)
                </h2>
              </div>

              <div className="space-y-6">
                {[0, 1, 2].map((idx) => {
                  const slide = settings.hero_slides?.[idx] || {
                    url: '',
                    title: '',
                    subtitle: '',
                    buttonText: '',
                    buttonLink: '',
                    enabled: false,
                  };

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800">Slide {idx + 1} Configuration</span>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slide.enabled}
                            onChange={(e) => updateSlide(idx, 'enabled', e.target.checked)}
                            className="rounded-sm text-indigo-600 focus:ring-0"
                          />
                          <span>Enabled Slide</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Image URL</label>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/..."
                            value={slide.url || ''}
                            onChange={(e) => updateSlide(idx, 'url', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Slide Tag/Title</label>
                          <input
                            type="text"
                            placeholder="e.g., Summer Collections"
                            value={slide.title || ''}
                            onChange={(e) => updateSlide(idx, 'title', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-bold text-slate-600 block">Main Caption/Subtitle</label>
                          <input
                            type="text"
                            placeholder="e.g., Premium handcrafted essentials directly from artisan hubs."
                            value={slide.subtitle || ''}
                            onChange={(e) => updateSlide(idx, 'subtitle', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Button Text</label>
                          <input
                            type="text"
                            placeholder="e.g., Shop Now"
                            value={slide.buttonText || ''}
                            onChange={(e) => updateSlide(idx, 'buttonText', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Button Link</label>
                          <input
                            type="text"
                            placeholder="e.g., #products or category slug"
                            value={slide.buttonLink || ''}
                            onChange={(e) => updateSlide(idx, 'buttonLink', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Segment 4: Festival & Special Event Banners */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-extrabold text-sm text-slate-900">Festival Promotional Banners</h2>
                </div>

                <button
                  type="button"
                  onClick={addFestivalBanner}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-black flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Banner</span>
                </button>
              </div>

              {(!settings.festival_banners || settings.festival_banners.length === 0) ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No festival promotional banners built yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {(settings.festival_banners || []).map((b, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                    >
                      <button
                        type="button"
                        onClick={() => deleteFestivalBanner(idx)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                        title="Delete Festival Banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-slate-800">
                          Festival Banner #{idx + 1}
                        </span>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={b.enabled}
                            onChange={(e) => updateFestivalBanner(idx, 'enabled', e.target.checked)}
                            className="rounded-sm text-indigo-600 focus:ring-0"
                          />
                          <span>Active</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Festival Theme Name</label>
                          <input
                            type="text"
                            placeholder="e.g., Diwali Celebration"
                            value={b.festivalName || ''}
                            onChange={(e) => updateFestivalBanner(idx, 'festivalName', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Banner Background Image URL</label>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/..."
                            value={b.bannerImageUrl || ''}
                            onChange={(e) => updateFestivalBanner(idx, 'bannerImageUrl', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Title Headline</label>
                          <input
                            type="text"
                            placeholder="e.g., FLAT 50% OFF LIVE!"
                            value={b.title || ''}
                            onChange={(e) => updateFestivalBanner(idx, 'title', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Subtitle</label>
                          <input
                            type="text"
                            placeholder="e.g., Celebrating the Loom traditions of Benaras."
                            value={b.subtitle || ''}
                            onChange={(e) => updateFestivalBanner(idx, 'subtitle', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Button Text</label>
                          <input
                            type="text"
                            placeholder="e.g., Shop Now"
                            value={b.buttonText || ''}
                            onChange={(e) => updateFestivalBanner(idx, 'buttonText', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Button Link</label>
                          <input
                            type="text"
                            placeholder="e.g., #products"
                            value={b.buttonLink || ''}
                            onChange={(e) => updateFestivalBanner(idx, 'buttonLink', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Promotion Starts On</label>
                          <input
                            type="datetime-local"
                            value={b.startDate || ''}
                            onChange={(e) => updateFestivalBanner(idx, 'startDate', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Promotion Ends On</label>
                          <input
                            type="datetime-local"
                            value={b.endDate || ''}
                            onChange={(e) => updateFestivalBanner(idx, 'endDate', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Segment 5: Advertisement Slots Grid & Sorting */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-extrabold text-sm text-slate-900">
                    Advertisement Banners Slots & Ordering
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={addAdBanner}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-black flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Ad Slot</span>
                </button>
              </div>

              {(!settings.advertisement_banners || settings.advertisement_banners.length === 0) ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No custom advertisement slots built yet. Click 'Add Ad Slot' above.
                </div>
              ) : (
                <div className="space-y-4">
                  {(settings.advertisement_banners || []).map((ad, idx) => (
                    <div
                      key={ad.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                    >
                      {/* Drag placement selectors */}
                      <div className="absolute right-3 top-3 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveAdBanner(idx, 'UP')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveAdBanner(idx, 'DOWN')}
                          disabled={idx === (settings.advertisement_banners?.length || 0) - 1}
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAdBanner(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Ad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-xs font-black text-slate-800">
                          Banner Slot #{idx + 1} (Priority Order: {idx})
                        </span>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ad.enabled}
                            onChange={(e) => updateAdBanner(idx, 'enabled', e.target.checked)}
                            className="rounded-sm text-indigo-600 focus:ring-0"
                          />
                          <span>Enabled</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Position Placement</label>
                          <select
                            value={ad.position}
                            onChange={(e) => updateAdBanner(idx, 'position', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden bg-white"
                          >
                            <option value="hero_below">Below Hero Slider Section</option>
                            <option value="category_section">Below Categories Strip</option>
                            <option value="product_section">Above Product Listing Title</option>
                            <option value="middle_banner">Middle Product Feed</option>
                            <option value="bottom_banner">Bottom above Footer</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Banner Image URL</label>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/..."
                            value={ad.imageUrl || ''}
                            onChange={(e) => updateAdBanner(idx, 'imageUrl', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Heading Title</label>
                          <input
                            type="text"
                            placeholder="e.g., Buy 1 Get 1 Free on Kurtis"
                            value={ad.title || ''}
                            onChange={(e) => updateAdBanner(idx, 'title', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Description</label>
                          <input
                            type="text"
                            placeholder="e.g., Handloom collections from local weavers."
                            value={ad.description || ''}
                            onChange={(e) => updateAdBanner(idx, 'description', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Action Button Label</label>
                          <input
                            type="text"
                            placeholder="e.g., Shop Deal"
                            value={ad.buttonText || ''}
                            onChange={(e) => updateAdBanner(idx, 'buttonText', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Action Destination Link</label>
                          <input
                            type="text"
                            placeholder="e.g., #products"
                            value={ad.buttonLink || ''}
                            onChange={(e) => updateAdBanner(idx, 'buttonLink', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Display Starts On</label>
                          <input
                            type="datetime-local"
                            value={ad.startDate || ''}
                            onChange={(e) => updateAdBanner(idx, 'startDate', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Display Ends On</label>
                          <input
                            type="datetime-local"
                            value={ad.endDate || ''}
                            onChange={(e) => updateAdBanner(idx, 'endDate', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Color quick links / reference */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Branding Color Guide
            </h3>
            <p className="text-[11px] text-slate-500">
              Changes updated here dynamically modify the CSS variables injected at runtime into the
              storefront. They do not overwrite legacy DB columns, keeping your core settings safe.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/50">
                <span className="font-bold">Primary Actions:</span>
                <span className="font-mono text-[10px] bg-slate-200/50 px-2 py-0.5 rounded">
                  {settings.primary_color || '#4f46e5'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/50">
                <span className="font-bold">Text Color:</span>
                <span className="font-mono text-[10px] bg-slate-200/50 px-2 py-0.5 rounded">
                  {settings.text_color || '#334155'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/50">
                <span className="font-bold">Header BG:</span>
                <span className="font-mono text-[10px] bg-slate-200/50 px-2 py-0.5 rounded">
                  {settings.header_bg_color || '#000000'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                <span>Supports direct Color Picker selection</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span>Full backwards-compatible fallbacks</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
