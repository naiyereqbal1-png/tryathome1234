import React, { useState } from 'react';
import {
  User,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Phone,
  Mail,
  Shield,
  XCircle,
  RotateCcw,
  Home,
  FileText,
  Lock,
  RefreshCw,
  Star,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { Customer, Order, ProductReview } from '../../types';
import { db } from '../../services/db';
import { OrderInvoiceModal } from '../common/OrderInvoiceModal';
import { TryAtHomeCountdown } from '../order/TryAtHomeCountdown';
import { WriteReviewModal } from '../product/WriteReviewModal';

interface CustomerProfileViewProps {
  customer: Customer;
  onBack: () => void;
  onSelectOrder?: (order: Order) => void;
  initialTab?: 'ORDERS' | 'PROFILE' | 'ADDRESSES' | 'REVIEWS';
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  customer: propCustomer,
  onBack,
  initialTab = 'ORDERS',
}) => {
  const [localCustomer, setLocalCustomer] = useState<Customer>(propCustomer);
  const customer = localCustomer;

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'PROFILE' | 'ADDRESSES' | 'REVIEWS'>(initialTab);
  const [orders, setOrders] = useState<Order[]>(db.getCustomerOrders(customer.customer_id));
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Reviews State
  const [customerReviews, setCustomerReviews] = useState<ProductReview[]>(
    db.getCustomerReviews(customer.customer_id || customer.id)
  );
  const [reviewModalState, setReviewModalState] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
    productImage?: string;
    orderId: string;
    orderItemId?: string;
    existingReview?: ProductReview | null;
  }>({
    isOpen: false,
    productId: '',
    productName: '',
    orderId: '',
    existingReview: null,
  });

  // Synchronize orders and customer details when return or delivery status changes across the app
  React.useEffect(() => {
    const handleDataChanged = () => {
      setOrders(db.getCustomerOrders(customer.customer_id));
      setCustomerReviews(db.getCustomerReviews(customer.customer_id || customer.id));
      const current = db.getCurrentCustomer();
      if (current && current.customer_id === customer.customer_id) {
        setLocalCustomer(current);
      } else {
        const found = db.getCustomers().find((c) => c.customer_id === customer.customer_id);
        if (found) setLocalCustomer(found);
      }
      if (selectedOrder) {
        const refreshed = db.getOrderById(selectedOrder.order_id);
        if (refreshed) setSelectedOrder(refreshed);
      }
    };
    window.addEventListener('style1_data_changed', handleDataChanged);
    return () => window.removeEventListener('style1_data_changed', handleDataChanged);
  }, [customer.customer_id, selectedOrder]);

  // Item cancellation modal state
  const [itemCancelTarget, setItemCancelTarget] = useState<{
    orderId: string;
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
  } | null>(null);
  const [cancelReason, setCancelReason] = useState('Changed mind / Found better price');
  const [customReason, setCustomReason] = useState('');

  // Item return modal state
  const [itemReturnTarget, setItemReturnTarget] = useState<{
    orderId: string;
    itemId: string;
    itemName: string;
    itemImage?: string;
    size: string;
    color: string;
    quantity: number;
    maxQuantity: number;
    price: number;
  } | null>(null);
  const [returnReason, setReturnReason] = useState('Size/Fit issue');
  const [customReturnReason, setCustomReturnReason] = useState('');
  const [returnQty, setReturnQty] = useState(1);
  const [returnError, setReturnError] = useState('');
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');

  // Item Replacement Modal State (Exclusively for Cash on Delivery orders)
  const [itemReplaceTarget, setItemReplaceTarget] = useState<{
    orderId: string;
    itemId: string;
    itemName: string;
    itemImage?: string;
    size: string;
    color: string;
    quantity: number;
    maxQuantity: number;
    price: number;
  } | null>(null);
  const [replaceQty, setReplaceQty] = useState(1);
  const [replaceReason, setReplaceReason] = useState('Size/Fit issue (Need different size)');
  const [customReplaceReason, setCustomReplaceReason] = useState('');
  const [replacementSize, setReplacementSize] = useState('M');
  const [replacementColor, setReplacementColor] = useState('Same Color');
  const [replaceError, setReplaceError] = useState('');
  const [replaceSuccessMsg, setReplaceSuccessMsg] = useState('');

  // Profile Edit
  const [editName, setEditName] = useState(customer.name);
  const [editEmail, setEditEmail] = useState(customer.email || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isAddressSaving, setIsAddressSaving] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaving(true);
    setProfileMsg('');
    try {
      const updated = await db.updateCustomerProfileAsync({
        name: editName,
        email: editEmail,
      });
      if (updated) {
        setLocalCustomer(updated);
      }
      setProfileMsg('Profile updated successfully to database!');
    } catch (err: any) {
      console.error("[Customer Profile] Update error:", err);
      setProfileMsg('Error: ' + (err.message || 'database error'));
    } finally {
      setIsProfileSaving(false);
      setTimeout(() => setProfileMsg(''), 3500);
    }
  };

  // Saved Addresses State & Handlers
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formType, setFormType] = useState<'HOME' | 'WORK' | 'OTHER'>('HOME');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState('');

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setFormName(customer.name || '');
    setFormMobile(customer.mobile || '');
    setFormPincode('');
    setFormAddress('');
    setFormCity('');
    setFormState('');
    setFormLandmark('');
    setFormType('HOME');
    setFormIsDefault((customer.addresses || []).length === 0);
    setAddressFormOpen(true);
    setAddressError('');
    setAddressSuccess('');
  };

  const handleEditClick = (addr: any) => {
    setEditingAddressId(addr.id);
    setFormName(addr.name || '');
    setFormMobile(addr.mobile || '');
    setFormPincode(addr.pincode || '');
    setFormAddress(addr.address || '');
    setFormCity(addr.city || '');
    setFormState(addr.state || '');
    setFormLandmark(addr.landmark || '');
    setFormType(addr.address_type);
    setFormIsDefault(addr.is_default);
    setAddressFormOpen(true);
    setAddressError('');
    setAddressSuccess('');
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setIsAddressSaving(true);
    try {
      await db.deleteCustomerAddressAsync(id, customer.id || customer.customer_id);
      const updatedCust = db.getCustomers().find(c => c.id === customer.id || c.customer_id === customer.customer_id) || db.getCurrentCustomer();
      if (updatedCust) setLocalCustomer(updatedCust);
    } catch (err: any) {
      console.error("[Customer Address] Delete error:", err);
      alert('Failed to delete address: ' + err.message);
    } finally {
      setIsAddressSaving(false);
    }
  };

  const handleSetDefaultAddress = async (addr: any) => {
    setIsAddressSaving(true);
    try {
      await db.saveCustomerAddressAsync({
        name: addr.name,
        mobile: addr.mobile,
        pincode: addr.pincode,
        address: addr.address,
        city: addr.city,
        state: addr.state,
        landmark: addr.landmark || '',
        address_type: addr.address_type,
        is_default: true,
      }, addr.id, customer.id || customer.customer_id);
      const updatedCust = db.getCustomers().find(c => c.id === customer.id || c.customer_id === customer.customer_id) || db.getCurrentCustomer();
      if (updatedCust) setLocalCustomer(updatedCust);
    } catch (err: any) {
      console.error("[Customer Address] Set default error:", err);
      alert('Failed to update default address: ' + err.message);
    } finally {
      setIsAddressSaving(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');
    setAddressSuccess('');

    if (!formName.trim()) {
      setAddressError('Please enter a name.');
      return;
    }
    if (!/^\d{10}$/.test(formMobile.trim())) {
      setAddressError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!/^\d{6}$/.test(formPincode.trim())) {
      setAddressError('Please enter a valid 6-digit Pincode.');
      return;
    }
    const cleanPin = formPincode.trim();
    if (!db.isPincodeServiceable(cleanPin)) {
      const allowedPins = db.getServiceablePincodes().join(', ');
      setAddressError(`❌ Delivery is NOT available for pincode ${cleanPin}. Please enter an allowed delivery pincode (Allowed: ${allowedPins}).`);
      return;
    }
    if (!formAddress.trim()) {
      setAddressError('Please enter the complete address.');
      return;
    }
    if (!formCity.trim()) {
      setAddressError('Please enter the city.');
      return;
    }
    if (!formState.trim()) {
      setAddressError('Please enter the state.');
      return;
    }

    setIsAddressSaving(true);

    try {
      const saved = await db.saveCustomerAddressAsync({
        name: formName.trim(),
        mobile: formMobile.trim(),
        pincode: formPincode.trim(),
        address: formAddress.trim(),
        city: formCity.trim(),
        state: formState.trim(),
        landmark: formLandmark.trim(),
        address_type: formType,
        is_default: formIsDefault,
      }, editingAddressId || undefined, customer.id || customer.customer_id);

      if (saved) {
        setAddressSuccess(editingAddressId ? 'Address updated successfully in database!' : 'Address added successfully to database!');
        setAddressFormOpen(false);
        setEditingAddressId(null);
        const updatedCust = db.getCustomers().find(c => c.id === customer.id || c.customer_id === customer.customer_id) || db.getCurrentCustomer();
        if (updatedCust) setLocalCustomer(updatedCust);
        setTimeout(() => setAddressSuccess(''), 3500);
      } else {
        setAddressError('Failed to save address. Please try again.');
      }
    } catch (err: any) {
      console.error("[Customer Address] Save error:", err);
      setAddressError(err.message || 'Failed to save address. Please try again.');
    } finally {
      setIsAddressSaving(false);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm('Are you sure you want to cancel this entire order?')) {
      db.updateOrderStatus(orderId, 'Cancelled', 'Customer', 'Entire order cancelled by customer');
      setOrders(db.getCustomerOrders(customer.customer_id));
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.order_id === orderId)) {
        setSelectedOrder(db.getOrderById(orderId) || null);
      }
    }
  };

  const handleConfirmItemCancellation = () => {
    if (!itemCancelTarget) return;
    const finalReason = cancelReason === 'Other' ? customReason || 'Other' : cancelReason;
    db.cancelOrderItem(itemCancelTarget.orderId, itemCancelTarget.itemId, finalReason, 'Customer');
    setOrders(db.getCustomerOrders(customer.customer_id));
    if (selectedOrder && (selectedOrder.id === itemCancelTarget.orderId || selectedOrder.order_id === itemCancelTarget.orderId)) {
      setSelectedOrder(db.getOrderById(itemCancelTarget.orderId) || null);
    }
    setItemCancelTarget(null);
    setCustomReason('');
  };

  const handleConfirmItemReturn = () => {
    if (!itemReturnTarget) return;
    const finalReason = returnReason === 'Other' ? customReturnReason || 'Other reason' : returnReason;
    try {
      db.requestProductReturn({
        order_id: itemReturnTarget.orderId,
        order_item_id: itemReturnTarget.itemId,
        reason: finalReason,
        quantity: returnQty,
        request_type: 'return',
      });
      setOrders(db.getCustomerOrders(customer.customer_id));
      if (selectedOrder && (selectedOrder.id === itemReturnTarget.orderId || selectedOrder.order_id === itemReturnTarget.orderId)) {
        setSelectedOrder(db.getOrderById(itemReturnTarget.orderId) || null);
      }
      setItemReturnTarget(null);
      setReturnSuccessMsg('Return item request placed successfully! Assigned to delivery partner for doorstep pickup.');
      setTimeout(() => setReturnSuccessMsg(''), 5000);
    } catch (err: any) {
      setReturnError(err.message || 'Failed to request return.');
    }
  };

  const handleConfirmItemReplacement = () => {
    if (!itemReplaceTarget) return;
    setReplaceError('');
    try {
      const finalReason = replaceReason === 'Other' ? customReplaceReason || 'Other reason' : replaceReason;
      db.requestProductReturn({
        order_id: itemReplaceTarget.orderId,
        order_item_id: itemReplaceTarget.itemId,
        reason: finalReason,
        quantity: replaceQty,
        request_type: 'replace',
        replacement_size: replacementSize,
        replacement_color: replacementColor,
      });
      setOrders(db.getCustomerOrders(customer.customer_id));
      if (selectedOrder && (selectedOrder.id === itemReplaceTarget.orderId || selectedOrder.order_id === itemReplaceTarget.orderId)) {
        setSelectedOrder(db.getOrderById(itemReplaceTarget.orderId) || null);
      }
      const creditVal = (itemReplaceTarget.price ?? 0) * replaceQty;
      setItemReplaceTarget(null);
      setReplaceSuccessMsg(
        `✓ Replacement request placed for "${itemReplaceTarget.itemName}"! ₹${creditVal.toLocaleString('en-IN')} replacement credit has been issued and will automatically adjust against your next new order (One-Time Replacement Adjustment).`
      );
      setTimeout(() => setReplaceSuccessMsg(''), 8000);
    } catch (err: any) {
      setReplaceError(err.message || 'Failed to request replacement.');
    }
  };

  const statusColors: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-800',
    Confirmed: 'bg-blue-100 text-blue-800',
    Processing: 'bg-indigo-100 text-indigo-800',
    Packed: 'bg-purple-100 text-purple-800',
    Shipped: 'bg-cyan-100 text-cyan-800',
    'Out for Delivery': 'bg-teal-100 text-teal-800',
    Delivered: 'bg-emerald-100 text-emerald-800',
    Cancelled: 'bg-rose-100 text-rose-800',
    'Return Requested': 'bg-amber-100 text-amber-900 border border-amber-300',
    'Return Item': 'bg-amber-100 text-amber-900 border border-amber-300',
    'Return Accepted': 'bg-blue-100 text-blue-900 border border-blue-300',
    'Return Completed': 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    'Replace Requested': 'bg-purple-100 text-purple-900 border border-purple-300',
    'Replace Item': 'bg-purple-100 text-purple-900 border border-purple-300',
    'Replace Accepted': 'bg-indigo-100 text-indigo-900 border border-indigo-300',
    'Replace Completed': 'bg-emerald-100 text-emerald-900 border border-emerald-300',
  };

  const getStepNumber = (status: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Pending':
        return 1;
      case 'Processing':
      case 'Packed':
        return 2;
      case 'Shipped':
        return 3;
      case 'Out for Delivery':
        return 4;
      case 'Delivered':
        return 5;
      default:
        return 0;
    }
  };

  return (
    <div id="customer-profile-view" className="max-w-6xl mx-auto px-4 py-8">
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="profile-back-to-shop-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Garments Store</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Customer ID:</span>
          <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
            {customer.customer_id}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Navigation Tabs */}
        <div className="md:col-span-4 lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
            {/* User Quick Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-black text-lg flex items-center justify-center">
                {customer.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-slate-900 text-sm truncate">{customer.name}</h3>
                <p className="text-xs text-slate-500">+91 {customer.mobile}</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="space-y-1">
              <button
                id="profile-tab-orders-btn"
                onClick={() => setActiveTab('ORDERS')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'ORDERS'
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>My Orders ({orders.length})</span>
              </button>

              <button
                id="profile-tab-info-btn"
                onClick={() => setActiveTab('PROFILE')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'PROFILE'
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile Info</span>
              </button>

              <button
                id="profile-tab-addresses-btn"
                onClick={() => setActiveTab('ADDRESSES')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'ADDRESSES'
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Saved Addresses ({customer.addresses?.length || 0})</span>
              </button>

              <button
                id="profile-tab-reviews-btn"
                onClick={() => setActiveTab('REVIEWS')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'REVIEWS'
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>My Reviews ({customerReviews.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="md:col-span-8 lg:col-span-9">
          {/* Orders Tab */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">Your Orders & Tracking</h2>
                <span className="text-xs text-slate-500">{orders.length} orders placed</span>
              </div>

              {returnSuccessMsg && (
                <div
                  id="return-success-banner"
                  className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{returnSuccessMsg}</span>
                </div>
              )}

              {replaceSuccessMsg && (
                <div
                  id="replace-success-banner"
                  className="p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in"
                >
                  <RefreshCw className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{replaceSuccessMsg}</span>
                </div>
              )}

              {/* Available Replacement Credit Notification Banner */}
              {(() => {
                const credits = db.getCustomerAvailableReplacementCredits(customer.customer_id);
                const totalCredit = credits.reduce((sum, c) => sum + c.amount, 0);
                if (totalCredit <= 0) return null;
                return (
                  <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">
                          <RefreshCw className="w-4 h-4 text-purple-200" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 block">
                            One-Time Replacement Credit Active
                          </span>
                          <h4 className="text-sm font-black">
                            Available Credit: ₹{totalCredit.toLocaleString('en-IN')}
                          </h4>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-full">
                        {credits.length} Item(s)
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-100 leading-relaxed">
                      यह रिप्लेसमेंट बिल अमाउंट आपके किसी भी नए ऑर्डर (COD, Prepaid, या Try at Home) के चेकआउट बिल में <strong>One-Time Adjustment</strong> के रूप में अपने-आप घट जाएगा।
                    </p>
                  </div>
                );
              })()}

              {orders.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-800 text-sm">No orders yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                    You haven’t placed any garment orders yet. Discover trending shirts, kurtis and denim.
                  </p>
                  <button
                    onClick={onBack}
                    className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const currentStep = getStepNumber(order.order_status);
                    const isOrderFullyLocked = !!order.final_bill_generated || !!order.final_bill_locked;
                    const canCancel = !isOrderFullyLocked && ['Pending', 'Confirmed'].includes(order.order_status);
                    const payableAmount = db.getOrderPayableAmount(order);
                    const hasCancelledItems = (order.items || []).some((i) => i.item_status === 'Cancelled');

                    return (
                      <div
                        key={order.id}
                        id={`order-card-${order.id}`}
                        className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4"
                      >
                        {/* Order Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                id={`order-id-btn-${order.order_id}`}
                                onClick={() => setSelectedOrder(db.getOrderById(order.order_id) || order)}
                                className="font-mono text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                                title="Click to view Invoice Details"
                              >
                                <span>{order.order_id}</span>
                              </button>

                              {/* Clickable Invoice Order Badge */}
                              <button
                                id={`invoice-btn-${order.order_id}`}
                                onClick={() => setSelectedOrder(db.getOrderById(order.order_id) || order)}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-md transition-colors cursor-pointer shadow-2xs"
                                title="Click to view full Tax Invoice"
                              >
                                <FileText className="w-3 h-3 text-indigo-600" />
                                <span>Invoice: {order.invoice_number || `INV-${order.order_id.replace(/^ORD-/, '')}`}</span>
                              </button>

                              {isOrderFullyLocked && (
                                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 inline-flex items-center gap-1 shadow-2xs">
                                  <Lock className="w-3 h-3 text-amber-700" />
                                  <span>Final Bill Locked</span>
                                </span>
                              )}

                              {order.order_type === 'try_at_home' && (
                                <>
                                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 inline-flex items-center gap-1">
                                    <Home className="w-3 h-3 text-indigo-600" /> Try at Home
                                  </span>
                                  {order.order_status === 'Delivered' && (
                                    <TryAtHomeCountdown order={order} compact />
                                  )}
                                </>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              Placed on {new Date(order.order_date || order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                statusColors[order.order_status] || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {order.order_status.replace(/_/g, ' ')}
                            </span>
                            <div className="text-right">
                              <span className="text-sm font-black text-slate-900 block">
                                ₹{((hasCancelledItems && order.order_status !== 'Cancelled' ? payableAmount : order.total) ?? 0).toLocaleString('en-IN')}
                              </span>
                              {hasCancelledItems && order.order_status !== 'Cancelled' && (
                                <span className="text-[10px] text-amber-600 font-semibold block">
                                  Updated for cancelled items
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Assigned Delivery Partner Banner */}
                        {order.assigned_delivery_boy_name && (
                          <div className="flex items-center justify-between p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                              <div>
                                <span className="text-[10px] uppercase font-bold text-indigo-500 block">Assigned Delivery Partner</span>
                                <span className="font-bold text-indigo-950">{order.assigned_delivery_boy_name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-xs">
                              <Phone className="w-3.5 h-3.5" />
                              <span>+91 {order.assigned_delivery_boy_mobile}</span>
                            </div>
                          </div>
                        )}

                        {/* Order Tracking Stepper */}
                        {order.order_status !== 'Cancelled' && (
                          <div className="py-2">
                            <div className="relative flex items-center justify-between text-[11px] font-semibold text-slate-600">
                              <div className="absolute left-0 right-0 top-3 h-0.5 bg-slate-200 -z-0"></div>
                              <div
                                className="absolute left-0 top-3 h-0.5 bg-indigo-600 -z-0 transition-all duration-500"
                                style={{
                                  width: `${Math.max(0, (currentStep - 1) * 25)}%`,
                                }}
                              ></div>

                              {['Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'].map(
                                (label, idx) => {
                                  const isDone = currentStep >= idx + 1;
                                  return (
                                    <div key={label} className="flex flex-col items-center z-10">
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                          isDone
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'bg-slate-200 text-slate-500'
                                        }`}
                                      >
                                        {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                                      </div>
                                      <span
                                        className={`mt-1 text-[10px] ${
                                          isDone ? 'font-bold text-slate-900' : 'text-slate-400'
                                        }`}
                                      >
                                        {label}
                                      </span>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}

                        {/* Try at Home Doorstep Trial Timer & Decision Window (ONLY shown for Try at Home orders!) */}
                        {order.order_type === 'try_at_home' && (
                          <div className="py-2.5">
                            <TryAtHomeCountdown
                              order={order}
                              onTimerExpire={() => {
                                setOrders(db.getCustomerOrders(customer.customer_id));
                              }}
                              onFinalBillSubmit={() => {
                                db.generateFinalBill(order.order_id, 'Customer');
                                setOrders(db.getCustomerOrders(customer.customer_id));
                              }}
                            />
                          </div>
                        )}

                        {/* Order Calculation Summary for Returns */}
                        {(() => {
                          const billCalc = db.getOrderBillCalculation(order);
                          if (!billCalc.has_returns) return null;
                          return (
                            <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-3">
                                <span className="text-slate-600">
                                  Delivered: <strong className="text-slate-900">{billCalc.total_delivered_quantity}</strong>
                                </span>
                                <span className="text-rose-600 font-semibold">
                                  Return Items: <strong>-{billCalc.total_returned_quantity}</strong>
                                </span>
                                <span className="text-emerald-700 font-bold">
                                  Final Items: <strong>{billCalc.total_final_quantity}</strong>
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-500 line-through">
                                  ₹{billCalc.original_total.toLocaleString('en-IN')}
                                </span>
                                <span className="text-rose-600 font-bold">
                                  Less: RETURN -₹{billCalc.total_return_amount.toLocaleString('en-IN')}
                                </span>
                                <span className="text-emerald-700 font-black text-sm">
                                  FINAL PAYABLE: ₹{billCalc.final_payable.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Items in this order with Item-wise Status & Cancellation / Return / Replace */}
                        <div className="divide-y divide-slate-100">
                          {order.items.map((item) => {
                            const isItemCancelled = item.item_status === 'Cancelled';
                            const isDelivered = order.order_status === 'Delivered' || item.item_status === 'Delivered';
                            const isReturnRequested = item.return_status === 'Return Requested' || item.item_status === 'Return Requested';
                            const isReturnAccepted = item.return_status === 'Return Accepted' || item.item_status === 'Return Accepted';
                            const isReturnCompleted = item.return_status === 'Return Completed' || item.item_status === 'Return Completed';

                            const isReplaceRequested = item.return_status === 'Replace Requested' || item.item_status === 'Replace Requested';
                            const isReplaceAccepted = item.return_status === 'Replace Accepted' || item.item_status === 'Replace Accepted';
                            const isReplaceCompleted =
                              item.return_status === 'Replace Completed' ||
                              item.return_status === 'Replace Item' ||
                              item.item_status === 'Replace Item' ||
                              item.item_status === 'Replace Completed' ||
                              Boolean(item.is_replaced);

                            const isItemReplaced = isReplaceRequested || isReplaceAccepted || isReplaceCompleted || item.request_type === 'replace';

                            const deliveredQty = Math.max(0, Number(item.quantity) || 0);
                            const alreadyReturnedQty = Math.max(0, Number(item.returned_quantity) || 0);
                            const remainingReturnable = Math.max(0, deliveredQty - alreadyReturnedQty);
                            const hasActivePendingAction = isReturnRequested || isReturnAccepted || isReplaceRequested || isReplaceAccepted;

                            const canCancelThisItem =
                              canCancel && !isOrderFullyLocked && !isItemCancelled && order.order_status !== 'Cancelled';
                            const canReturnThisItem =
                              !isOrderFullyLocked &&
                              isDelivered &&
                              !isItemCancelled &&
                              remainingReturnable > 0 &&
                              !hasActivePendingAction;
                            const isTryAtHomeOrder =
                              order.order_type === 'try_at_home' ||
                              (order.order_type as string) === 'TRY_AT_HOME' ||
                              Boolean((order as any).try_at_home) ||
                              Boolean((order as any).is_try_at_home);
                            // Standard COD orders (strictly excluding Try at Home): Only Replacement is shown
                            const isStandardCODOrder = order.payment_method === 'COD' && !isTryAtHomeOrder;

                            return (
                              <div key={item.id} className="py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={item.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                                    alt={item.product_name}
                                    className={`w-14 h-16 rounded-lg object-cover border border-slate-200 ${
                                      isItemCancelled ? 'opacity-50 grayscale' : ''
                                    }`}
                                  />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        {item.brand}
                                      </span>
                                      {/* Item-level status badge */}
                                      <span
                                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${
                                          statusColors[item.item_status || order.order_status] ||
                                          'bg-slate-100 text-slate-700'
                                        }`}
                                      >
                                        {item.item_status || order.order_status}
                                      </span>
                                    </div>
                                    <h4 className={`text-xs font-bold ${isItemCancelled ? 'line-through text-slate-400' : 'text-slate-900'} line-clamp-1`}>
                                      {item.product_name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                      <span>Size: {item.size}</span>
                                      <span>•</span>
                                      <span>Color: {item.color}</span>
                                      <span>•</span>
                                      <span>Qty: {item.quantity}</span>
                                      {alreadyReturnedQty > 0 && (
                                        <>
                                          <span>•</span>
                                          <span className="text-rose-600 font-semibold">
                                            Returned: {alreadyReturnedQty}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    {isItemCancelled && item.cancellation_reason && (
                                      <span className="text-[10px] text-rose-600 block mt-0.5">
                                        Reason: {item.cancellation_reason}
                                      </span>
                                    )}
                                    {item.return_reason && (
                                      <span className="text-[10px] text-amber-800 block mt-0.5 font-medium">
                                        Return: {item.return_reason} (Qty: {item.returned_quantity || item.quantity})
                                      </span>
                                    )}
                                    {item.replacement_size && (
                                      <span className="text-[10px] text-purple-800 block mt-0.5 font-semibold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 inline-block">
                                        Exchange: Size {item.replacement_size} {item.replacement_color ? `• ${item.replacement_color}` : ''} (Bill Unchanged)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-center">
                                  <span className={`text-xs font-bold ${isItemCancelled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                    ₹{((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString('en-IN')}
                                  </span>

                                  {canCancelThisItem && (
                                    <button
                                      id={`cancel-item-btn-${item.id}`}
                                      onClick={() =>
                                        setItemCancelTarget({
                                          orderId: order.order_id,
                                          itemId: item.id,
                                          itemName: item.product_name,
                                          quantity: item.quantity,
                                          price: item.price,
                                        })
                                      }
                                      className="px-2.5 py-1 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded text-[11px] font-bold transition-colors cursor-pointer"
                                      title="Cancel this item from the order"
                                    >
                                      Cancel Item
                                    </button>
                                  )}

                                  {/* Standard COD Orders (Strictly excluding Try at Home): ONLY Replacement Option is shown (Return item is hidden as per COD policy) */}
                                  {canReturnThisItem && isStandardCODOrder && !isTryAtHomeOrder && (
                                    <button
                                      id={`replace-item-btn-${item.id}`}
                                      onClick={() => {
                                        setItemReplaceTarget({
                                          orderId: order.order_id,
                                          itemId: item.id,
                                          itemName: item.product_name,
                                          itemImage: item.image_url,
                                          size: item.size,
                                          color: item.color,
                                          quantity: remainingReturnable,
                                          maxQuantity: remainingReturnable,
                                          price: item.price,
                                        });
                                        setReplaceQty(remainingReturnable);
                                        setReplacementSize(item.size);
                                        setReplacementColor(item.color || 'Same Color');
                                        setReplaceReason('Size/Fit issue (Need different size)');
                                        setCustomReplaceReason('');
                                        setReplaceError('');
                                      }}
                                      className="px-2.5 py-1 border border-purple-300 bg-purple-50 text-purple-900 hover:bg-purple-100 rounded text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                      title="Cash on Delivery Order: Only Replacement is available"
                                    >
                                      <RefreshCw className="w-3 h-3 text-purple-700" />
                                      <span>Replace Item {remainingReturnable < deliveredQty ? `(${remainingReturnable} left)` : ''}</span>
                                    </button>
                                  )}

                                  {/* Try at Home Orders & Online/Prepaid Orders: ONLY Return Option is shown (Replace item is strictly hidden as requested) */}
                                  {canReturnThisItem && (isTryAtHomeOrder || !isStandardCODOrder) && (
                                    <button
                                      id={`return-item-btn-${item.id}`}
                                      onClick={() => {
                                        setItemReturnTarget({
                                          orderId: order.order_id,
                                          itemId: item.id,
                                          itemName: item.product_name,
                                          itemImage: item.image_url,
                                          size: item.size,
                                          color: item.color,
                                          quantity: remainingReturnable,
                                          maxQuantity: remainingReturnable,
                                          price: item.price,
                                        });
                                        setReturnQty(remainingReturnable);
                                        setReturnReason('Size/Fit issue');
                                        setCustomReturnReason('');
                                        setReturnError('');
                                      }}
                                      className="px-2.5 py-1 border border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100 rounded text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Request return for this product"
                                    >
                                      <RotateCcw className="w-3 h-3 text-amber-700" />
                                      <span>Return Item {remainingReturnable < deliveredQty ? `(${remainingReturnable} left)` : ''}</span>
                                    </button>
                                  )}

                                   {/* Return not available before delivery */}
                                  {!isDelivered && !isItemCancelled && order.order_status !== 'Cancelled' && (
                                    <span className="text-[10px] text-slate-400 font-medium italic">
                                      Return available after delivery
                                    </span>
                                  )}

                                  {/* Actions permanently locked after final bill */}
                                  {isDelivered && isOrderFullyLocked && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                                      <Lock className="w-3 h-3 text-slate-400" />
                                      <span>Locked (Final Bill Submitted)</span>
                                    </span>
                                  )}

                                  {/* Product Review Action Button */}
                                  {(isDelivered || isOrderFullyLocked) && !isItemCancelled && !isReturnCompleted && (
                                    (() => {
                                      const existingRev = customerReviews.find(
                                        (r) => r.product_id === item.product_id || (r.order_id === order.order_id && r.product_id === item.product_id)
                                      );
                                      if (existingRev) {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold shadow-2xs">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Reviewed ({existingRev.rating}★)</span>
                                          </span>
                                        );
                                      }
                                      return (
                                        <button
                                          id={`write-item-review-btn-${item.id}`}
                                          type="button"
                                          onClick={() => {
                                            setReviewModalState({
                                              isOpen: true,
                                              productId: item.product_id,
                                              productName: item.product_name,
                                              productImage: item.image_url,
                                              orderId: order.order_id,
                                              orderItemId: item.id,
                                              existingReview: null,
                                            });
                                          }}
                                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold shadow-2xs transition-colors cursor-pointer"
                                          title="Rate & Review this garment"
                                        >
                                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                          <span>Write Review</span>
                                        </button>
                                      );
                                    })()
                                  )}

                                  {isReplaceRequested && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300">
                                      <Clock className="w-3 h-3 text-purple-700" />
                                      <span>Replace Requested</span>
                                    </span>
                                  )}

                                  {isReplaceAccepted && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-300">
                                      <Truck className="w-3 h-3 text-indigo-700" />
                                      <span>Replace Accepted</span>
                                    </span>
                                  )}

                                  {isReplaceCompleted && (
                                    <div className="text-right sm:text-left space-y-0.5">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300">
                                        <CheckCircle className="w-3 h-3 text-purple-700" />
                                        <span>Replace Item (Only Show)</span>
                                      </span>
                                      <p className="text-[10px] text-purple-800 font-semibold">
                                        Exchange Piece • Bill Unchanged (₹0)
                                      </p>
                                    </div>
                                  )}

                                  {isReturnRequested && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                                      <Clock className="w-3 h-3 text-amber-700" />
                                      <span>Return Item</span>
                                    </span>
                                  )}

                                  {isReturnAccepted && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-300">
                                      <Truck className="w-3 h-3 text-blue-700" />
                                      <span>Return Accepted</span>
                                    </span>
                                  )}

                                  {isReturnCompleted && (
                                    <div className="text-right sm:text-left space-y-0.5">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                                        <CheckCircle className="w-3 h-3 text-emerald-700" />
                                        <span>Return Completed</span>
                                      </span>
                                      {item.return_remark && (
                                        <p className="text-[10px] text-slate-500 italic max-w-[220px] truncate" title={item.return_remark}>
                                          Remark: "{item.return_remark}"
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Order Footer & Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                          <div className="text-slate-500">
                            <span>Delivery to: </span>
                            <strong className="text-slate-800">
                              {order.address.name} ({order.address.pincode})
                            </strong>{' '}
                            • {order.payment_method === 'COD' ? 'Cash on Delivery' : 'Online Prepaid'}
                          </div>

                          <div className="flex items-center gap-2">
                            {canCancel && (
                              <button
                                id={`cancel-order-btn-${order.id}`}
                                onClick={() => handleCancelOrder(order.id)}
                                className="px-3 py-1.5 border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Cancel Entire Order
                              </button>
                            )}
                            {(() => {
                              const bCalc = db.getOrderBillCalculation(order);
                              const isLocked = !!order.final_bill_generated || !!order.final_bill_locked;
                              const hasAdjustments = bCalc.has_returns || bCalc.has_replacements || order.is_replace_order;
                              const isDelivered = order.order_status === 'Delivered';

                              return (
                                <>
                                  {isDelivered && !isLocked && (
                                    <button
                                      id={`generate-final-bill-btn-${order.id}`}
                                      onClick={() => {
                                        db.generateFinalBill(order.order_id, 'Customer');
                                        setOrders(db.getCustomerOrders(customer.customer_id));
                                      }}
                                      className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
                                        hasAdjustments
                                          ? 'bg-emerald-600 hover:bg-emerald-700'
                                          : 'bg-indigo-600 hover:bg-indigo-700'
                                      }`}
                                      title="Generate final bill, close doorstep trial timer, and permanently lock all actions"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>
                                        {hasAdjustments
                                          ? `Submit Final Bill (-₹${bCalc.total_return_amount.toLocaleString('en-IN')}) & Lock`
                                          : 'Submit Final Bill (Keep All) & Lock'}
                                      </span>
                                    </button>
                                  )}
                                  {isLocked && (
                                    <span className="px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 shadow-2xs">
                                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                                      <span>All Actions Locked (Final Bill Submitted)</span>
                                    </span>
                                  )}
                                  <button
                                    id={`view-order-details-btn-${order.id}`}
                                    onClick={() => setSelectedOrder(db.getOrderById(order.order_id) || order)}
                                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                                    <span>
                                      {isLocked
                                        ? 'View Final Bill & Invoice (Locked)'
                                        : hasAdjustments
                                        ? 'View Final Bill & Invoice'
                                        : 'View Invoice & Details'}
                                    </span>
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'PROFILE' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
              <h2 className="text-lg font-black text-slate-900">Personal Information</h2>

              {profileMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
                  {profileMsg}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Customer ID (Permanent)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={customer.customer_id}
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mobile Number (Verified via OTP)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`+91 ${customer.mobile}`}
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    id="profile-name-input"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-semibold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    id="profile-email-input"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-semibold text-slate-900"
                  />
                </div>

                <button
                  id="save-profile-btn"
                  type="submit"
                  disabled={isProfileSaving}
                  className={`px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-55 disabled:bg-slate-400 ${
                    isProfileSaving ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {isProfileSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Saving to DB...</span>
                    </>
                  ) : (
                    'Save Profile Changes'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'ADDRESSES' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Saved Delivery Addresses</h2>
                  <p className="text-xs text-slate-500">Manage your delivery locations for faster checkout</p>
                </div>
                {!addressFormOpen && (
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {addressError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addressError}</span>
                </div>
              )}

              {addressSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{addressSuccess}</span>
                </div>
              )}

              {/* Add / Edit Address Form */}
              {addressFormOpen && (
                <form onSubmit={handleSaveAddress} className="p-5 rounded-xl border-2 border-indigo-150 bg-indigo-50/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    {editingAddressId ? 'Update Delivery Address' : 'Add New Delivery Address'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Receiver Name *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">10-Digit Mobile Number *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">+91</span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={formMobile}
                          onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 9876543210"
                          className="w-full pl-11 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-semibold text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={formPincode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormPincode(val);
                          // Auto fill basic mock details on 6 digits
                          if (val.length === 6) {
                            if (val.startsWith('11')) {
                              setFormCity('New Delhi');
                              setFormState('Delhi');
                            } else if (val.startsWith('40')) {
                              setFormCity('Mumbai');
                              setFormState('Maharashtra');
                            } else if (val.startsWith('56')) {
                              setFormCity('Bengaluru');
                              setFormState('Karnataka');
                            } else if (val.startsWith('70')) {
                              setFormCity('Kolkata');
                              setFormState('West Bengal');
                            } else if (val.startsWith('60')) {
                              setFormCity('Chennai');
                              setFormState('Tamil Nadu');
                            } else if (val.startsWith('80')) {
                              setFormCity('Patna');
                              setFormState('Bihar');
                            }
                          }
                        }}
                        placeholder="6-digit PIN code"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Address Type *</label>
                      <div className="flex gap-2">
                        {(['HOME', 'WORK', 'OTHER'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormType(type)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                              formType === type
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">Complete Address (House/Flat No., Building, Street) *</label>
                      <textarea
                        required
                        rows={2}
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        placeholder="e.g. Flat 302, Green Meadows, Sector 15"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        placeholder="e.g. New Delhi"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={formState}
                        onChange={(e) => setFormState(e.target.value)}
                        placeholder="e.g. Delhi"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">Landmark (Optional)</label>
                      <input
                        type="text"
                        value={formLandmark}
                        onChange={(e) => setFormLandmark(e.target.value)}
                        placeholder="e.g. Near City Mall"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-semibold text-slate-900 bg-white"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        id="set-default-checkbox"
                        checked={formIsDefault}
                        onChange={(e) => setFormIsDefault(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="set-default-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                        Make this my default delivery address
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isAddressSaving}
                      onClick={() => setAddressFormOpen(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddressSaving}
                      className={`px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isAddressSaving ? 'opacity-70 cursor-not-allowed bg-slate-400' : ''
                      }`}
                    >
                      {isAddressSaving ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Saving to DB...</span>
                        </>
                      ) : (
                        editingAddressId ? 'Update Address' : 'Save Address'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Address Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(customer.addresses || []).length === 0 ? (
                  <div className="md:col-span-2 p-12 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                    <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No saved delivery addresses found</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">Please add an address to easily place orders and schedule home trials.</p>
                    <button
                      type="button"
                      onClick={handleOpenAddAddress}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 mt-2 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Address</span>
                    </button>
                  </div>
                ) : (
                  customer.addresses?.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-4 rounded-xl border-2 relative flex flex-col justify-between transition-all ${
                        addr.is_default ? 'border-indigo-600 bg-indigo-50/10' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-extrabold text-slate-900 text-sm">{addr.name}</span>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase">
                            {addr.address_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        {addr.landmark && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            Landmark: <span className="font-semibold text-slate-700">{addr.landmark}</span>
                          </p>
                        )}
                        <p className="text-xs text-slate-700 font-semibold mt-2">
                          Mobile: +91 {addr.mobile}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          {addr.is_default ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              Default Address
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr)}
                              className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                              Set as Default
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditClick(addr)}
                            className="text-xs font-bold text-slate-600 hover:text-indigo-600 cursor-pointer transition-colors"
                          >
                            Edit
                          </button>
                          <span className="text-slate-200">|</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-xs font-bold text-slate-500 hover:text-rose-600 cursor-pointer transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'REVIEWS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Your Product Reviews</h2>
                  <p className="text-xs text-slate-500">
                    All reviews and ratings you have shared for verified purchases
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {customerReviews.length} {customerReviews.length === 1 ? 'Review' : 'Reviews'}
                </span>
              </div>

              {customerReviews.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
                  <Star className="w-12 h-12 text-amber-300 fill-amber-100 mx-auto" />
                  <h3 className="font-bold text-slate-800 text-sm">No reviews submitted yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Once your orders are delivered and billing is completed, you can write 5-star ratings and reviews directly from your order list.
                  </p>
                  <button
                    onClick={() => setActiveTab('ORDERS')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
                  >
                    View Your Orders
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {customerReviews.map((rev) => {
                    const prod = db.getProductById(rev.product_id);
                    return (
                      <div
                        key={rev.id}
                        id={`customer-profile-review-${rev.id}`}
                        className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {prod?.images && prod.images[0] ? (
                              <img
                                src={prod.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                                alt={rev.product_name}
                                className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                                ITEM
                              </div>
                            )}
                            <div>
                              <h4 className="text-xs font-black text-slate-900">{rev.product_name}</h4>
                              <p className="text-[11px] text-slate-400">
                                Order #{rev.order_id} •{' '}
                                {new Date(rev.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1 shadow-2xs">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Submitted & Verified</span>
                            </span>
                          </div>
                        </div>

                        {/* Stars & Title */}
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= rev.rating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-200 fill-slate-100'
                                  }`}
                                />
                              ))}
                            </div>
                            {rev.review_title && (
                              <span className="font-bold text-xs text-slate-800">{rev.review_title}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                            {rev.review_text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Order / Invoice Modal with Final Bill Support */}
      {selectedOrder && (
        <OrderInvoiceModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          userRole="Customer"
          onBillGenerated={(updated) => {
            setOrders(db.getCustomerOrders(customer.customer_id));
            setSelectedOrder(updated);
          }}
        />
      )}

      {/* Item Cancellation Dialog */}
      {itemCancelTarget && (
        <div
          id="item-cancel-modal"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-sm font-bold">Cancel Garment Item</h3>
              </div>
              <button
                onClick={() => setItemCancelTarget(null)}
                className="p-1 rounded text-white/80 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500">Item to cancel:</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{itemCancelTarget.itemName}</p>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  Qty: {itemCancelTarget.quantity} • Value: ₹{((itemCancelTarget.price ?? 0) * (itemCancelTarget.quantity ?? 1)).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  ✓ Garment stock will be returned to store inventory immediately.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for cancellation:
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  <option value="Changed mind / Found better price">Changed mind / Found better price</option>
                  <option value="Ordered wrong size/color">Ordered wrong size or color</option>
                  <option value="Delivery taking too long">Delivery taking too long</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              {cancelReason === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Please specify:
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter your cancellation reason..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  onClick={() => setItemCancelTarget(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Keep Item
                </button>
                <button
                  id="confirm-cancel-item-btn"
                  onClick={handleConfirmItemCancellation}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Return / Replace Dialog */}
      {itemReturnTarget && (
        <div
          id="item-return-modal"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 text-white flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold">Return Item (Doorstep Pickup)</h3>
                  <p className="text-[10px] text-amber-200">Amount will be deducted from your payable bill</p>
                </div>
              </div>
              <button
                onClick={() => setItemReturnTarget(null)}
                className="p-1 rounded text-white/80 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {returnError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{returnError}</span>
                </div>
              )}

              {/* Product Info Card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                {itemReturnTarget.itemImage && (
                  <img
                    src={itemReturnTarget.itemImage || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                    alt={itemReturnTarget.itemName}
                    className="w-12 h-14 object-cover rounded-lg border border-slate-200"
                  />
                )}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Garment for Return:</p>
                  <p className="text-sm font-bold text-slate-900">{itemReturnTarget.itemName}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Size: {itemReturnTarget.size} • Color: {itemReturnTarget.color}
                  </p>
                  <p className="text-xs font-extrabold text-indigo-700 mt-1">
                    Value: ₹{(itemReturnTarget.price ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* RETURN OPTIONS */}
              <div className="space-y-3">
                {/* Quantity selection if > 1 */}
                {itemReturnTarget.maxQuantity > 1 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Select Quantity to Return (Max {itemReturnTarget.maxQuantity}):
                    </label>
                    <select
                      value={returnQty}
                      onChange={(e) => setReturnQty(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      {Array.from({ length: itemReturnTarget.maxQuantity }, (_, i) => i + 1).map((q) => (
                        <option key={q} value={q}>
                          {q} unit{q > 1 ? 's' : ''} (₹{(itemReturnTarget.price * q).toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reason for Return:
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Size/Fit issue">Size or Fit issue</option>
                    <option value="Defective / Damaged product">Defective or Damaged product</option>
                    <option value="Color / Fabric not as expected">Color or Fabric not as expected</option>
                    <option value="Product different from description">Product different from description</option>
                    <option value="Quality issue">Quality issue</option>
                    <option value="Other">Other reason</option>
                  </select>
                </div>

                {/* Return Amount Note */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span>Return Amount (Deduction):</span>
                    <span className="text-sm font-black text-rose-600 font-mono">
                      -₹{((itemReturnTarget.price ?? 0) * returnQty).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    ✓ Doorstep pickup will be assigned to your delivery partner.
                  </p>
                  <p className="text-[11px] text-slate-600">
                    ✓ Return amount will be deducted directly from your payable bill.
                  </p>
                </div>
              </div>

              {returnReason === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Please describe the reason:
                  </label>
                  <input
                    type="text"
                    value={customReturnReason}
                    onChange={(e) => setCustomReturnReason(e.target.value)}
                    placeholder="Enter details..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  onClick={() => setItemReturnTarget(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Keep Garment
                </button>
                <button
                  id="submit-return-request-btn"
                  onClick={handleConfirmItemReturn}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Submit Return Item</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Replacement Modal (Cash on Delivery Only Replacement Option) */}
      {itemReplaceTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 text-white flex items-center justify-between bg-purple-900">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-purple-700/60 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Replace Item (Cash on Delivery)</h3>
                  <p className="text-[10px] text-purple-200">
                    Doorstep exchange & replacement credit adjustment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setItemReplaceTarget(null)}
                className="p-1 rounded text-white/80 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              {replaceError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{replaceError}</span>
                </div>
              )}

              {/* Target Item Details */}
              <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-200/70">
                {itemReplaceTarget.itemImage && (
                  <img
                    src={itemReplaceTarget.itemImage || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                    alt={itemReplaceTarget.itemName}
                    className="w-14 h-16 object-cover rounded-lg border border-purple-200 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-900 text-xs truncate">
                    {itemReplaceTarget.itemName}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>Size: {itemReplaceTarget.size}</span>
                    <span>•</span>
                    <span>Color: {itemReplaceTarget.color}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs font-mono">
                    <span className="text-slate-500">Rate:</span>
                    <span className="font-bold text-slate-900">
                      ₹{itemReplaceTarget.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Policy Callout */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider block">
                  Cash on Delivery Replacement Policy
                </span>
                <p className="text-[11px] text-purple-900 leading-relaxed font-medium">
                  कैश ऑन डिलीवरी ऑर्डर्स में केवल <strong>Replacement (बदलाव)</strong> का विकल्प उपलब्ध है। इस आइटम का बिल अमाउंट (₹{(itemReplaceTarget.price * replaceQty).toLocaleString('en-IN')}) आपके अगले नए ऑर्डर के बिल में <strong>One-Time Adjustment</strong> के रूप में एडजस्ट हो जाएगा।
                </p>
              </div>

              <div className="space-y-3">
                {/* Quantity to Replace */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity to Replace:
                  </label>
                  <div className="flex items-center gap-3">
                    <select
                      value={replaceQty}
                      onChange={(e) => setReplaceQty(Number(e.target.value))}
                      className="w-28 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    >
                      {Array.from({ length: itemReplaceTarget.maxQuantity }, (_, i) => i + 1).map(
                        (q) => (
                          <option key={q} value={q}>
                            {q} {q === 1 ? 'Piece' : 'Pieces'}
                          </option>
                        )
                      )}
                    </select>
                    <span className="text-[11px] text-slate-500 font-medium">
                      (Max {itemReplaceTarget.maxQuantity} available)
                    </span>
                  </div>
                </div>

                {/* Replacement Size */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Requested Replacement Size:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setReplacementSize(sz)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          replacementSize === sz
                            ? 'bg-purple-700 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Replacement Color / Pattern preference */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Replacement Color / Pattern:
                  </label>
                  <input
                    type="text"
                    value={replacementColor}
                    onChange={(e) => setReplacementColor(e.target.value)}
                    placeholder="e.g. Same Color, Navy Blue, Maroon..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-medium"
                  />
                </div>

                {/* Replacement Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reason for Replacement:
                  </label>
                  <select
                    value={replaceReason}
                    onChange={(e) => setReplaceReason(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  >
                    <option value="Size/Fit issue (Need different size)">Size/Fit issue (Need different size)</option>
                    <option value="Defective / Damaged garment">Defective / Damaged garment (Need fresh piece)</option>
                    <option value="Color / Fabric not as expected">Color / Fabric preference exchange</option>
                    <option value="Fitting adjustment">Fitting adjustment</option>
                    <option value="Other">Other reason</option>
                  </select>
                </div>

                {replaceReason === 'Other' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Please describe:
                    </label>
                    <input
                      type="text"
                      value={customReplaceReason}
                      onChange={(e) => setCustomReplaceReason(e.target.value)}
                      placeholder="Enter details..."
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Replacement Credit Summary Card */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span>Replacement Amount (Credit):</span>
                    <span className="text-sm font-black text-purple-700 font-mono">
                      ₹{((itemReplaceTarget.price ?? 0) * replaceQty).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 space-y-1 text-[11px] text-slate-600">
                    <p>✓ Current order bill remains active for delivery settlement.</p>
                    <p>✓ One-time replacement credit of ₹{((itemReplaceTarget.price ?? 0) * replaceQty).toLocaleString('en-IN')} is generated for your account.</p>
                    <p>✓ You can adjust this amount against any new order (COD, Prepaid, or Try at Home).</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setItemReplaceTarget(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Keep Garment
                </button>
                <button
                  id="submit-replacement-request-btn"
                  type="button"
                  onClick={handleConfirmItemReplacement}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Confirm Replacement Request</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={reviewModalState.isOpen}
        onClose={() => setReviewModalState((prev) => ({ ...prev, isOpen: false }))}
        productId={reviewModalState.productId}
        productName={reviewModalState.productName}
        productImage={reviewModalState.productImage}
        orderId={reviewModalState.orderId}
        orderItemId={reviewModalState.orderItemId}
        existingReview={reviewModalState.existingReview}
        onSuccess={() => {
          setCustomerReviews(db.getCustomerReviews(customer.customer_id || customer.id));
        }}
      />
    </div>
  );
};
