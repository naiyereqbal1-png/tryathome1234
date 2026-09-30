import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  CheckCircle,
  XCircle,
  Package,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { Product, Category, ProductStatus } from '../../types';
import { db } from '../../services/db';

interface AdminProductsProps {
  onOpenAddProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  categories: Category[];
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  onOpenAddProduct,
  onOpenEditProduct,
  categories,
}) => {
  const [products, setProducts] = useState<Product[]>(db.getAllProducts());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const refreshProducts = () => {
    setProducts(db.getAllProducts());
  };

  useEffect(() => {
    const handleSync = () => {
      refreshProducts();
    };
    window.addEventListener('style1_data_changed', handleSync);
    return () => window.removeEventListener('style1_data_changed', handleSync);
  }, []);

  const handleSyncFromSupabase = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const success = await db.syncFromSupabase();
      if (success) {
        setSyncStatus({ message: 'Garment catalog & products refreshed successfully from Supabase!', type: 'success' });
        refreshProducts();
      } else {
        setSyncStatus({ message: 'Could not refresh catalog from Supabase. Live syncing might be configured incorrectly.', type: 'error' });
      }
    } catch (err: any) {
      console.error("[Catalog Refresh] Sync error:", err);
      setSyncStatus({ message: err.message || 'Error occurred while syncing products from database.', type: 'error' });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4500);
    }
  };

  const handleTogglePublish = (productId: string) => {
    db.togglePublishProduct(productId);
    refreshProducts();
  };

  const handleDuplicate = (productId: string) => {
    db.duplicateProduct(productId);
    refreshProducts();
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this garment? This action cannot be undone.')) {
      setIsSyncing(true);
      try {
        await db.deleteProductAsync(productId);
        alert('Product deleted successfully from both local storage and live Supabase database.');
      } catch (err: any) {
        console.error("Failed to delete product:", err);
        const errMsg = err?.message || String(err);
        const isForeignKey = errMsg.includes("order_items") || errMsg.includes("constraint");
        if (isForeignKey) {
          if (confirm('This garment has active order history / references in existing customer purchases and cannot be deleted physically. Would you like to unpublish and hide it from customers instead?')) {
            try {
              await db.updateProductAsync(productId, { status: 'Unpublished', is_live: false });
              alert('Product has been successfully unpublished and hidden from the customer storefront.');
            } catch (updateErr: any) {
              alert(`Failed to unpublish product: ${updateErr.message || updateErr}`);
            }
          }
        } else {
          alert(`Failed to delete product: ${errMsg}`);
        }
      } finally {
        setIsSyncing(false);
        refreshProducts();
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.category_id !== selectedCategory && p.category_slug !== selectedCategory) {
      return false;
    }
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchSku = (p.sku || '').toLowerCase().includes(q);
      const matchBrand = (p.brand || '').toLowerCase().includes(q);
      const matchCat = (p.category_name || '').toLowerCase().includes(q);
      const matchShopkeeper = (p.shopkeeper_name || '').toLowerCase().includes(q);
      const matchGender = (p.gender || '').toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchBrand && !matchCat && !matchShopkeeper && !matchGender) return false;
    }
    return true;
  });

  return (
    <div id="admin-products-management" className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900">Garment Catalog & Products</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your store's clothing catalog, prices, stocks, and live publication visibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="admin-sync-catalog-btn"
            onClick={handleSyncFromSupabase}
            disabled={isSyncing}
            className={`px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>{isSyncing ? 'Refreshing Catalog...' : 'Refresh Catalog (Supabase)'}</span>
          </button>

          <button
            id="admin-add-product-btn"
            onClick={onOpenAddProduct}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Garment</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className={`p-4 rounded-xl border-2 text-xs font-bold animate-in fade-in duration-200 ${
          syncStatus.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {syncStatus.message}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <input
            id="admin-products-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by garment title, SKU, or brand..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <select
            id="admin-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold bg-white cursor-pointer outline-hidden"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            id="admin-status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold bg-white cursor-pointer outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="Published">Published (Live)</option>
            <option value="Draft">Draft</option>
            <option value="Unpublished">Unpublished</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-3.5">Product</th>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price & MRP</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5">Live Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No garments found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const img =
                    p.images.find((i) => i.is_primary)?.image_url ||
                    p.images[0]?.image_url ||
                    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80';

                  const isLive = p.status === 'Published';

                  return (
                    <tr
                      key={p.id}
                      id={`admin-product-row-${p.id}`}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Product details */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={img || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                            alt={p.name}
                            className="w-11 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {p.brand}
                            </span>
                            <h4 className="font-bold text-slate-900 line-clamp-1 max-w-xs">
                              {p.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                              <span>{p.gender}</span>
                              <span>•</span>
                              <span>{p.sizes.join(', ')}</span>
                              {p.shopkeeper_name && (
                                <>
                                  <span>•</span>
                                  <span className="font-extrabold text-amber-700 bg-amber-50 px-1 rounded border border-amber-200">
                                    Shop: {p.shopkeeper_name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="p-3.5 font-mono text-slate-600 font-semibold">{p.sku}</td>

                      {/* Category */}
                      <td className="p-3.5 font-medium text-slate-700">{p.category_name}</td>

                      {/* Pricing */}
                      <td className="p-3.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-extrabold text-slate-900">
                            ₹{(p.selling_price ?? 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-400 line-through">
                            ₹{(p.mrp ?? 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {(p.discount_percentage ?? 0) > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600">
                              {p.discount_percentage}% Off
                            </span>
                          )}
                          {p.shopkeeper_price !== undefined && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200" title="Shopkeeper Internal Cost">
                              Cost: ₹{p.shopkeeper_price}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="p-3.5">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            p.stock <= 0
                              ? 'bg-rose-100 text-rose-800'
                              : p.stock <= 10
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {p.stock} units
                        </span>
                      </td>

                      {/* Live Toggle */}
                      <td className="p-3.5">
                        <button
                          id={`toggle-publish-${p.id}`}
                          onClick={() => handleTogglePublish(p.id)}
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] flex items-center gap-1 transition-all ${
                            isLive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {isLive ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-600" />
                              <span>LIVE (PUBLISHED)</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-slate-500" />
                              <span>{p.status.toUpperCase()}</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`edit-product-btn-${p.id}`}
                            onClick={() => onOpenEditProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            id={`duplicate-product-btn-${p.id}`}
                            onClick={() => handleDuplicate(p.id)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Duplicate Product"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            id={`delete-product-btn-${p.id}`}
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
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
  );
};
