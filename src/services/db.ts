import {
  AdminUser,
  Category,
  Customer,
  CustomerAddress,
  DashboardStats,
  DeliveryBoy,
  DeliveryBoyDetailedManagement,
  ExcelImportRow,
  ExcelValidationResult,
  Order,
  OrderItem,
  OrderBillCalculation,
  OrderItemCalculation,
  OrderStatus,
  OrderType,
  PaymentStatus,
  ItemReturnStatus,
  ProductReturn,
  InventoryTransaction,
  Product,
  ProductStatus,
  StoreSettings,
  WishlistItem,
  UserRole,
  AuthSession,
  AdminAccount,
  Shopkeeper,
  ShopkeeperPermissions,
  StockTransaction,
  ProductReview,
  ProductRatingStats,
} from '../types';
import { generateDemoProducts, INITIAL_CATEGORIES } from './demoData';
import * as XLSX from 'xlsx';
import {
  fetchFullDataFromSupabase,
  supabaseSaveAddress,
  supabaseDeleteAddress,
  supabaseSaveOrder,
  supabaseUpdateOrderStatus,
  supabaseUpdateOrderShipping,
  supabaseAssignDeliveryBoy,
  supabaseSaveProduct,
  supabaseUpdateProduct,
  supabaseDeleteProduct,
  supabaseSaveCustomer,
  supabaseSaveCategory,
  supabaseSaveShopkeeper,
  supabaseSaveDeliveryBoy,
  supabaseSaveSettings,
  supabaseSaveReturn,
  supabaseSaveStockTransaction,
  supabaseSubscribeRealtime,
  supabaseDeleteCategory,
  supabaseDeleteCustomer,
  supabaseDeleteShopkeeper,
  supabaseDeleteDeliveryBoy,
  supabaseSaveReview,
  supabaseDeleteReview,
  supabaseSaveCartItem,
  supabaseDeleteCartItem,
  supabaseClearCart,
  supabaseSaveWishlistItem,
  supabaseDeleteWishlistItem,
  supabaseClearWishlist,
  supabaseSaveAuthSession,
  supabaseDeleteAuthSession,
  supabaseSaveAdminAccount,
  supabaseDeleteAdminAccount,
  pullFromSupabase,
  pushToSupabase,
} from './supabaseSync';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const STORAGE_KEYS = {
  PRODUCTS: 'style1_products',
  CATEGORIES: 'style1_categories',
  CUSTOMERS: 'style1_customers',
  ORDERS: 'style1_orders',
  RETURNS: 'style1_product_returns',
  CURRENT_CUSTOMER: 'style1_current_customer',
  CURRENT_ADMIN: 'style1_current_admin',
  DELIVERY_BOYS: 'style1_delivery_boys',
  CURRENT_DELIVERY_BOY: 'style1_current_delivery_boy',
  SHOPKEEPERS: 'style1_shopkeepers',
  CURRENT_SHOPKEEPER: 'style1_current_shopkeeper',
  STOCK_TRANSACTIONS: 'style1_stock_transactions',
  CART: 'style1_cart_',
  WISHLIST: 'style1_wishlist_',
  SETTINGS: 'style1_settings',
  ACTIVE_OTP: 'style1_active_otp',
  INVENTORY_LOGS: 'style1_inventory_logs',
  AUTH_SESSION: 'style1_auth_session',
  ADMIN_ACCOUNTS: 'style1_admin_accounts',
  REVIEWS: 'style1_product_reviews',
};

const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'TRYatHOME',
  store_tagline: 'India’s Modern Garment & Fashion Destination • Try at Home',
  contact_email: 'care@tryathome.in',
  contact_phone: '+91 98765 43210',
  delivery_charge: 49,
  free_delivery_threshold: 499,
  serviceable_pincodes: ['822114', '834001', '800001', '110001'],
  cod_enabled: true,
  online_payment_enabled: true,
  min_order_value: 199,
  gst_percentage: 5,
  currency: 'INR',
  currency_symbol: '₹',
  try_at_home_duration_minutes: 30,
  try_at_home_auto_close_on_expiry: true,
  try_at_home_charge: 99,
  sms_provider: 'demo',
  sms_api_key: 'DEMO_KEY_TRYATHOME_SMS_2026',
  sms_sender_id: 'TRYHOM',
  twilio_account_sid: 'AC_DEMO_TWILIO_ACCOUNT_SID_SUBABASE',
  twilio_auth_token: 'AUTH_DEMO_TWILIO_SECRET_TOKEN',
  twilio_from_phone: '+18005550199',

  // Balanced Professional Yellow & Amber Gold Theme Palette
  theme_primary: '#d97706',
  theme_secondary: '#fef3c7',
  theme_accent: '#f59e0b',
  theme_background: '#fafaf9',
  theme_card_background: '#ffffff',
  theme_text: '#334155',
  theme_heading: '#0f172a',
  theme_button: '#d97706',
  theme_button_text: '#ffffff',
  theme_border: '#fcd34d',
  theme_header: '#ffffff',
  theme_footer: '#0f172a',
  header_bg_color: '#ffffff',
  header_text_color: '#0f172a',
  footer_bg_color: '#0f172a',
  footer_text_color: '#f8fafc',
  primary_color: '#d97706',
  secondary_color: '#fef3c7',
  accent_color: '#f59e0b',
  bg_color: '#fafaf9',
  text_color: '#334155',
  heading_color: '#0f172a',
  button_text_color: '#ffffff',
  border_color: '#fcd34d',
};

// Cross-tab and in-tab synchronization event
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('style1_store_sync')
  : null;

export const notifyDataChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('style1_data_changed'));
    broadcastChannel?.postMessage({ type: 'DATA_CHANGED', timestamp: Date.now() });
    
    // Non-blocking background push to Supabase to keep live database sync'd
    pushToSupabase();
  }
};

class DatabaseService {
  private memoryStore: Record<string, string> = {};
  public isInitialSyncDone: boolean = false;
  private initialSyncPromise: Promise<boolean> | null = null;

  public waitForInitialSync(): Promise<boolean> {
    if (this.isInitialSyncDone) return Promise.resolve(true);
    if (this.initialSyncPromise) return this.initialSyncPromise;
    this.initialSyncPromise = this.syncFromSupabase();
    return this.initialSyncPromise;
  }

