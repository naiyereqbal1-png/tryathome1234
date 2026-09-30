import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { Category } from '../../types';
import { db } from '../../services/db';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(db.getCategories());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const refreshCategories = () => {
    setCategories(db.getCategories());
  };

  useEffect(() => {
    refreshCategories();
    const handleSync = () => {
      refreshCategories();
    };
    window.addEventListener('style1_data_changed', handleSync);
    return () => window.removeEventListener('style1_data_changed', handleSync);
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80');
    setDisplayOrder(categories.length + 1);
    setStatus('ACTIVE');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImageUrl(cat.image_url || cat.image || '');
    setDisplayOrder(cat.display_order || cat.sort_order || 1);
    setStatus(cat.status);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    setError('');

    const payload = {
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description.trim(),
      image: imageUrl.trim(),
      image_url: imageUrl.trim(),
      sort_order: Number(displayOrder),
      display_order: Number(displayOrder),
      status,
    };

    try {
      if (editingCategory) {
        await db.updateCategoryAsync(editingCategory.id, payload);
      } else {
        await db.addCategoryAsync(payload);
      }
      refreshCategories();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("[Admin Categories] Save error:", err);
      setError(err.message || 'Failed to save category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    setDeletingId(id);
    try {
      await db.deleteCategoryAsync(id);
      refreshCategories();
    } catch (err: any) {
      console.error("[Admin Categories] Delete error:", err);
      alert('Failed to delete category: ' + (err.message || 'database error'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div id="admin-category-management" className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900">Garment Categories</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize catalog into storefront categories, featured story icons, and subcategories.
          </p>
        </div>

        <button
          id="admin-add-category-btn"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            id={`admin-cat-card-${cat.id}`}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-sm transition-shadow flex flex-col"
          >
            <div className="h-32 bg-slate-100 relative overflow-hidden">
              <img src={cat.image_url || cat.image || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80'} alt={cat.name} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs ${
                    cat.status === 'ACTIVE'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {cat.status}
                </span>
              </div>
              <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                Order: #{cat.display_order || cat.sort_order || 1}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{cat.name}</h3>
                <p className="font-mono text-[11px] text-slate-400 mt-0.5">/{cat.slug}</p>
                {cat.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  id={`edit-cat-btn-${cat.id}`}
                  onClick={() => handleOpenEdit(cat)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  id={`delete-cat-btn-${cat.id}`}
                  disabled={deletingId !== null}
                  onClick={() => handleDelete(cat.id)}
                  className={`p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center ${
                    deletingId === cat.id ? 'text-rose-600 animate-pulse cursor-not-allowed' : ''
                  }`}
                  title="Delete Category"
                >
                  {deletingId === cat.id ? (
                    <span className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-black text-sm">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Kurtis & Ethnic"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">URL Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="kurtis"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Display Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                    min={1}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this garment collection..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900 font-bold">
                  {error}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 ${
                    isSaving ? 'opacity-70 cursor-not-allowed bg-slate-400 hover:bg-slate-400' : ''
                  }`}
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
