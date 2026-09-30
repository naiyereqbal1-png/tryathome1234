import React from 'react';
import { Home, Grid, Search, ShoppingBag, User } from 'lucide-react';
import { Customer } from '../../types';

interface MobileBottomNavProps {
  currentCustomer: Customer | null;
  activeCategorySlug: string;
  cartCount: number;
  onGoHome: () => void;
  onOpenCategories: () => void;
  onFocusSearch: () => void;
  onOpenCart: () => void;
  onOpenAccount: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentCustomer,
  activeCategorySlug,
  cartCount,
  onGoHome,
  onOpenCategories,
  onFocusSearch,
  onOpenCart,
  onOpenAccount,
}) => {
  return (
    <div
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg"
    >
      {/* Home */}
      <button
        id="mobile-nav-home-btn"
        onClick={onGoHome}
        className={`flex flex-col items-center justify-center min-w-[54px] py-1 text-[11px] font-semibold transition-colors ${
          activeCategorySlug === '' ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </button>

      {/* Categories */}
      <button
        id="mobile-nav-categories-btn"
        onClick={onOpenCategories}
        className={`flex flex-col items-center justify-center min-w-[54px] py-1 text-[11px] font-semibold transition-colors ${
          activeCategorySlug !== '' ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Grid className="w-5 h-5 mb-0.5" />
        <span>Categories</span>
      </button>

      {/* Search */}
      <button
        id="mobile-nav-search-btn"
        onClick={onFocusSearch}
        className="flex flex-col items-center justify-center min-w-[54px] py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <Search className="w-5 h-5 mb-0.5" />
        <span>Search</span>
      </button>

      {/* Cart */}
      <button
        id="mobile-nav-cart-btn"
        onClick={onOpenCart}
        className="flex flex-col items-center justify-center min-w-[54px] py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 relative transition-colors"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[10px] font-bold px-1 rounded-full min-w-[16px] text-center">
              {cartCount}
            </span>
          )}
        </div>
        <span>Cart</span>
      </button>

      {/* Account */}
      <button
        id="mobile-nav-account-btn"
        onClick={onOpenAccount}
        className="flex flex-col items-center justify-center min-w-[54px] py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <User className="w-5 h-5 mb-0.5" />
        <span>{currentCustomer ? 'Account' : 'Login'}</span>
      </button>
    </div>
  );
};
