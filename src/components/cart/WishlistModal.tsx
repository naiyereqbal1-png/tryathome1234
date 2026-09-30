import React, { useState, useMemo } from 'react';
import {
  X,
  Heart,
  ShoppingBag,
  Trash2,
  Check,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';
import { Product, WishlistItem } from '../../types';
import { db } from '../../services/db';

export interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist?: WishlistItem[] | Product[];
  wishlistProducts?: WishlistItem[] | Product[];
  allProducts?: Product[];
  onRemoveWishlist?: (product: Product) => void;
  onRemove?: (productId: string) => void;
  onAddToCart?: (product: Product, size?: string, color?: string) => void;
  onMoveToCart?: (product: Product, size?: string, color?: string) => void;
  onBatchMoveToCart?: (items: { product: Product; size: string; color: string }[]) => void;
  onClearWishlist?: () => void;
  onOpenDetail?: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlistProducts,
  wishlist,
  allProducts,
  onRemoveWishlist,
  onRemove,
  onAddToCart,
  onMoveToCart,
  onBatchMoveToCart,
  onClearWishlist,
  onOpenDetail,
}) => {
  // Normalize items to ensure each item has guaranteed full product data and wishId
  const normalizedItems = useMemo(() => {
    const rawList = (wishlistProducts || wishlist || []) as any[];
    const catalog = allProducts && allProducts.length > 0 ? allProducts : db.getAllProducts();

    const list: { wishId: string; product: Product }[] = [];
    const seenProductIds = new Set<string>();

    rawList.forEach((raw, idx) => {
      if (!raw) return;

      let resolvedProduct: Product | undefined;
      let wishId = raw.id || `wish-${idx}`;

      // Case 1: WishlistItem with product object
      if (raw.product && raw.product.id) {
        resolvedProduct = catalog.find((p) => p.id === raw.product.id) || raw.product;
      }
      // Case 2: WishlistItem with product_id
      else if (raw.product_id) {
        resolvedProduct = catalog.find((p) => p.id === raw.product_id);
      }
      // Case 3: Raw is Product itself
      else if (raw.id && (raw.selling_price !== undefined || raw.name !== undefined)) {
        resolvedProduct = raw as Product;
      }

      if (resolvedProduct && !seenProductIds.has(resolvedProduct.id)) {
        seenProductIds.add(resolvedProduct.id);
        list.push({ wishId, product: resolvedProduct });
      }
    });

    return list;
  }, [wishlistProducts, wishlist, allProducts]);

  // Selected item checkboxes for batch move to cart
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Selected size per product: { [productId]: string }
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  // Selected color per product: { [productId]: string }
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});

  // Action status feedback per product: { [productId]: 'moved' | 'removed' }
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleToggleSelect = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === normalizedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(normalizedItems.map((item) => item.product.id));
    }
  };

  const getProductSize = (product: Product): string => {
    if (selectedSizes[product.id]) return selectedSizes[product.id];
    if (product.sizes && product.sizes.length > 0) return product.sizes[0];
    return 'M';
  };

  const getProductColor = (product: Product): string => {
    if (selectedColors[product.id]) return selectedColors[product.id];
    if (product.colors && product.colors.length > 0) return product.colors[0];
    return 'Default';
  };

  const handleSelectSize = (productId: string, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleSelectColor = (productId: string, color: string) => {
    setSelectedColors((prev) => ({ ...prev, [productId]: color }));
  };

  const handleRemoveItem = (product: Product, wishId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Trigger feedback
    setFeedback((prev) => ({ ...prev, [product.id]: 'removed' }));

    setTimeout(() => {
      if (typeof onRemoveWishlist === 'function') {
        onRemoveWishlist(product);
      }
      if (typeof onRemove === 'function') {
        onRemove(product.id);
      }
      // Also invoke db as guaranteed fallback
      db.removeFromWishlist(product.id);
      db.removeFromWishlist(wishId);

      setSelectedIds((prev) => prev.filter((id) => id !== product.id));
    }, 150);
  };

  const handleMoveItemToCart = (product: Product, wishId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const chosenSize = getProductSize(product);
    const chosenColor = getProductColor(product);

    setFeedback((prev) => ({ ...prev, [product.id]: 'moved' }));

    setTimeout(() => {
      if (typeof onAddToCart === 'function') {
        onAddToCart(product, chosenSize, chosenColor);
      } else if (typeof onMoveToCart === 'function') {
        onMoveToCart(product, chosenSize, chosenColor);
      } else {
        db.addToCart(product, chosenSize, chosenColor, 1);
      }

      if (typeof onRemoveWishlist === 'function') {
        onRemoveWishlist(product);
      }
      if (typeof onRemove === 'function') {
        onRemove(product.id);
      }
      db.removeFromWishlist(product.id);
      db.removeFromWishlist(wishId);

      setSelectedIds((prev) => prev.filter((id) => id !== product.id));
    }, 200);
  };

  const handleMoveSelectedToCart = () => {
    const itemsToMove = normalizedItems.filter((it) => selectedIds.includes(it.product.id));
    if (itemsToMove.length === 0) return;

    if (typeof onBatchMoveToCart === 'function') {
      const payload = itemsToMove.map((it) => ({
        product: it.product,
        size: getProductSize(it.product),
        color: getProductColor(it.product),
      }));
      onBatchMoveToCart(payload);
    } else {
      itemsToMove.forEach((it) => {
        const size = getProductSize(it.product);
        const color = getProductColor(it.product);
        if (typeof onAddToCart === 'function') {
          onAddToCart(it.product, size, color);
        } else if (typeof onMoveToCart === 'function') {
          onMoveToCart(it.product, size, color);
        } else {
          db.addToCart(it.product, size, color, 1);
        }
        db.removeFromWishlist(it.product.id);
        db.removeFromWishlist(it.wishId);
        if (typeof onRemoveWishlist === 'function') {
          onRemoveWishlist(it.product);
        }
      });
    }

    setSelectedIds([]);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      if (typeof onClearWishlist === 'function') {
        onClearWishlist();
      } else {
        db.clearWishlist();
      }
      setSelectedIds([]);
    }
  };

  const handleOpenItemDetail = (product: Product) => {
    if (typeof onOpenDetail === 'function') {
      onClose();
      onOpenDetail(product);
    }
  };

  // Calculate selected total
  const selectedTotal = normalizedItems
    .filter((it) => selectedIds.includes(it.product.id))
    .reduce((sum, it) => sum + (it.product.selling_price || 0), 0);

  return (
    <div
      id="wishlist-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="wishlist-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[88vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-500" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base tracking-tight flex items-center gap-2">
                <span>My Wishlist</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {normalizedItems.length} {normalizedItems.length === 1 ? 'item' : 'items'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Pick your size and move favorites directly to your shopping bag
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {normalizedItems.length > 0 && (
              <button
                id="wishlist-clear-all-btn"
                onClick={handleClearAll}
                className="text-[11px] text-slate-400 hover:text-rose-400 font-bold px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear all saved items"
              >
                Clear All
              </button>
            )}
            <button
              id="wishlist-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Wishlist"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selection & Batch Action Toolbar (When items exist) */}
        {normalizedItems.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
            <button
              id="wishlist-select-all-btn"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-slate-700 font-bold hover:text-indigo-600 transition-colors cursor-pointer select-none"
            >
              {selectedIds.length === normalizedItems.length && normalizedItems.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-indigo-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                Select All ({selectedIds.length}/{normalizedItems.length})
              </span>
            </button>

            {selectedIds.length > 0 && (
              <button
                id="wishlist-batch-move-btn"
                onClick={handleMoveSelectedToCart}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer text-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>
                  Move Selected ({selectedIds.length}) • ₹{selectedTotal.toLocaleString('en-IN')}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Item List Container */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-3">
          {normalizedItems.length === 0 ? (
            <div className="py-14 text-center text-slate-500">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">Your Wishlist is empty</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-5">
                Explore TRYatHOME garments and tap the heart icon on any outfit to save it here.
              </p>
              <button
                id="wishlist-empty-explore-btn"
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Explore Garments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            normalizedItems.map(({ wishId, product }) => {
              const isSelected = selectedIds.includes(product.id);
              const activeSize = getProductSize(product);
              const activeColor = getProductColor(product);
              const availableSizes =
                product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL'];
              const availableColors =
                product.colors && product.colors.length > 0 ? product.colors : [];

              const sellingPrice = product.selling_price ?? 0;
              const mrp = product.mrp ?? sellingPrice;
              const discount =
                product.discount_percentage ??
                (mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0);
              const savings = mrp > sellingPrice ? mrp - sellingPrice : 0;

              const img =
                (product.images && product.images[0]?.image_url) ||
                'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80';

              const itemFeedback = feedback[product.id];

              return (
                <div
                  key={product.id}
                  id={`wishlist-item-${product.id}`}
                  className={`pt-3 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all rounded-xl p-2.5 ${
                    isSelected ? 'bg-indigo-50/40 border border-indigo-200' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Left: Checkbox + Thumbnail + Product Details */}
                  <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox for batch move */}
                    <button
                      type="button"
                      id={`wishlist-check-${product.id}`}
                      onClick={() => handleToggleSelect(product.id)}
                      className="mt-2 text-slate-400 hover:text-indigo-600 cursor-pointer p-0.5"
                      title={isSelected ? 'Deselect item' : 'Select item to move to cart'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>

                    {/* Thumbnail Image */}
                    <div
                      onClick={() => handleOpenItemDetail(product)}
                      className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer group bg-slate-100"
                    >
                      <img
                        src={img || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.stock !== undefined && product.stock <= 0 && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                          <span className="text-[9px] font-extrabold text-white uppercase tracking-wider">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Meta & Price */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded uppercase tracking-wider">
                          {product.brand || 'TRYatHOME'}
                        </span>
                        {product.gender && (
                          <span className="text-[10px] font-semibold text-slate-500">
                            • {product.gender}
                          </span>
                        )}
                      </div>

                      <h4
                        onClick={() => handleOpenItemDetail(product)}
                        className="text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer line-clamp-1 mt-0.5"
                        title={product.name}
                      >
                        {product.name}
                      </h4>

                      {/* CLEAR, GUARANTEED ITEM PRICE DISPLAY */}
                      <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-slate-950">
                          ₹{sellingPrice.toLocaleString('en-IN')}
                        </span>
                        {mrp > sellingPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                        {discount > 0 && (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                            {discount}% OFF
                          </span>
                        )}
                      </div>

                      {savings > 0 && (
                        <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          You save ₹{savings.toLocaleString('en-IN')}
                        </p>
                      )}

                      {/* SIZE SELECTOR (salect kar hona chahiye) */}
                      <div className="mt-2.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 mb-1">
                          <span>Select Size:</span>
                          <span className="text-indigo-700 font-extrabold">{activeSize}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {availableSizes.map((sz) => {
                            const isSzActive = activeSize === sz;
                            return (
                              <button
                                key={sz}
                                type="button"
                                id={`wishlist-size-btn-${product.id}-${sz}`}
                                onClick={() => handleSelectSize(product.id, sz)}
                                className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer border ${
                                  isSzActive
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Optional Color Selector */}
                      {availableColors.length > 1 && (
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-500">Color:</span>
                          {availableColors.map((col) => {
                            const isColActive = activeColor === col;
                            return (
                              <button
                                key={col}
                                type="button"
                                onClick={() => handleSelectColor(product.id, col)}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded border cursor-pointer ${
                                  isColActive
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent'
                                }`}
                              >
                                {col}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Move to Cart & Delete Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      id={`wishlist-move-to-cart-${product.id}`}
                      onClick={(e) => handleMoveItemToCart(product, wishId, e)}
                      disabled={product.stock !== undefined && product.stock <= 0}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                        itemFeedback === 'moved'
                          ? 'bg-emerald-600 text-white'
                          : product.stock !== undefined && product.stock <= 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                      }`}
                      title={`Move to Cart in Size ${activeSize}`}
                    >
                      {itemFeedback === 'moved' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Moved to Cart!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Move to Cart ({activeSize})</span>
                        </>
                      )}
                    </button>

                    <button
                      id={`wishlist-remove-btn-${product.id}`}
                      onClick={(e) => handleRemoveItem(product, wishId, e)}
                      className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold">Remove</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer / Batch summary */}
        {normalizedItems.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900">{normalizedItems.length}</span> items in wishlist •{' '}
              <span className="font-bold text-slate-900">{selectedIds.length}</span> selected
            </div>

            <div className="flex items-center gap-2">
              <button
                id="wishlist-continue-shopping-btn"
                onClick={onClose}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>

              {selectedIds.length > 0 ? (
                <button
                  id="wishlist-footer-move-selected-btn"
                  onClick={handleMoveSelectedToCart}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move {selectedIds.length} to Cart</span>
                </button>
              ) : (
                <button
                  id="wishlist-select-first-to-move-btn"
                  onClick={handleToggleSelectAll}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Select All
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
