import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Clock,
  Layers,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { db } from '../../services/db';
import { Order, Product } from '../../types';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenAddProduct: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onOpenAddProduct,
}) => {
  const [stats, setStats] = useState(() => db.getDashboardStats());
  const [recentOrders, setRecentOrders] = useState<Order[]>(() => db.getOrders().slice(0, 5));
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>(() =>
    db.getAllProducts().filter((p) => p.stock <= 10).slice(0, 5)
  );

  const refreshDashboard = () => {
    setStats(db.getDashboardStats());
    setRecentOrders(db.getOrders().slice(0, 5));
    setLowStockProducts(db.getAllProducts().filter((p) => p.stock <= 10).slice(0, 5));
  };

  useEffect(() => {
    refreshDashboard();
    const handleSync = () => {
      refreshDashboard();
    };
    window.addEventListener('style1_data_changed', handleSync);
    return () => window.removeEventListener('style1_data_changed', handleSync);
  }, []);

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

  return (
    <div id="admin-dashboard-view" className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Merchant Dashboard</h1>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Storefront Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time business performance, inventory health, and live customer orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="dashboard-quick-add-product-btn"
            onClick={onOpenAddProduct}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Garment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="font-bold">₹</span>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{(stats.total_sales ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Today: ₹{(stats.today_sales ?? 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>Customer Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total_orders ?? 0}</div>
          <div className="flex items-center gap-1 text-[11px] text-blue-700 font-semibold mt-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Today: {stats.today_orders ?? 0} orders placed</span>
          </div>
        </div>

        {/* Live Products & Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>Live Products</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.published_products ?? stats.live_products ?? 0}</div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-2">
            <span>{(stats.total_stock ?? 0).toLocaleString('en-IN')} units total stock</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-semibold">
            <span>Low Stock Items</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.low_stock_products}</div>
          <button
            onClick={() => onNavigateTab('INVENTORY')}
            className="flex items-center gap-1 text-[11px] text-amber-700 font-bold mt-2 hover:underline"
          >
            <span>Review {stats.out_of_stock_products} out of stock</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Recent Orders + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900">Recent Customer Orders</h2>
            <button
              onClick={() => onNavigateTab('ORDERS')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Order ID</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Items</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-mono font-bold text-indigo-700">
                      {order.order_id}
                    </td>
                    <td className="py-3 font-semibold text-slate-800">
                      {order.customer_name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        +91 {order.mobile}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{order.items?.length || 0} garments</td>
                    <td className="py-3 font-extrabold text-slate-900">
                      ₹{(order.total ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          statusColors[order.order_status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.order_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-black text-slate-900">Low Stock Warnings</h2>
            </div>
            <button
              onClick={() => onNavigateTab('INVENTORY')}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Inventory Panel
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                All garments have sufficient inventory level.
              </p>
            ) : (
              lowStockProducts.map((p) => {
                const img = p.images[0]?.image_url || 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80';
                return (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={img || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                        alt={p.name}
                        className="w-9 h-11 rounded object-cover border border-slate-200"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[170px]">
                          {p.name}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">{p.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                          p.stock <= 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.stock <= 0 ? '0 Left' : `${p.stock} Left`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
