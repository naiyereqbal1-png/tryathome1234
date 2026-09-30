import React, { useState } from 'react';
import { Heart, Star, ShoppingBag, Zap, Check } from 'lucide-react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onOpenDetail: (product: Product) => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
  onBuyNow: (product: Product, size: string, color: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetail,
  onAddToCart,
  onBuyNow,
  isWishlisted,
  onToggleWishlist,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

  const images = product.images || [];
  const primaryImg = images.find((i) => i.is_primary)?.image_url || images[0]?.image_url || 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80';
  const secondaryImg = images.length > 1 ? images[1].image_url : primaryImg;
  const displayImg = isHovered && secondaryImg ? secondaryImg : primaryImg;

  const sizes = product.sizes || [];
  const colors = product.colors || [];
  const defaultSize = sizes[0] || 'M';
  const defaultColor = colors[0] || 'Default';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, defaultSize, defaultColor);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1200);
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBuyNow(product, defaultSize, defaultColor);
  };

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onOpenDetail(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden cursor-pointer relative select-none"
    >
      {/* Top badges & Wishlist */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        {/* Discount or tag */}
        <div className="flex flex-col gap-1 pointer-events-auto">
          {product.discount_percentage > 0 && (
            <span
              id={`product-discount-badge-${product.id}`}
              className="bg-rose-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-sm shadow-xs uppercase tracking-tight"
            >
              {product.discount_percentage}% OFF
            </span>
          )}
          {/* Tag badge hidden as requested to keep the storefront clean */}
        </div>

        {/* Wishlist button */}
        <button
          id={`wishlist-btn-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`p-2 rounded-full backdrop-blur-xs shadow-xs transition-transform active:scale-90 pointer-events-auto ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600'
              : 'bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white'
          }`}
          title="Add to Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
        </button>
      </div>

      {/* Product Image Container */}
      <div className="relative w-full pt-[125%] bg-slate-100 overflow-hidden">
        <img
          src={displayImg}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Stock / Status Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-white text-slate-900 font-extrabold text-xs px-3 py-1.5 rounded-md shadow-md uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}

        {isLowStock && !isOutOfStock && (
          <div className="absolute bottom-2 left-2 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-sm shadow-xs">
            Only {product.stock} left!
          </div>
        )}

        {/* Floating Quick Action overlay on desktop hover */}
        <div className="hidden lg:flex absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity gap-2">
          <button
            id={`quick-add-btn-${product.id}`}
            disabled={isOutOfStock}
            onClick={handleQuickAdd}
            className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            {addedAnim ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
          <button
            id={`quick-buy-btn-${product.id}`}
            disabled={isOutOfStock}
            onClick={handleQuickBuy}
            className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand and Category */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px] truncate">
              {product.brand}
            </span>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
              {product.gender}
            </span>
          </div>

          {/* Product Name */}
          <h3
            id={`product-name-${product.id}`}
            className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug"
          >
            {product.name}
          </h3>

          {/* Rating Badge */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex items-center gap-1 bg-emerald-700 text-white text-[11px] font-bold px-1.5 py-0.2 rounded">
              <span>{product.rating}</span>
              <Star className="w-2.5 h-2.5 fill-white" />
            </div>
            <span className="text-[11px] text-slate-400">
              ({product.rating_count})
            </span>
          </div>
        </div>

        {/* Price Area */}
        <div className="mt-3 pt-2 border-t border-slate-100">
          <div className="flex items-baseline gap-2">
            <span
              id={`product-price-${product.id}`}
              className="text-base font-extrabold text-slate-900"
            >
              ₹{(product.selling_price ?? 0).toLocaleString('en-IN')}
            </span>
            {(product.mrp ?? 0) > (product.selling_price ?? 0) && (
              <span className="text-xs text-slate-400 line-through">
                ₹{(product.mrp ?? 0).toLocaleString('en-IN')}
              </span>
            )}
            {(product.discount_percentage ?? 0) > 0 && (
              <span className="text-xs font-bold text-emerald-600">
                {product.discount_percentage}% off
              </span>
            )}
          </div>

          {/* Available Sizes preview */}
          {sizes.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500 overflow-hidden">
              <span className="text-slate-400">Sizes:</span>
              {sizes.slice(0, 4).map((s) => (
                <span key={s} className="px-1 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                  {s}
                </span>
              ))}
              {sizes.length > 4 && (
                <span className="text-slate-400">+{sizes.length - 4}</span>
              )}
            </div>
          )}

          {/* Mobile Buttons (Always Visible on Mobile) */}
          <div className="grid grid-cols-2 gap-1.5 mt-3 lg:hidden">
            <button
              id={`mobile-quick-add-${product.id}`}
              disabled={isOutOfStock}
              onClick={handleQuickAdd}
              className="py-2 bg-slate-100 active:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{addedAnim ? 'Added!' : 'Add'}</span>
            </button>
            <button
              id={`mobile-quick-buy-${product.id}`}
              disabled={isOutOfStock}
              onClick={handleQuickBuy}
              className="py-2 bg-amber-500 active:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
