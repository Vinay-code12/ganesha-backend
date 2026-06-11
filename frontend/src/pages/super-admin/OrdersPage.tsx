import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingBag, Filter } from 'lucide-react';
import { orderApi } from '../../api/services';
import { Card, StatusBadge, Skeleton, EmptyState, Pagination } from '../../components/ui';
import { formatCurrency, formatDateTime } from '../../utils';
import type { Order } from '../../types';

export default function SuperAdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['all-orders', { search, status, paymentStatus, page }],
    queryFn: () => orderApi.getAll({ search, status, paymentStatus, page, limit: 15 }),
  });

  const orders: Order[] = data?.data?.orders || [];
  const meta = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">All Orders</h1>
        <p className="text-slate-400 text-sm mt-1">Platform-wide order management</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by order #, customer..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500" />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-orange-500">
            <option value="">All Statuses</option>
            {['pending','confirmed','preparing','ready','delivered','cancelled'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select value={paymentStatus} onChange={e => { setPaymentStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-orange-500">
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </Card>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {['Order #','Restaurant','Customer','Items','Total','Status','Payment','Date'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
                    ))}</tr>
                  ))
                : orders.length === 0
                ? <tr><td colSpan={8} className="py-16">
                    <EmptyState icon={<ShoppingBag />} title="No orders found" description="Orders will appear here" />
                  </td></tr>
                : orders.map(o => (
                  <tr key={o._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-orange-400">{o.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {(o.restaurantId as any)?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {(o.customerId as any)?.name || 'Walk-in'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{o.items.length} item(s)</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-100">
                      {formatCurrency(o.totalAmount)}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                    <td className="px-6 py-4"><StatusBadge status={o.paymentStatus} /></td>
                    <td className="px-6 py-4 text-xs text-slate-500">{formatDateTime(o.createdAt)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-800">
            <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
