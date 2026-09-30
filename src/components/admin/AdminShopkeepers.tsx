import React, { useState, useEffect } from 'react';
import {
  Store,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Boxes,
  Shield,
  Eye,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  History,
  AlertTriangle,
  Lock,
  Unlock,
  PackageCheck,
  ShoppingBag,
  ExternalLink,
  ArrowLeft,
  Filter,
  Tag,
  DollarSign,
  Layers,
  Image as ImageIcon,
  User,
  Phone,
  FileText,
  Truck,
  Calendar,
  MapPin,
  CreditCard,
  Package,
} from 'lucide-react';
import { db } from '../../services/db';
import { Shopkeeper, ShopkeeperPermissions, Product, StockTransaction, Order } from '../../types';

export const AdminShopkeepers: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'PARTNERS' | 'APPROVALS' | 'TRANSACTIONS'>('PARTNERS');
  const [shopkeepers, setShopkeepers] = useState<Shopkeeper[]>(db.getShopkeepers());
  const [allProducts, setAllProducts] = useState<Product[]>(db.getAllProducts());
  const [transactions, setTransactions] = useState<StockTransaction[]>(db.getStockTransactions());
  const [allOrders, setAllOrders] = useState<Order[]>(db.getOrders());
  const [ledgerViewMode, setLedgerViewMode] = useState<'ORDERS' | 'INVENTORY'>('ORDERS');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShopkeeperId, setSelectedShopkeeperId] = useState<string>('ALL');

  // Selected Partner for Dedicated Products View
  const [selectedPartnerForProducts, setSelectedPartnerForProducts] = useState<Shopkeeper | null>(null);

  // Product Details Modal state
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Product Edit Modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editMrp, setEditMrp] = useState(0);
  const [editShopkeeperPrice, setEditShopkeeperPrice] = useState(0);
  const [editAdminSellingPrice, setEditAdminSellingPrice] = useState(0);
  const [editStock, setEditStock] = useState(0);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editSubcategoryName, setEditSubcategoryName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSizes, setEditSizes] = useState('');
  const [editColors, setEditColors] = useState('');
  const [editApprovalStatus, setEditApprovalStatus] = useState<'APPROVED' | 'PENDING' | 'REJECTED'>('APPROVED');
  const [editIsLive, setEditIsLive] = useState(true);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [isSavingProductEdit, setIsSavingProductEdit] = useState(false);

  // Partner Product View search & filter states
  const [partnerProductSearch, setPartnerProductSearch] = useState('');
  const [partnerProductStatusFilter, setPartnerProductStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'INACTIVE'>('ALL');
  const [partnerProductStockFilter, setPartnerProductStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditPermissionsModalOpen, setIsEditPermissionsModalOpen] = useState(false);
  const [editingShopkeeper, setEditingShopkeeper] = useState<Shopkeeper | null>(null);

  // New Shopkeeper Form
  const [newName, setNewName] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState('New Delhi');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Rejection modal
  const [rejectModalProduct, setRejectModalProduct] = useState<Product | null>(null);
  const [rejectReason, setRejectReason] = useState('Image resolution too low. Please upload clear front and back angles.');
  const [adminPriceOverrides, setAdminPriceOverrides] = useState<Record<string, number>>({});

  const refreshData = () => {
    setShopkeepers(db.getShopkeepers());
    setAllProducts(db.getAllProducts());
    setTransactions(db.getStockTransactions());
    setAllOrders(db.getOrders());
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, []);

  const pendingProducts = allProducts.filter((p) => p.approval_status === 'PENDING');

  const handleOpenEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setEditName(prod.name || '');
    setEditSku(prod.sku || '');
    setEditMrp(prod.mrp || 0);
    setEditShopkeeperPrice(prod.shopkeeper_price || 0);
    setEditAdminSellingPrice(prod.admin_selling_price || prod.selling_price || 0);
    setEditStock(prod.stock || 0);
    setEditCategoryName(prod.category_name || '');
    setEditSubcategoryName(prod.subcategory_name || '');
    setEditDescription(prod.description || '');
    setEditSizes(Array.isArray(prod.sizes) ? prod.sizes.join(', ') : '');
    setEditColors(Array.isArray(prod.colors) ? prod.colors.join(', ') : '');
    setEditApprovalStatus(prod.approval_status || 'APPROVED');
    setEditIsLive(prod.is_live !== false);
    const primaryImg = prod.images && prod.images.length > 0 ? prod.images[0].image_url : '';
    setEditImageUrl(primaryImg);
    setEditFormError('');
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditFormError('');
    setIsSavingProductEdit(true);

    try {
      const parsedSizes = editSizes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedColors = editColors
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      let images = editingProduct.images || [];
      if (editImageUrl.trim()) {
        if (images.length > 0) {
          images = [{ ...images[0], image_url: editImageUrl.trim() }, ...images.slice(1)];
        } else {
          images = [
            {
              id: `img-${Date.now()}`,
              image_url: editImageUrl.trim(),
              is_primary: true,
              sort_order: 1,
            },
          ];
        }
      }

      const updates: Partial<Product> = {
        name: editName,
        sku: editSku,
        mrp: Number(editMrp),
        shopkeeper_price: Number(editShopkeeperPrice),
        admin_selling_price: Number(editAdminSellingPrice),
        selling_price: Number(editAdminSellingPrice),
        stock: Number(editStock),
        category_name: editCategoryName,
        subcategory_name: editSubcategoryName,
        description: editDescription,
        sizes: parsedSizes,
        colors: parsedColors,
        approval_status: editApprovalStatus,
        is_live: editApprovalStatus === 'APPROVED' ? editIsLive : false,
        images,
        status: Number(editStock) <= 0 ? 'Out of Stock' : (editApprovalStatus === 'APPROVED' && editIsLive ? 'Published' : 'Draft'),
      };

      const res = await db.updateProductAsync(editingProduct.id, updates);
      if (!res) {
        throw new Error('Failed to update product in database.');
      }

      if (editingProduct.shopkeeper_id) {
        db.recalculateShopkeeperStats(editingProduct.shopkeeper_id);
      }

      refreshData();
      setEditingProduct(null);
    } catch (err: any) {
      console.error('[Admin] Product edit error:', err);
      setEditFormError(err.message || 'Failed to save product changes to Supabase.');
    } finally {
      setIsSavingProductEdit(false);
    }
  };

  const handleCreateShopkeeper = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSaving(true);

    try {
      const created = await db.createShopkeeperAsync({
        name: newName,
        store_name: newStoreName,
        mobile: newMobile,
        email: newEmail,
        city: newCity,
      });

      setFormSuccess(`Shopkeeper partner "${created.name}" created successfully with ID: ${created.shopkeeper_id}`);
      setNewName('');
      setNewStoreName('');
      setNewMobile('');
      setNewEmail('');
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccess('');
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create shopkeeper. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePermission = async (key: keyof ShopkeeperPermissions) => {
    if (!editingShopkeeper) return;
    const updatedPerms: ShopkeeperPermissions = {
      ...editingShopkeeper.permissions,
      [key]: !editingShopkeeper.permissions[key],
    };

    try {
      const res = await db.updateShopkeeperAsync(editingShopkeeper.id, {
        permissions: updatedPerms,
      });
      if (res) {
        setEditingShopkeeper(res);
        refreshData();
      }
    } catch (err: any) {
      console.error("[Admin Shopkeepers] Toggle permission error:", err);
      alert("Failed to update permissions: " + err.message);
    }
  };

  const handleApprove = async (product: Product) => {
    try {
      const customAdminPrice = adminPriceOverrides[product.id];
      if (customAdminPrice !== undefined && customAdminPrice > 0) {
        await db.updateProductAsync(product.id, {
          admin_selling_price: customAdminPrice,
          selling_price: customAdminPrice,
        });
      }
      await db.adminApproveProductAsync(product.id, 'admin-1', 'Admin Lead');
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalProduct) return;
    try {
      await db.adminRejectProductAsync(rejectModalProduct.id, rejectReason, 'admin-1', 'Admin Lead');
      setRejectModalProduct(null);
      setRejectReason('');
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    }
  };

  const handleToggleLive = (product: Product) => {
    try {
      db.adminSetProductLive(product.id, !product.is_live);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleToggleShopkeeperStatus = async (shop: Shopkeeper) => {
    const newStatus = shop.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await db.updateShopkeeperAsync(shop.id, { status: newStatus });
      db.recalculateShopkeeperStats(shop.id);
      setShopkeepers(db.getShopkeepers());
      setAllProducts(db.getAllProducts());
    } catch (err: any) {
      alert(err.message || 'Failed to update partner status.');
    }
  };

  const filteredShopkeepers = shopkeepers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.store_name || '').toLowerCase().includes(q) ||
      s.mobile.includes(q) ||
      s.shopkeeper_id.toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q)
    );
  });

  const filteredTransactions = transactions.filter((t) => {
    if (selectedShopkeeperId !== 'ALL') {
      const selectedShop = shopkeepers.find(
        (s) => s.id === selectedShopkeeperId || s.shopkeeper_id === selectedShopkeeperId
      );
      const validIds = new Set<string>([selectedShopkeeperId]);
      if (selectedShop) {
        if (selectedShop.id) validIds.add(selectedShop.id);
        if (selectedShop.shopkeeper_id) validIds.add(selectedShop.shopkeeper_id);
      }
      if (!validIds.has(t.shopkeeper_id)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Store className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900">Shopkeeper Partners & Centralized Inventory</h2>
          </div>
          <p className="text-xs text-slate-500">
            Authorize local merchants, moderate products, configure granular permissions, and track live Stock IN / Stock OUT.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setFormSuccess('');
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Shopkeeper Partner</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('PARTNERS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'PARTNERS'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Shopkeeper Partners ({shopkeepers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('APPROVALS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'APPROVALS'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals</span>
          {pendingProducts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
              {pendingProducts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('TRANSACTIONS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'TRANSACTIONS'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock Movement Ledger ({transactions.length})</span>
        </button>
      </div>

      {/* TAB 1: SHOPKEEPER PARTNERS LIST */}
      {activeSubTab === 'PARTNERS' && (
        selectedPartnerForProducts ? (
          /* DEDICATED PARTNER PRODUCT VIEW */
          <div className="space-y-5">
            {/* Header & Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedPartnerForProducts(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Partners</span>
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {selectedPartnerForProducts.shopkeeper_id}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        selectedPartnerForProducts.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedPartnerForProducts.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-0.5">
                    {selectedPartnerForProducts.name} <span className="text-amber-600 font-semibold">→ Partner Products</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedPartnerForProducts.store_name || 'Retail Partner'} • +91 {selectedPartnerForProducts.mobile} • {selectedPartnerForProducts.city || 'India'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleToggleShopkeeperStatus(selectedPartnerForProducts)}
                className={`px-3.5 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer shadow-xs ${
                  selectedPartnerForProducts.status === 'ACTIVE'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {selectedPartnerForProducts.status === 'ACTIVE' ? 'Deactivate Partner' : 'Activate Partner'}
              </button>
            </div>

            {/* Partner's Products Data Processing & View */}
            {(() => {
              const validIds = new Set<string>([selectedPartnerForProducts.id, selectedPartnerForProducts.shopkeeper_id].filter(Boolean) as string[]);
              const partnerProducts = allProducts.filter((p) => p.shopkeeper_id && validIds.has(p.shopkeeper_id));
              const isPartnerActive = selectedPartnerForProducts.status === 'ACTIVE';
              const liveCount = isPartnerActive
                ? partnerProducts.filter((p) => p.approval_status === 'APPROVED' && p.is_live && (p.stock || 0) > 0).length
                : 0;
              const pendingCount = partnerProducts.filter((p) => p.approval_status === 'PENDING').length;
              const totalStock = partnerProducts.reduce((sum, p) => sum + (p.stock || 0), 0);

              const filteredPartnerProducts = partnerProducts.filter((p) => {
                if (partnerProductSearch.trim()) {
                  const q = partnerProductSearch.toLowerCase();
                  const matchName = (p.name || '').toLowerCase().includes(q);
                  const matchSku = (p.sku || '').toLowerCase().includes(q);
                  const matchCat = (p.category_name || '').toLowerCase().includes(q);
                  if (!matchName && !matchSku && !matchCat) return false;
                }
                if (partnerProductStatusFilter === 'APPROVED') {
                  if (p.approval_status !== 'APPROVED' || !p.is_live) return false;
                } else if (partnerProductStatusFilter === 'PENDING') {
                  if (p.approval_status !== 'PENDING') return false;
                } else if (partnerProductStatusFilter === 'REJECTED') {
                  if (p.approval_status !== 'REJECTED') return false;
                } else if (partnerProductStatusFilter === 'INACTIVE') {
                  if (p.is_live !== false && (p.stock || 0) > 0) return false;
                }

                if (partnerProductStockFilter === 'IN_STOCK' && (p.stock || 0) <= 0) return false;
                if (partnerProductStockFilter === 'OUT_OF_STOCK' && (p.stock || 0) > 0) return false;

                return true;
              });

              // Compute order stats for this specific partner
              const partnerOrderItems: Array<{ order: Order; item: any }> = [];
              allOrders.forEach((ord) => {
                (ord.items || []).forEach((item) => {
                  let matches = false;
                  if (item.shopkeeper_id && validIds.has(item.shopkeeper_id)) {
                    matches = true;
                  } else if (item.shopkeeper_name && (
                    item.shopkeeper_name.toLowerCase() === selectedPartnerForProducts.name.toLowerCase() ||
                    (selectedPartnerForProducts.store_name && item.shopkeeper_name.toLowerCase() === selectedPartnerForProducts.store_name.toLowerCase())
                  )) {
                    matches = true;
                  } else if (partnerProducts.some((p) => p.id === item.product_id)) {
                    matches = true;
                  }

                  if (matches) {
                    partnerOrderItems.push({ order: ord, item });
                  }
                });
              });

              const deliveredOrderItems = partnerOrderItems.filter((m) => m.order.order_status === 'Delivered');
              const cancelledOrderItems = partnerOrderItems.filter((m) => m.order.order_status === 'Cancelled');
              const inProgressOrderItems = partnerOrderItems.filter((m) => m.order.order_status !== 'Delivered' && m.order.order_status !== 'Cancelled');

              const totalDeliveredOrdersCount = new Set(deliveredOrderItems.map((m) => m.order.order_id)).size;
              const totalCancelledOrdersCount = new Set(cancelledOrderItems.map((m) => m.order.order_id)).size;
              const totalInProgressOrdersCount = new Set(inProgressOrderItems.map((m) => m.order.order_id)).size;

              return (
                <div className="space-y-4">
                  {/* Comprehensive Partner Performance & Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Total Products</div>
                      <div className="text-lg font-black text-slate-900 mt-0.5">{partnerProducts.length} <span className="text-xs font-normal text-slate-500">Items</span></div>
                    </div>

                    <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 shadow-2xs">
                      <div className="text-[10px] font-extrabold uppercase text-emerald-800">Delivered Orders</div>
                      <div className="text-lg font-black text-emerald-900 mt-0.5">{totalDeliveredOrdersCount} <span className="text-xs font-normal text-emerald-700">Orders</span></div>
                    </div>

                    <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200 shadow-2xs">
                      <div className="text-[10px] font-extrabold uppercase text-rose-800">Cancelled Orders</div>
                      <div className="text-lg font-black text-rose-900 mt-0.5">{totalCancelledOrdersCount} <span className="text-xs font-normal text-rose-700">Orders</span></div>
                    </div>

                    <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
                      <div className="text-[10px] font-extrabold uppercase text-amber-800">In-Progress Orders</div>
                      <div className="text-lg font-black text-amber-900 mt-0.5">{totalInProgressOrdersCount} <span className="text-xs font-normal text-amber-700">Orders</span></div>
                    </div>

                    <div className="bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-200 shadow-2xs">
                      <div className="text-[10px] font-extrabold uppercase text-indigo-800">Live Catalog</div>
                      <div className="text-lg font-black text-indigo-900 mt-0.5">{liveCount} <span className="text-xs font-normal text-indigo-700">Active</span></div>
                    </div>

                    <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xs flex flex-col justify-between">
                      <div className="text-[10px] font-extrabold uppercase text-amber-400">Stock Units</div>
                      <div className="text-lg font-black text-white mt-0.5">{totalStock} <span className="text-xs font-normal text-slate-300">In Stock</span></div>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={partnerProductSearch}
                        onChange={(e) => setPartnerProductSearch(e.target.value)}
                        placeholder={`Search products for ${selectedPartnerForProducts.name} by title, SKU, or category...`}
                        className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <select
                        value={partnerProductStatusFilter}
                        onChange={(e: any) => setPartnerProductStatusFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="APPROVED">Live & Approved</option>
                        <option value="PENDING">Pending Review</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="INACTIVE">Offline / Draft</option>
                      </select>

                      <select
                        value={partnerProductStockFilter}
                        onChange={(e: any) => setPartnerProductStockFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="ALL">All Stock</option>
                        <option value="IN_STOCK">In Stock (&gt;0)</option>
                        <option value="OUT_OF_STOCK">Out of Stock (0)</option>
                      </select>
                    </div>
                  </div>

                  {/* Products Data List */}
                  {filteredPartnerProducts.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                      <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-base font-black text-slate-800">No Products</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {partnerProducts.length === 0
                          ? `No products registered for ${selectedPartnerForProducts.name} (${selectedPartnerForProducts.shopkeeper_id}).`
                          : 'No products match your search or filter options.'}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                              <th className="py-3 px-4">Product Info</th>
                              <th className="py-3 px-4">Category</th>
                              <th className="py-3 px-4 text-right">Price Matrix</th>
                              <th className="py-3 px-4 text-center">Stock & Units</th>
                              <th className="py-3 px-4 text-center">Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {filteredPartnerProducts.map((p) => {
                              const primaryImg = p.images && p.images.length > 0 ? p.images[0].image_url : '';
                              const inStock = (p.stock || 0) > 0;

                              return (
                                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                        {primaryImg ? (
                                          <img src={primaryImg || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'} alt={p.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <ImageIcon className="w-5 h-5 text-slate-400" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-900 leading-tight">{p.name}</div>
                                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">SKU: {p.sku || p.id}</div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-slate-800">{p.category_name}</div>
                                    {p.subcategory_name && (
                                      <div className="text-[10px] text-slate-400">{p.subcategory_name}</div>
                                    )}
                                  </td>

                                  <td className="py-3 px-4 text-right">
                                    <div className="font-black text-slate-900">₹{p.admin_selling_price || p.selling_price}</div>
                                    <div className="text-[10px] text-slate-400 line-through">MRP: ₹{p.mrp}</div>
                                    {p.shopkeeper_price !== undefined && (
                                      <div className="text-[10px] text-amber-700 font-semibold">Cost: ₹{p.shopkeeper_price}</div>
                                    )}
                                  </td>

                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-md font-mono text-xs font-black ${
                                        inStock
                                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                                      }`}
                                    >
                                      {p.stock || 0} Units
                                    </span>
                                    {Array.isArray(p.sizes) && p.sizes.length > 0 && (
                                      <div className="text-[10px] text-slate-400 mt-0.5">Sizes: {p.sizes.join(', ')}</div>
                                    )}
                                  </td>

                                  <td className="py-3 px-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <span
                                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                          p.approval_status === 'APPROVED'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : p.approval_status === 'PENDING'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}
                                      >
                                        {p.approval_status}
                                      </span>
                                      {p.is_live && isPartnerActive ? (
                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                          LIVE
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                          OFFLINE
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => setViewingProduct(p)}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                        title="View Product Details"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>View</span>
                                      </button>

                                      <button
                                        onClick={() => handleOpenEditProductModal(p)}
                                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-indigo-200"
                                        title="Edit Product Details"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span>Edit</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          /* ALL PARTNERS LIST VIEW */
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, store, mobile, city, or ID..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Showing {filteredShopkeepers.length} partner{filteredShopkeepers.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShopkeepers.map((shop) => {
                const validShopIds = new Set<string>([shop.id, shop.shopkeeper_id].filter(Boolean) as string[]);
                const shopProds = allProducts.filter((p) => p.shopkeeper_id && validShopIds.has(p.shopkeeper_id));
                const isPartnerActive = shop.status === 'ACTIVE';
                const liveCount = isPartnerActive
                  ? shopProds.filter((p) => p.approval_status === 'APPROVED' && p.is_live && (p.stock || 0) > 0).length
                  : 0;
                const pendingCount = shopProds.filter((p) => p.approval_status === 'PENDING').length;
                const totalStock = shopProds.reduce((sum, p) => sum + (p.stock || 0), 0);

                return (
                  <div
                    key={shop.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {shop.shopkeeper_id}
                          </span>
                          <h3 className="text-base font-black text-slate-900 mt-1">{shop.name}</h3>
                          <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                            <Store className="w-3.5 h-3.5 text-slate-400" />
                            <span>{shop.store_name || 'Retail Partner'}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              shop.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {shop.status}
                          </span>
                          <button
                            onClick={() => handleToggleShopkeeperStatus(shop)}
                            className={`px-2 py-0.5 text-[10px] font-black rounded-md border transition-all cursor-pointer ${
                              shop.status === 'ACTIVE'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={shop.status === 'ACTIVE' ? 'Deactivate Shopkeeper Partner' : 'Activate Shopkeeper Partner'}
                          >
                            {shop.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 mb-4">
                        <div>Mobile: <strong className="text-slate-900 font-mono">+91 {shop.mobile}</strong></div>
                        <div>City: <span className="text-slate-800">{shop.city || 'India'}</span></div>
                        <div>Email: <span className="text-slate-800">{shop.email || 'N/A'}</span></div>
                      </div>

                      {/* Stats Pill Matrix */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center mb-4">
                        <div
                          onClick={() => setSelectedPartnerForProducts(shop)}
                          className="cursor-pointer hover:bg-amber-100/50 p-1 rounded-lg transition-all"
                          title="View partner products"
                        >
                          <div className="text-[10px] text-amber-800 font-bold uppercase">Products</div>
                          <div className="text-sm font-black text-amber-900">{shopProds.length}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-emerald-600 font-bold uppercase">Live</div>
                          <div className="text-sm font-black text-emerald-700">{liveCount}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-amber-600 font-bold uppercase">Pending</div>
                          <div className="text-sm font-black text-amber-700">{pendingCount}</div>
                        </div>
                        <div className="col-span-3 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px] px-1">
                          <span className="text-slate-500 font-medium">In-Stock Units:</span>
                          <span className="font-bold text-slate-900 font-mono">{totalStock}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedPartnerForProducts(shop)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
                        title={`Manage products for ${shop.name}`}
                      >
                        <PackageCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Products ({shopProds.length})</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingShopkeeper(shop);
                            setIsEditPermissionsModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="Edit Permissions"
                        >
                          <Shield className="w-3.5 h-3.5 text-amber-600" />
                          <span>Permissions</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedShopkeeperId(shop.id);
                            setActiveSubTab('TRANSACTIONS');
                          }}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="View Stock Ledger"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>Ledger</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* TAB 2: PENDING APPROVALS */}
      {activeSubTab === 'APPROVALS' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <span>
              <strong>Review Queue:</strong> Products added by shopkeepers remain offline until reviewed and approved by administrators.
            </span>
            <span className="font-bold font-mono">{pendingProducts.length} Pending</span>
          </div>

          {pendingProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <PackageCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-black text-slate-800">All Products Reviewed</h3>
              <p className="text-xs text-slate-500 mt-1">There are no pending shopkeeper product approval requests.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingProducts.map((p) => {
                const primaryImg = p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80';
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-44 bg-slate-100 overflow-hidden">
                        <img
                          src={primaryImg || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                          PENDING APPROVAL
                        </div>
                        <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                          {p.images?.length || 1} image{p.images?.length === 1 ? '' : 's'}
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span>SKU: <strong className="text-slate-800 font-mono">{p.sku}</strong></span>
                          <span>{p.category_name}</span>
                        </div>

                        <h4 className="text-sm font-black text-slate-900 line-clamp-1">{p.name}</h4>

                        <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Merchant:</span>
                            <span className="font-bold text-slate-800">{p.shopkeeper_name || 'Partner Store'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Shopkeeper Price:</span>
                            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                              ₹{p.shopkeeper_price !== undefined ? p.shopkeeper_price : p.selling_price} (Internal)
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">MRP:</span>
                            <span className="font-medium text-slate-500">₹{p.mrp}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                            <label className="text-slate-700 font-bold">Admin Selling Price:</label>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 font-bold">₹</span>
                              <input
                                type="number"
                                value={adminPriceOverrides[p.id] !== undefined ? adminPriceOverrides[p.id] : (p.admin_selling_price || p.selling_price)}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setAdminPriceOverrides((prev) => ({ ...prev, [p.id]: isNaN(val) ? 0 : val }));
                                }}
                                className="w-20 px-2 py-0.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
                                placeholder="Price"
                                min="1"
                                max={p.mrp}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Initial Stock:</span>
                            <span className="font-bold text-emerald-700 font-mono">{p.stock} units</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                          "{p.description}"
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setRejectModalProduct(p);
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleApprove(p)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve & Go Live</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SHOPKEEPER STOCK MOVEMENT LEDGER & CONFIRMED/DELIVERED ORDERS */}
      {activeSubTab === 'TRANSACTIONS' && (() => {
        const currentShopkeeper = shopkeepers.find(
          (s) => s.id === selectedShopkeeperId || s.shopkeeper_id === selectedShopkeeperId
        );

        // Extract products for selected shopkeeper
        const shopProductIds = new Set(
          allProducts
            .filter((p) => {
              if (selectedShopkeeperId === 'ALL' || !currentShopkeeper) return true;
              if (p.shopkeeper_id && (p.shopkeeper_id === currentShopkeeper.id || p.shopkeeper_id === currentShopkeeper.shopkeeper_id)) return true;
              if (p.shopkeeper_name && (
                p.shopkeeper_name.toLowerCase() === currentShopkeeper.name.toLowerCase() ||
                (currentShopkeeper.store_name && p.shopkeeper_name.toLowerCase() === currentShopkeeper.store_name.toLowerCase())
              )) return true;
              return false;
            })
            .map((p) => p.id)
        );

        // Collect order movements for selected shopkeeper
        const orderMovements: Array<{
          order: Order;
          item: any;
          product?: Product;
          shopkeeperName: string;
        }> = [];

        allOrders.forEach((ord) => {
          (ord.items || []).forEach((item) => {
            let isMatch = false;
            let shopName = item.shopkeeper_name || 'Partner Merchant';

            if (selectedShopkeeperId === 'ALL') {
              isMatch = true;
            } else if (currentShopkeeper) {
              if (item.shopkeeper_id && (item.shopkeeper_id === currentShopkeeper.id || item.shopkeeper_id === currentShopkeeper.shopkeeper_id)) {
                isMatch = true;
                shopName = currentShopkeeper.store_name || currentShopkeeper.name;
              } else if (item.shopkeeper_name && (
                item.shopkeeper_name.toLowerCase() === currentShopkeeper.name.toLowerCase() ||
                (currentShopkeeper.store_name && item.shopkeeper_name.toLowerCase() === currentShopkeeper.store_name.toLowerCase())
              )) {
                isMatch = true;
                shopName = currentShopkeeper.store_name || currentShopkeeper.name;
              } else if (shopProductIds.has(item.product_id)) {
                isMatch = true;
                shopName = currentShopkeeper.store_name || currentShopkeeper.name;
              }
            }

            if (isMatch) {
              const prod = allProducts.find((p) => p.id === item.product_id);
              orderMovements.push({
                order: ord,
                item,
                product: prod,
                shopkeeperName: shopName || prod?.shopkeeper_name || 'Merchant',
              });
            }
          });
        });

        // Compute summary metrics for selected shopkeeper
        const confirmedOrdersList = orderMovements.filter((m) => m.order.order_status !== 'Cancelled');
        const deliveredOrdersList = orderMovements.filter((m) => m.order.order_status === 'Delivered');

        const uniqueConfirmedOrdersCount = new Set(confirmedOrdersList.map((m) => m.order.order_id)).size;
        const uniqueDeliveredOrdersCount = new Set(deliveredOrdersList.map((m) => m.order.order_id)).size;
        const totalDeliveredUnits = deliveredOrdersList.reduce((sum, m) => sum + (m.item.quantity || 1), 0);
        const totalGrossRevenue = confirmedOrdersList.reduce((sum, m) => sum + ((m.item.price || 0) * (m.item.quantity || 1)), 0);

        return (
          <div className="space-y-5">
            {/* Filter Bar & Merchant Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-700">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Shopkeeper Stock Movement & Order Ledger</h3>
                  <p className="text-xs text-slate-500">Track confirmed & delivered stock movements per shopkeeper partner</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-extrabold text-slate-700 shrink-0">Select Merchant Partner:</label>
                <select
                  value={selectedShopkeeperId}
                  onChange={(e) => setSelectedShopkeeperId(e.target.value)}
                  className="bg-slate-50 border-2 border-slate-200 text-xs font-bold rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="ALL">All Merchants & Partner Stores</option>
                  {shopkeepers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.store_name || s.shopkeeper_id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Shopkeeper Banner Header (if specific merchant selected) */}
            {currentShopkeeper && (
              <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-white border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-sm">
                    {currentShopkeeper.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        {currentShopkeeper.shopkeeper_id}
                      </span>
                      <span className="text-xs font-black text-slate-900">
                        {currentShopkeeper.store_name || 'Retail Partner'}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-slate-900 mt-0.5">{currentShopkeeper.name}</h2>
                    <p className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                      <span>📞 +91 {currentShopkeeper.mobile}</span>
                      <span>•</span>
                      <span>📍 {currentShopkeeper.city || 'India'}</span>
                      {currentShopkeeper.email && (
                        <>
                          <span>•</span>
                          <span>✉️ {currentShopkeeper.email}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPartnerForProducts(currentShopkeeper)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>View Catalog ({allProducts.filter(p => p.shopkeeper_id === currentShopkeeper.id || p.shopkeeper_id === currentShopkeeper.shopkeeper_id).length})</span>
                  </button>
                  <button
                    onClick={() => setSelectedShopkeeperId('ALL')}
                    className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>
            )}

            {/* Merchant Summary KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Confirmed Orders</span>
                <p className="text-xl font-black text-slate-900 mt-1">{uniqueConfirmedOrdersCount} <span className="text-xs font-normal text-slate-500">Orders</span></p>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider block">Delivered Orders</span>
                <p className="text-xl font-black text-emerald-800 mt-1">{uniqueDeliveredOrdersCount} <span className="text-xs font-normal text-emerald-600">Orders</span></p>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase text-indigo-800 tracking-wider block">Stock Units Delivered</span>
                <p className="text-xl font-black text-indigo-900 mt-1">{totalDeliveredUnits} <span className="text-xs font-normal text-indigo-600">Pcs</span></p>
              </div>

              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider block">Gross Sales Volume</span>
                <p className="text-xl font-black text-amber-900 mt-1">₹{totalGrossRevenue.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setLedgerViewMode('ORDERS')}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                  ledgerViewMode === 'ORDERS'
                    ? 'bg-slate-900 text-amber-400 shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Confirmed & Delivered Orders Movement ({orderMovements.length})</span>
              </button>

              <button
                onClick={() => setLedgerViewMode('INVENTORY')}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                  ledgerViewMode === 'INVENTORY'
                    ? 'bg-slate-900 text-amber-400 shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Manual Inventory Log ({filteredTransactions.length})</span>
              </button>
            </div>

            {/* MODE A: CONFIRMED & DELIVERED ORDERS MOVEMENT TABLE */}
            {ledgerViewMode === 'ORDERS' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    Order-wise Stock Movement Ledger
                  </h4>
                  <span className="text-xs text-slate-500 font-bold">
                    Showing {orderMovements.length} order items
                  </span>
                </div>

                {orderMovements.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Boxes className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-xs font-bold">No confirmed or delivered order stock movements found for this merchant.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Order ID & Date</th>
                          <th className="px-4 py-3">Customer Details</th>
                          <th className="px-4 py-3">Shopkeeper Product & SKU</th>
                          <th className="px-4 py-3 text-center">Qty Moved</th>
                          <th className="px-4 py-3 text-right">Unit Rate</th>
                          <th className="px-4 py-3 text-right">Total Payable</th>
                          <th className="px-4 py-3 text-center">Order Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orderMovements.map(({ order: ord, item, product, shopkeeperName }, i) => {
                          const isDelivered = ord.order_status === 'Delivered';
                          const isCancelled = ord.order_status === 'Cancelled';
                          const lineTotal = (item.price || 0) * (item.quantity || 1);

                          return (
                            <tr key={`${ord.id}-${item.id || i}`} className="hover:bg-slate-50/80 transition-colors">
                              {/* Order ID & Date */}
                              <td className="px-4 py-3 font-mono">
                                <div className="font-extrabold text-indigo-900 text-xs">{ord.order_id}</div>
                                <div className="text-[10px] text-slate-500">
                                  {new Date(ord.created_at).toLocaleString('en-IN', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })}
                                </div>
                              </td>

                              {/* Customer Details */}
                              <td className="px-4 py-3">
                                <div className="font-bold text-slate-900">{ord.customer_name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">+91 {ord.mobile}</div>
                              </td>

                              {/* Product & SKU */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {(item.image_url || product?.images?.[0]?.image_url) && (
                                    <img
                                      src={item.image_url || product?.images?.[0]?.image_url}
                                      alt={item.product_name}
                                      className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                    />
                                  )}
                                  <div>
                                    <div className="font-bold text-slate-900 line-clamp-1">{item.product_name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      SKU: {item.sku || product?.sku || 'N/A'} {item.size ? `• Size: ${item.size}` : ''} {item.color ? `• Color: ${item.color}` : ''}
                                    </div>
                                    <div className="text-[9px] text-amber-800 font-bold">Partner: {shopkeeperName}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Qty */}
                              <td className="px-4 py-3 text-center">
                                <span className="px-2.5 py-1 bg-amber-100/80 text-amber-900 font-mono font-black text-xs rounded-lg border border-amber-300">
                                  {item.quantity || 1} Pcs
                                </span>
                              </td>

                              {/* Unit Rate */}
                              <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                                ₹{(item.price || 0).toLocaleString('en-IN')}
                              </td>

                              {/* Total Amount */}
                              <td className="px-4 py-3 text-right font-mono font-black text-slate-900 text-sm">
                                ₹{lineTotal.toLocaleString('en-IN')}
                              </td>

                              {/* Order Status */}
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                                    isDelivered
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : isCancelled
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                                  }`}
                                >
                                  {isDelivered && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                                  {ord.order_status}
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
            )}

            {/* MODE B: MANUAL INVENTORY TRANSACTION LOG */}
            {ledgerViewMode === 'INVENTORY' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Tx ID / Date</th>
                        <th className="px-4 py-3">Product / SKU</th>
                        <th className="px-4 py-3">Merchant Store</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 text-right">Quantity</th>
                        <th className="px-4 py-3 text-center">Prev → New</th>
                        <th className="px-4 py-3">Performed By</th>
                        <th className="px-4 py-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTransactions.map((tx) => {
                        const isIncrease = tx.transaction_type === 'IN' || tx.transaction_type === 'RETURN_STOCK_IN';
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 font-mono">
                              <div className="font-bold text-slate-900">{tx.transaction_id}</div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(tx.timestamp).toLocaleString('en-IN', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-800 line-clamp-1">{tx.product_name}</div>
                              <div className="text-[10px] font-mono text-slate-400">{tx.sku}</div>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {tx.shopkeeper_name}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  isIncrease
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isIncrease ? (
                                  <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <ArrowDownRight className="w-3 h-3 text-rose-600" />
                                )}
                                {tx.transaction_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-black font-mono text-sm">
                              <span className={isIncrease ? 'text-emerald-700' : 'text-rose-700'}>
                                {isIncrease ? `+${tx.quantity}` : `-${tx.quantity}`}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-slate-500">
                              {tx.previous_stock} → <strong className="text-slate-900">{tx.new_stock}</strong>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-800">{tx.performed_by_name}</div>
                              <div className="text-[10px] text-slate-400 uppercase font-mono">{tx.performed_by}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate">
                              {tx.reference_note || tx.reason || 'Standard update'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* MODAL 1: ADD SHOPKEEPER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-400" />
                <span>Register New Shopkeeper Partner</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShopkeeper} className="p-5 space-y-3.5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
                  {formSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Shopkeeper / Proprietor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rajesh Mehra"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Store / Brand Name
                </label>
                <input
                  type="text"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="e.g. Mehra Ethnic Studio"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (10 Digits) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="9810101010"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. New Delhi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="rajesh@studio.in"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                Default privileges include Catalog submission, Stock IN, Stock OUT, and Order review. You can customize permissions anytime.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 ${
                    isSaving ? 'opacity-70 cursor-not-allowed bg-slate-400 hover:bg-slate-400' : ''
                  }`}
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create Shopkeeper'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PERMISSIONS */}
      {isEditPermissionsModalOpen && editingShopkeeper && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Granular Permissions: {editingShopkeeper.name}</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">{editingShopkeeper.shopkeeper_id}</p>
              </div>
              <button
                onClick={() => setIsEditPermissionsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-slate-600 mb-2">
                Toggle exact feature privileges for this merchant. Changes take effect instantly in their portal.
              </p>

              {[
                { key: 'can_add_product', label: 'Add New Products', desc: 'Can add products to catalog (subject to Admin approval)' },
                { key: 'can_edit_product', label: 'Edit Own Products', desc: 'Can update title, description, and specifications' },
                { key: 'can_stock_in', label: 'Stock IN (Inward)', desc: 'Can replenish inward stock units with traceable notes' },
                { key: 'can_stock_out', label: 'Stock OUT (Deduction)', desc: 'Can deduct damaged or offline sold inventory' },
                { key: 'can_view_orders', label: 'View Customer Orders', desc: 'Can inspect orders containing their garments' },
                { key: 'can_view_stock_history', label: 'View Stock History', desc: 'Can audit complete stock movement ledger' },
                { key: 'can_edit_price', label: 'Edit Selling Price & MRP', desc: 'Can adjust prices and discounts on their products' },
                { key: 'can_edit_category', label: 'Change Categories', desc: 'Can alter assigned garment category classification' },
                { key: 'can_edit_images', label: 'Upload / Modify Images', desc: 'Can upload up to 4 garment product images' },
              ].map(({ key, label, desc }) => {
                const permKey = key as keyof ShopkeeperPermissions;
                const isEnabled = editingShopkeeper.permissions[permKey];
                return (
                  <div
                    key={key}
                    onClick={() => handleTogglePermission(permKey)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">{label}</div>
                      <div className="text-[11px] text-slate-500">{desc}</div>
                    </div>
                    <div
                      className={`w-10 h-6 rounded-full p-1 transition-colors flex items-center ${
                        isEnabled ? 'bg-amber-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs"></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsEditPermissionsModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECT PRODUCT WITH REASON */}
      {rejectModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-rose-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-300" />
                <span>Reject Product: {rejectModalProduct.name}</span>
              </h3>
              <button
                onClick={() => setRejectModalProduct(null)}
                className="text-rose-200 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Rejection (Returned to Shopkeeper)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setRejectModalProduct(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW PRODUCT DETAILS */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black">Product Details: {viewingProduct.name}</h3>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Top Product Summary */}
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="w-32 h-32 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {viewingProduct.images && viewingProduct.images.length > 0 ? (
                    <img src={viewingProduct.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'} alt={viewingProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                      SKU: {viewingProduct.sku || viewingProduct.id}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        viewingProduct.approval_status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : viewingProduct.approval_status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {viewingProduct.approval_status}
                    </span>
                  </div>

                  <h2 className="text-lg font-black text-slate-900 leading-tight">{viewingProduct.name}</h2>
                  <p className="text-xs text-slate-500">{viewingProduct.description || 'No description provided.'}</p>
                </div>
              </div>

              {/* Pricing Matrix */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">MRP</div>
                  <div className="text-base font-black text-slate-700 line-through">₹{viewingProduct.mrp}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-amber-700 uppercase">Shopkeeper Cost</div>
                  <div className="text-base font-black text-amber-800">₹{viewingProduct.shopkeeper_price ?? 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">Admin Selling Price</div>
                  <div className="text-base font-black text-emerald-800">₹{viewingProduct.admin_selling_price || viewingProduct.selling_price}</div>
                </div>
              </div>

              {/* Inventory & Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-1">Inventory & Options</div>
                  <div>Stock Units: <strong className="font-mono text-slate-900">{viewingProduct.stock || 0}</strong></div>
                  <div>Category: <span className="font-semibold text-slate-800">{viewingProduct.category_name}</span></div>
                  <div>Subcategory: <span className="text-slate-700">{viewingProduct.subcategory_name || 'N/A'}</span></div>
                  <div>Sizes: <span className="font-mono text-slate-800">{Array.isArray(viewingProduct.sizes) && viewingProduct.sizes.length > 0 ? viewingProduct.sizes.join(', ') : 'Standard'}</span></div>
                  <div>Colors: <span className="text-slate-800">{Array.isArray(viewingProduct.colors) && viewingProduct.colors.length > 0 ? viewingProduct.colors.join(', ') : 'Standard'}</span></div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-1">Partner & System Details</div>
                  <div>Shopkeeper Name: <span className="font-semibold text-slate-800">{viewingProduct.shopkeeper_name || 'Partner'}</span></div>
                  <div>Shopkeeper ID: <span className="font-mono text-amber-800">{viewingProduct.shopkeeper_id || 'N/A'}</span></div>
                  <div>Is Live: <span className="font-bold text-slate-800">{viewingProduct.is_live ? 'Yes (Live)' : 'No (Offline)'}</span></div>
                  <div>Updated At: <span className="text-slate-600">{viewingProduct.updated_at ? new Date(viewingProduct.updated_at).toLocaleString() : 'N/A'}</span></div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  const prod = viewingProduct;
                  setViewingProduct(null);
                  handleOpenEditProductModal(prod);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Product</span>
              </button>
              <button
                onClick={() => setViewingProduct(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT PRODUCT FORM */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black">Edit Product: {editingProduct.name}</h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {editFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold">
                  {editFormError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Product Title / Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU / Product Code</label>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editMrp}
                    onChange={(e) => setEditMrp(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shopkeeper Cost Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editShopkeeperPrice}
                    onChange={(e) => setEditShopkeeperPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admin Customer Selling Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editAdminSellingPrice}
                    onChange={(e) => setEditAdminSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">In-Stock Quantity (Units)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editStock}
                    onChange={(e) => setEditStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Primary Image URL</label>
                  <input
                    type="url"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sizes (Comma separated)</label>
                  <input
                    type="text"
                    value={editSizes}
                    onChange={(e) => setEditSizes(e.target.value)}
                    placeholder="S, M, L, XL"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Colors (Comma separated)</label>
                  <input
                    type="text"
                    value={editColors}
                    onChange={(e) => setEditColors(e.target.value)}
                    placeholder="Red, Blue, Black"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approval Status</label>
                  <select
                    value={editApprovalStatus}
                    onChange={(e: any) => setEditApprovalStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="APPROVED">APPROVED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Is Live (Customer Catalog)</label>
                  <select
                    value={editIsLive ? 'true' : 'false'}
                    onChange={(e) => setEditIsLive(e.target.value === 'true')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="true">Yes (Live)</option>
                    <option value="false">No (Offline / Draft)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  ></textarea>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProductEdit}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingProductEdit ? 'Saving to Supabase...' : 'Save Changes to Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
