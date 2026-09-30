import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  ChevronDown,
  Phone,
  AlertCircle,
  RotateCcw,
  FileText,
  Lock,
  Download,
  Filter,
  RefreshCw,
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  Truck,
  Activity,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Order, OrderStatus, DeliveryBoy, PaymentStatus, PaymentMethod } from '../../types';
import { db } from '../../services/db';
import { OrderInvoiceModal } from '../common/OrderInvoiceModal';
import { AdminOrderFullDetailModal } from './AdminOrderFullDetailModal';
import { printInvoiceElement } from '../../utils/printInvoice';

export const AdminOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(db.getOrders());
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>(db.getDeliveryBoys());
  const [search, setSearch] = useState('');
  
  // Daily workspace filter states
  const [dateRangeFilter, setDateRangeFilter] = useState<'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'ALL'>('TODAY');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [partnerFilter, setPartnerFilter] = useState<string>('ALL');

  // Sorting state - Latest timestamp / current time on top by default
  const [sortDirection, setSortDirection] = useState<'DESC' | 'ASC'>('DESC');
  const [sortBy, setSortBy] = useState<'TIME' | 'ORDER_NO'>('TIME');

  // Modal/Drawer states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<Order | null>(null);

  // Confirm Order Dialog State
  const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);

  // Success message toast
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const refreshOrders = () => {
    const freshOrders = db.getOrders();
    setOrders(freshOrders);
    setDeliveryBoys(db.getDeliveryBoys());
    
    if (selectedOrder) {
      const updated = db.getOrderById(selectedOrder.order_id);
      setSelectedOrder(updated);
    }
  };

  useEffect(() => {
    const handleSync = () => {
      refreshOrders();
    };
    window.addEventListener('style1_data_changed', handleSync);
    return () => window.removeEventListener('style1_data_changed', handleSync);
  }, [selectedOrder]);

  // Filter orders matching criteria
  const getFilteredOrders = () => {
    return orders.filter((o) => {
      // Date range filtering
      const oDate = new Date(o.created_at || o.order_date || Date.now());
      const now = new Date();
      
      if (dateRangeFilter === 'TODAY') {
        if (oDate.toDateString() !== now.toDateString()) return false;
      } else if (dateRangeFilter === 'YESTERDAY') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (oDate.toDateString() !== yesterday.toDateString()) return false;
      } else if (dateRangeFilter === 'LAST_7_DAYS') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (oDate < sevenDaysAgo) return false;
      } else if (dateRangeFilter === 'THIS_MONTH') {
        if (oDate.getMonth() !== now.getMonth() || oDate.getFullYear() !== now.getFullYear()) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && o.order_status !== statusFilter) return false;

      // Payment filter
      if (paymentFilter !== 'ALL' && o.payment_status !== paymentFilter) return false;

      // Delivery Partner filter
      if (partnerFilter !== 'ALL') {
        if (partnerFilter === 'UNASSIGNED' && o.assigned_delivery_boy_id) return false;
        if (partnerFilter === 'ASSIGNED' && !o.assigned_delivery_boy_id) return false;
        if (partnerFilter !== 'UNASSIGNED' && partnerFilter !== 'ASSIGNED' && o.assigned_delivery_boy_id !== partnerFilter) return false;
      }

      // Search query filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchId = (o.order_id || '').toLowerCase().includes(q);
        const matchInvoice = (o.invoice_number || '').toLowerCase().includes(q);
        const matchName = (o.customer_name || '').toLowerCase().includes(q);
        const matchMobile = (o.mobile || o.address?.mobile || '').includes(q);
        const matchCity = (o.address?.city || '').toLowerCase().includes(q);
        const matchItems = (o.items || []).some((it) => 
          (it.product_name || '').toLowerCase().includes(q)
        );
        if (!matchId && !matchInvoice && !matchName && !matchMobile && !matchCity && !matchItems) return false;
      }

      return true;
    });
  };

  // Chronological Sequence & Display Serial Numbers - Latest Orders (newest timestamp / order no) on top, oldest below
  const getSortedOrders = (filteredList: Order[]) => {
    return [...filteredList].sort((a, b) => {
      const aTime = new Date(a.created_at || a.order_date || 0).getTime();
      const bTime = new Date(b.created_at || b.order_date || 0).getTime();

      if (sortBy === 'ORDER_NO') {
        const aId = (a.order_id || '').toString();
        const bId = (b.order_id || '').toString();
        const comp = aId.localeCompare(bId, undefined, { numeric: true, sensitivity: 'base' });
        return sortDirection === 'DESC' ? -comp : comp;
      }

      // Primary: Time sorting (DESC = newest / latest timestamp on top)
      if (bTime !== aTime) {
        return sortDirection === 'DESC' ? bTime - aTime : aTime - bTime;
      }

      // Secondary tie-breaker: order_id (DESC = newest order ID on top)
      const aId = (a.order_id || '').toString();
      const bId = (b.order_id || '').toString();
      const comp = aId.localeCompare(bId, undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'DESC' ? -comp : comp;
    });
  };

  const filteredRaw = getFilteredOrders();
  const sortedAndSeriallyOrdered = getSortedOrders(filteredRaw);

  // Active authorized/active delivery boys
  const activeDeliveryBoys = deliveryBoys.filter(
    (b) => b.status === 'Active' || b.status === 'ACTIVE'
  );

  // Calculate workloads for delivery boys
  const getDeliveryBoyWorkload = (boyId: string) => {
    return orders.filter((o) => o.assigned_delivery_boy_id === boyId && db.isOpenOrder(o)).length;
  };

  // KPI Dashboard Counts (Calculated dynamically from today's orders)
  const getDailyKPIs = () => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter((o) => {
      const oDate = new Date(o.created_at || o.order_date || Date.now());
      return oDate.toDateString() === today;
    });

    return {
      total: todayOrders.length,
      pending: todayOrders.filter((o) => o.order_status === 'Pending').length,
      confirmed: todayOrders.filter((o) => o.order_status === 'Confirmed').length,
      processing: todayOrders.filter((o) => o.order_status === 'Processing' || o.order_status === 'Packed').length,
      assigned: todayOrders.filter((o) => o.assigned_delivery_boy_id && o.order_status !== 'Delivered' && o.order_status !== 'Cancelled').length,
      outForDelivery: todayOrders.filter((o) => o.order_status === 'Out for Delivery').length,
      delivered: todayOrders.filter((o) => o.order_status === 'Delivered').length,
      cancelled: todayOrders.filter((o) => o.order_status === 'Cancelled').length,
    };
  };

  const kpiStats = getDailyKPIs();

  // Confirm Order action
  const handleConfirmOrderSubmit = async () => {
    if (!confirmingOrder) return;
    setIsConfirmingAction(true);
    try {
      await db.updateOrderStatusAsync(
        confirmingOrder.order_id,
        'Confirmed',
        'Merchant Admin Team',
        'Order confirmed via daily management workspace'
      );
      showToast(`Order ${confirmingOrder.order_id} successfully confirmed!`);
      setConfirmingOrder(null);
      refreshOrders();
    } catch (err) {
      console.error('Error confirming order:', err);
      alert('Failed to update Supabase. Please check your connectivity.');
    } finally {
      setIsConfirmingAction(false);
    }
  };

  // Delivery Partner assignment
  const handlePartnerSelectChange = async (orderId: string, boyId: string) => {
    if (!boyId) {
      // Unassign
      try {
        await db.unassignOrderFromDeliveryBoyAsync(orderId);
        showToast('Delivery partner unassigned successfully');
        refreshOrders();
      } catch (err) {
        alert('Failed to unassign delivery partner in Supabase.');
      }
    } else {
      // Assign
      const boy = activeDeliveryBoys.find((b) => b.id === boyId);
      if (!boy) return;
      try {
        await db.assignOrderToDeliveryBoyAsync(orderId, boy.id);
        showToast(`Assigned successfully to ${boy.name}`);
        refreshOrders();
      } catch (err) {
        alert('Failed to assign delivery partner in Supabase.');
      }
    }
  };

  // Status Change advancement dropdown
  const handleStatusSelectChange = async (orderId: string, status: OrderStatus) => {
    const targetOrder = orders.find((o) => o.order_id === orderId);
    if (!targetOrder) return;

    if (db.isOrderLocked(targetOrder)) {
      alert('Order is locked: Final Bill & Invoice has already been locked. Status cannot be modified.');
      return;
    }

    try {
      await db.updateOrderStatusAsync(
        orderId,
        status,
        'Merchant Admin Team',
        `Stage advanced via daily dashboard dropdown to ${status}`
      );
      showToast(`Order status updated to ${status}`);
      refreshOrders();
    } catch (err) {
      alert('Failed to update order status in Supabase.');
    }
  };

  // Format Display Serial: pad with zeros
  const formatDisplaySerial = (index: number) => {
    const idx = index + 1;
    return `#${idx.toString().padStart(3, '0')}`;
  };

  const statusColors: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-800 border-amber-200',
    Confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    Processing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    Packed: 'bg-purple-100 text-purple-800 border-purple-200',
    Shipped: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Out for Delivery': 'bg-teal-100 text-teal-800 border-teal-200',
    Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  const allStatuses: OrderStatus[] = [
    'Pending',
    'Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
  ];

  return (
    <div id="order-management-workspace" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">Daily Order Management Workspace</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track daily incoming dispatches, confirm orders, assign active delivery partners, and monitor real-time fulfillment logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshOrders}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Force Reload Database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Dynamic Summary Cards (Filtered for TODAY) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { id: 'ALL', label: "Today's Orders", count: kpiStats.total, icon: ShoppingBag, color: 'border-slate-200 bg-white hover:border-slate-400' },
          { id: 'Pending', label: 'Pending Confirm', count: kpiStats.pending, icon: Clock, color: 'border-amber-200 bg-amber-50/25 hover:border-amber-400 text-amber-900' },
          { id: 'Confirmed', label: 'Confirmed', count: kpiStats.confirmed, icon: CheckCircle, color: 'border-blue-200 bg-blue-50/25 hover:border-blue-400 text-blue-950' },
          { id: 'Processing', label: 'In Processing', count: kpiStats.processing, icon: Activity, color: 'border-indigo-200 bg-indigo-50/25 hover:border-indigo-400 text-indigo-950' },
          { id: 'ASSIGNED', label: 'Fulfillment Assigned', count: kpiStats.assigned, icon: Truck, color: 'border-purple-200 bg-purple-50/25 hover:border-purple-400 text-purple-950' },
          { id: 'Out for Delivery', label: 'Out For Delivery', count: kpiStats.outForDelivery, icon: Truck, color: 'border-teal-200 bg-teal-50/25 hover:border-teal-400 text-teal-950' },
          { id: 'Delivered', label: 'Delivered', count: kpiStats.delivered, icon: CheckCircle, color: 'border-emerald-200 bg-emerald-50/25 hover:border-emerald-400 text-emerald-950' },
          { id: 'Cancelled', label: 'Void/Cancelled', count: kpiStats.cancelled, icon: XCircle, color: 'border-rose-200 bg-rose-50/25 hover:border-rose-400 text-rose-950' },
        ].map((card) => {
          const isActive = statusFilter === card.id || (card.id === 'ASSIGNED' && partnerFilter === 'ASSIGNED');
          return (
            <div
              key={card.id}
              onClick={() => {
                if (card.id === 'ASSIGNED') {
                  setPartnerFilter('ASSIGNED');
                  setStatusFilter('ALL');
                } else {
                  setPartnerFilter('ALL');
                  setStatusFilter(card.id);
                }
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer text-center flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900 text-white border-transparent shadow-md scale-[1.02]'
                  : `${card.color} text-slate-800 shadow-3xs`
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                  {card.label}
                </span>
                <card.icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              </div>
              <span className="text-2xl font-black block tracking-tight">{card.count}</span>
            </div>
          );
        })}
      </div>

      {/* Primary Workspace Filters & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Daily Date Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Workspace Window:</span>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-hidden focus:border-indigo-600 focus:bg-white"
            >
              <option value="TODAY">🗓️ Today Only</option>
              <option value="YESTERDAY">🗓️ Yesterday</option>
              <option value="LAST_7_DAYS">🗓️ Last 7 Days</option>
              <option value="THIS_MONTH">🗓️ This Month</option>
              <option value="ALL">🗓️ All Records</option>
            </select>
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, customer name, mobile..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold outline-hidden focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Inline filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              {allStatuses.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* Fleet Assignment */}
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-hidden max-w-[150px] truncate"
            >
              <option value="ALL">All Delivery boys</option>
              <option value="UNASSIGNED">Unassigned Only</option>
              <option value="ASSIGNED">Assigned Only</option>
              {activeDeliveryBoys.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            {/* Sort Control Dropdown & Quick Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setSortBy('TIME');
                  setSortDirection((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  sortDirection === 'DESC'
                    ? 'bg-indigo-600 text-white shadow-3xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
                title={sortDirection === 'DESC' ? 'Current / Latest Orders on Top (Descending)' : 'Oldest Orders on Top (Ascending)'}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>
                  {sortDirection === 'DESC' ? '⏱️ Latest First' : '⏱️ Oldest First'}
                </span>
              </button>

              <select
                value={`${sortBy}_${sortDirection}`}
                onChange={(e) => {
                  const [sBy, sDir] = e.target.value.split('_');
                  setSortBy(sBy as 'TIME' | 'ORDER_NO');
                  setSortDirection(sDir as 'DESC' | 'ASC');
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
              >
                <option value="TIME_DESC">Latest Time (Current on Top)</option>
                <option value="TIME_ASC">Oldest Time (Oldest on Top)</option>
                <option value="ORDER_NO_DESC">New Order No on Top</option>
                <option value="ORDER_NO_ASC">Old Order No on Top</option>
              </select>
            </div>

            {/* Clear filters Button */}
            {(dateRangeFilter !== 'TODAY' || statusFilter !== 'ALL' || partnerFilter !== 'ALL' || paymentFilter !== 'ALL' || search) && (
              <button
                onClick={() => {
                  setDateRangeFilter('TODAY');
                  setStatusFilter('ALL');
                  setPartnerFilter('ALL');
                  setPaymentFilter('ALL');
                  setSearch('');
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global Toast Action */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 px-1">✕</button>
        </div>
      )}

      {/* Order List Table (Desktop) / Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
        {sortedAndSeriallyOrdered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-bold text-xs space-y-2">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No orders found in this workspace window.</p>
            <p className="text-[11px] text-slate-400 font-normal">Try changing the workspace filter or adding test orders.</p>
          </div>
        ) : (
          <>
            {/* Desktop Compact Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-200">
                    <th className="px-4 py-3.5 text-center">Serial</th>
                    <th
                      className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
                      onClick={() => {
                        if (sortBy === 'ORDER_NO') {
                          setSortDirection((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
                        } else {
                          setSortBy('ORDER_NO');
                          setSortDirection('DESC');
                        }
                      }}
                      title="Sort by Order Number (Newest on top / Oldest on top)"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Order ID</span>
                        {sortBy === 'ORDER_NO' ? (
                          sortDirection === 'DESC' ? (
                            <ArrowDown className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <ArrowUp className="w-3 h-3 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
                      onClick={() => {
                        if (sortBy === 'TIME') {
                          setSortDirection((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
                        } else {
                          setSortBy('TIME');
                          setSortDirection('DESC');
                        }
                      }}
                      title="Sort by Order Time (Current time on top / Old time on top)"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Order Time</span>
                        {sortBy === 'TIME' ? (
                          sortDirection === 'DESC' ? (
                            <ArrowDown className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <ArrowUp className="w-3 h-3 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Items</th>
                    <th className="px-4 py-3.5 text-right">Amount</th>
                    <th className="px-4 py-3.5">Payment</th>
                    <th className="px-4 py-3.5">Order Status</th>
                    <th className="px-4 py-3.5">Delivery Partner</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {sortedAndSeriallyOrdered.map((order, idx) => {
                    const payable = db.getOrderPayableAmount(order) ?? 0;
                    const itemsText = order.items?.map((it) => `${it.product_name} (${it.size})`).join(', ') || 'No Items';
                    const isConfirmed = order.order_status !== 'Pending';
                    const isLocked = db.isOrderLocked(order);
                    const isDeliveryLocked = db.isOrderDeliveryLocked(order);

                    return (
                      <tr key={order.order_id} className="hover:bg-slate-50/50 transition-colors">
                        {/* 1. Daily display sequence serial */}
                        <td className="px-4 py-3.5 text-center font-mono font-black text-indigo-600 bg-slate-50/40">
                          {formatDisplaySerial(idx)}
                        </td>

                        {/* 2. Order ID */}
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                          {order.order_id}
                        </td>

                        {/* 3. Order Time */}
                        <td className="px-4 py-3.5 text-slate-500 text-[11px] leading-tight">
                          {new Date(order.created_at || order.order_date || Date.now()).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        {/* 4. Customer Name */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 leading-tight">{order.customer_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{order.mobile}</div>
                        </td>

                        {/* 5. Items Summary */}
                        <td className="px-4 py-3.5 max-w-[200px] truncate" title={itemsText}>
                          {itemsText}
                        </td>

                        {/* 6. Amount */}
                        <td className="px-4 py-3.5 text-right font-black text-slate-900">
                          ₹{payable.toLocaleString('en-IN')}
                        </td>

                        {/* 7. Payment status */}
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            order.payment_status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {order.payment_status}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{order.payment_method}</span>
                        </td>

                        {/* 8. Order Status dropdown-based stage selection */}
                        <td className="px-4 py-3.5">
                          {isLocked ? (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm border ${statusColors[order.order_status]}`}>
                              {order.order_status} (Locked)
                            </span>
                          ) : (
                            <select
                              value={order.order_status}
                              onChange={(e) => handleStatusSelectChange(order.order_id, e.target.value as OrderStatus)}
                              className={`text-[10px] font-black px-2 py-1 border rounded-md outline-hidden bg-white cursor-pointer ${statusColors[order.order_status]}`}
                            >
                              {allStatuses.map((st) => (
                                <option key={st} value={st} className="bg-white text-slate-800 text-xs font-semibold">
                                  {st}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>

                        {/* 9. Delivery Partner Dropdown */}
                        <td className="px-4 py-3.5">
                          {isDeliveryLocked ? (
                            <span className="text-[10px] text-slate-400 font-bold">
                              {order.assigned_delivery_boy_name || 'Unassigned (Locked)'}
                            </span>
                          ) : (
                            <select
                              value={order.assigned_delivery_boy_id || ''}
                              onChange={(e) => handlePartnerSelectChange(order.order_id, e.target.value)}
                              disabled={!isConfirmed || order.order_status === 'Cancelled'}
                              className="w-full text-[10px] font-bold p-1 border border-slate-200 rounded-md bg-white text-slate-700 outline-hidden max-w-[150px] disabled:opacity-50 disabled:bg-slate-50"
                            >
                              <option value="">-- Assign --</option>
                              {activeDeliveryBoys.map((boy) => {
                                const load = getDeliveryBoyWorkload(boy.id);
                                return (
                                  <option key={boy.id} value={boy.id}>
                                    {boy.name} (Open: {load})
                                  </option>
                                );
                              })}
                            </select>
                          )}
                        </td>

                        {/* 10. Actions */}
                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {/* Confirm Button */}
                          {!isConfirmed && (
                            <button
                              onClick={() => setConfirmingOrder(order)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] rounded-md transition-colors cursor-pointer shadow-3xs"
                            >
                              CONFIRM
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailOpen(true);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-md cursor-pointer"
                          >
                            VIEW
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden divide-y divide-slate-100 p-3 space-y-3">
              {sortedAndSeriallyOrdered.map((order, idx) => {
                const payable = db.getOrderPayableAmount(order) ?? 0;
                const isConfirmed = order.order_status !== 'Pending';

                return (
                  <div key={order.order_id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-indigo-600">
                          {formatDisplaySerial(idx)}
                        </span>
                        <span className="font-mono font-black text-xs text-slate-900">
                          {order.order_id}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm uppercase ${statusColors[order.order_status]}`}>
                        {order.order_status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 text-slate-600 font-semibold">
                      <div className="flex items-center justify-between">
                        <span>Customer:</span>
                        <strong className="text-slate-950">{order.customer_name}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Items Count:</span>
                        <span>{order.items?.length || 0} items</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Net Payable:</span>
                        <strong className="text-slate-900">₹{payable.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Payment:</span>
                        <span className="font-bold">{order.payment_status} ({order.payment_method})</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 flex-wrap">
                      {/* Mobile action controls */}
                      {!isConfirmed ? (
                        <button
                          onClick={() => setConfirmingOrder(order)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] rounded-lg cursor-pointer flex-1 text-center"
                        >
                          CONFIRM ORDER
                        </button>
                      ) : (
                        <div className="flex-1 text-xs text-slate-500 font-bold">
                          Confirmed: Ready to Dispatch
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-[10px] rounded-lg cursor-pointer"
                      >
                        VIEW DETAIL
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmingOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-3xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-indigo-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-slate-900">Confirm This Order?</h3>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center justify-between">
                <span>Customer:</span>
                <strong className="text-slate-900">{confirmingOrder.customer_name}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Order ID:</span>
                <strong className="text-slate-900 font-mono">{confirmingOrder.order_id}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Invoice Acknowledged:</span>
                <span className="font-mono text-slate-700">{confirmingOrder.invoice_number || 'TBD'}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-2 mt-1">
                <span>Total Payable Amount:</span>
                <strong className="text-indigo-600 text-sm">₹{(db.getOrderPayableAmount(confirmingOrder) ?? 0).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Confirming this order locks the products, decreases shopkeeper stock counters, and moves the status to <strong className="text-slate-700">Confirmed</strong> in Supabase.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                disabled={isConfirmingAction}
                onClick={() => setConfirmingOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                No, Cancel
              </button>
              <button
                disabled={isConfirmingAction}
                onClick={handleConfirmOrderSubmit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {isConfirmingAction ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Yes, Confirm Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Order Detail Modal/Drawer */}
      <AdminOrderFullDetailModal
        order={selectedOrder}
        deliveryBoys={deliveryBoys}
        returns={[]}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedOrder(null);
        }}
        onOrderUpdated={() => {
          refreshOrders();
        }}
      />
    </div>
  );
};
