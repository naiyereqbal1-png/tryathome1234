import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  MapPin,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Package,
  LogOut,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Phone,
  Store,
} from 'lucide-react';
import { Category, Customer } from '../../types';
import { db } from '../../services/db';

interface HeaderProps {
  currentCustomer?: Customer | null;
  customer?: Customer | null;
  onOpenLogin: () => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenProfile: () => void;
  onOpenOrders?: () => void;
  onSelectCategory: (slug: string) => void;
  activeCategorySlug: string;
  onSearch?: (query: string) => void;
  onSearchChange?: (query: string) => void;
  searchQuery: string;
  cartCount: number;
  wishlistCount: number;
  onToggleAdminView?: () => void;
  onOpenAdmin?: () => void;
  onOpenShopkeeper?: () => void;
  isAdminView?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentCustomer,
  customer,
  onOpenLogin,
  onOpenCart,
  onOpenWishlist,
  onOpenProfile,
  onOpenOrders,
  onSelectCategory,
  activeCategorySlug,
  onSearch,
  onSearchChange,
  searchQuery,
  cartCount,
  wishlistCount,
  onToggleAdminView,
  onOpenAdmin,
  onOpenShopkeeper,
  isAdminView = false,
}) => {
  const activeCustomer = currentCustomer || customer || null;
  const [settings, setSettings] = useState(() => db.getSettings());
  const [categories, setCategories] = useState<Category[]>([]);
  const [pincode, setPincode] = useState('560001');
  const [isEditingPincode, setIsEditingPincode] = useState(false);
  const [tempPincode, setTempPincode] = useState('560001');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleQueryChange = (val: string) => {
    if (typeof onSearch === 'function') {
      onSearch(val);
    }
    if (typeof onSearchChange === 'function') {
      onSearchChange(val);
    }
  };

  const handleAdminToggle = () => {
    if (typeof onToggleAdminView === 'function') {
      onToggleAdminView();
    } else if (typeof onOpenAdmin === 'function') {
      onOpenAdmin();
    }
  };

  const handleOrdersClick = () => {
    if (typeof onOpenOrders === 'function') {
      onOpenOrders();
    } else if (typeof onOpenProfile === 'function') {
      onOpenProfile();
    }
  };

  useEffect(() => {
    setCategories(db.getCategories());
    setSettings(db.getSettings());
    const handleDataChange = () => {
      setCategories(db.getCategories());
      setSettings(db.getSettings());
    };
    window.addEventListener('style1_data_changed', handleDataChange);
    return () => window.removeEventListener('style1_data_changed', handleDataChange);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchSuggestions = [
    'Slim Fit Blue Jeans',
    'Cotton Oversized T-Shirt',
    'Pure Linen Shirt',
    'Lucknowi Chikankari Kurti',
    'High Waist Mom Jeans',
    'Stretch Chino Pants',
    'Girls Floral Frock',
    '4-Way Stretch Leggings',
  ].filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()) && searchQuery.length > 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestionsOpen(false);
    handleQueryChange(searchQuery);
  };

  const handlePincodeSave = () => {
    if (tempPincode.length === 6) {
      setPincode(tempPincode);
      setIsEditingPincode(false);
    }
  };

  return (
    <header id="style1-header" className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs theme-bg-header">
      {/* Top Banner / Merchant Bar */}
      <div className="bg-slate-900 text-slate-100 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              BIG FASHION SALE: Up to 60% OFF + Extra ₹100 Off on First Order
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Genuine Garments • Same Day Replacement Only
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenShopkeeper && (
              <button
                id="header-shopkeeper-btn"
                onClick={onOpenShopkeeper}
                className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Shopkeeper Merchant Portal - Product & Inventory Management"
              >
                <Store className="w-3 h-3 text-slate-950" />
                <span>SHOPKEEPER</span>
              </button>
            )}

            <button
              id="header-switch-admin-btn"
              onClick={handleAdminToggle}
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3 h-3" />
              {isAdminView ? 'Switch to Storefront' : 'Admin Panel'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 md:gap-6">
        {/* Mobile menu trigger */}
        <button
          id="mobile-menu-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <div
          id="brand-logo-btn"
          onClick={() => onSelectCategory('')}
          className="cursor-pointer flex items-center gap-2 select-none group"
        >
          {settings.logo_header && settings.logo_header.trim() !== '' ? (
            <img
              src={settings.logo_header}
              alt="Brand Logo"
              referrerPolicy="no-referrer"
              className="h-10 max-w-[180px] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-base tracking-wider">T</span>
                <span className="text-amber-400 font-black text-base">H</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-0.5">
                  <span className="text-xl md:text-2xl font-black tracking-tight text-slate-900 group-hover:text-indigo-900 transition-colors">
                    TRY
                  </span>
                  <span className="text-base md:text-lg font-black text-indigo-600 lowercase italic">
                    at
                  </span>
                  <span className="text-xl md:text-2xl font-black text-rose-600">
                    HOME
                  </span>
                </div>
                <span className="text-[10px] tracking-widest text-slate-500 uppercase font-semibold -mt-1 hidden sm:block">
                  DOORSTEP TRY & BUY FASHION
                </span>
              </div>
            </>
          )}
        </div>

        {/* Delivery Location Pincode (Indian e-commerce pattern) */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-medium">Deliver to</span>
            {isEditingPincode ? (
              <div className="flex items-center gap-1">
                <input
                  id="pincode-input"
                  type="text"
                  maxLength={6}
                  value={tempPincode}
                  onChange={(e) => setTempPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-16 px-1 py-0.5 text-xs border border-indigo-400 rounded outline-hidden"
                  autoFocus
                />
                <button
                  id="pincode-save-btn"
                  onClick={handlePincodeSave}
                  className="text-[11px] text-indigo-600 font-bold hover:underline"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                id="pincode-change-btn"
                onClick={() => setIsEditingPincode(true)}
                className="font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-0.5"
              >
                <span>{pincode}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Prominent Search Bar */}
        <div className="flex-1 max-w-2xl relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              ref={searchInputRef}
              id="main-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                handleQueryChange(e.target.value);
                setSuggestionsOpen(true);
              }}
              onFocus={() => setSuggestionsOpen(true)}
              placeholder="Search for jeans, t-shirts, kurtis, dresses, kids wear..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-sm text-slate-900 border border-slate-300 focus:border-indigo-600 rounded-lg outline-hidden transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                id="search-clear-btn"
                onClick={() => {
                  handleQueryChange('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Autocomplete Suggestions Box */}
          {suggestionsOpen && searchSuggestions.length > 0 && (
            <div
              id="search-suggestions-container"
              className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden"
            >
              <div className="p-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Popular Searches
              </div>
              {searchSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  id={`search-suggestion-${idx}`}
                  onClick={() => {
                    handleQueryChange(item);
                    setSuggestionsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between group"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                    {item}
                  </span>
                  <span className="text-xs text-slate-400">in Garments</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Customer Login / Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            {activeCustomer ? (
              <button
                id="header-user-menu-btn"
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-slate-800 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {activeCustomer.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs text-slate-500 font-normal">Hello,</span>
                  <span className="text-xs font-bold leading-none truncate max-w-[90px]">
                    {activeCustomer.name.split(' ')[0]}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ) : (
              <button
                id="header-login-btn"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-2xs transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}

            {/* Account Menu Dropdown */}
            {isAccountDropdownOpen && activeCustomer && (
              <div
                id="user-account-dropdown"
                className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 text-sm"
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900">{activeCustomer.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> +91 {activeCustomer.mobile}
                  </p>
                  <p className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm mt-1.5 inline-block">
                    {activeCustomer.customer_id}
                  </p>
                </div>

                <button
                  id="dropdown-profile-btn"
                  onClick={() => {
                    setIsAccountDropdownOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>My Profile</span>
                </button>

                <button
                  id="dropdown-orders-btn"
                  onClick={() => {
                    setIsAccountDropdownOpen(false);
                    handleOrdersClick();
                  }}
                  className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <Package className="w-4 h-4 text-slate-500" />
                  <span>My Orders</span>
                </button>

                <button
                  id="dropdown-wishlist-btn"
                  onClick={() => {
                    setIsAccountDropdownOpen(false);
                    onOpenWishlist();
                  }}
                  className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <Heart className="w-4 h-4 text-slate-500" />
                  <span>Wishlist ({wishlistCount})</span>
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  id="dropdown-logout-btn"
                  onClick={() => {
                    setIsAccountDropdownOpen(false);
                    db.customerLogout();
                  }}
                  className="w-full px-4 py-2.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Wishlist Icon */}
          <button
            id="header-wishlist-btn"
            onClick={onOpenWishlist}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span
                id="wishlist-badge"
                className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
              >
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            id="header-cart-btn"
            onClick={onOpenCart}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-2xs transition-colors relative"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span
                id="cart-badge"
                className="bg-rose-600 text-white text-xs font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center"
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Navigation Strip (Indian Marketplace style) */}
      <nav id="category-navigation-bar" className="border-t border-slate-100 bg-white shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-none py-1 text-sm font-medium">
          <button
            id="category-nav-all"
            onClick={() => onSelectCategory('')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeCategorySlug === ''
                ? 'bg-indigo-50 text-indigo-700 font-bold border-b-2 border-indigo-600'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>All Garments</span>
          </button>

          {categories
            .filter((c) => c.status === 'ACTIVE')
            .map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  id={`category-nav-${cat.slug}`}
                  onClick={() => onSelectCategory(cat.slug)}
                  className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors text-xs sm:text-sm ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold border-b-2 border-indigo-600'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                  {cat.item_count !== undefined && cat.item_count > 0 && (
                    <span className="ml-1 text-[10px] text-slate-400 font-normal">
                      ({cat.item_count})
                    </span>
                  )}
                </button>
              );
            })}

          {onOpenShopkeeper && (
            <div className="ml-auto pl-2 shrink-0">
              <button
                id="nav-shopkeeper-link"
                onClick={onOpenShopkeeper}
                className="px-3 py-1 text-xs font-black text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center gap-1.5 border border-amber-300 shadow-2xs cursor-pointer transition-all"
                title="Open Shopkeeper Merchant Portal"
              >
                <Store className="w-3.5 h-3.5 text-amber-800" />
                <span>SHOPKEEPER</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-menu-drawer" className="md:hidden fixed inset-0 z-50 bg-black/50 flex">
          <div className="w-72 bg-white h-full flex flex-col p-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                  TH
                </div>
                <span className="font-extrabold text-slate-900">TRYatHOME</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Account Summary */}
            <div className="py-4 border-b border-slate-100">
              {currentCustomer ? (
                <div>
                  <p className="font-bold text-slate-900">{currentCustomer.name}</p>
                  <p className="text-xs text-slate-500">+91 {currentCustomer.mobile}</p>
                  <p className="text-[11px] font-mono text-indigo-600 mt-1">
                    {currentCustomer.customer_id}
                  </p>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      db.customerLogout();
                    }}
                    className="mt-2 text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm"
                >
                  Sign In / Register with OTP
                </button>
              )}
            </div>

            {/* Mobile Categories */}
            <div className="py-3 flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Shop By Category
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onSelectCategory('');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                    activeCategorySlug === '' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onSelectCategory(cat.slug);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                      activeCategorySlug === cat.slug ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Switch to Admin & Shopkeeper in Mobile */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              {onOpenShopkeeper && (
                <button
                  id="mobile-shopkeeper-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenShopkeeper();
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Store className="w-4 h-4 text-slate-950" />
                  <span>Open SHOPKEEPER Portal</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleAdminToggle();
                }}
                className="w-full py-2.5 bg-slate-900 text-amber-400 font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Go to TRYatHOME Admin Panel</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}
    </header>
  );
};
