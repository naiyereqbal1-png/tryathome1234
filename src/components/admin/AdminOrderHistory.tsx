import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  ChevronRight,
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
  Calendar,
} from 'lucide-react';
import { Order, OrderStatus, DeliveryBoy, PaymentStatus, PaymentMethod } from '../../types';
import { db } from '../../services/db';
import { OrderInvoiceModal } from '../common/OrderInvoiceModal';
import { AdminOrderFullDetailModal } from './AdminOrderFullDetailModal';
import { printInvoiceElement } from '../../utils/printInvoice';

export const AdminOrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(db.getOrders());
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>(db.getDeliveryBoys());
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filters state
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [partnerFilter, setPartnerFilter] = useState<string>('ALL');

  // Selected Order for sidebar timeline view / details
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const refreshOrders = () => {
    const freshOrders = db.getOrders();
    setOrders(freshOrders);
    setDeliveryBoys(db.getDeliveryBoys());
    if (activeOrder) {
      const updated = db.getOrderById(activeOrder.order_id);
      setActiveOrder(updated);
    }
  };

  useEffect(() => {
    const handleSync = () => {
      refreshOrders();
    };
    window.addEventListener('style1_data_changed', handleSync);
    return () => window.removeEventListener('style1_data_changed', handleSync);
  }, [activeOrder]);

  // Apply search & advanced filters
  const getFilteredHistory = () => {
    return orders.filter((o) => {
      // 1. Date filters
      const oDate = new Date(o.created_at || o.order_date || Date.now());
      const now = new Date();

      if (datePreset === 'TODAY') {
        if (oDate.toDateString() !== now.toDateString()) return false;
      } else if (datePreset === 'YESTERDAY') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (oDate.toDateString() !== yesterday.toDateString()) return false;
      } else if (datePreset === 'THIS_WEEK') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0,0,0,0);
        if (oDate < startOfWeek) return false;
      } else if (datePreset === 'THIS_MONTH') {
        if (oDate.getMonth() !== now.getMonth() || oDate.getFullYear() !== now.getFullYear()) return false;
      } else if (datePreset === 'CUSTOM') {
        if (startDate) {
          const sDate = new Date(startDate);
          sDate.setHours(0,0,0,0);
          if (oDate < sDate) return false;
        }
        if (endDate) {
          const eDate = new Date(endDate);
          eDate.setHours(23,59,59,999);
          if (oDate > eDate) return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== 'ALL' && o.order_status !== statusFilter) return false;

      // 3. Payment Status filter
      if (paymentFilter !== 'ALL' && o.payment_status !== paymentFilter) return false;

      // 4. Delivery Partner filter
      if (partnerFilter !== 'ALL') {
        if (partnerFilter === 'UNASSIGNED' && o.assigned_delivery_boy_id) return false;
        if (partnerFilter === 'ASSIGNED' && !o.assigned_delivery_boy_id) return false;
        if (partnerFilter !== 'UNASSIGNED' && partnerFilter !== 'ASSIGNED' && o.assigned_delivery_boy_id !== partnerFilter) return false;
      }

      // 5. Customer / Mobile / Order ID search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (o.order_id || '').toLowerCase().includes(q);
        const matchName = (o.customer_name || '').toLowerCase().includes(q);
        const matchMobile = (o.mobile || o.address?.mobile || '').includes(q);
        const matchInvoice = (o.invoice_number || '').toLowerCase().includes(q);
        if (!matchId && !matchName && !matchMobile && !matchInvoice) return false;
      }

      return true;
    }).sort((a, b) => {
      const aTime = new Date(a.created_at || a.order_date || 0).getTime();
      const bTime = new Date(b.created_at || b.order_date || 0).getTime();
      return bTime - aTime;
    });
  };

  const filteredHistoryList = getFilteredHistory();

  // Export full manifest CSV
  const handleExportCSV = () => {
    if (filteredHistoryList.length === 0) {
      alert('No history records matching filters.');
      return;
    }
    const headers = [
      'Order ID',
      'Invoice Number',
      'Date Placed',
      'Status',
      'Customer Name',
      'Customer Mobile',
      'City',
      'Items Count',
      'Payment Status',
      'Net Payable (INR)',
      'Delivery Partner'
    ];

    const rows = filteredHistoryList.map((o) => {
      const payable = db.getOrderPayableAmount(o) ?? 0;
      return [
        `"${o.order_id}"`,
        `"${o.invoice_number || ''}"`,
        `"${new Date(o.created_at || o.order_date || Date.now()).toLocaleString('en-IN')}"`,
        `"${o.order_status}"`,
        `"${(o.customer_name || '').replace(/"/g, '""')}"`,
        `"${o.mobile || ''}"`,
        `"${(o.address?.city || '').replace(/"/g, '""')}"`,
        o.items?.length || 0,
        `"${o.payment_status}"`,
        payable,
        `"${o.assigned_delivery_boy_name || 'Unassigned'}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `STYLE1_Order_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status badges colors
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

  const getTimelineEventTime = (order: Order, stage: OrderStatus) => {
    const matched = order.status_history?.find((h) => h.status === stage);
    if (matched) {
      return new Date(matched.changed_at).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return null;
  };

  return (
    <div id="order-history-workspace" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900">Historical Archives & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse complete lifecycle timelines, perform multi-attribute search across customers/IDs, and export auditing manifests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download CSV Auditing Manifest"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export Archives (CSV)</span>
          </button>

          <button
            onClick={refreshOrders}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Advanced Filter Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          Filter Archives
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* 1. Date Preset */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Time Preset</label>
            <select
              value={datePreset}
              onChange={(e) => {
                setDatePreset(e.target.value as any);
                if (e.target.value !== 'CUSTOM') {
                  setStartDate('');
                  setEndDate('');
                }
              }}
              className="w-full text-xs font-bold p-2 border border-slate-200 bg-slate-50 rounded-lg outline-hidden focus:bg-white"
            >
              <option value="ALL">🗓️ All Time</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="CUSTOM">Custom Range...</option>
            </select>
          </div>

          {/* 2. Custom Start Date */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Start Date</label>
            <input
              type="date"
              disabled={datePreset !== 'CUSTOM'}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs font-semibold p-1.5 border border-slate-200 bg-slate-50 rounded-lg outline-hidden focus:bg-white disabled:opacity-50"
            />
          </div>

          {/* 3. Custom End Date */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">End Date</label>
            <input
              type="date"
              disabled={datePreset !== 'CUSTOM'}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs font-semibold p-1.5 border border-slate-200 bg-slate-50 rounded-lg outline-hidden focus:bg-white disabled:opacity-50"
            />
          </div>

          {/* 4. Order status */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs font-bold p-2 border border-slate-200 bg-slate-50 rounded-lg outline-hidden"
            >
              <option value="ALL">🔖 All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Packed">Packed</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* 5. Payment status */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Payment Status</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full text-xs font-bold p-2 border border-slate-200 bg-slate-50 rounded-lg outline-hidden"
            >
              <option value="ALL">💵 All Payments</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>

          {/* 6. Fleet partner */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Delivery fleet</label>
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="w-full text-xs font-bold p-2 border border-slate-200 bg-slate-50 rounded-lg outline-hidden max-w-[150px] truncate"
            >
              <option value="ALL">🚚 All Fleet</option>
              <option value="UNASSIGNED">Unassigned Only</option>
              <option value="ASSIGNED">Assigned Only</option>
              {deliveryBoys.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search input bar */}
        <div className="relative pt-2 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="relative min-w-[280px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, invoice #, customer name, mobile..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:bg-white focus:border-indigo-600 font-semibold"
            />
          </div>

          {/* Clear filters trigger */}
          {(datePreset !== 'ALL' || statusFilter !== 'ALL' || paymentFilter !== 'ALL' || partnerFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setDatePreset('ALL');
                setStartDate('');
                setEndDate('');
                setStatusFilter('ALL');
                setPaymentFilter('ALL');
                setPartnerFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main split dashboard view: List on left, Timeline view on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Clean Professional Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-3xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black text-slate-700">Archived Orders List ({filteredHistoryList.length} records)</span>
            {activeOrder && (
              <span className="text-[11px] font-bold text-indigo-600">
                Selected: <strong className="font-mono">{activeOrder.order_id}</strong>
              </span>
            )}
          </div>

          {filteredHistoryList.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-bold text-xs space-y-2">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No historical dispatches match current parameters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-200">
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-right">Net Payable</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Fulfillment Status</th>
                    <th className="px-4 py-3 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredHistoryList.map((order) => {
                    const payable = db.getOrderPayableAmount(order) ?? 0;
                    const isSelected = activeOrder?.order_id === order.order_id;
                    return (
                      <tr
                        key={order.order_id}
                        onClick={() => setActiveOrder(order)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/65 hover:bg-indigo-50' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {order.order_id}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {new Date(order.created_at || order.order_date || Date.now()).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{order.customer_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{order.mobile}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">
                          ₹{payable.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            order.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${statusColors[order.order_status]}`}>
                            {order.order_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveOrder(order);
                              setIsDetailOpen(true);
                            }}
                            className="p-1 bg-slate-100 hover:bg-slate-200 text-indigo-600 rounded"
                            title="Open Audit Detail Panel"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Clean Timeline Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-indigo-600" />
              Fulfillment Timeline Trail
            </h3>

            {activeOrder ? (
              <div className="space-y-5">
                <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Selected Order:</span>
                    <strong className="font-mono text-slate-900">{activeOrder.order_id}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Customer:</span>
                    <strong className="text-slate-900">{activeOrder.customer_name}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Status Stage:</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${statusColors[activeOrder.order_status]}`}>
                      {activeOrder.order_status}
                    </span>
                  </div>
                </div>

                {/* Timeline display */}
                <div className="relative pl-6 border-l border-slate-200 space-y-5 py-2">
                  {[
                    { stage: 'Pending', title: 'Order Placed / Pending' },
                    { stage: 'Confirmed', title: 'Order Acknowledged' },
                    { stage: 'Shipped', title: 'Handed Over to Fleet' },
                    { stage: 'Out for Delivery', title: 'Out For Delivery' },
                    { stage: 'Delivered', title: 'Delivered successfully' },
                  ].map((step, idx) => {
                    const time = getTimelineEventTime(activeOrder, step.stage as OrderStatus) || (idx === 0 ? getTimelineEventTime(activeOrder, 'Pending') : null);
                    const isDone = !!time;
                    
                    return (
                      <div key={step.stage} className="relative">
                        {/* Timeline bubble bullet */}
                        <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-colors ${
                          isDone ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'
                        }`}>
                          {isDone && <Check className="w-2.5 h-2.5 text-indigo-600" />}
                        </div>

                        <div className="space-y-0.5">
                          <p className={`text-xs font-black ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.title}
                          </p>
                          {time ? (
                            <p className="text-[10px] text-indigo-600 font-extrabold font-mono">{time}</p>
                          ) : (
                            <p className="text-[10px] text-slate-400">Not reached yet</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setIsDetailOpen(true)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Audit Details</span>
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <Activity className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
                <p>Click any order from the left list to trace its audit timeline.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Audit Detail Panel Modal */}
      <AdminOrderFullDetailModal
        order={activeOrder}
        deliveryBoys={deliveryBoys}
        returns={[]}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
        }}
        onOrderUpdated={() => {
          refreshOrders();
        }}
      />
    </div>
  );
};
