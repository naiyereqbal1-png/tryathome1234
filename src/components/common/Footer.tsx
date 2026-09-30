import React, { useState, useEffect } from 'react';
import { ShieldCheck, RotateCcw, Truck, Award, SlidersHorizontal, Store } from 'lucide-react';
import { db } from '../../services/db';

interface FooterProps {
  onSelectCategory: (slug: string) => void;
  onToggleAdminView: () => void;
  onOpenDeliveryLogin?: () => void;
  onOpenShopkeeper?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onToggleAdminView,
  onOpenDeliveryLogin,
  onOpenShopkeeper,
}) => {
  const [settings, setSettings] = useState(() => db.getSettings());

  useEffect(() => {
    setSettings(db.getSettings());
    const handleDataChange = () => {
      setSettings(db.getSettings());
    };
    window.addEventListener('style1_data_changed', handleDataChange);
    return () => window.removeEventListener('style1_data_changed', handleDataChange);
  }, []);

  return (
    <footer id="style1-footer" className="bg-slate-950 text-slate-300 border-t border-slate-800 text-xs theme-bg-footer">
      {/* Service Highlights Strip */}
      <div className="border-b border-slate-900 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">100% Genuine</h4>
              <p className="text-slate-400 text-[11px]">Quality tested garments</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-indigo-400 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">7-Day Free Returns</h4>
              <p className="text-slate-400 text-[11px]">Doorstep reverse pickup</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-emerald-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Fast All-India Shipping</h4>
              <p className="text-slate-400 text-[11px]">Pan India delivery across 19,000+ pin codes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-rose-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Best Value Pricing</h4>
              <p className="text-slate-400 text-[11px]">Direct-from-loom savings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand & About */}
        <div className="col-span-2 space-y-3">
          {settings.logo_footer && settings.logo_footer.trim() !== '' ? (
            <img
              src={settings.logo_footer}
              alt="Footer Logo"
              referrerPolicy="no-referrer"
              className="h-10 max-w-[180px] object-contain mb-2"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                TH
              </div>
              <div className="flex items-center gap-0.5">
                <span className="font-black text-white text-lg tracking-wider">TRY</span>
                <span className="font-black text-indigo-400 text-sm lowercase italic">at</span>
                <span className="font-black text-rose-500 text-lg">HOME</span>
              </div>
            </div>
          )}
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
            TRYatHOME is India’s modern garment marketplace delivering everyday essentials, denim,
            festive kurtis, streetwear, and kids apparel with our signature Try at Home doorstep service.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-2">
            {onOpenShopkeeper && (
              <button
                id="footer-shopkeeper-btn"
                onClick={onOpenShopkeeper}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Store className="w-3.5 h-3.5 text-slate-950" />
                <span>Shopkeeper Portal</span>
              </button>
            )}

            <button
              id="footer-admin-login-btn"
              onClick={onToggleAdminView}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>

            {onOpenDeliveryLogin && (
              <button
                id="footer-delivery-partner-btn"
                onClick={onOpenDeliveryLogin}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-800 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Delivery Partner Portal</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h4 className="text-slate-100 font-bold uppercase tracking-wider text-xs mb-3">
            Shop Garments
          </h4>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li>
              <button
                onClick={() => onSelectCategory('jeans')}
                className="hover:text-white transition-colors"
              >
                Men's & Women's Jeans
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectCategory('t-shirts')}
                className="hover:text-white transition-colors"
              >
                Casual T-Shirts
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectCategory('shirts')}
                className="hover:text-white transition-colors"
              >
                Formal & Linen Shirts
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectCategory('kurtis')}
                className="hover:text-white transition-colors"
              >
                Ethnic Kurtis & Sets
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectCategory('kids')}
                className="hover:text-white transition-colors"
              >
                Kids Collection
              </button>
            </li>
          </ul>
        </div>

        {/* Customer Help */}
        <div>
          <h4 className="text-slate-100 font-bold uppercase tracking-wider text-xs mb-3">
            Customer Help
          </h4>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li>
              <span className="hover:text-white cursor-pointer">Track Your Order</span>
            </li>
            <li>
              <span className="hover:text-white cursor-pointer">7-Day Returns & Exchange</span>
            </li>
            <li>
              <span className="hover:text-white cursor-pointer">Garment Size Chart</span>
            </li>
            <li>
              <span className="hover:text-white cursor-pointer">Cash on Delivery Info</span>
            </li>
            <li>
              <span className="hover:text-white cursor-pointer">Contact Support</span>
            </li>
          </ul>
        </div>

        {/* Corporate / Policies */}
        <div>
          <h4 className="text-slate-100 font-bold uppercase tracking-wider text-xs mb-3">
            TRYatHOME Trust
          </h4>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li>
              <span className="hover:text-white cursor-pointer">Terms & Conditions</span>
            </li>
            <li>
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            </li>
            <li>
              <span className="hover:text-white cursor-pointer">Merchant Verification</span>
            </li>
            <li>
              <span className="hover:text-white cursor-pointer">Security Safeguards</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright Strip */}
      <div className="border-t border-slate-900 py-4 px-4 text-center text-slate-500 text-[11px]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} TRYatHOME Garments India. All rights reserved.</span>
          <span className="text-slate-400">
            Engineered with High-Performance React, TypeScript & Unified Synchronized DB
          </span>
        </div>
      </div>
    </footer>
  );
};
