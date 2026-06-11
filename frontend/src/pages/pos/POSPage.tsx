import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Plus, Minus, ChefHat, Zap, ArrowLeft, RefreshCw, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { useFullMenu, useTodayOrders } from '../../hooks';
import { orderApi } from '../../api/services';
import { useSocket } from '../../context/SocketContext';
import { useAuthStore } from '../../context/authStore';
import { StatusBadge, Skeleton } from '../../components/ui';
import { formatCurrency } from '../../utils';
import toast from 'react-hot-toast';
import type { Order, MenuItem, MenuCategory } from '../../types';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function LiveOrderCard({ order, onUpdate }: { order: Order; onUpdate: (id: string, status: string) => void }) {
  const STATUS_NEXT: Record<string, { label: string; color: string }> = {
    pending:   { label: 'Confirm', color: 'bg-green-600 hover:bg-green-700' },
    confirmed: { label: 'Preparing', color: 'bg-yellow-600 hover:bg-yellow-700' },
    preparing: { label: 'Ready', color: 'bg-blue-600 hover:bg-blue-700' },
    ready:     { label: 'Delivered', color: 'bg-purple-600 hover:bg-purple-700' },
  };
  const next = STATUS_NEXT[order.status];
  const ageMinutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const isUrgent = ageMinutes > 20 && !['delivered','cancelled'].includes(order.status);

  return (
    <div className={`rounded-xl p-3 border transition-all ${
      isUrgent ? 'border-red-500/50 bg-red-500/5' :
      order.status === 'ready' ? 'border-green-500/40 bg-green-500/5' :
      order.status === 'preparing' ? 'border-yellow-500/30 bg-yellow-500/5' :
      'border-slate-700/50 bg-slate-800/40'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-mono text-xs font-bold text-orange-400">{order.orderNumber}</span>
          {order.tableNumber && <span className="text-xs text-slate-500 ml-2">T-{order.tableNumber}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
          <span className="text-xs text-slate-500">{ageMinutes}m</span>
        </div>
      </div>
      <div className="space-y-0.5 mb-2">
        {order.items.slice(0, 3).map((item, i) => (
          <p key={i} className="text-xs text-slate-400">
            <span className="text-orange-400">{item.quantity}×</span> {(item.menuItemId as any)?.name || 'Item'}
          </p>
        ))}
        {order.items.length > 3 && <p className="text-xs text-slate-600">+{order.items.length - 3} more</p>}
      </div>
      <div className="flex items-center justify-between">
        <StatusBadge status={order.status} />
        {next && (
          <button onClick={() => {
              const map: Record<string,string> = { pending:'confirmed', confirmed:'preparing', preparing:'ready', ready:'delivered' };
              onUpdate(order._id, map[order.status]);
            }}
            className={`px-2 py-1 rounded-lg text-white text-xs font-semibold transition-colors ${next.color}`}>
            {next.label}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── POS Main ─────────────────────────────────────────────────────────────────
export default function POSPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const qc = useQueryClient();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderNote, setOrderNote] = useState('');
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(null);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [showLive, setShowLive] = useState(true);

  const { data: menuData, isLoading: menuLoading } = useFullMenu();
  const { data: todayData } = useTodayOrders();

  const menu = menuData || [];

  // Populate live orders from today's data
  useEffect(() => {
    const orders: Order[] = todayData?.orders || [];
    setLiveOrders(orders.filter(o => !['delivered','cancelled'].includes(o.status)));
  }, [todayData]);

  // Socket: listen for real-time order updates
  useEffect(() => {
    if (!socket) return;
    const handleNew = (order: Order) => {
      setLiveOrders(prev => [order, ...prev.filter(o => o._id !== order._id)]);
      toast('New order: ' + order.orderNumber, { icon: '🔔' });
    };
    const handleUpdate = (order: Order) => {
      setLiveOrders(prev => {
        if (['delivered','cancelled'].includes(order.status)) return prev.filter(o => o._id !== order._id);
        return prev.map(o => o._id === order._id ? order : o);
      });
    };
    socket.on('order:created', handleNew);
    socket.on('order:updated', handleUpdate);
    socket.on('order:completed', handleUpdate);
    socket.on('order:cancelled', handleUpdate);
    return () => {
      socket.off('order:created', handleNew);
      socket.off('order:updated', handleUpdate);
      socket.off('order:completed', handleUpdate);
      socket.off('order:cancelled', handleUpdate);
    };
  }, [socket]);

  // Cart helpers
  const addItem = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem._id === item._id);
      if (existing) return prev.map(c => c.menuItem._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeItem = (itemId: string) => setCart(prev => prev.filter(c => c.menuItem._id !== itemId));

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.menuItem._id !== itemId) return c;
      const newQty = c.quantity + delta;
      return newQty <= 0 ? null : { ...c, quantity: newQty };
    }).filter(Boolean) as CartItem[]);
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  // All items flat
  const allItems: MenuItem[] = menu.flatMap((c: any) => c.items || []).filter((i: MenuItem) => i.availability);
  const displayedItems = activeCategory === 'all' ? allItems : allItems.filter((i: MenuItem) => {
    const catId = (i.categoryId as any)?._id || i.categoryId;
    return catId === activeCategory;
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => orderApi.updateStatus(id, s),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['today-orders'] });
    },
    onError: () => toast.error('Failed to update order'),
  });

  const placeMutation = useMutation({
    mutationFn: (data: any) => orderApi.create(data),
    onSuccess: (res) => {
      const order = res.data?.order;
      setOrderPlaced(order);
      setCart([]);
      setTableNumber('');
      setCustomerName('');
      setOrderNote('');
      qc.invalidateQueries({ queryKey: ['today-orders'] });
      toast.success('Order placed!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to place order'),
  });

  const placeOrder = () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    placeMutation.mutate({
      restaurantId: user?.restaurantId,
      items: cart.map(c => ({ menuItemId: c.menuItem._id, quantity: c.quantity, notes: c.notes })),
      tableNumber,
      orderType: tableNumber ? 'dine_in' : 'takeaway',
      paymentMethod,
      notes: orderNote,
    });
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-400" />
            <span className="font-bold text-slate-100">POS Terminal</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isConnected ? 'Live' : 'Offline'}
          </div>
          <button onClick={() => setShowLive(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showLive ? 'bg-orange-500/15 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>
            <Zap className="w-3.5 h-3.5" />
            Live Orders {liveOrders.length > 0 && `(${liveOrders.length})`}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Live Orders Panel */}
        {showLive && (
          <div className="w-56 shrink-0 bg-slate-900/50 border-r border-slate-800 flex flex-col overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active</span>
              <span className="text-xs bg-orange-500/15 text-orange-400 px-1.5 py-0.5 rounded-full font-semibold">{liveOrders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {liveOrders.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-6">No active orders</p>
              ) : liveOrders.map(o => (
                <LiveOrderCard key={o._id} order={o}
                  onUpdate={(id, s) => statusMutation.mutate({ id, s })} />
              ))}
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category tabs */}
          <div className="flex gap-2 px-4 py-2.5 overflow-x-auto border-b border-slate-800 shrink-0 scrollbar-thin">
            <button onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${activeCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
              All ({allItems.length})
            </button>
            {menu.map((cat: any) => (
              <button key={cat._id} onClick={() => setActiveCategory(cat._id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${activeCategory === cat._id ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                {cat.name} ({cat.items?.length || 0})
              </button>
            ))}
          </div>

          {/* Items grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {menuLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600">
                <ChefHat className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No items available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {displayedItems.map(item => {
                  const inCart = cart.find(c => c.menuItem._id === item._id);
                  return (
                    <button key={item._id} onClick={() => addItem(item)}
                      className={`relative text-left p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        inCart ? 'border-orange-500/50 bg-orange-500/8' : 'border-slate-700/50 bg-slate-800/60 hover:border-slate-600'
                      }`}>
                      {inCart && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {inCart.quantity}
                        </div>
                      )}
                      <p className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug mb-1.5">{item.name}</p>
                      <p className="text-orange-400 font-bold text-sm">{formatCurrency(item.price)}</p>
                      {item.preparationTime && (
                        <p className="text-xs text-slate-600 mt-0.5">⏱ {item.preparationTime}m</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cart / Order Panel */}
        <div className="w-72 shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-orange-400" />
              <span className="font-semibold text-slate-100">Order</span>
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Clear</button>
            )}
          </div>

          {/* Order placed confirmation */}
          {orderPlaced && (
            <div className="m-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">Order Placed!</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{orderPlaced.orderNumber}</p>
              <button onClick={() => setOrderPlaced(null)} className="text-xs text-slate-500 mt-1 hover:text-slate-300">Dismiss</button>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 py-8">
                <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Tap items to add</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(c => (
                  <div key={c.menuItem._id} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{c.menuItem.name}</p>
                      <p className="text-xs text-orange-400">{formatCurrency(c.menuItem.price * c.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(c.menuItem._id, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold text-slate-100 w-5 text-center">{c.quantity}</span>
                      <button onClick={() => updateQty(c.menuItem._id, 1)}
                        className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeItem(c.menuItem._id)}
                        className="w-6 h-6 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Details & Checkout */}
          <div className="border-t border-slate-800 p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input value={tableNumber} onChange={e => setTableNumber(e.target.value)}
                placeholder="Table #"
                className="px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-orange-500 placeholder-slate-600" />
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                className="px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-orange-500">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="online">Online</option>
              </select>
            </div>
            <input value={orderNote} onChange={e => setOrderNote(e.target.value)}
              placeholder="Order note (optional)"
              className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-orange-500 placeholder-slate-600" />

            {/* Totals */}
            {cart.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-100 pt-1 border-t border-slate-700">
                  <span>Total</span>
                  <span className="text-orange-400">{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            )}

            <button onClick={placeOrder} disabled={cart.length === 0 || placeMutation.isPending}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              {placeMutation.isPending ? (
                <><RefreshCw className="w-4 h-4 animate-spin" />Placing...</>
              ) : (
                <><ShoppingCart className="w-4 h-4" />Place Order · {formatCurrency(cartTotal)}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
