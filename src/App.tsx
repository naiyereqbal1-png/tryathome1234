import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, ShieldAlert, LogOut, ShieldCheck } from 'lucide-react';
import { db } from './services/db';
import { Customer, AdminUser, Product, Category, Order, DeliveryBoy, AuthSession, Shopkeeper } from './types';

// Common Components
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { DynamicThemeStyles } from './components/common/DynamicThemeStyles';

// Customer Components
import { CustomerHomeView } from './components/catalog/CustomerHomeView';
import { ProductDetailModal } from './components/product/ProductDetailModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { WishlistModal } from './components/cart/WishlistModal';
import { CustomerProfileView } from './components/profile/CustomerProfileView';
import { CustomerLoginModal } from './components/auth/CustomerLoginModal';

// Admin Components
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginModal } from './components/admin/AdminLoginModal';

// Delivery Boy Components
import { DeliveryBoyPortal } from './components/delivery/DeliveryBoyPortal';
import { DeliveryBoyLoginModal } from './components/delivery/DeliveryBoyLoginModal';

// Shopkeeper Components
import { ShopkeeperPortal } from './components/shopkeeper/ShopkeeperPortal';
import { ShopkeeperLoginModal } from './components/shopkeeper/ShopkeeperLoginModal';

// Try at Home Login Component (Entry Gate)
import { TryAtHomeLogin } from './components/auth/TryAtHomeLogin';

