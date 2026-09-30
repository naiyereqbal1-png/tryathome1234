import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Store,
  Truck,
  Sparkles,
} from 'lucide-react';
import { AdminUser, Category, Product } from '../../types';
import { db } from '../../services/db';
import { AdminDashboard } from './AdminDashboard';
import { AdminProducts } from './AdminProducts';
import { AdminProductFormModal } from './AdminProductFormModal';
import { AdminCategories } from './AdminCategories';
import { AdminInventory } from './AdminInventory';
import { AdminOrders } from './AdminOrders';
import { AdminOrderManagement } from './AdminOrderManagement';
import { AdminOrderHistory } from './AdminOrderHistory';
import { AdminDeliveryBoys } from './AdminDeliveryBoys';
import { AdminCustomers } from './AdminCustomers';
import { AdminSettings } from './AdminSettings';
import { AdminShopkeepers } from './AdminShopkeepers';
import { AdminHeroCarouselSettings } from './AdminHeroCarouselSettings';
import { AdminThemeSettings } from './AdminThemeSettings';
import { Image as ImageIcon } from 'lucide-react';

interface AdminLayoutProps {
  admin: AdminUser;
  onLogout: () => void;
  onSwitchToCustomerView: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  admin,
  onLogout,
  onSwitchToCustomerView,
}) => {
  const [activeTab, setActiveTab] = useState<string>('DASHBOARD');
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [categories, setCategories] = useState<Category[]>(db.getCategories());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setCategories(db.getCategories());
    };
    window.addEventListener('style1_data_changed', handleSync);
    return () => window.removeEventListener('style1_data_changed', handleSync);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setProductToEdit(prod);
    setIsProductModalOpen(true);
  };

  const handleProductSaveSuccess = (message: string) => {
    showToast(message, 'success');
  };

  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'PRODUCTS', label: 'Products Catalog', icon: Package },
    { id: 'CATEGORIES', label: 'Categories', icon: Layers },
    { id: 'SHOPKEEPERS', label: 'Shopkeeper Partners', icon: Store, badge: 'New' },
    { id: 'INVENTORY', label: 'Inventory & Stock', icon: Boxes },
    { id: 'ORDERS', label: 'Order History & Orders', icon: ShoppingBag },
    { id: 'DELIVERY_BOYS', label: 'Delivery Partner Portal', icon: Truck },
    { id: 'CUSTOMERS', label: 'Customers', icon: Users },
    { id: 'THEME_DESIGN', label: 'Website Theme & Design', icon: Sparkles, badge: 'Theme' },
    { id: 'SETTINGS', label: 'Store Settings', icon: Settings },
  ];

  return (
    <div id="admin-portal-root" className="h-screen overflow-hidden bg-slate-100 flex flex-col">
      {/* Top Global Admin Bar */}
      <header className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-40 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-1 text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-white">TRYatHOME</span>
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded tracking-wide">
              ADMIN
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Switch to Customer Storefront Button */}
          <button
            id="switch-to-customer-storefront-btn"
            onClick={onSwitchToCustomerView}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Customer Storefront</span>
            <span className="sm:hidden">Store</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </button>

          {/* Admin User Info & Logout */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-200 block leading-tight">
                {admin.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {admin.role.toUpperCase()}
              </span>
            </div>

            <button
              id="admin-logout-btn"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar + Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Desktop + Mobile Drawer) */}
        <aside
          id="admin-sidebar"
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 pt-16 md:pt-0 md:static md:translate-x-0 overflow-y-auto ${
            mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              E-Commerce Management
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isOrdersTab = item.id === 'ORDERS';
              
              if (isOrdersTab) {
                const isSubItemActive = activeTab === 'ORDER_MANAGEMENT' || activeTab === 'ORDER_HISTORY' || activeTab === 'ORDERS';
                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      id={`admin-nav-orders-toggle`}
                      onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                        isSubItemActive
                          ? 'bg-slate-100 text-slate-900 border-l-4 border-indigo-500'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 text-indigo-500 transition-transform ${isSubItemActive ? 'scale-110 text-indigo-600' : ''}`} />
                        <span className="tracking-wide font-extrabold uppercase">ORDERS</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider bg-indigo-100 text-indigo-800">
                          Core
                        </span>
                        {isOrdersExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isOrdersExpanded && (
                      <div className="pl-4 space-y-1 border-l border-slate-200 ml-5">
                        <button
                          id="admin-nav-order-management"
                          onClick={() => {
                            setActiveTab('ORDER_MANAGEMENT');
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                            activeTab === 'ORDER_MANAGEMENT' || activeTab === 'ORDERS'
                              ? 'bg-indigo-900 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'ORDER_MANAGEMENT' || activeTab === 'ORDERS' ? 'bg-amber-400' : 'bg-slate-300'}`}></div>
                          <span>Order Management</span>
                        </button>
                        
                        <button
                          id="admin-nav-order-history"
                          onClick={() => {
                            setActiveTab('ORDER_HISTORY');
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                            activeTab === 'ORDER_HISTORY'
                              ? 'bg-indigo-900 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'ORDER_HISTORY' ? 'bg-amber-400' : 'bg-slate-300'}`}></div>
                          <span>Order History</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id.toLowerCase()}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform ${
                      isActive ? 'text-amber-400' : 'text-slate-400'
                    }`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[11px] font-bold text-slate-700">Store Live & Synced</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Changes reflect instantaneously on customer site.
            </p>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/40 z-20 md:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className={`${activeTab === 'ORDERS' || activeTab === 'ORDER_MANAGEMENT' || activeTab === 'ORDER_HISTORY' ? 'max-w-[100%] px-1' : 'max-w-7xl'} mx-auto`}>
            {activeTab === 'DASHBOARD' && (
              <AdminDashboard
                onNavigateTab={(tab) => {
                  if (tab === 'ORDERS') {
                    setActiveTab('ORDER_MANAGEMENT');
                  } else {
                    setActiveTab(tab);
                  }
                }}
                onOpenAddProduct={handleOpenAddProduct}
              />
            )}

            {activeTab === 'PRODUCTS' && (
              <AdminProducts
                categories={categories}
                onOpenAddProduct={handleOpenAddProduct}
                onOpenEditProduct={handleOpenEditProduct}
              />
            )}

            {activeTab === 'CATEGORIES' && <AdminCategories />}

            {activeTab === 'SHOPKEEPERS' && <AdminShopkeepers />}

            {activeTab === 'INVENTORY' && <AdminInventory />}

            {activeTab === 'ORDERS' && <AdminOrderManagement />}

            {activeTab === 'ORDER_MANAGEMENT' && <AdminOrderManagement />}

            {activeTab === 'ORDER_HISTORY' && <AdminOrderHistory />}

            {activeTab === 'DELIVERY_BOYS' && <AdminDeliveryBoys />}

            {activeTab === 'CUSTOMERS' && <AdminCustomers />}

            {activeTab === 'HERO_CAROUSEL' && <AdminHeroCarouselSettings />}

            {activeTab === 'THEME_DESIGN' && <AdminThemeSettings />}

            {activeTab === 'SETTINGS' && (
              <AdminSettings
                onCatalogReset={() => {
                  setCategories(db.getCategories());
                  setActiveTab('DASHBOARD');
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Product Modal */}
      <AdminProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={productToEdit}
        onSaveSuccess={handleProductSaveSuccess}
        categories={categories}
      />

      {/* Reusable Toast Notifications */}
      {toast && (
        <div
          id="admin-global-toast"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-xs font-extrabold transition-all duration-300 animate-slide-up ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black">✓</div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center font-black">✗</div>
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
