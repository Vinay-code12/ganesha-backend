import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShoppingBag } from 'lucide-react';
import { useOrders, useTodayOrders } from '../../hooks';
import { orderApi } from '../../api/services';
import { Button, StatusBadge, Card, Skeleton, EmptyState, Pagination } from '../../components/ui';
import { formatCurrency, formatDateTime } from '../../utils';
import { CreateOrderModal } from '../../components/modals/CreateOrderModal';
import toast from 'react-hot-toast';
import type { Order } from '../../types';

const STATUS_ACTIONS: Record<string, { label: string; next: string; color: string }[]> = {
  pending:   [{ label: 'Confirm', next: 'confirmed', color: 'bg-green-500 hover:bg-green-600' }],
  confirmed: [{ label: 'Preparing', next: 'preparing', color: 'bg-yellow-500 hover:bg-yellow-600' }],
  preparing: [{ label: 'Ready', next: 'ready', color: 'bg-blue-500 hover:bg-blue-600' }],
  ready:     [{ label: 'Delivered', next: 'delivered', color: 'bg-purple-500 hover:bg-purple-600' }],
  delivered: [],
  cancelled: [],
};

export default function StaffOrdersPage() {
  const [view, setView] = useState<'today' | 'all'>('today');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: todayData, isLoading: todayLoading } = useTodayOrders();
  const { data: allData, isLoading: allLoading } = useOrders({ page, limit: 10 });

  const orders: Order[] = view === 'today'
    ? (todayData?.data?.orders || [])
    : (allData?.data?.orders || []);
  const isLoading = view === 'today' ? todayLoading : allLoading;
  const meta = allData?.data?.pagination;

  const statusMutation = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => orderApi.updateStatus(id, s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); qc.invalidateQueries({ queryKey: ['today-orders'] }); },
    onError: () => toast.error('Failed to update'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Orders</h1>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl">
            {(['today','all'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${view === v ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                {v === 'today' ? "Today" : "All"}
              </button>
            ))}
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>New Order</Button>
        </div>
      </div>

      {/* Status summary for today */}
      {view === 'today' && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {['pending','confirmed','preparing','ready','delivered','cancelled'].map(s => {
            const count = orders.filter(o => o.status === s).length;
            return (
              <Card key={s} className="text-center py-3">
                <p className="text-lg font-bold text-slate-100">{count}</p>
                <p className="text-xs text-slate-500 capitalize mt-0.5">{s}</p>
              </Card>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <Card><EmptyState icon={<ShoppingBag />} title="No orders" description="Orders will appear here" /></Card>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const actions = STATUS_ACTIONS[o.status] || [];
            return (
              <div key={o._id} className={`bg-slate-800/60 border rounded-2xl p-4 transition-colors ${
                o.status === 'pending' ? 'border-yellow-500/30' :
                o.status === 'preparing' ? 'border-blue-500/20' :
                o.status === 'ready' ? 'border-green-500/30' :
                'border-slate-700/50'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm font-bold text-orange-400">{o.orderNumber}</span>
                      {o.tableNumber && <span className="text-sm text-slate-400">Table {o.tableNumber}</span>}
                      <StatusBadge status={o.status} />
                      <StatusBadge status={o.paymentStatus} />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {o.items.slice(0, 3).map((item, i) => (
                        <span key={i} className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                          {item.quantity}x {(item.menuItemId as any)?.name || 'Item'}
                        </span>
                      ))}
                      {o.items.length > 3 && <span className="text-xs text-slate-500">+{o.items.length - 3} more</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-bold text-slate-100">{formatCurrency(o.totalAmount)}</span>
                    {actions.length > 0 && (
                      <div className="flex gap-2">
                        {actions.map(a => (
                          <button key={a.next} onClick={() => statusMutation.mutate({ id: o._id, s: a.next })}
                            className={`px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors ${a.color}`}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {view === 'all' && meta && meta.totalPages > 1 && (
            <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
          )}
        </div>
      )}

      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
