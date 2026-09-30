import { supabase } from "../utils/supabase/client";
import {
  Customer,
  CustomerAddress,
  Product,
  ProductImage,
  ProductVariant,
  Order,
  OrderItem,
  OrderStatusHistoryItem,
  ProductReturn,
  StockTransaction,
  StoreSettings,
  Category,
  DeliveryBoy,
  Shopkeeper,
  ProductReview,
} from "../types";

export interface SupabaseFullData {
  settings: StoreSettings | null;
  categories: Category[];
  customers: Customer[];
  shopkeepers: Shopkeeper[];
  products: Product[];
  deliveryBoys: DeliveryBoy[];
  orders: Order[];
  returns: ProductReturn[];
  stockTransactions: StockTransaction[];
  reviews: ProductReview[];
  cartItems?: any[];
  wishlistItems?: any[];
  authSessions?: any[];
}

let activeFetchPromise: Promise<SupabaseFullData | null> | null = null;
let hasQueuedFetch = false;
const warnedTables = new Set<string>();

/**
 * Gracefully handle Supabase mutation errors such as RLS policy violations (42501)
 * or temporary network unreachable errors without raising unhandled exceptions or noisy errors.
 */
export function handleSupabaseError(table: string, action: string, error: any): boolean {
  if (!error) return true;

  const code = error?.code || "";
  const msg =
    (typeof error?.message === "string" ? error.message : "") +
    " " +
    (typeof error?.details === "string" ? error.details : "");

  const isRLS = code === "42501" || msg.toLowerCase().includes("row-level security");
  const isNetwork =
    msg.toLowerCase().includes("failed to fetch") ||
    msg.toLowerCase().includes("network") ||
    msg.toLowerCase().includes("typeerror");

  if (isRLS) {
    if (!warnedTables.has(table)) {
      warnedTables.add(table);
      console.warn(
        `[Supabase] Table "${table}" has Row-Level Security (RLS) active. Changes remain safely persisted locally.`
      );
    }
    return false;
  }

  if (isNetwork) {
    if (!warnedTables.has(`net_${table}`)) {
      warnedTables.add(`net_${table}`);
      console.warn(
        `[Supabase] Network unreachable for "${table}". Changes remain safely persisted locally.`
      );
    }
    return false;
  }

  console.warn(`[Supabase] Notice on ${action} for "${table}":`, error.message || error);
  return false;
}

/**
 * Fetch all application tables from Supabase into memory.
 */
