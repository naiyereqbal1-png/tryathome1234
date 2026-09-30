import React, { useState } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  Zap,
  Truck,
  RotateCcw,
  ShieldCheck,
  Heart,
  ChevronRight,
  Check,
  HelpCircle,
  MapPin,
  Ruler,
} from 'lucide-react';
import { Product } from '../../types';
import { ProductReviewsSection } from './ProductReviewsSection';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  onBuyNow: (product: Product, size: string, color: string, quantity: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onOpenCustomerLogin?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
  isWishlisted,
  onToggleWishlist,
  onOpenCustomerLogin,
}) => {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Default');
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('560001');
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  React.useEffect(() => {
    if (product) {
      const s = product.sizes || [];
      const c = product.colors || [];
      setSelectedImageIdx(0);
      setSelectedSize(s[0] || 'M');
      setSelectedColor(c[0] || 'Default');
      setQuantity(1);
    }
  }, [product?.id]);

  if (!isOpen || !product) return null;

  const sizes = product.sizes || [];
  const colors = product.colors || [];

  const images = (product.images && product.images.length > 0)
    ? product.images
    : [
        {
          id: 'def-img',
          image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
          sort_order: 1,
          is_primary: true,
          caption: 'Front View',
        },
      ];

  const currentImage = images[selectedImageIdx] || images[0];

  const handleAddToCart = () => {
    onAddToCart(product, selectedSize, selectedColor, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleBuyNow = () => {
    onBuyNow(product, selectedSize, selectedColor, quantity);
    onClose();
  };

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  return (
    <div
      id="product-detail-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in"
    >
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[95vh] flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Garments</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-800">{product.category_name}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-400 truncate max-w-[150px]">{product.sku}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="detail-wishlist-btn"
              onClick={() => onToggleWishlist(product)}
              className={`p-2 rounded-full border transition-colors ${
                isWishlisted
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-rose-600'
              }`}
              title="Add to Wishlist"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
            </button>
            <button
              id="detail-close-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 md:p-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10">
            {/* Left Column: Multi-Image Gallery */}
            <div className="md:col-span-6 flex flex-col-reverse sm:flex-row gap-3">
              {/* Thumbnails (4-5 images) */}
              <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-[480px] scrollbar-none shrink-0">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    id={`detail-thumbnail-${idx}`}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImageIdx === idx
                        ? 'border-indigo-600 shadow-xs'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                      alt={img.caption || `View ${idx + 1}`}
                      className="w-full h-full object-cover object-center"
                    />
                  </button>
                ))}
              </div>

              {/* Main Image Stage */}
              <div className="flex-1 relative bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center min-h-[380px] max-h-[520px]">
                <img
                  src={currentImage?.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                  alt={product.name}
                  onClick={() => setIsZoomed(!isZoomed)}
                  className={`w-full h-full object-cover object-center cursor-zoom-in transition-transform duration-300 ${
                    isZoomed ? 'scale-150 cursor-zoom-out' : 'hover:scale-105'
                  }`}
                />

                {currentImage.caption && (
                  <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                    {currentImage.caption}
                  </span>
                )}

                {product.discount_percentage > 0 && (
                  <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-md shadow-sm">
                    {product.discount_percentage}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Right Column: Product Details & Controls */}
            <div className="md:col-span-6 flex flex-col">
              {/* Brand & Title */}
              <div>
                <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                  {product.brand}
                </span>
                <h1
                  id="detail-product-title"
                  className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 leading-snug"
                >
                  {product.name}
                </h1>

                {/* Rating Badge */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5 bg-emerald-700 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                    <span>{product.rating}</span>
                    <Star className="w-3 h-3 fill-white" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {product.rating_count} Ratings & Verified Reviews
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs text-slate-500 font-mono">SKU: {product.sku}</span>
                </div>
              </div>

              {/* Price Row */}
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-baseline gap-3">
                  <span
                    id="detail-product-price"
                    className="text-2xl sm:text-3xl font-black text-slate-900"
                  >
                    ₹{(product.selling_price ?? 0).toLocaleString('en-IN')}
                  </span>
                  {(product.mrp ?? 0) > (product.selling_price ?? 0) && (
                    <span className="text-sm text-slate-400 line-through">
                      ₹{(product.mrp ?? 0).toLocaleString('en-IN')}
                    </span>
                  )}
                  {(product.discount_percentage ?? 0) > 0 && (
                    <span className="text-sm font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {product.discount_percentage}% OFF
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Inclusive of all taxes • Free delivery on orders above ₹499
                </p>

                {/* Stock indicator */}
                <div className="mt-2 flex items-center gap-2">
                  {isOutOfStock ? (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      Currently Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-amber-500 text-amber-500" /> Only {product.stock} units left in stock!
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> In Stock & Ready to Ship
                    </span>
                  )}
                </div>
              </div>

              {/* Select Color */}
              {product.colors && product.colors.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Select Color: <span className="text-indigo-600">{selectedColor}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        id={`select-color-${c}`}
                        onClick={() => setSelectedColor(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          selectedColor === c
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Select Size */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Select Size: <span className="text-indigo-600">{selectedSize}</span>
                  </span>
                  <button
                    id="size-chart-btn"
                    onClick={() => setShowSizeChart(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Size Guide</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      id={`select-size-${sz}`}
                      onClick={() => setSelectedSize(sz)}
                      className={`min-w-[44px] h-10 px-3 rounded-lg text-xs font-extrabold border transition-all ${
                        selectedSize === sz
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-300 bg-white text-slate-800 hover:border-slate-500'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-5 flex items-center gap-4">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Quantity:
                </span>
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                  <button
                    id="qty-decrease-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 text-sm font-bold"
                  >
                    -
                  </button>
                  <span id="qty-value" className="px-4 py-1.5 text-xs font-bold text-slate-900 bg-white">
                    {quantity}
                  </span>
                  <button
                    id="qty-increase-btn"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 text-sm font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Delivery Pincode Check */}
              <div className="mt-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block mb-1.5">
                  Check Delivery & Services
                </span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="detail-pincode-input"
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => {
                        setPincode(e.target.value.replace(/\D/g, ''));
                        setPincodeChecked(false);
                      }}
                      placeholder="Enter 6-digit Pincode"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-hidden focus:border-indigo-600"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  <button
                    id="detail-pincode-check-btn"
                    onClick={() => setPincodeChecked(true)}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
                  >
                    Check
                  </button>
                </div>

                {pincodeChecked && (
                  <div className="mt-2 text-xs space-y-1 text-slate-700 animate-in fade-in">
                    <p className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <Truck className="w-3.5 h-3.5" /> Express Delivery by{' '}
                      {new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                      <Check className="w-3 h-3 text-emerald-600" /> Cash on Delivery Available
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                      <RotateCcw className="w-3 h-3 text-indigo-600" /> 7 Days Easy Return & Free Exchange
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons (Desktop) */}
              <div className="hidden sm:grid grid-cols-2 gap-3 mt-6">
                <button
                  id="detail-add-to-cart-btn"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className="py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-extrabold rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  {addedToast ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Item Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-amber-400" />
                      <span>ADD TO CART</span>
                    </>
                  )}
                </button>
                <button
                  id="detail-buy-now-btn"
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                  className="py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 text-slate-950 font-black rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>BUY NOW</span>
                </button>
              </div>

              {/* Product Specifications & Description */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Product Details
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {product.description}
                </p>

                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mt-5 mb-2.5">
                  Specifications
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(product.specifications || {}).map(([key, val]) => (
                    <div key={key} className="p-2.5 bg-slate-50 rounded-lg">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {key}
                      </span>
                      <span className="font-semibold text-slate-800">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
                <div className="p-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                  <span className="text-[11px] font-bold text-slate-800 block">100% Genuine</span>
                  <span className="text-[10px] text-slate-400">Direct from TRYatHOME</span>
                </div>
                <div className="p-2">
                  <RotateCcw className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                  <span className="text-[11px] font-bold text-slate-800 block">7 Days Return</span>
                  <span className="text-[10px] text-slate-400">Hassle-free exchange</span>
                </div>
                <div className="p-2">
                  <Truck className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                  <span className="text-[11px] font-bold text-slate-800 block">Fast Dispatch</span>
                  <span className="text-[10px] text-slate-400">Within 24 Hours</span>
                </div>
              </div>

              {/* Customer Ratings & Reviews */}
              <ProductReviewsSection
                product={product}
                onOpenCustomerLogin={onOpenCustomerLogin}
              />
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bottom CTA Bar */}
        <div className="sm:hidden sticky bottom-0 inset-x-0 p-3 bg-white border-t border-slate-200 shadow-xl grid grid-cols-2 gap-2 z-20">
          <button
            id="mobile-detail-add-cart-btn"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className="py-3 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>{addedToast ? 'Added!' : 'Add to Cart'}</span>
          </button>
          <button
            id="mobile-detail-buy-now-btn"
            disabled={isOutOfStock}
            onClick={handleBuyNow}
            className="py-3 bg-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>

      {/* Size Chart Modal */}
      {showSizeChart && (
        <div
          id="size-chart-modal"
          className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-extrabold text-slate-900 text-base">Standard Garment Size Guide</h3>
              <button
                onClick={() => setShowSizeChart(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5">Size</th>
                    <th className="p-2.5">Chest (in)</th>
                    <th className="p-2.5">Waist (in)</th>
                    <th className="p-2.5">Length (in)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-bold">S / 30</td>
                    <td className="p-2.5">38</td>
                    <td className="p-2.5">30</td>
                    <td className="p-2.5">27</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">M / 32</td>
                    <td className="p-2.5">40</td>
                    <td className="p-2.5">32</td>
                    <td className="p-2.5">28</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">L / 34</td>
                    <td className="p-2.5">42</td>
                    <td className="p-2.5">34</td>
                    <td className="p-2.5">29</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">XL / 36</td>
                    <td className="p-2.5">44</td>
                    <td className="p-2.5">36</td>
                    <td className="p-2.5">30</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">XXL / 38</td>
                    <td className="p-2.5">46</td>
                    <td className="p-2.5">38</td>
                    <td className="p-2.5">31</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 mt-4">
              Measurements are in inches. If you are between two sizes, choose the larger size for a relaxed fit.
            </p>
            <button
              onClick={() => setShowSizeChart(false)}
              className="mt-5 w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
