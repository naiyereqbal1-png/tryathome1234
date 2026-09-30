import React from 'react';
import { X, RotateCcw, Check, Star } from 'lucide-react';
import { Category } from '../../types';

export interface FilterState {
  categorySlug: string;
  gender: string;
  brand: string;
  size: string;
  color: string;
  minPrice: number;
  maxPrice: number;
  minDiscount: number;
  minRating: number;
  inStockOnly: boolean;
  sort: string;
}

interface FilterSidebarProps {
  categories: Category[];
  filters: FilterState;
  onChangeFilters: (newFilters: FilterState) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalProductsCount: number;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  filters,
  onChangeFilters,
  isOpenMobile,
  onCloseMobile,
  totalProductsCount,
}) => {
  const brands = [
    'TRYatHOME Originals',
    'DenimCo Studio',
    'Urban Stitch',
    'Heritage Stitch',
    'StreetVibe India',
    'TRYatHOME Heritage Loom',
    'TRYatHOME Glamour',
    'TRYatHOME Junior',
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '28', '30', '32', '34', '36', '38'];

  const colors = [
    { name: 'Black', hex: '#0f172a' },
    { name: 'White', hex: '#ffffff', border: true },
    { name: 'Blue', hex: '#2563eb' },
    { name: 'Navy', hex: '#1e3a8a' },
    { name: 'Indigo', hex: '#4338ca' },
    { name: 'Olive', hex: '#65a30d' },
    { name: 'Green', hex: '#059669' },
    { name: 'Maroon', hex: '#881337' },
    { name: 'Beige', hex: '#f5f5dc', border: true },
    { name: 'Khaki', hex: '#c2b280' },
  ];

  const priceRanges = [
    { label: 'All Prices', min: 0, max: 10000 },
    { label: 'Under ₹499', min: 0, max: 499 },
    { label: '₹500 - ₹999', min: 500, max: 999 },
    { label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
    { label: '₹2,000 & Above', min: 2000, max: 10000 },
  ];

  const resetFilters = () => {
    onChangeFilters({
      ...filters,
      gender: 'All',
      brand: '',
      size: '',
      color: '',
      minPrice: 0,
      maxPrice: 10000,
      minDiscount: 0,
      minRating: 0,
      inStockOnly: false,
    });
  };

  const content = (
    <div className="space-y-6 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900 text-base">Filters</span>
          <span className="text-xs text-slate-500">({totalProductsCount} items)</span>
        </div>
        <button
          id="reset-filters-btn"
          onClick={resetFilters}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Gender */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
          Gender
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {['All', 'Men', 'Women', 'Kids'].map((g) => (
            <button
              key={g}
              id={`filter-gender-${g}`}
              onClick={() => onChangeFilters({ ...filters, gender: g })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filters.gender === g
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
          Price Range
        </h4>
        <div className="space-y-1.5">
          {priceRanges.map((range, idx) => {
            const isSelected =
              filters.minPrice === range.min && filters.maxPrice === range.max;
            return (
              <label
                key={idx}
                className="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900"
              >
                <input
                  type="radio"
                  name="priceRange"
                  checked={isSelected}
                  onChange={() =>
                    onChangeFilters({
                      ...filters,
                      minPrice: range.min,
                      maxPrice: range.max,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className={`text-xs ${isSelected ? 'font-bold text-indigo-700' : ''}`}>
                  {range.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Category Selection */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
          Category
        </h4>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onChangeFilters({ ...filters, categorySlug: '' })}
            className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
              filters.categorySlug === ''
                ? 'bg-indigo-50 font-bold text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories
            .filter((c) => c.status === 'ACTIVE')
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => onChangeFilters({ ...filters, categorySlug: cat.slug })}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                  filters.categorySlug === cat.slug
                    ? 'bg-indigo-50 font-bold text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{cat.name}</span>
                {cat.item_count !== undefined && (
                  <span className="text-[10px] text-slate-400">({cat.item_count})</span>
                )}
              </button>
            ))}
        </div>
      </div>

      {/* Brand */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
          Brand
        </h4>
        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {brands.map((b) => {
            const isChecked = filters.brand === b;
            return (
              <label
                key={b}
                className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() =>
                    onChangeFilters({
                      ...filters,
                      brand: isChecked ? '' : b,
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className={`text-xs ${isChecked ? 'font-bold text-slate-900' : ''}`}>
                  {b}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
          Sizes
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((s) => {
            const isSelected = filters.size === s;
            return (
              <button
                key={s}
                id={`filter-size-${s}`}
                onClick={() =>
                  onChangeFilters({
                    ...filters,
                    size: isSelected ? '' : s,
                  })
                }
                className={`w-9 h-8 rounded-md text-xs font-bold flex items-center justify-center border transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Discount */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
          Discount
        </h4>
        <div className="space-y-1.5">
          {[
            { label: 'All Discounts', value: 0 },
            { label: '30% or more', value: 30 },
            { label: '40% or more', value: 40 },
            { label: '50% or more', value: 50 },
            { label: '60% or more', value: 60 },
          ].map((d) => (
            <label
              key={d.value}
              className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900"
            >
              <input
                type="radio"
                name="discountFilter"
                checked={filters.minDiscount === d.value}
                onChange={() => onChangeFilters({ ...filters, minDiscount: d.value })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span
                className={`text-xs ${
                  filters.minDiscount === d.value ? 'font-bold text-indigo-700' : ''
                }`}
              >
                {d.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Customer Rating */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
          Customer Rating
        </h4>
        <div className="space-y-1.5">
          {[
            { label: '4★ & Above', value: 4 },
            { label: '4.3★ & Above', value: 4.3 },
            { label: '4.5★ & Above', value: 4.5 },
          ].map((r) => (
            <label
              key={r.value}
              className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900"
            >
              <input
                type="checkbox"
                checked={filters.minRating === r.value}
                onChange={() =>
                  onChangeFilters({
                    ...filters,
                    minRating: filters.minRating === r.value ? 0 : r.value,
                  })
                }
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-xs flex items-center gap-1 font-medium">
                {r.label}
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* In Stock only toggle */}
      <div className="pt-2 border-t border-slate-200">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-bold text-slate-900">In Stock Only</span>
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                inStockOnly: e.target.checked,
              })
            }
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="desktop-filter-sidebar"
        className="hidden lg:block w-64 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs h-fit sticky top-36"
      >
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div
          id="mobile-filter-drawer-backdrop"
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in"
        >
          <div className="w-full max-w-xs bg-white h-full shadow-2xl flex flex-col p-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <span className="font-extrabold text-slate-900 text-lg">Filters & Sort</span>
              <button
                id="close-mobile-filter-btn"
                onClick={onCloseMobile}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1">{content}</div>

            <div className="pt-4 border-t border-slate-200 mt-4 flex gap-2">
              <button
                onClick={resetFilters}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
              >
                Reset
              </button>
              <button
                onClick={onCloseMobile}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Apply ({totalProductsCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
