import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  LogOut,
  Store,
  ExternalLink,
  Search,
  Filter,
  AlertCircle,
  IndianRupee,
  Calendar,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  FileText,
  X,
} from 'lucide-react';
import { DeliveryBoy, Order, ProductReturn } from '../../types';
import { db } from '../../services/db';
import { OrderInvoiceModal } from '../common/OrderInvoiceModal';
import { TryAtHomeCountdown } from '../order/TryAtHomeCountdown';

interface DeliveryBoyPortalProps {
  deliveryBoy: DeliveryBoy;
  onLogout: () => void;
  onSwitchToStore: () => void;
}

export const DeliveryBoyPortal: React.FC<DeliveryBoyPortalProps> = ({
  deliveryBoy,
  onLogout,
  onSwitchToStore,
}) => {
  const [currentBoy, setCurrentBoy] = useState<DeliveryBoy>(deliveryBoy);
  const [orders, setOrders] = useState<Order[]>([]);
  const [assignedReturns, setAssignedReturns] = useState<ProductReturn[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNS'>('ALL');
  const [search, setSearch] = useState('');
  const [confirmDeliveryOrder, setConfirmDeliveryOrder] = useState<Order | null>(null);
  const [cashCollectedChecked, setCashCollectedChecked] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [acceptReturnTarget, setAcceptReturnTarget] = useState<ProductReturn | null>(null);
  const [confirmReturnTarget, setConfirmReturnTarget] = useState<ProductReturn | null>(null);
  const [returnPickupNotes, setReturnPickupNotes] = useState('');
  const [returnRemark, setReturnRemark] = useState('Product received from customer.');
  const [refundSettledChecked, setRefundSettledChecked] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<Order | null>(null);

  const loadData = () => {
    const refreshedBoy = db.getDeliveryBoyById(currentBoy.id) || currentBoy;
    setCurrentBoy(refreshedBoy);

    // Build comprehensive identifier set for this delivery partner
    const boyKeys = new Set<string>();
    if (refreshedBoy.id) boyKeys.add(refreshedBoy.id.toLowerCase());
    if (refreshedBoy.delivery_boy_id) boyKeys.add(refreshedBoy.delivery_boy_id.toLowerCase());
    if (refreshedBoy.mobile) boyKeys.add(refreshedBoy.mobile.replace(/\D/g, ''));
    if (currentBoy.id) boyKeys.add(currentBoy.id.toLowerCase());
    if (currentBoy.delivery_boy_id) boyKeys.add(currentBoy.delivery_boy_id.toLowerCase());
    if (currentBoy.mobile) boyKeys.add(currentBoy.mobile.replace(/\D/g, ''));

    const allOrders = db.getOrders();
    const assigned = allOrders.filter((o) => {
      const assignedId = (o.assigned_delivery_boy_id || '').toLowerCase();
      const assignedMobile = (o.assigned_delivery_boy_mobile || '').replace(/\D/g, '');
      const originalId = (o.original_delivery_boy_id || '').toLowerCase();
      const originalMobile = (o.original_delivery_boy_mobile || '').replace(/\D/g, '');

      return (
        boyKeys.has(assignedId) ||
        (assignedMobile && boyKeys.has(assignedMobile)) ||
        boyKeys.has(originalId) ||
        (originalMobile && boyKeys.has(originalMobile)) ||
        (refreshedBoy.assigned_orders || []).includes(o.order_id)
      );
    });
    // Sort latest first
    assigned.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setOrders(assigned);

    const returns = db.getReturnsForDeliveryBoy(refreshedBoy.id);
    returns.sort((a, b) => new Date(b.requested_at || b.created_at || 0).getTime() - new Date(a.requested_at || a.created_at || 0).getTime());
    setAssignedReturns(returns);
  };

  useEffect(() => {
    loadData();

    // Immediately resolve initial sync from Supabase if in-flight
    db.waitForInitialSync().then(() => {
      loadData();
    });

    const handleDataChange = () => {
      loadData();
    };
    window.addEventListener('style1_data_changed', handleDataChange);
    return () => window.removeEventListener('style1_data_changed', handleDataChange);
  }, []);

  const isDutyActive = currentBoy.status === 'ACTIVE' || currentBoy.status === 'Active';

  const handleToggleDutyStatus = () => {
    const nextStatus: 'ACTIVE' | 'INACTIVE' = isDutyActive ? 'INACTIVE' : 'ACTIVE';
    db.updateDeliveryBoy(currentBoy.id, { status: nextStatus });
    loadData();
  };

  const handleMarkOutForDelivery = (orderId: string) => {
    db.markOrderOutForDelivery(orderId, currentBoy.id);
    setActionSuccess(`Order ${orderId} marked Out for Delivery`);
    setTimeout(() => setActionSuccess(''), 3000);
    loadData();
  };

  const handleConfirmDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmDeliveryOrder) return;

    db.completeOrderDelivery(confirmDeliveryOrder.order_id, currentBoy.id);
    setActionSuccess(`Order ${confirmDeliveryOrder.order_id} delivered successfully!`);
    setTimeout(() => setActionSuccess(''), 3000);
    setConfirmDeliveryOrder(null);
    setCashCollectedChecked(false);
    setDeliveryNotes('');
    loadData();
  };

  const handleConfirmReturnSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!acceptReturnTarget) return;

    try {
      const remarkToSave = returnRemark.trim() || 'Product received from customer.';
      db.confirmProductReturn({
        returnId: acceptReturnTarget.return_id || acceptReturnTarget.id,
        deliveryBoyId: currentBoy.id,
        remark: remarkToSave,
      });
      setActionSuccess(`Return confirmed & completed! Garment collected and inventory restored (+${acceptReturnTarget.quantity}).`);
      setTimeout(() => setActionSuccess(''), 4000);
      setAcceptReturnTarget(null);
      setReturnRemark('Product received from customer.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm return');
    }
  };

  const handleAcceptReturn = (returnId: string) => {
    try {
      db.acceptProductReturn(returnId, currentBoy.id);
      setActionSuccess(`Return pickup accepted. Customer notified of scheduled pickup.`);
      setTimeout(() => setActionSuccess(''), 3000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept return');
    }
  };

  const handleConfirmCompleteReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmReturnTarget) return;

    try {
      const remarkToSave = returnPickupNotes.trim() || 'Product received from customer.';
      db.completeProductReturn(confirmReturnTarget.id, currentBoy.id, remarkToSave);
      setActionSuccess(`Return completed! Garment collected & inventory restocked.`);
      setTimeout(() => setActionSuccess(''), 3000);
      setConfirmReturnTarget(null);
      setRefundSettledChecked(false);
      setReturnPickupNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to complete return');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'PENDING') {
      if (order.order_status === 'Delivered' || order.order_status === 'Out for Delivery' || order.order_status === 'Cancelled') {
        return false;
      }
    } else if (activeFilter === 'OUT_FOR_DELIVERY') {
      if (order.order_status !== 'Out for Delivery') return false;
    } else if (activeFilter === 'DELIVERED') {
      if (order.order_status !== 'Delivered') return false;
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchId = (order.order_id || order.id || '').toLowerCase().includes(q);
      const matchName = (order.customer_name || order.address?.name || order.shipping_address?.name || '').toLowerCase().includes(q);
      const matchPhone = (order.customer_mobile || order.mobile || order.address?.mobile || order.shipping_address?.mobile || '').includes(q);
      const matchCity = (order.address?.city || order.shipping_address?.city || '').toLowerCase().includes(q);
      const matchPin = (order.address?.pincode || order.shipping_address?.pincode || '').includes(q);
      const matchAddress = (order.address?.street || order.address?.line1 || order.shipping_address?.street || order.shipping_address?.address_line1 || '').toLowerCase().includes(q);
      const matchStatus = (order.order_status || '').toLowerCase().includes(q);
      const matchPayment = (order.payment_method || '').toLowerCase().includes(q);
      const matchItems = Array.isArray(order.items) && order.items.some((it) =>
        (it.product_name || '').toLowerCase().includes(q) ||
        (it.sku || '').toLowerCase().includes(q) ||
        (it.color || '').toLowerCase().includes(q) ||
        (it.size || '').toLowerCase().includes(q)
      );
      if (!matchId && !matchName && !matchPhone && !matchCity && !matchPin && !matchAddress && !matchStatus && !matchPayment && !matchItems) {
        return false;
      }
    }
    return true;
  });

  // Calculate Metrics
  const pendingPickupCount = orders.filter(
    (o) => o.order_status !== 'Delivered' && o.order_status !== 'Out for Delivery' && o.order_status !== 'Cancelled'
  ).length;
  const outForDeliveryCount = orders.filter((o) => o.order_status === 'Out for Delivery').length;
  const deliveredCount = orders.filter((o) => o.order_status === 'Delivered').length;

  const totalCodToCollect = orders
    .filter(
      (o) =>
        o.payment_method === 'COD' &&
        (o.order_status === 'Out for Delivery' ||
          (o.order_status !== 'Delivered' && o.order_status !== 'Cancelled'))
    )
    .reduce((sum, o) => sum + db.getOrderPayableAmount(o), 0);

  const totalReturningAmount = db.getDeliveryBoyReturningAmount(currentBoy.id);
  const pendingReturnsCount = assignedReturns.filter((r) => r.status !== 'Return Completed').length;

  // Filter returns
  const filteredReturns = assignedReturns.filter((ret) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchId = (ret.id || '').toLowerCase().includes(q) || (ret.order_id || '').toLowerCase().includes(q);
      const matchName = (ret.customer_name || '').toLowerCase().includes(q);
      const matchPhone = (ret.customer_mobile || '').includes(q);
      const matchAddress = (ret.customer_address || '').toLowerCase().includes(q);
      const matchItem = (ret.item_name || '').toLowerCase().includes(q);
      const matchReason = (ret.reason || '').toLowerCase().includes(q);
      const matchStatus = (ret.status || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPhone && !matchAddress && !matchItem && !matchReason && !matchStatus) return false;
    }
    return true;
  });

  return (
    <div id="delivery-partner-portal-root" className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Delivery Partner Header */}
      <header className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500 text-slate-950 flex items-center justify-center font-black">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">TRYatHOME</span>
              <span className="bg-teal-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded tracking-wide">
                DELIVERY PARTNER
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {currentBoy.name} • {currentBoy.vehicle_type} ({currentBoy.vehicle_number})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Duty status toggle */}
          <button
            onClick={handleToggleDutyStatus}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs ${
              isDutyActive
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Click to toggle duty status"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDutyActive ? 'bg-emerald-300 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>{isDutyActive ? 'On Duty' : 'Off Duty'}</span>
          </button>

          {/* Switch to storefront */}
          <button
            onClick={onSwitchToStore}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Storefront</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Action notification toast */}
        {actionSuccess && (
          <div className="p-3.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pending Pickup
            </span>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingPickupCount}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Ready for dispatch</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Out for Delivery
            </span>
            <p className="text-2xl font-black text-teal-600 mt-1">{outForDeliveryCount}</p>
            <span className="text-[10px] text-teal-700 mt-1 block">In transit to doorstep</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Delivered
            </span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{deliveredCount}</p>
            <span className="text-[10px] text-emerald-700 mt-1 block">Fulfilled successfully</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              COD Cash to Collect
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ₹{(totalCodToCollect ?? 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">Active pending COD</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs bg-amber-50/40">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              Returning Amount
            </span>
            <p className="text-2xl font-black text-amber-600 mt-1">
              ₹{(totalReturningAmount ?? 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-amber-900 mt-1 block font-medium">
              {pendingReturnsCount} return pickup{pendingReturnsCount === 1 ? '' : 's'} assigned
            </span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: 'ALL', label: `All Orders (${orders.length})` },
                { id: 'PENDING', label: `Pending (${pendingPickupCount})` },
                { id: 'OUT_FOR_DELIVERY', label: `In Transit (${outForDeliveryCount})` },
                { id: 'DELIVERED', label: `Delivered (${deliveredCount})` },
                { id: 'RETURNS', label: `Returns & Replacements (${assignedReturns.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                id={`filter-tab-${tab.id.toLowerCase()}`}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeFilter === tab.id
                    ? tab.id === 'RETURNS' ? 'bg-amber-600 text-white shadow-xs' : 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.id === 'RETURNS' && <RotateCcw className="w-3 h-3" />}
                <span>{tab.label}</span>
                {tab.id === 'RETURNS' && assignedReturns.some((r) => r.status === 'Return Requested' || r.status === 'Replace Item') && (
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, customer, address, mobile, item..."
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-xl outline-hidden focus:border-teal-600 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Returns View Tab */}
        {activeFilter === 'RETURNS' ? (
          filteredReturns.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <RotateCcw className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-sm font-black text-slate-800">No return requests assigned</h3>
              <p className="text-xs text-slate-500 mt-1">
                When customers request returns on orders you delivered, they will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReturns.map((ret) => {
                const isReplace = ret.request_type === 'replace' || ret.status === 'Replace Item' || ret.status === 'Replace Completed';
                const isRequested = ret.status === 'Return Requested' || ret.status === 'Replace Item' || ret.status === 'Replace Requested';
                const isAccepted = ret.status === 'Return Accepted' || ret.status === 'Replace Accepted';
                const isCompleted = ret.status === 'Return Completed' || ret.status === 'Replace Completed';

                return (
                  <div
                    key={ret.id}
                    id={`return-card-${ret.id}`}
                    className={`bg-white rounded-2xl border shadow-2xs p-5 flex flex-col justify-between space-y-4 ${
                      isReplace ? 'border-purple-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            {isReplace ? (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 px-2 py-0.5 rounded border border-purple-300 inline-flex items-center gap-1">
                                <RotateCcw className="w-3 h-3 text-purple-700" />
                                <span>Replace Item (Exchange)</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                                Return Item
                              </span>
                            )}
                            <span className="font-mono text-xs font-bold text-slate-700">
                              #{ret.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-slate-500 font-mono">
                            <span>
                              Order ID:{' '}
                              <button
                                onClick={() => {
                                  const ord = db.getOrderById(ret.order_id);
                                  if (ord) setViewingInvoiceOrder(ord);
                                }}
                                className="font-bold text-indigo-700 hover:underline cursor-pointer"
                                title="Click to view Invoice"
                              >
                                {ret.order_id}
                              </button>
                            </span>
                            <span>•</span>
                            <span>
                              Invoice:{' '}
                              <button
                                onClick={() => {
                                  const ord = db.getOrderById(ret.order_id);
                                  if (ord) setViewingInvoiceOrder(ord);
                                }}
                                className="font-bold text-slate-800 hover:text-indigo-600 hover:underline cursor-pointer"
                                title="Click to view Invoice"
                              >
                                {ret.invoice_number || `INV-${ret.order_id.replace(/^ORD-/, '')}`}
                              </button>
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1">
                            <span>Assignment: </span>
                            <strong className="text-teal-700">Customer Order → {currentBoy.name}</strong>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            isCompleted
                              ? isReplace ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : isAccepted
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : isReplace
                              ? 'bg-purple-100 text-purple-900 border-purple-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          {ret.status === 'Return Requested'
                            ? 'Return Item'
                            : ret.status === 'Replace Item'
                            ? 'Replace Item'
                            : ret.status}
                        </span>
                      </div>

                      {/* Customer & Address Details */}
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            {ret.customer_name}
                          </span>
                          <a
                            href={`tel:+91${ret.customer_mobile}`}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg inline-flex items-center gap-1 shadow-2xs transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call Customer</span>
                          </a>
                        </div>

                        <div className="text-slate-600 flex items-start gap-1.5 pt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <p>{ret.customer_address}</p>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                ret.customer_address
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 mt-1"
                            >
                              <span>Open Navigation Maps</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Amount / Replacement Box */}
                      {isReplace ? (
                        <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/80 text-purple-950 space-y-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider block text-purple-800">
                                Replace Item (1:1 Doorstep Exchange)
                              </span>
                              <span className="text-xs font-bold text-purple-950">
                                Replacement Size: {ret.replacement_size || 'Requested Size'} {ret.replacement_color ? `• Color: ${ret.replacement_color}` : ''}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-base font-black text-purple-900">
                                ₹0
                              </span>
                              <span className="text-[10px] text-purple-700 block font-semibold">
                                Bill Unchanged
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] text-purple-800 pt-0.5 border-t border-purple-200/60">
                            Deliver exchange garment to customer and collect old piece. Bill total does NOT change.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/80 text-amber-950 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-800">
                              Item-Specific Returning Amount
                            </span>
                            <span className="text-xs font-semibold">
                              Refund to Settle / Verify
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-amber-900">
                              ₹{ret.return_amount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-amber-700 block">
                              ₹{ret.item_price} × {ret.quantity} unit{ret.quantity > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Garment Details */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {isReplace ? 'Garment Item for Exchange' : 'Garment Item to Collect'}
                        </span>
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200">
                          {ret.item_image && (
                            <img
                              src={ret.item_image || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                              alt={ret.item_name}
                              className="w-10 h-12 object-cover rounded border border-slate-200 shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">{ret.item_name}</p>
                            <p className="text-[11px] text-slate-600">
                              Size: <strong>{ret.item_size}</strong> • Color: <strong>{ret.item_color}</strong> • Qty: <strong>{ret.quantity}</strong>
                            </p>
                            <p className="text-[10px] text-slate-700 mt-0.5">
                              <strong>Reason:</strong> {ret.reason}
                            </p>
                            {isReplace && ret.replacement_size && (
                              <p className="text-[10px] text-purple-800 font-bold mt-0.5">
                                Desired Exchange Size: {ret.replacement_size} {ret.replacement_color ? `(${ret.replacement_color})` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100">
                      {(isRequested || isAccepted) && (
                        <button
                          id={`accept-return-btn-${ret.id}`}
                          onClick={() => {
                            setAcceptReturnTarget(ret);
                            setReturnRemark(
                              ret.remark ||
                              ret.return_remark ||
                              (isReplace
                                ? `Exchange piece delivered to customer (Size ${ret.replacement_size || 'requested'}).`
                                : 'Product received from customer.')
                            );
                          }}
                          className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                            isReplace ? 'bg-purple-700 hover:bg-purple-800' : 'bg-amber-600 hover:bg-amber-700'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isReplace ? 'Confirm Doorstep Replacement' : 'Confirm Return & Pickup'}</span>
                        </button>
                      )}

                      {isCompleted && (
                        <div className="space-y-1.5">
                          <div
                            className={`w-full py-2 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 border ${
                              isReplace
                                ? 'bg-purple-50 border-purple-200 text-purple-900'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            }`}
                          >
                            <CheckCircle className={`w-4 h-4 ${isReplace ? 'text-purple-600' : 'text-emerald-600'}`} />
                            <span>{isReplace ? 'Replacement Completed (Bill Unchanged)' : 'Return Completed & Restocked'}</span>
                          </div>
                          {(ret.remark || ret.return_remark) && (
                            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-700">Remark:</span> {ret.remark || ret.return_remark}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Standard Orders List */
          <div className="space-y-4">
            {activeFilter === 'ALL' && assignedReturns.some((r) => r.status === 'Return Requested') && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-950">
                      ASSIGNED RETURN ITEMS ({assignedReturns.filter((r) => r.status === 'Return Requested').length})
                    </h4>
                    <p className="text-[11px] text-amber-800">
                      Customer requested returns on items you delivered. Open returns to accept and confirm pickup.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveFilter('RETURNS')}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Open Returns Tab</span>
                </button>
              </div>
            )}

            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-sm font-black text-slate-800">No deliveries in this section</h3>
                <p className="text-xs text-slate-500 mt-1">
                  New assigned orders will appear here automatically when allocated by admin.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((order) => {
                const payableAmount = db.getOrderPayableAmount(order);
                const isCOD = order.payment_method === 'COD';
                const activeItems = order.items.filter((i) => i.item_status !== 'Cancelled');
                const cancelledItems = order.items.filter((i) => i.item_status === 'Cancelled');

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => setViewingInvoiceOrder(order)}
                              className="font-mono text-xs font-bold text-indigo-700 hover:text-indigo-950 hover:underline cursor-pointer"
                              title="Click to view Invoice"
                            >
                              {order.order_id}
                            </button>
                            <button
                              onClick={() => setViewingInvoiceOrder(order)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-200 cursor-pointer shadow-2xs transition-colors"
                              title="Click to view full Tax Invoice"
                            >
                              <FileText className="w-2.5 h-2.5 text-indigo-600" />
                              <span>Invoice: {order.invoice_number || `INV-${order.order_id.replace(/^ORD-/, '')}`}</span>
                            </button>
                            {order.order_type === 'try_at_home' && (
                              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                                Try at Home
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Placed: {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingInvoiceOrder(order)}
                            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-md flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="View full Tax Invoice & Details"
                          >
                            <FileText className="w-2.5 h-2.5 text-amber-400" />
                            <span>Invoice</span>
                          </button>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                              order.order_status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.order_status === 'Out for Delivery'
                                ? 'bg-teal-100 text-teal-800'
                                : order.order_status === 'Cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.order_status}
                          </span>
                        </div>
                      </div>

                      {/* Try at Home Doorstep Trial Timer (Only for Try at Home orders) */}
                      {order.order_type === 'try_at_home' && (
                        <div className="py-1">
                          <TryAtHomeCountdown order={order} />
                        </div>
                      )}

                      {/* Customer & Address Details */}
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            {order.address.name}
                          </span>
                          <a
                            href={`tel:+91${order.address.mobile}`}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg inline-flex items-center gap-1 shadow-2xs transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call Customer</span>
                          </a>
                        </div>

                        <div className="text-slate-600 flex items-start gap-1.5 pt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <p>
                              {order.address.address}, {order.address.city}, {order.address.state} -{' '}
                              <strong className="text-slate-800 font-mono">{order.address.pincode}</strong>
                            </p>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${order.address.address}, ${order.address.city}, ${order.address.pincode}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 mt-1"
                            >
                              <span>Open Navigation Maps</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Payment & Collection Box */}
                      <div
                        className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                          isCOD
                            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider block">
                            Payment Mode
                          </span>
                          <span className="font-bold">
                            {isCOD ? '💵 Cash on Delivery (COD)' : '💳 Prepaid (Online Paid)'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider block">
                            {isCOD ? 'Collect from Customer' : 'Payable Amount'}
                          </span>
                          <span className="text-base font-black">
                            ₹{(payableAmount ?? 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Order Garments List */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Garments to Deliver ({activeItems.length})
                        </span>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {order.items.map((it) => {
                            const isCancelled = it.item_status === 'Cancelled';
                            return (
                              <div
                                key={it.id}
                                className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs ${
                                  isCancelled
                                    ? 'bg-rose-50/50 border-rose-200 opacity-60'
                                    : 'bg-slate-50 border-slate-100'
                                }`}
                              >
                                <img
                                  src={it.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                                  alt={it.product_name}
                                  className="w-8 h-10 object-cover rounded border border-slate-200 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold truncate ${isCancelled ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                    {it.product_name}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    Size: <strong>{it.size}</strong> • Qty: {it.quantity}
                                  </p>
                                </div>
                                {isCancelled && (
                                  <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                                    Cancelled
                                  </span>
                                )}
                                {it.return_status && (
                                  <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                    {it.return_status}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Logistics Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {order.order_status !== 'Delivered' && order.order_status !== 'Cancelled' ? (
                        <>
                          {order.order_status !== 'Out for Delivery' ? (
                            <button
                              onClick={() => handleMarkOutForDelivery(order.order_id)}
                              className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Pick Up & Start Route (Out for Delivery)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setConfirmDeliveryOrder(order);
                                setCashCollectedChecked(!isCOD); // if prepaid, checked automatically
                              }}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Confirm Delivery</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="w-full space-y-2">
                          <div className="w-full py-1.5 bg-slate-50 rounded-lg text-center text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>
                              Completed on{' '}
                              {order.status_history && order.status_history.length > 0 && order.status_history[order.status_history.length - 1]?.changed_at
                                ? new Date(order.status_history[order.status_history.length - 1].changed_at).toLocaleDateString('en-IN')
                                : 'Recently'}
                            </span>
                          </div>

                          {order.items && order.items.some((it) => it.return_status === 'Return Requested' || it.return_status === 'Return Accepted') && (
                            <button
                              id={`order-confirm-return-btn-${order.order_id}`}
                              onClick={() => {
                                const pendingRet = assignedReturns.find(
                                  (r) => r.order_id === order.order_id && (r.status === 'Return Requested' || r.status === 'Return Accepted')
                                );
                                if (pendingRet) {
                                  setAcceptReturnTarget(pendingRet);
                                  setReturnRemark('Product received from customer.');
                                } else {
                                  setActiveFilter('RETURNS');
                                }
                              }}
                              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Confirm Return Pickup (Action Required)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </main>

      {/* Confirm Delivery Modal with Cash Collection Confirmation */}
      {confirmDeliveryOrder && (
        <div
          id="confirm-delivery-modal"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black">Complete Doorstep Delivery</h3>
              </div>
              <button
                onClick={() => setConfirmDeliveryOrder(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDeliverySubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="font-mono font-bold text-indigo-700">
                  {confirmDeliveryOrder.order_id}
                </p>
                <p className="font-bold text-slate-900 text-sm">
                  {confirmDeliveryOrder.address.name}
                </p>
                <p className="text-slate-600">{confirmDeliveryOrder.address.address}</p>
              </div>

              {confirmDeliveryOrder.payment_method === 'COD' ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900">Cash on Delivery Required:</span>
                    <span className="text-lg font-black text-amber-950 font-mono">
                      ₹{(db.getOrderPayableAmount(confirmDeliveryOrder) ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <label className="flex items-center gap-2.5 pt-2 border-t border-amber-200 text-xs font-bold text-amber-900 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      checked={cashCollectedChecked}
                      onChange={(e) => setCashCollectedChecked(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span>
                      I have collected exact ₹{(db.getOrderPayableAmount(confirmDeliveryOrder) ?? 0).toLocaleString('en-IN')} in cash from customer
                    </span>
                  </label>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Prepaid Order — No cash collection needed from customer.</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Delivery Notes / Proof of Delivery (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Handed to customer at doorstep"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmDeliveryOrder(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmDeliveryOrder.payment_method === 'COD' && !cashCollectedChecked}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Confirm & Mark Delivered
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Accept Return / Replace Dialog */}
      {acceptReturnTarget && (() => {
        const isReplace = acceptReturnTarget.request_type === 'replace' || acceptReturnTarget.status === 'Replace Item' || acceptReturnTarget.status === 'Replace Requested';
        return (
          <div
            id="confirm-accept-return-modal"
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className={`p-4 text-white flex items-center justify-between ${isReplace ? 'bg-purple-900' : 'bg-slate-900'}`}>
                <div className="flex items-center gap-2">
                  <RotateCcw className={`w-5 h-5 ${isReplace ? 'text-purple-300' : 'text-amber-400'}`} />
                  <div>
                    <h3 className="text-sm font-black">
                      {isReplace ? 'Confirm Doorstep Replacement' : 'Confirm Return'}
                    </h3>
                    <p className={`text-[10px] ${isReplace ? 'text-purple-200' : 'text-slate-300'}`}>
                      {isReplace ? '1:1 Piece Exchange • Bill Amount Unchanged (₹0)' : 'Doorstep Pickup & Inventory Restock'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAcceptReturnTarget(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmReturnSubmit} className="p-5 space-y-4 text-xs">
                <div className={`p-3.5 rounded-xl space-y-2.5 border ${isReplace ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-3 pb-2.5 border-b border-slate-200">
                    {acceptReturnTarget.item_image && (
                      <img
                        src={acceptReturnTarget.item_image || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                        alt={acceptReturnTarget.item_name}
                        className="w-12 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">
                        {acceptReturnTarget.product_name || acceptReturnTarget.item_name}
                      </h4>
                      <p className="text-slate-500 text-[11px]">
                        Original: Size <strong className="text-slate-800">{acceptReturnTarget.item_size}</strong> • Color <strong className="text-slate-800">{acceptReturnTarget.item_color}</strong>
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Quantity: <strong className="text-slate-800">{acceptReturnTarget.quantity} unit{acceptReturnTarget.quantity > 1 ? 's' : ''}</strong>
                      </p>
                      {isReplace && acceptReturnTarget.replacement_size && (
                        <p className="text-purple-800 text-[11px] font-bold mt-1 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 inline-block">
                          Exchange for: Size {acceptReturnTarget.replacement_size} {acceptReturnTarget.replacement_color ? `(${acceptReturnTarget.replacement_color})` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Customer:</span>
                      <span className="font-bold text-slate-900">{acceptReturnTarget.customer_name}</span>
                    </div>
                    {acceptReturnTarget.customer_mobile && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Mobile:</span>
                        <a
                          href={`tel:${acceptReturnTarget.customer_mobile}`}
                          className="font-bold text-teal-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{acceptReturnTarget.customer_mobile}</span>
                        </a>
                      </div>
                    )}
                    {acceptReturnTarget.customer_address && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-500 font-medium shrink-0">Address:</span>
                        <span className="text-slate-800 text-right font-medium">{acceptReturnTarget.customer_address}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Invoice:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {acceptReturnTarget.invoice_number || `INV-${acceptReturnTarget.order_id.replace(/^ORD-/, '')}`}
                      </span>
                    </div>
                    {acceptReturnTarget.reason && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                        <span className="text-slate-500 font-medium">Customer Reason:</span>
                        <span className="font-semibold text-slate-900">{acceptReturnTarget.reason}</span>
                      </div>
                    )}

                    {isReplace ? (
                      <div className="flex justify-between items-center border-t border-purple-200 pt-2 font-bold text-purple-950">
                        <span>Replace Item Bill Change:</span>
                        <span className="text-purple-700 text-sm font-black">
                          ₹0 (Bill Unchanged)
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-bold">
                        <span className="text-slate-700">Return Refund Amount:</span>
                        <span className="text-amber-700 text-sm font-black">
                          ₹{acceptReturnTarget.return_amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Remark Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="delivery-boy-return-remark-input" className="text-[11px] font-bold text-slate-700">
                      Remark
                    </label>
                    <span className="text-[10px] text-slate-400">Written by Delivery Partner</span>
                  </div>
                  <input
                    type="text"
                    id="delivery-boy-return-remark-input"
                    required
                    value={returnRemark}
                    onChange={(e) => setReturnRemark(e.target.value)}
                    placeholder={isReplace ? 'e.g. Exchange piece delivered to customer.' : 'e.g. Product received from customer.'}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
                  />

                  {/* Example Quick Remark Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(isReplace
                      ? [
                          'Exchange piece delivered to customer.',
                          'Customer accepted replacement piece.',
                          'Fresh garment delivered at doorstep.',
                          'Customer verified size & fit.',
                        ]
                      : [
                          'Customer returned product.',
                          'Product received from customer.',
                          'Product packaging damaged.',
                          'Customer requested return.',
                        ]
                    ).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setReturnRemark(preset)}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                          returnRemark === preset
                            ? isReplace ? 'bg-purple-100 text-purple-900 border-purple-300 font-bold' : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    id="cancel-accept-return-btn"
                    onClick={() => setAcceptReturnTarget(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="confirm-accept-return-btn"
                    className={`px-5 py-2 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isReplace ? 'bg-purple-700 hover:bg-purple-800' : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isReplace ? 'Confirm Doorstep Replacement (Bill Unchanged)' : 'Confirm Return Pickup'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Confirm Return Modal with Physical Verification & Settlement */}
      {confirmReturnTarget && (
        <div
          id="confirm-return-modal"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black">Complete Garment Return Pickup</h3>
              </div>
              <button
                onClick={() => setConfirmReturnTarget(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCompleteReturn} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="font-mono font-bold text-amber-700">
                  RETURN #{confirmReturnTarget.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="font-bold text-slate-900 text-sm">
                  {confirmReturnTarget.customer_name}
                </p>
                <p className="text-slate-600">{confirmReturnTarget.customer_address}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                {confirmReturnTarget.item_image && (
                  <img
                    src={confirmReturnTarget.item_image || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                    alt={confirmReturnTarget.item_name}
                    className="w-10 h-12 object-cover rounded border border-slate-200 shrink-0"
                  />
                )}
                <div>
                  <p className="font-bold text-slate-900">{confirmReturnTarget.item_name}</p>
                  <p className="text-slate-500 text-[11px]">
                    Size: <strong>{confirmReturnTarget.item_size}</strong> • Color: <strong>{confirmReturnTarget.item_color}</strong>
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Qty to return: <strong>{confirmReturnTarget.quantity}</strong>
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">Item Return Refund Amount:</span>
                  <span className="text-lg font-black text-amber-950 font-mono">
                    ₹{confirmReturnTarget.return_amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Calculation: ₹{confirmReturnTarget.item_price} × {confirmReturnTarget.quantity} unit{confirmReturnTarget.quantity > 1 ? 's' : ''}
                </p>
                <label className="flex items-center gap-2.5 pt-2 border-t border-amber-200 text-xs font-bold text-amber-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={refundSettledChecked}
                    onChange={(e) => setRefundSettledChecked(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>
                    I have physically received the garment, verified condition, and settled/confirmed refund
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pickup Verification Notes (Optional)
                </label>
                <input
                  type="text"
                  value={returnPickupNotes}
                  onChange={(e) => setReturnPickupNotes(e.target.value)}
                  placeholder="e.g. Garment tags intact, collected from customer"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmReturnTarget(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!refundSettledChecked}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Confirm & Complete Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Order / Invoice Modal */}
      {viewingInvoiceOrder && (
        <OrderInvoiceModal
          order={viewingInvoiceOrder}
          onClose={() => setViewingInvoiceOrder(null)}
          userRole="DeliveryBoy"
        />
      )}
    </div>
  );
};
