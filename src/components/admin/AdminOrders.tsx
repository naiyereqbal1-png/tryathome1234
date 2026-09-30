import React, { useState, useEffect } from 'react';
import {
  Search,
  Truck,
  Package,
  Calendar,
  Eye,
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
  Maximize2,
  Filter,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  Home,
  User,
  MapPin,
  CreditCard,
  Tag,
  ShoppingBag,
  Hash,
  UserCheck,
  AlertTriangle,
  ClipboardCheck,
  Coins,
  Activity,
} from 'lucide-react';
import { DeliveryBoy, Order, OrderStatus, ProductReturn } from '../../types';
import { db } from '../../services/db';
import { OrderInvoiceModal } from '../common/OrderInvoiceModal';
import { AdminOrderFullDetailModal } from './AdminOrderFullDetailModal';
import { TryAtHomeCountdown } from '../order/TryAtHomeCountdown';
import { printInvoiceElement } from '../../utils/printInvoice';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(db.getOrders());
  const [viewMode, setViewMode] = useState<'LIST' | 'PIPELINE'>('PIPELINE');
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>(db.getDeliveryBoys());
  const [returns, setReturns] = useState<ProductReturn[]>(db.getReturns());
  const [search, setSearch] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<'ALL' | 'OPEN' | 'CLOSED' | 'DELIVERED' | 'CANCELLED' | 'TRY_AT_HOME'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deliveryBoyFilter, setDeliveryBoyFilter] = useState<string>('ALL');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH'>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'COD' | 'ONLINE'>('ALL');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [fullDetailOrder, setFullDetailOrder] = useState<Order | null>(null);
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<Order | null>(null);

  // Status update state
  const [newStatus, setNewStatus] = useState<OrderStatus>('Confirmed');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierPartner, setCourierPartner] = useState('BlueDart Express');
  const [statusNotes, setStatusNotes] = useState('');

  // Delivery Partner Assignment state
  const [assignBoyId, setAssignBoyId] = useState('');
  const [assignSuccessMsg, setAssignSuccessMsg] = useState('');

  const isBoyActive = (b: DeliveryBoy) => b.status === 'Active' || b.status === 'ACTIVE';
  const activeDeliveryBoys = deliveryBoys.filter(isBoyActive);
  const stats = db.getOrderHistoryStats(orders);

  const refreshOrders = () => {
    const freshOrders = db.getOrders();
    setOrders(freshOrders);
    setDeliveryBoys(db.getDeliveryBoys());
    setReturns(db.getReturns());
    if (selectedOrder) {
      const updated = db.getOrderById(selectedOrder.order_id);
      setSelectedOrder(updated);
      if (updated) {
        setAssignBoyId(updated.assigned_delivery_boy_id || '');
      }
    }
    if (fullDetailOrder) {
      const updated = db.getOrderById(fullDetailOrder.order_id);
      setFullDetailOrder(updated);
    }
  };

  useEffect(() => {
    const handleSync = () => {
      refreshOrders();
    };
    window.addEventListener('style1_data_changed', handleSync);
    return () => window.removeEventListener('style1_data_changed', handleSync);
  }, [selectedOrder?.order_id, fullDetailOrder?.order_id]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.order_status);
    setTrackingNumber(order.tracking_number || '');
    setCourierPartner(order.courier_partner || 'BlueDart Express');
    setStatusNotes('');
    setAssignBoyId(order.assigned_delivery_boy_id || '');
    setAssignSuccessMsg('');
  };

  const handleAssignDeliveryBoy = () => {
    if (!selectedOrder || !assignBoyId) return;
    if (db.isOrderDeliveryLocked(selectedOrder)) {
      alert(db.getDeliveryLockReason(selectedOrder) || 'Cannot change delivery partner: Order is locked (Delivered or Paid).');
      return;
    }
    const boy = deliveryBoys.find((b) => b.id === assignBoyId);
    if (!boy) return;

    db.assignOrderToDeliveryBoy(selectedOrder.order_id, boy.id);
    setAssignSuccessMsg(`Assigned to ${boy.name} (${boy.vehicle_type})`);
    setTimeout(() => setAssignSuccessMsg(''), 4000);
    refreshOrders();
  };

  const handleUnassignDeliveryBoy = () => {
    if (!selectedOrder) return;
    if (db.isOrderDeliveryLocked(selectedOrder)) {
      alert(db.getDeliveryLockReason(selectedOrder) || 'Cannot unassign: Order is locked (Delivered or Paid).');
      return;
    }
    db.unassignOrderFromDeliveryBoy(selectedOrder.order_id);
    setAssignSuccessMsg('Order unassigned from delivery partner');
    setAssignBoyId('');
    setTimeout(() => setAssignSuccessMsg(''), 4000);
    refreshOrders();
  };

  const handleQuickAssign = (orderId: string, boyId: string) => {
    const target = orders.find((o) => o.order_id === orderId);
    if (target && db.isOrderDeliveryLocked(target)) {
      alert(db.getDeliveryLockReason(target) || 'Cannot change delivery partner: Order is locked (Delivered or Paid).');
      return;
    }
    const boy = deliveryBoys.find((b) => b.id === boyId);
    if (!boy) return;
    db.assignOrderToDeliveryBoy(orderId, boy.id);
    setAssignSuccessMsg(`Order ${orderId} assigned to ${boy.name}`);
    setTimeout(() => setAssignSuccessMsg(''), 4000);
    refreshOrders();
  };

  const handleQuickUnassign = (orderId: string) => {
    const target = orders.find((o) => o.order_id === orderId);
    if (target && db.isOrderDeliveryLocked(target)) {
      alert(db.getDeliveryLockReason(target) || 'Cannot unassign: Order is locked (Delivered or Paid).');
      return;
    }
    db.unassignOrderFromDeliveryBoy(orderId);
    setAssignSuccessMsg(`Order ${orderId} unassigned from delivery partner`);
    setTimeout(() => setAssignSuccessMsg(''), 4000);
    refreshOrders();
  };

  const handleAdminCancelItem = (itemId: string, itemName: string) => {
    if (!selectedOrder) return;
    const reason = prompt(`Reason for cancelling "${itemName}" (Stock will be auto-restored):`, 'Out of stock / Quality check failed');
    if (!reason) return;

    db.cancelOrderItem(selectedOrder.order_id, itemId, reason, 'Admin');
    refreshOrders();
  };

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No orders to export.');
      return;
    }
    const headers = [
      'Order ID',
      'Invoice Number',
      'Date Placed',
      'Classification',
      'Status',
      'Customer Name',
      'Customer Mobile',
      'City',
      'Address',
      'Items Count',
      'Garments Summary',
      'Order Type',
      'Payment Method',
      'Payment Status',
      'Subtotal',
      'Discount',
      'Delivery Charge',
      'Net Payable (INR)',
      'Assigned Delivery Partner',
      'Partner Mobile',
      'Final Bill Locked',
    ];

    const rows = filteredOrders.map((o) => {
      const itemsSummary = o.items.map((it) => `${it.product_name} (${it.size} x ${it.quantity})`).join('; ');
      const payable = db.getOrderPayableAmount(o) ?? 0;
      const isOpen = db.isOpenOrder(o);
      const isLocked = db.isOrderLocked(o) ? 'YES' : 'NO';
      return [
        `"${o.order_id}"`,
        `"${o.invoice_number || ''}"`,
        `"${new Date(o.created_at || o.order_date || Date.now()).toLocaleString('en-IN')}"`,
        `"${isOpen ? 'OPEN' : 'CLOSED'}"`,
        `"${o.order_status}"`,
        `"${(o.customer_name || '').replace(/"/g, '""')}"`,
        `"${o.mobile || ''}"`,
        `"${(o.address?.city || '').replace(/"/g, '""')}"`,
        `"${(o.address?.address || '').replace(/"/g, '""')}"`,
        o.items.length,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        `"${o.order_type || 'standard'}"`,
        `"${o.payment_method}"`,
        `"${o.payment_status}"`,
        o.subtotal || 0,
        o.discount || 0,
        o.delivery_charge || 0,
        payable,
        `"${(o.assigned_delivery_boy_name || 'Unassigned').replace(/"/g, '""')}"`,
        `"${o.assigned_delivery_boy_mobile || ''}"`,
        `"${isLocked}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `STYLE1_Orders_Manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintManifest = () => {
    printInvoiceElement('admin-orders-view', `Orders-Manifest-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (db.isOrderLocked(selectedOrder)) {
      alert('Order is locked: Final Bill & Invoice has been generated and locked. Order status and items cannot be modified.');
      return;
    }

    db.updateOrderStatus(
      selectedOrder.order_id,
      newStatus,
      'Merchant Admin Team',
      statusNotes || `Status advanced to ${newStatus}`
    );

    if (trackingNumber.trim()) {
      db.updateOrderShipping(selectedOrder.order_id, trackingNumber.trim(), courierPartner);
    }

    refreshOrders();
    setStatusNotes('');
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

  const filteredOrders = orders.filter((o) => {
    // Classification (Open vs Closed vs Delivered vs Cancelled vs Try at Home)
    if (classificationFilter === 'OPEN' && !db.isOpenOrder(o)) return false;
    if (classificationFilter === 'CLOSED' && !db.isClosedOrder(o)) return false;
    if (classificationFilter === 'DELIVERED' && o.order_status !== 'Delivered') return false;
    if (classificationFilter === 'CANCELLED' && o.order_status !== 'Cancelled') return false;
    if (classificationFilter === 'TRY_AT_HOME' && o.order_type !== 'try_at_home') return false;

    // Specific status dropdown
    if (statusFilter !== 'ALL' && o.order_status !== statusFilter) return false;

    // Order type
    if (orderTypeFilter !== 'ALL' && (o.order_type || 'standard') !== orderTypeFilter) return false;

    // Delivery Boy filter
    if (deliveryBoyFilter === 'UNASSIGNED' && o.assigned_delivery_boy_id) return false;
    if (deliveryBoyFilter === 'ASSIGNED' && !o.assigned_delivery_boy_id) return false;
    if (
      deliveryBoyFilter !== 'ALL' &&
      deliveryBoyFilter !== 'UNASSIGNED' &&
      deliveryBoyFilter !== 'ASSIGNED' &&
      o.assigned_delivery_boy_id !== deliveryBoyFilter
    ) {
      return false;
    }

    // Payment status / method
    if (paymentStatusFilter === 'PAID' && o.payment_status !== 'PAID') return false;
    if (paymentStatusFilter === 'PENDING' && o.payment_status !== 'PENDING') return false;
    if (paymentStatusFilter === 'COD' && o.payment_method !== 'COD') return false;
    if (paymentStatusFilter === 'ONLINE' && o.payment_method !== 'ONLINE') return false;

    // Date range filter
    if (dateRangeFilter !== 'ALL') {
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
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchId = (o.order_id || '').toLowerCase().includes(q);
      const matchInvoice = (o.invoice_number || '').toLowerCase().includes(q);
      const matchName = (o.customer_name || '').toLowerCase().includes(q);
      const matchMobile = (o.mobile || o.address?.mobile || '').includes(q);
      const matchCity = (o.address?.city || '').toLowerCase().includes(q);
      const matchPincode = (o.address?.pincode || '').toLowerCase().includes(q);
      const matchBoy = (o.assigned_delivery_boy_name || '').toLowerCase().includes(q);
      const matchTracking = (o.tracking_number || '').toLowerCase().includes(q);
      const matchItems = (o.items || []).some((it) => 
        (it.product_name || '').toLowerCase().includes(q) ||
        (it.shopkeeper_name || '').toLowerCase().includes(q) ||
        (it.size || '').toLowerCase().includes(q)
      );
      if (!matchId && !matchInvoice && !matchName && !matchMobile && !matchCity && !matchPincode && !matchBoy && !matchTracking && !matchItems) return false;
    }

    return true;
  });

  const allCustomersList = db.getCustomers();
  const isCustomerVip = (mobile: string) => {
    const cust = allCustomersList.find((c) => c.mobile === mobile || (c.addresses && c.addresses.some(a => a.mobile === mobile)));
    return cust?.is_vip || false;
  };

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('text/plain', orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain');
    if (!orderId) return;

    const ord = orders.find((o) => o.order_id === orderId);
    if (!ord) return;

    if (db.isOrderLocked(ord)) {
      alert('Order is locked: Final Bill & Invoice has been generated and locked. Status cannot be modified.');
      return;
    }

    let finalStatus: OrderStatus = 'Pending';
    if (targetStatus === 'New Order' || targetStatus === 'Pending') finalStatus = 'Pending';
    else if (targetStatus === 'Confirmed') finalStatus = 'Confirmed';
    else if (targetStatus === 'Processing') finalStatus = 'Processing';
    else if (targetStatus === 'Packed') finalStatus = 'Packed';
    else if (targetStatus === 'Shipped') finalStatus = 'Shipped';
    else if (targetStatus === 'Out for Delivery') finalStatus = 'Out for Delivery';
    else if (targetStatus === 'Delivered') finalStatus = 'Delivered';
    else if (targetStatus === 'Cancelled') finalStatus = 'Cancelled';

    if (ord.order_status === finalStatus) return;

    // Optimistic local refresh first
    db.updateOrderStatus(
      ord.order_id,
      finalStatus,
      'Merchant Admin Team',
      `Status updated via drag-and-drop to ${targetStatus}`
    );
    refreshOrders();

    // Ensure database-level Supabase update
    await db.updateOrderStatusAsync(
      ord.order_id,
      finalStatus,
      'Merchant Admin Team',
      `Status updated via drag-and-drop to ${targetStatus}`
    );
  };

  return (
    <div id="admin-orders-view" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-slate-900">Order History & Fulfillment Management</h1>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete order history lifecycle, track open vs. closed orders, monitor delivered counts, manage partner dispatches, and adjust billing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle Segmented Control */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setViewMode('PIPELINE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'PIPELINE'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Order Pipeline (Kanban)
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Order List (Table)
            </button>
          </div>

          <button
            id="admin-orders-export-csv-btn"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download CSV Manifest"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export CSV</span>
          </button>

          <button
            id="admin-orders-print-btn"
            onClick={handlePrintManifest}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print Manifest Sheet"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Print Manifest</span>
          </button>

          <button
            id="admin-orders-refresh-btn"
            onClick={refreshOrders}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Refresh Orders Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5 Comprehensive KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* CARD 1: Total Orders */}
        <div
          onClick={() => {
            setClassificationFilter('ALL');
            setStatusFilter('ALL');
          }}
          className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
            classificationFilter === 'ALL' && statusFilter === 'ALL'
              ? 'bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-indigo-500/30 shadow-lg scale-[1.01]'
              : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-300 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
              classificationFilter === 'ALL' && statusFilter === 'ALL' ? 'text-indigo-200/95' : 'text-slate-400'
            }`}>
              Total Orders
            </span>
            <div className={`p-1.5 rounded-lg ${
              classificationFilter === 'ALL' && statusFilter === 'ALL' ? 'bg-indigo-500/20 text-amber-300' : 'bg-slate-50 text-indigo-600'
            }`}>
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-1">
            <span className="text-3xl font-black tracking-tight">{stats.total_orders}</span>
            <span className={`text-xs font-black font-mono ${
              classificationFilter === 'ALL' && statusFilter === 'ALL' ? 'text-indigo-200' : 'text-slate-500'
            }`}>
              ₹{stats.total_revenue.toLocaleString('en-IN')}
            </span>
          </div>
          <p className={`text-[10px] mt-2 font-medium ${
            classificationFilter === 'ALL' && statusFilter === 'ALL' ? 'text-indigo-200/70' : 'text-slate-500'
          }`}>
            All lifetime customer orders
          </p>
        </div>

        {/* CARD 2: Open Orders (Active / In-Progress) */}
        <div
          onClick={() => {
            setClassificationFilter('OPEN');
            setStatusFilter('ALL');
          }}
          className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
            classificationFilter === 'OPEN'
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-850 text-white border-indigo-400/30 shadow-indigo-200/50 shadow-lg scale-[1.01]'
              : 'bg-indigo-50/40 text-indigo-950 border-indigo-100 hover:border-indigo-300 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${
              classificationFilter === 'OPEN' ? 'text-indigo-100/90' : 'text-indigo-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                classificationFilter === 'OPEN' ? 'bg-amber-300' : 'bg-indigo-600'
              } animate-pulse`}></span>
              Open Pipeline
            </span>
            <div className={`p-1.5 rounded-lg ${
              classificationFilter === 'OPEN' ? 'bg-indigo-700/55 text-amber-300' : 'bg-indigo-100/60 text-indigo-700'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-1">
            <span className="text-3xl font-black tracking-tight">{stats.open_orders}</span>
            <span className={`text-xs font-black font-mono ${
              classificationFilter === 'OPEN' ? 'text-indigo-100' : 'text-indigo-700'
            }`}>
              ₹{stats.open_revenue.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] mt-2 font-medium">
            <span className={classificationFilter === 'OPEN' ? 'text-indigo-200/80' : 'text-indigo-600/90'}>
              Active in Delivery Queue
            </span>
            {stats.unassigned_open_orders > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                classificationFilter === 'OPEN' ? 'bg-amber-400 text-slate-900' : 'bg-amber-200 text-amber-900'
              }`}>
                {stats.unassigned_open_orders} Pending
              </span>
            )}
          </div>
        </div>

        {/* CARD 3: Total Closed Orders */}
        <div
          onClick={() => {
            setClassificationFilter('CLOSED');
            setStatusFilter('ALL');
          }}
          className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
            classificationFilter === 'CLOSED'
              ? 'bg-gradient-to-br from-slate-800 to-slate-950 text-white border-slate-700/50 shadow-lg scale-[1.01]'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
              classificationFilter === 'CLOSED' ? 'text-slate-300' : 'text-slate-400'
            }`}>
              Archived & Closed
            </span>
            <div className={`p-1.5 rounded-lg ${
              classificationFilter === 'CLOSED' ? 'bg-slate-700/55 text-emerald-400' : 'bg-slate-50 text-slate-500'
            }`}>
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-1">
            <span className="text-3xl font-black tracking-tight">{stats.closed_orders}</span>
            <span className={`text-xs font-black ${
              classificationFilter === 'CLOSED' ? 'text-slate-300' : 'text-slate-500'
            }`}>
              {Math.round((stats.closed_orders / (stats.total_orders || 1)) * 100)}% Complete
            </span>
          </div>
          <p className={`text-[10px] mt-2 font-medium ${
            classificationFilter === 'CLOSED' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Delivered, Cancelled or Returned
          </p>
        </div>

        {/* CARD 4: Delivered Orders (Delivered Count) */}
        <div
          onClick={() => {
            setClassificationFilter('DELIVERED');
            setStatusFilter('ALL');
          }}
          className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
            classificationFilter === 'DELIVERED'
              ? 'bg-gradient-to-br from-emerald-600 to-teal-850 text-white border-emerald-500/30 shadow-emerald-100/50 shadow-lg scale-[1.01]'
              : 'bg-emerald-50/40 text-emerald-950 border-emerald-100 hover:border-emerald-300 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1 ${
              classificationFilter === 'DELIVERED' ? 'text-emerald-100/90' : 'text-emerald-900'
            }`}>
              Delivered Counts
            </span>
            <div className={`p-1.5 rounded-lg ${
              classificationFilter === 'DELIVERED' ? 'bg-emerald-700/55 text-amber-300' : 'bg-emerald-100/60 text-emerald-700'
            }`}>
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-1">
            <span className="text-3xl font-black tracking-tight text-teal-950 dark:text-white">
              {stats.delivered_orders}
            </span>
            <span className={`text-xs font-black font-mono ${
              classificationFilter === 'DELIVERED' ? 'text-emerald-100' : 'text-emerald-800'
            }`}>
              ₹{stats.delivered_revenue.toLocaleString('en-IN')}
            </span>
          </div>
          <p className={`text-[10px] mt-2 font-medium ${
            classificationFilter === 'DELIVERED' ? 'text-emerald-100/80' : 'text-emerald-700'
          }`}>
            Successful completed dispatches
          </p>
        </div>

        {/* CARD 5: Cancelled Orders */}
        <div
          onClick={() => {
            setClassificationFilter('CANCELLED');
            setStatusFilter('ALL');
          }}
          className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
            classificationFilter === 'CANCELLED'
              ? 'bg-gradient-to-br from-rose-600 to-rose-800 text-white border-rose-500/30 shadow-rose-100/50 shadow-lg scale-[1.01]'
              : 'bg-rose-50/30 text-rose-950 border-rose-100 hover:border-rose-300 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
              classificationFilter === 'CANCELLED' ? 'text-rose-100/90' : 'text-rose-800'
            }`}>
              Void / Cancelled
            </span>
            <div className={`p-1.5 rounded-lg ${
              classificationFilter === 'CANCELLED' ? 'bg-rose-700/55 text-rose-100' : 'bg-rose-100/60 text-rose-600'
            }`}>
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-1">
            <span className="text-3xl font-black tracking-tight text-rose-950 dark:text-white">
              {stats.cancelled_orders}
            </span>
            {stats.returned_orders > 0 && (
              <span className={`text-[10px] font-bold ${
                classificationFilter === 'CANCELLED' ? 'text-rose-200' : 'text-rose-700'
              }`}>
                +{stats.returned_orders} Returns
              </span>
            )}
          </div>
          <p className={`text-[10px] mt-2 font-medium ${
            classificationFilter === 'CANCELLED' ? 'text-rose-200/80' : 'text-rose-600'
          }`}>
            Inventory automatically restocked
          </p>
        </div>
      </div>

      {/* Global Toast Alert */}
      {assignSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{assignSuccessMsg}</span>
          </div>
          <button
            onClick={() => setAssignSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Classification Filter Tabs (Pills) */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Orders', count: stats.total_orders, icon: Package, activeBg: 'bg-white text-slate-900 border-slate-300 shadow-xs' },
          { id: 'OPEN', label: 'Open Pipeline', count: stats.open_orders, icon: Clock, activeBg: 'bg-indigo-650 text-white shadow-xs', badgeColor: 'bg-indigo-100 text-indigo-800' },
          { id: 'CLOSED', label: 'Total Closed', count: stats.closed_orders, icon: CheckCircle, activeBg: 'bg-slate-800 text-white shadow-xs', badgeColor: 'bg-slate-200 text-slate-800' },
          { id: 'DELIVERED', label: 'Delivered', count: stats.delivered_orders, icon: Truck, activeBg: 'bg-emerald-600 text-white shadow-xs', badgeColor: 'bg-emerald-100 text-emerald-800' },
          { id: 'CANCELLED', label: 'Cancelled', count: stats.cancelled_orders, icon: XCircle, activeBg: 'bg-rose-650 text-white shadow-xs', badgeColor: 'bg-rose-100 text-rose-800' },
          { id: 'TRY_AT_HOME', label: 'Try at Home', count: stats.try_at_home_orders, icon: RotateCcw, activeBg: 'bg-amber-600 text-slate-950 shadow-xs', badgeColor: 'bg-amber-100 text-amber-900' },
        ].map((tab) => {
          const isActive = classificationFilter === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setClassificationFilter(tab.id as any);
                setStatusFilter('ALL');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition-all duration-150 whitespace-nowrap cursor-pointer border ${
                isActive
                  ? `${tab.activeBg} border-transparent`
                  : 'text-slate-600 border-transparent hover:bg-white hover:text-slate-900 hover:shadow-2xs'
              }`}
            >
              <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'opacity-100' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-black/10 text-current'
                    : tab.badgeColor || 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Multi-Criteria Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Real-time Search input */}
          <div className="relative min-w-[280px] flex-1">
            <input
              id="admin-orders-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID, customer, mobile, city, shopkeeper or item..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 font-semibold transition-all placeholder:text-slate-400 text-slate-800"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider hidden md:inline">Date:</span>
              <select
                id="admin-orders-date-range-filter"
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value as any)}
                className="px-3.5 py-2 text-xs border border-slate-200 bg-slate-50/80 hover:bg-slate-50 rounded-xl font-bold bg-white cursor-pointer outline-hidden focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all text-slate-700"
              >
                <option value="ALL">🗓️ All Time</option>
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="THIS_MONTH">This Month</option>
              </select>
            </div>

            {/* Delivery Boy Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider hidden md:inline">Fleet:</span>
              <select
                id="admin-orders-delivery-filter"
                value={deliveryBoyFilter}
                onChange={(e) => setDeliveryBoyFilter(e.target.value)}
                className="px-3.5 py-2 text-xs border border-slate-200 bg-slate-50/80 hover:bg-slate-50 rounded-xl font-bold bg-white cursor-pointer outline-hidden focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all text-slate-700 max-w-[190px] truncate"
              >
                <option value="ALL">🚚 All Fleet</option>
                <option value="UNASSIGNED">⚠️ Unassigned ({orders.filter((o) => !o.assigned_delivery_boy_id).length})</option>
                <option value="ASSIGNED">🚀 Assigned ({orders.filter((o) => !!o.assigned_delivery_boy_id).length})</option>
                <optgroup label="Filter by Delivery Associate">
                  {activeDeliveryBoys.map((b) => (
                    <option key={b.id} value={b.id}>
                      👤 {b.name} ({b.vehicle_type})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Payment Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider hidden md:inline">Payment:</span>
              <select
                id="admin-orders-payment-filter"
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                className="px-3.5 py-2 text-xs border border-slate-200 bg-slate-50/80 hover:bg-slate-50 rounded-xl font-bold bg-white cursor-pointer outline-hidden focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all text-slate-700"
              >
                <option value="ALL">💵 All Payments</option>
                <option value="PAID">Paid Only</option>
                <option value="PENDING">Pending (COD)</option>
                <option value="COD">COD Orders</option>
                <option value="ONLINE">Online Prepaid</option>
              </select>
            </div>

            {/* Specific Status */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider hidden md:inline">Status:</span>
              <select
                id="admin-orders-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2 text-xs border border-slate-200 bg-slate-50/80 hover:bg-slate-50 rounded-xl font-bold bg-white cursor-pointer outline-hidden focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all text-slate-700"
              >
                <option value="ALL">🔖 All Statuses</option>
                {allStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter summary indicator */}
        {(classificationFilter !== 'ALL' || dateRangeFilter !== 'ALL' || deliveryBoyFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || search || statusFilter !== 'ALL') && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders matching active filters
            </span>
            <button
              onClick={() => {
                setClassificationFilter('ALL');
                setStatusFilter('ALL');
                setDateRangeFilter('ALL');
                setDeliveryBoyFilter('ALL');
                setPaymentStatusFilter('ALL');
                setSearch('');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {viewMode === 'PIPELINE' ? (
        <div id="admin-orders-pipeline" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              Drag & Drop Orders to Shift Lifecycle Stages
            </h2>
            <div className="text-[11px] font-bold text-slate-500">
              Showing {filteredOrders.length} filtered orders
            </div>
          </div>

          {/* Kanban Board Container */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 overflow-x-auto pb-6 pt-1 min-w-[1250px]">
            {[
              { id: 'New Order', label: 'New Order 🆕', statuses: ['Pending'], headerBg: 'bg-slate-100 text-slate-800 border-slate-200' },
              { id: 'Confirmed', label: 'Confirmed ✅', statuses: ['Confirmed'], headerBg: 'bg-blue-100/85 text-blue-900 border-blue-200' },
              { id: 'Processing', label: 'Processing ⚙️', statuses: ['Processing'], headerBg: 'bg-indigo-100/85 text-indigo-900 border-indigo-200' },
              { id: 'Packed', label: 'Packed 📦', statuses: ['Packed'], headerBg: 'bg-purple-100/85 text-purple-900 border-purple-200' },
              { id: 'Shipped', label: 'Shipped 🚚', statuses: ['Shipped', 'Out for Delivery'], headerBg: 'bg-cyan-100/90 text-cyan-900 border-cyan-200' },
              { id: 'Delivered', label: 'Delivered 🎉', statuses: ['Delivered'], headerBg: 'bg-emerald-100/85 text-emerald-900 border-emerald-200' },
              { id: 'Cancelled', label: 'Cancelled ❌', statuses: ['Cancelled'], headerBg: 'bg-rose-100/85 text-rose-900 border-rose-200' },
            ].map((stage) => {
              const stageOrders = filteredOrders.filter((o) => {
                const normalizedStatus = o.order_status === 'Pending' ? 'New Order' : o.order_status;
                return stage.statuses.includes(normalizedStatus) || (stage.id === 'New Order' && o.order_status === 'Pending');
              });

              return (
                <div
                  key={stage.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className="flex flex-col min-h-[550px] w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-3 shadow-3xs hover:bg-slate-100/50 transition-colors"
                >
                  {/* Column Header */}
                  <div className={`flex items-center justify-between p-2.5 rounded-xl border ${stage.headerBg} font-black text-xs mb-3 shadow-3xs`}>
                    <span className="truncate">{stage.label}</span>
                    <span className="bg-black/10 px-2 py-0.5 rounded-full text-[10px]">
                      {stageOrders.length}
                    </span>
                  </div>

                  {/* Column Body / Drop area */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                    {stageOrders.length === 0 ? (
                      <div className="h-32 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-center text-[10px] text-slate-400 font-bold p-3 bg-white/40">
                        Drag orders here
                      </div>
                    ) : (
                      stageOrders.map((ord) => {
                        const isVip = isCustomerVip(ord.mobile || '');
                        const payable = db.getOrderPayableAmount(ord) ?? 0;
                        const dateStr = new Date(ord.created_at || ord.order_date || Date.now()).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <div
                            key={ord.order_id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ord.order_id)}
                            className={`p-3.5 bg-white border rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-grab active:cursor-grabbing relative ${
                              isVip ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50/5' : 'border-slate-200'
                            }`}
                          >
                            {/* Special Customer Badge */}
                            {isVip && (
                              <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-3xs tracking-wider uppercase flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-white animate-ping"></span>
                                VIP Priority
                              </div>
                            )}

                            {/* Order Header info */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span className="font-mono text-[10px] text-indigo-700 font-extrabold">
                                {ord.order_id}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold font-mono">
                                {dateStr}
                              </span>
                            </div>

                            {/* Customer Profile Row */}
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-indigo-700 flex items-center justify-center font-black text-xs uppercase shadow-3xs shrink-0">
                                {(ord.customer_name || 'C')[0]}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-900 text-xs truncate leading-tight">
                                  {ord.customer_name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono leading-none mt-0.5">
                                  +91 {ord.mobile}
                                </p>
                              </div>
                            </div>

                            {/* Items / Product Details */}
                            <div className="space-y-1 mb-2 text-[10px]">
                              <p className="text-slate-400 font-bold uppercase text-[8px] tracking-wide">
                                Ordered Items ({ord.items?.length || 0})
                              </p>
                              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                {(ord.items || []).map((it, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 py-0.5">
                                    {it.image_url && (
                                      <img
                                        src={it.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                                        alt={it.product_name}
                                        referrerPolicy="no-referrer"
                                        className="w-5 h-5 rounded object-cover shadow-3xs shrink-0"
                                      />
                                    )}
                                    <span className="font-bold text-slate-800 truncate flex-1 leading-tight">
                                      {it.product_name}
                                    </span>
                                    <span className="text-slate-500 shrink-0 font-bold text-[9px]">
                                      {it.size} x {it.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Stats Line (Total, Payment Status) */}
                            <div className="grid grid-cols-2 gap-2 py-1.5 bg-slate-50 rounded-lg text-center mb-2.5 border border-slate-100">
                              <div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase block leading-none">Payable</span>
                                <span className="text-[11px] font-black text-slate-900 font-mono">
                                  ₹{payable.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase block leading-none">Payment</span>
                                <span className={`text-[8px] font-black rounded px-1.5 py-0.2 uppercase ${
                                  ord.payment_status === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {ord.payment_status}
                                </span>
                              </div>
                            </div>

                            {/* Delivery & Staff Row */}
                            <div className="flex items-center justify-between text-[10px] mb-3 text-slate-600">
                              <span className="flex items-center gap-1 font-semibold truncate max-w-[130px]">
                                <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">
                                  {ord.assigned_delivery_boy_name ? (
                                    <strong className="text-indigo-800 font-extrabold">{ord.assigned_delivery_boy_name}</strong>
                                  ) : (
                                    'Unassigned'
                                  )}
                                </span>
                              </span>
                              <span className={`text-[8px] font-black px-1 py-0.2 rounded ${
                                ord.order_type === 'try_at_home'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}>
                                {ord.order_type === 'try_at_home' ? '🏠 Try' : '📦 Std'}
                              </span>
                            </div>

                            {/* Quick Actions Footer */}
                            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
                              <button
                                onClick={() => setFullDetailOrder(ord)}
                                className="flex-1 py-1 px-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] rounded-lg cursor-pointer transition-colors text-center"
                              >
                                View Details
                              </button>

                              <select
                                value={ord.order_status}
                                onChange={(e) => {
                                  const selectStatus = e.target.value as OrderStatus;
                                  if (db.isOrderLocked(ord)) {
                                    alert('Order is locked: Final Bill & Invoice has been generated and locked. Status cannot be modified.');
                                    return;
                                  }
                                  db.updateOrderStatus(
                                    ord.order_id,
                                    selectStatus,
                                    'Merchant Admin Team',
                                    `Status updated via quick status selector to ${selectStatus}`
                                  );
                                  refreshOrders();
                                }}
                                className="px-1 py-1 border border-slate-200 hover:border-slate-300 rounded-lg text-[9px] font-extrabold text-slate-700 cursor-pointer outline-hidden bg-white"
                              >
                                <option value="Pending">New Order</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Processing">Processing</option>
                                <option value="Packed">Packed</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>

                              <a
                                href={`tel:${ord.mobile}`}
                                className="p-1 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer border border-slate-200 shrink-0"
                                title="Contact Customer"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Selected Order Details Panel - Placed first to appear on the left */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit max-h-[calc(100vh-120px)] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 space-y-3.5 text-[11px] font-semibold">
          {selectedOrder ? (
            <div className="space-y-3.5">
              {/* Order Top Bar */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewingInvoiceOrder(selectedOrder)}
                      className="font-black text-slate-900 hover:text-indigo-600 hover:underline text-[11px] font-mono cursor-pointer text-left"
                      title="Click to view Invoice"
                    >
                      {selectedOrder.order_id}
                    </button>
                    {selectedOrder.order_type === 'try_at_home' && (
                      <span className="text-[8px] font-bold bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded border border-indigo-200">
                        Try at Home
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Placed on {new Date(selectedOrder.created_at || selectedOrder.order_date || Date.now()).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    id={`panel-view-invoice-btn-${selectedOrder.order_id}`}
                    onClick={() => setViewingInvoiceOrder(selectedOrder)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="View Tax Invoice & Details"
                  >
                    <FileText className="w-3 h-3 text-amber-400" />
                    <span>Invoice</span>
                  </button>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      statusColors[selectedOrder.order_status]
                    }`}
                  >
                    {selectedOrder.order_status}
                  </span>
                </div>
              </div>

              {/* Delivery Partner (Delivery Boy) Assignment Card */}
              {(() => {
                const isSelectedLocked = db.isOrderDeliveryLocked(selectedOrder);
                return (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-indigo-950 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Truck className="w-3 h-3 text-indigo-600" />
                        <span>Delivery Partner Assignment</span>
                      </h4>
                      {isSelectedLocked ? (
                        <span className="text-[8px] font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded-full border border-amber-300 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5 text-amber-700" />
                          Locked
                        </span>
                      ) : selectedOrder.assigned_delivery_boy_name ? (
                        <span className="text-[8px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full border border-emerald-200 flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                          Assigned
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full border border-amber-200">
                          Unassigned
                        </span>
                      )}
                    </div>

                    {/* Prominent Lock Notification Banner */}
                    {isSelectedLocked && (
                      <div className="p-2 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 text-[10px] flex items-start gap-1.5 shadow-2xs">
                        <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-amber-950">Assignment Locked</p>
                          <p className="text-[9px] text-amber-850 mt-0.5 leading-relaxed">
                            {db.getDeliveryLockReason(selectedOrder)}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedOrder.assigned_delivery_boy_name ? (
                      <div className="p-2 bg-white rounded-lg border border-indigo-100 space-y-1.5 text-[10px] shadow-2xs">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                              {selectedOrder.assigned_delivery_boy_name}
                            </p>
                            <a
                              href={`tel:+91${selectedOrder.assigned_delivery_boy_mobile}`}
                              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 font-mono text-[10px] font-bold mt-0.5"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              +91 {selectedOrder.assigned_delivery_boy_mobile}
                            </a>
                          </div>
                          {isSelectedLocked ? (
                            <span
                              className="px-2 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded flex items-center gap-0.5 cursor-not-allowed"
                              title={db.getDeliveryLockReason(selectedOrder) || 'Locked'}
                            >
                              <Lock className="w-2.5 h-2.5 text-amber-600" />
                              Locked
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleUnassignDeliveryBoy}
                              className="px-2 py-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer"
                              title="Unassign this delivery boy from the order"
                            >
                              Unassign
                            </button>
                          )}
                        </div>

                        {selectedOrder.assigned_at && (
                          <p className="text-[9px] text-slate-400 pt-1 border-t border-slate-100">
                            Assigned on {new Date(selectedOrder.assigned_at).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-200 text-amber-900 text-[10px] flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">No delivery personnel assigned</p>
                          <p className="text-[9px] text-amber-850 mt-0.5">
                            Select an associate below to dispatch doorstep delivery.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Re-assignment or Locked notice */}
                    {isSelectedLocked ? (
                      <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-[10px] flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-[9px]">
                          Delivery partner change is permanently locked.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-0.5">
                        <label className="text-[9px] font-bold text-slate-700 block">
                          {selectedOrder.assigned_delivery_boy_name ? 'Re-assign Partner' : 'Select Delivery Partner'}
                        </label>
                        <div className="flex gap-1.5">
                          <select
                            id="assign-delivery-boy-select"
                            value={assignBoyId}
                            onChange={(e) => setAssignBoyId(e.target.value)}
                            className="flex-1 px-2 py-1.5 text-[10px] border border-indigo-300 rounded bg-white font-semibold outline-hidden focus:border-indigo-600"
                          >
                            <option value="">-- Choose Associate --</option>
                            {activeDeliveryBoys.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name} (+91 {b.mobile}) - {b.vehicle_type}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={handleAssignDeliveryBoy}
                            disabled={!assignBoyId || assignBoyId === selectedOrder.assigned_delivery_boy_id}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-[10px] rounded transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                          >
                            {selectedOrder.assigned_delivery_boy_name ? 'Re-assign' : 'Assign'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Delivery Address */}
              <div className="text-[10px] space-y-0.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-400 uppercase text-[9px] flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3 text-indigo-500" />
                  <span>Delivery Destination</span>
                </span>
                <p className="font-extrabold text-slate-900 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{selectedOrder.address.name}</span>
                </p>
                <p className="text-slate-500 pl-4">{selectedOrder.address.address}</p>
                <p className="text-slate-500 pl-4">
                  {selectedOrder.address.city}, {selectedOrder.address.state} -{' '}
                  {selectedOrder.address.pincode}
                </p>
                <p className="font-mono text-slate-600 font-bold pt-0.5 pl-4 flex items-center gap-1">
                  <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                  <span>+91 {selectedOrder.address.mobile}</span>
                </p>
              </div>

              {/* Order Items List with Item-level Status & Admin Cancellation */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-400 uppercase text-[9px] flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3 text-indigo-500" />
                    <span>Garments ({selectedOrder.items.length})</span>
                  </span>
                  <span className="text-[10px] font-black text-slate-900 flex items-center gap-0.5">
                    <Coins className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Payable: ₹{(db.getOrderPayableAmount(selectedOrder) ?? 0).toLocaleString('en-IN')}</span>
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map((it) => {
                    const isCancelled = it.item_status === 'Cancelled';
                    return (
                      <div
                        key={it.id}
                        className={`p-2 rounded-lg border transition-colors ${
                          isCancelled
                            ? 'bg-rose-50/50 border-rose-200 opacity-80'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={it.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                            alt={it.product_name}
                            className="w-7 h-9 object-cover rounded border border-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-[10px] font-bold truncate ${isCancelled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {it.product_name}
                              </p>
                              <div className="flex items-center gap-1 shrink-0">
                                <span
                                  className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded ${
                                    isCancelled
                                      ? 'bg-rose-100 text-rose-850'
                                      : 'bg-emerald-100 text-emerald-850'
                                  }`}
                                >
                                  {it.item_status || selectedOrder.order_status}
                                </span>
                                {it.return_status && (
                                  <span
                                    className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded border ${
                                      it.return_status === 'Replace Item' || it.return_status === 'Replace Completed'
                                        ? 'bg-purple-100 text-purple-900 border-purple-200'
                                        : it.return_status === 'Return Completed'
                                        ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                                        : it.return_status === 'Return Accepted'
                                        ? 'bg-blue-100 text-blue-900 border-blue-200'
                                        : 'bg-amber-100 text-amber-900 border-amber-200'
                                    }`}
                                  >
                                    {it.return_status === 'Return Requested' ? 'Return Item' : it.return_status}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[9px] text-slate-500">
                              Size: <strong>{it.size}</strong> • Qty: {it.quantity}
                            </p>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className={`text-[10px] font-extrabold ${isCancelled ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                ₹{(it.price ?? 0).toLocaleString('en-IN')}
                              </p>

                              {!isCancelled &&
                                !db.isOrderLocked(selectedOrder) &&
                                selectedOrder.order_status !== 'Delivered' &&
                                selectedOrder.order_status !== 'Cancelled' && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdminCancelItem(it.id, it.product_name)}
                                    className="text-[9px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                                  >
                                    Cancel Item
                                  </button>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Product Return & Replacement Pickups Section */}
              {returns.filter((r) => r.order_id === selectedOrder.order_id).length > 0 && (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 uppercase text-[9px] flex items-center gap-1">
                      <RotateCcw className="w-2.5 h-2.5 text-indigo-600" />
                      <span>Returns & Replacements</span>
                    </span>
                    <span className="text-[8px] font-bold text-teal-700">
                      Assigned to Same Delivery Boy
                    </span>
                  </div>
                  {returns
                    .filter((r) => r.order_id === selectedOrder.order_id)
                    .map((ret) => {
                      const isReplace = ret.request_type === 'replace' || ret.status === 'Replace Item' || ret.status === 'Replace Completed';
                      return (
                        <div
                          key={ret.id}
                          className={`p-2 bg-white rounded border space-y-1 text-[9px] ${
                            isReplace ? 'border-purple-200' : 'border-amber-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 truncate max-w-[150px]">
                              {isReplace ? 'Exchange:' : 'Return:'} {ret.product_name || ret.item_name}
                            </span>
                            <span
                              className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded border ${
                                ret.status === 'Return Completed'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : ret.status === 'Replace Completed'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                                  : ret.status === 'Replace Item'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                                  : ret.status === 'Return Accepted'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                            >
                              {ret.status === 'Return Requested' ? 'Return Item' : ret.status}
                            </span>
                          </div>
                          {isReplace ? (
                            <p className="text-[8px] text-purple-800 font-semibold">
                              Exchange Piece: Size {ret.replacement_size || 'M'} • <strong>Bill Unchanged</strong>
                            </p>
                          ) : (
                            <p className="text-[8px] text-amber-850">
                              Refund: ₹{ret.return_amount}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Status Timeline History */}
              <div>
                <span className="font-bold text-slate-400 uppercase text-[9px] flex items-center gap-1.5 mb-1.5">
                  <Activity className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>Status History Trail</span>
                </span>
                <div className="space-y-2.5 max-h-36 overflow-y-auto pl-1">
                  {selectedOrder.status_history.map((sh) => (
                    <div key={sh.id} className="text-[9px] border-l border-indigo-200 pl-3 pb-1 relative last:pb-0">
                      <div className="absolute -left-[3.5px] top-1 w-1.5 h-1.5 rounded-full bg-indigo-600 ring-2 ring-indigo-50 border border-white"></div>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800">{sh.status}</span>
                        <span className="text-[8px] text-slate-400 font-mono font-bold">
                          {new Date(sh.changed_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[8px]">By: {sh.changed_by}</p>
                      {sh.notes && (
                        <p className="text-slate-500 italic text-[8px] mt-0.5">
                          Note: {sh.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Management Studio Button */}
              <button
                id={`panel-open-studio-btn-${selectedOrder.order_id}`}
                onClick={() => setFullDetailOrder(selectedOrder)}
                className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-[10px] rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-indigo-500"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Open Full Order Management Studio</span>
              </button>

              {/* Status Update Form */}
              {(() => {
                const isFinalBillLocked = db.isOrderLocked(selectedOrder);
                return (
                  <form
                    onSubmit={handleUpdateStatus}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[10px]"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-[9px] uppercase tracking-wider flex items-center gap-1">
                        <Truck className="w-3 h-3 text-indigo-600" />
                        <span>Update Order Workflow</span>
                      </h4>
                      {isFinalBillLocked && (
                        <span className="text-[8px] font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5 text-amber-700" />
                          Locked
                        </span>
                      )}
                    </div>

                    {isFinalBillLocked && (
                      <div className="p-1.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[8px]">
                        Final Bill generated. Workflow is locked.
                      </div>
                    )}

                    <div>
                      <label className="text-[9px] font-bold text-slate-700 block mb-0.5">
                        Order Status
                      </label>
                      <select
                        id="admin-update-order-status-select"
                        disabled={isFinalBillLocked}
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                        className="w-full px-2 py-1 text-[10px] border border-slate-300 rounded font-bold bg-white outline-hidden focus:border-indigo-600 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {allStatuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[9px] font-bold text-slate-700 block mb-0.5">
                          Courier Partner
                        </label>
                        <input
                          type="text"
                          disabled={isFinalBillLocked}
                          value={courierPartner}
                          onChange={(e) => setCourierPartner(e.target.value)}
                          placeholder="BlueDart"
                          className="w-full px-2 py-1 text-[10px] border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-700 block mb-0.5">
                          AWB Tracking #
                        </label>
                        <input
                          type="text"
                          disabled={isFinalBillLocked}
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="BD-98274"
                          className="w-full px-2 py-1 text-[10px] border border-slate-300 rounded bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-700 block mb-0.5">
                        Notes (Optional)
                      </label>
                      <input
                        type="text"
                        disabled={isFinalBillLocked}
                        value={statusNotes}
                        onChange={(e) => setStatusNotes(e.target.value)}
                        placeholder="Hub dispatch"
                        className="w-full px-2 py-1 text-[10px] border border-slate-300 rounded bg-white"
                      />
                    </div>

                    <button
                      id="admin-save-order-status-btn"
                      type="submit"
                      disabled={isFinalBillLocked}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-[10px] rounded shadow-2xs transition-colors cursor-pointer"
                    >
                      {isFinalBillLocked ? 'Locked' : 'Save Status & Notify'}
                    </button>
                  </form>
                );
              })()}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <Package className="w-8 h-8 mx-auto mb-1.5 opacity-30" />
              <p className="text-[10px] font-bold">Select an order to view and manage fulfillment</p>
            </div>
          )}
        </div>

        {/* Table - Placed second to appear on the right */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-900 to-slate-950 text-slate-200 font-extrabold uppercase text-[10px] tracking-widest border-b border-slate-800">
                  <th className="py-4 px-4 pl-5">Order ID</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Items</th>
                  <th className="py-4 px-4 min-w-[220px]">Assign Delivery Partner</th>
                  <th className="py-4 px-4">Payment</th>
                  <th className="py-4 px-4">Payable</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right pr-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 font-bold text-sm">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="w-8 h-8 text-slate-300" />
                        <span>No orders found matching search or filter criteria.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const isSelected = selectedOrder?.order_id === o.order_id;
                    return (
                      <tr
                        key={o.id}
                        onClick={() => handleSelectOrder(o)}
                        className={`cursor-pointer transition-all duration-150 border-l-4 ${
                          isSelected 
                            ? 'bg-indigo-50/70 border-indigo-600 shadow-2xs' 
                            : 'hover:bg-slate-50/80 border-transparent'
                        }`}
                      >
                        <td className="p-3.5 font-mono font-bold text-indigo-700">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFullDetailOrder(o);
                              }}
                              className="hover:underline text-indigo-700 hover:text-indigo-950 font-bold flex items-center gap-1 cursor-pointer text-sm"
                              title="Click to Open Full Order Management Studio"
                            >
                              <Hash className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>{o.order_id}</span>
                            </button>
                            {db.isOpenOrder(o) ? (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5 text-indigo-600 animate-pulse" />
                                Open
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5 text-slate-500" />
                                Closed
                              </span>
                            )}
                            {o.order_type === 'try_at_home' && (
                              <>
                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200 inline-flex items-center gap-1">
                                  <Home className="w-2.5 h-2.5 text-indigo-600" />
                                  <span>Try at Home</span>
                                </span>
                                {o.order_status === 'Delivered' && (
                                  <TryAtHomeCountdown order={o} compact />
                                )}
                              </>
                            )}
                            {o.items.some((it) => it.return_status) && (
                              <span className="text-[10px] font-bold bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200 inline-flex items-center gap-0.5">
                                <RotateCcw className="w-2.5 h-2.5 text-purple-600" />
                                Return
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              {new Date(o.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingInvoiceOrder(o);
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer underline decoration-dotted flex items-center gap-1"
                              title="Click to view Invoice"
                            >
                              <FileText className="w-3 h-3 text-indigo-500 shrink-0" />
                              {o.invoice_number || `INV-${o.order_id.replace(/^ORD-/, '')}`}
                            </button>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <p className="font-extrabold text-slate-900 text-sm leading-tight">{o.customer_name}</p>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600 font-mono text-xs font-bold mt-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>+91 {o.mobile}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{o.address?.city || 'Bengaluru'}</span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 font-extrabold text-slate-800 text-xs">
                              <ShoppingBag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>{o.items.length} {o.items.length === 1 ? 'Garment' : 'Garments'}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 max-w-[190px]">
                              {o.items.slice(0, 2).map((it, idx) => (
                                <span key={idx} className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-sm font-bold flex items-center gap-0.5">
                                  <Tag className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  {it.product_name.split(' ')[0]} ({it.size})
                                </span>
                              ))}
                              {o.items.length > 2 && (
                                <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm font-black border border-indigo-100/40">
                                  +{o.items.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Interactive Assign Delivery Boy Selector */}
                        <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                          {db.isOrderDeliveryLocked(o) ? (
                            <div className="space-y-1">
                              <div
                                className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-slate-100 border border-slate-300/80 rounded-lg text-sm shadow-2xs cursor-not-allowed"
                                title={db.getDeliveryLockReason(o) || 'Locked: Delivery partner cannot be changed'}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span className="font-extrabold truncate text-slate-900">
                                    {o.assigned_delivery_boy_name || 'Assigned Partner'}
                                  </span>
                                </div>
                                <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                                  Locked
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                                {o.assigned_delivery_boy_mobile && (
                                  <span>+91 {o.assigned_delivery_boy_mobile} • </span>
                                )}
                                <span className="font-extrabold text-amber-700">
                                  {o.order_status === 'Delivered'
                                    ? (o.payment_method === 'COD' ? 'COD Delivered' : 'Delivered')
                                    : 'Paid & Assigned'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <select
                                id={`select-delivery-boy-${o.order_id}`}
                                value={o.assigned_delivery_boy_id || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '__unassign__') {
                                    handleQuickUnassign(o.order_id);
                                  } else if (val) {
                                    handleQuickAssign(o.order_id, val);
                                  }
                                }}
                                className={`w-full max-w-[240px] text-sm font-bold px-2.5 py-2 rounded-lg border transition-all cursor-pointer outline-hidden shadow-2xs ${
                                  o.assigned_delivery_boy_id
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-950 hover:bg-indigo-100'
                                    : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                                  }`}
                              >
                                <option value="">⚡ Select Delivery Boy</option>
                                {activeDeliveryBoys.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.name} ({b.vehicle_type} • {b.assigned_area || b.city || 'Hub'})
                                  </option>
                                ))}
                                {o.assigned_delivery_boy_id && (
                                  <option value="__unassign__">❌ Unassign Delivery Boy</option>
                                )}
                              </select>

                              {o.assigned_delivery_boy_name ? (
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono mt-1">
                                  <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span className="font-bold text-slate-800">{o.assigned_delivery_boy_name}</span>
                                  <span>• +91 {o.assigned_delivery_boy_mobile}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-amber-700 font-extrabold flex items-center gap-1 mt-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                  Unassigned • Select above
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                            {o.payment_method === 'COD' ? (
                              <>
                                <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Cash on Delivery</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Online (Paid)</span>
                              </>
                            )}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 mt-1.5 ${
                              o.payment_status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.payment_status === 'PAID' || o.order_status === 'Delivered' ? (
                              <Lock className="w-2.5 h-2.5 text-emerald-700" />
                            ) : (
                              <AlertCircle className="w-2.5 h-2.5 text-amber-700" />
                            )}
                            <span>{o.payment_status}</span>
                          </span>
                        </td>

                        <td className="p-3.5 font-black text-slate-900 text-base">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400 font-bold font-sans">₹</span>
                            <span>{(db.getOrderPayableAmount(o) ?? 0).toLocaleString('en-IN')}</span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`text-xs font-extrabold px-2.5 py-1 rounded-full uppercase ${
                                statusColors[o.order_status] || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {o.order_status}
                            </span>
                            {db.isOrderLocked(o) && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 text-amber-900 bg-amber-100 border border-amber-300 rounded inline-flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5 text-amber-700" />
                                Final Bill Locked
                              </span>
                            )}
                            {(o.has_replaced_items || (o.items || []).some(it => it.is_replace || (it.replaced_quantity ?? 0) > 0)) && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 text-purple-900 bg-purple-100 border border-purple-300 rounded inline-flex items-center gap-0.5">
                                <RotateCcw className="w-2.5 h-2.5 text-purple-700" />
                                Replace Item Order
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 text-right pr-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              id={`table-manage-btn-${o.order_id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFullDetailOrder(o);
                              }}
                              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-[11px] flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
                              title="Open Full Order Management Studio"
                            >
                              <Maximize2 className="w-3.5 h-3.5 text-amber-350" />
                              <span>Manage</span>
                            </button>
                            <button
                              id={`table-invoice-btn-${o.order_id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingInvoiceOrder(o);
                              }}
                              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-xl text-[11px] flex items-center gap-1.5 border border-indigo-100 transition-all duration-150 shadow-2xs cursor-pointer"
                              title="View Tax Invoice & Details"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Invoice</span>
                            </button>
                            <button
                              id={`view-order-btn-${o.order_id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectOrder(o);
                              }}
                              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold rounded-xl text-[11px] hover:border-slate-300 hover:text-slate-950 transition-all duration-150 shadow-2xs cursor-pointer"
                              title="Quick View Side Panel"
                            >
                              Quick
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    )}

      {/* Detailed Order / Invoice Modal */}
      {viewingInvoiceOrder && (
        <OrderInvoiceModal
          order={viewingInvoiceOrder}
          onClose={() => setViewingInvoiceOrder(null)}
          userRole="Admin"
          onBillGenerated={(updated) => {
            setOrders(db.getOrders());
            setViewingInvoiceOrder(updated);
            if (selectedOrder?.order_id === updated.order_id) {
              setSelectedOrder(updated);
            }
            if (fullDetailOrder?.order_id === updated.order_id) {
              setFullDetailOrder(updated);
            }
          }}
        />
      )}

      {/* Comprehensive Full Detail Order Management Modal */}
      {fullDetailOrder && (
        <AdminOrderFullDetailModal
          order={fullDetailOrder}
          onClose={() => setFullDetailOrder(null)}
          onOrderUpdated={(updated) => {
            refreshOrders();
            setFullDetailOrder(updated);
            if (selectedOrder?.order_id === updated.order_id) {
              setSelectedOrder(updated);
            }
          }}
          onOpenInvoice={(o) => {
            setViewingInvoiceOrder(o);
          }}
        />
      )}
    </div>
  );
};
