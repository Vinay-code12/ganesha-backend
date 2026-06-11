import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Filter, RefreshCw, Plus } from 'lucide-react';
import { useOrders, useUpdateOrderStatus } from '../../hooks';
import { Card, StatusBadge, Button, Select, Input, Pagination, Skeleton, EmptyState } from '../../components/ui';
import { formatCurrency, formatDateTime } from '../../utils';
import { Order, OrderStatus } from '../../types';
import { useAuthStore } from '../../context/authStore';
import CreateOrderModal from '../../components/modals/CreateOrderModal';

const ORDER_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_FLOW: Record<string, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['delivered'],
  delivered: [],
  cancelled: [],
};

const OrdersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', paymentStatus: '' });
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
  const { data, isLoading } = useOrders(params);
  const updateStatus = useUpdateOrderStatus();

  const orders: Order[] = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Orders</h2>
          <p className="text-sm text-gray-500">{pagination?.total || 0} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => qc.invalidateQueries({ queryKey: ['orders'] })}>
            Refresh
          </Button>
          {(user?.role === 'restaurant_admin' || user?.role === 'super_admin') && (
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>New Order</Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card padding={false} className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            value={filters.status}
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
            options={ORDER_STATUSES}
            className="sm:w-48"
          />
          <Select
            value={filters.paymentStatus}
            onChange={e => { setFilters(f => ({ ...f, paymentStatus: e.target.value })); setPage(1); }}
            options={[
              { value: '', label: 'All Payments' },
              { value: 'pending', label: 'Payment Pending' },
              { value: 'paid', label: 'Paid' },
              { value: 'refunded', label: 'Refunded' },
            ]}
            className="sm:w-48"
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 dark:border-gray-700">
              <tr>
                {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Payment', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="py-16">
                  <EmptyState title="No orders found" description="Orders will appear here once they are created." />
                </td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-brand-600">{order.orderNumber}</span>
                      {order.tableNumber && <p className="text-xs text-gray-400">Table {order.tableNumber}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {(order.customerId as { name: string })?.name || 'Walk-in'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{order.items.length} item(s)</p>
                      <p className="text-xs text-gray-400 truncate max-w-32">{order.items.slice(0, 2).map(i => i.name).join(', ')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.totalAmount)}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={order.paymentStatus} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {STATUS_FLOW[order.status]?.map(nextStatus => (
                          <Button
                            key={nextStatus}
                            size="sm"
                            variant={nextStatus === 'cancelled' ? 'danger' : 'secondary'}
                            loading={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: order._id, status: nextStatus })}
                            className="text-xs"
                          >
                            {nextStatus}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} />}
    </div>
  );
};

export default OrdersPage;