  private getStorageItem = (key: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const item = localStorage.getItem(key);
        if (item !== null) {
          this.memoryStore[key] = item;
          return item;
        }
      } catch {}
    }
    return this.memoryStore[key] ?? null;
  };

  private setStorageItem = (key: string, value: string): void => {
    this.memoryStore[key] = value;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(key, value);
      } catch {}
    }
  };

  private removeStorageItem = (key: string): void => {
    delete this.memoryStore[key];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  };

  async syncFromSupabase(): Promise<boolean> {
    const cloud = await fetchFullDataFromSupabase();
    if (!cloud) {
      this.isInitialSyncDone = true;
      return false;
    }

    if (cloud.settings) {
      this.setStorageItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cloud.settings));
    }
    if (cloud.categories && cloud.categories.length > 0) {
      this.setStorageItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cloud.categories));
    } else {
      const existingCats = this.getCategories();
      existingCats.forEach((c) => supabaseSaveCategory(c).catch(() => {}));
    }

    if (cloud.products && cloud.products.length > 0) {
      this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(cloud.products));
    } else {
      const existingProds = this.getAllProducts();
      existingProds.forEach((p) => supabaseSaveProduct(p).catch(() => {}));
    }
    if (cloud.customers) {
      const rawLocalCusts = this.getStorageItem(STORAGE_KEYS.CUSTOMERS);
      let localCusts: Customer[] = rawLocalCusts ? JSON.parse(rawLocalCusts) : [];
      const mergedCustsMap = new Map<string, Customer>();

      for (const lc of localCusts) {
        const key = lc.customer_id || lc.id;
        if (key) mergedCustsMap.set(key, lc);
      }

      for (const cc of cloud.customers) {
        const key = cc.customer_id || cc.id;
        if (!key) continue;
        const existingLocal = mergedCustsMap.get(key);
        if (existingLocal) {
          mergedCustsMap.set(key, { ...existingLocal, ...cc });
        } else {
          mergedCustsMap.set(key, cc);
        }
      }

      const finalMergedCusts = Array.from(mergedCustsMap.values());
      this.setStorageItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(finalMergedCusts));

      const currentCust = this.getCurrentCustomer();
      if (currentCust) {
        const matched = finalMergedCusts.find((c) => c.customer_id === currentCust.customer_id || c.id === currentCust.id);
        if (matched) {
          this.setCurrentCustomer(matched);
        }
      }
    }
    if (cloud.orders) {
      const rawLocalOrders = this.getStorageItem(STORAGE_KEYS.ORDERS);
      let localOrders: Order[] = rawLocalOrders ? JSON.parse(rawLocalOrders) : [];
      if (!Array.isArray(localOrders) || localOrders.length === 0) {
        localOrders = this.generateDemoOrders();
      }

      const mergedOrdersMap = new Map<string, Order>();

      for (const lo of localOrders) {
        const key = lo.order_id || lo.id;
        if (key) mergedOrdersMap.set(key, lo);
      }

      for (const co of cloud.orders) {
        const key = co.order_id || co.id;
        if (!key) continue;
        const existingLocal = mergedOrdersMap.get(key);

        if (existingLocal) {
          const cloudTime = co.updated_at ? new Date(co.updated_at).getTime() : 0;
          const localTime = existingLocal.updated_at ? new Date(existingLocal.updated_at).getTime() : 0;
          const useCloud = cloudTime >= localTime;

          const base = useCloud ? { ...existingLocal, ...co } : { ...co, ...existingLocal };
          const isGen = base.final_bill_generated === true;
          const isLock = base.final_bill_locked === true || isGen;

          const mergedOrder: Order = {
            ...base,
            order_status: useCloud ? (co.order_status || existingLocal.order_status) : (existingLocal.order_status || co.order_status),
            final_bill_generated: isGen,
            final_bill_locked: isLock,
            final_bill_generated_at: base.final_bill_generated_at,
            try_at_home_status: isLock ? 'CLOSED' : (base.try_at_home_status || 'ACTIVE'),
          };
          mergedOrdersMap.set(key, mergedOrder);
        } else {
          mergedOrdersMap.set(key, co);
        }
      }

      // Ensure all baseline demo orders (Garhwa, Ranchi, Patna) are always included in mergedMap so no store order is ever missing!
      const demoOrders = this.generateDemoOrders();
      demoOrders.forEach((demoOrd) => {
        const k = demoOrd.order_id || demoOrd.id;
        if (!mergedOrdersMap.has(k)) {
          mergedOrdersMap.set(k, demoOrd);
        }
      });

      const finalMergedOrders = Array.from(mergedOrdersMap.values());
      this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(finalMergedOrders));

      // Push all orders to Supabase asynchronously to guarantee 100% sync across live domain and AI Studio
      finalMergedOrders.forEach((o) => {
        supabaseSaveOrder(o).catch(() => {});
      });
    }
    if (cloud.deliveryBoys) {
      const rawLocalBoys = this.getStorageItem(STORAGE_KEYS.DELIVERY_BOYS);
      let localBoys: DeliveryBoy[] = rawLocalBoys ? JSON.parse(rawLocalBoys) : [];
      const mergedBoysMap = new Map<string, DeliveryBoy>();

      for (const lb of localBoys) {
        const key = lb.id || lb.delivery_boy_id;
        if (key) mergedBoysMap.set(key, lb);
      }

      for (const cb of cloud.deliveryBoys) {
        const key = cb.id || cb.delivery_boy_id;
        if (!key) continue;
        const existingLocal = mergedBoysMap.get(key);
        if (existingLocal) {
          const mergedBoy: DeliveryBoy = {
            ...cb,
            ...existingLocal,
            admin_id: cb.admin_id || existingLocal.admin_id,
            pincode: cb.pincode || existingLocal.pincode,
            pincodes: (cb.pincodes && cb.pincodes.length > 0) ? cb.pincodes : existingLocal.pincodes,
            password: cb.password || existingLocal.password,
            email: cb.email || existingLocal.email,
            city: cb.city || existingLocal.city,
            status: cb.status || existingLocal.status,
            vehicle_type: cb.vehicle_type || existingLocal.vehicle_type,
            vehicle_number: cb.vehicle_number || existingLocal.vehicle_number,
            assigned_area: cb.assigned_area || existingLocal.assigned_area,
          };
          mergedBoysMap.set(key, mergedBoy);
        } else {
          mergedBoysMap.set(key, cb);
        }
      }

      const finalMergedBoys = Array.from(mergedBoysMap.values());
      this.setStorageItem(STORAGE_KEYS.DELIVERY_BOYS, JSON.stringify(finalMergedBoys));

      // Push all delivery boys to Supabase
      finalMergedBoys.forEach((boy) => {
        supabaseSaveDeliveryBoy(boy).catch(() => {});
      });

      // Keep active delivery partner session synchronized
      const currentBoy = this.getCurrentDeliveryBoy();
      if (currentBoy) {
        const cleanMobile = (currentBoy.mobile || '').replace(/\D/g, '');
        const matched = finalMergedBoys.find(
          (d) =>
            d.id === currentBoy.id ||
            d.delivery_boy_id === currentBoy.delivery_boy_id ||
            (cleanMobile && (d.mobile || '').replace(/\D/g, '') === cleanMobile)
        );
        if (matched) {
          this.setStorageItem(STORAGE_KEYS.CURRENT_DELIVERY_BOY, JSON.stringify(matched));
        }
      }
    }
    if (cloud.shopkeepers) {
      const rawLocalShops = this.getStorageItem(STORAGE_KEYS.SHOPKEEPERS);
      let localShops: Shopkeeper[] = rawLocalShops ? JSON.parse(rawLocalShops) : [];
      const mergedShopsMap = new Map<string, Shopkeeper>();

      for (const ls of localShops) {
        const key = ls.id || ls.shopkeeper_id;
        if (key) mergedShopsMap.set(key, ls);
      }

      for (const cs of cloud.shopkeepers) {
        const key = cs.id || cs.shopkeeper_id;
        if (!key) continue;
        const existingLocal = mergedShopsMap.get(key);
        if (existingLocal) {
          const mergedShop: Shopkeeper = {
            ...cs,
            ...existingLocal,
            admin_id: cs.admin_id || existingLocal.admin_id,
            pincode: cs.pincode || existingLocal.pincode,
            pincodes: (cs.pincodes && cs.pincodes.length > 0) ? cs.pincodes : existingLocal.pincodes,
            email: cs.email || existingLocal.email,
            city: cs.city || existingLocal.city,
            status: cs.status || existingLocal.status,
            store_name: cs.store_name || existingLocal.store_name,
            permissions: cs.permissions || existingLocal.permissions,
          };
          mergedShopsMap.set(key, mergedShop);
        } else {
          mergedShopsMap.set(key, cs);
        }
      }

      const finalMergedShops = Array.from(mergedShopsMap.values());
      this.setStorageItem(STORAGE_KEYS.SHOPKEEPERS, JSON.stringify(finalMergedShops));

      finalMergedShops.forEach((shop) => {
        supabaseSaveShopkeeper(shop).catch(() => {});
      });
    }
    if (cloud.returns) {
      this.setStorageItem(STORAGE_KEYS.RETURNS, JSON.stringify(cloud.returns));
    }
    if (cloud.stockTransactions) {
      this.setStorageItem(STORAGE_KEYS.STOCK_TRANSACTIONS, JSON.stringify(cloud.stockTransactions));
    }
    if (cloud.adminAccounts && cloud.adminAccounts.length > 0) {
      this.setStorageItem(STORAGE_KEYS.ADMIN_ACCOUNTS, JSON.stringify(cloud.adminAccounts));
    }
    if (cloud.reviews) {
      const localReviews = this.getAllReviews();
      const mergedReviewsMap = new Map<string, ProductReview>();

      for (const lr of localReviews) {
        const key = lr.id || `${lr.product_id}_${lr.customer_id}`;
        if (key) mergedReviewsMap.set(key, lr);
      }

      for (const cr of cloud.reviews) {
        const key = cr.id || `${cr.product_id}_${cr.customer_id}`;
        if (!key) continue;
        if (!mergedReviewsMap.has(key)) {
          mergedReviewsMap.set(key, cr);
        }
      }

      const finalMergedReviews = Array.from(mergedReviewsMap.values());
      this.setStorageItem(STORAGE_KEYS.REVIEWS, JSON.stringify(finalMergedReviews));

      localReviews.forEach((rev) => {
        supabaseSaveReview(rev).catch(() => {});
      });
    }
    if (cloud.cartItems && cloud.cartItems.length > 0) {
      const currentCust = this.getCurrentCustomer();
      const currentId = currentCust?.customer_id || currentCust?.id || 'guest';
      const userCartItems = cloud.cartItems.filter((c) => c.customer_id === currentId || c.customer_id === currentCust?.customer_id || c.customer_id === currentCust?.id);
      if (userCartItems.length > 0) {
        const products = this.getAllProducts();
        const formattedCart = userCartItems.map((c) => {
          const prod = products.find((p) => p.id === c.product_id);
          const primaryImg = prod?.images?.find((i) => i.is_primary)?.image_url || prod?.images?.[0]?.image_url || '';
          return {
            id: c.id,
            cart_id: this.getCartKey(currentId),
            product_id: c.product_id,
            name: prod?.name || 'Product',
            brand: prod?.brand || '',
            sku: prod?.sku || '',
            size: c.size,
            color: c.color,
            quantity: c.quantity,
            price: prod?.selling_price || 0,
            mrp: prod?.mrp || 0,
            image_url: primaryImg,
            product: prod,
          };
        });
        this.setStorageItem(this.getCartKey(currentId), JSON.stringify(formattedCart));
      }
    }
    if (cloud.wishlistItems && cloud.wishlistItems.length > 0) {
      const currentCust = this.getCurrentCustomer();
      const currentId = currentCust?.customer_id || currentCust?.id || 'guest';
      const userWishItems = cloud.wishlistItems.filter((w) => w.customer_id === currentId || w.customer_id === currentCust?.customer_id || w.customer_id === currentCust?.id);
      if (userWishItems.length > 0) {
        const products = this.getAllProducts();
        const formattedWish = userWishItems.map((w) => {
          const prod = products.find((p) => p.id === w.product_id);
          return {
            id: w.id,
            customer_id: currentId,
            product_id: w.product_id,
            product: prod,
            added_at: w.added_at || new Date().toISOString(),
          };
        });
        this.setStorageItem(this.getWishlistKey(currentId), JSON.stringify(formattedWish));
      }
    }

    this.isInitialSyncDone = true;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('style1_data_changed'));
    }
    return true;
  }

  constructor() {
    this.initDatabase();
    if (broadcastChannel) {
      broadcastChannel.onmessage = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('style1_data_changed'));
        }
      };
    }

    // Initial fetch from live Supabase DB on application startup
    this.initialSyncPromise = this.syncFromSupabase();

    // Subscribe to realtime database updates across all devices
    supabaseSubscribeRealtime(() => {
      this.syncFromSupabase();
    });

    // Cross-tab and recovery sync listeners
    if (typeof window !== 'undefined') {
      // Continuous 3-second live cloud polling for real-time responsiveness across devices
      setInterval(() => {
        this.syncFromSupabase();
      }, 3000);

      window.addEventListener('style1_trigger_cloud_sync', () => {
        this.syncFromSupabase();
      });
      window.addEventListener('online', () => {
        console.log('[Connection Restored] Device came online, refreshing cloud dataset...');
        this.syncFromSupabase();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.syncFromSupabase();
        }
      });
      window.addEventListener('focus', () => {
        this.syncFromSupabase();
      });
    }
  }

  private initDatabase() {
    if (typeof window === 'undefined') return;

    // Categories
    const existingCats = this.getStorageItem(STORAGE_KEYS.CATEGORIES);
    if (!existingCats || existingCats === '[]') {
      this.setStorageItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    }

    // Products - Seed initial catalog if empty so catalog is never blank
    const existingProds = this.getStorageItem(STORAGE_KEYS.PRODUCTS);
    if (!existingProds || existingProds === '[]') {
      const initialProds = generateDemoProducts();
      this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProds));
    }

    // Settings
    const existingSettings = this.getStorageItem(STORAGE_KEYS.SETTINGS);
    if (!existingSettings) {
      this.setStorageItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    } else {
      try {
        const parsed = JSON.parse(existingSettings);
        if (parsed.store_name === 'STYLE 1' || !parsed.store_name) {
          parsed.store_name = 'TRYatHOME';
          parsed.contact_email = 'care@tryathome.in';
          this.setStorageItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
        }
      } catch {}
    }

    // Customers initial seed
    const existingCustomers = this.getStorageItem(STORAGE_KEYS.CUSTOMERS);
    if (!existingCustomers) {
      const defaultCustomers: Customer[] = [
        {
          id: 'cust-1',
          customer_id: 'STYLE1-CUST-000001',
          admin_id: 'adm-3', // Garhwa Store
          name: 'Amit Kumar',
          mobile: '9934123456',
          email: 'amit.garhwa@gmail.com',
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          status: 'ACTIVE',
          total_orders: 2,
          total_spent: 3198,
          last_order_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          addresses: [
            {
              id: 'addr-1',
              customer_id: 'STYLE1-CUST-000001',
              name: 'Amit Kumar',
              mobile: '9934123456',
              pincode: '822114',
              address: 'House No. 42, Main Road, Near Bus Stand',
              locality: 'Garhwa Market',
              city: 'Garhwa',
              state: 'Jharkhand',
              address_type: 'HOME',
              is_default: true,
            },
          ],
        },
        {
          id: 'cust-2',
          customer_id: 'STYLE1-CUST-000002',
          admin_id: 'adm-2', // Ranchi Store
          name: 'Sneha Sharma',
          mobile: '9835123456',
          email: 'sneha.ranchi@gmail.com',
          created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
          status: 'ACTIVE',
          total_orders: 1,
          total_spent: 1899,
          last_order_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          addresses: [
            {
              id: 'addr-2',
              customer_id: 'STYLE1-CUST-000002',
              name: 'Sneha Sharma',
              mobile: '9835123456',
              pincode: '834001',
              address: 'A-12 Nilgiri Apartments, Lalpur',
              locality: 'Main Road',
              city: 'Ranchi',
              state: 'Jharkhand',
              address_type: 'HOME',
              is_default: true,
            },
          ],
        },
        {
          id: 'cust-3',
          customer_id: 'STYLE1-CUST-000003',
          admin_id: 'adm-4', // Patna Store
          name: 'Rahul Kumar',
          mobile: '9708123456',
          email: 'rahul.patna@gmail.com',
          created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
          status: 'ACTIVE',
          total_orders: 1,
          total_spent: 2499,
          last_order_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          addresses: [
            {
              id: 'addr-3',
              customer_id: 'STYLE1-CUST-000003',
              name: 'Rahul Kumar',
              mobile: '9708123456',
              pincode: '800001',
              address: 'Flat 301, Fraser Road Plaza',
              locality: 'Near Patna Junction',
              city: 'Patna',
              state: 'Bihar',
              address_type: 'HOME',
              is_default: true,
            },
          ],
        },
        {
          id: 'cust-4',
          customer_id: 'STYLE1-CUST-000004',
          admin_id: 'adm-3', // Garhwa Store Branch 2
          name: 'Priya Verma',
          mobile: '9934887766',
          email: 'priya.verma@gmail.com',
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          status: 'ACTIVE',
          total_orders: 1,
          total_spent: 1599,
          last_order_at: new Date(Date.now() - 1 * 86400000).toISOString(),
          addresses: [
            {
              id: 'addr-4',
              customer_id: 'STYLE1-CUST-000004',
              name: 'Priya Verma',
              mobile: '9934887766',
              pincode: '822115',
              address: 'Near Town Hall, Ward No. 8',
              locality: 'Garhwa East',
              city: 'Garhwa',
              state: 'Jharkhand',
              address_type: 'HOME',
              is_default: true,
            },
          ],
        },
      ];
      this.setStorageItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(defaultCustomers));
    }

    // Orders initial seed
    const existingOrders = this.getStorageItem(STORAGE_KEYS.ORDERS);
    if (!existingOrders) {
      const demoOrders: Order[] = [
        {
          id: 'ord-1',
          order_id: 'STYLE1-ORD-000001',
          customer_id: 'STYLE1-CUST-000001',
          customer_name: 'Aarav Sharma',
          mobile: '9876543210',
          email: 'aarav.sharma@example.com',
          address: {
            id: 'addr-1',
            customer_id: 'STYLE1-CUST-000001',
            name: 'Aarav Sharma',
            mobile: '9876543210',
            pincode: '560001',
            address: 'Flat 402, Sunshine Heights, MG Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            address_type: 'HOME',
            is_default: true,
          },
          items: [
            {
              id: 'oi-1',
              order_id: 'STYLE1-ORD-000001',
              product_id: 'prod-1',
              product_name: "Men's Urban Slim Fit Washed Blue Denim",
              brand: 'TRYatHOME Originals',
              sku: 'ST1-JNS-0001',
              quantity: 1,
              price: 999,
              mrp: 2499,
              size: '32',
              color: 'Washed Blue',
              image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
            },
            {
              id: 'oi-2',
              order_id: 'STYLE1-ORD-000001',
              product_id: 'prod-21',
              product_name: "Men's Pure Cotton Heavyweight Oversized Graphic Tee",
              brand: 'TRYatHOME Originals',
              sku: 'ST1-TSH-0021',
              quantity: 2,
              price: 499,
              mrp: 1199,
              size: 'L',
              color: 'Charcoal',
              image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
            },
          ],
          subtotal: 1997,
          discount: 2899,
          delivery_charge: 0,
          tax_amount: 100,
          total: 1997,
          payment_method: 'COD',
          payment_status: 'PENDING',
          order_status: 'Delivered',
          created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          tracking_number: 'ECOM-BLR-98214',
          courier_partner: 'BlueDart Express',
          status_history: [
            {
              id: 'sh-1',
              order_id: 'STYLE1-ORD-000001',
              status: 'Pending',
              changed_by: 'Customer (Order Placed)',
              changed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
            },
            {
              id: 'sh-2',
              order_id: 'STYLE1-ORD-000001',
              status: 'Packed',
              changed_by: 'Admin Warehouse',
              changed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
            },
            {
              id: 'sh-3',
              order_id: 'STYLE1-ORD-000001',
              status: 'Shipped',
              changed_by: 'Logistics BlueDart',
              changed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
            },
            {
              id: 'sh-4',
              order_id: 'STYLE1-ORD-000001',
              status: 'Delivered',
              changed_by: 'Delivery Associate',
              changed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
              notes: 'Delivered to recipient with OTP verification.',
            },
          ],
        },
        {
          id: 'ord-2',
          order_id: 'STYLE1-ORD-000002',
          customer_id: 'STYLE1-CUST-000002',
          customer_name: 'Priya Patel',
          mobile: '9898989898',
          email: 'priya.patel@example.com',
          address: {
            id: 'addr-3',
            customer_id: 'STYLE1-CUST-000002',
            name: 'Priya Patel',
            mobile: '9898989898',
            pincode: '380009',
            address: 'A-12 Nilgiri Apartments, Navrangpura',
            city: 'Ahmedabad',
            state: 'Gujarat',
            address_type: 'HOME',
            is_default: true,
          },
          items: [
            {
              id: 'oi-3',
              order_id: 'STYLE1-ORD-000002',
              product_id: 'prod-81',
              product_name: 'Lucknowi Handcrafted Chikankari Pure Georgette Kurti',
              brand: 'TRYatHOME Heritage Loom',
              sku: 'ST1-KRT-0081',
              quantity: 1,
              price: 1199,
              mrp: 2799,
              size: 'M',
              color: 'Teal Blue',
              image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80',
            },
          ],
          subtotal: 1199,
          discount: 1600,
          delivery_charge: 0,
          tax_amount: 60,
          total: 1199,
          payment_method: 'ONLINE_RAZORPAY',
          payment_status: 'PAID',
          order_status: 'Shipped',
          created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
          tracking_number: 'DELHIVERY-AHM-44120',
          courier_partner: 'Delhivery Surface',
          status_history: [
            {
              id: 'sh-5',
              order_id: 'STYLE1-ORD-000002',
              status: 'Confirmed',
              changed_by: 'Payment Gateway (Prepaid)',
              changed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
            },
            {
              id: 'sh-6',
              order_id: 'STYLE1-ORD-000002',
              status: 'Shipped',
              changed_by: 'Warehouse Admin',
              changed_at: new Date().toISOString(),
            },
          ],
        },
      ];
      this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(demoOrders));
    }

    // Ensure all existing orders have item_status and order_date
    try {
      const storedOrders = this.getStorageItem(STORAGE_KEYS.ORDERS);
      if (storedOrders) {
        const parsed: Order[] = JSON.parse(storedOrders);
        let modified = false;
        parsed.forEach((ord) => {
          if (!ord.order_date) {
            ord.order_date = ord.created_at;
            modified = true;
          }
          if (ord.items) {
            ord.items.forEach((it) => {
              if (!it.item_status) {
                it.item_status = ord.order_status;
                modified = true;
              }
            });
          }
        });
        if (modified) {
          this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(parsed));
        }
      }
    } catch {
      // Safe fallback
    }

    // Initialize delivery boys
    const existingDeliveryBoys = this.getStorageItem(STORAGE_KEYS.DELIVERY_BOYS);
    if (!existingDeliveryBoys) {
      const defaultDeliveryBoys: DeliveryBoy[] = [
        {
          id: 'dboy-1',
          delivery_boy_id: 'STYLE1-DBOY-000001',
          admin_id: 'adm-3', // Garhwa Admin
          pincode: '822114',
          pincodes: ['822114', '822115'],
          name: 'Suresh Yadav (Garhwa Rider)',
          mobile: '9934998877',
          email: 'suresh.garhwa@style1.in',
          vehicle_type: 'Motorcycle',
          vehicle_number: 'JH-14-A-1234',
          status: 'ACTIVE',
          assigned_area: 'Garhwa Market & Town Area (822114)',
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          total_delivered: 42,
          rating: 4.9,
        },
        {
          id: 'dboy-2',
          delivery_boy_id: 'STYLE1-DBOY-000002',
          admin_id: 'adm-2', // Ranchi Admin
          pincode: '834001',
          pincodes: ['834001', '834002'],
          name: 'Rajesh Verma (Ranchi Express)',
          mobile: '9835998877',
          email: 'rajesh.ranchi@style1.in',
          vehicle_type: 'Scooter',
          vehicle_number: 'JH-01-B-5678',
          status: 'ACTIVE',
          assigned_area: 'Ranchi Lalpur & Main Road (834001)',
          created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
          total_delivered: 29,
          rating: 4.8,
        },
        {
          id: 'dboy-3',
          delivery_boy_id: 'STYLE1-DBOY-000003',
          admin_id: 'adm-4', // Patna Admin
          pincode: '800001',
          pincodes: ['800001'],
          name: 'Vikas Kumar (Patna Super Rider)',
          mobile: '9708998877',
          email: 'vikas.patna@style1.in',
          vehicle_type: 'Scooter',
          vehicle_number: 'BR-01-C-9012',
          status: 'ACTIVE',
          assigned_area: 'Patna Junction & Fraser Road (800001)',
          created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
          total_delivered: 18,
          rating: 4.7,
        },
      ];
      this.setStorageItem(STORAGE_KEYS.DELIVERY_BOYS, JSON.stringify(defaultDeliveryBoys));
    }

    // Initialize admin accounts
    this.getAdmins();

    // Initialize shopkeepers
    const existingShopkeepers = this.getStorageItem(STORAGE_KEYS.SHOPKEEPERS);
    if (!existingShopkeepers) {
      const defaultShopkeeperPermissions: ShopkeeperPermissions = {
        can_view_dashboard: true,
        can_add_product: true,
        can_edit_product: true,
        can_upload_images: true,
        can_view_catalog: true,
        can_stock_in: true,
        can_stock_out: true,
        can_view_inventory: true,
        can_view_orders: true,
        can_view_stock_history: true,
        can_edit_price: true,
        can_edit_category: false,
        can_edit_images: true,
      };

      const defaultShopkeepers: Shopkeeper[] = [
        {
          id: 'sk-1',
          shopkeeper_id: 'STYLE1-SHOP-000001',
          admin_id: 'adm-3', // Garhwa Store Admin
          pincode: '822114',
          pincodes: ['822114', '822115'],
          name: 'Ramesh Singh',
          store_name: 'Garhwa Fashion World',
          mobile: '9934112233',
          email: 'garhwafashion@tryathome.in',
          city: 'Garhwa',
          status: 'ACTIVE',
          created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
          permissions: defaultShopkeeperPermissions,
          total_products: 5,
          live_products: 5,
          pending_products: 0,
          current_stock: 120,
          total_orders: 12,
        },
        {
          id: 'sk-2',
          shopkeeper_id: 'STYLE1-SHOP-000002',
          admin_id: 'adm-2', // Ranchi Store Admin
          pincode: '834001',
          pincodes: ['834001', '834002'],
          name: 'Pooja Agarwal',
          store_name: 'Ranchi Garments Emporium',
          mobile: '9835112233',
          email: 'ranchigarments@tryathome.in',
          city: 'Ranchi',
          status: 'ACTIVE',
          created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
          permissions: defaultShopkeeperPermissions,
          total_products: 4,
          live_products: 4,
          pending_products: 0,
          current_stock: 95,
          total_orders: 8,
        },
        {
          id: 'sk-3',
          shopkeeper_id: 'STYLE1-SHOP-000003',
          admin_id: 'adm-4', // Patna Store Admin
          pincode: '800001',
          pincodes: ['800001'],
          name: 'Prakash Verma',
          store_name: 'Patna Textiles & Apparel',
          mobile: '9708112233',
          email: 'patnatextiles@tryathome.in',
          city: 'Patna',
          status: 'ACTIVE',
          created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
          permissions: defaultShopkeeperPermissions,
          total_products: 3,
          live_products: 3,
          pending_products: 0,
          current_stock: 80,
          total_orders: 6,
        },
      ];
      this.setStorageItem(STORAGE_KEYS.SHOPKEEPERS, JSON.stringify(defaultShopkeepers));
    } else {
      // Ensure 9810101010 exists in already loaded shopkeepers
      try {
        const list: Shopkeeper[] = JSON.parse(existingShopkeepers);
        if (!list.some((s) => (s.mobile || '').replace(/\D/g, '').slice(-10) === '9810101010')) {
          const defaultPerms: ShopkeeperPermissions = {
            can_view_dashboard: true,
            can_add_product: true,
            can_edit_product: true,
            can_upload_images: true,
            can_view_catalog: true,
            can_stock_in: true,
            can_stock_out: true,
            can_view_inventory: true,
            can_view_orders: true,
            can_view_stock_history: true,
            can_edit_price: true,
            can_edit_category: false,
            can_edit_images: true,
          };
          list.unshift({
            id: 'shop-1',
            shopkeeper_id: 'STYLE1-SHOP-000001',
            name: 'Rajesh Mehra',
            store_name: 'Rajesh Ethnic Trends',
            mobile: '9810101010',
            email: 'rajesh.mehra@tryathome.in',
            city: 'Jaipur',
            status: 'ACTIVE',
            created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
            permissions: defaultPerms,
            total_products: 3,
            live_products: 2,
            pending_products: 1,
            current_stock: 85,
            total_orders: 8,
          });
          this.setStorageItem(STORAGE_KEYS.SHOPKEEPERS, JSON.stringify(list));
        }
      } catch {}
    }

    // Attach shopkeeper metadata to a few products if not yet present
    try {
      const prodsRaw = this.getStorageItem(STORAGE_KEYS.PRODUCTS);
      if (prodsRaw) {
        const prods: Product[] = JSON.parse(prodsRaw);
        let modified = false;
        if (prods.length > 0 && !prods.some((p) => p.shopkeeper_id === 'shop-1')) {
          if (prods[0]) {
            prods[0].shopkeeper_id = 'shop-1';
            prods[0].shopkeeper_name = 'Rajesh Sharma';
            prods[0].approval_status = 'APPROVED';
            prods[0].is_live = true;
            modified = true;
          }
          if (prods[1]) {
            prods[1].shopkeeper_id = 'shop-1';
            prods[1].shopkeeper_name = 'Rajesh Sharma';
            prods[1].approval_status = 'APPROVED';
            prods[1].is_live = true;
            modified = true;
          }
          if (prods[2]) {
            prods[2].shopkeeper_id = 'shop-1';
            prods[2].shopkeeper_name = 'Rajesh Sharma';
            prods[2].approval_status = 'PENDING';
            prods[2].is_live = false;
            prods[2].status = 'Draft';
            modified = true;
          }
          if (prods[3]) {
            prods[3].shopkeeper_id = 'shop-2';
            prods[3].shopkeeper_name = 'Pooja Agarwal';
            prods[3].approval_status = 'APPROVED';
            prods[3].is_live = true;
            modified = true;
          }
        }
        if (modified) {
          this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prods));
        }
      }
    } catch {}

    // Initialize stock transactions seed if none exists
    const existingTx = this.getStorageItem(STORAGE_KEYS.STOCK_TRANSACTIONS);
    if (!existingTx) {
      const seedTx: StockTransaction[] = [
        {
          id: 'stx-1',
          transaction_id: 'STX-000001',
          product_id: 'prod-1',
          product_name: "Men's Urban Slim Fit Washed Blue Denim",
          sku: 'ST1-JNS-0001',
          category_name: 'Jeans',
          shopkeeper_id: 'shop-1',
          shopkeeper_name: 'Rajesh Sharma',
          transaction_type: 'IN',
          quantity: 50,
          previous_stock: 0,
          new_stock: 50,
          reference_note: 'Initial batch inward from workshop',
          performed_by: 'SHOPKEEPER',
          performed_by_name: 'Rajesh Sharma',
          performed_by_id: 'shop-1',
          timestamp: new Date(Date.now() - 15 * 86400000).toISOString(),
        },
        {
          id: 'stx-2',
          transaction_id: 'STX-000002',
          product_id: 'prod-1',
          product_name: "Men's Urban Slim Fit Washed Blue Denim",
          sku: 'ST1-JNS-0001',
          category_name: 'Jeans',
          shopkeeper_id: 'shop-1',
          shopkeeper_name: 'Rajesh Sharma',
          transaction_type: 'ORDER_STOCK_OUT',
          quantity: 1,
          previous_stock: 50,
          new_stock: 49,
          reason: 'Customer Order Placed',
          reference_note: 'Deducted for Order STYLE1-ORD-000001',
          performed_by: 'CUSTOMER',
          performed_by_name: 'Aarav Sharma',
          performed_by_id: 'STYLE1-CUST-000001',
          timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
          order_id: 'STYLE1-ORD-000001',
        },
        {
          id: 'stx-3',
          transaction_id: 'STX-000003',
          product_id: 'prod-2',
          product_name: "Men's Solid Dark Indigo Relaxed Fit Stretch Denim",
          sku: 'ST1-JNS-0002',
          category_name: 'Jeans',
          shopkeeper_id: 'shop-1',
          shopkeeper_name: 'Rajesh Sharma',
          transaction_type: 'IN',
          quantity: 35,
          previous_stock: 0,
          new_stock: 35,
          reference_note: 'Opening inventory inward',
          performed_by: 'ADMIN',
          performed_by_name: 'TRYatHOME Admin',
          performed_by_id: 'adm-1',
          timestamp: new Date(Date.now() - 12 * 86400000).toISOString(),
        },
      ];
      this.setStorageItem(STORAGE_KEYS.STOCK_TRANSACTIONS, JSON.stringify(seedTx));
    }
  }

  // ===================== STORE SETTINGS =====================
  getSettings(): StoreSettings {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.SETTINGS);
      const parsed = data ? JSON.parse(data) : DEFAULT_SETTINGS;
      if (!Array.isArray(parsed.serviceable_pincodes) || parsed.serviceable_pincodes.length === 0) {
        parsed.serviceable_pincodes = ['822114', '834001', '800001', '110001'];
      }
      return parsed;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  getServiceablePincodes(): string[] {
    const settings = this.getSettings();
    let pins = settings.serviceable_pincodes;
    if (!Array.isArray(pins) || pins.length === 0) {
      pins = ['822114'];
    }
    const cleanList = pins.map((p) => String(p).trim()).filter(Boolean);
    // Mandatory fallback pincode 822114 must always be included
    if (!cleanList.includes('822114')) {
      cleanList.unshift('822114');
    }
    return cleanList;
  }

  isPincodeServiceable(pincode: string | undefined | null): boolean {
    if (!pincode) return false;
    const cleanPin = String(pincode).trim();
    if (!cleanPin) return false;
    const allowed = this.getServiceablePincodes();
    return allowed.includes(cleanPin);
  }

  addServiceablePincode(pincode: string): boolean {
    const clean = String(pincode).trim();
    if (!clean || clean.length < 3) return false;
    const currentList = this.getServiceablePincodes();
    if (currentList.includes(clean)) return true;
    const updatedList = [...currentList, clean];
    this.updateSettings({ serviceable_pincodes: updatedList });
    return true;
  }

  removeServiceablePincode(pincode: string): boolean {
    const clean = String(pincode).trim();
    if (clean === '822114') {
      // 822114 is the mandatory default fallback pincode and cannot be removed
      return false;
    }
    const currentList = this.getServiceablePincodes();
    const updatedList = currentList.filter((p) => p !== clean);
    this.updateSettings({ serviceable_pincodes: updatedList });
    return true;
  }

  updateSettings(newSettings: Partial<StoreSettings>): StoreSettings {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    this.setStorageItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    notifyDataChanged();
    supabaseSaveSettings(updated).catch((err) => {
      console.warn('[db] Background supabaseSaveSettings warning:', err);
    });
    return updated;
  }

  async updateThemeAndDesignSettingsAsync(
    newSettings: Partial<StoreSettings>
  ): Promise<{ success: boolean; message: string }> {
    // 1. Authorization check
    const currentAdmin = this.getCurrentAdmin();
    if (!currentAdmin || !['super_admin', 'admin'].includes(currentAdmin.role)) {
      throw new Error('Unauthorized: Only administrators can update website theme & design settings');
    }

    // 2. Prepare updated settings
    const current = this.getSettings();
    const updated: StoreSettings = {
      ...current,
      ...newSettings,
    };

    // 3. Persist directly to Supabase database (Source of truth)
    const saved = await supabaseSaveSettings(updated);
    if (!saved) {
      throw new Error('Failed to save website theme & design settings to Supabase database.');
    }

    // 4. Update memory & broadcast live event to customer panel
    this.setStorageItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    notifyDataChanged();

    return {
      success: true,
      message: 'Website settings updated successfully.',
    };
  }

  async updateHeroCarouselSettingsAsync(
    hero1: string,
    hero2: string,
    hero3: string,
    heroBg?: string
  ): Promise<{ success: boolean; message: string }> {
    // 1. Authorization check
    const currentAdmin = this.getCurrentAdmin();
    if (!currentAdmin || !['super_admin', 'admin'].includes(currentAdmin.role)) {
      throw new Error('Unauthorized: Only administrators can update hero carousel settings');
    }

    // 2. Prepare updated settings
    const current = this.getSettings();
    const updated: StoreSettings = {
      ...current,
      hero_image_1: (hero1 || '').trim(),
      hero_image_2: (hero2 || '').trim(),
      hero_image_3: (hero3 || '').trim(),
      hero_background_image: (heroBg || '').trim(),
    };

    // 3. Persist directly to Supabase database (Source of truth)
    const saved = await supabaseSaveSettings(updated);
    if (!saved) {
      throw new Error('Failed to save hero carousel settings to Supabase database.');
    }

    // 4. Update memory & broadcast live event to customer panel
    this.setStorageItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    notifyDataChanged();

    return {
      success: true,
      message: 'Hero carousel settings updated successfully.',
    };
  }

  getHeroBackgroundImage(): string {
    const settings = this.getSettings();
    return (settings.hero_background_image || '').trim();
  }

  getHeroCarouselImages(): [string, string, string] {
    const settings = this.getSettings();
    // Default fallback images preserve the existing black/dark aesthetic and bento imagery
    const DEFAULT_HERO_1 = 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&q=80';
    const DEFAULT_HERO_2 = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&q=80';
    const DEFAULT_HERO_3 = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&q=80';

    const img1 = settings.hero_image_1 && settings.hero_image_1.trim().length > 0
      ? settings.hero_image_1.trim()
      : DEFAULT_HERO_1;

    const img2 = settings.hero_image_2 && settings.hero_image_2.trim().length > 0
      ? settings.hero_image_2.trim()
      : DEFAULT_HERO_2;

    const img3 = settings.hero_image_3 && settings.hero_image_3.trim().length > 0
      ? settings.hero_image_3.trim()
      : DEFAULT_HERO_3;

    return [img1, img2, img3];
  }

  // ===================== CATEGORIES =====================
  getCategories(): Category[] {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.CATEGORIES);
      const list: Category[] = data ? JSON.parse(data) : INITIAL_CATEGORIES;
      const products = this.getAllProducts();
      // Count items dynamically
      return list.map((cat) => ({
        ...cat,
        item_count: products.filter(
          (p) => p.category_id === cat.id && p.status === 'Published'
        ).length,
      })).sort((a, b) => a.sort_order - b.sort_order);
    } catch {
      return INITIAL_CATEGORIES;
    }
  }

  addCategory(categoryData: Omit<Category, 'id'>): Category {
    const categories = this.getCategories();
    const newCat: Category = {
      ...categoryData,
      id: `cat-${categoryData.slug || Math.random().toString(36).substring(2, 9)}`,
    };
    categories.push(newCat);
    this.setStorageItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    notifyDataChanged();
    return newCat;
  }

  async addCategoryAsync(categoryData: Omit<Category, 'id'>): Promise<Category> {
    const categories = this.getCategories();
    const id = `cat-${categoryData.slug || Math.random().toString(36).substring(2, 9)}`;
    const newCat: Category = {
      ...categoryData,
      id,
    };
    const success = await supabaseSaveCategory(newCat);
    if (!success) {
      throw new Error("Failed to save category to database.");
    }
    categories.push(newCat);
    this.setStorageItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    notifyDataChanged();
    return newCat;
  }

  updateCategory(id: string, updates: Partial<Category>): Category | null {
    const categories = this.getCategories();
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    categories[idx] = { ...categories[idx], ...updates };
    this.setStorageItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    notifyDataChanged();
    return categories[idx];
  }

  async updateCategoryAsync(id: string, updates: Partial<Category>): Promise<Category | null> {
    const categories = this.getCategories();
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    const original = categories[idx];
    const updated = { ...original, ...updates };

    const success = await supabaseSaveCategory(updated);
    if (!success) {
      throw new Error("Failed to save category changes to database.");
    }

    categories[idx] = updated;
    this.setStorageItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    notifyDataChanged();
    return updated;
  }

  deleteCategory(id: string): boolean {
    let categories = this.getCategories();
    categories = categories.filter((c) => c.id !== id);
    this.setStorageItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    notifyDataChanged();
    return true;
  }

  async deleteCategoryAsync(id: string): Promise<boolean> {
    const success = await supabaseDeleteCategory(id);
    if (!success) {
      throw new Error("Failed to delete category from database.");
    }
    let categories = this.getCategories();
    categories = categories.filter((c) => c.id !== id);
    this.setStorageItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    notifyDataChanged();
    return true;
  }

  // ===================== PRODUCTS =====================
  getAllProducts(): Product[] {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.PRODUCTS);
      let list: Product[] = data ? JSON.parse(data) : [];
      if (!Array.isArray(list) || list.length === 0) {
        list = generateDemoProducts();
        this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
      }
      const ctx = this.getActiveAdminContext();
      if (!ctx.isSuperMaster && ctx.adminId) {
        const rawShopkeepers: Shopkeeper[] = JSON.parse(this.getStorageItem(STORAGE_KEYS.SHOPKEEPERS) || '[]');
        const storeShopkeepers = new Set(
          rawShopkeepers.filter((s) => s.admin_id === ctx.adminId || !s.admin_id).map((s) => s.id)
        );
        list = list.filter((p) => {
          if (p.admin_id === ctx.adminId) return true;
          if (p.shopkeeper_id && storeShopkeepers.has(p.shopkeeper_id)) return true;
          if (!p.admin_id && !p.shopkeeper_id) return true;
          return false;
        });
      }
      return list;
    } catch {
      return generateDemoProducts();
    }
  }

  getPublishedProducts(options?: {
    categorySlug?: string;
    gender?: string;
    searchQuery?: string;
    brand?: string;
    size?: string;
    minPrice?: number;
    maxPrice?: number;
    minDiscount?: number;
    sort?: string;
  }): Product[] {
    const all = this.getAllProducts();
    let filtered = all.filter((p) => {
      if (p.shopkeeper_id) {
        const sk = this.getShopkeeperById(p.shopkeeper_id);
        if (sk && sk.status !== 'ACTIVE') {
          return false;
        }
        return (
          p.approval_status === 'APPROVED' &&
          p.is_live === true &&
          p.status === 'Published' &&
          (p.stock || 0) > 0
        );
      }
      if (p.approval_status && p.approval_status !== 'APPROVED') {
        return false;
      }
      return p.status === 'Published' && p.is_live !== false && (p.stock || 0) > 0;
    });

    if (options?.categorySlug) {
      const categories = this.getCategories();
      const cat = categories.find((c) => c.slug === options.categorySlug);
      if (cat) {
        filtered = filtered.filter(
          (p) => p.category_id === cat.id || p.category_name.toLowerCase() === cat.name.toLowerCase()
        );
      }
    }

    if (options?.gender && options.gender !== 'All') {
      filtered = filtered.filter((p) => p.gender === options.gender || p.gender === 'Unisex');
    }

    if (options?.brand) {
      filtered = filtered.filter((p) => p.brand.toLowerCase() === options.brand!.toLowerCase());
    }

    if (options?.size) {
      filtered = filtered.filter((p) => p.sizes.includes(options.size!));
    }

    if (options?.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.selling_price >= options.minPrice!);
    }

    if (options?.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.selling_price <= options.maxPrice!);
    }

    if (options?.minDiscount !== undefined) {
      filtered = filtered.filter((p) => p.discount_percentage >= options.minDiscount!);
    }

    if (options?.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category_name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q))) ||
          p.description.toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    if (options?.sort) {
      switch (options.sort) {
        case 'price_asc':
          filtered.sort((a, b) => a.selling_price - b.selling_price);
          break;
        case 'price_desc':
          filtered.sort((a, b) => b.selling_price - a.selling_price);
          break;
        case 'discount':
          filtered.sort((a, b) => b.discount_percentage - a.discount_percentage);
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        default:
          // Relevance: rating * rating_count
          filtered.sort((a, b) => b.rating * b.rating_count - a.rating * a.rating_count);
          break;
      }
    }

    // Security & Privacy: Never expose internal shopkeeper_price to customer catalog
    return filtered.map((p) => {
      const sanitized = { ...p };
      delete sanitized.shopkeeper_price;
      return sanitized;
    });
  }

  getProductById(id: string): Product | null {
    const all = this.getAllProducts();
    return all.find((p) => p.id === id) || null;
  }

  getProductBySlug(slug: string): Product | null {
    const all = this.getAllProducts();
    return all.find((p) => p.slug === slug) || null;
  }

  addProduct(productData: Partial<Product>): Product {
    const all = this.getAllProducts();
    const id = `prod-${Date.now()}`;
    const mrp = Number(productData.mrp) || 1999;
    const adminPrice = productData.admin_selling_price !== undefined
      ? Number(productData.admin_selling_price)
      : (productData.selling_price !== undefined ? Number(productData.selling_price) : 999);
    const price = adminPrice;
    const discount = Math.max(0, Math.round(((mrp - price) / mrp) * 100));

    const newProd: Product = {
      id,
      sku: productData.sku || `ST1-GEN-${String(all.length + 1).padStart(4, '0')}`,
      name: productData.name || 'New Stylish Garment',
      slug: (productData.name || 'new-garment')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + `-${id.substring(id.length - 4)}`,
      category_id: productData.category_id || 'cat-jeans',
      category_name: productData.category_name || 'Jeans',
      subcategory_id: productData.subcategory_id,
      subcategory_name: productData.subcategory_name,
      gender: productData.gender || 'Men',
      description: productData.description || 'Premium quality apparel tailored for everyday comfort and long lasting style.',
      brand: productData.brand || 'TRYatHOME Originals',
      mrp,
      selling_price: price,
      admin_selling_price: adminPrice,
      shopkeeper_price: productData.shopkeeper_price !== undefined ? Number(productData.shopkeeper_price) : undefined,
      discount_percentage: discount,
      stock: Number(productData.stock) || 30,
      status: productData.status || 'Draft',
      rating: 4.5,
      rating_count: 12,
      sizes: productData.sizes && productData.sizes.length > 0 ? productData.sizes : ['M', 'L', 'XL'],
      colors: productData.colors && productData.colors.length > 0 ? productData.colors : ['Classic Blue'],
      tags: productData.tags || ['New'],
      specifications: productData.specifications || {
        Fabric: '100% Breathable Cotton',
        Fit: 'Regular Fit',
        WashCare: 'Machine Wash Cold',
        Origin: 'India',
      },
      images: productData.images && productData.images.length > 0 ? productData.images : [
        {
          id: `img-${Date.now()}`,
          image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
          sort_order: 1,
          is_primary: true,
          caption: 'Front View',
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    all.unshift(newProd);
    this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(all));
    supabaseSaveProduct(newProd).catch(() => {});
    notifyDataChanged();
    return newProd;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const all = this.getAllProducts();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    let mrp = updates.mrp !== undefined ? Number(updates.mrp) : all[idx].mrp;
    let adminPrice = updates.admin_selling_price !== undefined
      ? Number(updates.admin_selling_price)
      : (updates.selling_price !== undefined ? Number(updates.selling_price) : (all[idx].admin_selling_price || all[idx].selling_price));
    let price = adminPrice;
    let discount = updates.discount_percentage !== undefined
      ? Number(updates.discount_percentage)
      : Math.max(0, Math.round(((mrp - price) / mrp) * 100));

    let shopkeeperPrice = updates.shopkeeper_price !== undefined
      ? Number(updates.shopkeeper_price)
      : all[idx].shopkeeper_price;

    // Handle stock status auto transition if out of stock
    let status = updates.status || all[idx].status;
    if (updates.stock !== undefined && updates.stock <= 0 && status === 'Published') {
      status = 'Out of Stock';
    }

    all[idx] = {
      ...all[idx],
      ...updates,
      mrp,
      selling_price: price,
      admin_selling_price: adminPrice,
      shopkeeper_price: shopkeeperPrice,
      discount_percentage: discount,
      status,
      updated_at: new Date().toISOString(),
    };

    this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(all));
    supabaseUpdateProduct(id, all[idx]).catch(() => {});
    notifyDataChanged();
    return all[idx];
  }

  togglePublishProduct(id: string): Product | null {
    const all = this.getAllProducts();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const currentStatus = all[idx].status;
    const newStatus: ProductStatus = currentStatus === 'Published' ? 'Unpublished' : 'Published';
    all[idx].status = newStatus;
    all[idx].updated_at = new Date().toISOString();

    this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(all));
    supabaseUpdateProduct(id, { status: newStatus }).catch(() => {});
    notifyDataChanged();
    return all[idx];
  }

  duplicateProduct(id: string): Product | null {
    const p = this.getProductById(id);
    if (!p) return null;

    const dupData: Partial<Product> = {
      ...p,
      name: `${p.name} (Copy)`,
      sku: `${p.sku}-CPY`,
      status: 'Draft',
    };
    return this.addProduct(dupData);
  }

  deleteProduct(id: string): boolean {
    let all = this.getAllProducts();
    all = all.filter((p) => p.id !== id);
    this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(all));
    supabaseDeleteProduct(id).catch(() => {});
    notifyDataChanged();
    return true;
  }

  async addProductAsync(productData: Partial<Product>): Promise<Product> {
    const all = this.getAllProducts();
    const id = productData.id || `prod-${Date.now()}`;
    const mrp = Number(productData.mrp) || 1999;
    const adminPrice = productData.admin_selling_price !== undefined
      ? Number(productData.admin_selling_price)
      : (productData.selling_price !== undefined ? Number(productData.selling_price) : 999);
    const price = adminPrice;
    const shopkeeperPrice = productData.shopkeeper_price !== undefined
      ? Number(productData.shopkeeper_price)
      : 600;
    const discount = productData.discount_percentage !== undefined
      ? Number(productData.discount_percentage)
      : Math.max(0, Math.round(((mrp - price) / mrp) * 100));

    let status = productData.status || 'Published';
    if (productData.stock !== undefined && productData.stock <= 0 && status === 'Published') {
      status = 'Out of Stock';
    }

    const newProd: Product = {
      id,
      sku: productData.sku || `ST1-${Math.floor(1000 + Math.random() * 9000)}`,
      name: productData.name || '',
      slug: productData.slug || (productData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category_id: productData.category_id || 'cat-jeans',
      category_name: productData.category_name || 'Jeans',
      category_slug: productData.category_slug || 'jeans',
      gender: productData.gender || 'Men',
      description: productData.description || '',
      brand: productData.brand || 'TRYatHOME Originals',
      mrp,
      selling_price: price,
      admin_selling_price: adminPrice,
      shopkeeper_price: shopkeeperPrice,
      discount_percentage: discount,
      stock: productData.stock !== undefined ? Number(productData.stock) : 40,
      rating: productData.rating || 5.0,
      rating_count: productData.rating_count || 0,
      sizes: productData.sizes || [],
      colors: productData.colors || [],
      tags: productData.tags || [],
      specifications: productData.specifications || {},
      shopkeeper_id: productData.shopkeeper_id || null,
      shopkeeper_name: productData.shopkeeper_name || null,
      approval_status: productData.approval_status || (productData.shopkeeper_id ? 'PENDING' : 'APPROVED'),
      rejection_reason: productData.rejection_reason || null,
      is_live: productData.approval_status === 'APPROVED' ? (productData.is_live !== false) : false,
      status: (productData.approval_status === 'APPROVED' || !productData.shopkeeper_id) ? (status || 'Published') : 'Draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: productData.images || [],
      variants: productData.variants || [],
    };

    const success = await supabaseSaveProduct(newProd);
    if (!success) {
      throw new Error("Failed to save product to the database.");
    }

    all.push(newProd);
    this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(all));
    notifyDataChanged();
    return newProd;
  }

  async updateProductAsync(id: string, updates: Partial<Product>): Promise<Product | null> {
    const all = this.getAllProducts();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    let mrp = updates.mrp !== undefined ? Number(updates.mrp) : all[idx].mrp;
    let adminPrice = updates.admin_selling_price !== undefined
      ? Number(updates.admin_selling_price)
      : (updates.selling_price !== undefined ? Number(updates.selling_price) : (all[idx].admin_selling_price || all[idx].selling_price));
    let price = adminPrice;
    let discount = updates.discount_percentage !== undefined
      ? Number(updates.discount_percentage)
      : Math.max(0, Math.round(((mrp - price) / mrp) * 100));

    let shopkeeperPrice = updates.shopkeeper_price !== undefined
      ? Number(updates.shopkeeper_price)
      : all[idx].shopkeeper_price;

    let status = updates.status || all[idx].status;
    if (updates.stock !== undefined && updates.stock <= 0 && status === 'Published') {
      status = 'Out of Stock';
    }

    const updatedProd: Product = {
      ...all[idx],
      ...updates,
      mrp,
      selling_price: price,
      admin_selling_price: adminPrice,
      shopkeeper_price: shopkeeperPrice,
      discount_percentage: discount,
      status,
      updated_at: new Date().toISOString(),
    };

    const success = await supabaseUpdateProduct(id, updatedProd);
    if (!success) {
      throw new Error("Failed to save changes to the database.");
    }

    all[idx] = updatedProd;
    this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(all));
    if (updatedProd.shopkeeper_id) {
      this.recalculateShopkeeperStats(updatedProd.shopkeeper_id);
    }
    notifyDataChanged();
    return updatedProd;
  }

  async deleteProductAsync(id: string): Promise<boolean> {
    const success = await supabaseDeleteProduct(id);
    if (!success) {
      throw new Error("Failed to delete product from database.");
    }
    let all = this.getAllProducts();
    all = all.filter((p) => p.id !== id);
    this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(all));
    notifyDataChanged();
    return true;
  }

  // ===================== CUSTOMER AUTH & PROFILE =====================
  getCustomers(): Customer[] {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.CUSTOMERS);
      let list: Customer[] = data ? JSON.parse(data) : [];

      const ctx = this.getActiveAdminContext();
      if (!ctx.isSuperMaster && ctx.adminId) {
        const adminAccount = this.getAdmins().find((a) => a.id === ctx.adminId);
        const storePins = new Set(adminAccount?.assigned_pincodes || ['822114']);

        list = list.filter((c) => {
          if (c.admin_id === ctx.adminId) return true;
          const matchPin = c.addresses?.some((addr) => storePins.has(addr.pincode));
          if (matchPin) return true;
          return false;
        });
      }

      // Dynamically calculate order count & total spent for each customer across all orders
      const allOrders = this.getOrders();
      const updatedList = list.map((c) => {
        const cleanMobile = (c.mobile || '').replace(/\D/g, '').slice(-10);
        const userOrders = allOrders.filter(
          (o) =>
            o.customer_id === c.customer_id ||
            o.customer_id === c.id ||
            o.address?.customer_id === c.customer_id ||
            (cleanMobile && (o.mobile || '').replace(/\D/g, '').slice(-10) === cleanMobile)
        );

        const activeOrders = userOrders.filter((o) => o.order_status !== 'Cancelled');
        const calcTotalOrders = userOrders.length;
        const calcTotalSpent = activeOrders.reduce((sum, o) => {
          const calc = this.getOrderBillCalculation(o);
          return sum + (calc.final_payable || o.final_payable_amount || o.total || 0);
        }, 0);

        return {
          ...c,
          total_orders: Math.max(c.total_orders || 0, calcTotalOrders),
          total_spent: Math.max(c.total_spent || 0, calcTotalSpent),
        };
      });

      return updatedList.sort((a, b) => {
        const timeA = new Date(a.created_at || a.last_order_at || 0).getTime();
        const timeB = new Date(b.created_at || b.last_order_at || 0).getTime();
        return timeB - timeA;
      });
    } catch {
      return [];
    }
  }

  getCustomerByMobile(mobile: string): Customer | null {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    const customers = this.getCustomers();
    return customers.find((c) => (c.mobile || '').replace(/\D/g, '').slice(-10) === cleanMobile) || null;
  }

  getCurrentCustomer(): Customer | null {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.CURRENT_CUSTOMER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // ===================== ADMIN ACCOUNTS =====================


  getAdminByMobile(mobile: string): AdminAccount | null {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    const admins = this.getAdmins();
    return (
      admins.find(
        (a) => (a.mobile || '').replace(/\D/g, '').slice(-10) === cleanMobile && a.status === 'ACTIVE'
      ) || null
    );
  }

  getDeliveryBoyByMobile(mobile: string): DeliveryBoy | null {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    const boys = this.getDeliveryBoys();
    return (
      boys.find(
        (b) => (b.mobile || '').replace(/\D/g, '').slice(-10) === cleanMobile
      ) || null
    );
  }

  // ===================== SHOPKEEPERS & INVENTORY MANAGEMENT =====================
  getShopkeepers(): Shopkeeper[] {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.SHOPKEEPERS);
      let list: Shopkeeper[] = data ? JSON.parse(data) : [];
      const ctx = this.getActiveAdminContext();
      if (!ctx.isSuperMaster && ctx.adminId) {
        const adminAccount = this.getAdmins().find((a) => a.id === ctx.adminId);
        const storePins = new Set(adminAccount?.assigned_pincodes || []);

        list = list.filter((s) => {
          if (s.admin_id === ctx.adminId) return true;
          if (s.pincode && storePins.has(s.pincode)) return true;
          if (s.pincodes?.some((p) => storePins.has(p))) return true;
          return false;
        });
      }
      return list;
    } catch {
      return [];
    }
  }

  getShopkeeperById(idOrShopId: string): Shopkeeper | null {
    if (!idOrShopId) return null;
    const raw = this.getStorageItem(STORAGE_KEYS.SHOPKEEPERS);
    const list: Shopkeeper[] = raw ? JSON.parse(raw) : [];
    return list.find((s) => s.id === idOrShopId || s.shopkeeper_id === idOrShopId) || null;
  }

  getShopkeeperByMobile(mobile: string): Shopkeeper | null {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    const raw = this.getStorageItem(STORAGE_KEYS.SHOPKEEPERS);
    const list: Shopkeeper[] = raw ? JSON.parse(raw) : [];
    return (
      list.find(
        (s) => (s.mobile || '').replace(/\D/g, '').slice(-10) === cleanMobile && s.status === 'ACTIVE'
      ) || null
    );
  }

  createShopkeeper(data: {
    name: string;
    store_name?: string;
    mobile: string;
    email?: string;
    city?: string;
    pincode?: string;
    pincodes?: string[];
    permissions?: Partial<ShopkeeperPermissions>;
    admin_id?: string;
  }): Shopkeeper {
    const shopkeepers = this.getShopkeepers();
    const cleanMobile = data.mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }
    const roleCheck = this.checkMobileRole(cleanMobile);
    if (roleCheck.exists) {
      throw new Error(`Mobile number +91 ${cleanMobile} is already registered as ${roleCheck.role}.`);
    }

    const activeAdmin = this.getCurrentAdmin();
    const pincode = data.pincode || (data.pincodes && data.pincodes[0]) || (activeAdmin?.assigned_pincodes && activeAdmin.assigned_pincodes[0]) || '822114';
    const matchedAdmin = this.findAdminForPincode(pincode);
    const admin_id = data.admin_id || activeAdmin?.id || matchedAdmin?.id || 'adm-1';

    const existingNums = shopkeepers.map((s) => {
      const match = (s.shopkeeper_id || '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
    const seqNum = Math.max(shopkeepers.length + 1, maxNum + 1, Math.floor(Math.random() * 899999) + 100000);
    const shopkeeper_id = `STYLE1-SHOP-${String(seqNum).padStart(6, '0')}`;
    const id = generateUUID();

    const defaultPermissions: ShopkeeperPermissions = {
      can_view_dashboard: true,
      can_add_product: true,
      can_edit_product: true,
      can_upload_images: true,
      can_view_catalog: true,
      can_stock_in: true,
      can_stock_out: true,
      can_view_inventory: true,
      can_view_orders: true,
      can_view_stock_history: true,
      can_edit_price: true,
      can_edit_category: false,
      can_edit_images: true,
    };

    const newShopkeeper: Shopkeeper = {
      id,
      shopkeeper_id,
      admin_id,
      pincode,
      pincodes: data.pincodes || [pincode],
      name: data.name.trim(),
      store_name: data.store_name?.trim() || `${data.name.trim()}'s Fashion Hub`,
      mobile: cleanMobile,
      email: data.email?.trim() || `${cleanMobile}@partner.tryathome.in`,
      city: data.city?.trim() || 'New Delhi',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      permissions: {
        ...defaultPermissions,
        ...(data.permissions || {}),
      },
      total_products: 0,
      live_products: 0,
      pending_products: 0,
      current_stock: 0,
      total_orders: 0,
    };

    shopkeepers.push(newShopkeeper);
    this.setStorageItem(STORAGE_KEYS.SHOPKEEPERS, JSON.stringify(shopkeepers));
    notifyDataChanged();
    return newShopkeeper;
  }

  updateShopkeeper(id: string, updates: Partial<Shopkeeper>): Shopkeeper | null {
    const list = this.getShopkeepers();
    const idx = list.findIndex((s) => s.id === id || s.shopkeeper_id === id);
    if (idx === -1) return null;

    if (updates.pincode) {
      const matchedAdmin = this.findAdminForPincode(updates.pincode);
      if (matchedAdmin) updates.admin_id = matchedAdmin.id;
    }

    list[idx] = {
      ...list[idx],
      ...updates,
      permissions: updates.permissions
        ? { ...list[idx].permissions, ...updates.permissions }
        : list[idx].permissions,
    };

    this.setStorageItem(STORAGE_KEYS.SHOPKEEPERS, JSON.stringify(list));
    notifyDataChanged();
    return list[idx];
  }

  deleteShopkeeper(id: string): boolean {
    const list = this.getShopkeepers();
    const idx = list.findIndex((s) => s.id === id || s.shopkeeper_id === id);
    if (idx === -1) return false;
    list[idx].status = 'INACTIVE';
    this.setStorageItem(STORAGE_KEYS.SHOPKEEPERS, JSON.stringify(list));
    notifyDataChanged();
    return true;
  }

  async createShopkeeperAsync(data: {
    name: string;
    store_name?: string;
    mobile: string;
    email?: string;
    city?: string;
    pincode?: string;
    pincodes?: string[];
    permissions?: Partial<ShopkeeperPermissions>;
    admin_id?: string;
  }): Promise<Shopkeeper> {
    const shopkeepers = this.getShopkeepers();
    const cleanMobile = data.mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }
    const roleCheck = this.checkMobileRole(cleanMobile);
    if (roleCheck.exists) {
      throw new Error(`Mobile number +91 ${cleanMobile} is already registered as ${roleCheck.role}.`);
    }

    const activeAdmin = this.getCurrentAdmin();
    const pincode = data.pincode || (data.pincodes && data.pincodes[0]) || (activeAdmin?.assigned_pincodes && activeAdmin.assigned_pincodes[0]) || '822114';
    const matchedAdmin = this.findAdminForPincode(pincode);
    const admin_id = data.admin_id || activeAdmin?.id || matchedAdmin?.id || 'adm-1';

    const existingNums = shopkeepers.map((s) => {
      const match = (s.shopkeeper_id || '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
    const seqNum = Math.max(shopkeepers.length + 1, maxNum + 1, Math.floor(Math.random() * 899999) + 100000);
    const shopkeeper_id = `STYLE1-SHOP-${String(seqNum).padStart(6, '0')}`;
    const id = generateUUID();

    const defaultPermissions: ShopkeeperPermissions = {
      can_view_dashboard: true,
      can_add_product: true,
      can_edit_product: true,
      can_upload_images: true,
      can_view_catalog: true,
      can_stock_in: true,
      can_stock_out: true,
      can_view_inventory: true,
      can_view_orders: true,
      can_view_stock_history: true,
      can_edit_price: true,
      can_edit_category: false,
      can_edit_images: true,
    };

    const newShopkeeper: Shopkeeper = {
      id,
      shopkeeper_id,
      name: data.name.trim(),
      store_name: data.store_name?.trim() || `${data.name.trim()}'s Fashion Hub`,
      mobile: cleanMobile,
      email: data.email?.trim() || `${cleanMobile}@partner.tryathome.in`,
      city: data.city?.trim() || 'New Delhi',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      permissions: {
        ...defaultPermissions,
        ...(data.permissions || {}),
      },
      total_products: 0,
      live_products: 0,
      pending_products: 0,
      current_stock: 0,
      total_orders: 0,
    };

    const success = await supabaseSaveShopkeeper(newShopkeeper);
    if (!success) {
      throw new Error("Failed to save shopkeeper partner to database.");
    }

    shopkeepers.push(newShopkeeper);
    this.setStorageItem(STORAGE_KEYS.SHOPKEEPERS, JSON.stringify(shopkeepers));
    notifyDataChanged();
    return newShopkeeper;
  }

  async updateShopkeeperAsync(id: string, updates: Partial<Shopkeeper>): Promise<Shopkeeper | null> {
    const list = this.getShopkeepers();
    const idx = list.findIndex((s) => s.id === id || s.shopkeeper_id === id);
    if (idx === -1) return null;

    const original = list[idx];
    const updated = {
      ...original,
      ...updates,
      permissions: updates.permissions
        ? { ...original.permissions, ...updates.permissions }
        : original.permissions,
    };

    const success = await supabaseSaveShopkeeper(updated);
    if (!success) {
      throw new Error("Failed to save shopkeeper updates to database.");
    }

    list[idx] = updated;
    this.setStorageItem(STORAGE_KEYS.SHOPKEEPERS, JSON.stringify(list));
    notifyDataChanged();
    return updated;
  }

  async deleteShopkeeperAsync(id: string): Promise<boolean> {
    const success = await supabaseDeleteShopkeeper(id);
    if (!success) {
      throw new Error("Failed to delete shopkeeper from database.");
    }
    const list = this.getShopkeepers();
    const idx = list.findIndex((s) => s.id === id || s.shopkeeper_id === id);
    if (idx !== -1) {
      list[idx].status = 'INACTIVE';
      this.setStorageItem(STORAGE_KEYS.SHOPKEEPERS, JSON.stringify(list));
      notifyDataChanged();
    }
    return true;
  }

  getCurrentShopkeeper(): Shopkeeper | null {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.CURRENT_SHOPKEEPER);
      if (!data) return null;
      const parsed: Shopkeeper = JSON.parse(data);
      const latest = this.getShopkeeperById(parsed.id);
      return latest || parsed;
    } catch {
      return null;
    }
  }

  setCurrentShopkeeper(shop: Shopkeeper | null): void {
    if (!shop) {
      this.removeStorageItem(STORAGE_KEYS.CURRENT_SHOPKEEPER);
    } else {
      this.setStorageItem(STORAGE_KEYS.CURRENT_SHOPKEEPER, JSON.stringify(shop));
    }
    notifyDataChanged();
  }

  recalculateShopkeeperStats(shopkeeperId: string): void {
    const shopkeepers = this.getShopkeepers();
    const idx = shopkeepers.findIndex((s) => s.id === shopkeeperId || s.shopkeeper_id === shopkeeperId);
    if (idx === -1) return;

    const shop = shopkeepers[idx];
    const products = this.getShopkeeperProducts(shop.id);
    const isPartnerActive = shop.status === 'ACTIVE';
    const liveCount = isPartnerActive
      ? products.filter(
          (p) => p.approval_status === 'APPROVED' && p.is_live === true && (p.stock || 0) > 0
        ).length
      : 0;
    const pendingCount = products.filter((p) => p.approval_status === 'PENDING').length;
    const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
    const orders = this.getShopkeeperOrders(shop.id);

    shopkeepers[idx].total_products = products.length;
    shopkeepers[idx].live_products = liveCount;
    shopkeepers[idx].pending_products = pendingCount;
    shopkeepers[idx].current_stock = totalStock;
    shopkeepers[idx].total_orders = orders.length;

    this.setStorageItem(STORAGE_KEYS.SHOPKEEPERS, JSON.stringify(shopkeepers));
    notifyDataChanged();
  }

  getShopkeeperProducts(shopkeeperId: string): Product[] {
    const all = this.getAllProducts();
    const sk = this.getShopkeeperById(shopkeeperId);
    const validIds = new Set<string>([shopkeeperId]);
    if (sk) {
      if (sk.id) validIds.add(sk.id);
      if (sk.shopkeeper_id) validIds.add(sk.shopkeeper_id);
    }
    return all.filter((p) => p.shopkeeper_id && validIds.has(p.shopkeeper_id));
  }

  getShopkeeperOrders(shopkeeperId: string): Order[] {
    const allOrders = this.getOrders();
    const sk = this.getShopkeeperById(shopkeeperId);
    const validIds = new Set<string>([shopkeeperId]);
    if (sk) {
      if (sk.id) validIds.add(sk.id);
      if (sk.shopkeeper_id) validIds.add(sk.shopkeeper_id);
    }
    const myProdIds = new Set(this.getShopkeeperProducts(shopkeeperId).map((p) => p.id));
    return allOrders.filter((ord) =>
      ord.items.some(
        (it) => (it.shopkeeper_id && validIds.has(it.shopkeeper_id)) || myProdIds.has(it.product_id)
      )
    );
  }

  addShopkeeperProduct(
    shopkeeperId: string,
    data: {
      name: string;
      sku?: string;
      category_id: string;
      category_name?: string;
      subcategory_id?: string;
      subcategory_name?: string;
      gender?: any;
      brand?: string;
      color?: string;
      colors?: string[];
      sizes?: string[];
      mrp: number;
      selling_price?: number;
      shopkeeper_price?: number;
      admin_selling_price?: number;
      stock: number;
      description?: string;
      images?: any[];
    }
  ): Product {
    const shopkeeper = this.getShopkeeperById(shopkeeperId);
    if (!shopkeeper) throw new Error('Shopkeeper record not found.');
    if (!shopkeeper.permissions.can_add_product) {
      throw new Error('Permission denied: You do not have permission to add products.');
    }

    const all = this.getAllProducts();
    const id = `prod-shop-${Date.now()}`;
    const cleanSku =
      data.sku && data.sku.trim()
        ? data.sku.trim().toUpperCase()
        : `SK-${shopkeeper.shopkeeper_id.slice(-4)}-${String(all.length + 1).padStart(4, '0')}`;

    const rawImages = Array.isArray(data.images) ? data.images.slice(0, 4) : [];
    const formattedImages =
      rawImages.length > 0
        ? rawImages.map((img, i) => ({
            id: img.id || `img-${Date.now()}-${i}`,
            image_url:
              img.image_url ||
              img.url ||
              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
            sort_order: i + 1,
            is_primary: i === 0,
            caption: img.caption || (i === 0 ? 'Front View' : `Angle ${i + 1}`),
          }))
        : [
            {
              id: `img-${Date.now()}-1`,
              image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
              sort_order: 1,
              is_primary: true,
              caption: 'Front View',
            },
          ];

    const mrp = Number(data.mrp) || 1999;
    const shopkeeperPrice = data.shopkeeper_price !== undefined
      ? Number(data.shopkeeper_price)
      : (data.selling_price !== undefined ? Number(data.selling_price) : 999);
    const adminSellingPrice = data.admin_selling_price !== undefined
      ? Number(data.admin_selling_price)
      : mrp; // Keep Admin Selling Price decoupled from Shopkeeper Price, defaulting to MRP
    const price = adminSellingPrice;
    const discount = Math.max(0, Math.round(((mrp - price) / mrp) * 100));
    const initStock = Math.max(0, Number(data.stock) || 0);

    const newProd: Product = {
      id,
      sku: cleanSku,
      name: data.name.trim(),
      slug:
        data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') + `-${id.slice(-4)}`,
      category_id: data.category_id,
      category_name: data.category_name || 'Ethnic Wear',
      subcategory_id: data.subcategory_id,
      subcategory_name: data.subcategory_name,
      gender: data.gender || 'Men',
      description:
        data.description ||
        'Premium apparel designed with high quality fabrics for daily elegance and durability.',
      brand: data.brand || shopkeeper.store_name || shopkeeper.name,
      mrp,
      selling_price: price,
      admin_selling_price: adminSellingPrice,
      shopkeeper_price: shopkeeperPrice,
      discount_percentage: discount,
      stock: initStock,
      status: 'Draft',
      rating: 4.8,
      rating_count: 1,
      sizes: data.sizes && data.sizes.length > 0 ? data.sizes : ['M', 'L', 'XL'],
      colors: data.colors && data.colors.length > 0 ? data.colors : [data.color || 'Multi'],
      tags: ['Shopkeeper Partner', 'New Arrival'],
      specifications: {
        Store: shopkeeper.store_name || shopkeeper.name,
        City: shopkeeper.city || 'India',
        Origin: 'Made in India',
      },
      images: formattedImages,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      shopkeeper_id: shopkeeper.shopkeeper_id || shopkeeper.id,
      shopkeeper_name: shopkeeper.name,
      approval_status: 'PENDING',
      is_live: false,
    };

    all.unshift(newProd);
    this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(all));

    if (initStock > 0) {
      const transactions = this.getStockTransactions();
      const nextNum = transactions.length + 1;
      const txId = `STX-${String(nextNum).padStart(6, '0')}`;
      const newTx: StockTransaction = {
        id: `stx-${Date.now()}`,
        transaction_id: txId,
        product_id: newProd.id,
        product_name: newProd.name,
        sku: newProd.sku,
        category_name: newProd.category_name,
        shopkeeper_id: shopkeeper.shopkeeper_id || shopkeeper.id,
        shopkeeper_name: shopkeeper.name,
        transaction_type: 'IN',
        quantity: initStock,
        previous_stock: 0,
        new_stock: initStock,
        reference_note: 'Initial stock on product creation',
        performed_by: 'SHOPKEEPER',
        performed_by_name: shopkeeper.name,
        performed_by_id: shopkeeper.id,
        timestamp: new Date().toISOString(),
      };
      transactions.unshift(newTx);
      this.setStorageItem(STORAGE_KEYS.STOCK_TRANSACTIONS, JSON.stringify(transactions));
    }

    this.recalculateShopkeeperStats(shopkeeper.id);
    notifyDataChanged();
    return newProd;
  }

  updateShopkeeperProduct(
    productId: string,
    shopkeeperId: string,
    updates: Partial<Product>
  ): Product {
    const prod = this.getProductById(productId);
    if (!prod) throw new Error('Product not found.');

    const shopkeeper = this.getShopkeeperById(shopkeeperId);
    if (!shopkeeper) throw new Error('Shopkeeper not found.');

    const validIds = new Set<string>([shopkeeperId, shopkeeper.id, shopkeeper.shopkeeper_id].filter(Boolean) as string[]);
    if (!prod.shopkeeper_id || !validIds.has(prod.shopkeeper_id)) {
      throw new Error('Access denied: You do not own this product.');
    }

    const cleanUpdates: Partial<Product> = { ...updates };
    if (!shopkeeper.permissions.can_edit_price) {
      delete cleanUpdates.mrp;
      delete cleanUpdates.selling_price;
      delete cleanUpdates.shopkeeper_price;
      delete cleanUpdates.admin_selling_price;
      delete cleanUpdates.discount_percentage;
    } else {
      // If shopkeeper updates their price, we keep shopkeeper_price and admin_selling_price completely independent
      // and do not assign or synchronize them.
    }
    if (!shopkeeper.permissions.can_edit_category) {
      delete cleanUpdates.category_id;
      delete cleanUpdates.category_name;
      delete cleanUpdates.subcategory_id;
      delete cleanUpdates.subcategory_name;
    }
    if (!shopkeeper.permissions.can_edit_images) {
      delete cleanUpdates.images;
    }

    delete cleanUpdates.approval_status;
    delete cleanUpdates.is_live;
    delete cleanUpdates.reviewed_by;
    delete cleanUpdates.reviewed_at;

    // If product was REJECTED and shopkeeper edits it, resubmit for approval
    if (prod.approval_status === 'REJECTED') {
      cleanUpdates.approval_status = 'PENDING';
      cleanUpdates.is_live = false;
      cleanUpdates.status = 'Draft';
      cleanUpdates.rejection_reason = undefined;
    }

    const updated = this.updateProduct(productId, cleanUpdates);
    this.recalculateShopkeeperStats(shopkeeperId);
    return updated!;
  }

  async addShopkeeperProductAsync(
    shopkeeperId: string,
    data: any
  ): Promise<Product> {
    const shopkeeper = this.getShopkeeperById(shopkeeperId);
    if (shopkeeper) {
      try {
        await supabaseSaveShopkeeper(shopkeeper);
      } catch (err) {
        console.warn("[Shopkeeper DB] Pre-sync shopkeeper record warning:", err);
      }
    }
    const prod = this.addShopkeeperProduct(shopkeeperId, data);
    const success = await supabaseSaveProduct(prod);
    if (!success) {
      let all = this.getAllProducts();
      all = all.filter((p) => p.id !== prod.id);
      this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(all));
      this.recalculateShopkeeperStats(shopkeeperId);
      notifyDataChanged();
      throw new Error("Failed to save product to database.");
    }
    return prod;
  }

  async updateShopkeeperProductAsync(
    productId: string,
    shopkeeperId: string,
    updates: Partial<Product>
  ): Promise<Product> {
    const original = this.getProductById(productId);
    if (!original) throw new Error('Product not found.');

    const prod = this.updateShopkeeperProduct(productId, shopkeeperId, updates);
    const success = await supabaseUpdateProduct(productId, prod);
    if (!success) {
      const all = this.getAllProducts();
      const idx = all.findIndex((p) => p.id === productId);
      if (idx !== -1) {
        all[idx] = original;
        this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(all));
        this.recalculateShopkeeperStats(shopkeeperId);
        notifyDataChanged();
      }
      throw new Error("Failed to save changes to database.");
    }
    return prod;
  }

  adminSetProductSellingPrice(productId: string, adminSellingPrice: number): Product {
    const prod = this.getProductById(productId);
    if (!prod) throw new Error('Product not found.');
    const price = Number(adminSellingPrice);
    if (isNaN(price) || price <= 0) throw new Error('Selling price must be a valid positive number.');
    if (price > prod.mrp) throw new Error(`Selling price cannot exceed MRP (₹${prod.mrp}).`);

    const discount = Math.max(0, Math.round(((prod.mrp - price) / prod.mrp) * 100));
    const updated = this.updateProduct(productId, {
      admin_selling_price: price,
      selling_price: price,
      discount_percentage: discount,
    });
    if (prod.shopkeeper_id) this.recalculateShopkeeperStats(prod.shopkeeper_id);
    notifyDataChanged();
    return updated!;
  }

  adminApproveProduct(productId: string, adminId: string, adminName: string): Product {
    const prod = this.getProductById(productId);
    if (!prod) throw new Error('Product not found.');
    const isLive = (prod.stock || 0) > 0;
    const updated = this.updateProduct(productId, {
      approval_status: 'APPROVED',
      is_live: isLive,
      status: isLive ? 'Published' : 'Out of Stock',
      reviewed_by: adminName,
      reviewed_at: new Date().toISOString(),
      rejection_reason: undefined,
    });
    if (prod.shopkeeper_id) this.recalculateShopkeeperStats(prod.shopkeeper_id);
    notifyDataChanged();
    return updated!;
  }

  async adminApproveProductAsync(productId: string, adminId: string, adminName: string): Promise<Product> {
    const prod = this.getProductById(productId);
    if (!prod) throw new Error('Product not found.');
    const isLive = (prod.stock || 0) > 0;
    const updated = await this.updateProductAsync(productId, {
      approval_status: 'APPROVED',
      is_live: isLive,
      status: isLive ? 'Published' : 'Out of Stock',
      reviewed_by: adminName,
      reviewed_at: new Date().toISOString(),
      rejection_reason: undefined,
    });
    if (!updated) throw new Error('Failed to update product approval status.');
    if (prod.shopkeeper_id) this.recalculateShopkeeperStats(prod.shopkeeper_id);
    notifyDataChanged();
    return updated;
  }

  adminRejectProduct(productId: string, reason: string, adminId: string, adminName: string): Product {
    const prod = this.getProductById(productId);
    if (!prod) throw new Error('Product not found.');
    const updated = this.updateProduct(productId, {
      approval_status: 'REJECTED',
      is_live: false,
      status: 'Draft',
      rejection_reason: reason || 'Product details require revisions.',
      reviewed_by: adminName,
      reviewed_at: new Date().toISOString(),
    });
    if (prod.shopkeeper_id) this.recalculateShopkeeperStats(prod.shopkeeper_id);
    notifyDataChanged();
    return updated!;
  }

  async adminRejectProductAsync(productId: string, reason: string, adminId: string, adminName: string): Promise<Product> {
    const prod = this.getProductById(productId);
    if (!prod) throw new Error('Product not found.');
    const updated = await this.updateProductAsync(productId, {
      approval_status: 'REJECTED',
      is_live: false,
      status: 'Draft',
      rejection_reason: reason || 'Product details require revisions.',
      reviewed_by: adminName,
      reviewed_at: new Date().toISOString(),
    });
    if (!updated) throw new Error('Failed to update product rejection status.');
    if (prod.shopkeeper_id) this.recalculateShopkeeperStats(prod.shopkeeper_id);
    notifyDataChanged();
    return updated;
  }

  adminSetProductLive(productId: string, isLive: boolean): Product {
    const prod = this.getProductById(productId);
    if (!prod) throw new Error('Product not found.');
    if (isLive && prod.approval_status !== 'APPROVED') {
      throw new Error('Product must be approved before going live.');
    }
    const updated = this.updateProduct(productId, {
      is_live: isLive,
      status: isLive ? ((prod.stock || 0) > 0 ? 'Published' : 'Out of Stock') : 'Draft',
    });
    if (prod.shopkeeper_id) this.recalculateShopkeeperStats(prod.shopkeeper_id);
    notifyDataChanged();
    return updated!;
  }

  getStockTransactions(): StockTransaction[] {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.STOCK_TRANSACTIONS);
      let list: StockTransaction[] = data ? JSON.parse(data) : [];
      const ctx = this.getActiveAdminContext();
      if (!ctx.isSuperMaster && ctx.adminId) {
        const rawShopkeepers: Shopkeeper[] = JSON.parse(this.getStorageItem(STORAGE_KEYS.SHOPKEEPERS) || '[]');
        const storeShopkeeperIds = new Set(
          rawShopkeepers.filter((s) => s.admin_id === ctx.adminId || !s.admin_id).map((s) => s.id)
        );
        rawShopkeepers.filter((s) => s.admin_id === ctx.adminId || !s.admin_id).forEach((s) => {
          if (s.shopkeeper_id) storeShopkeeperIds.add(s.shopkeeper_id);
        });

        list = list.filter((stx) => {
          if (!stx.shopkeeper_id || stx.shopkeeper_id === 'ADMIN_MASTER') return true;
          return storeShopkeeperIds.has(stx.shopkeeper_id);
        });
      }
      return list;
    } catch {
      return [];
    }
  }

  getShopkeeperStockTransactions(shopkeeperId: string): StockTransaction[] {
    const all = this.getStockTransactions();
    const sk = this.getShopkeeperById(shopkeeperId);
    const validIds = new Set<string>([shopkeeperId]);
    if (sk) {
      if (sk.id) validIds.add(sk.id);
      if (sk.shopkeeper_id) validIds.add(sk.shopkeeper_id);
    }
    return all.filter((stx) => stx.shopkeeper_id && validIds.has(stx.shopkeeper_id));
  }

  performStockIn(params: {
    productId: string;
    quantity: number;
    referenceNote?: string;
    performedBy: {
      role: 'ADMIN' | 'SHOPKEEPER';
      id: string;
      name: string;
    };
  }): { product: Product; transaction: StockTransaction } {
    const qty = Math.max(1, Math.floor(Number(params.quantity) || 1));
    const prod = this.getProductById(params.productId);
    if (!prod) throw new Error('Product not found.');

    if (params.performedBy.role === 'SHOPKEEPER') {
      const shopkeeper = this.getShopkeeperById(params.performedBy.id);
      if (!shopkeeper?.permissions.can_stock_in) {
        throw new Error('Permission denied: You do not have permission to perform Stock IN.');
      }
      const validIds = new Set<string>([params.performedBy.id, shopkeeper.id, shopkeeper.shopkeeper_id].filter(Boolean) as string[]);
      if (!prod.shopkeeper_id || !validIds.has(prod.shopkeeper_id)) {
        throw new Error('Access denied: You can only perform Stock IN on your own products.');
      }
    }

    const prevStock = prod.stock || 0;
    const newStock = prevStock + qty;

    this.updateProduct(prod.id, {
      stock: newStock,
      status: prod.status === 'Out of Stock' ? 'Published' : prod.status,
    });

    const transactions = this.getStockTransactions();
    const nextNum = transactions.length + 1;
    const txId = `STX-${String(nextNum).padStart(6, '0')}`;
    const newTx: StockTransaction = {
      id: `stx-${Date.now()}`,
      transaction_id: txId,
      product_id: prod.id,
      product_name: prod.name,
      sku: prod.sku,
      category_name: prod.category_name,
      shopkeeper_id: prod.shopkeeper_id || 'ADMIN_MASTER',
      shopkeeper_name: prod.shopkeeper_name || 'Admin Master Store',
      transaction_type: 'IN',
      quantity: qty,
      previous_stock: prevStock,
      new_stock: newStock,
      reference_note: params.referenceNote || 'Stock inward replenished',
      performed_by: params.performedBy.role,
      performed_by_name: params.performedBy.name,
      performed_by_id: params.performedBy.id,
      timestamp: new Date().toISOString(),
    };

    transactions.unshift(newTx);
    this.setStorageItem(STORAGE_KEYS.STOCK_TRANSACTIONS, JSON.stringify(transactions));

    if (prod.shopkeeper_id) {
      this.recalculateShopkeeperStats(prod.shopkeeper_id);
    }

    notifyDataChanged();
    return { product: this.getProductById(prod.id)!, transaction: newTx };
  }

  performStockOut(params: {
    productId: string;
    quantity: number;
    reason: string;
    referenceNote?: string;
    performedBy: {
      role: 'ADMIN' | 'SHOPKEEPER';
      id: string;
      name: string;
    };
  }): { product: Product; transaction: StockTransaction } {
    const qty = Math.max(1, Math.floor(Number(params.quantity) || 1));
    const prod = this.getProductById(params.productId);
    if (!prod) throw new Error('Product not found.');

    if (params.performedBy.role === 'SHOPKEEPER') {
      const shopkeeper = this.getShopkeeperById(params.performedBy.id);
      if (!shopkeeper?.permissions.can_stock_out) {
        throw new Error('Permission denied: You do not have permission to perform Stock OUT.');
      }
      const validIds = new Set<string>([params.performedBy.id, shopkeeper.id, shopkeeper.shopkeeper_id].filter(Boolean) as string[]);
      if (!prod.shopkeeper_id || !validIds.has(prod.shopkeeper_id)) {
        throw new Error('Access denied: You can only perform Stock OUT on your own products.');
      }
    }

    const prevStock = prod.stock || 0;
    if (prevStock < qty) {
      throw new Error(`Insufficient stock. Current stock is ${prevStock}, cannot remove ${qty}.`);
    }

    const newStock = prevStock - qty;
    this.updateProduct(prod.id, {
      stock: newStock,
      status: newStock <= 0 ? 'Out of Stock' : prod.status,
    });

    const transactions = this.getStockTransactions();
    const nextNum = transactions.length + 1;
    const txId = `STX-${String(nextNum).padStart(6, '0')}`;
    const newTx: StockTransaction = {
      id: `stx-${Date.now()}`,
      transaction_id: txId,
      product_id: prod.id,
      product_name: prod.name,
      sku: prod.sku,
      category_name: prod.category_name,
      shopkeeper_id: prod.shopkeeper_id || 'ADMIN_MASTER',
      shopkeeper_name: prod.shopkeeper_name || 'Admin Master Store',
      transaction_type: 'OUT',
      quantity: qty,
      previous_stock: prevStock,
      new_stock: newStock,
      reason: params.reason || 'Manual Stock OUT',
      reference_note: params.referenceNote,
      performed_by: params.performedBy.role,
      performed_by_name: params.performedBy.name,
      performed_by_id: params.performedBy.id,
      timestamp: new Date().toISOString(),
    };

    transactions.unshift(newTx);
    this.setStorageItem(STORAGE_KEYS.STOCK_TRANSACTIONS, JSON.stringify(transactions));

    if (prod.shopkeeper_id) {
      this.recalculateShopkeeperStats(prod.shopkeeper_id);
    }

    notifyDataChanged();
    return { product: this.getProductById(prod.id)!, transaction: newTx };
  }

  // ===================== ROLE-BASED AUTH & OTP =====================
  /**
   * Determine role associated with a mobile number strictly from the database:
   * 1. ADMIN
   * 2. SHOPKEEPER
   * 3. DELIVERY_BOY
   * 4. CUSTOMER
   * Or does not exist.
   * Does NOT auto-create any record.
   */
  checkMobileRole(mobile: string): {
    exists: boolean;
    role: UserRole | null;
    user?: Customer | DeliveryBoy | AdminAccount | Shopkeeper;
    error?: string;
  } {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      return {
        exists: false,
        role: null,
        error: 'Please enter a valid 10-digit Indian mobile number.',
      };
    }

    // 1. Check Admin
    const admin = this.getAdminByMobile(cleanMobile);
    if (admin) {
      return { exists: true, role: 'ADMIN', user: admin };
    }

    // 2. Check Shopkeeper
    const shopkeeper = this.getShopkeeperByMobile(cleanMobile);
    if (shopkeeper) {
      return { exists: true, role: 'SHOPKEEPER', user: shopkeeper };
    }

    // 3. Check Delivery Boy
    const boy = this.getDeliveryBoyByMobile(cleanMobile);
    if (boy) {
      return { exists: true, role: 'DELIVERY_BOY', user: boy };
    }

    // 4. Check Customer
    const customer = this.getCustomerByMobile(cleanMobile);
    if (customer) {
      return { exists: true, role: 'CUSTOMER', user: customer };
    }

    // Unregistered / Unknown
    return { exists: false, role: null };
  }

  /**
   * Send OTP for a mobile number.
   * Enforces 10-digit Indian format and 5-minute expiry.
   */
  sendAuthOtp(mobile: string): {
    success: boolean;
    otp: string;
    role?: UserRole | null;
    message: string;
    expiresInSeconds: number;
    error?: string;
  } {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      return {
        success: false,
        otp: '',
        message: '',
        expiresInSeconds: 0,
        error: 'Please enter a valid 10-digit Indian mobile number.',
      };
    }

    // Rate limiting: allow re-send only after at least 10 seconds
    try {
      const existingOtpRaw = this.getStorageItem(STORAGE_KEYS.ACTIVE_OTP);
      if (existingOtpRaw) {
        const existing = JSON.parse(existingOtpRaw);
        if (
          existing.mobile === cleanMobile &&
          existing.created_at &&
          Date.now() - existing.created_at < 10000
        ) {
          return {
            success: false,
            otp: existing.otp || '',
            message: 'Please wait a few moments before requesting another OTP.',
            expiresInSeconds: Math.max(0, Math.ceil((existing.expires_at - Date.now()) / 1000)),
            error: 'Please wait a few moments before requesting another OTP.',
          };
        }
      }
    } catch {}

    const roleInfo = this.checkMobileRole(cleanMobile);

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = Date.now() + 5 * 60 * 1000; // 5 mins

    const payload = {
      mobile: cleanMobile,
      otp,
      role: roleInfo.role,
      attempts: 0,
      created_at: Date.now(),
      expires_at,
    };
    this.setStorageItem(STORAGE_KEYS.ACTIVE_OTP, JSON.stringify(payload));

    return {
      success: true,
      otp,
      role: roleInfo.role,
      message: `Try at Home verification code sent to +91 ${cleanMobile}`,
      expiresInSeconds: 300,
    };
  }

  /**
   * Verify OTP securely:
   * - Validates code
   * - Checks 5-minute expiration
   * - Max 5 attempts
   * - Invalidates single-use OTP
   * - Establishes role-based AuthSession and corresponding user record
   */
  verifyAuthOtp(
    mobile: string,
    enteredOtp: string
  ): {
    success: boolean;
    session?: AuthSession;
    role?: UserRole;
    error?: string;
  } {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      return { success: false, error: 'Invalid mobile number.' };
    }

    const storedOtpRaw = this.getStorageItem(STORAGE_KEYS.ACTIVE_OTP);
    let storedOtp: any = null;

    if (storedOtpRaw) {
      try {
        storedOtp = JSON.parse(storedOtpRaw);
      } catch {}
    }

    // Check expiration and attempts
    if (storedOtp && storedOtp.mobile === cleanMobile) {
      if (Date.now() > storedOtp.expires_at) {
        this.removeStorageItem(STORAGE_KEYS.ACTIVE_OTP);
        return { success: false, error: 'OTP has expired. Please request a new verification code.' };
      }
      storedOtp.attempts = (storedOtp.attempts || 0) + 1;
      if (storedOtp.attempts > 5) {
        this.removeStorageItem(STORAGE_KEYS.ACTIVE_OTP);
        return { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
      }
      this.setStorageItem(STORAGE_KEYS.ACTIVE_OTP, JSON.stringify(storedOtp));
    }

    const cleanInput = enteredOtp.trim();
    // Allow matching stored OTP or development code 123456
    const isValidCode =
      (storedOtp && storedOtp.mobile === cleanMobile && storedOtp.otp === cleanInput) ||
      cleanInput === '123456';

    if (!isValidCode) {
      return { success: false, error: 'Incorrect OTP. Please enter the valid 6-digit verification code.' };
    }

    // Invalidate OTP on success
    this.removeStorageItem(STORAGE_KEYS.ACTIVE_OTP);

    // Resolve user & role strictly from database
    const roleInfo = this.checkMobileRole(cleanMobile);
    if (!roleInfo.exists || !roleInfo.role) {
      return {
        success: false,
        error: 'No registered user found for this mobile number. Please create an account.',
      };
    }

    let session: AuthSession;

    if (roleInfo.role === 'ADMIN') {
      const adminAcc = roleInfo.user as AdminAccount;
      const adminUser: AdminUser = {
        id: adminAcc.id,
        name: adminAcc.name,
        email_or_mobile: adminAcc.mobile,
        role: 'super_admin',
        status: 'ACTIVE',
      };
      this.setStorageItem(STORAGE_KEYS.CURRENT_ADMIN, JSON.stringify(adminUser));
      session = {
        userId: adminAcc.id,
        role: 'ADMIN',
        mobile: cleanMobile,
        name: adminAcc.name,
        email: adminAcc.email,
        token: `tok_adm_${Date.now()}`,
        authenticated_at: new Date().toISOString(),
        expires_at: Date.now() + 7 * 86400000,
      };
    } else if (roleInfo.role === 'SHOPKEEPER') {
      const shop = roleInfo.user as Shopkeeper;
      this.setStorageItem(STORAGE_KEYS.CURRENT_SHOPKEEPER, JSON.stringify(shop));
      session = {
        userId: shop.id,
        role: 'SHOPKEEPER',
        mobile: cleanMobile,
        name: shop.name,
        email: shop.email,
        token: `tok_shop_${Date.now()}`,
        authenticated_at: new Date().toISOString(),
        expires_at: Date.now() + 7 * 86400000,
      };
    } else if (roleInfo.role === 'DELIVERY_BOY') {
      const boy = roleInfo.user as DeliveryBoy;
      this.setStorageItem(STORAGE_KEYS.CURRENT_DELIVERY_BOY, JSON.stringify(boy));
      session = {
        userId: boy.id,
        role: 'DELIVERY_BOY',
        mobile: cleanMobile,
        name: boy.name,
        email: boy.email,
        token: `tok_dboy_${Date.now()}`,
        authenticated_at: new Date().toISOString(),
        expires_at: Date.now() + 7 * 86400000,
      };
    } else {
      const cust = roleInfo.user as Customer;
      this.setStorageItem(STORAGE_KEYS.CURRENT_CUSTOMER, JSON.stringify(cust));
      session = {
        userId: cust.id,
        role: 'CUSTOMER',
        mobile: cleanMobile,
        name: cust.name,
        email: cust.email,
        token: `tok_cust_${Date.now()}`,
        authenticated_at: new Date().toISOString(),
        expires_at: Date.now() + 7 * 86400000,
      };
    }

    this.setStorageItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    supabaseSaveAuthSession({
      userId: session.userId,
      role: session.role,
      token: session.token,
      user: session,
    }).catch((err) => console.warn('[Cloud Session Sync] Notice:', err));
    notifyDataChanged();
    return { success: true, session, role: session.role };
  }

  /**
   * Register a new customer
   * Validates name, mobile, and optional email.
   * Checks for duplicate mobile across all roles.
   * Creates customer record without duplicate.
   */
  registerNewCustomer(data: {
    name: string;
    mobile: string;
    email?: string;
  }): {
    success: boolean;
    customer?: Customer;
    error?: string;
  } {
    const cleanName = data.name ? data.name.trim() : '';
    const cleanMobile = (data.mobile || '').replace(/\D/g, '').slice(-10);
    const cleanEmail = data.email ? data.email.trim() : '';

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Please enter your full name (at least 2 characters).' };
    }
    if (cleanMobile.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address or leave it blank.' };
    }

    // Check again that mobile is not already registered
    const roleInfo = this.checkMobileRole(cleanMobile);
    if (roleInfo.exists) {
      return {
        success: false,
        error: `This mobile number is already registered as a ${roleInfo.role}. Please log in directly.`,
      };
    }

    const customers = this.getCustomers();
    const nextNum = customers.length + 1;
    const customerIdStr = `STYLE1-CUST-${String(nextNum).padStart(6, '0')}`;

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      customer_id: customerIdStr,
      name: cleanName,
      mobile: cleanMobile,
      email: cleanEmail || `customer${cleanMobile.slice(-4)}@tryathome.in`,
      created_at: new Date().toISOString(),
      status: 'ACTIVE',
      total_orders: 0,
      total_spent: 0,
      addresses: [],
    };

    customers.push(newCustomer);
    this.setStorageItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    notifyDataChanged();

    return { success: true, customer: newCustomer };
  }

  /**
   * Session Management
   */
  getAuthSession(): AuthSession | null {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.AUTH_SESSION);
      if (!data) {
        // Fallback check for existing individual role sessions
        const curCust = this.getCurrentCustomer();
        if (curCust) {
          const sess: AuthSession = {
            userId: curCust.id,
            role: 'CUSTOMER',
            mobile: curCust.mobile,
            name: curCust.name,
            email: curCust.email,
            token: `tok_cust_${curCust.id}`,
            authenticated_at: new Date().toISOString(),
            expires_at: Date.now() + 7 * 86400000,
          };
          this.setStorageItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sess));
          return sess;
        }
        const curAdmin = this.getCurrentAdmin();
        if (curAdmin) {
          const sess: AuthSession = {
            userId: curAdmin.id,
            role: 'ADMIN',
            mobile: curAdmin.email_or_mobile || '9999999999',
            name: curAdmin.name,
            token: `tok_adm_${curAdmin.id}`,
            authenticated_at: new Date().toISOString(),
            expires_at: Date.now() + 7 * 86400000,
          };
          this.setStorageItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sess));
          return sess;
        }
        const curShop = this.getCurrentShopkeeper();
        if (curShop) {
          const sess: AuthSession = {
            userId: curShop.id,
            role: 'SHOPKEEPER',
            mobile: curShop.mobile,
            name: curShop.name,
            email: curShop.email,
            token: `tok_shop_${curShop.id}`,
            authenticated_at: new Date().toISOString(),
            expires_at: Date.now() + 7 * 86400000,
          };
          this.setStorageItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sess));
          return sess;
        }
        const curBoy = this.getCurrentDeliveryBoy();
        if (curBoy) {
          const sess: AuthSession = {
            userId: curBoy.id,
            role: 'DELIVERY_BOY',
            mobile: curBoy.mobile,
            name: curBoy.name,
            token: `tok_dboy_${curBoy.id}`,
            authenticated_at: new Date().toISOString(),
            expires_at: Date.now() + 7 * 86400000,
          };
          this.setStorageItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sess));
          return sess;
        }
        return null;
      }

      const parsed: AuthSession = JSON.parse(data);
      if (parsed.expires_at && Date.now() > parsed.expires_at) {
        this.logout();
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  clearAuthSession(): void {
    this.removeStorageItem(STORAGE_KEYS.AUTH_SESSION);
  }

  logout(): void {
    const sess = this.getAuthSession();
    if (sess?.token) {
      supabaseDeleteAuthSession(sess.token).catch((err) => console.warn('[Cloud Session Sync] Notice:', err));
    }
    this.removeStorageItem(STORAGE_KEYS.AUTH_SESSION);
    this.removeStorageItem(STORAGE_KEYS.CURRENT_CUSTOMER);
    this.removeStorageItem(STORAGE_KEYS.CURRENT_ADMIN);
    this.removeStorageItem(STORAGE_KEYS.CURRENT_DELIVERY_BOY);
    this.removeStorageItem(STORAGE_KEYS.CURRENT_SHOPKEEPER);
    this.removeStorageItem(STORAGE_KEYS.ACTIVE_OTP);
    notifyDataChanged();
  }

  // Generate and store OTP for mobile number
  sendOtp(mobile: string): { success: boolean; otp: string; message: string } {
    // Clean mobile
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      return { success: false, otp: '', message: 'Please enter a valid 10-digit Indian mobile number.' };
    }

    // Realistic 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpPayload = {
      mobile: cleanMobile,
      otp,
      expires_at: Date.now() + 5 * 60 * 1000, // 5 mins
    };
    this.setStorageItem(STORAGE_KEYS.ACTIVE_OTP, JSON.stringify(otpPayload));

    // Log the API payload and request in the Demo API Provider Gateway logs
    import('./otpService').then(({ OtpService }) => {
      OtpService.sendOtp(cleanMobile, otp);
    });

    return {
      success: true,
      otp,
      message: `TRYatHOME verification OTP sent to +91 ${cleanMobile}`,
    };
  }

  verifyOtp(mobile: string, enteredOtp: string): { success: boolean; customer?: Customer; error?: string } {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    const storedOtpRaw = this.getStorageItem(STORAGE_KEYS.ACTIVE_OTP);

    if (!storedOtpRaw) {
      // Fallback for easy demo verification if OTP expired or direct test
      if (enteredOtp === '123456' || enteredOtp === '999999') {
        return this.loginOrRegisterCustomer(cleanMobile);
      }
      return { success: false, error: 'OTP expired or not found. Please request a new OTP.' };
    }

    try {
      const storedOtp = JSON.parse(storedOtpRaw);
      if (storedOtp.mobile !== cleanMobile) {
        return { success: false, error: 'Mobile number mismatch. Please enter the number you requested OTP for.' };
      }
      if (Date.now() > storedOtp.expires_at) {
        return { success: false, error: 'OTP has expired. Please request a new code.' };
      }
      if (storedOtp.otp !== enteredOtp.trim() && enteredOtp !== '123456') {
        return { success: false, error: 'Incorrect OTP. Please enter the valid 6-digit verification code.' };
      }

      // Valid OTP! Remove OTP and log in customer
      this.removeStorageItem(STORAGE_KEYS.ACTIVE_OTP);
      return this.loginOrRegisterCustomer(cleanMobile);
    } catch {
      return { success: false, error: 'Failed to process OTP verification.' };
    }
  }

  private loginOrRegisterCustomer(cleanMobile: string): { success: boolean; customer: Customer } {
    const customers = this.getCustomers();
    let customer = customers.find((c) => c.mobile === cleanMobile);

    if (!customer) {
      // Generate unique Customer ID e.g. STYLE1-CUST-000003
      const nextNum = customers.length + 1;
      const customerIdStr = `STYLE1-CUST-${String(nextNum).padStart(6, '0')}`;

      customer = {
        id: `cust-${Date.now()}`,
        customer_id: customerIdStr,
        name: `Customer ${cleanMobile.slice(-4)}`,
        mobile: cleanMobile,
        email: `customer${cleanMobile.slice(-4)}@style1.in`,
        created_at: new Date().toISOString(),
        status: 'ACTIVE',
        total_orders: 0,
        total_spent: 0,
        addresses: [],
      };
      customers.unshift(customer);
      this.setStorageItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }

    this.setStorageItem(STORAGE_KEYS.CURRENT_CUSTOMER, JSON.stringify(customer));
    supabaseSaveCustomer(customer).catch((err) => {
      console.warn("[db] Background supabaseSaveCustomer warning:", err);
    });
    notifyDataChanged();
    return { success: true, customer };
  }

  setCurrentCustomer(customer: Customer): void {
    this.setStorageItem(STORAGE_KEYS.CURRENT_CUSTOMER, JSON.stringify(customer));
    notifyDataChanged();
  }

  customerLogout() {
    this.removeStorageItem(STORAGE_KEYS.CURRENT_CUSTOMER);
    this.removeStorageItem(STORAGE_KEYS.AUTH_SESSION);
    notifyDataChanged();
  }

  updateCustomerProfile(updates: Partial<Customer>): Customer | null {
    const current = this.getCurrentCustomer();
    if (!current) return null;

    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === current.id);
    if (idx === -1) return null;

    const updated = { ...customers[idx], ...updates };
    customers[idx] = updated;
    this.setStorageItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    this.setStorageItem(STORAGE_KEYS.CURRENT_CUSTOMER, JSON.stringify(updated));
    notifyDataChanged();
    return updated;
  }

  saveCustomerAddress(addressData: Omit<CustomerAddress, 'id' | 'customer_id'>, addressId?: string): CustomerAddress | null {
    const current = this.getCurrentCustomer();
    if (!current) return null;

    const customers = this.getCustomers();
    const cIdx = customers.findIndex((c) => c.id === current.id);
    if (cIdx === -1) return null;

    let addresses = customers[cIdx].addresses || [];

    if (addressData.is_default) {
      addresses = addresses.map((a) => ({ ...a, is_default: false }));
    }

    let savedAddr: CustomerAddress;

    if (addressId) {
      const aIdx = addresses.findIndex((a) => a.id === addressId);
      if (aIdx !== -1) {
        savedAddr = {
          ...addresses[aIdx],
          ...addressData,
        };
        addresses[aIdx] = savedAddr;
      } else {
        return null;
      }
    } else {
      savedAddr = {
        ...addressData,
        id: `addr-${Date.now()}`,
        customer_id: current.customer_id,
        is_default: addresses.length === 0 ? true : !!addressData.is_default,
      };
      addresses.push(savedAddr);
    }

    customers[cIdx].addresses = addresses;

    // Auto-identify and allocate Customer to Franchise Admin based on Pincode
    if (savedAddr.pincode) {
      const matchedAdmin = this.findAdminForPincode(savedAddr.pincode);
      if (matchedAdmin) {
        customers[cIdx].admin_id = matchedAdmin.id;
      }
      this.addServiceablePincode(savedAddr.pincode);
    }

    supabaseSaveAddress(savedAddr).catch(() => {});
    this.setStorageItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    this.setStorageItem(STORAGE_KEYS.CURRENT_CUSTOMER, JSON.stringify(customers[cIdx]));
    notifyDataChanged();
    return savedAddr;
  }

  deleteCustomerAddress(addressId: string): boolean {
    const current = this.getCurrentCustomer();
    if (!current) return false;

    const customers = this.getCustomers();
    const cIdx = customers.findIndex((c) => c.id === current.id);
    if (cIdx === -1) return false;

    customers[cIdx].addresses = (customers[cIdx].addresses || []).filter((a) => a.id !== addressId);
    if (customers[cIdx].addresses.length > 0 && !customers[cIdx].addresses.some((a) => a.is_default)) {
      customers[cIdx].addresses[0].is_default = true;
    }

    supabaseDeleteAddress(addressId).catch(() => {});
    this.setStorageItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    this.setStorageItem(STORAGE_KEYS.CURRENT_CUSTOMER, JSON.stringify(customers[cIdx]));
    notifyDataChanged();
    return true;
  }

  async updateCustomerProfileAsync(updates: Partial<Customer>): Promise<Customer | null> {
    const current = this.getCurrentCustomer();
    if (!current) return null;

    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === current.id);
    if (idx === -1) return null;

    const original = customers[idx];
    const updated = { ...original, ...updates };

    const success = await supabaseSaveCustomer(updated);
    if (!success) {
      throw new Error("Failed to save profile updates to database.");
    }

    customers[idx] = updated;
    this.setStorageItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    this.setStorageItem(STORAGE_KEYS.CURRENT_CUSTOMER, JSON.stringify(updated));
    notifyDataChanged();
    return updated;
  }

  async toggleCustomerVipAsync(customerId: string): Promise<Customer | null> {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.customer_id === customerId || c.id === customerId);
    if (idx === -1) return null;

    const original = customers[idx];
    const updated = { ...original, is_vip: !original.is_vip };

    const success = await supabaseSaveCustomer(updated);
    if (!success) {
      throw new Error("Failed to save VIP status to database.");
    }

    customers[idx] = updated;
    this.setStorageItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    
    const currentCust = this.getCurrentCustomer();
    if (currentCust && (currentCust.id === original.id || currentCust.customer_id === original.customer_id)) {
      this.setStorageItem(STORAGE_KEYS.CURRENT_CUSTOMER, JSON.stringify(updated));
    }

    notifyDataChanged();
    return updated;
  }

  async saveCustomerAddressAsync(
    addressData: Omit<CustomerAddress, 'id' | 'customer_id'>,
    addressId?: string,
    targetCustomerId?: string
  ): Promise<CustomerAddress | null> {
    const customers = this.getCustomers();
    let current = this.getCurrentCustomer();

    // 1. Locate customer in database
    let cIdx = -1;
    if (targetCustomerId) {
      cIdx = customers.findIndex(
        (c) => c.id === targetCustomerId || c.customer_id === targetCustomerId
      );
    }

    if (cIdx === -1 && current) {
      cIdx = customers.findIndex(
        (c) => c.id === current.id || c.customer_id === current.customer_id
      );
    }

    // 2. If customer is still not found in customers array, create or push record
    if (cIdx === -1) {
      const custToUse: Customer = current || {
        id: targetCustomerId || `cust-${Date.now()}`,
        customer_id: targetCustomerId || `CUST-${addressData.mobile}`,
        name: addressData.name,
        mobile: addressData.mobile,
        addresses: [],
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        total_orders: 0,
        total_spent: 0,
      };

      cIdx = customers.length;
      customers.push(custToUse);
      current = custToUse;
    } else {
      current = customers[cIdx];
    }

    let addresses = [...(customers[cIdx].addresses || [])];

    if (addressData.is_default) {
      addresses = addresses.map((a) => ({ ...a, is_default: false }));
    }

    const effectiveCustomerId = current.customer_id || current.id || `CUST-${current.mobile}`;

    let savedAddr: CustomerAddress;

    if (addressId) {
      const aIdx = addresses.findIndex((a) => a.id === addressId);
      if (aIdx !== -1) {
        savedAddr = {
          ...addresses[aIdx],
          ...addressData,
          customer_id: effectiveCustomerId,
        };
        addresses[aIdx] = savedAddr;
      } else {
        savedAddr = {
          ...addressData,
          id: addressId,
          customer_id: effectiveCustomerId,
          is_default: addresses.length === 0 ? true : !!addressData.is_default,
        };
        addresses.push(savedAddr);
      }
    } else {
      savedAddr = {
        ...addressData,
        id: `addr-${Date.now()}`,
        customer_id: effectiveCustomerId,
        is_default: addresses.length === 0 ? true : !!addressData.is_default,
      };
      addresses.push(savedAddr);
    }

    // Always update local customer state first so user experience is instant and resilient
    customers[cIdx].customer_id = effectiveCustomerId;
    customers[cIdx].addresses = addresses;
    this.setStorageItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    this.setStorageItem(STORAGE_KEYS.CURRENT_CUSTOMER, JSON.stringify(customers[cIdx]));
    notifyDataChanged();

    // Sync to Supabase in background
    supabaseSaveAddress(savedAddr).catch((err) => {
      console.warn("[db] Background supabaseSaveAddress warning:", err);
    });

    return savedAddr;
  }

  async deleteCustomerAddressAsync(addressId: string, targetCustomerId?: string): Promise<boolean> {
    const customers = this.getCustomers();
    let current = this.getCurrentCustomer();

    let cIdx = -1;
    if (targetCustomerId) {
      cIdx = customers.findIndex(
        (c) => c.id === targetCustomerId || c.customer_id === targetCustomerId
      );
    }
    if (cIdx === -1 && current) {
      cIdx = customers.findIndex(
        (c) => c.id === current.id || c.customer_id === current.customer_id
      );
    }

    if (cIdx === -1) return false;

    customers[cIdx].addresses = (customers[cIdx].addresses || []).filter((a) => a.id !== addressId);
    if (customers[cIdx].addresses.length > 0 && !customers[cIdx].addresses.some((a) => a.is_default)) {
      customers[cIdx].addresses[0].is_default = true;
    }

    this.setStorageItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    this.setStorageItem(STORAGE_KEYS.CURRENT_CUSTOMER, JSON.stringify(customers[cIdx]));
    notifyDataChanged();

    supabaseDeleteAddress(addressId).catch((err) => {
      console.warn("[db] Background supabaseDeleteAddress warning:", err);
    });

    return true;
  }

  // ===================== MULTI-ADMIN ACCOUNTS & AUTH =====================
  activeStoreFilter: string | null = null;

  setActiveStoreFilter(adminId: string | null): void {
    this.activeStoreFilter = adminId;
    notifyDataChanged();
  }

  getActiveStoreFilter(): string | null {
    return this.activeStoreFilter;
  }

  getActiveAdminContext(): { isSuperMaster: boolean; adminId: string | null } {
    const currentAdmin = this.getCurrentAdmin();
    const filter = this.activeStoreFilter;

    // Super Admin view
    if (!currentAdmin || currentAdmin.role === 'super_admin') {
      if (filter && filter !== 'ALL') {
        return { isSuperMaster: false, adminId: filter };
      }
      return { isSuperMaster: true, adminId: currentAdmin?.id || 'adm-1' };
    }

    // Branch / Store Admin view
    return { isSuperMaster: false, adminId: currentAdmin.id };
  }

  getCurrentAdmin(): AdminUser | null {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.CURRENT_ADMIN);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  getAdmins(): AdminAccount[] {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.ADMIN_ACCOUNTS);
      let list: AdminAccount[] = data ? JSON.parse(data) : [];

      const defaultAdmins: AdminAccount[] = [
        {
          id: 'adm-1',
          admin_code: 'SUPER-001',
          name: 'TRYatHOME Super Admin',
          email_or_mobile: 'admin@tryathome.in',
          email: 'admin@tryathome.in',
          mobile: '9876543210',
          password_pin: 'tryathome',
          role: 'super_admin',
          store_name: 'Main HQ / Master Admin',
          assigned_pincodes: ['822114', '834001', '800001', '834002', '822115'],
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
        },
        {
          id: 'adm-2',
          admin_code: 'ADM-002',
          name: 'Rajesh Kumar (Ranchi Admin)',
          email_or_mobile: 'ranchi@tryathome.in',
          email: 'ranchi@tryathome.in',
          mobile: '9835123456',
          password_pin: '123456',
          role: 'admin',
          store_name: 'Ranchi Franchise Store',
          assigned_pincodes: ['834001', '834002'],
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
        },
        {
          id: 'adm-3',
          admin_code: 'ADM-003',
          name: 'Ramesh Singh (Garhwa Admin)',
          email_or_mobile: 'garhwa@tryathome.in',
          email: 'garhwa@tryathome.in',
          mobile: '9934123456',
          password_pin: '123456',
          role: 'admin',
          store_name: 'Garhwa Branch Store',
          assigned_pincodes: ['822114', '822115'],
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
        },
        {
          id: 'adm-4',
          admin_code: 'ADM-004',
          name: 'Prakash Verma (Patna Admin)',
          email_or_mobile: 'patna@tryathome.in',
          email: 'patna@tryathome.in',
          mobile: '9708123456',
          password_pin: '123456',
          role: 'admin',
          store_name: 'Patna Central Store',
          assigned_pincodes: ['800001'],
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
        },
      ];

      let modified = false;
      defaultAdmins.forEach((def) => {
        if (!list.some((a) => a.id === def.id)) {
          list.push(def);
          modified = true;
          supabaseSaveAdminAccount(def).catch(() => {});
        }
      });

      if (modified || !data) {
        this.setStorageItem(STORAGE_KEYS.ADMIN_ACCOUNTS, JSON.stringify(list));
      }

      return list;
    } catch {
      return [];
    }
  }

  findAdminForPincode(pincode: string): AdminAccount | null {
    if (!pincode) return null;
    const cleanPin = pincode.trim();
    const admins = this.getAdmins();
    // Prefer active store admins (sub-admins) first
    const subAdmin = admins.find(
      (a) => a.role === 'admin' && a.status === 'ACTIVE' && (a.assigned_pincodes || []).includes(cleanPin)
    );
    if (subAdmin) return subAdmin;

    // Fallback to super_admin or any matching admin
    const matched = admins.find(
      (a) => a.status === 'ACTIVE' && (a.assigned_pincodes || []).includes(cleanPin)
    );
    return matched || null;
  }

  saveAdmin(account: Partial<AdminAccount>): AdminAccount {
    const list = this.getAdmins();
    const id = account.id || `adm-${Date.now()}`;
    const nextNum = list.length + 1;
    const adminCode = account.admin_code || `ADM-${String(nextNum).padStart(3, '0')}`;

    const existingIdx = list.findIndex((a) => a.id === id);
    const newRecord: AdminAccount = {
      id,
      admin_code: adminCode,
      name: account.name?.trim() || 'Store Admin',
      email_or_mobile: account.email_or_mobile?.trim() || account.email?.trim() || account.mobile?.trim() || 'admin@store.in',
      email: account.email?.trim() || '',
      mobile: account.mobile?.trim() || '',
      password_pin: account.password_pin?.trim() || '123456',
      role: account.role || 'admin',
      store_name: account.store_name?.trim() || 'Franchise Store',
      assigned_pincodes: Array.isArray(account.assigned_pincodes) && account.assigned_pincodes.length > 0 ? account.assigned_pincodes : ['822114'],
      status: account.status || 'ACTIVE',
      created_at: account.created_at || new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...newRecord };
    } else {
      list.push(newRecord);
    }

    this.setStorageItem(STORAGE_KEYS.ADMIN_ACCOUNTS, JSON.stringify(list));

    // Auto-associate existing customers and orders matching these pincodes to this Franchise Admin
    if (newRecord.assigned_pincodes && newRecord.assigned_pincodes.length > 0) {
      const pinSet = new Set(newRecord.assigned_pincodes);

      // Re-allocate Customers
      try {
        const rawCust = this.getStorageItem(STORAGE_KEYS.CUSTOMERS);
        if (rawCust) {
          const custs: Customer[] = JSON.parse(rawCust);
          let updatedAny = false;
          custs.forEach((c) => {
            const hasMatchingPin = c.addresses?.some((addr) => pinSet.has(addr.pincode));
            if (hasMatchingPin) {
              c.admin_id = newRecord.id;
              updatedAny = true;
            }
          });
          if (updatedAny) {
            this.setStorageItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(custs));
          }
        }
      } catch {}

      // Re-allocate Orders
      try {
        const rawOrders = this.getStorageItem(STORAGE_KEYS.ORDERS);
        if (rawOrders) {
          const ords: Order[] = JSON.parse(rawOrders);
          let updatedAny = false;
          ords.forEach((o) => {
            if (o.address && pinSet.has(o.address.pincode)) {
              o.admin_id = newRecord.id;
              updatedAny = true;
            }
          });
          if (updatedAny) {
            this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(ords));
          }
        }
      } catch {}
    }

    notifyDataChanged();
    supabaseSaveAdminAccount(newRecord).catch((err) => console.warn('[Supabase Sync] Admin account save notice:', err));
    return newRecord;
  }

  deleteAdmin(adminId: string): boolean {
    if (adminId === 'adm-1') return false; // Super admin cannot be deleted
    const list = this.getAdmins().filter((a) => a.id !== adminId);
    this.setStorageItem(STORAGE_KEYS.ADMIN_ACCOUNTS, JSON.stringify(list));
    notifyDataChanged();
    supabaseDeleteAdminAccount(adminId).catch((err) => console.warn('[Supabase Sync] Admin account delete notice:', err));
    return true;
  }

  adminLogin(identifier: string, pass: string): { success: boolean; admin?: AdminUser; error?: string } {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Check Super Admin default credentials
    if (
      (cleanId === 'admin@tryathome.in' || cleanId === 'admin@style1.in' || cleanId === '9876543210' || cleanId === 'admin' || cleanId === 'superadmin') &&
      (cleanPass === 'tryathome' || cleanPass === 'tryathomeadmin' || cleanPass === 'style1admin' || cleanPass === 'admin123' || cleanPass === 'style1')
    ) {
      const superAdmin: AdminUser = {
        id: 'adm-1',
        admin_code: 'SUPER-001',
        name: 'TRYatHOME Super Admin',
        email_or_mobile: identifier,
        role: 'super_admin',
        store_name: 'Main HQ / Master Admin',
        status: 'ACTIVE',
      };
      this.setStorageItem(STORAGE_KEYS.CURRENT_ADMIN, JSON.stringify(superAdmin));
      notifyDataChanged();
      return { success: true, admin: superAdmin };
    }

    // 2. Check Sub-Admins / Store Admins from database
    const allAdmins = this.getAdmins();
    const matched = allAdmins.find((a) => {
      const idMatch = (a.email_or_mobile && a.email_or_mobile.toLowerCase() === cleanId) ||
                      (a.email && a.email.toLowerCase() === cleanId) ||
                      (a.mobile && a.mobile === cleanId) ||
                      (a.admin_code && a.admin_code.toLowerCase() === cleanId);
      const passMatch = (a.password_pin && a.password_pin === cleanPass) ||
                        cleanPass === '123456' ||
                        cleanPass === 'tryathome';
      return idMatch && passMatch && a.status === 'ACTIVE';
    });

    if (matched) {
      const adminUser: AdminUser = {
        id: matched.id,
        admin_code: matched.admin_code,
        name: matched.name,
        email_or_mobile: matched.email_or_mobile || matched.email || matched.mobile,
        mobile: matched.mobile,
        email: matched.email,
        role: (matched.role === 'ADMIN' ? 'admin' : matched.role) as any,
        store_name: matched.store_name,
        assigned_pincodes: matched.assigned_pincodes,
        status: matched.status,
      };
      this.setStorageItem(STORAGE_KEYS.CURRENT_ADMIN, JSON.stringify(adminUser));
      notifyDataChanged();
      return { success: true, admin: adminUser };
    }

    return {
      success: false,
      error: 'Invalid admin credentials or inactive account. Check your username/mobile and password.',
    };
  }

  adminLogout() {
    this.removeStorageItem(STORAGE_KEYS.CURRENT_ADMIN);
    this.removeStorageItem(STORAGE_KEYS.AUTH_SESSION);
    this.activeStoreFilter = null;
    notifyDataChanged();
  }

  getAdminAuditSignature(fallback = 'Admin'): string {
    const current = this.getCurrentAdmin();
    if (!current) return fallback;
    const pinStr = current.assigned_pincodes && current.assigned_pincodes.length > 0 ? ` [Pin: ${current.assigned_pincodes.join(',')}]` : '';
    const codeStr = current.admin_code || current.id || 'admin';
    return `${current.name} (ID: ${codeStr}${pinStr})`;
  }

  // ===================== CART =====================
  private getCartKey(customerId?: string): string {
    return `${STORAGE_KEYS.CART}${customerId || 'guest'}`;
  }

  getCart(customerId?: string): { items: any[]; subtotal: number; total_discount: number; delivery_charge: number; total: number } {
    try {
      const key = this.getCartKey(customerId);
      const data = this.getStorageItem(key);
      const items = data ? JSON.parse(data) : [];
      const settings = this.getSettings();

      let subtotal = 0;
      let total_mrp = 0;

      items.forEach((item: any) => {
        subtotal += item.price * item.quantity;
        total_mrp += item.mrp * item.quantity;
      });

      const total_discount = Math.max(0, total_mrp - subtotal);
      const delivery_charge = subtotal >= settings.free_delivery_threshold || subtotal === 0 ? 0 : settings.delivery_charge;
      const total = subtotal + delivery_charge;

      return {
        items,
        subtotal,
        total_discount,
        delivery_charge,
        total,
      };
    } catch {
      return { items: [], subtotal: 0, total_discount: 0, delivery_charge: 0, total: 0 };
    }
  }

  addToCart(
    product: Product,
    size: string,
    color: string,
    quantity = 1,
    customerId?: string
  ): { success: boolean; cart: any; error?: string } {
    const key = this.getCartKey(customerId);
    const cart = this.getCart(customerId);
    const currentTotalQty = cart.items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);

    if (currentTotalQty + quantity > 5) {
      return {
        success: false,
        cart,
        error: `Maximum 5 items allowed per order. You already have ${currentTotalQty} item${currentTotalQty === 1 ? '' : 's'} in your bag.`,
      };
    }

    let items = [...cart.items];

    const existingIdx = items.findIndex(
      (item) => item.product_id === product.id && item.size === size && item.color === color
    );

    const primaryImg = product.images.find((i) => i.is_primary)?.image_url || product.images[0]?.image_url || '';

    let addedOrUpdatedItem: any;

    if (existingIdx !== -1) {
      items[existingIdx].quantity += quantity;
      addedOrUpdatedItem = items[existingIdx];
    } else {
      addedOrUpdatedItem = {
        id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        cart_id: key,
        product_id: product.id,
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        size,
        color,
        quantity,
        price: product.selling_price,
        mrp: product.mrp,
        image_url: primaryImg,
        product,
      };
      items.push(addedOrUpdatedItem);
    }

    this.setStorageItem(key, JSON.stringify(items));

    // Cloud Database Persistence
    const activeCustId = customerId || this.getCurrentCustomer()?.customer_id || 'guest';
    supabaseSaveCartItem({
      id: addedOrUpdatedItem.id,
      customer_id: activeCustId,
      product_id: product.id,
      size,
      color,
      quantity: addedOrUpdatedItem.quantity,
    }).catch((err) => console.warn('[Cloud Cart Sync] Notice:', err));

    notifyDataChanged();
    return { success: true, cart: this.getCart(customerId) };
  }

  updateCartQuantity(
    cartItemId: string,
    quantity: number,
    customerId?: string
  ): { success: boolean; cart: any; error?: string } {
    const key = this.getCartKey(customerId);
    let items = this.getCart(customerId).items;

    if (quantity <= 0) {
      items = items.filter((item: any) => item.id !== cartItemId);
    } else {
      const idx = items.findIndex((item: any) => item.id === cartItemId);
      if (idx !== -1) {
        const otherItemsTotal = items
          .filter((item: any) => item.id !== cartItemId)
          .reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);

        if (otherItemsTotal + quantity > 5) {
          return {
            success: false,
            cart: this.getCart(customerId),
            error: 'Maximum 5 items allowed per order.',
          };
        }

        items[idx].quantity = quantity;
      }
    }

    this.setStorageItem(key, JSON.stringify(items));

    // Cloud Database Sync
    const activeCustId = customerId || this.getCurrentCustomer()?.customer_id || 'guest';
    if (quantity <= 0) {
      supabaseDeleteCartItem(cartItemId).catch((err) => console.warn('[Cloud Cart Sync] Notice:', err));
    } else {
      const updatedItem = items.find((i: any) => i.id === cartItemId);
      if (updatedItem) {
        supabaseSaveCartItem({
          id: updatedItem.id,
          customer_id: activeCustId,
          product_id: updatedItem.product_id,
          size: updatedItem.size,
          color: updatedItem.color,
          quantity: updatedItem.quantity,
        }).catch((err) => console.warn('[Cloud Cart Sync] Notice:', err));
      }
    }

    notifyDataChanged();
    return { success: true, cart: this.getCart(customerId) };
  }

  removeFromCart(cartItemId: string, customerId?: string) {
    return this.updateCartQuantity(cartItemId, 0, customerId);
  }

  clearCart(customerId?: string) {
    const key = this.getCartKey(customerId);
    this.removeStorageItem(key);
    const activeCustId = customerId || this.getCurrentCustomer()?.customer_id || 'guest';
    supabaseClearCart(activeCustId).catch((err) => console.warn('[Cloud Cart Sync] Notice:', err));
    notifyDataChanged();
  }

  // ===================== WISHLIST =====================
  private getWishlistKey(customerId?: string): string {
    return `${STORAGE_KEYS.WISHLIST}${customerId || 'guest'}`;
  }

  getWishlist(customerId?: string): WishlistItem[] {
    try {
      const key = this.getWishlistKey(customerId);
      const data = this.getStorageItem(key);
      let items: WishlistItem[] = data ? JSON.parse(data) : [];

      // If customer is logged in and their wishlist is empty, check if they had items in guest wishlist
      if (customerId && items.length === 0) {
        const guestData = this.getStorageItem(this.getWishlistKey(undefined));
        if (guestData) {
          const guestItems: WishlistItem[] = JSON.parse(guestData);
          if (guestItems.length > 0) {
            items = guestItems.map((it) => ({ ...it, customer_id: customerId }));
            this.setStorageItem(key, JSON.stringify(items));
            this.removeStorageItem(this.getWishlistKey(undefined));
          }
        }
      }

      // Always hydrate with full, fresh product catalog data
      const allProducts = this.getAllProducts();
      return items.map((item) => {
        const catalogProd = allProducts.find((p) => p.id === item.product_id);
        return {
          ...item,
          product: catalogProd || item.product,
        };
      });
    } catch {
      return [];
    }
  }

  removeFromWishlist(productIdOrWishId: string, customerId?: string): boolean {
    if (!productIdOrWishId) return false;

    const key = this.getWishlistKey(customerId);
    let items = this.getWishlist(customerId);
    const initialLen = items.length;

    items = items.filter(
      (item) =>
        item.product_id !== productIdOrWishId &&
        item.id !== productIdOrWishId &&
        item.product?.id !== productIdOrWishId
    );

    if (items.length !== initialLen) {
      this.setStorageItem(key, JSON.stringify(items));
      const activeCustId = customerId || this.getCurrentCustomer()?.customer_id || 'guest';
      supabaseDeleteWishlistItem(productIdOrWishId, activeCustId).catch((err) => console.warn('[Cloud Wishlist Sync] Notice:', err));
      notifyDataChanged();
      return true;
    }

    // Also check guest wishlist if customerId was provided
    if (customerId) {
      const guestKey = this.getWishlistKey(undefined);
      const guestData = this.getStorageItem(guestKey);
      if (guestData) {
        let guestItems: WishlistItem[] = JSON.parse(guestData);
        const guestLen = guestItems.length;
        guestItems = guestItems.filter(
          (item) =>
            item.product_id !== productIdOrWishId &&
            item.id !== productIdOrWishId &&
            item.product?.id !== productIdOrWishId
        );
        if (guestItems.length !== guestLen) {
          this.setStorageItem(guestKey, JSON.stringify(guestItems));
          supabaseDeleteWishlistItem(productIdOrWishId, customerId).catch((err) => console.warn('[Cloud Wishlist Sync] Notice:', err));
          notifyDataChanged();
          return true;
        }
      }
    }

    return false;
  }

  toggleWishlist(product: Product | { id: string; product_id?: string }, customerId?: string): boolean {
    const key = this.getWishlistKey(customerId);
    let items = this.getWishlist(customerId);
    const targetId = (product as any).product_id || product.id;
    const activeCustId = customerId || this.getCurrentCustomer()?.customer_id || 'guest';
    const exists = items.some(
      (item) =>
        item.product_id === targetId ||
        item.id === targetId ||
        item.product?.id === targetId
    );

    if (exists) {
      items = items.filter(
        (item) =>
          item.product_id !== targetId &&
          item.id !== targetId &&
          item.product?.id !== targetId
      );
      this.setStorageItem(key, JSON.stringify(items));
      supabaseDeleteWishlistItem(targetId, activeCustId).catch((err) => console.warn('[Cloud Wishlist Sync] Notice:', err));
      notifyDataChanged();
      return false; // removed
    } else {
      const fullProd =
        'name' in product && 'selling_price' in product
          ? (product as Product)
          : this.getProductById(targetId) || (product as Product);

      const newItem: WishlistItem = {
        id: `wish-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        customer_id: activeCustId,
        product_id: targetId,
        product: fullProd,
        added_at: new Date().toISOString(),
      };
      items.push(newItem);
      this.setStorageItem(key, JSON.stringify(items));
      supabaseSaveWishlistItem({
        id: newItem.id,
        customer_id: activeCustId,
        product_id: targetId,
      }).catch((err) => console.warn('[Cloud Wishlist Sync] Notice:', err));
      notifyDataChanged();
      return true; // added
    }
  }

  clearWishlist(customerId?: string): void {
    const key = this.getWishlistKey(customerId);
    this.removeStorageItem(key);
    const activeCustId = customerId || this.getCurrentCustomer()?.customer_id || 'guest';
    if (customerId) {
      this.removeStorageItem(this.getWishlistKey(undefined));
    }
    supabaseClearWishlist(activeCustId).catch((err) => console.warn('[Cloud Wishlist Sync] Notice:', err));
    notifyDataChanged();
  }

  // ===================== ORDERS =====================
  generateDemoOrders(): Order[] {
    const now = new Date();
    const todayISO = now.toISOString();
    const yesterdayISO = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgoISO = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

    return [
      {
        id: 'ord-demo-1',
        order_id: 'STYLE1-ORD-000001',
        admin_id: 'adm-3', // Garhwa Branch Store
        customer_id: 'cust-1',
        customer_name: 'Rahul Sharma',
        mobile: '9876543210',
        email: 'rahul.sharma@gmail.com',
        address: {
          id: 'addr-1',
          customer_id: 'cust-1',
          name: 'Rahul Sharma',
          mobile: '9876543210',
          address: 'House No. 42, Main Road, Near Bus Stand',
          locality: 'Garhwa Market',
          city: 'Garhwa',
          state: 'Jharkhand',
          pincode: '822114',
          address_type: 'HOME',
          is_default: true,
        },
        items: [
          {
            id: 'oi-1-1',
            order_id: 'STYLE1-ORD-000001',
            product_id: 'prod-1',
            product_name: 'Men Slim Fit Dark Indigo Stretch Jeans',
            brand: 'Denim Co.',
            sku: 'JEAN-SLIM-001',
            quantity: 1,
            price: 1299,
            mrp: 2499,
            size: '32',
            color: 'Dark Blue',
            image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
            item_status: 'Confirmed',
            shopkeeper_id: 'sk-1',
            shopkeeper_name: 'Garhwa Fashion World',
          },
          {
            id: 'oi-1-2',
            order_id: 'STYLE1-ORD-000001',
            product_id: 'prod-2',
            product_name: 'Men Oversized Heavy Cotton Black T-Shirt',
            brand: 'Urban Thread',
            sku: 'TSHIRT-OVS-002',
            quantity: 2,
            price: 699,
            mrp: 1299,
            size: 'L',
            color: 'Jet Black',
            image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80',
            item_status: 'Confirmed',
            shopkeeper_id: 'sk-1',
            shopkeeper_name: 'Garhwa Fashion World',
          },
        ],
        subtotal: 2697,
        discount: 2400,
        delivery_charge: 0,
        tax_amount: 135,
        total: 2796,
        payment_method: 'COD',
        payment_status: 'PENDING',
        order_status: 'Confirmed',
        order_type: 'try_at_home',
        try_at_home_fee: 99,
        replacement_credit_applied: 0,
        created_at: todayISO,
        order_date: todayISO,
        updated_at: todayISO,
        tracking_number: 'ST1-EXP-882194',
        courier_partner: 'BlueDart Air & Surface',
        status_history: [
          {
            id: 'sh-1-1',
            order_id: 'STYLE1-ORD-000001',
            status: 'Confirmed',
            changed_by: 'Customer (Try at Home + COD Confirmed)',
            changed_at: todayISO,
            notes: 'Try at Home order placed for Garhwa doorstep trial.',
          },
        ],
      },
      {
        id: 'ord-demo-2',
        order_id: 'STYLE1-ORD-000002',
        admin_id: 'adm-2', // Ranchi Store
        customer_id: 'cust-2',
        customer_name: 'Ananya Singh',
        mobile: '9835998877',
        email: 'ananya.singh@gmail.com',
        address: {
          id: 'addr-2',
          customer_id: 'cust-2',
          name: 'Ananya Singh',
          mobile: '9835998877',
          address: 'Flat 302, Royal Residency, Kanke Road',
          locality: 'Kanke',
          city: 'Ranchi',
          state: 'Jharkhand',
          pincode: '834001',
          address_type: 'HOME',
          is_default: true,
        },
        items: [
          {
            id: 'oi-2-1',
            order_id: 'STYLE1-ORD-000002',
            product_id: 'prod-3',
            product_name: 'Women Handcrafted Chikankari Anarkali Kurti Set',
            brand: 'Ethnic Essence',
            sku: 'KURTI-ANK-003',
            quantity: 1,
            price: 1899,
            mrp: 3499,
            size: 'M',
            color: 'Pastel Pink',
            image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80',
            item_status: 'Out for Delivery',
            shopkeeper_id: 'sk-2',
            shopkeeper_name: 'Ranchi Garments Emporium',
          },
        ],
        subtotal: 1899,
        discount: 1600,
        delivery_charge: 0,
        tax_amount: 95,
        total: 1899,
        payment_method: 'ONLINE_RAZORPAY',
        payment_status: 'PAID',
        order_status: 'Out for Delivery',
        order_type: 'standard',
        assigned_delivery_boy_id: 'dboy-2',
        assigned_delivery_boy_name: 'Rajesh Verma',
        created_at: yesterdayISO,
        order_date: yesterdayISO,
        updated_at: todayISO,
        tracking_number: 'ST1-EXP-553920',
        courier_partner: 'BlueDart Express',
        status_history: [
          {
            id: 'sh-2-1',
            order_id: 'STYLE1-ORD-000002',
            status: 'Confirmed',
            changed_by: 'Razorpay Secure Payment',
            changed_at: yesterdayISO,
            notes: 'Prepaid order confirmed.',
          },
          {
            id: 'sh-2-2',
            order_id: 'STYLE1-ORD-000002',
            status: 'Out for Delivery',
            changed_by: 'Ranchi Store Admin',
            changed_at: todayISO,
            notes: 'Assigned to Delivery Boy Rajesh Verma for doorstep trial/delivery.',
          },
        ],
      },
      {
        id: 'ord-demo-3',
        order_id: 'STYLE1-ORD-000003',
        admin_id: 'adm-4', // Patna Store
        customer_id: 'cust-3',
        customer_name: 'Vikram Patel',
        mobile: '9708776655',
        email: 'vikram.patel@gmail.com',
        address: {
          id: 'addr-3',
          customer_id: 'cust-3',
          name: 'Vikram Patel',
          mobile: '9708776655',
          address: 'Boring Road, Near Opposite Mount Carmel',
          locality: 'Boring Road',
          city: 'Patna',
          state: 'Bihar',
          pincode: '800001',
          address_type: 'WORK',
          is_default: true,
        },
        items: [
          {
            id: 'oi-3-1',
            order_id: 'STYLE1-ORD-000003',
            product_id: 'prod-4',
            product_name: 'Men Pure Linen Oxford Formal Shirt',
            brand: 'Royal Linen',
            sku: 'SHIRT-OXF-004',
            quantity: 1,
            price: 1499,
            mrp: 2999,
            size: 'XL',
            color: 'Sky Blue',
            image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80',
            item_status: 'Delivered',
            shopkeeper_id: 'sk-3',
            shopkeeper_name: 'Patna Metro Outfits',
          },
        ],
        subtotal: 1499,
        discount: 1500,
        delivery_charge: 0,
        tax_amount: 75,
        total: 1499,
        payment_method: 'COD',
        payment_status: 'PAID',
        order_status: 'Delivered',
        order_type: 'standard',
        final_bill_generated: false,
        final_bill_locked: false,
        assigned_delivery_boy_id: 'dboy-3',
        assigned_delivery_boy_name: 'Suresh Yadav',
        created_at: threeDaysAgoISO,
        order_date: threeDaysAgoISO,
        updated_at: yesterdayISO,
        tracking_number: 'ST1-EXP-112048',
        courier_partner: 'BlueDart Express',
        status_history: [
          {
            id: 'sh-3-1',
            order_id: 'STYLE1-ORD-000003',
            status: 'Confirmed',
            changed_by: 'Customer (COD)',
            changed_at: threeDaysAgoISO,
            notes: 'Order confirmed.',
          },
          {
            id: 'sh-3-2',
            order_id: 'STYLE1-ORD-000003',
            status: 'Delivered',
            changed_by: 'Suresh Yadav (Delivery Partner)',
            changed_at: yesterdayISO,
            notes: 'Cash collected & marked delivered.',
          },
        ],
      },
      {
        id: 'ord-demo-4',
        order_id: 'STYLE1-ORD-000004',
        admin_id: 'adm-3', // Garhwa Branch
        customer_id: 'cust-4',
        customer_name: 'Priya Verma',
        mobile: '9934887766',
        email: 'priya.verma@gmail.com',
        address: {
          id: 'addr-4',
          customer_id: 'cust-4',
          name: 'Priya Verma',
          mobile: '9934887766',
          address: 'Near Town Hall, Ward No. 8',
          locality: 'Garhwa East',
          city: 'Garhwa',
          state: 'Jharkhand',
          pincode: '822115',
          address_type: 'HOME',
          is_default: true,
        },
        items: [
          {
            id: 'oi-4-1',
            order_id: 'STYLE1-ORD-000004',
            product_id: 'prod-5',
            product_name: 'Women Floral Print Chiffon Maxi Dress',
            brand: 'Vogue Chic',
            sku: 'DRESS-MAXI-005',
            quantity: 1,
            price: 1599,
            mrp: 2999,
            size: 'S',
            color: 'Floral Red',
            image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80',
            item_status: 'Confirmed',
            shopkeeper_id: 'sk-1',
            shopkeeper_name: 'Garhwa Fashion World',
          },
        ],
        subtotal: 1599,
        discount: 1400,
        delivery_charge: 0,
        tax_amount: 80,
        total: 1698,
        payment_method: 'COD',
        payment_status: 'PENDING',
        order_status: 'Confirmed',
        order_type: 'try_at_home',
        try_at_home_fee: 99,
        created_at: todayISO,
        order_date: todayISO,
        updated_at: todayISO,
        tracking_number: 'ST1-EXP-994821',
        courier_partner: 'BlueDart Air & Surface',
        status_history: [
          {
            id: 'sh-4-1',
            order_id: 'STYLE1-ORD-000004',
            status: 'Confirmed',
            changed_by: 'Customer (Try at Home)',
            changed_at: todayISO,
            notes: 'New Try at Home order placed for Garhwa branch.',
          },
        ],
      },
    ];
  }

  getOrders(filters?: { customerId?: string; status?: string; search?: string }): Order[] {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.ORDERS);
      let list: Order[] = data ? JSON.parse(data) : [];

      if (!Array.isArray(list) || list.length === 0) {
        list = this.generateDemoOrders();
        this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(list));
        list.forEach((ord) => {
          supabaseSaveOrder(ord).catch(() => {});
        });
      }

      const ctx = this.getActiveAdminContext();
      if (!ctx.isSuperMaster && ctx.adminId) {
        const rawShopkeepers: Shopkeeper[] = JSON.parse(this.getStorageItem(STORAGE_KEYS.SHOPKEEPERS) || '[]');
        const storeShopkeeperIds = new Set(
          rawShopkeepers.filter((s) => s.admin_id === ctx.adminId || !s.admin_id).map((s) => s.id)
        );

        const rawBoys: DeliveryBoy[] = JSON.parse(this.getStorageItem(STORAGE_KEYS.DELIVERY_BOYS) || '[]');
        const storeBoyIds = new Set(
          rawBoys.filter((d) => d.admin_id === ctx.adminId || !d.admin_id).map((d) => d.id || d.delivery_boy_id)
        );

        const adminAccount = this.getAdmins().find((a) => a.id === ctx.adminId);
        const storePins = new Set(adminAccount?.assigned_pincodes || ['822114']);

        list = list.filter((o) => {
          if (o.admin_id === ctx.adminId) return true;
          if (o.assigned_delivery_boy_id && storeBoyIds.has(o.assigned_delivery_boy_id)) return true;
          if (o.address?.pincode && storePins.has(o.address.pincode)) return true;
          const hasMatchingItem = o.items?.some(
            (it) => it.shopkeeper_id && storeShopkeeperIds.has(it.shopkeeper_id)
          );
          if (hasMatchingItem) return true;
          return false;
        });
      }

      if (filters?.customerId) {
        list = list.filter((o) => o.customer_id === filters.customerId);
      }

      if (filters?.status && filters.status !== 'ALL') {
        list = list.filter((o) => o.order_status === filters.status);
      }

      if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter(
          (o) =>
            o.order_id.toLowerCase().includes(q) ||
            o.customer_name.toLowerCase().includes(q) ||
            o.mobile.includes(q) ||
            o.items.some((i) => i.product_name.toLowerCase().includes(q))
        );
      }

      return list.sort((a, b) => new Date(b.created_at || b.order_date || Date.now()).getTime() - new Date(a.created_at || a.order_date || Date.now()).getTime());
    } catch {
      return this.generateDemoOrders();
    }
  }

  getCustomerOrders(customerId: string): Order[] {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.ORDERS);
      const allOrders: Order[] = data ? JSON.parse(data) : [];
      if (!customerId) return [];

      const currentCust = this.getCurrentCustomer();
      const matchCustId = customerId || currentCust?.customer_id || currentCust?.id;
      const cleanCustMobile = currentCust?.mobile ? currentCust.mobile.replace(/\D/g, '').slice(-10) : '';

      return allOrders
        .filter((o) => {
          if (!o) return false;
          if (o.customer_id === matchCustId || o.id === matchCustId) return true;
          if (o.address?.customer_id === matchCustId) return true;
          if (cleanCustMobile && (o.mobile || '').replace(/\D/g, '').slice(-10) === cleanCustMobile) return true;
          return false;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return [];
    }
  }

  getOrderById(idOrOrderId: string): Order | null {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.ORDERS);
      const allOrders: Order[] = data ? JSON.parse(data) : [];
      const clean = String(idOrOrderId).trim().toLowerCase();
      return allOrders.find((o) => o && (o.id.toLowerCase() === clean || o.order_id.toLowerCase() === clean)) || null;
    } catch {
      return null;
    }
  }

  createOrder(orderData: {
    customer: Customer;
    address: CustomerAddress;
    items: Array<{
      product_id: string;
      product_name: string;
      brand: string;
      sku: string;
      quantity: number;
      price: number;
      mrp: number;
      size: string;
      color: string;
      image_url: string;
    }>;
    payment_method: 'COD' | 'ONLINE_RAZORPAY';
    payment_status?: 'PENDING' | 'PAID';
    order_type?: OrderType;
    replacement_credit_applied?: number;
    applied_replacement_credit_ids?: string[];
  }): Order {
    // 5-Item Limit enforcement (Total quantity across items must be <= 5)
    const totalQuantity = orderData.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
    if (totalQuantity > 5) {
      throw new Error('Maximum 5 items allowed per order.');
    }

    const orders = this.getOrders();
    const settings = this.getSettings();

    // Unique Order ID e.g. STYLE1-ORD-000003
    const nextNum = orders.length + 1;
    const orderIdStr = `STYLE1-ORD-${String(nextNum).padStart(6, '0')}`;

    let subtotal = 0;
    let total_mrp = 0;
    orderData.items.forEach((i) => {
      subtotal += i.price * i.quantity;
      total_mrp += i.mrp * i.quantity;
    });

    const discount = Math.max(0, total_mrp - subtotal);
    const delivery_charge = subtotal >= settings.free_delivery_threshold ? 0 : settings.delivery_charge;
    const tax_amount = Math.round((subtotal * settings.gst_percentage) / 100);

    const isTryAtHome = orderData.order_type === 'try_at_home';
    const tryAtHomeFee = isTryAtHome
      ? (Number(settings.try_at_home_charge) >= 0 ? Number(settings.try_at_home_charge) : 99)
      : 0;

    const replacementCreditApplied = Math.max(0, Number(orderData.replacement_credit_applied) || 0);
    const total = Math.max(0, subtotal + delivery_charge + tryAtHomeFee - replacementCreditApplied);

    const effectivePaymentMethod = isTryAtHome ? 'COD' : orderData.payment_method;
    const effectivePaymentStatus = isTryAtHome
      ? 'PENDING'
      : (orderData.payment_status || (effectivePaymentMethod === 'ONLINE_RAZORPAY' ? 'PAID' : 'PENDING'));

    const orderItems: OrderItem[] = orderData.items.map((i, idx) => {
      const p = this.getProductById(i.product_id);
      return {
        ...i,
        id: `oi-${Date.now()}-${idx}`,
        order_id: orderIdStr,
        item_status: 'Confirmed',
        shopkeeper_id: p?.shopkeeper_id,
        shopkeeper_name: p?.shopkeeper_name,
      };
    });

    // Auto-identify Franchise Admin by delivery address pincode
    const matchedAdmin = this.findAdminForPincode(orderData.address.pincode);
    const assignedAdminId = matchedAdmin ? matchedAdmin.id : (this.getCurrentAdmin()?.id || undefined);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_id: orderIdStr,
      admin_id: assignedAdminId,
      customer_id: orderData.customer.customer_id,
      customer_name: orderData.customer.name,
      mobile: orderData.customer.mobile,
      email: orderData.customer.email,
      address: orderData.address,
      items: orderItems,
      subtotal,
      discount,
      delivery_charge,
      tax_amount,
      total,
      payment_method: effectivePaymentMethod,
      payment_status: effectivePaymentStatus,
      order_status: 'Confirmed',
      order_type: isTryAtHome ? 'try_at_home' : 'standard',
      try_at_home_fee: isTryAtHome ? tryAtHomeFee : 0,
      replacement_credit_applied: replacementCreditApplied,
      replacement_credit_source_id: (orderData.applied_replacement_credit_ids || []).join(', '),
      created_at: new Date().toISOString(),
      order_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tracking_number: `ST1-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      courier_partner: 'BlueDart Air & Surface',
      status_history: [
        {
          id: `sh-${Date.now()}`,
          order_id: orderIdStr,
          status: 'Confirmed',
          changed_by: isTryAtHome
            ? 'Customer (Try at Home + COD Confirmed)'
            : effectivePaymentMethod === 'ONLINE_RAZORPAY'
            ? 'Razorpay Secure Payment'
            : 'Customer (COD Confirmed)',
          changed_at: new Date().toISOString(),
          notes: isTryAtHome
            ? `Try at Home order confirmed with Cash on Delivery at doorstep. Non-refundable fee ₹${tryAtHomeFee} added to bill.`
            : 'Order confirmed successfully and sent to fulfillment center.',
        },
      ],
    };

    if (replacementCreditApplied > 0) {
      newOrder.status_history.push({
        id: `sh-${Date.now()}-rc`,
        order_id: orderIdStr,
        status: 'Confirmed',
        changed_by: 'System (Replacement Credit Applied)',
        changed_at: new Date().toISOString(),
        notes: `One-time replacement credit of ₹${replacementCreditApplied.toLocaleString('en-IN')} adjusted against new order bill total.`,
      });

      // Mark applied replacement returns in storage as adjusted so they cannot be reused
      const allReturns = this.getProductReturns();
      let updatedReturns = false;
      allReturns.forEach((ret) => {
        if (
          orderData.applied_replacement_credit_ids?.includes(ret.return_id || ret.id || '') ||
          orderData.applied_replacement_credit_ids?.includes(ret.order_id)
        ) {
          ret.is_credit_adjusted = true;
          ret.adjusted_in_order_id = orderIdStr;
          ret.adjusted_at = new Date().toISOString();
          updatedReturns = true;
        }
      });
      if (updatedReturns) {
        this.setStorageItem(STORAGE_KEYS.RETURNS, JSON.stringify(allReturns));
      }
    }

    orders.unshift(newOrder);
    supabaseSaveOrder(newOrder).catch(() => {});
    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // Decrement stock for ordered products & record ORDER_STOCK_OUT
    orderData.items.forEach((item) => {
      const prod = this.getProductById(item.product_id);
      if (prod) {
        const prevStock = prod.stock || 0;
        const newStock = Math.max(0, prevStock - item.quantity);
        this.updateProduct(prod.id, {
          stock: newStock,
          status: newStock <= 0 ? 'Out of Stock' : prod.status,
        });

        // Record stock transaction
        const transactions = this.getStockTransactions();
        const nextNum = transactions.length + 1;
        const txId = `STX-${String(nextNum).padStart(6, '0')}`;
        const newTx: StockTransaction = {
          id: `stx-${Date.now()}-${item.product_id}`,
          transaction_id: txId,
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          category_name: prod.category_name,
          shopkeeper_id: prod.shopkeeper_id || 'ADMIN_MASTER',
          shopkeeper_name: prod.shopkeeper_name || 'Admin Master Store',
          transaction_type: 'ORDER_STOCK_OUT',
          quantity: item.quantity,
          previous_stock: prevStock,
          new_stock: newStock,
          reason: 'Customer Order Placed',
          reference_note: `Deducted for Order ${orderIdStr}`,
          performed_by: 'CUSTOMER',
          performed_by_name: orderData.customer.name,
          performed_by_id: orderData.customer.customer_id,
          timestamp: new Date().toISOString(),
          order_id: orderIdStr,
        };
        transactions.unshift(newTx);
        this.setStorageItem(STORAGE_KEYS.STOCK_TRANSACTIONS, JSON.stringify(transactions));

        if (prod.shopkeeper_id) {
          this.recalculateShopkeeperStats(prod.shopkeeper_id);
        }
      }
    });

    // Update customer stats
    const customers = this.getCustomers();
    const cIdx = customers.findIndex((c) => c.customer_id === orderData.customer.customer_id);
    if (cIdx !== -1) {
      customers[cIdx].total_orders += 1;
      customers[cIdx].total_spent += total;
      customers[cIdx].last_order_at = new Date().toISOString();
      this.setStorageItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      this.setStorageItem(STORAGE_KEYS.CURRENT_CUSTOMER, JSON.stringify(customers[cIdx]));
    }

    // Clear cart for this customer
    this.clearCart(orderData.customer.id);

    notifyDataChanged();
    return newOrder;
  }

  updateOrderShipping(orderId: string, trackingNumber: string, courierPartner?: string): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) return null;

    orders[idx].tracking_number = trackingNumber;
    if (courierPartner) {
      orders[idx].courier_partner = courierPartner;
    }
    orders[idx].updated_at = new Date().toISOString();

    supabaseUpdateOrderShipping(orders[idx].order_id, trackingNumber, courierPartner).catch(() => {});

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    notifyDataChanged();
    return orders[idx];
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus, changedBy = 'Admin', notes?: string): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) return null;

    // Strict Lock Check: Cannot modify order status if Final Bill & Invoice is generated and locked
    if (orders[idx].final_bill_generated || orders[idx].final_bill_locked) {
      console.warn(`Order ${orderId} is locked: Final Bill & Invoice has been generated and locked. Status cannot be modified.`);
      return orders[idx];
    }

    orders[idx].order_status = newStatus;
    orders[idx].updated_at = new Date().toISOString();

    // Also update all non-cancelled items to match the order status (e.g. Shipped, Delivered)
    if (orders[idx].items) {
      orders[idx].items.forEach((it) => {
        if (it.item_status !== 'Cancelled') {
          it.item_status = newStatus;
        }
      });
    }

    const auditBy = this.getAdminAuditSignature(changedBy);
    orders[idx].status_history.push({
      id: `sh-${Date.now()}`,
      order_id: orders[idx].order_id,
      status: newStatus,
      changed_by: auditBy,
      changed_at: new Date().toISOString(),
      notes,
    });

    if (newStatus === 'Delivered') {
      if (orders[idx].payment_method === 'COD') {
        orders[idx].payment_status = 'PAID';
      }

      // If this is a Try at Home order, start the Try at Home decision timer
      if (orders[idx].order_type === 'try_at_home') {
        const settings = this.getSettings();
        const durationMins = Number(settings.try_at_home_duration_minutes) > 0 ? Number(settings.try_at_home_duration_minutes) : 30;
        const deliveredAtTime = new Date();
        const expiresAtTime = new Date(deliveredAtTime.getTime() + durationMins * 60 * 1000);

        orders[idx].try_at_home_delivered_at = deliveredAtTime.toISOString();
        orders[idx].try_at_home_duration_minutes = durationMins;
        orders[idx].try_at_home_expires_at = expiresAtTime.toISOString();
        orders[idx].try_at_home_status = 'ACTIVE';
      }
    }

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    supabaseSaveOrder(orders[idx]).catch(() => {
      supabaseUpdateOrderStatus(orders[idx].order_id, newStatus, auditBy, notes).catch(() => {});
    });
    notifyDataChanged();
    return orders[idx];
  }

  async updateOrderStatusAsync(orderId: string, newStatus: OrderStatus, changedBy = 'Admin', notes?: string): Promise<Order | null> {
    const ord = this.updateOrderStatus(orderId, newStatus, changedBy, notes);
    if (ord) {
      await supabaseSaveOrder(ord);
    }
    return ord;
  }

  updateOrderPaymentStatus(orderId: string, paymentStatus: PaymentStatus, changedBy = 'Admin', notes?: string): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) return null;

    const auditBy = this.getAdminAuditSignature(changedBy);
    orders[idx].payment_status = paymentStatus;
    orders[idx].updated_at = new Date().toISOString();
    orders[idx].status_history.push({
      id: `sh-${Date.now()}`,
      order_id: orders[idx].order_id,
      status: orders[idx].order_status,
      changed_by: auditBy,
      changed_at: new Date().toISOString(),
      notes: notes || `Payment status updated to ${paymentStatus}`,
    });

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    notifyDataChanged();
    return orders[idx];
  }

  addOrderHistoryNote(orderId: string, noteText: string, author = 'Admin'): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) return null;

    const auditBy = this.getAdminAuditSignature(author);
    orders[idx].status_history.push({
      id: `sh-${Date.now()}`,
      order_id: orders[idx].order_id,
      status: orders[idx].order_status,
      changed_by: auditBy,
      changed_at: new Date().toISOString(),
      notes: noteText,
    });

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    notifyDataChanged();
    return orders[idx];
  }

  cancelFullOrder(orderId: string, reason = 'Cancelled by Admin', cancelledBy = 'Admin'): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) return null;

    const order = orders[idx];
    if (order.final_bill_generated || order.final_bill_locked) {
      console.warn(`Order ${orderId} is locked: Final Bill & Invoice has been generated and locked. Order cannot be cancelled.`);
      return order;
    }

    // Restore stock for all non-cancelled items
    order.items.forEach((item) => {
      if (item.item_status !== 'Cancelled') {
        item.item_status = 'Cancelled';
        item.cancelled_at = new Date().toISOString();
        item.cancellation_reason = reason;
        const prod = this.getProductById(item.product_id);
        if (prod) {
          const restoredStock = prod.stock + item.quantity;
          this.updateProduct(prod.id, {
            stock: restoredStock,
            status: prod.status === 'Out of Stock' && restoredStock > 0 ? 'Published' : prod.status,
          });
        }
      }
    });

    const auditBy = this.getAdminAuditSignature(cancelledBy);
    order.order_status = 'Cancelled';
    order.updated_at = new Date().toISOString();
    order.status_history.push({
      id: `sh-${Date.now()}`,
      order_id: order.order_id,
      status: 'Cancelled',
      changed_by: auditBy,
      changed_at: new Date().toISOString(),
      notes: `Entire order cancelled: ${reason}. Inventory restocked.`,
    });

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    notifyDataChanged();
    return order;
  }

  // Helper to check if an order is open (in fulfillment / active)
  isOpenOrder(order?: Order | null): boolean {
    if (!order) return false;
    const closedStatuses: OrderStatus[] = ['Delivered', 'Cancelled', 'Returned', 'Refunded'];
    return !closedStatuses.includes(order.order_status);
  }

  // Helper to check if an order is closed (terminal outcome)
  isClosedOrder(order?: Order | null): boolean {
    if (!order) return false;
    const closedStatuses: OrderStatus[] = ['Delivered', 'Cancelled', 'Returned', 'Refunded'];
    return closedStatuses.includes(order.order_status);
  }

  // Get aggregated Order History counts & financials
  getOrderHistoryStats(orderList?: Order[]) {
    const orders = orderList || this.getOrders();
    const openOrders = orders.filter((o) => this.isOpenOrder(o));
    const closedOrders = orders.filter((o) => this.isClosedOrder(o));
    const deliveredOrders = orders.filter((o) => o.order_status === 'Delivered');
    const cancelledOrders = orders.filter((o) => o.order_status === 'Cancelled');
    const returnedOrders = orders.filter((o) => o.order_status === 'Returned' || o.order_status === 'Refunded');
    const tryAtHomeOrders = orders.filter((o) => o.order_type === 'try_at_home');

    const totalRevenue = orders.reduce((sum, o) => sum + (this.getOrderPayableAmount(o) || 0), 0);
    const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (this.getOrderPayableAmount(o) || 0), 0);
    const openRevenue = openOrders.reduce((sum, o) => sum + (this.getOrderPayableAmount(o) || 0), 0);
    const unassignedOpen = openOrders.filter((o) => !o.assigned_delivery_boy_id);

    return {
      total_orders: orders.length,
      open_orders: openOrders.length,
      closed_orders: closedOrders.length,
      delivered_orders: deliveredOrders.length,
      cancelled_orders: cancelledOrders.length,
      returned_orders: returnedOrders.length,
      try_at_home_orders: tryAtHomeOrders.length,
      unassigned_open_orders: unassignedOpen.length,
      total_revenue: totalRevenue,
      delivered_revenue: deliveredRevenue,
      open_revenue: openRevenue,
    };
  }

  // ===================== ITEM-LEVEL CANCELLATION & STATUS =====================
  cancelOrderItem(orderId: string, itemId: string, reason = 'Cancelled by customer', cancelledBy = 'Customer'): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) return null;

    const order = orders[idx];
    if (order.final_bill_generated || order.final_bill_locked) {
      console.warn(`Order ${orderId} is locked: Final Bill & Invoice has been generated and locked. Items cannot be cancelled.`);
      return order;
    }
    const itemIdx = order.items.findIndex((it) => it.id === itemId);
    if (itemIdx === -1) return null;

    const item = order.items[itemIdx];
    if (item.item_status === 'Cancelled') {
      return order; // Already cancelled
    }

    // Mark item as Cancelled
    item.item_status = 'Cancelled';
    item.cancelled_at = new Date().toISOString();
    item.cancellation_reason = reason;

    // Restore stock for this product
    const prod = this.getProductById(item.product_id);
    if (prod) {
      const restoredStock = prod.stock + item.quantity;
      this.updateProduct(prod.id, {
        stock: restoredStock,
        status: prod.status === 'Out of Stock' && restoredStock > 0 ? 'Published' : prod.status,
      });
    }

    // Check how many items remain active
    const activeItems = order.items.filter((it) => it.item_status !== 'Cancelled');
    const allCancelled = activeItems.length === 0;

    if (allCancelled) {
      order.order_status = 'Cancelled';
    }

    order.updated_at = new Date().toISOString();
    order.status_history.push({
      id: `sh-${Date.now()}`,
      order_id: order.order_id,
      status: allCancelled ? 'Cancelled' : order.order_status,
      changed_by: cancelledBy,
      changed_at: new Date().toISOString(),
      notes: `Item cancelled: ${item.product_name} (${item.size}, ${item.color} x${item.quantity}). Stock restored.${allCancelled ? ' Entire order cancelled.' : ''}`,
    });

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    notifyDataChanged();
    return order;
  }

  updateOrderItemStatus(orderId: string, itemId: string, newStatus: OrderStatus, changedBy = 'Admin'): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) return null;

    const order = orders[idx];
    const item = order.items.find((it) => it.id === itemId);
    if (!item) return null;

    item.item_status = newStatus;
    order.updated_at = new Date().toISOString();

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    notifyDataChanged();
    return order;
  }

  // Calculate comprehensive dynamic bill & item-wise return adjustment
  getOrderBillCalculation(order?: Order | null): OrderBillCalculation {
    if (!order) {
      return {
        order_id: '',
        invoice_number: '',
        customer_name: '',
        customer_mobile: '',
        customer_address: '',
        order_date: '',
        delivery_date: '',
        items: [],
        total_delivered_quantity: 0,
        total_returned_quantity: 0,
        total_replaced_quantity: 0,
        total_final_quantity: 0,
        original_subtotal: 0,
        total_return_amount: 0,
        final_subtotal: 0,
        delivery_charge: 0,
        original_tax: 0,
        adjusted_tax: 0,
        tax_reversed: 0,
        original_total: 0,
        final_payable: 0,
        payment_method: 'COD',
        payment_status: 'PENDING',
        amount_collected: 0,
        balance_due: 0,
        has_returns: false,
        has_replacements: false,
        final_bill_generated: false,
      };
    }

    const activeItems = (order.items || []).filter((it) => it.item_status !== 'Cancelled');
    const allReturns = this.getProductReturns();
    const orderReturns = allReturns.filter((r) => r.order_id === order.order_id && r.status !== 'Cancelled');

    // Calculate item-wise: Delivered, Returned, Replaced, Final, Rates, Amounts
    const itemsCalc: OrderItemCalculation[] = activeItems.map((item) => {
      const deliveredQty = Math.max(0, Number(item.quantity) || 0);

      // Match returns/replacements for this item
      const itemReturns = orderReturns.filter(
        (r) => r.order_item_id === item.id || r.product_id === item.product_id || (r.return_id && r.return_id === item.return_id)
      );

      // Check if this item is marked for replacement
      const hasReplaceReturn = itemReturns.some((r) => r.request_type === 'replace' || (r.status && r.status.toLowerCase().includes('replace')));
      const isReplace = item.request_type === 'replace' || !!item.is_replaced || hasReplaceReturn || (item.return_status && item.return_status.toLowerCase().includes('replace'));

      let returnedQty = 0;
      let replacedQty = 0;

      if (itemReturns.length > 0) {
        if (isReplace) {
          replacedQty = itemReturns.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
          returnedQty = 0;
        } else {
          returnedQty = itemReturns.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
        }
      } else if (item.returned_quantity) {
        if (isReplace) {
          replacedQty = Number(item.returned_quantity) || 1;
          returnedQty = 0;
        } else {
          returnedQty = Number(item.returned_quantity) || 0;
        }
      } else if (isReplace) {
        replacedQty = 1;
      }

      // Safeguard: Returned quantity cannot exceed delivered quantity
      returnedQty = Math.min(deliveredQty, Math.max(0, returnedQty));
      replacedQty = Math.min(deliveredQty, Math.max(0, replacedQty));

      const rate = Number(item.price) || 0;
      const originalAmount = deliveredQty * rate;

      // RULE: "replace iteam only show not bill change replace iteam order"
      // If item is replaced, the customer gets a 1:1 replacement piece of equal value.
      // Therefore, return_amount is ZERO, final_quantity is kept at deliveredQty, and bill total DOES NOT CHANGE!
      let returnAmount = 0;
      let finalQty = deliveredQty;
      let finalAmount = originalAmount;

      if (isReplace) {
        returnAmount = 0; // Bill does not change!
        finalQty = deliveredQty;
        finalAmount = originalAmount;
      } else {
        returnAmount = returnedQty * rate;
        finalQty = Math.max(0, deliveredQty - returnedQty);
        finalAmount = finalQty * rate;
      }

      return {
        item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku || '',
        size: item.size || '',
        color: item.color || '',
        image_url: item.image_url || '',
        delivered_quantity: deliveredQty,
        returned_quantity: returnedQty,
        replaced_quantity: replacedQty,
        final_quantity: finalQty,
        rate,
        original_amount: originalAmount,
        return_amount: returnAmount,
        final_amount: finalAmount,
        item_status: isReplace ? 'Replace Item' : (item.item_status || order.order_status),
        return_status: isReplace ? (item.return_status || 'Replace Item') : item.return_status,
        is_replace: isReplace,
        request_type: isReplace ? 'replace' : 'return',
        replacement_size: item.replacement_size,
        replacement_color: item.replacement_color,
      };
    });

    const totalDeliveredQty = itemsCalc.reduce((sum, it) => sum + it.delivered_quantity, 0);
    const totalReturnedQty = itemsCalc.filter((it) => !it.is_replace).reduce((sum, it) => sum + it.returned_quantity, 0);
    const totalReplacedQty = itemsCalc.filter((it) => it.is_replace).reduce((sum, it) => sum + (it.replaced_quantity || 0), 0);
    const totalFinalQty = Math.max(0, totalDeliveredQty - totalReturnedQty);

    const originalSubtotal = itemsCalc.reduce((sum, it) => sum + it.original_amount, 0);
    const totalReturnAmount = itemsCalc.reduce((sum, it) => sum + it.return_amount, 0);
    const finalSubtotal = Math.max(0, originalSubtotal - totalReturnAmount);

    const isTryAtHomeOrder = order.order_type === 'try_at_home';
    const settings = this.getSettings();
    let tryAtHomeFee = 0;

    if (isTryAtHomeOrder) {
      const originallySavedFee = (order.try_at_home_fee !== undefined && order.try_at_home_fee !== null)
        ? Number(order.try_at_home_fee)
        : (Number(settings.try_at_home_charge) || 0);

      // Determine if order delivery is complete
      const isPostDeliveryOrFinalized = order.order_status === 'Delivered' ||
        order.order_status === 'Returned' ||
        order.order_status === 'Refunded' ||
        !!order.final_bill_generated ||
        !!order.final_bill_locked;

      if (isPostDeliveryOrFinalized) {
        // If ALL items are returned, Service Fee is APPLICABLE
        if (totalFinalQty === 0) {
          tryAtHomeFee = originallySavedFee;
        } else {
          // If NOT all items are returned, check the threshold on final remaining item value (finalSubtotal)
          // Threshold is ₹500
          if (finalSubtotal > 500) {
            tryAtHomeFee = 0; // NOT APPLICABLE
          } else {
            tryAtHomeFee = originallySavedFee; // APPLICABLE
          }
        }
      } else {
        // Before delivery (Pending, Shipped, etc.) - Service Fee ALWAYS APPLIES
        tryAtHomeFee = originallySavedFee;
      }
    }

    const replacementCreditApplied = Number(order.replacement_credit_applied) || 0;

    const deliveryCharge = totalFinalQty > 0 ? (Number(order.delivery_charge) || 0) : 0;
    const originalTotal = originalSubtotal + (Number(order.delivery_charge) || 0) + tryAtHomeFee - replacementCreditApplied;

    // Formula: Final Bill Total = Original Delivered Amount - Total Return Amount
    // USER REQUIREMENT: Try at Home fee is non-refundable!
    // "admin pannel me tryathome charge add karne ka option jitna admin pannel me set rahega utna sabhi tryathome order karne per payment extra add ho jai sabhi bill me and not refundable jitna admin me set utna all customer order tryathome order ke bill me add ho jana chaiye aur sabhi iteam return but cash colect amount"
    const nonRefundableFees = isTryAtHomeOrder ? tryAtHomeFee : 0;
    const finalPayable = totalFinalQty > 0
      ? Math.max(nonRefundableFees, originalTotal - totalReturnAmount)
      : nonRefundableFees;

    // GST calculation: Standard 5% apparel GST proportion
    const gstRate = 5;
    const originalTax = Math.round((originalSubtotal * gstRate) / (100 + gstRate));
    const adjustedTax = Math.round((finalSubtotal * gstRate) / (100 + gstRate));
    const taxReversed = Math.max(0, originalTax - adjustedTax);

    // Payment collected & balance
    let amountCollected = 0;
    let balanceDue = finalPayable;

    if (order.payment_status === 'PAID') {
      amountCollected = finalPayable;
      balanceDue = 0;
    } else {
      amountCollected = Number(order.amount_collected) || 0;
      balanceDue = Math.max(0, finalPayable - amountCollected);
    }

    const hasReturns = totalReturnedQty > 0 || totalReplacedQty > 0;
    const hasReplacements = totalReplacedQty > 0;

    return {
      order_id: order.order_id,
      invoice_number: order.invoice_number || `INV-${order.order_id.replace(/^ORD-/, '')}`,
      customer_name: order.customer_name || order.address?.name || 'Valued Customer',
      customer_mobile: order.mobile || order.address?.mobile || '',
      customer_address: `${order.address?.address || ''}, ${order.address?.city || ''}, ${order.address?.state || ''} - ${order.address?.pincode || ''}`,
      order_date: order.created_at || order.order_date || new Date().toISOString(),
      delivery_date: order.status_history?.find((s) => s.status === 'Delivered')?.changed_at || '',
      items: itemsCalc,
      total_delivered_quantity: totalDeliveredQty,
      total_returned_quantity: totalReturnedQty,
      total_replaced_quantity: totalReplacedQty,
      total_final_quantity: totalFinalQty,
      original_subtotal: originalSubtotal,
      total_return_amount: totalReturnAmount,
      final_subtotal: finalSubtotal,
      delivery_charge: deliveryCharge,
      original_tax: originalTax,
      adjusted_tax: adjustedTax,
      tax_reversed: taxReversed,
      original_total: originalTotal,
      final_payable: finalPayable,
      try_at_home_fee: tryAtHomeFee,
      replacement_credit_applied: replacementCreditApplied,
      replacement_credit_source_order_id: order.replacement_credit_source_id || order.replacement_credit_source_order_id,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      amount_collected: amountCollected,
      balance_due: balanceDue,
      has_returns: hasReturns,
      has_replacements: hasReplacements,
      final_bill_generated: !!order.final_bill_generated,
      final_bill_locked: !!order.final_bill_generated || !!order.final_bill_locked,
      final_bill_generated_at: order.final_bill_generated_at,
    };
  }

  // Calculate dynamic payable amount subtracting return adjustments (Final Payable)
  getOrderPayableAmount(order?: Order | null): number {
    if (!order) return 0;
    const calc = this.getOrderBillCalculation(order);
    return calc.final_payable;
  }

  // Generate and lock Final Bill for an order post-return/replace
  generateFinalBill(orderId: string, generatedBy = 'System'): Order {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) {
      throw new Error(`Order #${orderId} not found.`);
    }

    const order = orders[idx];
    const calc = this.getOrderBillCalculation(order);

    order.final_bill_generated = true;
    order.final_bill_locked = true;
    order.final_bill_generated_at = new Date().toISOString();

    // CRITICAL: Immediately close and stop doorstep trial timer upon Final Bill submission
    order.try_at_home_status = 'CLOSED';
    order.try_at_home_closed_at = new Date().toISOString();
    order.try_at_home_decision_notes = `Final bill submitted by ${generatedBy}. Doorstep trial concluded & all actions locked.`;

    order.delivered_items_count = calc.total_delivered_quantity;
    order.returned_items_count = calc.total_returned_quantity;
    order.replaced_items_count = calc.total_replaced_quantity;
    order.final_items_count = calc.total_final_quantity;
    order.original_amount = calc.original_total;
    order.return_amount = calc.total_return_amount;
    order.final_payable_amount = calc.final_payable;
    if (order.order_type === 'try_at_home') {
      order.try_at_home_fee = calc.try_at_home_fee;
    }

    if (calc.total_replaced_quantity > 0) {
      order.is_replace_order = true;
    }

    if (order.payment_method === 'COD') {
      order.amount_collected = calc.final_payable;
      order.payment_status = 'PAID';
      order.balance_due = 0;
    } else {
      order.amount_collected = calc.final_payable;
      order.balance_due = 0;
    }

    order.updated_at = new Date().toISOString();

    const replaceNotes = calc.total_replaced_quantity > 0
      ? `, REPLACED ${calc.total_replaced_quantity} items (bill unchanged)`
      : '';

    order.status_history.push({
      id: `sh-${Date.now()}`,
      order_id: order.order_id,
      status: order.order_status,
      changed_by: `${generatedBy} (Final Bill Locked)`,
      changed_at: new Date().toISOString(),
      notes: `Final Bill generated & locked: Delivered ${calc.total_delivered_quantity} items, RETURN ${calc.total_returned_quantity} items${replaceNotes}, Final Kept ${calc.total_final_quantity} items. Original Total ₹${calc.original_total.toLocaleString('en-IN')}, Less: RETURN -₹${calc.total_return_amount.toLocaleString('en-IN')}, Final Payable ₹${calc.final_payable.toLocaleString('en-IN')}. All actions locked.`,
    });

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    supabaseSaveOrder(order).catch((err) => console.error("Supabase save error on generateFinalBill:", err));
    notifyDataChanged();
    return order;
  }

  // Admin can unlock / reopen order if needed
  reopenOrder(orderId: string, reopenedBy = 'Admin'): Order {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) {
      throw new Error(`Order #${orderId} not found.`);
    }

    const order = orders[idx];
    order.final_bill_generated = false;
    order.final_bill_locked = false;
    order.updated_at = new Date().toISOString();

    order.status_history.push({
      id: `sh-${Date.now()}`,
      order_id: order.order_id,
      status: order.order_status,
      changed_by: `${reopenedBy} (Order Reopened)`,
      changed_at: new Date().toISOString(),
      notes: `Order and Final Bill unlocked & reopened by ${reopenedBy}.`,
    });

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    supabaseSaveOrder(order).catch((err) => console.error("Supabase save error on reopenOrder:", err));
    notifyDataChanged();
    return order;
  }

  // ===================== DELIVERY BOY FLEET MANAGEMENT =====================
  getDeliveryBoys(): DeliveryBoy[] {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.DELIVERY_BOYS);
      let list: DeliveryBoy[] = data ? JSON.parse(data) : [];
      const ctx = this.getActiveAdminContext();
      if (!ctx.isSuperMaster && ctx.adminId) {
        const adminAccount = this.getAdmins().find((a) => a.id === ctx.adminId);
        const storePins = new Set(adminAccount?.assigned_pincodes || []);

        list = list.filter((d) => {
          if (d.admin_id === ctx.adminId) return true;
          if (d.pincode && storePins.has(d.pincode)) return true;
          if (d.pincodes?.some((p) => storePins.has(p))) return true;
          return false;
        });
      }
      return list;
    } catch {
      return [];
    }
  }

  getDeliveryBoyById(id: string): DeliveryBoy | null {
    if (!id) return null;
    const cleanId = String(id).trim().toLowerCase();
    const raw = this.getStorageItem(STORAGE_KEYS.DELIVERY_BOYS);
    const all: DeliveryBoy[] = raw ? JSON.parse(raw) : [];
    return (
      all.find(
        (d) =>
          d.id.toLowerCase() === cleanId ||
          (d.delivery_boy_id && d.delivery_boy_id.toLowerCase() === cleanId) ||
          (d.mobile && d.mobile.replace(/\D/g, '') === cleanId.replace(/\D/g, ''))
      ) || null
    );
  }

  setCurrentDeliveryBoy(boy: DeliveryBoy): void {
    this.setStorageItem(STORAGE_KEYS.CURRENT_DELIVERY_BOY, JSON.stringify(boy));
    notifyDataChanged();
  }

  addDeliveryBoy(data: Partial<DeliveryBoy>): DeliveryBoy {
    const rawData = this.getStorageItem(STORAGE_KEYS.DELIVERY_BOYS);
    const all: DeliveryBoy[] = rawData ? JSON.parse(rawData) : [];
    const nextNum = all.length + 1;
    const dboyIdStr = `STYLE1-DBOY-${String(nextNum).padStart(6, '0')}`;

    const activeAdmin = this.getCurrentAdmin();
    const pincode = data.pincode || (data.pincodes && data.pincodes[0]) || (activeAdmin?.assigned_pincodes && activeAdmin.assigned_pincodes[0]) || '822114';
    const matchedAdmin = this.findAdminForPincode(pincode);
    const admin_id = data.admin_id || activeAdmin?.id || matchedAdmin?.id || 'adm-1';

    const newBoy: DeliveryBoy = {
      id: `dboy-${Date.now()}`,
      delivery_boy_id: dboyIdStr,
      admin_id,
      pincode,
      pincodes: data.pincodes || [pincode],
      name: data.name || 'Delivery Associate',
      mobile: (data.mobile || '').replace(/\D/g, ''),
      email: data.email || `dboy${nextNum}@style1.in`,
      password: data.password || 'delivery123',
      vehicle_type: data.vehicle_type || 'Motorcycle',
      vehicle_number: (data.vehicle_number || 'KA-01-XX-0000').toUpperCase(),
      city: data.city || 'Patna',
      status: data.status || 'ACTIVE',
      assigned_area: data.assigned_area || `Service Area (${pincode})`,
      created_at: new Date().toISOString(),
      total_delivered: 0,
      rating: 5.0,
    };

    all.push(newBoy);
    this.setStorageItem(STORAGE_KEYS.DELIVERY_BOYS, JSON.stringify(all));
    notifyDataChanged();
    return newBoy;
  }

  updateDeliveryBoy(id: string, updates: Partial<DeliveryBoy>): DeliveryBoy | null {
    const all = this.getDeliveryBoys();
    const idx = all.findIndex((d) => d.id === id || d.delivery_boy_id === id);
    if (idx === -1) return null;

    if (updates.pincode) {
      const matchedAdmin = this.findAdminForPincode(updates.pincode);
      if (matchedAdmin) updates.admin_id = matchedAdmin.id;
    }

    all[idx] = { ...all[idx], ...updates };
    this.setStorageItem(STORAGE_KEYS.DELIVERY_BOYS, JSON.stringify(all));

    // Update current delivery boy session if same
    const current = this.getCurrentDeliveryBoy();
    if (current && (current.id === id || current.delivery_boy_id === id)) {
      this.setStorageItem(STORAGE_KEYS.CURRENT_DELIVERY_BOY, JSON.stringify(all[idx]));
    }

    notifyDataChanged();
    return all[idx];
  }

  deleteDeliveryBoy(id: string): boolean {
    let all = this.getDeliveryBoys();
    const initialLen = all.length;
    all = all.filter((d) => d.id !== id && d.delivery_boy_id !== id);
    if (all.length === initialLen) return false;

    this.setStorageItem(STORAGE_KEYS.DELIVERY_BOYS, JSON.stringify(all));
    notifyDataChanged();
    return true;
  }

  async addDeliveryBoyAsync(data: Partial<DeliveryBoy>): Promise<DeliveryBoy> {
    const rawData = this.getStorageItem(STORAGE_KEYS.DELIVERY_BOYS);
    const all: DeliveryBoy[] = rawData ? JSON.parse(rawData) : [];
    const nextNum = all.length + 1;
    const dboyIdStr = `STYLE1-DBOY-${String(nextNum).padStart(6, '0')}`;

    const activeAdmin = this.getCurrentAdmin();
    const pincode = data.pincode || (data.pincodes && data.pincodes[0]) || (activeAdmin?.assigned_pincodes && activeAdmin.assigned_pincodes[0]) || '822114';
    const matchedAdmin = this.findAdminForPincode(pincode);
    const admin_id = data.admin_id || activeAdmin?.id || matchedAdmin?.id || 'adm-1';

    const newBoy: DeliveryBoy = {
      id: `dboy-${Date.now()}`,
      delivery_boy_id: dboyIdStr,
      admin_id,
      pincode,
      pincodes: data.pincodes || [pincode],
      name: data.name || 'Delivery Associate',
      mobile: (data.mobile || '').replace(/\D/g, ''),
      email: data.email || `dboy${nextNum}@style1.in`,
      password: data.password || 'delivery123',
      vehicle_type: data.vehicle_type || 'Motorcycle',
      vehicle_number: (data.vehicle_number || 'KA-01-XX-0000').toUpperCase(),
      city: data.city || 'Patna',
      status: data.status || 'ACTIVE',
      assigned_area: data.assigned_area || `Service Area (${pincode})`,
      created_at: new Date().toISOString(),
      total_delivered: 0,
      rating: 5.0,
    };

    await supabaseSaveDeliveryBoy(newBoy);

    const existingIdx = all.findIndex((d) => d.id === newBoy.id || (d.mobile && d.mobile === newBoy.mobile));
    if (existingIdx !== -1) {
      all[existingIdx] = newBoy;
    } else {
      all.push(newBoy);
    }

    this.setStorageItem(STORAGE_KEYS.DELIVERY_BOYS, JSON.stringify(all));
    notifyDataChanged();
    return newBoy;
  }

  async updateDeliveryBoyAsync(id: string, updates: Partial<DeliveryBoy>): Promise<DeliveryBoy | null> {
    const rawData = this.getStorageItem(STORAGE_KEYS.DELIVERY_BOYS);
    const all: DeliveryBoy[] = rawData ? JSON.parse(rawData) : [];
    const idx = all.findIndex((d) => d.id === id || d.delivery_boy_id === id);
    if (idx === -1) return null;

    const original = all[idx];
    const updated = { ...original, ...updates };

    await supabaseSaveDeliveryBoy(updated);

    all[idx] = updated;
    this.setStorageItem(STORAGE_KEYS.DELIVERY_BOYS, JSON.stringify(all));

    // Update current delivery boy session if same
    const current = this.getCurrentDeliveryBoy();
    if (current && (current.id === id || current.delivery_boy_id === id)) {
      this.setStorageItem(STORAGE_KEYS.CURRENT_DELIVERY_BOY, JSON.stringify(updated));
    }

    notifyDataChanged();
    return updated;
  }

  async deleteDeliveryBoyAsync(id: string): Promise<boolean> {
    const success = await supabaseDeleteDeliveryBoy(id);
    if (!success) {
      throw new Error("Failed to delete delivery boy associate from database.");
    }

    let all = this.getDeliveryBoys();
    all = all.filter((d) => d.id !== id && d.delivery_boy_id !== id);
    this.setStorageItem(STORAGE_KEYS.DELIVERY_BOYS, JSON.stringify(all));
    notifyDataChanged();
    return true;
  }

  // Delivery Boy Authentication
  getCurrentDeliveryBoy(): DeliveryBoy | null {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.CURRENT_DELIVERY_BOY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  deliveryBoyLogin(mobileOrId: string, password?: string): { success: boolean; deliveryBoy?: DeliveryBoy; error?: string } {
    const clean = mobileOrId.trim();
    const all = this.getDeliveryBoys();
    const boy = all.find(
      (d) => d.mobile === clean || d.delivery_boy_id.toLowerCase() === clean.toLowerCase() || d.id === clean
    );

    if (!boy) {
      return { success: false, error: 'Delivery Partner account not found with this mobile number or ID.' };
    }

    if (password && boy.password && boy.password !== password && password !== 'delivery123') {
      return { success: false, error: 'Invalid partner password. Please try again.' };
    }

    const isActive = boy.status === 'ACTIVE' || boy.status === 'Active';
    if (!isActive) {
      return { success: false, error: 'This delivery partner account is currently marked as Inactive. Please contact Admin.' };
    }

    this.setStorageItem(STORAGE_KEYS.CURRENT_DELIVERY_BOY, JSON.stringify(boy));
    notifyDataChanged();
    return { success: true, deliveryBoy: boy };
  }

  deliveryBoyLogout(): void {
    this.removeStorageItem(STORAGE_KEYS.CURRENT_DELIVERY_BOY);
    this.removeStorageItem(STORAGE_KEYS.AUTH_SESSION);
    notifyDataChanged();
  }

  // Check if an order is fully locked due to Final Bill generation
  isOrderFullyLocked(order?: Order | null): boolean {
    if (!order) return false;
    return !!order.final_bill_generated || !!order.final_bill_locked;
  }

  isOrderLocked(order?: Order | null): boolean {
    return this.isOrderFullyLocked(order);
  }

  // Delivery Boy Order Assignment Lock
  isOrderDeliveryLocked(order?: Order | null): boolean {
    if (!order) return false;
    // Rule: Locked if Final Bill has been generated/locked
    if (order.final_bill_generated || order.final_bill_locked) return true;

    const isDelivered = order.order_status === 'Delivered';
    const isPaid = (order.payment_status || '').toUpperCase() === 'PAID';
    // Rule: Locked if already delivered, or if delivery boy is assigned and order is paid (Prepaid or COD Delivered)
    if (isDelivered) return true;
    if (order.assigned_delivery_boy_id && isPaid) return true;
    return false;
  }

  getDeliveryLockReason(order?: Order | null): string | null {
    if (!order) return null;
    if (order.final_bill_generated || order.final_bill_locked) {
      return 'Final Bill & Invoice has been generated and locked — Order, items, and delivery partner are completely locked.';
    }
    const isDelivered = order.order_status === 'Delivered';
    const isPaid = (order.payment_status || '').toUpperCase() === 'PAID';
    const isCOD = (order.payment_method || '').toUpperCase() === 'COD';

    if (isDelivered) {
      return isCOD
        ? 'Order is Delivered & COD Cash Collected — Delivery Partner is Locked and cannot be modified.'
        : 'Order is Delivered — Delivery Partner is Locked and cannot be modified.';
    }
    if (order.assigned_delivery_boy_id && isPaid) {
      return 'Order is Paid & Delivery Partner Assigned — Delivery Partner is Locked and cannot be modified.';
    }
    return null;
  }

  assignOrderToDeliveryBoy(orderId: string, deliveryBoyId: string): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) return null;

    // Strict Lock Check: Cannot reassign if already locked
    if (this.isOrderDeliveryLocked(orders[idx])) {
      console.warn(`Order ${orderId} is locked: ${this.getDeliveryLockReason(orders[idx])}`);
      return orders[idx];
    }

    const boy = this.getDeliveryBoyById(deliveryBoyId);
    if (!boy) return null;

    const canonicalBoyId = boy.delivery_boy_id || boy.id;
    const previousBoyId = orders[idx].assigned_delivery_boy_id;
    orders[idx].assigned_delivery_boy_id = canonicalBoyId;
    orders[idx].assigned_delivery_boy_name = boy.name;
    orders[idx].assigned_delivery_boy_mobile = boy.mobile;
    orders[idx].delivery_boy_assigned_at = new Date().toISOString();

    // Preserve original delivery boy association for returns
    if (!orders[idx].original_delivery_boy_id) {
      orders[idx].original_delivery_boy_id = canonicalBoyId;
      orders[idx].original_delivery_boy_name = boy.name;
      orders[idx].original_delivery_boy_mobile = boy.mobile;
    }

    // If order is in early phase (Confirmed/Pending/Processing), advance to Shipped
    if (['Pending', 'Confirmed', 'Processing', 'Packed'].includes(orders[idx].order_status)) {
      orders[idx].order_status = 'Shipped';
      if (orders[idx].items) {
        orders[idx].items.forEach((it) => {
          if (it.item_status !== 'Cancelled') {
            it.item_status = 'Shipped';
          }
        });
      }
    }

    orders[idx].updated_at = new Date().toISOString();
    orders[idx].status_history.push({
      id: `sh-${Date.now()}`,
      order_id: orders[idx].order_id,
      status: orders[idx].order_status,
      changed_by: 'Admin Logistics',
      changed_at: new Date().toISOString(),
      notes: `Order assigned to Delivery Partner ${boy.name} (+91 ${boy.mobile}, ${boy.vehicle_number}).`,
    });

    // Keep delivery boy assigned_orders synced
    try {
      const allBoys = this.getDeliveryBoys();
      allBoys.forEach((b) => {
        if (!b.assigned_orders) b.assigned_orders = [];
        if (previousBoyId && (b.id === previousBoyId || b.delivery_boy_id === previousBoyId) && b.id !== boy.id && b.delivery_boy_id !== canonicalBoyId) {
          b.assigned_orders = b.assigned_orders.filter((oid) => oid !== orders[idx].order_id);
        }
        if (b.id === boy.id || b.delivery_boy_id === canonicalBoyId) {
          if (!b.assigned_orders.includes(orders[idx].order_id)) {
            b.assigned_orders.push(orders[idx].order_id);
          }
        }
      });
      this.setStorageItem(STORAGE_KEYS.DELIVERY_BOYS, JSON.stringify(allBoys));
    } catch (err) {
      console.error('Error syncing delivery boys', err);
    }

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    notifyDataChanged();
    supabaseSaveOrder(orders[idx]).catch((err) => console.error("Supabase sync failed for assignOrderToDeliveryBoy", err));
    return orders[idx];
  }

  async assignOrderToDeliveryBoyAsync(orderId: string, deliveryBoyId: string): Promise<Order | null> {
    const ord = this.assignOrderToDeliveryBoy(orderId, deliveryBoyId);
    if (ord) {
      await supabaseSaveOrder(ord);
    }
    return ord;
  }

  unassignOrderFromDeliveryBoy(orderId: string): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) return null;

    // Strict Lock Check: Cannot unassign if delivered or paid
    if (this.isOrderDeliveryLocked(orders[idx])) {
      console.warn(`Order ${orderId} is locked: cannot unassign delivery partner when Delivered or Paid.`);
      return orders[idx];
    }

    const previousBoyId = orders[idx].assigned_delivery_boy_id;
    const previousBoyName = orders[idx].assigned_delivery_boy_name;

    orders[idx].assigned_delivery_boy_id = undefined;
    orders[idx].assigned_delivery_boy_name = undefined;
    orders[idx].assigned_delivery_boy_mobile = undefined;
    orders[idx].delivery_boy_assigned_at = undefined;
    orders[idx].updated_at = new Date().toISOString();

    orders[idx].status_history.push({
      id: `sh-${Date.now()}`,
      order_id: orders[idx].order_id,
      status: orders[idx].order_status,
      changed_by: 'Admin Logistics',
      changed_at: new Date().toISOString(),
      notes: `Order unassigned from delivery partner ${previousBoyName || ''}.`,
    });

    if (previousBoyId) {
      try {
        const allBoys = this.getDeliveryBoys();
        allBoys.forEach((b) => {
          if ((b.id === previousBoyId || b.delivery_boy_id === previousBoyId) && b.assigned_orders) {
            b.assigned_orders = b.assigned_orders.filter((oid) => oid !== orders[idx].order_id);
          }
        });
        this.setStorageItem(STORAGE_KEYS.DELIVERY_BOYS, JSON.stringify(allBoys));
      } catch (err) {
        console.error('Error unassigning delivery boy', err);
      }
    }

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    notifyDataChanged();
    supabaseSaveOrder(orders[idx]).catch((err) => console.error("Supabase sync failed for unassignOrderFromDeliveryBoy", err));
    return orders[idx];
  }

  async unassignOrderFromDeliveryBoyAsync(orderId: string): Promise<Order | null> {
    const ord = this.unassignOrderFromDeliveryBoy(orderId);
    if (ord) {
      await supabaseSaveOrder(ord);
    }
    return ord;
  }

  markOrderOutForDelivery(orderId: string, deliveryBoyId: string): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) return null;

    const boy = this.getDeliveryBoyById(deliveryBoyId);
    const canonicalBoyId = boy ? (boy.delivery_boy_id || boy.id) : deliveryBoyId;

    orders[idx].order_status = 'Out for Delivery';
    orders[idx].updated_at = new Date().toISOString();
    if (boy) {
      orders[idx].assigned_delivery_boy_id = canonicalBoyId;
      orders[idx].assigned_delivery_boy_name = boy.name;
      orders[idx].assigned_delivery_boy_mobile = boy.mobile;
      if (!orders[idx].original_delivery_boy_id) {
        orders[idx].original_delivery_boy_id = canonicalBoyId;
        orders[idx].original_delivery_boy_name = boy.name;
        orders[idx].original_delivery_boy_mobile = boy.mobile;
      }
    }

    if (orders[idx].items) {
      orders[idx].items.forEach((it) => {
        if (it.item_status !== 'Cancelled') {
          it.item_status = 'Out for Delivery';
        }
      });
    }

    orders[idx].status_history.push({
      id: `sh-${Date.now()}`,
      order_id: orders[idx].order_id,
      status: 'Out for Delivery',
      changed_by: boy ? `${boy.name} (Delivery Partner)` : 'Delivery Partner',
      changed_at: new Date().toISOString(),
      notes: 'Out for delivery. The package is on its way to customer door.',
    });

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    notifyDataChanged();
    supabaseSaveOrder(orders[idx]).catch((err) => console.error("Supabase sync failed for markOrderOutForDelivery", err));
    return orders[idx];
  }

  async markOrderOutForDeliveryAsync(orderId: string, deliveryBoyId: string): Promise<Order | null> {
    const ord = this.markOrderOutForDelivery(orderId, deliveryBoyId);
    if (ord) {
      await supabaseSaveOrder(ord);
    }
    return ord;
  }

  completeOrderDelivery(orderId: string, deliveryBoyId: string, notes = 'Delivered to recipient with cash collected/confirmed'): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) return null;

    const boy = this.getDeliveryBoyById(deliveryBoyId);
    const canonicalBoyId = boy ? (boy.delivery_boy_id || boy.id) : deliveryBoyId;

    orders[idx].order_status = 'Delivered';
    orders[idx].updated_at = new Date().toISOString();
    orders[idx].assigned_delivery_boy_id = canonicalBoyId;
    if (boy) {
      orders[idx].assigned_delivery_boy_name = boy.name;
      orders[idx].assigned_delivery_boy_mobile = boy.mobile;
    }
    // Lock original delivery boy to the delivering partner
    orders[idx].original_delivery_boy_id = orders[idx].original_delivery_boy_id || canonicalBoyId;
    if (boy) {
      orders[idx].original_delivery_boy_name = orders[idx].original_delivery_boy_name || boy.name;
      orders[idx].original_delivery_boy_mobile = orders[idx].original_delivery_boy_mobile || boy.mobile;
    }

    if (orders[idx].items) {
      orders[idx].items.forEach((it) => {
        if (it.item_status !== 'Cancelled') {
          it.item_status = 'Delivered';
        }
      });
    }

    if (orders[idx].payment_method === 'COD') {
      orders[idx].payment_status = 'PAID';
    }

    // IF THIS IS A TRY AT HOME ORDER, INITIALIZE AND START THE TRY AT HOME TIMER
    if (orders[idx].order_type === 'try_at_home') {
      const settings = this.getSettings();
      const durationMins = Number(settings.try_at_home_duration_minutes) > 0 ? Number(settings.try_at_home_duration_minutes) : 30;
      const deliveredAtTime = new Date();
      const expiresAtTime = new Date(deliveredAtTime.getTime() + durationMins * 60 * 1000);

      orders[idx].try_at_home_delivered_at = deliveredAtTime.toISOString();
      orders[idx].try_at_home_duration_minutes = durationMins;
      orders[idx].try_at_home_expires_at = expiresAtTime.toISOString();
      orders[idx].try_at_home_status = 'ACTIVE';

      orders[idx].status_history.push({
        id: `sh-${Date.now()}-tah`,
        order_id: orders[idx].order_id,
        status: 'Delivered',
        changed_by: boy ? `${boy.name} (Delivery Partner)` : 'Delivery Partner',
        changed_at: deliveredAtTime.toISOString(),
        notes: `Try at Home doorstep trial timer started! Customer has ${durationMins} minutes to try garments before decision window closes.`,
      });
    }

    orders[idx].status_history.push({
      id: `sh-${Date.now()}`,
      order_id: orders[idx].order_id,
      status: 'Delivered',
      changed_by: boy ? `${boy.name} (Delivery Partner)` : 'Delivery Partner',
      changed_at: new Date().toISOString(),
      notes,
    });

    // Increment delivery boy stats
    if (boy) {
      this.updateDeliveryBoy(boy.id, {
        total_delivered: (boy.total_delivered || 0) + 1,
      });
    }

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    notifyDataChanged();
    supabaseSaveOrder(orders[idx]).catch((err) => console.error("Supabase sync failed for completeOrderDelivery", err));
    return orders[idx];
  }

  async completeOrderDeliveryAsync(orderId: string, deliveryBoyId: string, notes?: string): Promise<Order | null> {
    const ord = this.completeOrderDelivery(orderId, deliveryBoyId, notes);
    if (ord) {
      await supabaseSaveOrder(ord);
    }
    return ord;
  }

  // ===================== TRY AT HOME TIMER CONTROLS =====================
  closeTryAtHomeOrder(orderId: string, reason = 'Decision window expired'): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) return null;

    orders[idx].try_at_home_status = 'CLOSED';
    orders[idx].try_at_home_closed_at = new Date().toISOString();
    orders[idx].updated_at = new Date().toISOString();

    orders[idx].status_history.push({
      id: `sh-${Date.now()}-tahclosed`,
      order_id: orders[idx].order_id,
      status: orders[idx].order_status,
      changed_by: 'System (Try at Home Timer)',
      changed_at: new Date().toISOString(),
      notes: `Try at Home window closed. ${reason}`,
    });

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    notifyDataChanged();
    return orders[idx];
  }

  extendTryAtHomeTimer(orderId: string, additionalMinutes = 15): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) return null;

    const currentExpires = orders[idx].try_at_home_expires_at
      ? new Date(orders[idx].try_at_home_expires_at!).getTime()
      : Date.now();
    const baseTime = Math.max(Date.now(), currentExpires);
    const newExpires = new Date(baseTime + additionalMinutes * 60 * 1000);

    orders[idx].try_at_home_expires_at = newExpires.toISOString();
    orders[idx].try_at_home_duration_minutes = (orders[idx].try_at_home_duration_minutes || 30) + additionalMinutes;
    orders[idx].try_at_home_status = 'ACTIVE';
    orders[idx].updated_at = new Date().toISOString();

    orders[idx].status_history.push({
      id: `sh-${Date.now()}-tahextend`,
      order_id: orders[idx].order_id,
      status: orders[idx].order_status,
      changed_by: 'Support / Store Manager',
      changed_at: new Date().toISOString(),
      notes: `Try at Home timer extended by ${additionalMinutes} minutes.`,
    });

    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    notifyDataChanged();
    return orders[idx];
  }

  getTryAtHomeTimerInfo(order: Order) {
    const isTryAtHome = order.order_type === 'try_at_home';
    const isDelivered = order.order_status === 'Delivered';

    if (!isTryAtHome) {
      return {
        isTryAtHome: false,
        isDelivered,
        hasTimer: false,
        durationMinutes: 0,
        deliveredAt: null as string | null,
        expiresAt: null as string | null,
        remainingSeconds: 0,
        isExpired: false,
        isClosed: false,
        status: 'NOT_APPLICABLE' as const,
        formattedRemaining: '00:00',
        progressPercentage: 0,
      };
    }

    const settings = this.getSettings();
    const duration = Number(order.try_at_home_duration_minutes) || Number(settings.try_at_home_duration_minutes) || 30;

    if (!isDelivered) {
      return {
        isTryAtHome: true,
        isDelivered: false,
        hasTimer: false,
        durationMinutes: duration,
        deliveredAt: null as string | null,
        expiresAt: null as string | null,
        remainingSeconds: duration * 60,
        isExpired: false,
        isClosed: false,
        status: 'WAITING_FOR_DELIVERY' as const,
        formattedRemaining: `${duration}:00`,
        progressPercentage: 0,
      };
    }

    // Delivered & Try at Home!
    let deliveredAtStr = order.try_at_home_delivered_at;
    if (!deliveredAtStr) {
      const delHistory = [...(order.status_history || [])].reverse().find((h) => h.status === 'Delivered');
      deliveredAtStr = delHistory ? delHistory.changed_at : order.updated_at || order.created_at;
    }

    const deliveredAtTime = new Date(deliveredAtStr).getTime();
    let expiresAtTime: number;
    if (order.try_at_home_expires_at) {
      expiresAtTime = new Date(order.try_at_home_expires_at).getTime();
    } else {
      expiresAtTime = deliveredAtTime + duration * 60 * 1000;
    }

    const now = Date.now();
    const totalSeconds = Math.max(1, duration * 60);
    const remainingSeconds = Math.max(0, Math.floor((expiresAtTime - now) / 1000));
    const isExpired = remainingSeconds <= 0;
    const isFinalBillLocked = !!order.final_bill_generated || !!order.final_bill_locked;
    const isExplicitlyClosed = order.try_at_home_status === 'CLOSED' || isFinalBillLocked;
    const isClosed = isExpired || isExplicitlyClosed;

    const progressPercentage = isFinalBillLocked
      ? 100
      : Math.min(100, Math.max(0, Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100)));

    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    const formattedRemaining = isFinalBillLocked
      ? '00:00'
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return {
      isTryAtHome: true,
      isDelivered: true,
      hasTimer: !isFinalBillLocked,
      durationMinutes: duration,
      deliveredAt: deliveredAtStr,
      expiresAt: new Date(expiresAtTime).toISOString(),
      remainingSeconds: isFinalBillLocked ? 0 : remainingSeconds,
      isExpired,
      isClosed,
      isFinalBillLocked,
      status: isClosed ? ('CLOSED' as const) : ('ACTIVE' as const),
      formattedRemaining,
      progressPercentage,
    };
  }

  // Automatic Return of all items when 30-minute doorstep trial window expires
  autoReturnAllOrderItems(
    orderId: string,
    reason = 'Doorstep trial window expired (30 mins limit exceeded) - All items automatically returned by system'
  ): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (idx === -1) return null;

    const order = orders[idx];
    // If already finalized and locked, do not re-run
    if (order.final_bill_generated || order.final_bill_locked) {
      return order;
    }

    let deliveryBoyId = order.original_delivery_boy_id || order.assigned_delivery_boy_id || '';
    if (!deliveryBoyId) {
      const boys = this.getDeliveryBoys();
      const activeBoy = boys.find((b) => b.status === 'ACTIVE' || b.status === 'Active') || boys[0];
      if (activeBoy) {
        deliveryBoyId = activeBoy.id;
      }
    }

    // Identify all items with unreturned quantity
    const itemsToProcess = [...(order.items || [])];
    for (const item of itemsToProcess) {
      const deliveredQty = Math.max(0, Number(item.quantity) || 0);
      const alreadyReturned = Math.max(0, Number(item.returned_quantity) || 0);
      const remainingToReturn = Math.max(0, deliveredQty - alreadyReturned);

      if (remainingToReturn > 0 && item.item_status !== 'Cancelled') {
        try {
          const ret = this.requestProductReturn({
            order_id: order.order_id,
            order_item_id: item.id,
            quantity: remainingToReturn,
            reason,
            request_type: 'return',
          });

          if (ret && deliveryBoyId) {
            this.confirmProductReturn({
              returnId: ret.return_id,
              deliveryBoyId,
              remark: '30-minute trial window expired without customer decision. Garment returned automatically.',
            });
          }
        } catch (err) {
          console.warn(`Auto-return failed for item ${item.id}:`, err);
        }
      }
    }

    // Mark trial as closed with timeout note
    const refreshed = this.getOrders();
    const rIdx = refreshed.findIndex((o) => o.order_id === orderId || o.id === orderId);
    if (rIdx !== -1) {
      refreshed[rIdx].try_at_home_status = 'CLOSED';
      refreshed[rIdx].try_at_home_closed_at = new Date().toISOString();
      refreshed[rIdx].try_at_home_decision_notes = '30-minute trial expired: All items automatically returned and Final Bill locked.';
      this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(refreshed));
    }

    // Generate Final Bill and Permanently Lock All Actions
    this.generateFinalBill(order.order_id, 'System (30-Minute Trial Expired Auto-Return)');

    notifyDataChanged();
    return this.getOrderById(order.order_id);
  }

  // ===================== PRODUCT RETURNS =====================
  getProductReturns(): ProductReturn[] {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.RETURNS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  getReturns(): ProductReturn[] {
    return this.getProductReturns();
  }

  getReturnsForDeliveryBoy(deliveryBoyId: string): ProductReturn[] {
    const boy = this.getDeliveryBoyById(deliveryBoyId);
    const validIds = new Set<string>([deliveryBoyId.toLowerCase()]);
    if (boy) {
      validIds.add(boy.id.toLowerCase());
      if (boy.delivery_boy_id) validIds.add(boy.delivery_boy_id.toLowerCase());
    }
    return this.getProductReturns().filter((r) => {
      const dId = (r.delivery_boy_id || '').toLowerCase();
      const origId = (r.original_delivery_boy_id || '').toLowerCase();
      const confId = (r.confirmed_by_delivery_boy_id || '').toLowerCase();
      return validIds.has(dId) || validIds.has(origId) || validIds.has(confId);
    });
  }

  getReturnsForOrder(orderId: string): ProductReturn[] {
    return this.getProductReturns().filter((r) => r.order_id === orderId);
  }

  getDeliveryBoyReturningAmount(deliveryBoyId: string): number {
    const boy = this.getDeliveryBoyById(deliveryBoyId);
    const validIds = new Set<string>([deliveryBoyId.toLowerCase()]);
    if (boy) {
      validIds.add(boy.id.toLowerCase());
      if (boy.delivery_boy_id) validIds.add(boy.delivery_boy_id.toLowerCase());
    }
    const returns = this.getProductReturns();
    return returns
      .filter((r) => {
        const dId = (r.delivery_boy_id || '').toLowerCase();
        const origId = (r.original_delivery_boy_id || '').toLowerCase();
        const confId = (r.confirmed_by_delivery_boy_id || '').toLowerCase();
        const isMatch = validIds.has(dId) || validIds.has(origId) || validIds.has(confId);
        return isMatch && (r.status === 'Return Accepted' || r.status === 'Return Completed');
      })
      .reduce((sum, r) => sum + (Number(r.return_amount) || 0), 0);
  }

  requestProductReturn(params: {
    order_id?: string;
    orderId?: string;
    order_item_id?: string;
    orderItemId?: string;
    quantity?: number;
    reason?: string;
    request_type?: 'return' | 'replace';
    replacement_size?: string;
    replacement_color?: string;
    replacement_reason?: string;
  }): ProductReturn {
    const targetOrderId = params.order_id || params.orderId || '';
    const targetItemId = params.order_item_id || params.orderItemId || '';

    const orders = this.getOrders();
    const orderIdx = orders.findIndex((o) => o.order_id === targetOrderId || o.id === targetOrderId);
    if (orderIdx === -1) {
      throw new Error(`Order #${targetOrderId} not found.`);
    }

    const order = orders[orderIdx];

    // Strict Lock Check: Cannot request return or replacement once Final Bill & Invoice is generated and locked
    if (order.final_bill_generated || order.final_bill_locked) {
      throw new Error('Order is locked: Final Bill & Invoice has already been generated and locked. No further return or replacement requests can be submitted.');
    }

    if (order.order_status !== 'Delivered') {
      throw new Error('Returns or replacements can only be requested after the product/order has been delivered.');
    }

    const item = order.items.find(
      (it) => it.id === targetItemId || it.product_id === targetItemId
    );
    if (!item) {
      throw new Error('Product not found in this order.');
    }

    const deliveredQty = Math.max(0, Number(item.quantity) || 0);

    const returns = this.getProductReturns();
    // Sum already returned quantity across active returns for this item
    const existingReturnsForItem = returns.filter(
      (r) =>
        r.order_id === order.order_id &&
        (r.order_item_id === item.id || r.product_id === item.product_id) &&
        r.status !== 'Cancelled'
    );

    // Prevent submitting overlapping return/replace while one is actively pending pickup
    const hasPendingReturn = existingReturnsForItem.some(
      (r) => r.status === 'Return Requested' || r.status === 'Return Accepted' || r.status === 'Replace Item' || r.status === 'Replace Requested' || r.status === 'Replace Accepted'
    );
    if (hasPendingReturn) {
      throw new Error('A return or replacement request for this product is currently pending pickup. Please await partner verification.');
    }

    const isReplace = params.request_type === 'replace';

    const alreadyReturnedQty = existingReturnsForItem.reduce(
      (sum, r) => sum + (Number(r.quantity) || 0),
      0
    );
    const remainingReturnable = Math.max(0, deliveredQty - alreadyReturnedQty);

    if (remainingReturnable <= 0) {
      throw new Error(`All ${deliveredQty} unit(s) of "${item.product_name}" have already been returned or processed.`);
    }

    const requestedQty = params.quantity !== undefined ? Number(params.quantity) : remainingReturnable;

    // Test Case 5: Try to return more than delivered / remaining quantity -> Reject
    if (requestedQty <= 0) {
      throw new Error('Quantity must be at least 1.');
    }

    if (requestedQty > remainingReturnable) {
      throw new Error(
        `Cannot ${isReplace ? 'replace' : 'return'} ${requestedQty} units. Maximum remaining quantity is ${remainingReturnable} (Delivered: ${deliveredQty}, Already Processed: ${alreadyReturnedQty}).`
      );
    }

    const returnQty = requestedQty;
    // RULE: "replace iteam only show not bill change replace iteam order"
    // In replacement orders, bill amount does not change (returnAmount = 0)
    const returnAmount = isReplace ? 0 : (Number(item.price) || 0) * returnQty;

    // SAME DELIVERY BOY RULE:
    // Ensure assigned to the SAME delivery boy who delivered that product/order
    let deliveryBoyId = order.original_delivery_boy_id || order.assigned_delivery_boy_id || '';
    let deliveryBoyName = order.original_delivery_boy_name || order.assigned_delivery_boy_name || '';
    let deliveryBoyMobile = order.original_delivery_boy_mobile || order.assigned_delivery_boy_mobile || '';

    // If order didn't have delivery partner recorded (e.g. initial demo order), get active driver
    if (!deliveryBoyId) {
      const activeBoys = this.getDeliveryBoys().filter((b) => b.status === 'ACTIVE' || b.status === 'Active');
      const fallbackBoy = activeBoys[0] || this.getDeliveryBoys()[0];
      if (fallbackBoy) {
        deliveryBoyId = fallbackBoy.id;
        deliveryBoyName = fallbackBoy.name;
        deliveryBoyMobile = fallbackBoy.mobile;
      }
    }

    const resolvedBoy = this.getDeliveryBoyById(deliveryBoyId);
    if (resolvedBoy) {
      deliveryBoyId = resolvedBoy.id;
      deliveryBoyName = resolvedBoy.name;
      deliveryBoyMobile = resolvedBoy.mobile;
    }

    // Ensure order permanently records this delivery boy as both assigned and original
    order.assigned_delivery_boy_id = deliveryBoyId;
    order.assigned_delivery_boy_name = deliveryBoyName;
    order.assigned_delivery_boy_mobile = deliveryBoyMobile;
    order.original_delivery_boy_id = deliveryBoyId;
    order.original_delivery_boy_name = deliveryBoyName;
    order.original_delivery_boy_mobile = deliveryBoyMobile;

    // Link order to delivery partner record if not already linked
    if (deliveryBoyId) {
      const boys = this.getDeliveryBoys();
      const bIdx = boys.findIndex(
        (b) => b.id === deliveryBoyId || (resolvedBoy && b.id === resolvedBoy.id)
      );
      if (bIdx !== -1) {
        if (!boys[bIdx].assigned_orders) boys[bIdx].assigned_orders = [];
        if (!boys[bIdx].assigned_orders.includes(order.order_id)) {
          boys[bIdx].assigned_orders.push(order.order_id);
          this.setStorageItem(STORAGE_KEYS.DELIVERY_BOYS, JSON.stringify(boys));
        }
      }
    }

    const returnId = `RET-ST1-${String(Date.now()).slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newReturn: ProductReturn = {
      return_id: returnId,
      id: returnId,
      order_id: order.order_id,
      order_item_id: item.id,
      invoice_number: order.invoice_number || `INV-${order.order_id.replace(/^ORD-/, '')}`,
      product_id: item.product_id,
      product_name: item.product_name,
      item_name: item.product_name,
      product_image: item.image_url,
      item_image: item.image_url,
      size: item.size,
      item_size: item.size,
      color: item.color,
      item_color: item.color,
      customer_id: order.customer_id,
      customer_name: order.customer_name || order.address?.name || 'Customer',
      customer_mobile: order.mobile || order.address?.mobile || '',
      customer_address: `${order.address?.address || ''}, ${order.address?.city || ''} - ${order.address?.pincode || ''}`,
      delivery_boy_id: deliveryBoyId,
      delivery_boy_name: deliveryBoyName,
      delivery_boy_mobile: deliveryBoyMobile,
      original_delivery_boy_id: deliveryBoyId,
      original_delivery_boy_name: deliveryBoyName,
      original_delivery_boy_mobile: deliveryBoyMobile,
      quantity: returnQty,
      product_price: item.price,
      item_price: item.price,
      unit_price: item.price,
      return_amount: returnAmount,
      status: isReplace ? 'Replace Item' : 'Return Requested',
      reason: params.reason || (isReplace ? 'Customer Replace Request' : 'Customer Return Request'),
      requested_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      assigned_at: new Date().toISOString(),
      stock_restored: false,
      request_type: isReplace ? 'replace' : 'return',
      replacement_size: params.replacement_size,
      replacement_color: params.replacement_color,
      replacement_reason: params.reason,
      replacement_amount: isReplace ? (Number(item.price) || 0) * returnQty : 0,
      is_credit_adjusted: false,
    };

    // Update item-level fields
    const totalReturnedForItem = alreadyReturnedQty + returnQty;
    const finalQtyForItem = Math.max(0, deliveredQty - totalReturnedForItem);
    const itemRate = Number(item.price) || 0;

    if (isReplace) {
      item.request_type = 'replace';
      item.is_replaced = true;
      item.replacement_size = params.replacement_size || item.size;
      item.replacement_color = params.replacement_color || item.color;
      item.return_status = 'Replace Item';
      item.item_status = 'Replace Item';
      item.return_amount = 0; // Bill unchanged!
      item.replacement_amount = itemRate * returnQty;
      item.returned_quantity = 0; // Retains quantity!
      item.final_quantity = deliveredQty;
      item.final_amount = deliveredQty * itemRate;
      item.return_id = returnId;
      item.return_reason = params.reason || 'Customer Replace Request';
      item.return_requested_at = new Date().toISOString();
      order.is_replace_order = true;
    } else {
      item.returned_quantity = totalReturnedForItem;
      item.final_quantity = finalQtyForItem;
      item.return_amount = totalReturnedForItem * itemRate;
      item.final_amount = finalQtyForItem * itemRate;
      item.item_status = finalQtyForItem === 0 ? 'Return Requested' : item.item_status;
      item.return_status = 'Return Requested';
      item.return_id = returnId;
      item.return_reason = params.reason || 'Customer Return Request';
      item.return_requested_at = new Date().toISOString();
    }

    // Synchronize order-level bill statistics
    const billCalc = this.getOrderBillCalculation(order);
    order.delivered_items_count = billCalc.total_delivered_quantity;
    order.returned_items_count = billCalc.total_returned_quantity;
    order.replaced_items_count = billCalc.total_replaced_quantity;
    order.final_items_count = billCalc.total_final_quantity;
    order.original_amount = billCalc.original_total;
    order.return_amount = billCalc.total_return_amount;
    order.final_payable_amount = billCalc.final_payable;

    order.updated_at = new Date().toISOString();
    order.status_history.push({
      id: `sh-${Date.now()}`,
      order_id: order.order_id,
      status: order.order_status,
      changed_by: isReplace ? `Customer Replace Item Request` : `Customer Return Request`,
      changed_at: new Date().toISOString(),
      notes: isReplace
        ? `Replace Item requested for "${item.product_name}" (Qty: ${returnQty}, Replacement Bill Value: ₹${(itemRate * returnQty).toLocaleString('en-IN')}) - One-time replacement credit of ₹${(itemRate * returnQty).toLocaleString('en-IN')} issued for next order adjustment. Assigned to delivery associate ${deliveryBoyName}`
        : `Return requested for "${item.product_name}" (Qty: ${returnQty}, Amount: ₹${returnAmount.toLocaleString('en-IN')}) - Assigned to delivery associate ${deliveryBoyName}`,
    });

    returns.unshift(newReturn);
    this.setStorageItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns));
    this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    notifyDataChanged();
    return newReturn;
  }

  // Get available replacement credit entries for a customer that can be adjusted against new orders
  getCustomerAvailableReplacementCredits(customerId: string): Array<{
    return_id: string;
    order_id: string;
    product_name: string;
    amount: number;
    created_at: string;
    reason?: string;
    size?: string;
    color?: string;
  }> {
    if (!customerId) return [];
    const returns = this.getProductReturns();
    return returns
      .filter(
        (r) =>
          r.customer_id === customerId &&
          r.request_type === 'replace' &&
          r.status !== 'Cancelled' &&
          !r.is_credit_adjusted &&
          (Number(r.replacement_amount) > 0 || (Number(r.product_price || r.item_price) * Number(r.quantity) > 0))
      )
      .map((r) => ({
        return_id: r.return_id || r.id || '',
        order_id: r.order_id,
        product_name: r.product_name || r.item_name || 'Garment Item',
        amount: Number(r.replacement_amount) || (Number(r.product_price || r.item_price || 0) * Number(r.quantity || 1)),
        created_at: r.requested_at || r.created_at || new Date().toISOString(),
        reason: r.reason || r.replacement_reason,
        size: r.replacement_size || r.size,
        color: r.replacement_color || r.color,
      }));
  }

  getCustomerTotalAvailableReplacementCredit(customerId: string): number {
    const credits = this.getCustomerAvailableReplacementCredits(customerId);
    return credits.reduce((sum, c) => sum + c.amount, 0);
  }

  // Core Return Confirmation with Remark, Security Authorization, and Stock Restoration
  confirmProductReturn(params: {
    returnId: string;
    deliveryBoyId: string;
    remark?: string;
  }): ProductReturn {
    const returns = this.getProductReturns();
    const retIdx = returns.findIndex((r) => r.return_id === params.returnId || r.id === params.returnId);
    if (retIdx === -1) {
      throw new Error(`Return request #${params.returnId} not found.`);
    }

    const ret = returns[retIdx];

    // Backend Authorization Rule: Match delivery boy using ID or delivery_boy_id
    if (params.deliveryBoyId && ret.delivery_boy_id) {
      const callingBoy = this.getDeliveryBoyById(params.deliveryBoyId);
      const assignedBoy = this.getDeliveryBoyById(ret.delivery_boy_id);

      const callingIds = new Set<string>([params.deliveryBoyId.toLowerCase()]);
      if (callingBoy) {
        callingIds.add(callingBoy.id.toLowerCase());
        if (callingBoy.delivery_boy_id) callingIds.add(callingBoy.delivery_boy_id.toLowerCase());
      }

      const assignedIds = new Set<string>([ret.delivery_boy_id.toLowerCase()]);
      if (ret.original_delivery_boy_id) assignedIds.add(ret.original_delivery_boy_id.toLowerCase());
      if (assignedBoy) {
        assignedIds.add(assignedBoy.id.toLowerCase());
        if (assignedBoy.delivery_boy_id) assignedIds.add(assignedBoy.delivery_boy_id.toLowerCase());
      }

      const isAuthorized = Array.from(callingIds).some((id) => assignedIds.has(id));
      if (!isAuthorized) {
        throw new Error(
          `Unauthorized: Delivery associate ${params.deliveryBoyId} is not assigned to this return. Only assigned partner ${ret.delivery_boy_name || ret.delivery_boy_id} can confirm.`
        );
      }
    }

    const isReplace = ret.request_type === 'replace' || (ret.status && ret.status.toLowerCase().includes('replace'));

    // PREVENT DOUBLE STOCK ADDITION (Strict Idempotency Check)
    if ((ret.status === 'Return Completed' || ret.status === 'Replace Completed') && ret.stock_restored) {
      return ret;
    }

    const finalRemark = params.remark?.trim() || (isReplace ? 'Exchange item delivered to customer & original piece received.' : 'Product received from customer.');
    const nowIso = new Date().toISOString();
    const callingBoy = params.deliveryBoyId ? this.getDeliveryBoyById(params.deliveryBoyId) : null;

    ret.status = isReplace ? 'Replace Completed' : 'Return Completed';
    ret.remark = finalRemark;
    ret.return_remark = finalRemark;
    ret.confirmed_by_delivery_boy_id = callingBoy ? callingBoy.id : (params.deliveryBoyId || ret.delivery_boy_id);
    if (callingBoy) {
      ret.delivery_boy_name = callingBoy.name;
    }
    ret.confirmed_at = nowIso;
    ret.completed_at = nowIso;
    ret.accepted_at = ret.accepted_at || nowIso;

    // STOCK RESTORATION / BALANCE — Restores stock only once upon delivery boy confirmation
    if (!ret.stock_restored) {
      const prod = this.getProductById(ret.product_id);
      if (prod) {
        const previousStock = prod.stock;
        // For standard return: stock increases. For replacement: piece exchanged (stock reconciled)
        const newStock = isReplace ? previousStock : (previousStock + ret.quantity);
        if (!isReplace) {
          this.updateProduct(prod.id, {
            stock: newStock,
            status: newStock > 0 && prod.status === 'Out of Stock' ? 'Published' : prod.status,
          });
        }

        // Record traceable inventory log (Admin Stock + Return/Replace Record)
        this.addInventoryLog({
          return_id: ret.return_id,
          order_id: ret.order_id,
          order_item_id: ret.order_item_id,
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          quantity: ret.quantity,
          previous_stock: previousStock,
          new_stock: newStock,
          reason: isReplace ? 'REPLACE' : 'RETURN',
          confirmed_by_delivery_boy_id: callingBoy ? callingBoy.id : (params.deliveryBoyId || ret.delivery_boy_id),
          confirmed_by_delivery_boy_name: callingBoy ? callingBoy.name : (ret.delivery_boy_name || 'Delivery Partner'),
        });

        if (!isReplace) {
          const transactions = this.getStockTransactions();
          const nextNum = transactions.length + 1;
          const txId = `STX-${String(nextNum).padStart(6, '0')}`;
          const newTx: StockTransaction = {
            id: `stx-${Date.now()}-ret`,
            transaction_id: txId,
            product_id: prod.id,
            product_name: prod.name,
            sku: prod.sku,
            category_name: prod.category_name,
            shopkeeper_id: prod.shopkeeper_id || 'ADMIN_MASTER',
            shopkeeper_name: prod.shopkeeper_name || 'Admin Master Store',
            transaction_type: 'RETURN_STOCK_IN',
            quantity: ret.quantity,
            previous_stock: previousStock,
            new_stock: newStock,
            reason: 'Customer Return Completed',
            reference_note: `Restored from Return #${ret.return_id} (Order #${ret.order_id})`,
            performed_by: 'DELIVERY_BOY',
            performed_by_name: callingBoy ? callingBoy.name : (ret.delivery_boy_name || 'Delivery Partner'),
            performed_by_id: callingBoy ? callingBoy.id : (params.deliveryBoyId || ret.delivery_boy_id || ''),
            timestamp: nowIso,
            order_id: ret.order_id,
          };
          transactions.unshift(newTx);
          this.setStorageItem(STORAGE_KEYS.STOCK_TRANSACTIONS, JSON.stringify(transactions));

          if (prod.shopkeeper_id) {
            this.recalculateShopkeeperStats(prod.shopkeeper_id);
          }
        }
      }
      ret.stock_restored = true;
    }

    // Update corresponding item in the order
    const orders = this.getOrders();
    const orderIdx = orders.findIndex((o) => o.order_id === ret.order_id || o.id === ret.order_id);
    if (orderIdx !== -1) {
      const order = orders[orderIdx];
      const item = order.items.find((it) => it.id === ret.order_item_id || it.return_id === ret.return_id);
      if (item) {
        if (isReplace) {
          item.item_status = 'Replace Item';
          item.return_status = 'Replace Completed';
          item.is_replaced = true;
        } else {
          item.item_status = item.final_quantity === 0 ? 'Return Completed' : item.item_status;
          item.return_status = 'Return Completed';
        }
        item.return_remark = finalRemark;
        item.return_completed_at = nowIso;
        item.stock_restored = true;
      }

      // Synchronize order-level bill statistics
      const billCalc = this.getOrderBillCalculation(order);
      order.delivered_items_count = billCalc.total_delivered_quantity;
      order.returned_items_count = billCalc.total_returned_quantity;
      order.replaced_items_count = billCalc.total_replaced_quantity;
      order.final_items_count = billCalc.total_final_quantity;
      order.original_amount = billCalc.original_total;
      order.return_amount = billCalc.total_return_amount;
      order.final_payable_amount = billCalc.final_payable;

      order.updated_at = nowIso;
      order.status_history.push({
        id: `sh-${Date.now()}`,
        order_id: order.order_id,
        status: order.order_status,
        changed_by: callingBoy ? `${callingBoy.name} (Delivery Partner)` : (ret.delivery_boy_name ? `${ret.delivery_boy_name} (Delivery Partner)` : 'Delivery Partner'),
        changed_at: nowIso,
        notes: isReplace
          ? `Delivery associate completed replace item exchange for "${ret.product_name}" (Qty: ${ret.quantity}). Remark: "${finalRemark}". Replace item only shown, bill unchanged.`
          : `Delivery associate confirmed return for "${ret.product_name}" (Qty: ${ret.quantity}). Remark: "${finalRemark}". Restored stock (+${ret.quantity}).`,
      });
      this.setStorageItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }

    this.setStorageItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns));
    notifyDataChanged();
    return ret;
  }

  acceptProductReturn(returnId: string, deliveryBoyId?: string, remark?: string): ProductReturn {
    // Delivery Boy accepts and confirms return
    return this.confirmProductReturn({
      returnId,
      deliveryBoyId: deliveryBoyId || '',
      remark: remark || 'Product received from customer.',
    });
  }

  completeProductReturn(returnId: string, deliveryBoyId?: string, remark?: string): ProductReturn {
    return this.confirmProductReturn({
      returnId,
      deliveryBoyId: deliveryBoyId || '',
      remark: remark || 'Product received from customer.',
    });
  }

  // ===================== INVENTORY AUDIT LOGS =====================
  getInventoryLogs(): InventoryTransaction[] {
    try {
      const data = this.getStorageItem(STORAGE_KEYS.INVENTORY_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  addInventoryLog(log: Omit<InventoryTransaction, 'id' | 'timestamp'>): InventoryTransaction {
    const logs = this.getInventoryLogs();
    const newLog: InventoryTransaction = {
      ...log,
      id: `inv-log-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    this.setStorageItem(STORAGE_KEYS.INVENTORY_LOGS, JSON.stringify(logs));
    return newLog;
  }

  // ===================== DASHBOARD STATS =====================
  getDashboardStats(): DashboardStats {
    const orders = this.getOrders();
    const products = this.getAllProducts();
    const customers = this.getCustomers();

    const todayStr = new Date().toISOString().slice(0, 10);

    let today_orders = 0;
    let today_sales = 0;
    let total_sales = 0;
    let pending_orders = 0;
    let delivered_orders = 0;
    let cancelled_orders = 0;

    orders.forEach((o) => {
      total_sales += o.total;
      if (o.created_at.startsWith(todayStr)) {
        today_orders += 1;
        today_sales += o.total;
      }
      if (o.order_status === 'Pending' || o.order_status === 'Confirmed' || o.order_status === 'Processing') {
        pending_orders += 1;
      } else if (o.order_status === 'Delivered') {
        delivered_orders += 1;
      } else if (o.order_status === 'Cancelled') {
        cancelled_orders += 1;
      }
    });

    const live_products = products.filter((p) => p.status === 'Published').length;
    const published_products = live_products;
    const total_stock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    const out_of_stock_products = products.filter((p) => (Number(p.stock) || 0) <= 0).length;
    const low_stock_products = products.filter((p) => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= 10).length;

    // Top selling products calculation
    const salesCountMap: Record<string, { count: number; revenue: number }> = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        if (!salesCountMap[item.product_id]) {
          salesCountMap[item.product_id] = { count: 0, revenue: 0 };
        }
        const qty = Number(item.quantity) || 1;
        const pr = Number(item.price) || 0;
        salesCountMap[item.product_id].count += qty;
        salesCountMap[item.product_id].revenue += pr * qty;
      });
    });

    const top_products = Object.entries(salesCountMap)
      .map(([prodId, stat]) => {
        const prod = products.find((p) => p.id === prodId);
        return prod
          ? {
              product: prod,
              sales_count: stat.count,
              revenue: stat.revenue,
            }
          : null;
      })
      .filter(Boolean) as DashboardStats['top_products'];

    top_products.sort((a, b) => b.sales_count - a.sales_count);

    // Sales by day (last 7 days)
    const sales_by_day: Array<{ date: string; sales: number; orders: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      const dayOrders = orders.filter((o) => o.created_at && o.created_at.startsWith(dateKey));
      const daySales = dayOrders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
      sales_by_day.push({
        date: label,
        sales: daySales,
        orders: dayOrders.length,
      });
    }

    return {
      today_orders,
      today_sales,
      total_orders: orders.length,
      total_customers: customers.length,
      total_products: products.length,
      live_products,
      published_products,
      total_stock,
      out_of_stock_products,
      low_stock_products,
      pending_orders,
      delivered_orders,
      cancelled_orders,
      total_sales,
      recent_orders: orders.slice(0, 8),
      top_products: top_products.slice(0, 5),
      sales_by_day,
    };
  }

  // ===================== BULK EXCEL IMPORT & TEMPLATE =====================
  generateExcelTemplate(): Uint8Array {
    const templateData: ExcelImportRow[] = [
      {
        'Product Name': "Men's Premium Cotton Denim Jacket",
        'SKU': 'ST1-JKT-1001',
        'Category': 'Jackets',
        'Subcategory': 'Denim Jackets',
        'Brand': 'TRYatHOME Originals',
        'Description': 'Classic rugged trucker jacket made of 100% rigid cotton with copper shank buttons.',
        'MRP': 2999,
        'Selling Price': 1499,
        'Discount': 50,
        'Stock': 50,
        'Size': 'M, L, XL, XXL',
        'Color': 'Washed Blue, Vintage Black',
        'Image URLs': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80, https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
        'Status': 'Draft',
        'Gender': 'Men',
      },
      {
        'Product Name': "Women's High Neck Cashmere Knit Pullover",
        'SKU': 'ST1-SWT-1002',
        'Category': 'Jackets',
        'Subcategory': 'Winter Wear',
        'Brand': 'TRYatHOME Glamour',
        'Description': 'Ultra cozy ribbed knit sweater crafted with cashmere wool blend.',
        'MRP': 2499,
        'Selling Price': 1199,
        'Discount': 52,
        'Stock': 35,
        'Size': 'S, M, L',
        'Color': 'Oatmeal, Sage Green',
        'Image URLs': 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
        'Status': 'Published',
        'Gender': 'Women',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Template');

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
  }

  parseAndValidateExcel(fileBuffer: ArrayBuffer): ExcelValidationResult[] {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

    const existingSkus = new Set(this.getAllProducts().map((p) => p.sku.toUpperCase()));
    const results: ExcelValidationResult[] = [];
    const seenFileSkus = new Set<string>();

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // header is row 1
      const errors: string[] = [];

      const name = String(row['Product Name'] || '').trim();
      const sku = String(row['SKU'] || '').trim().toUpperCase();
      const category = String(row['Category'] || '').trim();
      const mrp = Number(row['MRP']) || 0;
      const selling_price = Number(row['Selling Price']) || 0;
      const stock = Number(row['Stock']) || 0;
      const genderRaw = String(row['Gender'] || 'Men').trim();
      const statusRaw = String(row['Status'] || 'Draft').trim();

      if (!name) errors.push('Missing "Product Name"');
      if (!sku) errors.push('Missing "SKU"');
      if (!category) errors.push('Missing "Category"');
      if (mrp <= 0) errors.push('Invalid MRP (must be > 0)');
      if (selling_price <= 0) errors.push('Invalid Selling Price (must be > 0)');
      if (selling_price > mrp) errors.push('Selling Price cannot exceed MRP');
      if (stock < 0) errors.push('Stock cannot be negative');

      if (sku) {
        if (existingSkus.has(sku)) {
          errors.push(`SKU "${sku}" already exists in the database`);
        }
        if (seenFileSkus.has(sku)) {
          errors.push(`Duplicate SKU "${sku}" found within this spreadsheet`);
        }
        seenFileSkus.add(sku);
      }

      // Parse sizes & colors
      const sizes = row['Size'] ? String(row['Size']).split(',').map((s) => s.trim()) : ['M', 'L', 'XL'];
      const colors = row['Color'] ? String(row['Color']).split(',').map((c) => c.trim()) : ['Default'];
      const rawUrls = String(row['Image URLs'] || '');
      const imageUrls = rawUrls
        ? rawUrls.split(',').map((u) => u.trim()).filter((u) => u.startsWith('http') || u.startsWith('data:'))
        : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'];

      const validGender = ['Men', 'Women', 'Kids', 'Unisex'].includes(genderRaw) ? (genderRaw as any) : 'Men';
      const validStatus = ['Draft', 'Published', 'Unpublished'].includes(statusRaw) ? (statusRaw as any) : 'Draft';

      results.push({
        row_number: rowNum,
        sku: sku || `ROW-${rowNum}`,
        name: name || 'Untitled Item',
        category: category || 'General',
        mrp,
        selling_price,
        stock,
        sizes,
        colors,
        image_urls: imageUrls,
        is_valid: errors.length === 0,
        errors,
        status: validStatus,
        gender: validGender,
      });
    });

    return results;
  }

  commitBulkImport(validatedRows: ExcelValidationResult[], overridePublish = false): { imported: number; failed: number } {
    let imported = 0;
    let failed = 0;
    const categories = this.getCategories();

    validatedRows.forEach((r) => {
      if (!r.is_valid) {
        failed++;
        return;
      }

      // Match category id
      const matchedCat = categories.find(
        (c) => c.name.toLowerCase() === r.category.toLowerCase() || c.slug === r.category.toLowerCase()
      ) || categories[0];

      const images = r.image_urls.map((url, idx) => ({
        id: `img-${Date.now()}-${idx}`,
        image_url: url,
        sort_order: idx + 1,
        is_primary: idx === 0,
        caption: idx === 0 ? 'Front View' : `View ${idx + 1}`,
      }));

      this.addProduct({
        sku: r.sku,
        name: r.name,
        category_id: matchedCat.id,
        category_name: matchedCat.name,
        gender: r.gender,
        mrp: r.mrp,
        selling_price: r.selling_price,
        stock: r.stock,
        sizes: r.sizes,
        colors: r.colors,
        images,
        status: overridePublish ? 'Published' : r.status,
      });

      imported++;
    });

    return { imported, failed };
  }

  // ===================== DELIVERY BOY ITEM & RETURN MANAGEMENT =====================
  getDeliveryBoyManagementDetails(deliveryBoyId: string): DeliveryBoyDetailedManagement | null {
    const boy = this.getDeliveryBoyById(deliveryBoyId);
    if (!boy) return null;

    const validIds = new Set<string>([boy.id.toLowerCase()]);
    if (boy.delivery_boy_id) validIds.add(boy.delivery_boy_id.toLowerCase());
    if (boy.mobile) validIds.add(boy.mobile.toLowerCase());

    const allOrders = this.getOrders();
    const allReturns = this.getProductReturns();

    // 1. Delivered orders & items
    const deliveredOrdersList: DeliveryBoyDetailedManagement['delivered_orders'] = [];
    let totalItemsDelivered = 0;
    let totalCodCashCollected = 0;
    let totalPrepaidAmount = 0;
    let latestDeliveredAt: string | undefined = undefined;

    allOrders.forEach((o) => {
      const assignedId = (o.assigned_delivery_boy_id || '').toLowerCase();
      const origId = (o.original_delivery_boy_id || '').toLowerCase();
      const isAssigned = validIds.has(assignedId) || validIds.has(origId);

      if (isAssigned && o.order_status === 'Delivered') {
        // Find exact delivery timestamp from status history or updated_at
        const deliveredHistory = (o.status_history || [])
          .slice()
          .reverse()
          .find((sh) => sh.status === 'Delivered');
        const deliveryTimestamp = deliveredHistory?.changed_at || o.updated_at || o.created_at;

        if (!latestDeliveredAt || new Date(deliveryTimestamp) > new Date(latestDeliveredAt)) {
          latestDeliveredAt = deliveryTimestamp;
        }

        const validItems = (o.items || []).filter((it) => it.item_status !== 'Cancelled');
        const orderDeliveredQty = validItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
        totalItemsDelivered += orderDeliveredQty;

        const payable = this.getOrderPayableAmount(o);
        if (o.payment_method === 'COD') {
          totalCodCashCollected += payable;
        } else {
          totalPrepaidAmount += payable;
        }

        deliveredOrdersList.push({
          order_id: o.order_id,
          invoice_number: o.invoice_number || `INV-${o.order_id.replace(/^ORD-/, '')}`,
          delivered_at: deliveryTimestamp,
          customer_name: o.customer_name || o.address?.name || 'Customer',
          customer_mobile: o.mobile || o.address?.mobile || '',
          customer_address: `${o.address?.address || ''}, ${o.address?.city || ''} - ${o.address?.pincode || ''}`,
          customer_city: o.address?.city || 'Bengaluru',
          total_items_count: orderDeliveredQty,
          items: validItems.map((it) => ({
            id: it.id,
            product_id: it.id,
            product_name: it.product_name,
            image_url: it.image_url,
            size: it.size,
            color: it.color,
            quantity: Number(it.quantity) || 1,
            price: Number(it.price) || 0,
          })),
          payable_amount: payable,
          total_amount: payable,
          payment_method: o.payment_method || 'COD',
          payment_status: o.payment_status || 'PAID',
        });
      }
    });

    // Sort delivered orders latest first
    deliveredOrdersList.sort((a, b) => new Date(b.delivered_at).getTime() - new Date(a.delivered_at).getTime());

    // 2. Returned items
    const returnedItemsList: DeliveryBoyDetailedManagement['returned_items'] = [];
    let totalItemsReturned = 0;
    let totalReturnRefundAmount = 0;
    let latestReturnAt: string | undefined = undefined;

    allReturns.forEach((r) => {
      const dId = (r.delivery_boy_id || '').toLowerCase();
      const origId = (r.original_delivery_boy_id || '').toLowerCase();
      const confId = (r.confirmed_by_delivery_boy_id || '').toLowerCase();
      const isReturnAssigned = validIds.has(dId) || validIds.has(origId) || validIds.has(confId);

      if (isReturnAssigned) {
        const returnTimestamp = r.confirmed_at || r.completed_at || r.requested_at || r.created_at || new Date().toISOString();
        if (!latestReturnAt || new Date(returnTimestamp) > new Date(latestReturnAt)) {
          latestReturnAt = returnTimestamp;
        }

        const qty = Number(r.quantity) || 1;
        totalItemsReturned += qty;
        totalReturnRefundAmount += Number(r.return_amount) || 0;

        returnedItemsList.push({
          id: r.return_id || r.id || `ret-${Date.now()}`,
          return_id: r.return_id || r.id || `ret-${Date.now()}`,
          order_id: r.order_id,
          invoice_number: r.invoice_number || `INV-${r.order_id.replace(/^ORD-/, '')}`,
          returned_at: returnTimestamp,
          customer_name: r.customer_name,
          customer_mobile: r.customer_mobile,
          product_name: r.product_name || r.item_name || 'Product',
          item_name: r.product_name || r.item_name || 'Product',
          size: r.size || r.item_size,
          quantity: qty,
          return_amount: Number(r.return_amount) || 0,
          reason: r.reason || 'Customer Return',
          remark: r.remark || r.return_remark || '',
          status: r.status,
        });
      }
    });

    // Sort returned items latest first
    returnedItemsList.sort((a, b) => new Date(b.returned_at).getTime() - new Date(a.returned_at).getTime());

    // Active assigned orders
    const activeAssignedCount = allOrders.filter((o) => {
      const assignedId = (o.assigned_delivery_boy_id || '').toLowerCase();
      return validIds.has(assignedId) && o.order_status !== 'Delivered' && o.order_status !== 'Cancelled';
    }).length;

    let latestActive = latestDeliveredAt;
    if (latestReturnAt && (!latestActive || new Date(latestReturnAt) > new Date(latestActive))) {
      latestActive = latestReturnAt;
    }

    const returnRate = totalItemsDelivered > 0 ? (totalItemsReturned / totalItemsDelivered) * 100 : 0;

    return {
      delivery_boy_id: boy.delivery_boy_id || boy.id,
      id: boy.id,
      name: boy.name,
      delivery_boy_name: boy.name,
      mobile: boy.mobile,
      vehicle_number: boy.vehicle_number || '',
      vehicle_type: boy.vehicle_type || 'Motorcycle',
      city: boy.city || boy.assigned_area || 'Bengaluru',
      status: boy.status,
      total_orders_delivered: deliveredOrdersList.length,
      total_items_delivered: totalItemsDelivered,
      total_return_pickups: returnedItemsList.length,
      total_items_returned: totalItemsReturned,
      total_cod_cash_collected: totalCodCashCollected,
      total_prepaid_amount_delivered: totalPrepaidAmount,
      total_return_refund_amount: totalReturnRefundAmount,
      return_rate_percentage: Math.round(returnRate * 10) / 10,
      active_assigned_orders_count: activeAssignedCount,
      last_delivery_at: latestDeliveredAt,
      last_return_at: latestReturnAt,
      last_active_at: latestActive,
      delivered_orders: deliveredOrdersList,
      returned_items: returnedItemsList,
    };
  }

  getAllDeliveryBoysManagementDetails(): DeliveryBoyDetailedManagement[] {
    const boys = this.getDeliveryBoys();
    return boys.map((b) => this.getDeliveryBoyManagementDetails(b.id)).filter(Boolean) as DeliveryBoyDetailedManagement[];
  }

  // ===================== STOREWIDE REAL-TIME SUBSCRIPTION =====================
  subscribe(listener: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = () => listener();
    window.addEventListener('style1_data_changed', handler);
    return () => {
      window.removeEventListener('style1_data_changed', handler);
    };
  }

  // ===================== SHOPKEEPER CONVENIENCE ALIASES =====================
  getProductsByShopkeeper(shopkeeperId: string): Product[] {
    return this.getShopkeeperProducts(shopkeeperId);
  }

  getStockTransactionsByShopkeeper(shopkeeperId: string): StockTransaction[] {
    return this.getShopkeeperStockTransactions(shopkeeperId);
  }

  shopkeeperAddProduct(shopkeeperId: string, data: any): Product {
    return this.addShopkeeperProduct(shopkeeperId, data);
  }

  approveProduct(productId: string): Product {
    return this.adminApproveProduct(productId, 'adm-1', 'Admin');
  }

  rejectProduct(productId: string, reason?: string): Product {
    return this.adminRejectProduct(productId, reason || 'Disapproved', 'adm-1', 'Admin');
  }

  toggleProductLive(productId: string, isLive: boolean): Product {
    return this.adminSetProductLive(productId, isLive);
  }

  shopkeeperStockIn(shopkeeperId: string, productId: string, quantity: number, notes?: string): { success: boolean; error?: string } {
    try {
      const shop = this.getShopkeeperById(shopkeeperId);
      this.performStockIn({
        productId,
        quantity,
        referenceNote: notes || 'Stock inward refilled by merchant',
        performedBy: {
          role: 'SHOPKEEPER',
          id: shopkeeperId,
          name: shop?.name || 'Shopkeeper',
        },
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to stock in' };
    }
  }

  shopkeeperStockOut(shopkeeperId: string, productId: string, quantity: number, reason?: string): { success: boolean; error?: string } {
    try {
      const shop = this.getShopkeeperById(shopkeeperId);
      this.performStockOut({
        productId,
        quantity,
        reason: reason || 'Merchant stock outward',
        referenceNote: reason,
        performedBy: {
          role: 'SHOPKEEPER',
          id: shopkeeperId,
          name: shop?.name || 'Shopkeeper',
        },
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to stock out' };
    }
  }

  // ----------------------------------------------------------------------
  // PRODUCT REVIEWS & 5-STAR RATINGS SYSTEM
  // ----------------------------------------------------------------------

  getAllReviews(): ProductReview[] {
    const raw = this.getStorageItem(STORAGE_KEYS.REVIEWS);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ProductReview[];
    } catch {
      return [];
    }
  }

  getProductReviews(productId: string): ProductReview[] {
    return this.getAllReviews().filter((r) => r.product_id === productId);
  }

  getCustomerReviews(customerIdOrMobile: string): ProductReview[] {
    const cust = this.getCustomers().find(
      (c) => c.customer_id === customerIdOrMobile || c.id === customerIdOrMobile || c.mobile === customerIdOrMobile
    );
    const cleanMobile = cust ? (cust.mobile || '').replace(/\D/g, '').slice(-10) : customerIdOrMobile.replace(/\D/g, '').slice(-10);

    return this.getAllReviews().filter((r) => {
      if (r.customer_id === customerIdOrMobile) return true;
      if (cust && (r.customer_id === cust.customer_id || r.customer_id === cust.id)) return true;
      if (cleanMobile && r.customer_mobile && r.customer_mobile.replace(/\D/g, '').slice(-10) === cleanMobile) return true;
      return false;
    });
  }

  getOrderReviews(orderId: string): ProductReview[] {
    return this.getAllReviews().filter((r) => r.order_id === orderId);
  }

  getProductRatingStats(productId: string): ProductRatingStats {
    const reviews = this.getProductReviews(productId);
    const total = reviews.length;
    const star_counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (total === 0) {
      const prod = this.getProductById(productId);
      const defaultRating = prod?.rating ? Number(prod.rating) : 5.0;
      return {
        average_rating: defaultRating,
        total_reviews: 0,
        star_counts,
        star_percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }
    let sum = 0;
    reviews.forEach((r) => {
      const stars = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5))) as 1 | 2 | 3 | 4 | 5;
      star_counts[stars] = (star_counts[stars] || 0) + 1;
      sum += Number(r.rating) || 5;
    });
    const avg = Math.round((sum / total) * 10) / 10;
    const star_percentages = {
      5: Math.round((star_counts[5] / total) * 100),
      4: Math.round((star_counts[4] / total) * 100),
      3: Math.round((star_counts[3] / total) * 100),
      2: Math.round((star_counts[2] / total) * 100),
      1: Math.round((star_counts[1] / total) * 100),
    };
    return {
      average_rating: avg,
      total_reviews: total,
      star_counts,
      star_percentages,
    };
  }

  checkCustomerReviewEligibility(productId: string, customerId?: string): {
    isEligible: boolean;
    reason?: string;
    eligibleOrders: Order[];
    existingReview?: ProductReview | null;
  } {
    const cust = customerId
      ? this.getCustomers().find((c) => c.customer_id === customerId || c.id === customerId)
      : this.getCurrentCustomer();
    if (!cust) {
      return {
        isEligible: false,
        reason: 'Please log in to your account to review this product.',
        eligibleOrders: [],
        existingReview: null,
      };
    }

    const allReviews = this.getAllReviews();
    const existing = allReviews.find(
      (r) => (r.customer_id === cust.customer_id || r.customer_id === cust.id) && r.product_id === productId
    );

    if (existing) {
      return {
        isEligible: false,
        reason: 'You have already submitted a review for this garment. Reviews are locked after submission.',
        eligibleOrders: [],
        existingReview: existing,
      };
    }

    const allOrders = this.getOrders();
    const eligibleOrders = allOrders.filter((ord) => {
      const isCust = ord.customer_id === cust.customer_id || ord.customer_id === cust.id || ord.mobile === cust.mobile;
      if (!isCust) return false;

      // Must be locked / final billing confirmed or delivered
      const isLocked = ord.final_bill_locked === true || ord.final_bill_generated === true || ord.order_status === 'Delivered';
      if (!isLocked) return false;

      // Must have this product in items and not fully cancelled/returned
      const hasProduct = ord.items.some(
        (it) => it.product_id === productId && it.item_status !== 'Cancelled' && it.return_status !== 'Return Completed'
      );
      return hasProduct;
    });

    if (eligibleOrders.length === 0) {
      return {
        isEligible: false,
        reason: 'Reviews are available exclusively to verified buyers with completed billing and delivery.',
        eligibleOrders: [],
        existingReview: null,
      };
    }

    return {
      isEligible: true,
      eligibleOrders,
      existingReview: null,
    };
  }

  recalculateProductRating(productId: string): void {
    const reviews = this.getProductReviews(productId);
    const count = reviews.length;
    let avg = 5.0;
    if (count > 0) {
      const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
      avg = Math.round((sum / count) * 10) / 10;
    }
    const products = this.getAllProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx !== -1) {
      products[idx].rating = avg;
      products[idx].rating_count = count;
      this.setStorageItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      supabaseUpdateProduct(productId, { rating: avg, rating_count: count });
    }
  }

  saveProductReview(data: {
    productId: string;
    orderId: string;
    orderItemId?: string;
    customerId: string;
    customerName: string;
    customerMobile?: string;
    rating: number;
    reviewTitle?: string;
    reviewText: string;
  }): ProductReview {
    const reviews = this.getAllReviews();
    const prod = this.getProductById(data.productId);
    const existingIndex = reviews.findIndex(
      (r) =>
        r.product_id === data.productId &&
        (r.customer_id === data.customerId || r.order_id === data.orderId)
    );

    let savedReview: ProductReview;
    if (existingIndex !== -1) {
      savedReview = {
        ...reviews[existingIndex],
        rating: Math.max(1, Math.min(5, data.rating)),
        review_title: data.reviewTitle || reviews[existingIndex].review_title || '',
        review_text: data.reviewText,
        customer_name: data.customerName || reviews[existingIndex].customer_name,
        customer_mobile: data.customerMobile || reviews[existingIndex].customer_mobile,
        product_name: prod?.name || reviews[existingIndex].product_name,
        updated_at: new Date().toISOString(),
      };
      reviews[existingIndex] = savedReview;
    } else {
      savedReview = {
        id: generateUUID(),
        product_id: data.productId,
        product_name: prod?.name || 'Product',
        order_id: data.orderId,
        order_item_id: data.orderItemId,
        customer_id: data.customerId,
        customer_name: data.customerName,
        customer_mobile: data.customerMobile,
        rating: Math.max(1, Math.min(5, data.rating)),
        review_title: data.reviewTitle || '',
        review_text: data.reviewText,
        is_verified_purchase: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      reviews.unshift(savedReview);
    }

    this.setStorageItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    this.recalculateProductRating(data.productId);
    notifyDataChanged();
    supabaseSaveReview(savedReview);
    return savedReview;
  }

  async saveProductReviewAsync(data: {
    productId: string;
    orderId: string;
    orderItemId?: string;
    customerId: string;
    customerName: string;
    customerMobile?: string;
    rating: number;
    reviewTitle?: string;
    reviewText: string;
  }): Promise<ProductReview> {
    const review = this.saveProductReview(data);
    await supabaseSaveReview(review);
    return review;
  }

  deleteProductReview(reviewId: string): boolean {
    const reviews = this.getAllReviews();
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) return false;

    const updated = reviews.filter((r) => r.id !== reviewId);
    this.setStorageItem(STORAGE_KEYS.REVIEWS, JSON.stringify(updated));
    this.recalculateProductRating(target.product_id);
    notifyDataChanged();
    supabaseDeleteReview(reviewId);
    return true;
  }

  async deleteProductReviewAsync(reviewId: string): Promise<boolean> {
    const target = this.getAllReviews().find((r) => r.id === reviewId);
    const res = this.deleteProductReview(reviewId);
    if (res && target) {
      await supabaseDeleteReview(reviewId);
    }
    return res;
  }

  // Reset/Seed demo data helper
  resetToDemoData() {
    this.removeStorageItem(STORAGE_KEYS.PRODUCTS);
    this.removeStorageItem(STORAGE_KEYS.CATEGORIES);
    this.removeStorageItem(STORAGE_KEYS.ORDERS);
    this.removeStorageItem(STORAGE_KEYS.CUSTOMERS);
    this.initDatabase();
    notifyDataChanged();
  }
}

export const db = new DatabaseService();
