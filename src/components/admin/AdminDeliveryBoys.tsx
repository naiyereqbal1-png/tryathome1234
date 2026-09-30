import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Package,
  MapPin,
  Calendar,
  AlertCircle,
  Clock,
  RotateCcw,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Layers,
  Coins,
  CheckCircle2,
  ExternalLink,
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { DeliveryBoy, Order, ProductReturn, DeliveryBoyDetailedManagement } from '../../types';
import { db } from '../../services/db';
import { OrderInvoiceModal } from '../common/OrderInvoiceModal';

export const AdminDeliveryBoys: React.FC = () => {
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>(db.getDeliveryBoys());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoy, setEditingBoy] = useState<DeliveryBoy | null>(null);
  const [viewingOrdersBoy, setViewingOrdersBoy] = useState<DeliveryBoy | null>(null);
  const [orderToAssignId, setOrderToAssignId] = useState('');
  
  // Tab within delivery boy individual modal
  const [partnerModalTab, setPartnerModalTab] = useState<'DELIVERED_ITEMS' | 'RETURNED_ITEMS' | 'DISPATCHES'>('DELIVERED_ITEMS');
  
  // Top-level main view switch: Fleet directory vs All Boys Management Details
  const [mainViewMode, setMainViewMode] = useState<'FLEET_DIRECTORY' | 'ALL_BOYS_MANAGEMENT'>('FLEET_DIRECTORY');
  
  // Expanded delivery boy row in All Boys Management view
  const [expandedBoyId, setExpandedBoyId] = useState<string | null>(null);
  
  // Date range filter for performance view
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState<Order | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    vehicle_number: '',
    vehicle_type: 'Motorcycle' as DeliveryBoy['vehicle_type'],
    city: 'Bengaluru',
    status: 'Active' as DeliveryBoy['status'],
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshData = () => {
    setDeliveryBoys(db.getDeliveryBoys());
    if (viewingOrdersBoy) {
      const refreshed = db.getDeliveryBoyById(viewingOrdersBoy.id);
      setViewingOrdersBoy(refreshed || null);
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      refreshData();
    };
    window.addEventListener('style1_data_changed', handleStorageChange);
    return () => {
      window.removeEventListener('style1_data_changed', handleStorageChange);
    };
  }, [viewingOrdersBoy]);

  // Helpers
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Not recorded';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Not recorded';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleOpenAdd = () => {
    setEditingBoy(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      password: 'delivery123',
      vehicle_number: '',
      vehicle_type: 'Motorcycle',
      city: 'Bengaluru',
      status: 'Active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (boy: DeliveryBoy) => {
    setEditingBoy(boy);
    setFormData({
      name: boy.name,
      mobile: boy.mobile,
      email: boy.email || '',
      password: boy.password || 'delivery123',
      vehicle_number: boy.vehicle_number || '',
      vehicle_type: boy.vehicle_type || 'Motorcycle',
      city: boy.city || boy.assigned_area || 'Bengaluru',
      status: boy.status === 'Active' || boy.status === 'ACTIVE' ? 'Active' : 'Inactive',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Delivery personnel name is required');
      return;
    }
    if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      setFormError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (!formData.vehicle_number.trim()) {
      setFormError('Vehicle registration number is required');
      return;
    }

    setIsSaving(true);

    try {
      if (editingBoy) {
        await db.updateDeliveryBoyAsync(editingBoy.id, {
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          vehicle_number: formData.vehicle_number.trim(),
          vehicle_type: formData.vehicle_type,
          city: formData.city.trim(),
          status: formData.status,
        });
      } else {
        const existing = deliveryBoys.find(
          (b) => b.mobile === formData.mobile.trim()
        );
        if (existing) {
          setFormError('A delivery partner with this mobile number already exists');
          setIsSaving(false);
          return;
        }

        await db.addDeliveryBoyAsync({
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
          email: formData.email.trim(),
          password: formData.password.trim() || 'delivery123',
          vehicle_number: formData.vehicle_number.trim(),
          vehicle_type: formData.vehicle_type,
          city: formData.city.trim(),
          status: formData.status,
        });
      }

      setIsModalOpen(false);
      refreshData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save delivery boy associate. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from delivery partners?`)) return;
    setDeletingId(id);
    try {
      await db.deleteDeliveryBoyAsync(id);
      refreshData();
    } catch (err: any) {
      console.error("[Admin Delivery Boys] Delete error:", err);
      alert('Failed to remove delivery partner: ' + (err.message || 'database error'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (boy: DeliveryBoy) => {
    const isAct = boy.status === 'Active' || boy.status === 'ACTIVE';
    const nextStatus = isAct ? 'Inactive' : 'Active';
    try {
      await db.updateDeliveryBoyAsync(boy.id, { status: nextStatus });
      refreshData();
    } catch (err: any) {
      console.error("[Admin Delivery Boys] Toggle status error:", err);
      alert('Failed to update status: ' + err.message);
    }
  };

  // Detailed Management Data for all delivery boys
  const allManagementDetails = useMemo(() => {
    return db.getAllDeliveryBoysManagementDetails();
  }, [deliveryBoys]);

  // Filter Delivery Boys
  const filteredBoys = useMemo(() => {
    return deliveryBoys.filter((boy) => {
      const isAct = boy.status === 'Active' || boy.status === 'ACTIVE';
      if (statusFilter === 'Active' && !isAct) return false;
      if (statusFilter === 'Inactive' && isAct) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = (boy.name || '').toLowerCase().includes(q);
        const matchId = (boy.delivery_boy_id || boy.id || '').toLowerCase().includes(q);
        const matchMobile = (boy.mobile || '').includes(q);
        const matchEmail = (boy.email || '').toLowerCase().includes(q);
        const matchVehicle = (boy.vehicle_number || '').toLowerCase().includes(q);
        const matchVehicleType = (boy.vehicle_type || '').toLowerCase().includes(q);
        const matchCity = (boy.city || boy.assigned_area || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchMobile && !matchEmail && !matchVehicle && !matchVehicleType && !matchCity) return false;
      }
      return true;
    });
  }, [deliveryBoys, statusFilter, search]);

  // Filtered Management Details
  const filteredManagementList = useMemo(() => {
    return allManagementDetails.filter((m) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = (m.delivery_boy_name || '').toLowerCase().includes(q);
        const matchId = (m.delivery_boy_id || m.id || '').toLowerCase().includes(q);
        const matchMobile = (m.mobile || '').includes(q);
        const matchVehicle = (m.vehicle_number || '').toLowerCase().includes(q);
        const matchCity = (m.city || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchMobile && !matchVehicle && !matchCity) return false;
      }
      return true;
    });
  }, [allManagementDetails, search]);

  // Fleet-wide summary metrics
  const totalFleetItemsDelivered = allManagementDetails.reduce((sum, b) => sum + b.total_items_delivered, 0);
  const totalFleetOrdersDelivered = allManagementDetails.reduce((sum, b) => sum + b.total_orders_delivered, 0);
  const totalFleetItemsReturned = allManagementDetails.reduce((sum, b) => sum + b.total_items_returned, 0);
  const totalFleetReturnPickups = allManagementDetails.reduce((sum, b) => sum + b.total_return_pickups, 0);
  const totalFleetCodCash = allManagementDetails.reduce((sum, b) => sum + b.total_cod_cash_collected, 0);
  const totalFleetPrepaidDelivered = allManagementDetails.reduce((sum, b) => sum + b.total_prepaid_amount_delivered, 0);
  const overallReturnRate = totalFleetItemsDelivered > 0
    ? Math.round((totalFleetItemsReturned / totalFleetItemsDelivered) * 100)
    : 0;

  const allReturns = db.getProductReturns();
  const totalReturnsAmount = allReturns.reduce((acc, r) => acc + (r.return_amount || 0), 0);

  // Helper to get active boy assigned orders
  const getBoyAssignedOrders = (boy: DeliveryBoy): Order[] => {
    const allOrders = db.getOrders();
    return allOrders.filter(
      (o) => o.assigned_delivery_boy_id === boy.id || (boy.assigned_orders || []).includes(o.order_id)
    );
  };

  return (
    <div id="admin-delivery-boys-view" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Delivery Partner & Fleet Management</h1>
              <p className="text-xs text-slate-500">
                Track how many items each delivery associate delivered and returned with exact dates, times & audit details.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Main View Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setMainViewMode('FLEET_DIRECTORY')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mainViewMode === 'FLEET_DIRECTORY'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Fleet Directory</span>
            </button>
            <button
              id="all-boys-management-tab-btn"
              onClick={() => setMainViewMode('ALL_BOYS_MANAGEMENT')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mainViewMode === 'ALL_BOYS_MANAGEMENT'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>All Delivery Boys Item Management</span>
              {totalFleetItemsDelivered > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  mainViewMode === 'ALL_BOYS_MANAGEMENT' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {totalFleetItemsDelivered} Delivered
                </span>
              )}
            </button>
          </div>

          <button
            id="add-delivery-boy-btn"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Partner</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Fleet Size
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{deliveryBoys.length}</p>
          <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">
            {deliveryBoys.filter(b => b.status === 'Active').length} on duty
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Items Delivered (Fleet)
          </span>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {totalFleetItemsDelivered} <span className="text-xs font-bold text-emerald-800">items</span>
          </p>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">
            Across {totalFleetOrdersDelivered} completed orders
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
            Items Returned (Fleet)
          </span>
          <p className="text-2xl font-black text-amber-900 mt-1">
            {totalFleetItemsReturned} <span className="text-xs font-bold text-amber-800">items</span>
          </p>
          <span className="text-[10px] text-amber-800 font-bold mt-0.5 block">
            Across {totalFleetReturnPickups} return pickups
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Return Rate
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <p className={`text-2xl font-black ${overallReturnRate > 15 ? 'text-rose-600' : 'text-slate-900'}`}>
              {overallReturnRate}%
            </p>
            <span className="text-[10px] text-slate-400">of total items</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {totalFleetItemsDelivered - totalFleetItemsReturned} net items retained
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-indigo-200 bg-indigo-50/30 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-indigo-600" />
            COD Cash Collected
          </span>
          <p className="text-2xl font-black text-indigo-950 mt-1">
            ₹{totalFleetCodCash.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-indigo-700 mt-0.5 block">
            +₹{totalFleetPrepaidDelivered.toLocaleString('en-IN')} prepaid delivered
          </span>
        </div>
      </div>

      {/* VIEW 1: FLEET DIRECTORY & LIVE STATUS */}
      {mainViewMode === 'FLEET_DIRECTORY' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search delivery partner by name, mobile, vehicle #..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Status:</span>
              {(['ALL', 'Active', 'Inactive'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === status
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Fleet Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <th className="p-3.5">Personnel</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Vehicle</th>
                    <th className="p-3.5 text-center">Active Orders</th>
                    <th className="p-3.5 text-center bg-emerald-50/50 text-emerald-900">Items Delivered</th>
                    <th className="p-3.5 text-center bg-amber-50/50 text-amber-900">Items Returned</th>
                    <th className="p-3.5 text-center">Return Rate</th>
                    <th className="p-3.5">Last Delivery Date & Time</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBoys.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-bold">No delivery partners found</p>
                        <p className="text-[11px] mt-0.5">Click &quot;Add Partner&quot; to onboard delivery personnel.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBoys.map((boy) => {
                      const assignedCount = (boy.assigned_orders || []).length;
                      const stats = allManagementDetails.find((m) => m.delivery_boy_id === boy.id);
                      const itemsDelivered = stats?.total_items_delivered || 0;
                      const ordersDelivered = stats?.total_orders_delivered || 0;
                      const itemsReturned = stats?.total_items_returned || 0;
                      const returnRate = stats?.return_rate_percentage || 0;
                      const lastDelivery = stats?.last_delivery_at;

                      return (
                        <tr key={boy.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Name & ID */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs shrink-0">
                                {boy.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">
                                  {boy.name}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  ID: {boy.id.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                                <Phone className="w-3 h-3 text-slate-400" />
                                +91 {boy.mobile}
                              </span>
                              {boy.email && (
                                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  {boy.email}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Vehicle */}
                          <td className="p-3.5">
                            <div>
                              <span className="font-mono font-bold text-slate-900 uppercase">
                                {boy.vehicle_number}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {boy.vehicle_type} • {boy.city}
                              </span>
                            </div>
                          </td>

                          {/* Active Orders */}
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => {
                                setViewingOrdersBoy(boy);
                                setPartnerModalTab('DISPATCHES');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors cursor-pointer"
                              title="View active dispatches"
                            >
                              <Package className="w-3 h-3" />
                              <span>{assignedCount}</span>
                            </button>
                          </td>

                          {/* Items Delivered (kitna iteam delevery kiya) */}
                          <td className="p-3.5 text-center bg-emerald-50/30">
                            <button
                              onClick={() => {
                                setViewingOrdersBoy(boy);
                                setPartnerModalTab('DELIVERED_ITEMS');
                              }}
                              className="inline-flex flex-col items-center cursor-pointer group"
                              title="View full delivered items ledger with time & date"
                            >
                              <span className="font-black text-emerald-800 text-sm group-hover:underline flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                {itemsDelivered} items
                              </span>
                              <span className="text-[10px] text-emerald-700">
                                ({ordersDelivered} orders)
                              </span>
                            </button>
                          </td>

                          {/* Items Returned (kita return kiya) */}
                          <td className="p-3.5 text-center bg-amber-50/30">
                            <button
                              onClick={() => {
                                setViewingOrdersBoy(boy);
                                setPartnerModalTab('RETURNED_ITEMS');
                              }}
                              className="inline-flex flex-col items-center cursor-pointer group"
                              title="View full returned items ledger with time & date"
                            >
                              <span className="font-black text-amber-900 text-sm group-hover:underline flex items-center gap-1">
                                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                                {itemsReturned} items
                              </span>
                              <span className="text-[10px] text-amber-700">
                                ({stats?.total_return_pickups || 0} pickups)
                              </span>
                            </button>
                          </td>

                          {/* Return Rate */}
                          <td className="p-3.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                              returnRate > 20
                                ? 'bg-rose-100 text-rose-800'
                                : returnRate > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {returnRate}%
                            </span>
                          </td>

                          {/* Last Delivery Date & Time (time date ke sath) */}
                          <td className="p-3.5">
                            {lastDelivery ? (
                              <div className="flex items-start gap-1 text-[11px] text-slate-700">
                                <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-semibold block leading-tight">
                                    {formatDateTime(lastDelivery)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">No delivery recorded</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleToggleStatus(boy)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                                boy.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {boy.status}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setViewingOrdersBoy(boy);
                                  setPartnerModalTab('DELIVERED_ITEMS');
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                title="View delivered & returned items with time/date"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Management Details</span>
                              </button>
                              <button
                                onClick={() => handleOpenEdit(boy)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                disabled={deletingId !== null}
                                onClick={() => handleDelete(boy.id, boy.name)}
                                className={`p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                                  deletingId === boy.id ? 'text-rose-600 animate-pulse cursor-not-allowed' : ''
                                }`}
                                title="Delete Delivery Partner"
                              >
                                {deletingId === boy.id ? (
                                  <span className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
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

          {/* Fleet-Wide Return Pickups Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">
                    Fleet Return Pickups & Same Delivery Associate Rule Audit
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Rule Enforced: Every product return is locked to the original delivery associate who completed the order.
                  </p>
                </div>
              </div>

              <span className="text-xs font-extrabold px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full">
                {allReturns.length} Return Pickups Recorded
              </span>
            </div>

            {allReturns.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <RotateCcw className="w-7 h-7 mx-auto mb-1.5 opacity-30 text-amber-500" />
                <p className="font-bold text-xs">No active return requests</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  When customers initiate item returns, pickup tasks appear here with assigned delivery partner.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <th className="p-3">Order & Invoice</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Product & Qty</th>
                      <th className="p-3 text-right">Return Amount</th>
                      <th className="p-3">Assigned Delivery Associate</th>
                      <th className="p-3">Pickup Requested (Date & Time)</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allReturns.map((ret) => {
                      const isSameBoy = (ret.original_delivery_boy_id || ret.delivery_boy_id) === ret.delivery_boy_id;
                      return (
                        <tr key={ret.id || ret.return_id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="p-3 font-mono">
                            <button
                              onClick={() => {
                                const ord = db.getOrderById(ret.order_id);
                                if (ord) setViewingInvoiceOrder(ord);
                              }}
                              className="font-bold text-indigo-700 hover:text-indigo-950 hover:underline block cursor-pointer text-left"
                            >
                              {ret.order_id}
                            </button>
                            <span className="text-[10px] text-slate-400 block">
                              {ret.invoice_number || `INV-${ret.order_id.replace(/^ORD-/, '')}`}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{ret.customer_name}</span>
                            <span className="text-[10px] text-slate-500">+91 {ret.customer_mobile}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-800 block truncate max-w-[180px]">
                              {ret.product_name || ret.item_name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Qty: <strong>{ret.quantity}</strong> ({ret.size})
                            </span>
                          </td>
                          <td className="p-3 text-right font-black text-amber-900">
                            ₹{(ret.return_amount ?? 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <Truck className="w-3 h-3 text-indigo-600" />
                              <span>{ret.delivery_boy_name}</span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-400">
                              ID: {ret.delivery_boy_id}
                            </span>
                            {isSameBoy && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded">
                                SAME ASSOCIATE VERIFIED
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-[11px] text-slate-600">
                            {formatDateTime(ret.requested_at || ret.created_at)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                ret.status === 'Return Completed'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : ret.status === 'Return Accepted'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                            >
                              {ret.status === 'Return Accepted' || ret.status === 'Return Completed'
                                ? 'RETURN COMPLETED'
                                : 'RETURN ITEM'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: ALL DELIVERY BOYS ITEM MANAGEMENT & PERFORMANCE DETAILS (TIME & DATE FULL DETAIL) */}
      {mainViewMode === 'ALL_BOYS_MANAGEMENT' && (
        <div id="all-delivery-boys-detailed-management" className="space-y-6">
          {/* Detailed Info Header Bar */}
          <div className="p-4 bg-indigo-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-300" />
                <h2 className="text-base font-black">
                  All Delivery Boys Item Management & Date/Time Audit
                </h2>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Complete log of items delivered, items returned, cash collections, and exact timestamps for every delivery partner.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter delivery associates..."
                  className="pl-8 pr-3 py-1.5 bg-indigo-800/80 border border-indigo-700 rounded-lg text-xs text-white placeholder-indigo-300 focus:outline-hidden"
                />
                <Search className="w-3.5 h-3.5 text-indigo-300 absolute left-2.5 top-2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* All Delivery Boys Comparative Ledger Cards */}
          <div className="space-y-4">
            {filteredManagementList.length === 0 ? (
              <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
                <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-bold text-sm">No delivery partners found</p>
              </div>
            ) : (
              filteredManagementList.map((m) => {
                const isExpanded = expandedBoyId === m.delivery_boy_id;

                return (
                  <div
                    key={m.delivery_boy_id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                  >
                    {/* Partner Header Row */}
                    <div className="p-4.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                          {m.delivery_boy_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900">{m.delivery_boy_name}</h3>
                            <span className="font-mono text-[11px] text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded font-bold">
                              {m.vehicle_number} ({m.vehicle_type})
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              m.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {m.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Mobile: <span className="font-bold text-slate-800">+91 {m.mobile}</span> • Partner ID: <span className="font-mono">{m.delivery_boy_id.slice(0, 8)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Summary Metrics Pill */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {/* Items Delivered */}
                        <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                          <span className="text-[10px] font-extrabold uppercase text-emerald-800 block">
                            Delivered Items
                          </span>
                          <span className="text-base font-black text-emerald-950">
                            {m.total_items_delivered} <span className="text-[11px] font-normal text-emerald-700">({m.total_orders_delivered} orders)</span>
                          </span>
                        </div>

                        {/* Items Returned */}
                        <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
                          <span className="text-[10px] font-extrabold uppercase text-amber-800 block">
                            Returned Items
                          </span>
                          <span className="text-base font-black text-amber-950">
                            {m.total_items_returned} <span className="text-[11px] font-normal text-amber-700">({m.total_return_pickups} pickups)</span>
                          </span>
                        </div>

                        {/* Return Rate */}
                        <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-center">
                          <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                            Return Rate
                          </span>
                          <span className={`text-base font-black ${m.return_rate_percentage > 20 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {m.return_rate_percentage}%
                          </span>
                        </div>

                        {/* COD Cash */}
                        <div className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                          <span className="text-[10px] font-extrabold uppercase text-indigo-800 block">
                            COD Cash Collected
                          </span>
                          <span className="text-base font-black text-indigo-950">
                            ₹{m.total_cod_cash_collected.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Toggle Expand Details */}
                        <button
                          onClick={() => setExpandedBoyId(isExpanded ? null : m.delivery_boy_id)}
                          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-slate-900 text-white'
                              : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 shadow-2xs'
                          }`}
                        >
                          <span>{isExpanded ? 'Hide Item Details' : 'View Full Item Details'}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Quick Timestamps Bar */}
                    <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between text-slate-600 gap-2">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Last Delivery: </span>
                          <strong className="text-slate-900">{formatDateTime(m.last_delivery_at)}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                          <span>Last Return Pickup: </span>
                          <strong className="text-slate-900">{formatDateTime(m.last_return_at)}</strong>
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500 italic">
                        Net customer retention: {m.total_items_delivered - m.total_items_returned} items
                      </span>
                    </div>

                    {/* Expanded Detail Ledger (Delivered Items + Returned Items with Time and Date) */}
                    {isExpanded && (
                      <div className="p-5 space-y-6 animate-in fade-in duration-200">
                        {/* Section A: Delivered Items Ledger */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                                ✓
                              </div>
                              <h4 className="text-sm font-black text-slate-900">
                                Delivered Orders & Items Detail (Time & Date)
                              </h4>
                            </div>
                            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              Total: {m.total_items_delivered} items delivered across {m.delivered_orders.length} orders
                            </span>
                          </div>

                          {m.delivered_orders.length === 0 ? (
                            <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl">
                              <p className="text-xs font-bold">No completed deliveries recorded for this partner yet</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {m.delivered_orders.map((ord) => (
                                <div
                                  key={ord.order_id}
                                  className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 space-y-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-black text-indigo-700 text-xs">
                                        {ord.order_id}
                                      </span>
                                      <span className="text-slate-300">•</span>
                                      <button
                                        onClick={() => {
                                          const fullOrd = db.getOrderById(ord.order_id);
                                          if (fullOrd) setViewingInvoiceOrder(fullOrd);
                                        }}
                                        className="font-mono text-xs font-bold text-slate-700 hover:text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                                        title="View Invoice"
                                      >
                                        <span>Invoice: {ord.invoice_number}</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      {/* Exact Delivered Time & Date */}
                                      <div className="flex items-center gap-1.5 text-xs text-emerald-950 font-bold bg-emerald-100/90 px-3 py-1 rounded-lg">
                                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                                        <span>Delivered at: {formatDateTime(ord.delivered_at)}</span>
                                      </div>

                                      <span className="text-xs font-black text-slate-900">
                                        Total: ₹{ord.total_amount.toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Customer and Payment Info */}
                                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                                    <div>
                                      Customer: <strong className="text-slate-900">{ord.customer_name}</strong> (+91 {ord.customer_mobile}) • {ord.customer_city}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                        ord.payment_method === 'COD' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                                      }`}>
                                        {ord.payment_method === 'COD' ? '💵 COD Cash' : '💳 Prepaid'}
                                      </span>
                                      <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                                        {ord.payment_status}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Itemized Table of Garments Delivered */}
                                  <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border-b border-slate-200">
                                          <th className="p-2.5">Delivered Garment / Item</th>
                                          <th className="p-2.5 text-center">Size</th>
                                          <th className="p-2.5 text-center">Color</th>
                                          <th className="p-2.5 text-center font-black text-emerald-800">Delivered Qty</th>
                                          <th className="p-2.5 text-right">Price</th>
                                          <th className="p-2.5 text-right">Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {ord.items.map((item, idx) => (
                                          <tr key={`${item.product_id}-${idx}`} className="hover:bg-slate-50/50">
                                            <td className="p-2.5">
                                              <div className="flex items-center gap-2">
                                                {item.image_url ? (
                                                  <img
                                                    src={item.image_url}
                                                    alt={item.product_name}
                                                    referrerPolicy="no-referrer"
                                                    className="w-8 h-8 rounded object-cover border border-slate-200"
                                                  />
                                                ) : (
                                                  <Package className="w-6 h-6 text-slate-300" />
                                                )}
                                                <span className="font-bold text-slate-900">{item.product_name}</span>
                                              </div>
                                            </td>
                                            <td className="p-2.5 text-center font-bold text-slate-700">
                                              {item.size}
                                            </td>
                                            <td className="p-2.5 text-center text-slate-500">
                                              {item.color || 'Standard'}
                                            </td>
                                            <td className="p-2.5 text-center font-black text-emerald-800 text-sm">
                                              {item.quantity}
                                            </td>
                                            <td className="p-2.5 text-right text-slate-700">
                                              ₹{item.price.toLocaleString('en-IN')}
                                            </td>
                                            <td className="p-2.5 text-right font-black text-slate-900">
                                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Section B: Returned Items Ledger */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                                ↺
                              </div>
                              <h4 className="text-sm font-black text-slate-900">
                                Returned Items Detail & Pickup Timestamps (Time & Date)
                              </h4>
                            </div>
                            <span className="text-xs font-extrabold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                              Total: {m.total_items_returned} items returned • ₹{m.total_return_refund_amount.toLocaleString('en-IN')}
                            </span>
                          </div>

                          {m.returned_items.length === 0 ? (
                            <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl">
                              <p className="text-xs font-bold text-emerald-700">
                                Perfect record: 0 items returned for this delivery associate!
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {m.returned_items.map((ret) => (
                                <div
                                  key={ret.return_id}
                                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 space-y-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-indigo-700">
                                          Order: {ret.order_id}
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span className="font-mono text-xs text-slate-600">
                                          Invoice: {ret.invoice_number}
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span className="font-mono text-[11px] text-slate-400">
                                          Return ID: {ret.return_id}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Exact Returned Time & Date */}
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1.5 text-xs text-amber-950 font-bold bg-amber-100/90 px-3 py-1 rounded-lg">
                                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                                        <span>Returned at: {formatDateTime(ret.returned_at)}</span>
                                      </div>
                                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                        {ret.status}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Return Details Grid */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Customer Details
                                      </span>
                                      <p className="font-bold text-slate-900 mt-0.5">{ret.customer_name}</p>
                                      <p className="text-slate-500">+91 {ret.customer_mobile}</p>
                                    </div>

                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Returned Garment & Quantity
                                      </span>
                                      <p className="font-bold text-slate-900 mt-0.5 truncate">{ret.item_name}</p>
                                      <p className="text-amber-900 font-extrabold mt-0.5">
                                        Returned Qty: {ret.quantity} ({ret.size}) • ₹{ret.return_amount.toLocaleString('en-IN')}
                                      </p>
                                    </div>

                                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Return Reason & Remark
                                      </span>
                                      <p className="font-bold text-slate-800 mt-0.5">{ret.reason}</p>
                                      {ret.remark && (
                                        <p className="text-[11px] text-slate-500 italic mt-0.5">{ret.remark}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Delivery Partner Modal */}
      {isModalOpen && (
        <div
          id="delivery-boy-modal"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black">
                  {editingBoy ? 'Edit Delivery Partner' : 'Add New Delivery Partner'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-slate-400 font-bold text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mobile: e.target.value.replace(/\D/g, ''),
                        })
                      }
                      placeholder="9876543210"
                      className="w-full pl-10 pr-2.5 py-2.5 border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Login Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="delivery123"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ramesh@style1.in"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Vehicle Type *
                  </label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vehicle_type: e.target.value as DeliveryBoy['vehicle_type'],
                      })
                    }
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-indigo-600 focus:outline-hidden"
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Electric Bike">Electric Bike</option>
                    <option value="Van">Van / Tempo</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Vehicle Reg Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vehicle_number}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })
                    }
                    placeholder="KA-05-EA-8821"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Operational Hub / City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Bengaluru"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as DeliveryBoy['status'],
                      })
                    }
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:border-indigo-600 focus:outline-hidden"
                  >
                    <option value="Active">Active (On Duty)</option>
                    <option value="Inactive">Inactive (Off Duty)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  id="submit-delivery-boy-btn"
                  type="submit"
                  disabled={isSaving}
                  className={`px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 ${
                    isSaving ? 'opacity-70 cursor-not-allowed bg-slate-400 hover:bg-slate-400' : ''
                  }`}
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    editingBoy ? 'Save Changes' : 'Add Delivery Partner'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Delivery Boy Detailed Management Modal */}
      {viewingOrdersBoy && (() => {
        const boyStats = db.getDeliveryBoyManagementDetails(viewingOrdersBoy.id);
        const assignedOrders = getBoyAssignedOrders(viewingOrdersBoy);

        return (
          <div
            id="delivery-boy-orders-modal"
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
              {/* Modal Top Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400">
                    Delivery Associate Full Management & Item Audit
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h3 className="text-base font-black">
                      {viewingOrdersBoy.name} (+91 {viewingOrdersBoy.mobile})
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      • {viewingOrdersBoy.vehicle_number}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingOrdersBoy(null)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Performance Scorecard Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-50 border-b border-slate-200 p-3 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                    Total Delivered Items
                  </span>
                  <span className="text-lg font-black text-emerald-950">
                    {boyStats?.total_items_delivered || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    ({boyStats?.total_orders_delivered || 0} orders)
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">
                    Total Returned Items
                  </span>
                  <span className="text-lg font-black text-amber-950">
                    {boyStats?.total_items_returned || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    ({boyStats?.total_return_pickups || 0} pickups)
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">
                    COD Cash Collected
                  </span>
                  <span className="text-lg font-black text-indigo-950">
                    ₹{(boyStats?.total_cod_cash_collected || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Prepaid: ₹{(boyStats?.total_prepaid_amount_delivered || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Return Rate
                  </span>
                  <span className={`text-lg font-black ${(boyStats?.return_rate_percentage || 0) > 20 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {boyStats?.return_rate_percentage || 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    of items delivered
                  </span>
                </div>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-100/80 px-5 pt-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPartnerModalTab('DELIVERED_ITEMS')}
                  className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    partnerModalTab === 'DELIVERED_ITEMS'
                      ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Delivered Items & Timestamps ({boyStats?.total_items_delivered || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPartnerModalTab('RETURNED_ITEMS')}
                  className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    partnerModalTab === 'RETURNED_ITEMS'
                      ? 'border-amber-600 text-amber-900 bg-white rounded-t-lg shadow-2xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Returned Items & Timestamps ({boyStats?.total_items_returned || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPartnerModalTab('DISPATCHES')}
                  className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    partnerModalTab === 'DISPATCHES'
                      ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Active Dispatches & Assign ({assignedOrders.length})</span>
                </button>
              </div>

              {/* Modal Content Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* TAB 1: DELIVERED ITEMS */}
                {partnerModalTab === 'DELIVERED_ITEMS' && (
                  <div className="space-y-4">
                    {(!boyStats || boyStats.delivered_orders.length === 0) ? (
                      <div className="py-12 text-center text-slate-400">
                        <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
                        <p className="font-bold text-sm">No delivered items yet</p>
                        <p className="text-xs text-slate-500 mt-1">
                          When {viewingOrdersBoy.name} marks orders as delivered, itemized records with exact time and date will appear here.
                        </p>
                      </div>
                    ) : (
                      boyStats.delivered_orders.map((ord) => (
                        <div
                          key={ord.order_id}
                          className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-indigo-700">
                                  {ord.order_id}
                                </span>
                                <span className="text-slate-300">•</span>
                                <button
                                  onClick={() => {
                                    const fullOrd = db.getOrderById(ord.order_id);
                                    if (fullOrd) setViewingInvoiceOrder(fullOrd);
                                  }}
                                  className="font-mono text-xs font-bold text-slate-700 hover:text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                                  title="Click to view Invoice"
                                >
                                  <span>Invoice: {ord.invoice_number}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-[11px] text-slate-500 mt-0.5 block">
                                Customer: <strong>{ord.customer_name}</strong> (+91 {ord.customer_mobile}) • {ord.customer_city}
                              </span>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-bold bg-emerald-100 px-3 py-1 rounded-lg">
                                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Delivered: {formatDateTime(ord.delivered_at)}</span>
                              </div>
                              <span className="text-xs font-black text-slate-900 mt-1 block">
                                Payable: ₹{ord.total_amount.toLocaleString('en-IN')} ({ord.payment_method})
                              </span>
                            </div>
                          </div>

                          {/* Garment items delivered in this order */}
                          <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border-b border-slate-200">
                                  <th className="p-2.5">Garment Name</th>
                                  <th className="p-2.5 text-center">Size</th>
                                  <th className="p-2.5 text-center">Color</th>
                                  <th className="p-2.5 text-center font-bold text-emerald-800">Delivered Qty</th>
                                  <th className="p-2.5 text-right">Price</th>
                                  <th className="p-2.5 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {ord.items.map((it, idx) => (
                                  <tr key={`${it.product_id}-${idx}`}>
                                    <td className="p-2.5">
                                      <div className="flex items-center gap-2">
                                        {it.image_url ? (
                                          <img
                                            src={it.image_url}
                                            alt={it.product_name}
                                            referrerPolicy="no-referrer"
                                            className="w-8 h-8 rounded object-cover border border-slate-200"
                                          />
                                        ) : (
                                          <Package className="w-6 h-6 text-slate-300" />
                                        )}
                                        <span className="font-bold text-slate-900">{it.product_name}</span>
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-center font-bold text-slate-700">
                                      {it.size}
                                    </td>
                                    <td className="p-2.5 text-center text-slate-500">
                                      {it.color || 'Standard'}
                                    </td>
                                    <td className="p-2.5 text-center font-black text-emerald-800 text-sm">
                                      {it.quantity}
                                    </td>
                                    <td className="p-2.5 text-right text-slate-700">
                                      ₹{it.price.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-2.5 text-right font-black text-slate-900">
                                      ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 2: RETURNED ITEMS */}
                {partnerModalTab === 'RETURNED_ITEMS' && (
                  <div className="space-y-4">
                    {(!boyStats || boyStats.returned_items.length === 0) ? (
                      <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl">
                        <RotateCcw className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
                        <p className="font-bold text-sm text-slate-700">Zero Returns Handled</p>
                        <p className="text-xs text-slate-500 mt-1">
                          No items have been returned for orders delivered by {viewingOrdersBoy.name}.
                        </p>
                      </div>
                    ) : (
                      boyStats.returned_items.map((ret) => (
                        <div
                          key={ret.return_id}
                          className="p-4 bg-amber-50/20 rounded-xl border border-amber-200 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-indigo-700">
                                  Order: {ret.order_id}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="font-mono text-xs text-slate-700">
                                  Invoice: {ret.invoice_number}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                                Return ID: {ret.return_id}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 text-xs text-amber-950 font-bold bg-amber-100 px-3 py-1 rounded-lg">
                                <Clock className="w-3.5 h-3.5 text-amber-700" />
                                <span>Returned: {formatDateTime(ret.returned_at)}</span>
                              </div>
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                {ret.status}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
                              <p className="font-bold text-slate-900 mt-0.5">{ret.customer_name}</p>
                              <p className="text-slate-500">+91 {ret.customer_mobile}</p>
                            </div>

                            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Returned Garment</span>
                              <p className="font-bold text-slate-900 mt-0.5">{ret.item_name}</p>
                              <p className="text-amber-900 font-extrabold mt-0.5">
                                Returned Qty: {ret.quantity} ({ret.size}) • ₹{ret.return_amount.toLocaleString('en-IN')}
                              </p>
                            </div>

                            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Reason & Remark</span>
                              <p className="font-bold text-slate-800 mt-0.5">{ret.reason}</p>
                              {ret.remark && (
                                <p className="text-[11px] text-slate-500 italic mt-0.5">{ret.remark}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 3: ACTIVE DISPATCHES & ASSIGN NEW ORDER */}
                {partnerModalTab === 'DISPATCHES' && (
                  <div className="space-y-4">
                    {/* Quick Assign Bar */}
                    {(() => {
                      const unassignedOrders = db
                        .getOrders()
                        .filter(
                          (o) =>
                            !o.assigned_delivery_boy_id &&
                            o.order_status !== 'Cancelled' &&
                            o.order_status !== 'Delivered'
                        );

                      return (
                        <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-indigo-600" />
                              Assign Customer Order to {viewingOrdersBoy.name}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                              {unassignedOrders.length} Available
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <select
                              id="modal-assign-order-select"
                              value={orderToAssignId}
                              onChange={(e) => setOrderToAssignId(e.target.value)}
                              className="flex-1 text-xs border border-indigo-300 rounded-lg px-2.5 py-1.5 bg-white font-medium outline-hidden focus:border-indigo-600"
                            >
                              <option value="">-- Select Customer Order to Assign --</option>
                              {unassignedOrders.map((o) => (
                                <option key={o.order_id} value={o.order_id}>
                                  {o.order_id} • {o.customer_name} ({o.address?.city || 'Bengaluru'}) - ₹
                                  {(db.getOrderPayableAmount(o) ?? 0).toLocaleString('en-IN')} [{o.order_status}]
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                if (!orderToAssignId) return;
                                db.assignOrderToDeliveryBoy(orderToAssignId, viewingOrdersBoy.id);
                                setOrderToAssignId('');
                                refreshData();
                              }}
                              disabled={!orderToAssignId}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                            >
                              Assign Order
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Assigned active orders list */}
                    {assignedOrders.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="font-bold text-sm">No active orders assigned</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Use the select box above to assign orders to {viewingOrdersBoy.name}.
                        </p>
                      </div>
                    ) : (
                      assignedOrders.map((order) => (
                        <div
                          key={order.id}
                          className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <div>
                              <span className="font-mono text-xs font-bold text-indigo-700">
                                {order.order_id}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                Placed {new Date(order.order_date || order.created_at).toLocaleDateString('en-IN')}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {db.isOrderDeliveryLocked(order) && (
                                <span
                                  className="text-[10px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1"
                                  title={db.getDeliveryLockReason(order) || 'Locked'}
                                >
                                  <Lock className="w-2.5 h-2.5 text-amber-700" />
                                  Locked
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                  order.order_status === 'Delivered'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : order.order_status === 'Out for Delivery'
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {order.order_status}
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                ₹{(db.getOrderPayableAmount(order) ?? 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600">
                            <p className="font-bold text-slate-900">{order.address.name}</p>
                            <p>
                              {order.address.address}, {order.address.city}, {order.address.state} -{' '}
                              {order.address.pincode}
                            </p>
                            <p className="text-indigo-700 font-semibold mt-0.5">
                              Phone: +91 {order.address.mobile}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Payment: {order.payment_method === 'COD' ? '💵 Cash on Delivery' : '💳 Prepaid'}
                              <span className="font-bold text-slate-700 ml-1">({order.payment_status})</span>
                            </p>
                          </div>

                          <div className="text-[11px] text-slate-500">
                            <span>Items: </span>
                            <span className="font-semibold text-slate-700">
                              {order.items
                                .filter((i) => i.item_status !== 'Cancelled')
                                .map((i) => `${i.product_name} (${i.size}) x${i.quantity}`)
                                .join(', ')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                            {db.isOrderDeliveryLocked(order) ? (
                              <span
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1 cursor-not-allowed"
                                title={db.getDeliveryLockReason(order) || 'Locked'}
                              >
                                <Lock className="w-3 h-3 text-amber-600" />
                                Locked ({order.order_status === 'Delivered' ? 'Delivered' : 'Paid'})
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (db.isOrderDeliveryLocked(order)) {
                                    alert(db.getDeliveryLockReason(order) || 'Locked');
                                    return;
                                  }
                                  db.unassignOrderFromDeliveryBoy(order.order_id);
                                  refreshData();
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                              >
                                Unassign
                              </button>
                            )}

                            <div className="flex items-center gap-2">
                              {order.order_status !== 'Out for Delivery' && order.order_status !== 'Delivered' && order.order_status !== 'Cancelled' && (
                                <button
                                  onClick={() => {
                                    db.markOrderOutForDelivery(order.order_id, viewingOrdersBoy.id);
                                    refreshData();
                                  }}
                                  className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  Mark Out for Delivery
                                </button>
                              )}

                              {order.order_status !== 'Delivered' && order.order_status !== 'Cancelled' && (
                                <button
                                  onClick={() => {
                                    db.completeOrderDelivery(order.order_id, viewingOrdersBoy.id);
                                    refreshData();
                                  }}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  Mark Delivered
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setViewingOrdersBoy(null)}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Invoice Modal */}
      {viewingInvoiceOrder && (
        <OrderInvoiceModal
          order={viewingInvoiceOrder}
          onClose={() => setViewingInvoiceOrder(null)}
          userRole="Admin"
        />
      )}
    </div>
  );
};
