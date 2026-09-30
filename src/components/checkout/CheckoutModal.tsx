import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Plus,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Banknote,
  ArrowRight,
  PackageCheck,
  Check,
  Building,
  Smartphone,
  Sparkles,
  AlertCircle,
  Home,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Customer, CustomerAddress, Order, OrderType } from '../../types';
import { db } from '../../services/db';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCustomer?: Customer | null;
  customer?: Customer | null;
  cart?: any;
  onOrderPlaced: (order: Order) => void;
  onOpenLogin?: () => void;
  onRequireLogin?: () => void;
  initialOrderType?: OrderType;
  directProductItem?: {
    product: any;
    size: string;
    color: string;
    quantity: number;
  };
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  currentCustomer: passedCustomer,
  customer,
  cart: passedCart,
  onOrderPlaced,
  onOpenLogin,
  onRequireLogin,
  initialOrderType = 'standard',
  directProductItem,
}) => {
  const currentCustomer = passedCustomer !== undefined ? passedCustomer : (customer !== undefined ? customer : db.getCurrentCustomer());

  const handleOpenLogin = () => {
    if (typeof onOpenLogin === 'function') {
      onOpenLogin();
    } else if (typeof onRequireLogin === 'function') {
      onRequireLogin();
    }
  };

  const addresses = currentCustomer?.addresses || [];
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.is_default)?.id || addresses[0]?.id || ''
  );
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(
    addresses.length === 0
  );

  // Synchronize selected address when customer addresses change
  useEffect(() => {
    if (addresses.length > 0) {
      if (!selectedAddressId || !addresses.some((a) => a.id === selectedAddressId)) {
        const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setIsAddingNewAddress(false);
        }
      }
    } else {
      setIsAddingNewAddress(true);
    }
  }, [addresses.length, currentCustomer?.customer_id]);
  const [paymentOption, setPaymentOption] = useState<'UPI' | 'COD' | 'TRY_AT_HOME'>(
    initialOrderType === 'try_at_home' ? 'TRY_AT_HOME' : 'COD'
  );
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState<Order | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [applyReplacementCredit, setApplyReplacementCredit] = useState(true);

  // New Address / Edit Address Form State
  const [editingAddressIdInCheckout, setEditingAddressIdInCheckout] = useState<string | null>(null);
  const [newName, setNewName] = useState(currentCustomer?.name || '');
  const [newMobile, setNewMobile] = useState(currentCustomer?.mobile || '');
  const [newPincode, setNewPincode] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newType, setNewType] = useState<'HOME' | 'WORK' | 'OTHER'>('HOME');
  const [addressError, setAddressError] = useState('');

  const handleStartEditAddress = (addr: CustomerAddress) => {
    setEditingAddressIdInCheckout(addr.id);
    setNewName(addr.name || '');
    setNewMobile(addr.mobile || '');
    setNewPincode(addr.pincode || '');
    setNewAddress(addr.address || '');
    setNewCity(addr.city || '');
    setNewState(addr.state || '');
    setNewLandmark(addr.landmark || '');
    setNewType(addr.address_type);
    setIsAddingNewAddress(true);
    setAddressError('');
  };

  const handleStartAddNewAddress = () => {
    setEditingAddressIdInCheckout(null);
    setNewName(currentCustomer?.name || '');
    setNewMobile(currentCustomer?.mobile || '');
    setNewPincode('');
    setNewAddress('');
    setNewCity('');
    setNewState('');
    setNewLandmark('');
    setNewType('HOME');
    setIsAddingNewAddress(true);
    setAddressError('');
  };

  if (!isOpen) return null;

  // Items to order (either from direct Buy Now or Cart)
  const cart = passedCart || db.getCart(currentCustomer?.id);
  const settings = db.getSettings();

  const checkoutItems = directProductItem
    ? [
        {
          id: `direct-${Date.now()}`,
          product_id: directProductItem.product.id,
          product_name: directProductItem.product.name,
          brand: directProductItem.product.brand,
          sku: directProductItem.product.sku,
          quantity: directProductItem.quantity,
          price: directProductItem.product.selling_price,
          mrp: directProductItem.product.mrp,
          size: directProductItem.size,
          color: directProductItem.color,
          image_url:
            directProductItem.product.images[0]?.image_url ||
            'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
        },
      ]
    : cart.items.map((i) => ({
        id: i.id,
        product_id: i.product_id,
        product_name: i.name,
        brand: i.brand,
        sku: i.sku,
        quantity: i.quantity,
        price: i.price,
        mrp: i.mrp,
        size: i.size,
        color: i.color,
        image_url: i.image_url,
      }));

  let subtotal = 0;
  let total_mrp = 0;
  checkoutItems.forEach((item) => {
    subtotal += item.price * item.quantity;
    total_mrp += item.mrp * item.quantity;
  });

  const isTryAtHome = paymentOption === 'TRY_AT_HOME';
  const tryAtHomeFee = isTryAtHome
    ? (Number(settings.try_at_home_charge) >= 0 ? Number(settings.try_at_home_charge) : 99)
    : 0;

  // Retrieve replacement credits available for this customer (one-time adjustment)
  const availableReplacementCredits = currentCustomer
    ? db.getCustomerAvailableReplacementCredits(currentCustomer.customer_id)
    : [];
  const totalReplacementCredit = availableReplacementCredits.reduce((sum, c) => sum + c.amount, 0);

  const discount = Math.max(0, total_mrp - subtotal);
  const delivery_charge = subtotal >= settings.free_delivery_threshold || subtotal === 0 ? 0 : settings.delivery_charge;
  const grossPayable = subtotal + delivery_charge + tryAtHomeFee;
  const replacementCreditToApply = (applyReplacementCredit && totalReplacementCredit > 0)
    ? Math.min(totalReplacementCredit, grossPayable)
    : 0;
  const total = Math.max(0, grossPayable - replacementCreditToApply);

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');

    if (!newName.trim() || !newMobile.trim() || !newPincode.trim() || !newAddress.trim()) {
      setAddressError('Please fill in all required delivery address fields.');
      return;
    }

    if (newMobile.replace(/\D/g, '').length !== 10) {
      setAddressError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (newPincode.replace(/\D/g, '').length !== 6) {
      setAddressError('Please enter a valid 6-digit Indian Pincode.');
      return;
    }

    const saved = db.saveCustomerAddress({
      name: newName.trim(),
      mobile: newMobile.trim(),
      pincode: newPincode.trim(),
      address: newAddress.trim(),
      city: newCity.trim(),
      state: newState.trim(),
      landmark: newLandmark.trim(),
      address_type: newType,
      is_default: true,
    }, editingAddressIdInCheckout || undefined);

    if (saved) {
      setSelectedAddressId(saved.id);
      setIsAddingNewAddress(false);
      setEditingAddressIdInCheckout(null);
    }
  };

  const totalItemsCount = checkoutItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

  const handlePlaceOrder = () => {
    setCheckoutError('');

    if (!currentCustomer) {
      onOpenLogin();
      return;
    }

    // Enforce 5-item maximum limit
    if (totalItemsCount > 5) {
      setCheckoutError('Maximum 5 items allowed per order. Please adjust your bag quantity to proceed.');
      return;
    }

    // Resolve or auto-save address
    let activeAddress = currentCustomer.addresses.find((a) => a.id === selectedAddressId);

    // If user was actively typing a new address in the form, auto-save it on order confirmation
    if (!activeAddress && isAddingNewAddress && newName.trim() && newMobile.trim() && newPincode.trim() && newAddress.trim()) {
      const autoSaved = db.saveCustomerAddress({
        name: newName.trim(),
        mobile: newMobile.trim(),
        pincode: newPincode.trim(),
        address: newAddress.trim(),
        city: newCity.trim(),
        state: newState.trim(),
        landmark: newLandmark.trim(),
        address_type: newType,
        is_default: true,
      }, editingAddressIdInCheckout || undefined);
      if (autoSaved) {
        activeAddress = autoSaved;
        setSelectedAddressId(autoSaved.id);
        setIsAddingNewAddress(false);
      }
    }

    if (!activeAddress) {
      activeAddress = currentCustomer.addresses.find((a) => a.is_default) || currentCustomer.addresses[0];
    }

    if (!activeAddress) {
      setCheckoutError('Please enter and save a delivery address to proceed.');
      setIsAddingNewAddress(true);
      return;
    }

    if (checkoutItems.length === 0) {
      setCheckoutError('Your checkout items list is empty.');
      return;
    }

    setIsPlacingOrder(true);

    setTimeout(() => {
      try {
        const isTryAtHome = paymentOption === 'TRY_AT_HOME';
        const effectiveMethod = isTryAtHome || paymentOption === 'COD' ? 'COD' : 'ONLINE_RAZORPAY';

        const order = db.createOrder({
          customer: currentCustomer,
          address: activeAddress!,
          items: checkoutItems,
          payment_method: effectiveMethod,
          payment_status: effectiveMethod === 'ONLINE_RAZORPAY' ? 'PAID' : 'PENDING',
          order_type: isTryAtHome ? 'try_at_home' : 'standard',
          replacement_credit_applied: replacementCreditToApply,
          applied_replacement_credit_ids: replacementCreditToApply > 0 ? availableReplacementCredits.map((c) => c.return_id) : [],
        });

        setIsPlacingOrder(false);
        setOrderPlacedSuccess(order);
        onOrderPlaced(order);

        // Trigger Celebration Confetti
        try {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // Safe fallback
        }
      } catch (err: any) {
        setIsPlacingOrder(false);
        setCheckoutError(err.message || 'Failed to place order. Please try again.');
      }
    }, 800);
  };

  return (
    <div
      id="checkout-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
    >
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight">TRYatHOME</span>
            <span className="text-xs bg-indigo-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Checkout
            </span>
          </div>
          <button
            id="checkout-close-btn"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
          {orderPlacedSuccess ? (
            /* Order Placed Success View */
            <div id="checkout-success-view" className="py-8 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Order Confirmed
              </span>

              <h2 className="text-2xl font-black text-slate-900 mt-2">Thank you for your order!</h2>
              <p className="text-xs text-slate-500 mt-1">
                We’ve received your order and are preparing it for dispatch.
              </p>

              {/* Order ID and Details Card */}
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Order ID:</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {orderPlacedSuccess.order_id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Customer ID:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {orderPlacedSuccess.customer_id}
                  </span>
                </div>
                {orderPlacedSuccess.order_type === 'try_at_home' && (
                  <div className="flex justify-between items-center bg-indigo-50/80 px-2 py-1 rounded-md border border-indigo-100">
                    <span className="text-indigo-800 font-bold flex items-center gap-1">
                      <Home className="w-3.5 h-3.5 text-indigo-600" /> Order Type:
                    </span>
                    <span className="font-extrabold text-indigo-900 bg-white px-2 py-0.5 rounded text-[11px] shadow-2xs">
                      Try at Home
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-bold text-slate-800">
                    {orderPlacedSuccess.payment_method === 'COD'
                      ? 'Cash on Delivery (COD)'
                      : 'Online Prepaid (Razorpay)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Total Amount:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    ₹{(orderPlacedSuccess.total ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Delivery Address:</span>
                  <p className="text-slate-800 font-medium">
                    {orderPlacedSuccess.address.name}, {orderPlacedSuccess.address.address},{' '}
                    {orderPlacedSuccess.address.city}, {orderPlacedSuccess.address.state} -{' '}
                    {orderPlacedSuccess.address.pincode}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-center">
                <button
                  id="success-continue-shopping-btn"
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <div className="space-y-4">
              {checkoutError && (
                <div
                  id="checkout-error-banner"
                  className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2 animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Address & Payment */}
              <div className="lg:col-span-7 space-y-6">
                {/* Step 1: Customer & Address */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        1
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                        Delivery Address
                      </h3>
                    </div>
                    {currentCustomer && !isAddingNewAddress && (
                      <button
                        id="add-new-address-toggle-btn"
                        onClick={handleStartAddNewAddress}
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Address</span>
                      </button>
                    )}
                  </div>

                  {!currentCustomer ? (
                    <div className="p-4 bg-white rounded-lg border border-slate-200 text-center">
                      <p className="text-xs text-slate-600 mb-3">
                        Please sign in with your mobile number to load saved addresses.
                      </p>
                      <button
                        id="checkout-login-trigger-btn"
                        onClick={handleOpenLogin}
                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-indigo-700"
                      >
                        Login with OTP
                      </button>
                    </div>
                  ) : isAddingNewAddress ? (
                    /* New Address Form */
                    <form onSubmit={handleSaveAddress} className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                      {addressError && (
                        <div className="p-2 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200 font-semibold">
                          {addressError}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Aarav Sharma"
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            10-Digit Mobile *
                          </label>
                          <input
                            type="tel"
                            maxLength={10}
                            value={newMobile}
                            onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, ''))}
                            placeholder="9876543210"
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Pincode *
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={newPincode}
                            onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, ''))}
                            placeholder="560001"
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            value={newCity}
                            onChange={(e) => setNewCity(e.target.value)}
                            placeholder="Bengaluru"
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          House No., Building, Street Address *
                        </label>
                        <input
                          type="text"
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          placeholder="Flat 402, Sunshine Heights, MG Road"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            State *
                          </label>
                          <input
                            type="text"
                            value={newState}
                            onChange={(e) => setNewState(e.target.value)}
                            placeholder="Karnataka"
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Address Type
                          </label>
                          <div className="flex gap-2">
                            {(['HOME', 'WORK', 'OTHER'] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setNewType(t)}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${
                                  newType === t
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        {addresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingNewAddress(false);
                              setEditingAddressIdInCheckout(null);
                            }}
                            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          id="save-address-btn"
                          type="submit"
                          className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 cursor-pointer"
                        >
                          {editingAddressIdInCheckout ? 'Update & Use Address' : 'Save & Use This Address'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Existing Saved Addresses */
                    <div className="space-y-2">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            id={`address-card-${addr.id}`}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-3 bg-white rounded-lg border-2 cursor-pointer transition-all flex items-start justify-between ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/20'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="radio"
                                checked={isSelected}
                                onChange={() => setSelectedAddressId(addr.id)}
                                className="mt-1 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div className="text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-900">
                                    {addr.name}
                                  </span>
                                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded uppercase">
                                    {addr.address_type}
                                  </span>
                                </div>
                                <p className="text-slate-600 mt-1">
                                  {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                                </p>
                                <p className="text-slate-500 mt-0.5">
                                  Phone: +91 {addr.mobile}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditAddress(addr);
                              }}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 shrink-0 px-2 py-1 bg-indigo-50/50 hover:bg-indigo-50 rounded-md border border-indigo-100 transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Step 2: Payment Method */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      2
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                      Payment Options
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {/* Option 1: UPI */}
                    <label
                      id="payment-option-upi-label"
                      className={`p-3 bg-white rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                        paymentOption === 'UPI'
                          ? 'border-indigo-600 bg-indigo-50/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={paymentOption === 'UPI'}
                          onChange={() => setPaymentOption('UPI')}
                          className="w-4 h-4 text-indigo-600 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Smartphone className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-bold text-slate-900">
                              UPI
                            </span>
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                              Instant
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Pay via Google Pay, PhonePe, Paytm, BHIM UPI or Cards (Razorpay).
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Option 2: Cash on Delivery */}
                    <label
                      id="payment-option-cod-label"
                      className={`p-3 bg-white rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                        paymentOption === 'COD'
                          ? 'border-indigo-600 bg-indigo-50/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={paymentOption === 'COD'}
                          onChange={() => setPaymentOption('COD')}
                          className="w-4 h-4 text-indigo-600 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Banknote className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-slate-900">
                              Cash on Delivery
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                              Verified
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Pay in cash or UPI QR at your doorstep upon delivery.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Option 3: Try at Home */}
                    <label
                      id="payment-option-try-at-home-label"
                      className={`p-3 bg-white rounded-xl border-2 flex items-start justify-between cursor-pointer transition-all ${
                        paymentOption === 'TRY_AT_HOME'
                          ? 'border-indigo-600 bg-indigo-50/25 ring-1 ring-indigo-600/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={paymentOption === 'TRY_AT_HOME'}
                          onChange={() => setPaymentOption('TRY_AT_HOME')}
                          className="w-4 h-4 text-indigo-600 cursor-pointer mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Home className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-bold text-slate-900">
                              Try at Home
                            </span>
                            <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                              Try at Home + COD
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Try outfits comfortably at your doorstep. Cash on Delivery is automatically applied so you only pay for what you keep.
                          </p>

                          {paymentOption === 'TRY_AT_HOME' && (
                            <div className="mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>✓ Try at Home selected • ✓ Cash on Delivery automatically applied</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Items Summary & Total */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                      Order Summary
                    </h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      totalItemsCount > 5 ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {totalItemsCount}/5 Max Items
                    </span>
                  </div>

                  {/* Items Mini List */}
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-200 pr-1 mb-4">
                    {checkoutItems.map((item) => (
                      <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                            alt={item.product_name}
                            className="w-10 h-12 rounded object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-800 line-clamp-1 max-w-[170px]">
                              {item.product_name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Size: {item.size} • Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">
                          ₹{((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Price Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-200 pt-3">
                    <div className="flex justify-between">
                      <span>Total MRP</span>
                      <span className="text-slate-400 line-through">
                        ₹{(total_mrp ?? 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {(discount ?? 0) > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Discount on MRP</span>
                        <span>- ₹{(discount ?? 0).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>
                        {delivery_charge === 0 ? (
                          <span className="text-emerald-700 font-bold">FREE</span>
                        ) : (
                          `₹${delivery_charge}`
                        )}
                      </span>
                    </div>

                    {isTryAtHome && tryAtHomeFee > 0 && (
                      <div className="flex justify-between text-indigo-700 font-bold">
                        <span>Try at Home Fee (Non-refundable):</span>
                        <span>+ ₹{tryAtHomeFee.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {/* Replacement Credit Adjustment (One-Time) */}
                    {totalReplacementCredit > 0 && (
                      <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg space-y-1.5 my-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-1.5 font-bold text-purple-900 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={applyReplacementCredit}
                              onChange={(e) => setApplyReplacementCredit(e.target.checked)}
                              className="rounded text-purple-700 focus:ring-purple-500"
                            />
                            <span>Apply Replacement Credit</span>
                          </label>
                          <span className="font-mono font-bold text-purple-700">
                            ₹{totalReplacementCredit.toLocaleString('en-IN')}
                          </span>
                        </div>
                        {applyReplacementCredit && replacementCreditToApply > 0 && (
                          <div className="flex justify-between text-purple-800 font-bold text-xs pt-1 border-t border-purple-200">
                            <span>One-Time Adjustment:</span>
                            <span>- ₹{replacementCreditToApply.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <p className="text-[10px] text-purple-700 leading-tight">
                          ✓ Adjusts against any order type (Cash on Delivery, Prepaid, or Try at Home).
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-300 flex justify-between text-base font-black text-slate-900">
                      <span>Total Payable</span>
                      <span className="text-indigo-700">₹{(total ?? 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Place Order CTA */}
                <button
                  id="confirm-place-order-btn"
                  disabled={isPlacingOrder || !currentCustomer || totalItemsCount > 5}
                  onClick={handlePlaceOrder}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold rounded-xl text-base shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  {isPlacingOrder ? (
                    <span>Confirming Order...</span>
                  ) : totalItemsCount > 5 ? (
                    <span>Order Limit Exceeded (Max 5 items)</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>
                        {paymentOption === 'TRY_AT_HOME'
                          ? `PLACE TRY AT HOME ORDER • ₹${(total ?? 0).toLocaleString('en-IN')} (COD)`
                          : paymentOption === 'COD'
                          ? `PLACE ORDER • ₹${(total ?? 0).toLocaleString('en-IN')} (COD)`
                          : `PROCEED TO PAY • ₹${(total ?? 0).toLocaleString('en-IN')} (UPI)`}
                      </span>
                    </>
                  )}
                </button>

                <div className="text-center text-[11px] text-slate-400">
                  <span>TRYatHOME 100% Purchase Protection & Secure Indian Checkout</span>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};
