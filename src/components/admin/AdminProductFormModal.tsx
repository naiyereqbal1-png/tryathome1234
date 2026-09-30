import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  Star,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Category, Product, ProductImage, Gender, ProductStatus } from '../../types';
import { db } from '../../services/db';

interface AdminProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
  onSaveSuccess: (message: string) => void;
  categories: Category[];
}

export const AdminProductFormModal: React.FC<AdminProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSaveSuccess,
  categories,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('cat-jeans');
  const [gender, setGender] = useState<Gender>('Men');
  const [brand, setBrand] = useState('TRYatHOME Originals');
  const [description, setDescription] = useState('');
  const [mrp, setMrp] = useState(1999);
  const [sellingPrice, setSellingPrice] = useState(999);
  const [shopkeeperPrice, setShopkeeperPrice] = useState(600);
  const [stock, setStock] = useState(35);
  const [status, setStatus] = useState<ProductStatus>('Published');
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [colors, setColors] = useState<string[]>(['Classic Blue']);
  const [newColorInput, setNewColorInput] = useState('');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [fabric, setFabric] = useState('100% Cotton');
  const [fit, setFit] = useState('Slim Fit');
  const [washCare, setWashCare] = useState('Machine Wash');
  const [origin, setOrigin] = useState('India');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto calculate discount percentage
  const discountPercentage =
    mrp > 0 && sellingPrice > 0 && mrp >= sellingPrice
      ? Math.round(((mrp - sellingPrice) / mrp) * 100)
      : 0;

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setSku(productToEdit.sku || '');
      setCategoryId(productToEdit.category_id || '');
      setGender(productToEdit.gender || 'Men');
      setBrand(productToEdit.brand || '');
      setDescription(productToEdit.description || '');
      setMrp(productToEdit.mrp !== undefined && productToEdit.mrp !== null ? productToEdit.mrp : 0);
      setSellingPrice(productToEdit.selling_price !== undefined && productToEdit.selling_price !== null ? productToEdit.selling_price : 0);
      setShopkeeperPrice(
        productToEdit.shopkeeper_price !== undefined && productToEdit.shopkeeper_price !== null
          ? productToEdit.shopkeeper_price
          : (productToEdit.selling_price !== undefined && productToEdit.selling_price !== null ? productToEdit.selling_price : 0)
      );
      setStock(productToEdit.stock !== undefined && productToEdit.stock !== null ? productToEdit.stock : 0);
      setStatus(productToEdit.status || 'Published');
      setSizes(productToEdit.sizes || []);
      setColors(productToEdit.colors || []);
      setImages(productToEdit.images || []);
      setFabric(productToEdit.specifications?.Fabric || '100% Cotton');
      setFit(productToEdit.specifications?.Fit || 'Regular Fit');
      setWashCare(productToEdit.specifications?.WashCare || 'Machine Wash');
      setOrigin(productToEdit.specifications?.Origin || 'India');
    } else {
      // Default new garment
      setName('');
      setSku(`ST1-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategoryId(categories[0]?.id || 'cat-jeans');
      setGender('Men');
      setBrand('TRYatHOME Originals');
      setDescription('Premium quality garment engineered for style, all-day comfort and durability.');
      setMrp(1999);
      setSellingPrice(899);
      setShopkeeperPrice(600);
      setStock(40);
      setStatus('Published');
      setSizes(['M', 'L', 'XL', 'XXL']);
      setColors(['Classic Navy']);
      setImages([
        {
          id: `img-1`,
          image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
          sort_order: 1,
          is_primary: true,
          caption: 'Front Angle',
        },
        {
          id: `img-2`,
          image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',
          sort_order: 2,
          is_primary: false,
          caption: 'Back View',
        },
        {
          id: `img-3`,
          image_url: 'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800&q=80',
          sort_order: 3,
          is_primary: false,
          caption: 'Detail Texture',
        },
      ]);
    }
  }, [productToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const toggleSize = (sz: string) => {
    if (sizes.includes(sz)) {
      setSizes(sizes.filter((s) => s !== sz));
    } else {
      setSizes([...sizes, sz]);
    }
  };

  const handleAddColor = () => {
    if (newColorInput.trim() && !colors.includes(newColorInput.trim())) {
      setColors([...colors, newColorInput.trim()]);
      setNewColorInput('');
    }
  };

  const handleRemoveColor = (c: string) => {
    setColors(colors.filter((item) => item !== c));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      const isFirst = images.length === 0;
      setImages([
        ...images,
        {
          id: `img-${Date.now()}`,
          image_url: newImageUrl.trim(),
          sort_order: images.length + 1,
          is_primary: isFirst,
          caption: `View ${images.length + 1}`,
        },
      ]);
      setNewImageUrl('');
    }
  };

  const handleSetPrimaryImage = (idx: number) => {
    setImages(
      images.map((img, i) => ({
        ...img,
        is_primary: i === idx,
      }))
    );
  };

  const handleRemoveImage = (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    if (updated.length > 0 && !updated.some((i) => i.is_primary)) {
      updated[0].is_primary = true;
    }
    setImages(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    if (!name.trim()) {
      setError('Please provide a product title.');
      setIsSaving(false);
      return;
    }

    if (sellingPrice > mrp) {
      setError('Selling price cannot exceed MRP.');
      setIsSaving(false);
      return;
    }

    if (sizes.length === 0) {
      setError('Please select at least one available size.');
      setIsSaving(false);
      return;
    }

    const selectedCat = categories.find((c) => c.id === categoryId);

    const payload: Partial<Product> = {
      name: name.trim(),
      sku: sku.trim(),
      category_id: categoryId,
      category_name: selectedCat?.name || 'Garments',
      category_slug: selectedCat?.slug || 'garments',
      gender,
      brand,
      description,
      mrp: Number(mrp),
      selling_price: Number(sellingPrice),
      admin_selling_price: Number(sellingPrice),
      shopkeeper_price: Number(shopkeeperPrice),
      discount_percentage: discountPercentage,
      stock: Number(stock),
      status,
      sizes,
      colors,
      images,
      specifications: {
        Fabric: fabric,
        Fit: fit,
        WashCare: washCare,
        Origin: origin,
      },
    };

    try {
      if (productToEdit) {
        await db.updateProductAsync(productToEdit.id, payload);
        onSaveSuccess('Product updated successfully. Changes saved to database.');
      } else {
        await db.addProductAsync(payload);
        onSaveSuccess('Product added successfully. Data saved to database.');
      }
      onClose();
    } catch (err: any) {
      console.error("[Product Form Modal] Error saving product to Supabase:", err);
      setError(productToEdit ? 'Failed to update product. Please try again.' : 'Failed to add product. Data was not saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '28', '30', '32', '34', '36', '38'];

  return (
    <div
      id="admin-product-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
    >
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-black">
              {productToEdit ? `Edit Garment: ${productToEdit.name}` : 'Add New Garment to Catalog'}
            </h2>
            <span className="text-xs text-slate-400">
              Publish directly to customer marketplace or save as Draft
            </span>
          </div>
          <button
            id="product-modal-close-btn"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl font-bold border border-rose-200">
              {error}
            </div>
          )}

          {/* Section 1: Basic Garment Info */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">
              Basic Product Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
                <input
                  id="product-form-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Men's Slim Fit Washed Blue Denim Jeans"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">SKU / Item Code *</label>
                <input
                  id="product-form-sku"
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="ST1-JNS-0001"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono outline-hidden focus:border-indigo-600 font-semibold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category *</label>
                <select
                  id="product-form-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Gender *</label>
                <select
                  id="product-form-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-semibold"
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Brand</label>
                <input
                  id="product-form-brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="TRYatHOME Originals"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Description</label>
              <textarea
                id="product-form-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fabric weight, wash details, fit specifics, styling suggestions..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Section 2: Pricing, Stock & Status */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">
              Pricing, Inventory & Visibility
            </h3>

             <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
               <div>
                 <label className="font-bold text-slate-700 block mb-1">MRP (₹) *</label>
                 <input
                   id="product-form-mrp"
                   type="number"
                   min={0}
                   value={mrp}
                   onChange={(e) => setMrp(Number(e.target.value))}
                   className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                   required
                 />
               </div>

               <div>
                 <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                 <input
                   id="product-form-selling-price"
                   type="number"
                   min={0}
                   value={sellingPrice}
                   onChange={(e) => setSellingPrice(Number(e.target.value))}
                   className="w-full px-3 py-2 text-xs border border-indigo-400 rounded-lg font-bold text-indigo-700"
                   required
                 />
               </div>

               <div>
                 <label className="font-bold text-slate-700 block mb-1">Shopkeeper Price (₹) *</label>
                 <input
                   id="product-form-shopkeeper-price"
                   type="number"
                   min={0}
                   value={shopkeeperPrice}
                   onChange={(e) => setShopkeeperPrice(Number(e.target.value))}
                   className="w-full px-3 py-2 text-xs border border-amber-400 rounded-lg font-bold text-amber-700"
                   required
                 />
               </div>

               <div>
                 <label className="font-bold text-slate-700 block mb-1">Discount Auto</label>
                 <div className="px-3 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-extrabold text-xs">
                   {discountPercentage}% OFF
                 </div>
               </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Available Stock *</label>
                <input
                  id="product-form-stock"
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Product Publication Status
                </label>
                <select
                  id="product-form-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                >
                  <option value="Published">Published (Visible on Storefront)</option>
                  <option value="Draft">Draft (Internal Only)</option>
                  <option value="Unpublished">Unpublished (Hidden)</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Sizes & Colors */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">
              Garment Variants: Sizes & Colors
            </h3>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Available Sizes (Select all that apply) *
              </label>
              <div className="flex flex-wrap gap-2">
                {commonSizes.map((sz) => {
                  const isSel = sizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      className={`px-3 py-1.5 rounded-lg font-extrabold border transition-all ${
                        isSel
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Available Colors</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {colors.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg"
                  >
                    <span>{c}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(c)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  value={newColorInput}
                  onChange={(e) => setNewColorInput(e.target.value)}
                  placeholder="e.g. Jet Black, Olive, Maroon"
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg"
                >
                  Add Color
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Multi-Image Gallery (4-5 images support) */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">
              Multiple Product Images ({images.length} Images Added)
            </h3>

            {/* Existing Images preview grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  className="relative group bg-slate-100 rounded-xl overflow-hidden border border-slate-200 aspect-[3/4]"
                >
                  <img
                    src={img.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'}
                    alt={img.caption || `Image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {img.is_primary && (
                    <span className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}

                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="self-end p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(idx)}
                        className="py-1 bg-white text-slate-900 text-[10px] font-bold rounded shadow-xs"
                      >
                        Set as Primary
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Image URL Input */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1">
                Add Image URL (Unsplash or direct CDN link)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                >
                  Add Image
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Garment Specifications */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">
              Garment Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Fabric</label>
                <input
                  type="text"
                  value={fabric}
                  onChange={(e) => setFabric(e.target.value)}
                  placeholder="100% Breathable Cotton"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fit</label>
                <input
                  type="text"
                  value={fit}
                  onChange={(e) => setFit(e.target.value)}
                  placeholder="Slim Fit"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Wash Care</label>
                <input
                  type="text"
                  value={washCare}
                  onChange={(e) => setWashCare(e.target.value)}
                  placeholder="Machine Wash Cold"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Country of Origin</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="India"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Footer CTAs */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              id="product-form-save-btn"
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs flex items-center justify-center gap-1 ${
                isSaving ? 'opacity-70 cursor-not-allowed bg-slate-400 hover:bg-slate-400' : ''
              }`}
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                productToEdit ? 'Save Changes' : 'Create & Publish Garment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
