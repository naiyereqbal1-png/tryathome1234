import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Tag, Sparkles, AlertCircle } from 'lucide-react';
import { Customer } from '../../types';
import { db } from '../../services/db';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentCustomer?: Customer | null;
  customer?: Customer | null;
  cart?: any;
  onProceedCheckout?: () => void;
  onProceedToCheckout?: () => void;
  onShopMore?: () => void;
  onUpdateQuantity?: (itemId: string, newQty: number) => void;
  onRemoveItem?: (itemId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  currentCustomer,
  customer,
  cart: passedCart,
  onProceedCheckout,
  onProceedToCheckout,
  onShopMore,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const activeCustomer = currentCustomer !== undefined ? currentCustomer : (customer !== undefined ? customer : db.getCurrentCustomer());
  const cart = passedCart || db.getCart(activeCustomer?.id);
  const settings = db.getSettings();

  const cartItems = cart?.items || [];
  const totalQuantity = cartItems.reduce((acc: number, curr: any) => acc + (Number(curr.quantity) || 1), 0);

  const handleUpdateQty = (itemId: string, newQty: number) => {
    setErrorMessage('');
    if (typeof onUpdateQuantity === 'function') {
      onUpdateQuantity(itemId, newQty);
      return;
    }
    const res = db.updateCartQuantity(itemId, newQty, activeCustomer?.id);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleRemove = (itemId: string) => {
    setErrorMessage('');
    if (typeof onRemoveItem === 'function') {
      onRemoveItem(itemId);
      return;
    }
    db.removeFromCart(itemId, activeCustomer?.id);
  };

  const handleProceed = () => {
    onClose();
    if (typeof onProceedCheckout === 'function') {
      onProceedCheckout();
    } else if (typeof onProceedToCheckout === 'function') {
      onProceedToCheckout();
    }
  };

  const handleShopMoreClick = () => {
    onClose();
    if (typeof onShopMore === 'function') {
      onShopMore();
    }
  };

  const amountNeededForFreeDelivery = Math.max(0, (settings.free_delivery_threshold || 499) - (cart?.subtotal || 0));

  return (
    <div
      id="cart-drawer-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in"
    >
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            <h2 className="font-extrabold text-slate-900 text-base">Shopping Bag</h2>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
              {totalQuantity}/5 Items
            </span>
          </div>
          <button
            id="cart-drawer-close-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Item Limit Notice Banner */}
        <div className="bg-slate-100 px-4 py-1.5 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
          <span>Limit: <strong>Maximum 5 items</strong> per order</span>
          <span className={`font-bold ${totalQuantity >= 5 ? 'text-amber-600' : 'text-slate-500'}`}>
            {totalQuantity >= 5 ? 'Bag is Full (5/5)' : `${5 - totalQuantity} item slot${5 - totalQuantity === 1 ? '' : 's'} left`}
          </span>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs text-rose-700 font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Free Delivery Bar */}
        {cartItems.length > 0 && (
          <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            {amountNeededForFreeDelivery > 0 ? (
              <span>
                Add garments worth{' '}
                <strong className="text-slate-900">₹{amountNeededForFreeDelivery}</strong> more for{' '}
                <strong className="text-emerald-700">FREE Delivery</strong>!
              </span>
            ) : (
              <span className="text-emerald-700 font-bold">
                🎉 Congratulations! You have unlocked FREE Delivery!
              </span>
            )}
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {cartItems.length === 0 ? (
            <div id="cart-empty-state" className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">Your cart is empty</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5">
                Explore stylish shirts, jeans, kurtis, tees and kids wear curated for you.
              </p>
              <button
                id="cart-shop-now-btn"
                onClick={handleShopMoreClick}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Shop Popular Garments
              </button>
            </div>
          ) : (
            cartItems.map((item: any) => (
              <div key={item.id} id={`cart-item-${item.id}`} className="py-3.5 flex gap-3">
                {/* Thumbnail */}
                <div className="w-20 h-24 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                    alt={item.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {item.brand}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</h4>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                        Size: {item.size}
                      </span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                        {item.color}
                      </span>
                    </div>
                  </div>

                  {/* Price and Quantity */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString('en-IN')}
                      </span>
                      {(item.mrp ?? 0) > (item.price ?? 0) && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ₹{((item.mrp ?? 0) * (item.quantity ?? 1)).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50 text-xs">
                        <button
                          id={`cart-qty-dec-${item.id}`}
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 font-bold text-slate-900">{item.quantity}</span>
                        <button
                          id={`cart-qty-inc-${item.id}`}
                          disabled={totalQuantity >= 5}
                          onClick={() => {
                            if (totalQuantity >= 5) {
                              setErrorMessage('Maximum 5 items allowed per order.');
                              setTimeout(() => setErrorMessage(''), 3000);
                              return;
                            }
                            handleUpdateQty(item.id, item.quantity + 1);
                          }}
                          className={`px-2 py-0.5 font-bold ${
                            totalQuantity >= 5
                              ? 'text-slate-300 bg-slate-100 cursor-not-allowed'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                          title={totalQuantity >= 5 ? 'Order limit reached (max 5 items)' : 'Increase quantity'}
                        >
                          +
                        </button>
                      </div>

                      <button
                        id={`cart-remove-btn-${item.id}`}
                        onClick={() => handleRemove(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Price Breakdown & Checkout Button */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">
                  ₹{(cart?.subtotal ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
              {(cart?.total_discount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Product Discount</span>
                  <span className="font-bold">
                    - ₹{(cart?.total_discount ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>
                  {(cart?.delivery_charge ?? 0) === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    `₹${cart?.delivery_charge}`
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Total Amount</span>
                <span className="text-base text-indigo-700">
                  ₹{(cart?.total ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              id="proceed-to-checkout-btn"
              onClick={handleProceed}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe & Secure Indian Payments with COD Guarantee</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
