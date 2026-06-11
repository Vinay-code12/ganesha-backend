import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ChefHat, Tag, ToggleLeft, ToggleRight, Star } from 'lucide-react';
import { useFullMenu, useMenuCategories } from '../../hooks';
import { menuApi } from '../../api/services';
import { Button, Card, Skeleton, EmptyState, Modal, Input, Select, Textarea, Toggle } from '../../components/ui';
import { formatCurrency } from '../../utils';
import toast from 'react-hot-toast';
import type { MenuCategory, MenuItem } from '../../types';

// ─── Category Form ────────────────────────────────────────────────────────────
function CategoryModal({ cat, onClose }: { cat?: MenuCategory | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(cat?.name || '');
  const [description, setDescription] = useState(cat?.description || '');
  const [sortOrder, setSortOrder] = useState(cat?.sortOrder ?? 0);

  const mutation = useMutation({
    mutationFn: (data: any) => cat ? menuApi.updateCategory(cat._id, data) : menuApi.createCategory(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menu'] }); toast.success(cat ? 'Category updated' : 'Category created'); onClose(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <Modal title={cat ? 'Edit Category' : 'New Category'} onClose={onClose}>
      <div className="space-y-4">
        <Input label="Category Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Appetizers" />
        <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." rows={2} />
        <Input label="Sort Order" type="number" value={sortOrder} onChange={e => setSortOrder(+e.target.value)} />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate({ name, description, sortOrder })} loading={mutation.isPending}>
            {cat ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Item Form ────────────────────────────────────────────────────────────────
function ItemModal({ item, categories, onClose }: { item?: MenuItem | null; categories: MenuCategory[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price ?? 0,
    categoryId: (item?.categoryId as any)?._id || item?.categoryId || categories[0]?._id || '',
    isVegetarian: item?.isVegetarian ?? false,
    isVegan: item?.isVegan ?? false,
    isGlutenFree: item?.isGlutenFree ?? false,
    isAvailable: item?.isAvailable ?? true,
    isFeatured: item?.isFeatured ?? false,
    preparationTime: item?.preparationTime ?? 15,
    calories: item?.calories ?? 0,
    tags: (item?.tags || []).join(', '),
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data: any) => item ? menuApi.updateItem(item._id, data) : menuApi.createItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu'] });
      qc.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success(item ? 'Item updated' : 'Item created');
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleSubmit = () => {
    mutation.mutate({
      ...form,
      price: +form.price,
      preparationTime: +form.preparationTime,
      calories: +form.calories,
      tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
    });
  };

  return (
    <Modal title={item ? 'Edit Menu Item' : 'New Menu Item'} onClose={onClose} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Item Name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Margherita Pizza" />
          <Input label="Price" type="number" value={form.price} onChange={e => set('price', e.target.value)} min={0} step={0.01} />
          <Select label="Category" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Input label="Prep Time (min)" type="number" value={form.preparationTime} onChange={e => set('preparationTime', e.target.value)} />
          <Input label="Calories" type="number" value={form.calories} onChange={e => set('calories', e.target.value)} placeholder="0 = not specified" />
          <Input label="Tags (comma separated)" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="spicy, popular, new" />
        </div>
        <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Brief description of the item" />
        <div className="flex flex-wrap gap-4 pt-2">
          {[
            { key: 'isVegetarian', label: '🌿 Vegetarian' },
            { key: 'isVegan', label: '🌱 Vegan' },
            { key: 'isGlutenFree', label: '🌾 Gluten Free' },
            { key: 'isAvailable', label: '✅ Available' },
            { key: 'isFeatured', label: '⭐ Featured' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={(form as any)[key]} onChange={e => set(key, e.target.checked)}
                className="w-4 h-4 rounded accent-orange-500" />
              <span className="text-sm text-slate-300">{label}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={mutation.isPending}>{item ? 'Save Changes' : 'Add Item'}</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const { data, isLoading } = useFullMenu();
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editCategory, setEditCategory] = useState<MenuCategory | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);

  const menu = data?.data || [];
  const allItems: MenuItem[] = menu.flatMap((c: any) => c.items || []);
  const allCategories: MenuCategory[] = menu.map((c: any) => ({ _id: c._id, name: c.name, description: c.description, sortOrder: c.sortOrder, restaurantId: c.restaurantId, isActive: c.isActive, createdAt: c.createdAt, updatedAt: c.updatedAt }));

  const displayedItems = activeCategory === 'all'
    ? allItems
    : allItems.filter(i => {
        const catId = (i.categoryId as any)?._id || i.categoryId;
        return catId === activeCategory;
      });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menu'] }); toast.success('Category deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteItem(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menu'] }); toast.success('Item deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) => menuApi.updateItem(id, { isAvailable: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
    onError: () => toast.error('Failed to update'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Menu Management</h1>
          <p className="text-slate-400 text-sm mt-1">{allItems.length} items across {menu.length} categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Tag className="w-4 h-4" />} onClick={() => setShowCategoryForm(true)}>
            Add Category
          </Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowItemForm(true)}>
            Add Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-3">Categories</h3>
          <button onClick={() => setActiveCategory('all')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeCategory === 'all' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
            <span>All Items</span>
            <span className="text-xs opacity-75">{allItems.length}</span>
          </button>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)
            : menu.map((c: any) => (
              <div key={c._id} className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${activeCategory === c._id ? 'bg-orange-500/15 border border-orange-500/30' : 'hover:bg-slate-800'}`}
                onClick={() => setActiveCategory(c._id)}>
                <span className={`flex-1 text-sm font-medium truncate ${activeCategory === c._id ? 'text-orange-400' : 'text-slate-300'}`}>{c.name}</span>
                <span className="text-xs text-slate-500">{c.items?.length || 0}</span>
                <div className="hidden group-hover:flex gap-1">
                  <button onClick={e => { e.stopPropagation(); setEditCategory({ ...c }); }}
                    className="p-1 rounded hover:bg-slate-700 text-slate-400"><Edit2 className="w-3 h-3" /></button>
                  <button onClick={e => { e.stopPropagation(); if (confirm('Delete category?')) deleteCategoryMutation.mutate(c._id); }}
                    className="p-1 rounded hover:bg-slate-700 text-red-400"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))
          }
        </div>

        {/* Items Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
            </div>
          ) : displayedItems.length === 0 ? (
            <Card><EmptyState icon={<ChefHat />} title="No items" description="Add menu items to this category" /></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayedItems.map(item => (
                <div key={item._id}
                  className={`bg-slate-800/60 border rounded-2xl p-4 transition-colors ${item.isAvailable ? 'border-slate-700/50' : 'border-red-500/20 opacity-60'}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-slate-100 truncate">{item.name}</h4>
                        {item.isFeatured && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
                    </div>
                    <span className="text-base font-bold text-orange-400 shrink-0">{formatCurrency(item.price)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.isVegetarian && <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-xs rounded">🌿 Veg</span>}
                    {item.isVegan && <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-xs rounded">🌱 Vegan</span>}
                    {item.isGlutenFree && <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded">🌾 GF</span>}
                    {item.preparationTime && <span className="px-1.5 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">⏱ {item.preparationTime}m</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleAvailability.mutate({ id: item._id, val: !item.isAvailable })}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${item.isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                        {item.isAvailable ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditItem(item)}
                        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm('Delete item?')) deleteItemMutation.mutate(item._id); }}
                        className="p-1.5 rounded-lg hover:bg-slate-700 text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(showCategoryForm || editCategory) && (
        <CategoryModal cat={editCategory} onClose={() => { setShowCategoryForm(false); setEditCategory(null); }} />
      )}
      {(showItemForm || editItem) && (
        <ItemModal item={editItem} categories={allCategories} onClose={() => { setShowItemForm(false); setEditItem(null); }} />
      )}
    </div>
  );
}