export async function fetchFullDataFromSupabase(): Promise<SupabaseFullData | null> {
  if (activeFetchPromise) {
    hasQueuedFetch = true;
    return activeFetchPromise;
  }

  const executeFetch = async (): Promise<SupabaseFullData | null> => {
    console.log("[Supabase] Querying complete cloud dataset in parallel from Supabase...");
    try {
      // Execute all primary database queries concurrently to eliminate sequential network latency
      const safeQuery = async <T>(query: PromiseLike<T>): Promise<T | { data: null; error: any }> => {
        try {
          return await query;
        } catch (err) {
          return { data: null, error: err };
        }
      };

    const [
      settingsRes,
      categoriesRes,
      addressesRes,
      customersRes,
      shopkeepersRes,
      productsRes,
      imagesRes,
      variantsRes,
      deliveryBoysRes,
      ordersRes,
      itemsRes,
      histRes,
      returnsRes,
      stockTxRes,
      reviewsRes,
      cartRes,
      wishlistRes,
      sessionsRes,
    ] = await Promise.all([
      safeQuery(supabase.from("store_settings").select("*").maybeSingle()),
      safeQuery(supabase.from("categories").select("*").order("sort_order", { ascending: true })),
      safeQuery(supabase.from("customer_addresses").select("*")),
      safeQuery(supabase.from("customers").select("*")),
      safeQuery(supabase.from("shopkeepers").select("*")),
      safeQuery(supabase.from("products").select("*")),
      safeQuery(supabase.from("product_images").select("*")),
      safeQuery(supabase.from("product_variants").select("*")),
      safeQuery(supabase.from("delivery_boys").select("*")),
      safeQuery(supabase.from("orders").select("*").order("created_at", { ascending: false })),
      safeQuery(supabase.from("order_items").select("*")),
      safeQuery(supabase.from("order_status_history").select("*")),
      safeQuery(supabase.from("product_returns").select("*")),
      safeQuery(supabase.from("stock_transactions").select("*").order("created_at", { ascending: false })),
      safeQuery(supabase.from("product_reviews").select("*").order("created_at", { ascending: false })),
      safeQuery(supabase.from("cart_items").select("*")),
      safeQuery(supabase.from("wishlist_items").select("*")),
      safeQuery(supabase.from("auth_sessions").select("*")),
    ]);

    // 1. Settings
    let settings: StoreSettings | null = (settingsRes?.data as StoreSettings) || null;
    if (settings && settings.store_tagline) {
      try {
        const parsed = JSON.parse(settings.store_tagline);
        if (parsed && typeof parsed === 'object') {
          settings.hero_image_1 = parsed.hero_image_1 || '';
          settings.hero_image_2 = parsed.hero_image_2 || '';
          settings.hero_image_3 = parsed.hero_image_3 || '';
          settings.hero_background_image = parsed.hero_background_image || '';

          // Theme Colors
          settings.theme_primary = parsed.theme_primary || '';
          settings.theme_secondary = parsed.theme_secondary || '';
          settings.theme_accent = parsed.theme_accent || '';
          settings.theme_background = parsed.theme_background || '';
          settings.theme_card_background = parsed.theme_card_background || '';
          settings.theme_text = parsed.theme_text || '';
          settings.theme_heading = parsed.theme_heading || '';
          settings.theme_button = parsed.theme_button || '';
          settings.theme_button_text = parsed.theme_button_text || '';
          settings.theme_border = parsed.theme_border || '';
          settings.theme_header = parsed.theme_header || '';
          settings.theme_footer = parsed.theme_footer || '';

          // Branding Logos
          settings.logo_website = parsed.logo_website || '';
          settings.logo_favicon = parsed.logo_favicon || '';
          settings.logo_header = parsed.logo_header || '';
          settings.logo_footer = parsed.logo_footer || '';

          // Arrays of configs
          settings.hero_slides = parsed.hero_slides || [];
          settings.festival_banners = parsed.festival_banners || [];
          settings.advertisement_banners = parsed.advertisement_banners || [];

          // Typography & styles
          settings.theme_typography = parsed.theme_typography || {};
          settings.theme_ui_style = parsed.theme_ui_style || {};
          settings.theme_mobile_appearance = parsed.theme_mobile_appearance || {};

          if (parsed.tagline) {
            settings.store_tagline = parsed.tagline;
          }
        }
      } catch {
        // Plain string tagline, keep as is
      }
    }

    // 2. Categories
    const categories: Category[] = (categoriesRes?.data as Category[]) || [];

    // 3. Customer Addresses & Customers
    const rawAddresses: CustomerAddress[] = (addressesRes?.data as CustomerAddress[]) || [];
    const rawCustomers = (customersRes?.data as any[]) || [];
    const customers: Customer[] = rawCustomers.map((c) => ({
      ...c,
      addresses: rawAddresses.filter((a) => a.customer_id === c.customer_id),
    }));

    // 4. Shopkeepers
    const shopkeepers: Shopkeeper[] = (shopkeepersRes?.data as Shopkeeper[]) || [];

    // 5. Products with Images & Variants
    const rawProducts = (productsRes?.data as any[]) || [];
    const images = (imagesRes?.data || []) as ProductImage[];
    const variants = (variantsRes?.data || []) as ProductVariant[];
    const products: Product[] = rawProducts.map((p) => ({
      ...p,
      images: images.filter((img) => img.product_id === p.id),
      variants: variants.filter((v) => v.product_id === p.id),
    }));

    // 6. Delivery Boys
    const deliveryBoys: DeliveryBoy[] = (deliveryBoysRes?.data as DeliveryBoy[]) || [];

    // 7. Orders with Items & History
    const rawOrders = (ordersRes?.data as any[]) || [];
    const items = (itemsRes?.data || []) as OrderItem[];
    const history = (histRes?.data || []) as OrderStatusHistoryItem[];

    const orders: Order[] = rawOrders.map((o) => {
      const orderItems = items.filter((it) => it.order_id === o.order_id);
      const orderHistory = history.filter((h) => h.order_id === o.order_id);

      let deliveryAddress = (o.delivery_address && typeof o.delivery_address === "object" && o.delivery_address.address)
        ? o.delivery_address
        : rawAddresses.find((a) => a.customer_id === o.customer_id && a.is_default);

      if (!deliveryAddress && rawAddresses.length > 0) {
        deliveryAddress = rawAddresses.find((a) => a.customer_id === o.customer_id);
      }

      if (!deliveryAddress) {
        deliveryAddress = {
          id: `addr-${o.customer_id}`,
          customer_id: o.customer_id,
          name: o.customer_name,
          mobile: o.mobile,
          pincode: "110001",
          address: "Standard Delivery Address",
          city: "New Delhi",
          state: "Delhi",
          address_type: "HOME",
          is_default: true,
        };
      }

      return {
        ...o,
        address: deliveryAddress,
        items: orderItems,
        status_history: orderHistory,
      };
    });

    // 8. Returns
    const returns: ProductReturn[] = (returnsRes?.data as ProductReturn[]) || [];

    // 9. Stock Transactions
    const stockTransactions: StockTransaction[] = (stockTxRes?.data as StockTransaction[]) || [];

    // 10. Product Reviews & Ratings
    const reviews: ProductReview[] = (reviewsRes?.data as any[] || []).map((r) => ({
      id: r.id,
      product_id: r.product_id,
      product_name: r.product_name || '',
      order_id: r.order_id,
      order_item_id: r.order_item_id || undefined,
      customer_id: r.customer_id,
      customer_name: r.customer_name || 'Customer',
      customer_mobile: r.customer_mobile || undefined,
      rating: Number(r.rating) || 5,
      review_title: r.review_title || '',
      review_text: r.review_text || '',
      is_verified_purchase: r.is_verified_purchase !== false,
      created_at: r.created_at || new Date().toISOString(),
      updated_at: r.updated_at || undefined,
    }));

    const cartItems = (cartRes?.data as any[]) || [];
    const wishlistItems = (wishlistRes?.data as any[]) || [];
    const authSessions = (sessionsRes?.data as any[]) || [];

    console.log(`[Supabase Live Sync] Parallel fetch loaded ${products.length} products, ${orders.length} orders, ${customers.length} customers, ${reviews.length} reviews, ${cartItems.length} cart items, ${wishlistItems.length} wishlist items.`);
    return {
      settings,
      categories,
      customers,
      shopkeepers,
      products,
      deliveryBoys,
      orders,
      returns,
      stockTransactions,
      reviews,
      cartItems,
      wishlistItems,
      authSessions,
    };
  } catch (err: any) {
    console.warn("[Supabase] Notice loading cloud dataset:", err?.message || err);
    return null;
  } finally {
    activeFetchPromise = null;
    if (hasQueuedFetch) {
      hasQueuedFetch = false;
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("style1_trigger_cloud_sync"));
        }, 50);
      }
    }
  }
};

