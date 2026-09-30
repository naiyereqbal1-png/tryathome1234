import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  History,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Search,
  LogOut,
  FileText,
  Eye,
  Shield,
  RefreshCw,
  Edit2,
  Lock,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  Sparkles,
  Tag,
  Percent,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { db } from '../../services/db';
import { Shopkeeper, Product, StockTransaction, Order, Category, ProductImage } from '../../types';
import { uploadProductImage } from '../../utils/supabase/storage';

interface ShopkeeperPortalProps {
  shopkeeper: Shopkeeper;
  onLogout: () => void;
  onSwitchToCustomerView?: () => void;
}

const ShopkeeperProductCard: React.FC<{
  p: Product;
  permissions: any;
  handleStartEditProduct: (p: Product) => void;
  setStockModalProduct: (val: any) => void;
  setStockQty: (val: number) => void;
  setStockReason: (val: string) => void;
}> = ({
  p,
  permissions,
  handleStartEditProduct,
  setStockModalProduct,
  setStockQty,
  setStockReason,
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const images = p.images && p.images.length > 0 ? p.images : [
    { image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80' }
  ];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const activeImg = images[currentImgIndex]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80';

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between"
    >
      <div>
        <div className="relative h-48 bg-slate-100 overflow-hidden group">
          <img src={activeImg || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'} alt={p.name} className="w-full h-full object-cover transition-all duration-300" />
          
          {/* Navigation Arrows for Slider */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs ${
                p.approval_status === 'APPROVED'
                  ? 'bg-emerald-600 text-white'
                  : p.approval_status === 'PENDING'
                  ? 'bg-amber-500 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {p.approval_status}
            </span>
            {p.is_live && (
              <span className="text-[10px] font-bold bg-white text-emerald-800 px-1.5 py-0.5 rounded shadow-xs">
                Live
              </span>
            )}
            {images.length > 1 && (
              <span className="text-[10px] font-bold bg-slate-900/80 text-white px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                <ImageIcon className="w-2.5 h-2.5" />
                <span>{currentImgIndex + 1}/{images.length}</span>
              </span>
            )}
          </div>

          {/* Dots Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-2 py-1 rounded-full">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setCurrentImgIndex(idx);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentImgIndex ? 'bg-white scale-125' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="absolute bottom-2 right-2">
            {p.stock === 0 ? (
              <span className="bg-rose-600 text-white text-[10px] font-bold font-mono px-2 py-0.5 rounded shadow-xs">
                Out of Stock
              </span>
            ) : p.stock < 10 ? (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black font-mono px-2 py-0.5 rounded shadow-xs">
                Low Stock: {p.stock}
              </span>
            ) : (
              <span className="bg-slate-900/85 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                {p.stock} in stock
              </span>
            )}
          </div>
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>SKU: {p.sku}</span>
            <span>{p.category_name}</span>
          </div>

          <h4 className="text-sm font-black text-slate-900 line-clamp-1">{p.name}</h4>

          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-amber-700">₹{p.shopkeeper_price !== undefined ? p.shopkeeper_price : p.selling_price}</span>
            <span className="text-[10px] text-slate-500 font-bold px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">Shopkeeper Price</span>
            <span className="text-xs text-slate-400 line-through">₹{p.mrp}</span>
          </div>

          {p.approval_status === 'REJECTED' && p.rejection_reason && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Admin Remark:</strong> {p.rejection_reason}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {permissions.can_edit_product && (
            <button
              onClick={() => handleStartEditProduct(p)}
              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Edit garment details and images"
            >
              <Edit2 className="w-3 h-3 text-slate-700" />
              <span>Edit</span>
            </button>
          )}

          {permissions.can_stock_in && (
            <button
              onClick={() => {
                setStockModalProduct({ product: p, mode: 'IN' });
                setStockQty(10);
                setStockReason('Restock Inward');
              }}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              title="Replenish stock"
            >
              + Stock IN
            </button>
          )}

          {permissions.can_stock_out && (
            <button
              onClick={() => {
                setStockModalProduct({ product: p, mode: 'OUT' });
                setStockQty(1);
                setStockReason('Offline Sale / Damaged');
              }}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              title="Deduct stock"
            >
              - Stock OUT
            </button>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          {p.available_sizes?.join(', ')}
        </div>
      </div>
    </div>
  );
};

export const ShopkeeperPortal: React.FC<ShopkeeperPortalProps> = ({
  shopkeeper: initialShopkeeper,
  onLogout,
  onSwitchToCustomerView,
}) => {
  const [shopkeeper, setShopkeeper] = useState<Shopkeeper>(initialShopkeeper);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CATALOG' | 'INVENTORY' | 'ORDERS'>('DASHBOARD');

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(db.getCategories());
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Search and filter
  const [catalogSearch, setCatalogSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'PENDING' | 'REJECTED'>('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'DELIVERED' | 'UNDELIVERED'>('ALL');

  // Constants for garment attributes
  const FASHION_PRESETS = [
    { name: 'Festive Kurti', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80' },
    { name: 'Anarkali Suit', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80' },
    { name: 'Denim Jacket', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80' },
    { name: 'Chino Pants', url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80' },
    { name: 'Casual Shirt', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80' },
    { name: 'Floral Dress', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80' },
  ];
  const AVAILABLE_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];
  const AVAILABLE_COLOR_OPTIONS = [
    'Navy Blue',
    'Maroon',
    'Emerald Green',
    'Royal Black',
    'Mustard Yellow',
    'Pastel Pink',
    'Off White',
    'Wine Red',
  ];

  // Hidden File Inputs Refs
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const editCameraInputRef = useRef<HTMLInputElement | null>(null);
  const editGalleryInputRef = useRef<HTMLInputElement | null>(null);

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [stockModalProduct, setStockModalProduct] = useState<{
    product: Product;
    mode: 'IN' | 'OUT';
  } | null>(null);
  const [stockQty, setStockQty] = useState<number>(10);
  const [stockReason, setStockReason] = useState<string>('New consignment inward');
  const [stockRef, setStockRef] = useState<string>('');

  // New Product Form state
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState(categories[0]?.id || 'cat-1');
  const [newProductBrand, setNewProductBrand] = useState('Style1 Studio');
  const [newProductMrp, setNewProductMrp] = useState(1999);
  const [newProductSellingPrice, setNewProductSellingPrice] = useState(999);
  const [newProductStock, setNewProductStock] = useState(25);
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductImages, setNewProductImages] = useState<ProductImage[]>([
    {
      id: 'img-def-1',
      image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80',
      is_primary: true,
      sort_order: 1,
    },
  ]);
  const [newProductCustomUrl, setNewProductCustomUrl] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [selectedColors, setSelectedColors] = useState<string[]>(['Navy Blue', 'Maroon']);
  const [formMsg, setFormMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Edit Product Form state
  const [editProductId, setEditProductId] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [editProductCategory, setEditProductCategory] = useState('');
  const [editProductBrand, setEditProductBrand] = useState('');
  const [editProductMrp, setEditProductMrp] = useState(1999);
  const [editProductSellingPrice, setEditProductSellingPrice] = useState(999);
  const [editProductDesc, setEditProductDesc] = useState('');
  const [editProductImages, setEditProductImages] = useState<ProductImage[]>([]);
  const [editProductCustomUrl, setEditProductCustomUrl] = useState('');
  const [editProductSizes, setEditProductSizes] = useState<string[]>([]);
  const [editProductColors, setEditProductColors] = useState<string[]>([]);
  const [editFormMsg, setEditFormMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const refreshShopkeeperData = () => {
    const updated = db.getShopkeeperById(shopkeeper.id);
    if (updated) {
      setShopkeeper(updated);
    }
    const myProds = db.getProductsByShopkeeper(shopkeeper.id);
    setProducts(myProds);

    const allTx = db.getStockTransactionsByShopkeeper(shopkeeper.id);
    setTransactions(allTx);

    const myOrders = db.getShopkeeperOrders(shopkeeper.id);
    setOrders(myOrders);
  };

  useEffect(() => {
    refreshShopkeeperData();
    const unsub = db.subscribe(() => {
      refreshShopkeeperData();
    });
    return unsub;
  }, [shopkeeper.id]);

  const permissions = shopkeeper.permissions;

  // Image Upload / Camera Handlers
  const handleImageFiles = async (files: FileList | null, isEdit = false) => {
    if (!files || files.length === 0) return;
    
    for (const file of Array.from(files)) {
      try {
        // Upload directly to Supabase storage to get a real CDN URL
        const cdnUrl = await uploadProductImage(file);
        
        if (isEdit) {
          setEditProductImages((prev) => {
            if (prev.length >= 5) return prev;
            const newImg: ProductImage = {
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              image_url: cdnUrl,
              is_primary: prev.length === 0,
              sort_order: prev.length + 1,
            };
            return [...prev, newImg];
          });
        } else {
          setNewProductImages((prev) => {
            if (prev.length >= 5) return prev;
            const newImg: ProductImage = {
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              image_url: cdnUrl,
              is_primary: prev.length === 0,
              sort_order: prev.length + 1,
            };
            return [...prev, newImg];
          });
        }
      } catch (err) {
        console.error("Failed to upload product image to Supabase storage:", err);
      }
    }
  };

  const setPrimaryImage = (id: string, isEdit = false) => {
    if (isEdit) {
      setEditProductImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_primary: img.id === id,
        }))
      );
    } else {
      setNewProductImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_primary: img.id === id,
        }))
      );
    }
  };

  const removeImage = (id: string, isEdit = false) => {
    if (isEdit) {
      setEditProductImages((prev) => {
        const filtered = prev.filter((img) => img.id !== id);
        if (filtered.length > 0 && !filtered.some((img) => img.is_primary)) {
          filtered[0].is_primary = true;
        }
        return filtered;
      });
    } else {
      setNewProductImages((prev) => {
        const filtered = prev.filter((img) => img.id !== id);
        if (filtered.length > 0 && !filtered.some((img) => img.is_primary)) {
          filtered[0].is_primary = true;
        }
        return filtered;
      });
    }
  };

  const addPresetImage = (url: string, isEdit = false) => {
    if (isEdit) {
      setEditProductImages((prev) => {
        if (prev.length >= 5) return prev;
        return [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            image_url: url,
            is_primary: prev.length === 0,
            sort_order: prev.length + 1,
          },
        ];
      });
    } else {
      setNewProductImages((prev) => {
        if (prev.length >= 5) return prev;
        return [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            image_url: url,
            is_primary: prev.length === 0,
            sort_order: prev.length + 1,
          },
        ];
      });
    }
  };

  const addCustomUrlImage = (url: string, isEdit = false) => {
    if (!url.trim()) return;
    if (isEdit) {
      setEditProductImages((prev) => {
        if (prev.length >= 5) return prev;
        return [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            image_url: url.trim(),
            is_primary: prev.length === 0,
            sort_order: prev.length + 1,
          },
        ];
      });
      setEditProductCustomUrl('');
    } else {
      setNewProductImages((prev) => {
        if (prev.length >= 5) return prev;
        return [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            image_url: url.trim(),
            is_primary: prev.length === 0,
            sort_order: prev.length + 1,
          },
        ];
      });
      setNewProductCustomUrl('');
    }
  };

  // Toggle size chip
  const toggleSizeSelection = (size: string, isEdit = false) => {
    if (isEdit) {
      setEditProductSizes((prev) =>
        prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
      );
    } else {
      setSelectedSizes((prev) =>
        prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
      );
    }
  };

  // Toggle color chip
  const toggleColorSelection = (color: string, isEdit = false) => {
    if (isEdit) {
      setEditProductColors((prev) =>
        prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
      );
    } else {
      setSelectedColors((prev) =>
        prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
      );
    }
  };

  // Start Editing Product
  const handleStartEditProduct = (p: Product) => {
    if (!permissions.can_edit_product) {
      alert('Access Restricted: You do not have permission to edit products. Please contact the administrator.');
      return;
    }
    setEditingProduct(p);
    setEditProductId(p.id);
    setEditProductName(p.name);
    setEditProductCategory(p.category_id || categories[0]?.id || 'cat-1');
    setEditProductBrand(p.brand || 'Style1 Studio');
    setEditProductMrp(p.mrp);
    setEditProductSellingPrice(p.shopkeeper_price !== undefined ? p.shopkeeper_price : p.selling_price);
    setEditProductDesc(p.description || '');
    const imgs: ProductImage[] =
      p.images && p.images.length > 0
        ? p.images.map((img, idx) => ({
            id: img.id || `img-${idx}`,
            image_url: img.image_url,
            is_primary: img.is_primary ?? idx === 0,
            sort_order: img.sort_order ?? idx + 1,
          }))
        : [
            {
              id: 'img-1',
              image_url:
                p.images?.[0]?.image_url ||
                'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80',
              is_primary: true,
              sort_order: 1,
            },
          ];
    setEditProductImages(imgs);
    setEditProductSizes(p.available_sizes || p.sizes || ['S', 'M', 'L']);
    setEditProductColors(p.available_colors || p.colors || ['Navy Blue']);
    setEditFormMsg(null);
    setIsEditProductOpen(true);
  };

  // Submit Edit Product
  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormMsg(null);
    setIsSavingProduct(true);

    if (!permissions.can_edit_product) {
      setEditFormMsg({ type: 'error', text: 'You do not have permission to edit products.' });
      setIsSavingProduct(false);
      return;
    }

    if (editProductImages.length === 0) {
      setEditFormMsg({ type: 'error', text: 'Please include at least one product image.' });
      setIsSavingProduct(false);
      return;
    }

    if (Number(editProductSellingPrice) > Number(editProductMrp)) {
      setEditFormMsg({ type: 'error', text: 'Shopkeeper price cannot be higher than MRP.' });
      setIsSavingProduct(false);
      return;
    }

    try {
      const catObj = categories.find((c) => c.id === editProductCategory) || categories[0];
      const updates: Partial<Product> = {
        name: editProductName,
        category_id: catObj.id,
        category_name: catObj.name,
        brand: editProductBrand,
        mrp: Number(editProductMrp),
        shopkeeper_price: Number(editProductSellingPrice),
        description: editProductDesc,
        images: editProductImages.map((img, idx) => ({
          id: img.id,
          image_url: img.image_url,
          is_primary: img.is_primary,
          sort_order: idx + 1,
        })),
        available_sizes: editProductSizes,
        sizes: editProductSizes,
        available_colors: editProductColors,
        colors: editProductColors,
      };

      const updated = await db.updateShopkeeperProductAsync(editProductId, shopkeeper.id, updates);
      setEditFormMsg({
        type: 'success',
        text: `Product updated successfully. Changes saved to database.`,
      });

      setTimeout(() => {
        setIsEditProductOpen(false);
        setEditFormMsg(null);
        refreshShopkeeperData();
      }, 1500);
    } catch (err: any) {
      console.error("[Shopkeeper Portal] Error updating product:", err);
      setEditFormMsg({ type: 'error', text: 'Failed to update product. Please try again.' });
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Handle Add Product
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    setIsSavingProduct(true);

    if (!permissions.can_add_product) {
      setFormMsg({
        type: 'error',
        text: 'You do not have permission to add new products. Please contact the administrator.',
      });
      setIsSavingProduct(false);
      return;
    }

    if (newProductImages.length === 0) {
      setFormMsg({ type: 'error', text: 'Please attach at least one photo of the garment.' });
      setIsSavingProduct(false);
      return;
    }

    if (Number(newProductSellingPrice) > Number(newProductMrp)) {
      setFormMsg({ type: 'error', text: 'Shopkeeper price cannot exceed MRP.' });
      setIsSavingProduct(false);
      return;
    }

    try {
      const catObj = categories.find((c) => c.id === newProductCategory) || categories[0];
      const created = await db.addShopkeeperProductAsync(shopkeeper.id, {
        name: newProductName,
        category_id: catObj.id,
        category_name: catObj.name,
        brand: newProductBrand,
        mrp: Number(newProductMrp),
        shopkeeper_price: Number(newProductSellingPrice),
        stock: Number(newProductStock),
        description: newProductDesc || 'Premium handcrafted design ready for doorstep Try at Home.',
        images: newProductImages.map((img, idx) => ({
          id: img.id,
          image_url: img.image_url,
          is_primary: img.is_primary,
          sort_order: idx + 1,
        })),
        available_sizes: selectedSizes,
        available_colors: selectedColors,
      });

      setFormMsg({
        type: 'success',
        text: `Product submitted for admin approval.`,
      });

      setTimeout(() => {
        setIsAddProductOpen(false);
        setFormMsg(null);
        // Reset form
        setNewProductName('');
        setNewProductDesc('');
        setNewProductImages([
          {
            id: 'img-def-1',
            image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80',
            is_primary: true,
            sort_order: 1,
          },
        ]);
        refreshShopkeeperData();
      }, 1500);
    } catch (err: any) {
      console.error("[Shopkeeper Portal] Error adding product:", err);
      setFormMsg({ type: 'error', text: 'Failed to add product. Data was not saved.' });
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Handle Stock IN / OUT
  const handleStockActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalProduct) return;

    const { product, mode } = stockModalProduct;

    try {
      if (mode === 'IN') {
        if (!permissions.can_stock_in) {
          alert('You do not have permission for Stock IN.');
          return;
        }
        const res = db.shopkeeperStockIn(
          shopkeeper.id,
          product.id,
          Number(stockQty),
          stockRef || stockReason || 'Manual Stock IN via Merchant Portal'
        );
        if (!res.success) {
          alert(res.error || 'Failed to complete Stock IN.');
          return;
        }
      } else {
        if (!permissions.can_stock_out) {
          alert('You do not have permission for Stock OUT.');
          return;
        }
        if (Number(stockQty) > product.stock) {
          alert(
            `Stock deduction error: Cannot deduct ${stockQty} units. Only ${product.stock} units currently in stock.`
          );
          return;
        }
        const res = db.shopkeeperStockOut(
          shopkeeper.id,
          product.id,
          Number(stockQty),
          stockReason || stockRef || 'Manual Stock OUT via Merchant Portal'
        );
        if (!res.success) {
          alert(res.error || 'Failed to complete Stock OUT.');
          return;
        }
      }

      setStockModalProduct(null);
      setStockQty(10);
      setStockReason('');
      setStockRef('');
    } catch (err: any) {
      alert(err.message || 'Failed to update stock.');
    }
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (catalogSearch.trim()) {
      const q = catalogSearch.trim().toLowerCase();
      const matchesSearch =
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.category_name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.fabric || '').toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q))) ||
        (Array.isArray(p.colors) && p.colors.some((c) => c.toLowerCase().includes(q))) ||
        (Array.isArray(p.sizes) && p.sizes.some((s) => s.toLowerCase().includes(q)));

      if (!matchesSearch) return false;
    }

    if (statusFilter === 'LIVE') return p.approval_status === 'APPROVED' && p.is_live;
    if (statusFilter === 'PENDING') return p.approval_status === 'PENDING';
    if (statusFilter === 'REJECTED') return p.approval_status === 'REJECTED';
    return true;
  });

  // Filtered Inventory Transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (inventorySearch.trim()) {
      const q = inventorySearch.trim().toLowerCase();
      const matchTxId = (tx.transaction_id || '').toLowerCase().includes(q);
      const matchProdName = (tx.product_name || '').toLowerCase().includes(q);
      const matchSku = (tx.sku || '').toLowerCase().includes(q);
      const matchPerformedBy = (tx.performed_by_name || tx.performed_by || '').toLowerCase().includes(q);
      const matchNotes = (tx.reference_note || tx.reason || '').toLowerCase().includes(q);
      const matchType = (tx.transaction_type || '').toLowerCase().includes(q);
      if (!matchTxId && !matchProdName && !matchSku && !matchPerformedBy && !matchNotes && !matchType) {
        return false;
      }
    }
    return true;
  });

  // Filtered Shopkeeper Orders
  const validShopIds = new Set<string>([shopkeeper.id, shopkeeper.shopkeeper_id].filter(Boolean) as string[]);
  const myProdIds = new Set(products.map((p) => p.id));

  const filteredOrders = orders.filter((o) => {
    const myItems = o.items.filter(
      (it) => (it.shopkeeper_id && validShopIds.has(it.shopkeeper_id)) || myProdIds.has(it.product_id)
    );
    if (myItems.length === 0) return false;

    if (orderStatusFilter === 'DELIVERED') {
      const hasDelivered = myItems.some(it => it.item_status === 'Delivered');
      if (!hasDelivered) return false;
    } else if (orderStatusFilter === 'UNDELIVERED') {
      const hasUndelivered = myItems.some(it => it.item_status !== 'Delivered');
      if (!hasUndelivered) return false;
    }

    if (ordersSearch.trim()) {
      const q = ordersSearch.trim().toLowerCase();
      const matchOrderId = (o.order_id || o.id || '').toLowerCase().includes(q);
      const matchCustomer = (o.customer_name || '').toLowerCase().includes(q);
      const matchMobile = (o.customer_mobile || o.mobile || o.shipping_address?.mobile || o.address?.mobile || '').includes(q);
      const matchCity = (o.shipping_address?.city || o.address?.city || '').toLowerCase().includes(q);
      const matchStatus = (o.order_status || '').toLowerCase().includes(q);
      const matchItems = myItems.some((it) =>
        (it.product_name || '').toLowerCase().includes(q) ||
        (it.sku || '').toLowerCase().includes(q) ||
        (it.color || '').toLowerCase().includes(q) ||
        (it.size || '').toLowerCase().includes(q)
      );
      if (!matchOrderId && !matchCustomer && !matchMobile && !matchCity && !matchStatus && !matchItems) {
        return false;
      }
    }
    return true;
  });

  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const liveCount = products.filter((p) => p.approval_status === 'APPROVED' && p.is_live).length;
  const pendingCount = products.filter((p) => p.approval_status === 'PENDING').length;
  const rejectedCount = products.filter((p) => p.approval_status === 'REJECTED').length;

  const shopkeeperOrders = orders.filter((o) => {
    return o.items.some(
      (it) => (it.shopkeeper_id && validShopIds.has(it.shopkeeper_id)) || myProdIds.has(it.product_id)
    );
  });

  const deliveredOrdersCount = shopkeeperOrders.filter(o => 
    o.items.some(it => ((it.shopkeeper_id && validShopIds.has(it.shopkeeper_id)) || myProdIds.has(it.product_id)) && it.item_status === 'Delivered')
  ).length;

  const undeliveredOrdersCount = shopkeeperOrders.filter(o => 
    o.items.some(it => ((it.shopkeeper_id && validShopIds.has(it.shopkeeper_id)) || myProdIds.has(it.product_id)) && it.item_status !== 'Delivered')
  ).length;

  const deliveredRevenue = shopkeeperOrders
    .reduce((sum, o) => {
      const myItems = o.items.filter(
        (it) => ((it.shopkeeper_id && validShopIds.has(it.shopkeeper_id)) || myProdIds.has(it.product_id)) && it.item_status === 'Delivered'
      );
      const itemsSum = myItems.reduce((acc, it) => {
        const prod = db.getProductById(it.product_id);
        const price = prod?.shopkeeper_price !== undefined ? prod.shopkeeper_price : (it.price ?? prod?.selling_price ?? 0);
        return acc + (price * (it.quantity ?? 1));
      }, 0);
      return sum + itemsSum;
    }, 0);

  return (
    <div id="shopkeeper-portal" className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Merchant Navigation Bar */}
      <header className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-sm">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">{shopkeeper.store_name || shopkeeper.name}</span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30">
                {shopkeeper.shopkeeper_id}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Proprietor: <strong className="text-slate-200">{shopkeeper.name}</strong> • {shopkeeper.city || 'India'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onSwitchToCustomerView && (
            <button
              onClick={onSwitchToCustomerView}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              <span>View Storefront</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-500/30 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Tabs Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 sticky top-[61px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'DASHBOARD'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('CATALOG')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'CATALOG'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>My Catalog ({products.length})</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-300"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('INVENTORY')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'INVENTORY'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Inventory & Stock ({totalStock} units)</span>
            </button>

            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ORDERS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders ({orders.length})</span>
            </button>
          </div>

          {permissions.can_add_product && (
            <button
              onClick={() => {
                setFormMsg(null);
                setIsAddProductOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* VIEW 1: DASHBOARD OVERVIEW */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div 
                onClick={() => setActiveTab('CATALOG')}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 hover:shadow-md transition-all active:scale-98 group"
              >
                <div className="text-[11px] font-bold text-slate-400 group-hover:text-amber-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Total Products</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">→</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{products.length}</div>
                <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">{liveCount} Live</span>
                  <span>•</span>
                  <span className="text-amber-700 font-bold">{pendingCount} In Review</span>
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('INVENTORY')}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all active:scale-98 group"
              >
                <div className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Current Stock</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600">→</span>
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono">{totalStock}</div>
                <div className="mt-2 text-[11px] text-slate-500">Available across all designs</div>
              </div>

              <div 
                onClick={() => setActiveTab('ORDERS')}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all active:scale-98 group"
              >
                <div className="text-[11px] font-bold text-slate-400 group-hover:text-indigo-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Total Orders</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600">→</span>
                </div>
                <div className="text-2xl font-black text-indigo-700">{orders.length}</div>
                <div className="mt-2 text-[11px] text-slate-500">Received for your products</div>
              </div>

              <div 
                onClick={() => setActiveTab('INVENTORY')}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs cursor-pointer hover:border-slate-400 hover:shadow-md transition-all active:scale-98 group"
              >
                <div className="text-[11px] font-bold text-slate-400 group-hover:text-slate-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Stock Movements</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-800">→</span>
                </div>
                <div className="text-2xl font-black text-slate-800">{transactions.length}</div>
                <div className="mt-2 text-[11px] text-slate-500">Traceable audit entries</div>
              </div>
            </div>

            {/* Delivery Performance & Revenue Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg">
                  🚚
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Delivered Orders</div>
                  <div className="text-xl font-black text-white">{deliveredOrdersCount} Orders</div>
                  <div className="text-[11px] text-emerald-400 font-bold">Successfully completed</div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t border-slate-800 pt-4 sm:border-t-0 sm:pt-0 sm:border-l sm:border-slate-800 sm:pl-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg">
                  ⏳
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Undelivered Orders</div>
                  <div className="text-xl font-black text-white">{undeliveredOrdersCount} Pending</div>
                  <div className="text-[11px] text-amber-400 font-bold">In processing / transit</div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t border-slate-800 pt-4 sm:border-t-0 sm:pt-0 sm:border-l sm:border-slate-800 sm:pl-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">
                  💰
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total Delivered Amount</div>
                  <div className="text-xl font-black text-amber-400">₹{deliveredRevenue.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-400 font-bold">Earned revenue</div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Stock Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-600" />
                    <span>Recent Garments</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('CATALOG')}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800"
                  >
                    View All →
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {products.slice(0, 4).map((p) => {
                    const primaryImg = p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80';
                    return (
                      <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={primaryImg || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'} alt={p.name} className="w-12 h-14 object-cover rounded-lg border border-slate-200" />
                          <div>
                            <h4 className="text-xs font-black text-slate-900 line-clamp-1">{p.name}</h4>
                            <div className="text-[10px] text-slate-500 font-mono">SKU: {p.sku}</div>
                            <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                              ₹{p.shopkeeper_price !== undefined ? p.shopkeeper_price : p.selling_price} <span className="line-through text-slate-400 font-normal">₹{p.mrp}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
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
                          <div className="text-xs font-mono font-bold text-slate-700 mt-1">
                            {p.stock} units
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Permission & Policy Summary */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Authorized Privileges</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Your store capabilities assigned by the TRYatHOME administration:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-700">Add New Products:</span>
                    <span className={`font-bold ${permissions.can_add_product ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {permissions.can_add_product ? 'Enabled' : 'Restricted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-700">Stock IN Replenish:</span>
                    <span className={`font-bold ${permissions.can_stock_in ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {permissions.can_stock_in ? 'Enabled' : 'Restricted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-700">Stock OUT Deduction:</span>
                    <span className={`font-bold ${permissions.can_stock_out ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {permissions.can_stock_out ? 'Enabled' : 'Restricted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-700">Price Adjustments:</span>
                    <span className={`font-bold ${permissions.can_edit_price ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {permissions.can_edit_price ? 'Enabled' : 'Restricted'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CATALOG MANAGEMENT */}
        {activeTab === 'CATALOG' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search by title, SKU, brand, fabric, tags, category..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                {catalogSearch && (
                  <button
                    onClick={() => setCatalogSearch('')}
                    className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                {(['ALL', 'LIVE', 'PENDING', 'REJECTED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-black text-slate-800">No Products Found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {catalogSearch ? 'Try changing your search keywords.' : 'No garments registered in this filter view.'}
                </p>
                {catalogSearch && (
                  <button
                    onClick={() => setCatalogSearch('')}
                    className="mt-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((p) => (
                  <ShopkeeperProductCard
                    key={p.id}
                    p={p}
                    permissions={permissions}
                    handleStartEditProduct={handleStartEditProduct}
                    setStockModalProduct={setStockModalProduct}
                    setStockQty={setStockQty}
                    setStockReason={setStockReason}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: INVENTORY & STOCK LEDGER */}
        {activeTab === 'INVENTORY' && (
          <div className="space-y-4">
            {!permissions.can_view_inventory ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
                <Shield className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-base font-black text-slate-900">Inventory Ledger Access Restricted</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Your shopkeeper profile currently does not have permission to inspect raw inventory movement ledgers. Please contact your TRYatHOME system administrator to enable this permission.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Boxes className="w-5 h-5 text-amber-600" />
                      <span>Inventory Movement Ledger</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Trace every stock entry, inward delivery, customer purchase, and returned items restored to your shelf.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Total In-Stock:</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-black font-mono">
                      {totalStock} units
                    </span>
                  </div>
                </div>

                {/* Inventory Search Bar */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      placeholder="Search ledger by transaction ID, product name, SKU, or user..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                    {inventorySearch && (
                      <button
                        onClick={() => setInventorySearch('')}
                        className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                    Showing {filteredTransactions.length} of {transactions.length} entries
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Tx ID / Date</th>
                          <th className="px-4 py-3">Product / SKU</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3 text-right">Quantity</th>
                          <th className="px-4 py-3 text-center">Previous → New</th>
                          <th className="px-4 py-3">Performed By</th>
                          <th className="px-4 py-3">Notes & Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                              No inventory transactions match your search.
                            </td>
                          </tr>
                        ) : (
                          filteredTransactions.map((tx) => {
                            const isIncrease = tx.transaction_type === 'IN' || tx.transaction_type === 'RETURN_STOCK_IN';
                            return (
                              <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-4 py-3 font-mono">
                                  <div className="font-bold text-slate-900">{tx.transaction_id}</div>
                                  <div className="text-[10px] text-slate-400">
                                    {tx.timestamp ? new Date(tx.timestamp).toLocaleString('en-IN', {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    }) : '-'}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-800 line-clamp-1">{tx.product_name}</div>
                                  <div className="text-[10px] font-mono text-slate-400">{tx.sku}</div>
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
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* VIEW 4: ORDERS & INVOICES */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-4">
            {!permissions.can_view_orders ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
                <Shield className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-base font-black text-slate-900">Orders Access Restricted</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Your shopkeeper profile currently does not have permission to view customer orders. Please contact your TRYatHOME system administrator to enable this permission.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-indigo-600" />
                      <span>Customer Orders for Your Garments</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      View customers' booked orders for your garments with product images, sizes, colors, and pricing.
                    </p>
                  </div>

                  <div className="text-xs font-bold text-slate-600">
                    Your Orders: <strong className="text-slate-900">{orders.length}</strong>
                  </div>
                </div>

                {/* Filter and Metric Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex gap-1">
                    <button
                      onClick={() => setOrderStatusFilter('ALL')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                        orderStatusFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      All ({shopkeeperOrders.length})
                    </button>
                    <button
                      onClick={() => setOrderStatusFilter('DELIVERED')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                        orderStatusFilter === 'DELIVERED'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Delivered ({deliveredOrdersCount})
                    </button>
                    <button
                      onClick={() => setOrderStatusFilter('UNDELIVERED')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                        orderStatusFilter === 'UNDELIVERED'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Undelivered ({undeliveredOrdersCount})
                    </button>
                  </div>

                  <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                        ₹
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total Delivered Amount</div>
                        <div className="text-sm font-black text-amber-400">₹{deliveredRevenue.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                      Earned
                    </span>
                  </div>
                </div>

                {/* Orders Search Bar */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={ordersSearch}
                      onChange={(e) => setOrdersSearch(e.target.value)}
                      placeholder="Search orders by Order ID, customer, city, garment name, or SKU..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                    {ordersSearch && (
                      <button
                        onClick={() => setOrdersSearch('')}
                        className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                    Showing {filteredOrders.length} of {orders.length} orders
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-black text-slate-800">No Orders Found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {ordersSearch ? 'No orders match your search criteria.' : 'Customer orders containing your garments will appear here.'}
                    </p>
                    {ordersSearch && (
                      <button
                        onClick={() => setOrdersSearch('')}
                        className="mt-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((o) => {
                      const validShopIds = new Set<string>([shopkeeper.id, shopkeeper.shopkeeper_id].filter(Boolean) as string[]);
                      const myProdIds = new Set(products.map((p) => p.id));

                      // STRICT ISOLATION: Only items belonging to THIS shopkeeper
                      let myItems = o.items.filter(
                        (it) => (it.shopkeeper_id && validShopIds.has(it.shopkeeper_id)) || myProdIds.has(it.product_id)
                      );

                      if (orderStatusFilter === 'DELIVERED') {
                        myItems = myItems.filter(it => it.item_status === 'Delivered');
                      } else if (orderStatusFilter === 'UNDELIVERED') {
                        myItems = myItems.filter(it => it.item_status !== 'Delivered');
                      }

                      if (myItems.length === 0) return null;

                      const isLocked = !!o.final_bill_generated || !!o.final_bill_locked;
                      const getShopkeeperItemPrice = (item: any) => {
                        const prod = db.getProductById(item.product_id);
                        return prod?.shopkeeper_price !== undefined ? prod.shopkeeper_price : (item.price ?? prod?.selling_price ?? 0);
                      };
                      const myItemsTotal = myItems.reduce((acc, it) => acc + (getShopkeeperItemPrice(it) * (it.quantity ?? 1)), 0);
                      const myItemsTotalQty = myItems.reduce((acc, it) => acc + (it.quantity ?? 1), 0);

                      return (
                        <div
                          key={o.id}
                          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                        >
                          {/* Order Header: Order ID, Status, Customer, Date, Shopkeeper Total */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-400 uppercase">Order ID:</span>
                                <span className="text-sm font-black font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                                  {o.order_id}
                                </span>
                                <span
                                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                    o.order_status === 'Delivered'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : o.order_status === 'Cancelled'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-indigo-100 text-indigo-800'
                                  }`}
                                >
                                  {o.order_status}
                                </span>
                                {o.order_type === 'try_at_home' && (
                                  <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                    Try at Home
                                  </span>
                                )}
                                {isLocked && (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Final Bill Locked
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                                <span>
                                  Customer: <strong className="text-slate-900">{o.customer_name}</strong>
                                </span>
                                <span>•</span>
                                <span>City: <strong className="text-slate-700">{o.shipping_address?.city || o.address?.city || 'India'}</strong></span>
                                <span>•</span>
                                <span className="text-slate-400">
                                  {new Date(o.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Shopkeeper's Products Subtotal */}
                            <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-slate-100">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Your Garments Total
                              </div>
                              <div className="text-lg font-black text-slate-900 font-mono">
                                ₹{myItemsTotal.toLocaleString('en-IN')}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                ({myItemsTotalQty} piece{myItemsTotalQty > 1 ? 's' : ''} ordered)
                              </div>
                            </div>
                          </div>

                          {/* List of Ordered Garments with Image and Details for Recognition */}
                          <div className="space-y-2.5">
                            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-amber-600" />
                              <span>Your Ordered Items ({myItems.length})</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {myItems.map((it) => {
                                const prod = db.getProductById(it.product_id);
                                const itemImg =
                                  it.image_url ||
                                  prod?.images?.[0]?.image_url ||
                                  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80';
                                const itemPrice = getShopkeeperItemPrice(it);
                                const itemQty = it.quantity ?? 1;
                                const itemTotal = itemPrice * itemQty;

                                return (
                                  <div
                                    key={it.id}
                                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 items-center hover:bg-slate-50/80 transition-colors"
                                  >
                                    {/* Prominent Garment Image */}
                                    <div className="relative w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs">
                                      <img
                                        src={itemImg || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                                        alt={it.product_name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src =
                                            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80';
                                        }}
                                      />
                                    </div>

                                    {/* Garment Details, Name, SKU, Size, Color, Price */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <h4 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
                                        {it.product_name}
                                      </h4>

                                      <div className="text-[11px] text-slate-500 font-mono">
                                        SKU: <span className="text-slate-700 font-bold">{it.sku || prod?.sku || 'N/A'}</span>
                                      </div>

                                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-800">
                                          Size: {it.size || 'Free'}
                                        </span>
                                        <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-800">
                                          Color: {it.color || 'Standard'}
                                        </span>
                                        <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-900 rounded text-[10px] font-extrabold">
                                          Qty: {itemQty}
                                        </span>
                                      </div>

                                      <div className="pt-1 flex items-baseline justify-between gap-2">
                                        <div className="text-xs font-bold text-slate-900 font-mono">
                                          ₹{itemPrice.toLocaleString('en-IN')}
                                          {itemQty > 1 && (
                                            <span className="text-[10px] text-slate-500 font-normal ml-1">
                                              (Total: ₹{itemTotal.toLocaleString('en-IN')})
                                            </span>
                                          )}
                                        </div>

                                        {it.item_status && (
                                          <span
                                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                              it.item_status === 'Delivered'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : it.item_status.includes('Return')
                                                ? 'bg-rose-100 text-rose-800'
                                                : it.item_status.includes('Replace')
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-slate-200 text-slate-700'
                                            }`}
                                          >
                                            {it.item_status}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: ADD PRODUCT */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-400" />
                <span>Add New Garment to Your Store Catalog</span>
              </h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden file inputs for Camera and Gallery */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleImageFiles(e.target.files, false)}
            />
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageFiles(e.target.files, false)}
            />

            <form onSubmit={handleAddProductSubmit} className="p-5 space-y-4 overflow-y-auto">
              {formMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    formMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {formMsg.text}
                </div>
              )}

              {/* Garment Images & Photos */}
              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span>Garment Photos ({newProductImages.length}/5)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Camera or Gallery upload supported</span>
                </div>

                {/* Upload Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take Photo (Camera)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Browse Gallery / Files</span>
                  </button>
                </div>

                {/* Or Quick Preset Image Buttons */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Or Pick Fast Indian Fashion Presets:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FASHION_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => addPresetImage(preset.url, false)}
                        className="px-2 py-1 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded text-[11px] font-medium text-slate-700 cursor-pointer transition-colors"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom URL Input */}
                <div className="flex gap-2 pt-1.5">
                  <input
                    type="url"
                    value={newProductCustomUrl}
                    onChange={(e) => setNewProductCustomUrl(e.target.value)}
                    placeholder="Or paste external image URL..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomUrlImage(newProductCustomUrl, false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>

                {/* Selected Images Grid */}
                {newProductImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-2">
                    {newProductImages.map((img) => (
                      <div
                        key={img.id}
                        className={`relative rounded-lg overflow-hidden border-2 group ${
                          img.is_primary ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200'
                        }`}
                      >
                        <img src={img.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'} alt="Garment" className="w-full h-20 object-cover" />
                        {img.is_primary && (
                          <div className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-black px-1 rounded flex items-center gap-0.5 shadow-xs">
                            <Star className="w-2.5 h-2.5 fill-white" />
                            <span>Primary</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {!img.is_primary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(img.id, false)}
                              title="Set as Primary Cover"
                              className="p-1 bg-white text-amber-700 rounded hover:bg-amber-100 cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(img.id, false)}
                            title="Remove Photo"
                            className="p-1 bg-white text-rose-700 rounded hover:bg-rose-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Brand */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product / Garment Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Pure Handloom Chanderi Anarkali Kurta"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Garment Category</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={newProductBrand}
                    onChange={(e) => setNewProductBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Pricing & Stock with Live Discount Preview */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MRP (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newProductMrp}
                    onChange={(e) => setNewProductMrp(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shopkeeper Price (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newProductSellingPrice}
                    onChange={(e) => setNewProductSellingPrice(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock Units <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Live Discount Calculation Box */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-900">Calculated Margin (from MRP):</span>
                </div>
                <div className="font-bold text-emerald-800">
                  {newProductMrp > newProductSellingPrice ? (
                    <span>
                      ₹{newProductMrp - newProductSellingPrice} lower than MRP ({Math.round(((newProductMrp - newProductSellingPrice) / newProductMrp) * 100)}% off MRP)
                    </span>
                  ) : (
                    <span className="text-slate-600">No margin (MRP = Shopkeeper Price)</span>
                  )}
                </div>
              </div>

              {/* Available Sizes Multi-Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Available Sizes:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_SIZE_OPTIONS.map((size) => {
                    const isSelected = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSizeSelection(size, false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Colors Multi-Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Available Colors:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_COLOR_OPTIONS.map((color) => {
                    const isSelected = selectedColors.includes(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleColorSelection(color, false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Styling Notes</label>
                <textarea
                  rows={2}
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                  placeholder="Fabric weave, care tips, doorstep Try at Home trial advice..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                <strong>Admin Approval Workflow:</strong> As soon as you submit, your product will be marked <strong>PENDING</strong> for Admin review. Once the Admin approves and activates Live status, it instantly appears in the Try at Home customer catalog!
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSavingProduct}
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className={`px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 ${
                    isSavingProduct ? 'opacity-70 cursor-not-allowed bg-slate-400 hover:bg-slate-400' : ''
                  }`}
                >
                  {isSavingProduct ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Submit Garment for Review'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PRODUCT */}
      {isEditProductOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Garment: {editingProduct.name}</span>
              </h3>
              <button
                onClick={() => setIsEditProductOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden file inputs for Edit Camera and Gallery */}
            <input
              type="file"
              ref={editCameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleImageFiles(e.target.files, true)}
            />
            <input
              type="file"
              ref={editGalleryInputRef}
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageFiles(e.target.files, true)}
            />

            <form onSubmit={handleEditProductSubmit} className="p-5 space-y-4 overflow-y-auto">
              {editFormMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    editFormMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {editFormMsg.text}
                </div>
              )}

              {/* Garment Images & Photos */}
              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span>Garment Photos ({editProductImages.length}/5)</span>
                    {!permissions.can_edit_images && (
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold">
                        <Lock className="w-2.5 h-2.5" /> Locked by Admin
                      </span>
                    )}
                  </label>
                  <span className="text-[11px] text-slate-500">Camera / Gallery / URL supported</span>
                </div>

                {permissions.can_edit_images ? (
                  <>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => editCameraInputRef.current?.click()}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Camera Snap</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => editGalleryInputRef.current?.click()}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Gallery Upload</span>
                      </button>
                    </div>

                    <div className="flex gap-2 pt-1.5">
                      <input
                        type="url"
                        value={editProductCustomUrl}
                        onChange={(e) => setEditProductCustomUrl(e.target.value)}
                        placeholder="Or paste external image URL..."
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => addCustomUrlImage(editProductCustomUrl, true)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Add URL
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Image modification is restricted for this shopkeeper account. Contact admin to modify image permissions.
                  </p>
                )}

                {/* Selected Images Grid */}
                {editProductImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-2">
                    {editProductImages.map((img) => (
                      <div
                        key={img.id}
                        className={`relative rounded-lg overflow-hidden border-2 group ${
                          img.is_primary ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200'
                        }`}
                      >
                        <img src={img.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'} alt="Garment" className="w-full h-20 object-cover" />
                        {img.is_primary && (
                          <div className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-black px-1 rounded flex items-center gap-0.5 shadow-xs">
                            <Star className="w-2.5 h-2.5 fill-white" />
                            <span>Primary</span>
                          </div>
                        )}
                        {permissions.can_edit_images && (
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            {!img.is_primary && (
                              <button
                                type="button"
                                onClick={() => setPrimaryImage(img.id, true)}
                                title="Set as Primary Cover"
                                className="p-1 bg-white text-amber-700 rounded hover:bg-amber-100 cursor-pointer"
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(img.id, true)}
                              title="Remove Photo"
                              className="p-1 bg-white text-rose-700 rounded hover:bg-rose-100 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Brand */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product / Garment Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Garment Category</span>
                    {!permissions.can_edit_category && (
                      <span className="text-[10px] text-amber-700 font-normal flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </label>
                  <select
                    disabled={!permissions.can_edit_category}
                    value={editProductCategory}
                    onChange={(e) => setEditProductCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:bg-slate-100"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={editProductBrand}
                    onChange={(e) => setEditProductBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>MRP (₹)</span>
                    {!permissions.can_edit_price && (
                      <span className="text-[10px] text-amber-700 font-normal flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    disabled={!permissions.can_edit_price}
                    value={editProductMrp}
                    onChange={(e) => setEditProductMrp(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Shopkeeper Price (₹)</span>
                    {!permissions.can_edit_price && (
                      <span className="text-[10px] text-amber-700 font-normal flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    disabled={!permissions.can_edit_price}
                    value={editProductSellingPrice}
                    onChange={(e) => setEditProductSellingPrice(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Live Discount Box */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-900">Discount Preview:</span>
                </div>
                <div className="font-bold text-emerald-800">
                  {editProductMrp > editProductSellingPrice ? (
                    <span>
                      Save ₹{editProductMrp - editProductSellingPrice} ({Math.round(((editProductMrp - editProductSellingPrice) / editProductMrp) * 100)}% OFF)
                    </span>
                  ) : (
                    <span className="text-slate-600">No discount (MRP = Selling Price)</span>
                  )}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Available Sizes:</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_SIZE_OPTIONS.map((size) => {
                    const isSelected = editProductSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSizeSelection(size, true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Available Colors:</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_COLOR_OPTIONS.map((color) => {
                    const isSelected = editProductColors.includes(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleColorSelection(color, true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editProductDesc}
                  onChange={(e) => setEditProductDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSavingProduct}
                  onClick={() => setIsEditProductOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className={`px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 ${
                    isSavingProduct ? 'opacity-70 cursor-not-allowed bg-slate-400 hover:bg-slate-400' : ''
                  }`}
                >
                  {isSavingProduct ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STOCK IN / OUT */}
      {stockModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div
              className={`p-4 text-white flex items-center justify-between ${
                stockModalProduct.mode === 'IN' ? 'bg-emerald-900' : 'bg-rose-900'
              }`}
            >
              <h3 className="text-sm font-black flex items-center gap-2">
                <Boxes className="w-4 h-4" />
                <span>
                  {stockModalProduct.mode === 'IN' ? 'Stock IN (Replenish)' : 'Stock OUT (Deduction)'}
                </span>
              </h3>
              <button
                onClick={() => setStockModalProduct(null)}
                className="text-white/70 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockActionSubmit} className="p-5 space-y-3.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-900">{stockModalProduct.product.name}</div>
                <div className="text-slate-500 font-mono text-[11px]">
                  SKU: {stockModalProduct.product.sku} • Current Stock: <strong>{stockModalProduct.product.stock} units</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantity ({stockModalProduct.mode === 'IN' ? 'Units to Inward' : 'Units to Deduct'})
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={stockQty}
                  onChange={(e) => setStockQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder={
                    stockModalProduct.mode === 'IN'
                      ? 'e.g. New consignment inward from Karur unit'
                      : 'e.g. Offline boutique purchase / minor fabric defect'
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Traceable Reference Note (Optional)</label>
                <input
                  type="text"
                  value={stockRef}
                  onChange={(e) => setStockRef(e.target.value)}
                  placeholder="e.g. Invoice #CON-2026-89"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockModalProduct(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer ${
                    stockModalProduct.mode === 'IN'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {stockModalProduct.mode === 'IN' ? 'Stock Inward' : 'Stock Deduction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
