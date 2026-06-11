import React, { useState } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Modal, Button, Input, Select } from '../ui';
import { useCreateOrder, useFullMenu } from '../../hooks';
import { formatCurrency } from '../../utils';
import { MenuCategory, MenuItem } from '../../types';

interface CartItem { menuItemId: string; name: string; price: number; quantity: number; notes?: string }

const CreateOrderModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { data: menu } = useFullMenu();
  const createOrder = useCreateOrder();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const addItem = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item._id);
      if (existing) return prev.map(c => c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.menuItemId === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(c => c.menuItemId !== id));

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const handleSubmit = async () => {
    if (!cart.length) return;
    await createOrder.mutateAsync({ items: cart, tableNumber, notes });
    onClose();
  };

  const categories = menu || [];
  const currentCat = activeCategory || categories[0]?._id || '';
  const currentItems = categories.find(c => c._id === currentCat)?.items || [];

  return (
    <Modal isOpen title="New Order" onClose={onClose} size="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-hidden">
        {/* Menu */}
        <div className="flex flex-col min-h-0">
          <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0">
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => setActiveCategory(cat._id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentCat === cat._id
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto flex-1 grid grid-cols-2 gap-2 mt-2 content-start">
            {currentItems.map(item => (
              <button
                key={item._id}
                onClick={() => addItem(item)}
                className="text-left p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-brand-600 font-semibold mt-1">{formatCurrency(item.price)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="flex flex-col min-h-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Order Summary</h4>
          <div className="overflow-y-auto flex-1 space-y-2 mb-3">
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Add items from the menu</p>
            ) : (
              cart.map(item => (
                <div key={item.menuItemId} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.menuItemId, -1)} className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300">
                      <Minus size={10} />
                    </button>
                    <span className="text-xs w-5 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => updateQty(item.menuItemId, 1)} className="w-6 h-6 rounded bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700">
                      <Plus size={10} />
                    </button>
                    <button onClick={() => removeItem(item.menuItemId)} className="w-6 h-6 rounded bg-red-100 text-red-500 flex items-center justify-center ml-1">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 flex-shrink-0">
            <Input label="Table #" value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="Optional" />
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Tax (8.5%)</span>
                <span>{formatCurrency(subtotal * 0.085)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-brand-600">{formatCurrency(subtotal * 1.085)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" loading={createOrder.isPending} disabled={!cart.length} onClick={handleSubmit}>
                Place Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export { CreateOrderModal };
export default CreateOrderModal;