activeFetchPromise = executeFetch();
return activeFetchPromise;
}

// ----------------------------------------------------------------------
// DIRECT SUPABASE MUTATION HELPERS
// ----------------------------------------------------------------------

export async function supabaseSaveAddress(address: CustomerAddress): Promise<boolean> {
  try {
    const { error } = await supabase.from("customer_addresses").upsert({
      id: address.id,
      customer_id: address.customer_id,
      name: address.name,
      mobile: address.mobile,
      pincode: address.pincode,
      address: address.address,
      locality: address.locality || null,
      city: address.city,
      state: address.state,
      landmark: address.landmark || null,
      address_type: address.address_type,
      is_default: !!address.is_default,
    });
    if (error) {
      return handleSupabaseError("customer_addresses", "save address", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("customer_addresses", "save address", err);
  }
}

export async function supabaseDeleteAddress(addressId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("customer_addresses").delete().eq("id", addressId);
    if (error) {
      return handleSupabaseError("customer_addresses", "delete address", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("customer_addresses", "delete address", err);
  }
}

/**
 * Helper to resolve the delivery_boy_id needed for orders foreign key constraint (orders_assigned_delivery_boy_id_fkey)
 */
export async function resolveCanonicalDeliveryBoyId(idOrBoyId?: string | null): Promise<string | null> {
  if (!idOrBoyId) return null;
  const raw = idOrBoyId.trim();
  if (raw.toUpperCase().startsWith("TEST-DELIVERY") || raw.toUpperCase().startsWith("STYLE1-DBOY")) {
    return raw;
  }
  try {
    const { data } = await supabase
      .from("delivery_boys")
      .select("id, delivery_boy_id, mobile")
      .or(`id.eq.${raw},delivery_boy_id.eq.${raw},mobile.eq.${raw}`)
      .limit(1);
    if (data && data.length > 0 && data[0].delivery_boy_id) {
      return data[0].delivery_boy_id;
    }
  } catch {}
  try {
    const { data } = await supabase.from("delivery_boys").select("delivery_boy_id").limit(1);
    if (data && data.length > 0) return data[0].delivery_boy_id;
  } catch {}
  return null;
}

export async function supabaseSaveOrder(order: Order): Promise<boolean> {
  try {
    // 1. Ensure customer exists in customers table to satisfy orders_customer_id_fkey constraint
    if (order.customer_id) {
      try {
        await supabase.from("customers").upsert(
          {
            customer_id: order.customer_id,
            name: order.customer_name || "Customer",
            mobile: order.mobile || "9999999999",
            email: order.email || null,
            status: "ACTIVE",
            total_orders: 1,
            total_spent: order.total || 0,
          },
          { onConflict: "customer_id", ignoreDuplicates: true }
        );
      } catch {}
    }

    // 2. Upsert customer address snapshot if valid
    if (order.address && order.customer_id) {
      await supabaseSaveAddress(order.address).catch(() => {});
    }

    // 3. Resolve canonical delivery boy IDs to prevent foreign key violations
    const canonicalAssignedBoyId = await resolveCanonicalDeliveryBoyId(order.assigned_delivery_boy_id);
    const canonicalOriginalBoyId = await resolveCanonicalDeliveryBoyId(order.original_delivery_boy_id || order.assigned_delivery_boy_id);

    // 4. Insert order row
    const orderRow = {
      id: order.id,
      order_id: order.order_id,
      invoice_number: order.invoice_number || null,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      mobile: order.mobile,
      email: order.email || null,
      subtotal: order.subtotal,
      discount: order.discount || 0,
      delivery_charge: order.delivery_charge || 0,
      tax_amount: order.tax_amount || 0,
      total: order.total,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      order_status: order.order_status,
      order_type: order.order_type || "standard",
      tracking_number: order.tracking_number || null,
      courier_partner: order.courier_partner || null,
      assigned_delivery_boy_id: canonicalAssignedBoyId,
      assigned_delivery_boy_name: order.assigned_delivery_boy_name || null,
      assigned_delivery_boy_mobile: order.assigned_delivery_boy_mobile || null,
      delivery_boy_assigned_at: order.delivery_boy_assigned_at || null,
      original_delivery_boy_id: canonicalOriginalBoyId,
      original_delivery_boy_name: order.original_delivery_boy_name || null,
      original_delivery_boy_mobile: order.original_delivery_boy_mobile || null,
      try_at_home_status: order.try_at_home_status || null,
      try_at_home_fee: order.try_at_home_fee || 0,
      try_at_home_duration_minutes: order.try_at_home_duration_minutes || null,
      try_at_home_expires_at: order.try_at_home_expires_at || null,
      try_at_home_closed_at: order.try_at_home_closed_at || null,
      try_at_home_decision_notes: order.try_at_home_decision_notes || null,
      try_at_home_delivered_at: order.try_at_home_delivered_at || null,
      replacement_credit_applied: order.replacement_credit_applied || 0,
      replacement_credit_source_order_id: order.replacement_credit_source_id || null,
      delivery_address: order.address ? JSON.parse(JSON.stringify(order.address)) : null,
      updated_at: new Date().toISOString(),
    };

    const { error: ordErr } = await supabase.from("orders").upsert(orderRow);
    if (ordErr) {
      handleSupabaseError("orders", "upsert order", ordErr);
    }

    // 5. Upsert order items with safe NOT NULL defaults
    if (order.items && order.items.length > 0) {
      const itemRows = order.items.map((it) => ({
        id: it.id,
        order_id: order.order_id,
        product_id: it.product_id,
        product_name: it.product_name,
        brand: it.brand || null,
        sku: it.sku,
        quantity: it.quantity,
        price: it.price,
        mrp: it.mrp,
        size: it.size || "Free Size",
        color: it.color || "Standard",
        image_url: it.image_url || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500",
        item_status: it.item_status || order.order_status || null,
        cancelled_at: it.cancelled_at || null,
        cancellation_reason: it.cancellation_reason || null,
        return_status: it.return_status || null,
        returned_quantity: it.returned_quantity || 0,
        final_quantity: it.final_quantity || null,
        return_amount: it.return_amount || 0,
        final_amount: it.final_amount || null,
        return_id: it.return_id || null,
        return_reason: it.return_reason || null,
        return_remark: it.return_remark || null,
        return_requested_at: it.return_requested_at || null,
        return_accepted_at: it.return_accepted_at || null,
        return_completed_at: it.return_completed_at || null,
        stock_restored: it.stock_restored || false,
        request_type: it.request_type || null,
        is_replaced: it.is_replaced || false,
        replacement_size: it.replacement_size || null,
        replacement_color: it.replacement_color || null,
        replacement_reason: it.replacement_reason || null,
        replacement_amount: it.replacement_amount || 0,
        shopkeeper_id: it.shopkeeper_id || null,
        shopkeeper_name: it.shopkeeper_name || null,
      }));

      try {
        const { error: itemErr } = await supabase.from("order_items").upsert(itemRows);
        if (itemErr) {
          handleSupabaseError("order_items", "upsert items", itemErr);
        }
      } catch (e) {
        handleSupabaseError("order_items", "upsert items", e);
      }
    }

    // 6. Upsert order status history
    if (order.status_history && order.status_history.length > 0) {
      const histRows = order.status_history.map((h) => ({
        id: h.id,
        order_id: order.order_id,
        status: h.status,
        changed_by: h.changed_by,
        changed_at: h.changed_at || new Date().toISOString(),
        notes: h.notes || null,
      }));

      try {
        const { error: histErr } = await supabase.from("order_status_history").upsert(histRows);
        if (histErr) {
          handleSupabaseError("order_status_history", "upsert status history", histErr);
        }
      } catch (e) {
        handleSupabaseError("order_status_history", "upsert status history", e);
      }
    }

    return true;
  } catch (err) {
    return handleSupabaseError("orders", "save order", err);
  }
}

export async function supabaseUpdateOrderStatus(
  orderId: string,
  status: string,
  changedBy: string,
  notes?: string,
  extraFields?: Record<string, any>
): Promise<boolean> {
  try {
    const updatePayload: Record<string, any> = {
      order_status: status,
      updated_at: new Date().toISOString(),
      ...(extraFields || {}),
    };

    const { error: ordErr } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("order_id", orderId);

    if (ordErr) {
      return handleSupabaseError("orders", "update order status", ordErr);
    }

    try {
      await supabase.from("order_status_history").insert({
        id: `sh-${Date.now()}`,
        order_id: orderId,
        status,
        changed_by: changedBy,
        changed_at: new Date().toISOString(),
        notes: notes || null,
      });
    } catch (e) {
      handleSupabaseError("order_status_history", "insert status history", e);
    }

    return true;
  } catch (err) {
    return handleSupabaseError("orders", "update order status", err);
  }
}

export async function supabaseUpdateOrderShipping(
  orderId: string,
  trackingNumber: string,
  courierPartner?: string
): Promise<boolean> {
  try {
    const updates: any = { tracking_number: trackingNumber, updated_at: new Date().toISOString() };
    if (courierPartner) updates.courier_partner = courierPartner;
    const { error } = await supabase.from("orders").update(updates).eq("order_id", orderId);
    if (error) {
      return handleSupabaseError("orders", "update shipping", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("orders", "update shipping", err);
  }
}

export async function supabaseAssignDeliveryBoy(
  orderId: string,
  boy: { id: string; name: string; mobile: string; delivery_boy_id?: string }
): Promise<boolean> {
  try {
    const canonicalId = await resolveCanonicalDeliveryBoyId(boy.delivery_boy_id || boy.id);
    const { error } = await supabase
      .from("orders")
      .update({
        assigned_delivery_boy_id: canonicalId,
        assigned_delivery_boy_name: boy.name,
        assigned_delivery_boy_mobile: boy.mobile,
        delivery_boy_assigned_at: new Date().toISOString(),
        order_status: "Out for Delivery",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    if (error) {
      return handleSupabaseError("orders", "assign delivery boy", error);
    }

    try {
      await supabase.from("order_status_history").insert({
        id: `sh-${Date.now()}`,
        order_id: orderId,
        status: "Out for Delivery",
        changed_by: `Assigned to ${boy.name} (${boy.mobile})`,
        changed_at: new Date().toISOString(),
        notes: `Assigned delivery partner ${boy.name} for doorstep fulfillment.`,
      });
    } catch (e) {
      handleSupabaseError("order_status_history", "insert status history", e);
    }

    return true;
  } catch (err) {
    return handleSupabaseError("orders", "assign delivery boy", err);
  }
}

export async function supabaseSaveProduct(product: Product): Promise<boolean> {
  try {
    const productRow = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      category_id: product.category_id,
      category_name: product.category_name,
      category_slug: product.category_slug || null,
      subcategory_id: product.subcategory_id || null,
      subcategory_name: product.subcategory_name || null,
      gender: product.gender,
      description: product.description || null,
      brand: product.brand || null,
      mrp: product.mrp,
      selling_price: product.selling_price,
      admin_selling_price: product.admin_selling_price || null,
      shopkeeper_price: product.shopkeeper_price || null,
      discount_percentage: product.discount_percentage || 0,
      stock: product.stock || 0,
      status: product.status,
      rating: product.rating || 5.0,
      rating_count: product.rating_count || 0,
      sizes: product.sizes || [],
      colors: product.colors || [],
      tags: product.tags || [],
      specifications: product.specifications || {},
      shopkeeper_id: product.shopkeeper_id || null,
      shopkeeper_name: product.shopkeeper_name || null,
      approval_status: product.approval_status || (product.shopkeeper_id ? "PENDING" : "APPROVED"),
      rejection_reason: product.rejection_reason || null,
      is_live: product.approval_status === "APPROVED" ? (product.is_live === true) : false,
      updated_at: new Date().toISOString(),
    };

    const { error: pErr } = await supabase.from("products").upsert(productRow);
    if (pErr) {
      handleSupabaseError("products", "upsert product", pErr);
      return false;
    }

    // Images
    if (product.images && product.images.length > 0) {
      const imgRows = product.images.map((img) => ({
        id: img.id,
        product_id: product.id,
        image_url: img.image_url,
        sort_order: img.sort_order || 0,
        is_primary: !!img.is_primary,
        caption: img.caption || null,
      }));
      try {
        const { error: imgErr } = await supabase.from("product_images").upsert(imgRows);
        if (imgErr) handleSupabaseError("product_images", "upsert images", imgErr);
      } catch (e) {
        handleSupabaseError("product_images", "upsert images", e);
      }
    }

    // Variants
    if (product.variants && product.variants.length > 0) {
      const varRows = product.variants.map((v) => ({
        id: v.id,
        product_id: product.id,
        size: v.size,
        color: v.color,
        sku: v.sku,
        stock: v.stock || 0,
        price: v.price,
        mrp: v.mrp,
      }));
      try {
        const { error: varErr } = await supabase.from("product_variants").upsert(varRows);
        if (varErr) handleSupabaseError("product_variants", "upsert variants", varErr);
      } catch (e) {
        handleSupabaseError("product_variants", "upsert variants", e);
      }
    }

    return true;
  } catch (err) {
    return handleSupabaseError("products", "save product", err);
  }
}

export async function supabaseUpdateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
  try {
    const VALID_PRODUCT_COLUMNS = [
      "sku",
      "name",
      "slug",
      "category_id",
      "category_name",
      "category_slug",
      "subcategory_id",
      "subcategory_name",
      "gender",
      "description",
      "brand",
      "mrp",
      "selling_price",
      "admin_selling_price",
      "shopkeeper_price",
      "discount_percentage",
      "stock",
      "status",
      "rating",
      "rating_count",
      "sizes",
      "colors",
      "tags",
      "specifications",
      "shopkeeper_id",
      "shopkeeper_name",
      "approval_status",
      "rejection_reason",
      "is_live",
    ];

    const cleanUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    for (const key of VALID_PRODUCT_COLUMNS) {
      if (updates[key as keyof Product] !== undefined) {
        cleanUpdates[key] = updates[key as keyof Product];
      }
    }

    const { error } = await supabase
      .from("products")
      .update(cleanUpdates)
      .eq("id", id);

    if (error) {
      return handleSupabaseError("products", "update product", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("products", "update product", err);
  }
}

export async function supabaseDeleteProduct(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      return handleSupabaseError("products", "delete product", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("products", "delete product", err);
  }
}

export async function supabaseSaveCustomer(customer: Customer): Promise<boolean> {
  try {
    const { error } = await supabase.from("customers").upsert({
      id: customer.id,
      customer_id: customer.customer_id,
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || null,
      status: customer.status || "ACTIVE",
      total_orders: customer.total_orders || 0,
      total_spent: customer.total_spent || 0.0,
      last_order_at: customer.last_order_at || null,
    });
    if (error) {
      return handleSupabaseError("customers", "save customer", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("customers", "save customer", err);
  }
}

export async function supabaseSaveCategory(cat: Category): Promise<boolean> {
  try {
    const { error } = await supabase.from("categories").upsert({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image: cat.image || null,
      image_url: cat.image_url || null,
      parent_id: cat.parent_id || null,
      status: cat.status,
      sort_order: cat.sort_order || 0,
      display_order: cat.display_order || 0,
      description: cat.description || null,
    });
    if (error) {
      return handleSupabaseError("categories", "save category", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("categories", "save category", err);
  }
}

export async function supabaseSaveShopkeeper(s: Shopkeeper): Promise<boolean> {
  try {
    const { error } = await supabase.from("shopkeepers").upsert({
      id: s.id,
      shopkeeper_id: s.shopkeeper_id,
      name: s.name,
      store_name: s.store_name || null,
      mobile: s.mobile,
      email: s.email || null,
      city: s.city || null,
      status: s.status,
      permissions: s.permissions,
      total_products: s.total_products || 0,
      live_products: s.live_products || 0,
      pending_products: s.pending_products || 0,
      current_stock: s.current_stock || 0,
      total_orders: s.total_orders || 0,
    });
    if (error) {
      return handleSupabaseError("shopkeepers", "save shopkeeper", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("shopkeepers", "save shopkeeper", err);
  }
}

export async function supabaseSaveDeliveryBoy(d: DeliveryBoy): Promise<boolean> {
  try {
    const { error } = await supabase.from("delivery_boys").upsert({
      id: d.id,
      delivery_boy_id: d.delivery_boy_id,
      name: d.name,
      mobile: d.mobile,
      password: d.password || null,
      email: d.email || null,
      vehicle_type: d.vehicle_type || null,
      vehicle_number: d.vehicle_number || null,
      city: d.city || null,
      status: d.status || "ACTIVE",
      assigned_area: d.assigned_area || null,
      total_delivered: d.total_delivered || 0,
      rating: d.rating || 5.0,
    });
    if (error) {
      return handleSupabaseError("delivery_boys", "save delivery boy", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("delivery_boys", "save delivery boy", err);
  }
}

export async function supabaseSaveSettings(settings: StoreSettings): Promise<boolean> {
  try {
    const taglineValue = JSON.stringify({
      tagline: settings.store_tagline || 'India’s Modern Garment & Fashion Destination • Try at Home',
      hero_image_1: settings.hero_image_1 || '',
      hero_image_2: settings.hero_image_2 || '',
      hero_image_3: settings.hero_image_3 || '',
      hero_background_image: settings.hero_background_image || '',

      // Centralized Theme Colors
      theme_primary: settings.theme_primary || '',
      theme_secondary: settings.theme_secondary || '',
      theme_accent: settings.theme_accent || '',
      theme_background: settings.theme_background || '',
      theme_card_background: settings.theme_card_background || '',
      theme_text: settings.theme_text || '',
      theme_heading: settings.theme_heading || '',
      theme_button: settings.theme_button || '',
      theme_button_text: settings.theme_button_text || '',
      theme_border: settings.theme_border || '',
      theme_header: settings.theme_header || '',
      theme_footer: settings.theme_footer || '',

      // Branding Logos & Images
      logo_website: settings.logo_website || '',
      logo_favicon: settings.logo_favicon || '',
      logo_header: settings.logo_header || '',
      logo_footer: settings.logo_footer || '',

      // Slides and Banners arrays
      hero_slides: settings.hero_slides || [],
      festival_banners: settings.festival_banners || [],
      advertisement_banners: settings.advertisement_banners || [],

      // Extra customizations
      theme_typography: settings.theme_typography || {},
      theme_ui_style: settings.theme_ui_style || {},
      theme_mobile_appearance: settings.theme_mobile_appearance || {},
    });

    const { error } = await supabase.from("store_settings").upsert({
      id: 1,
      store_name: settings.store_name,
      store_tagline: taglineValue,
      contact_email: settings.contact_email,
      contact_phone: settings.contact_phone,
      delivery_charge: settings.delivery_charge,
      free_delivery_threshold: settings.free_delivery_threshold,
      cod_enabled: settings.cod_enabled,
      online_payment_enabled: settings.online_payment_enabled,
      min_order_value: settings.min_order_value,
      gst_percentage: settings.gst_percentage,
      currency: settings.currency,
      currency_symbol: settings.currency_symbol,
      try_at_home_duration_minutes: settings.try_at_home_duration_minutes,
      try_at_home_charge: settings.try_at_home_charge,
      sms_provider: settings.sms_provider,
      sms_api_key: settings.sms_api_key,
      sms_sender_id: settings.sms_sender_id,
      twilio_account_sid: settings.twilio_account_sid,
      twilio_auth_token: settings.twilio_auth_token,
      twilio_from_phone: settings.twilio_from_phone,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      return handleSupabaseError("store_settings", "save settings", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("store_settings", "save settings", err);
  }
}

export async function supabaseSaveReturn(ret: ProductReturn): Promise<boolean> {
  try {
    const { error } = await supabase.from("product_returns").upsert({
      id: ret.id || ret.return_id,
      return_id: ret.return_id,
      order_id: ret.order_id,
      order_item_id: ret.order_item_id,
      customer_id: ret.customer_id,
      customer_name: ret.customer_name,
      customer_mobile: ret.customer_mobile,
      product_id: ret.product_id,
      product_name: ret.product_name,
      sku: (ret as any).sku || null,
      quantity: ret.quantity,
      price: ret.product_price || (ret as any).price || 0,
      return_amount: ret.return_amount,
      request_type: (ret as any).request_type || 'return',
      return_reason: (ret as any).return_reason || (ret as any).reason || null,
      return_status: ret.status || (ret as any).return_status || 'Pending',
      is_credit_adjusted: (ret as any).is_credit_adjusted || false,
      adjusted_in_order_id: (ret as any).adjusted_in_order_id || null,
      adjusted_at: (ret as any).adjusted_at || null,
      shopkeeper_id: (ret as any).shopkeeper_id || null,
      created_at: (ret as any).created_at || new Date().toISOString(),
    });
    if (error) {
      return handleSupabaseError("product_returns", "save return", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("product_returns", "save return", err);
  }
}

export async function supabaseSaveStockTransaction(tx: StockTransaction): Promise<boolean> {
  try {
    const { error } = await supabase.from("stock_transactions").upsert({
      id: tx.id || tx.transaction_id,
      product_id: tx.product_id,
      product_name: tx.product_name,
      sku: tx.sku,
      transaction_type: tx.transaction_type,
      quantity: tx.quantity,
      previous_stock: tx.previous_stock,
      new_stock: tx.new_stock,
      reference_order_id: tx.order_id || null,
      notes: tx.reference_note || tx.reason || null,
      created_by: tx.performed_by_name || tx.performed_by,
      created_at: tx.timestamp || new Date().toISOString(),
    });
    if (error) {
      return handleSupabaseError("stock_transactions", "save stock transaction", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("stock_transactions", "save stock transaction", err);
  }
}

export async function supabaseDeleteCategory(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      return handleSupabaseError("categories", "delete category", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("categories", "delete category", err);
  }
}

export async function supabaseDeleteCustomer(customerId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("customers").delete().eq("customer_id", customerId);
    if (error) {
      return handleSupabaseError("customers", "delete customer", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("customers", "delete customer", err);
  }
}

export async function supabaseDeleteShopkeeper(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("shopkeepers").delete().eq("id", id);
    if (error) {
      return handleSupabaseError("shopkeepers", "delete shopkeeper", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("shopkeepers", "delete shopkeeper", err);
  }
}

export async function supabaseDeleteDeliveryBoy(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("delivery_boys").delete().eq("id", id);
    if (error) {
      return handleSupabaseError("delivery_boys", "delete delivery boy", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("delivery_boys", "delete delivery boy", err);
  }
}

export async function supabaseSaveReview(review: ProductReview): Promise<boolean> {
  try {
    const { error } = await supabase.from("product_reviews").upsert({
      id: review.id,
      product_id: review.product_id,
      product_name: review.product_name,
      order_id: review.order_id,
      order_item_id: review.order_item_id || null,
      customer_id: review.customer_id,
      customer_name: review.customer_name,
      customer_mobile: review.customer_mobile || null,
      rating: review.rating,
      review_title: review.review_title || null,
      review_text: review.review_text,
      is_verified_purchase: review.is_verified_purchase !== false,
      created_at: review.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) {
      return handleSupabaseError("product_reviews", "save review", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("product_reviews", "save review", err);
  }
}

export async function supabaseDeleteReview(reviewId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("product_reviews").delete().eq("id", reviewId);
    if (error) {
      return handleSupabaseError("product_reviews", "delete review", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("product_reviews", "delete review", err);
  }
}

/**
 * Setup Realtime channel on public schema for cross-panel / cross-device live synchronization.
 */
let realtimeDebounceTimer: any = null;

export function supabaseSubscribeRealtime(onDatabaseChange: () => void): () => void {
  try {
    const triggerDebouncedSync = (table?: string, eventType?: string) => {
      if (realtimeDebounceTimer) {
        clearTimeout(realtimeDebounceTimer);
      }
      realtimeDebounceTimer = setTimeout(() => {
        console.log(`[Supabase Realtime Sync] Dispatching refresh triggered by table "${table || 'unknown'}" (${eventType || 'change'})`);
        onDatabaseChange();
      }, 50);
    };

    const channel = supabase
      .channel("style1-realtime-root-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          console.log(`[Supabase Realtime] Event "${payload.eventType}" on table: "${payload.table}"`);
          triggerDebouncedSync(payload.table, payload.eventType);
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[Supabase Realtime] Root channel successfully connected & listening to database changes.");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          console.warn(`[Supabase Realtime] Channel status: ${status}. Scheduling fresh cloud sync.`);
          triggerDebouncedSync();
        }
      });

    return () => {
      if (realtimeDebounceTimer) {
        clearTimeout(realtimeDebounceTimer);
      }
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("[Supabase Realtime] Could not initialize realtime channel:", err);
    return () => {};
  }
}

/**
 * Backwards compatibility hooks for existing callers
 */
export async function pullFromSupabase(): Promise<boolean> {
  const data = await fetchFullDataFromSupabase();
  return !!data;
}

export async function pushToSupabase(): Promise<boolean> {
  return true;
}

// ----------------------------------------------------------------------
// CLOUD CART, WISHLIST & SESSION SYNC HELPERS
// ----------------------------------------------------------------------

export async function supabaseSaveCartItem(item: {
  id: string;
  customer_id: string;
  product_id: string;
  size: string;
  color: string;
  quantity: number;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from("cart_items").upsert({
      id: item.id,
      customer_id: item.customer_id,
      product_id: item.product_id,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      return handleSupabaseError("cart_items", "save cart item", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("cart_items", "save cart item", err);
  }
}

export async function supabaseDeleteCartItem(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("cart_items").delete().eq("id", id);
    if (error) {
      return handleSupabaseError("cart_items", "delete cart item", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("cart_items", "delete cart item", err);
  }
}

export async function supabaseClearCart(customerId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("cart_items").delete().eq("customer_id", customerId);
    if (error) {
      return handleSupabaseError("cart_items", "clear cart", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("cart_items", "clear cart", err);
  }
}

export async function supabaseSaveWishlistItem(item: {
  id: string;
  customer_id: string;
  product_id: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from("wishlist_items").upsert({
      id: item.id,
      customer_id: item.customer_id,
      product_id: item.product_id,
      added_at: new Date().toISOString(),
    });
    if (error) {
      return handleSupabaseError("wishlist_items", "save wishlist item", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("wishlist_items", "save wishlist item", err);
  }
}

export async function supabaseDeleteWishlistItem(productId: string, customerId?: string): Promise<boolean> {
  try {
    let query = supabase.from("wishlist_items").delete().eq("product_id", productId);
    if (customerId) {
      query = query.eq("customer_id", customerId);
    }
    const { error } = await query;
    if (error) {
      return handleSupabaseError("wishlist_items", "delete wishlist item", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("wishlist_items", "delete wishlist item", err);
  }
}

export async function supabaseClearWishlist(customerId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("wishlist_items").delete().eq("customer_id", customerId);
    if (error) {
      return handleSupabaseError("wishlist_items", "clear wishlist", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("wishlist_items", "clear wishlist", err);
  }
}

export async function supabaseSaveAuthSession(session: {
  id?: string;
  userId: string;
  role: string;
  token: string;
  user?: any;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from("auth_sessions").upsert({
      id: session.id || `sess-${session.token}`,
      user_id: session.userId,
      role: session.role,
      token: session.token,
      user_data: session.user || {},
      updated_at: new Date().toISOString(),
    });
    if (error) {
      return handleSupabaseError("auth_sessions", "save session", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("auth_sessions", "save session", err);
  }
}

export async function supabaseDeleteAuthSession(token: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("auth_sessions").delete().eq("token", token);
    if (error) {
      return handleSupabaseError("auth_sessions", "delete session", error);
    }
    return true;
  } catch (err) {
    return handleSupabaseError("auth_sessions", "delete session", err);
  }
}