export default function App() {
  // Navigation View State: 'CUSTOMER' | 'ADMIN' | 'DELIVERY' | 'SHOPKEEPER'
  const [currentView, setCurrentView] = useState<'CUSTOMER' | 'ADMIN' | 'DELIVERY' | 'SHOPKEEPER'>('CUSTOMER');

  // Authenticated Session State (Stored securely via db service)
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => db.getAuthSession());
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Core Data States (Synchronized via db event system)
  const [customer, setCustomer] = useState<Customer | null>(db.getCurrentCustomer());
  const [admin, setAdmin] = useState<AdminUser | null>(db.getCurrentAdmin());
  const [deliveryBoy, setDeliveryBoy] = useState<DeliveryBoy | null>(db.getCurrentDeliveryBoy());
  const [shopkeeper, setShopkeeper] = useState<Shopkeeper | null>(db.getCurrentShopkeeper());
  const [products, setProducts] = useState<Product[]>(db.getAllProducts());
  const [categories, setCategories] = useState<Category[]>(db.getCategories());
  const [cart, setCart] = useState(db.getCart(customer?.id));
  const [wishlist, setWishlist] = useState(db.getWishlist(customer?.id));

  // Sync initial view state based on authenticated role
  useEffect(() => {
    if (authSession) {
      if (authSession.role === 'ADMIN') {
        setCurrentView('ADMIN');
      } else if (authSession.role === 'SHOPKEEPER') {
        setCurrentView('SHOPKEEPER');
      } else if (authSession.role === 'DELIVERY_BOY') {
        setCurrentView('DELIVERY');
      } else {
        setCurrentView('CUSTOMER');
      }
    }
  }, []);

  // Customer Filtering & Navigation
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileActiveNavTab, setMobileActiveNavTab] = useState<string>('HOME');

  // Customer Modals & Drawers
  const [isCustomerLoginOpen, setIsCustomerLoginOpen] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isProfileViewOpen, setIsProfileViewOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'ORDERS' | 'PROFILE' | 'ADDRESSES'>('ORDERS');

  // Floating Cart Notification (Non-blocking toast on adding item)
  const [cartNotification, setCartNotification] = useState<{
    productName: string;
    size?: string;
    color?: string;
    quantity?: number;
  } | null>(null);

  // Auto-dismiss cart notification after 3.5s
  useEffect(() => {
    if (!cartNotification) return;
    const timer = setTimeout(() => {
      setCartNotification(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [cartNotification]);

  // Order Success Toast State
  const [latestPlacedOrder, setLatestPlacedOrder] = useState<Order | null>(null);

  // Admin & Delivery & Shopkeeper Modals
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isDeliveryLoginOpen, setIsDeliveryLoginOpen] = useState(false);
  const [isShopkeeperLoginOpen, setIsShopkeeperLoginOpen] = useState(false);

  // Real-time synchronization callback across Customer <-> Admin <-> Delivery <-> Shopkeeper
  const refreshAppData = useCallback(() => {
    const curSess = db.getAuthSession();
    const curCust = db.getCurrentCustomer();
    const curAdmin = db.getCurrentAdmin();
    const curBoy = db.getCurrentDeliveryBoy();
    const curShop = db.getCurrentShopkeeper();
    setAuthSession(curSess);
    setCustomer(curCust);
    setAdmin(curAdmin);
    setDeliveryBoy(curBoy);
    setShopkeeper(curShop);
    setProducts(db.getAllProducts());
    setCategories(db.getCategories());
    setCart(db.getCart(curCust?.id));
    setWishlist(db.getWishlist(curCust?.id));
  }, []);

  useEffect(() => {
    // Initial sync
    refreshAppData();

    // Listen to storewide event fired by db.ts on any mutation
    const handleDataChanged = () => {
      refreshAppData();
    };

    window.addEventListener('style1_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('style1_data_changed', handleDataChanged);
    };
  }, [refreshAppData]);

  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);
    refreshAppData();
    if (session.role === 'ADMIN') {
      setCurrentView('ADMIN');
    } else if (session.role === 'SHOPKEEPER') {
      setCurrentView('SHOPKEEPER');
    } else if (session.role === 'DELIVERY_BOY') {
      setCurrentView('DELIVERY');
    } else {
      setCurrentView('CUSTOMER');
    }
  };

  const handleGlobalLogout = () => {
    db.logout();
    setAuthSession(null);
    setCustomer(null);
    setAdmin(null);
    setDeliveryBoy(null);
    setShopkeeper(null);
    setCurrentView('CUSTOMER');
  };

  // Handle Cart Operations - Item added directly to cart without opening checkout modal or cart drawer
  const handleAddToCart = (product: Product, size: string, color: string, quantity: number = 1) => {
    db.addToCart(product, size, color, quantity || 1, customer?.id);
    // User requested: Add item to cart without opening checkout box or cart drawer
    setCartNotification({
      productName: product.name,
      size,
      color,
      quantity: quantity || 1,
    });
  };

  const handleBuyNow = (product: Product, size: string, color: string, quantity: number = 1) => {
    db.addToCart(product, size, color, quantity || 1, customer?.id);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleUpdateCartQuantity = (cartItemId: string, qty: number) => {
    db.updateCartQuantity(cartItemId, qty, customer?.id);
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    db.removeFromCart(cartItemId, customer?.id);
  };

  // Handle Wishlist Operations
  const handleToggleWishlist = (product: Product) => {
    db.toggleWishlist(product, customer?.id);
  };

  const handleRemoveFromWishlist = (productId: string) => {
    db.removeFromWishlist(productId, customer?.id);
  };

  const handleMoveWishlistToCart = (product: Product, size?: string, color?: string) => {
    const defaultSize = size || (product.sizes && product.sizes[0]) || 'M';
    const defaultColor = color || (product.colors && product.colors[0]) || 'Default';
    db.addToCart(product, defaultSize, defaultColor, 1, customer?.id);
    db.removeFromWishlist(product.id, customer?.id);
    setCartNotification({
      productName: product.name,
      size: defaultSize,
      color: defaultColor,
      quantity: 1,
    });
  };

  const handleBatchMoveWishlistToCart = (items: { product: Product; size: string; color: string }[]) => {
    items.forEach((item) => {
      db.addToCart(item.product, item.size, item.color, 1, customer?.id);
      db.removeFromWishlist(item.product.id, customer?.id);
    });
    if (items.length > 0) {
      setCartNotification({
        productName: `${items.length} items from Wishlist`,
        quantity: items.length,
      });
    }
  };

  // Handle Customer Profile Navigation
  const handleOpenProfile = (tab: 'ORDERS' | 'PROFILE' | 'ADDRESSES' = 'ORDERS') => {
    if (!customer) {
      setIsCustomerLoginOpen(true);
      return;
    }
    setProfileInitialTab(tab);
    setIsProfileViewOpen(true);
  };

  // Handle Admin Entrance
  const handleOpenAdminPortal = () => {
    if (authSession?.role === 'ADMIN' && admin) {
      setCurrentView('ADMIN');
    } else {
      setAccessDeniedMessage(
        'Access Restricted: You are currently signed in as a Customer. The Admin Panel is strictly reserved for registered Administrators.'
      );
    }
  };

  // Handle Shopkeeper Entrance
  const handleOpenShopkeeperPortal = () => {
    if (authSession?.role === 'SHOPKEEPER' && (shopkeeper || db.getCurrentShopkeeper())) {
      setCurrentView('SHOPKEEPER');
    } else {
      setIsShopkeeperLoginOpen(true);
    }
  };

  // Handle Delivery Partner Entrance
  const handleOpenDeliveryPortal = () => {
    if (authSession?.role === 'DELIVERY_BOY' && deliveryBoy) {
      setCurrentView('DELIVERY');
    } else {
      setAccessDeniedMessage(
        'Access Restricted: You are currently signed in as a Customer. The Delivery Boy portal is strictly reserved for registered delivery partners.'
      );
    }
  };

  // Handle Order Placed
  const handleOrderPlaced = (order: Order) => {
    setLatestPlacedOrder(order);
    setIsCheckoutOpen(false);
    // Open profile view on orders tab to show live progress
    setTimeout(() => {
      setIsProfileViewOpen(true);
      setProfileInitialTab('ORDERS');
    }, 600);
  };

  // Customer filter for live published garments only (approved & live)
  const publishedProducts = products.filter((p) => {
    if (p.shopkeeper_id) {
      const sk = db.getShopkeeperById(p.shopkeeper_id);
      if (sk && sk.status !== 'ACTIVE') return false;
      return p.approval_status === 'APPROVED' && p.is_live === true && p.status === 'Published' && (p.stock || 0) > 0;
    }
    const isApproved = p.approval_status ? p.approval_status === 'APPROVED' : true;
    const isLive = p.is_live !== false;
    return p.status === 'Published' && isApproved && isLive && (p.stock || 0) > 0;
  });
  const wishlistIds = wishlist.map((w) => w.product_id);

  // CRITICAL REQUIREMENT: LOGIN MUST COME BEFORE THE WEBSITE
  if (!authSession) {
    return <TryAtHomeLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // If Shopkeeper View is active and authenticated, show Shopkeeper Portal
  if (currentView === 'SHOPKEEPER') {
    const curShop = shopkeeper || db.getCurrentShopkeeper();
    if (authSession.role === 'SHOPKEEPER' && curShop) {
      return (
        <ShopkeeperPortal
          shopkeeper={curShop}
          onLogout={handleGlobalLogout}
          onSwitchToCustomerView={() => setCurrentView('CUSTOMER')}
        />
      );
    } else {
      setCurrentView(authSession.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER');
    }
  }

  // If Delivery Partner View is active and authenticated, show Delivery Partner Portal
  if (currentView === 'DELIVERY') {
    if (authSession.role === 'DELIVERY_BOY' && deliveryBoy) {
      return (
        <DeliveryBoyPortal
          deliveryBoy={deliveryBoy}
          onLogout={handleGlobalLogout}
          onSwitchToStore={() => {
            // Delivery boy operates in delivery portal
          }}
        />
      );
    } else {
      setCurrentView(authSession.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER');
    }
  }

  // If Admin View is active and authenticated, show Admin Layout
  if (currentView === 'ADMIN') {
    if (authSession.role === 'ADMIN' && admin) {
      return (
        <AdminLayout
          admin={admin}
          onLogout={handleGlobalLogout}
          onSwitchToCustomerView={() => setCurrentView('CUSTOMER')}
        />
      );
    } else {
      setCurrentView(authSession.role === 'DELIVERY_BOY' ? 'DELIVERY' : 'CUSTOMER');
    }
  }

  return (
    <div id="style1-customer-root" className="min-h-screen bg-slate-50 flex flex-col font-sans theme-bg-body">
      <DynamicThemeStyles />
      {/* Shopkeeper preview banner when shopkeeper views storefront */}
      {authSession.role === 'SHOPKEEPER' && (
        <div className="bg-amber-950 border-b border-amber-500/30 text-white px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-50">
          <span className="font-semibold flex items-center gap-1.5 text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Viewing Storefront as Shopkeeper ({authSession.name} • {shopkeeper?.store_name || shopkeeper?.shopkeeper_id})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('SHOPKEEPER')}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold text-xs transition-colors cursor-pointer"
            >
              Return to Shopkeeper Portal
            </button>
            <button
              onClick={handleGlobalLogout}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-md font-medium text-xs transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Admin preview banner when admin views storefront */}
      {authSession.role === 'ADMIN' && (
        <div className="bg-slate-900 border-b border-indigo-500/30 text-white px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-50">
          <span className="font-semibold flex items-center gap-1.5 text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Viewing Marketplace as Administrator ({authSession.name})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('ADMIN')}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold text-xs transition-colors"
            >
              Return to Admin Panel
            </button>
            <button
              onClick={handleGlobalLogout}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-md font-medium text-xs transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Top Global Header (Flipkart-inspired layout) */}
      <Header
        customer={customer}
        currentCustomer={customer}
        cartCount={cart.items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0)}
        wishlistCount={wishlist.length}
        categories={categories}
        activeCategorySlug={activeCategorySlug}
        onSelectCategory={(slug) => {
          setActiveCategorySlug(slug);
          setIsProfileViewOpen(false);
        }}
        onOpenLogin={() => setIsCustomerLoginOpen(true)}
        onOpenProfile={() => handleOpenProfile('ORDERS')}
        onOpenOrders={() => handleOpenProfile('ORDERS')}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAdmin={handleOpenAdminPortal}
        onToggleAdminView={handleOpenAdminPortal}
        onOpenShopkeeper={handleOpenShopkeeperPortal}
        isAdminView={false}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area: Either Customer Profile or Marketplace Catalog */}
      <div className="flex-1">
        {isProfileViewOpen && customer ? (
          <main className="max-w-7xl mx-auto px-4 py-6">
            <CustomerProfileView
              customer={customer}
              onBack={() => setIsProfileViewOpen(false)}
              initialTab={profileInitialTab}
            />
          </main>
        ) : (
          <CustomerHomeView
            products={publishedProducts}
            categories={categories}
            activeCategorySlug={activeCategorySlug}
            onSelectCategory={setActiveCategorySlug}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onOpenProductDetail={(prod) => setSelectedDetailProduct(prod)}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            wishlistProductIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
          />
        )}
      </div>

      {/* Footer */}
      <Footer
        onSelectCategory={(slug) => {
          setActiveCategorySlug(slug);
          setIsProfileViewOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onToggleAdminView={handleOpenAdminPortal}
        onOpenDeliveryLogin={handleOpenDeliveryPortal}
        onOpenShopkeeper={handleOpenShopkeeperPortal}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={isProfileViewOpen ? 'PROFILE' : mobileActiveNavTab}
        onSelectTab={(tab) => {
          setMobileActiveNavTab(tab);
          if (tab === 'HOME') {
            setIsProfileViewOpen(false);
            setActiveCategorySlug('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (tab === 'CATEGORIES') {
            setIsProfileViewOpen(false);
            // Scroll to category bar
            const catElem = document.getElementById('category-circle-strip');
            if (catElem) catElem.scrollIntoView({ behavior: 'smooth' });
          } else if (tab === 'ORDERS') {
            handleOpenProfile('ORDERS');
          } else if (tab === 'WISHLIST') {
            setIsWishlistOpen(true);
          } else if (tab === 'CART') {
            setIsCartOpen(true);
          } else if (tab === 'PROFILE') {
            handleOpenProfile('PROFILE');
          }
        }}
        cartCount={cart.items.reduce((acc: number, it: any) => acc + it.quantity, 0)}
        wishlistCount={wishlist.length}
        isLoggedIn={!!customer}
        onOpenLogin={() => setIsCustomerLoginOpen(true)}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={!!selectedDetailProduct}
        onClose={() => setSelectedDetailProduct(null)}
        product={selectedDetailProduct}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        isWishlisted={selectedDetailProduct ? wishlistIds.includes(selectedDetailProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onOpenCustomerLogin={() => setIsCustomerLoginOpen(true)}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        customer={customer}
        currentCustomer={customer}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onShopMore={() => {
          setIsCartOpen(false);
          setActiveCategorySlug('');
          setIsProfileViewOpen(false);
        }}
      />

      {/* Checkout Modal (Address & COD / Online Payment) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        customer={customer}
        currentCustomer={customer}
        cart={cart}
        onOpenLogin={() => {
          setIsCheckoutOpen(false);
          setIsCustomerLoginOpen(true);
        }}
        onRequireLogin={() => {
          setIsCheckoutOpen(false);
          setIsCustomerLoginOpen(true);
        }}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Wishlist Modal */}
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        wishlistProducts={wishlist}
        allProducts={products}
        onRemoveWishlist={(prod) => handleToggleWishlist(prod)}
        onRemove={(prodId) => handleRemoveFromWishlist(prodId)}
        onAddToCart={(prod, size, color) => handleMoveWishlistToCart(prod, size, color)}
        onMoveToCart={(prod, size, color) => handleMoveWishlistToCart(prod, size, color)}
        onBatchMoveToCart={handleBatchMoveWishlistToCart}
        onClearWishlist={() => db.clearWishlist(customer?.id)}
        onOpenDetail={(prod) => {
          setIsWishlistOpen(false);
          setSelectedDetailProduct(prod);
        }}
      />

      {/* Customer OTP Login Modal */}
      <CustomerLoginModal
        isOpen={isCustomerLoginOpen}
        onClose={() => setIsCustomerLoginOpen(false)}
        onLoginSuccess={(loggedCustomer) => {
          setCustomer(loggedCustomer);
          setIsCustomerLoginOpen(false);
        }}
      />

      {/* Admin Portal Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={(adminUser) => {
          setAdmin(adminUser);
          setIsAdminLoginOpen(false);
          setCurrentView('ADMIN');
        }}
      />

      {/* Delivery Partner Login Modal */}
      <DeliveryBoyLoginModal
        isOpen={isDeliveryLoginOpen}
        onClose={() => setIsDeliveryLoginOpen(false)}
        onLoginSuccess={(boy) => {
          setDeliveryBoy(boy);
          setIsDeliveryLoginOpen(false);
          setCurrentView('DELIVERY');
        }}
      />

      {/* Shopkeeper Partner Login Modal */}
      <ShopkeeperLoginModal
        isOpen={isShopkeeperLoginOpen}
        onClose={() => setIsShopkeeperLoginOpen(false)}
        onLoginSuccess={(loggedShopkeeper) => {
          setShopkeeper(loggedShopkeeper);
          setIsShopkeeperLoginOpen(false);
          refreshAppData();
          setCurrentView('SHOPKEEPER');
        }}
      />
      {/* Floating Cart Notification Toast (Shows on Add to Cart without opening checkout/cart) */}
      {cartNotification && (
        <div
          id="cart-added-toast"
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </span>
            <div className="text-xs min-w-0">
              <p className="font-extrabold text-white truncate">{cartNotification.productName}</p>
              <p className="text-slate-400 text-[11px] truncate">
                Added to cart • Size: {cartNotification.size || 'M'}
                {cartNotification.quantity && cartNotification.quantity > 1 ? ` • Qty: ${cartNotification.quantity}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setCartNotification(null);
                setIsCartOpen(true);
              }}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
            >
              View Cart
            </button>
            <button
              onClick={() => setCartNotification(null)}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      {/* Access Restriction Notification Modal */}
      {accessDeniedMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Access Restricted</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {accessDeniedMessage}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setAccessDeniedMessage(null)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Continue as Customer
              </button>
              <button
                onClick={() => {
                  setAccessDeniedMessage(null);
                  handleGlobalLogout();
                }}
                className="w-full py-2 px-4 text-slate-600 hover:text-rose-600 text-xs font-medium transition-colors"
              >
                Sign Out to Switch Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
