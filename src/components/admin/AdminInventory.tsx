import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, Check, Plus, Minus, RefreshCw, RotateCcw } from 'lucide-react';
import { Product, InventoryTransaction } from '../../types';
import { db } from '../../services/db';

export const AdminInventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(db.getAllProducts());
  const [logs, setLogs] = useState<InventoryTransaction[]>(db.getInventoryLogs());
  const [filter, setFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [search, setSearch] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);

  const refresh = () => {
    setProducts(db.getAllProducts());
    setLogs(db.getInventoryLogs());
  };

  useEffect(() => {
    refresh();
    const handleDataChange = () => {
      refresh();
    };
    window.addEventListener('style1_data_changed', handleDataChange);
    return () => window.removeEventListener('style1_data_changed', handleDataChange);
  }, []);

  const handleQuickAdjust = (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const newStock = Math.max(0, prod.stock + delta);
    db.updateProduct(productId, { stock: newStock });
    refresh();
  };

  const handleSaveCustomStock = (productId: string) => {
    db.updateProduct(productId, { stock: Math.max(0, tempStockValue) });
    setEditingStockId(null);
    refresh();
  };

  const filtered = products.filter((p) => {
    if (filter === 'LOW' && (p.stock <= 0 || p.stock > 10)) return false;
    if (filter === 'OUT' && p.stock > 0) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  return (
    <div id="admin-inventory-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900">Inventory & Stock Health</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time warehouse stock, replenish low counts, and prevent out-of-stock checkouts.
          </p>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-900">{lowStockCount} Low Stock</span>
          </div>

          <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            <span className="text-xs font-bold text-rose-900">{outOfStockCount} Out of Stock</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Garments ({products.length})
          </button>
          <button
            onClick={() => setFilter('LOW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'LOW'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Low Stock (&le; 10) ({lowStockCount})
          </button>
          <button
            onClick={() => setFilter('OUT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'OUT'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or SKU..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="p-3.5">Garment Details</th>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Selling Price</th>
                <th className="p-3.5">Current Stock</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Stock Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const img = p.images[0]?.image_url || 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80';
                const isLow = p.stock > 0 && p.stock <= 10;
                const isOut = p.stock <= 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={img || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                          alt={p.name}
                          className="w-10 h-12 object-cover rounded-lg border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1 max-w-xs">{p.name}</p>
                          <span className="text-[10px] text-slate-400">{p.sizes.join(', ')}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-600 font-semibold">{p.sku}</td>
                    <td className="p-3.5 text-slate-700 font-medium">{p.category_name}</td>
                    <td className="p-3.5 font-extrabold text-slate-900">
                      ₹{(p.selling_price ?? 0).toLocaleString('en-IN')}
                    </td>

                    {/* Stock Value / Inline Editor */}
                    <td className="p-3.5">
                      {editingStockId === p.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={tempStockValue}
                            onChange={(e) => setTempStockValue(Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-indigo-600 rounded text-xs font-bold"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveCustomStock(p.id)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingStockId(p.id);
                            setTempStockValue(p.stock);
                          }}
                          className="cursor-pointer group flex items-center gap-1.5"
                          title="Click to edit stock directly"
                        >
                          <span
                            className={`font-black text-sm px-2 py-0.5 rounded ${
                              isOut
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-slate-900'
                            }`}
                          >
                            {p.stock}
                          </span>
                          <span className="text-[10px] text-slate-400 group-hover:text-indigo-600">
                            ✎
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isOut
                            ? 'bg-rose-100 text-rose-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>

                    {/* Quick Stock Controls */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleQuickAdjust(p.id, -5)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px]"
                          title="Decrease by 5"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(p.id, -1)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                          title="Decrease by 1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(p.id, +1)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                          title="Increase by 1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(p.id, +10)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[10px]"
                          title="Add 10 units"
                        >
                          +10
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

      {/* Return Restock & Inventory Audit Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>Return Stock Restoration Logs</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Audit trail of inventory units restored upon delivery boy return confirmation.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {logs.length} Log Entries
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No return restock events logged yet. Restocked units will appear here automatically when delivery partners confirm returns.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Return ID</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Quantity Restored</th>
                  <th className="p-3">Restored By Delivery Boy</th>
                  <th className="p-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-indigo-700">{log.order_id}</td>
                    <td className="p-3 font-mono text-slate-600">{log.return_id ? `#${log.return_id.slice(0, 8).toUpperCase()}` : '—'}</td>
                    <td className="p-3 font-bold text-slate-900">{log.product_name}</td>
                    <td className="p-3">
                      <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                        +{log.quantity}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">
                      {log.confirmed_by_delivery_boy_name || log.confirmed_by_delivery_boy_id || 'Delivery Partner'}
                    </td>
                    <td className="p-3 text-right text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
