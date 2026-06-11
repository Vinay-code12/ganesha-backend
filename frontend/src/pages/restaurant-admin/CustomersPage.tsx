import { useState } from 'react';
import { useCustomers } from '../../hooks';
import { Search, Users, ShoppingBag, DollarSign, Calendar } from 'lucide-react';
import { Card, Skeleton, EmptyState, Pagination, Avatar } from '../../components/ui';
import { formatCurrency, formatDate, fromNow } from '../../utils';
import type { Customer } from '../../types';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCustomers({ search, page, limit: 12 });
  const customers: Customer[] = data?.data?.customers || [];
  const meta = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Customers</h1>
        <p className="text-slate-400 text-sm mt-1">
          {meta?.totalItems || 0} total customers
        </p>
      </div>

      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500" />
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : customers.length === 0 ? (
        <Card><EmptyState icon={<Users />} title="No customers found" description="Customer data will populate as orders are placed" /></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map(c => (
              <div key={c._id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={c.name} size="md" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center bg-slate-900/50 rounded-xl p-2">
                    <p className="text-base font-bold text-orange-400">{c.totalOrders}</p>
                    <p className="text-xs text-slate-500">Orders</p>
                  </div>
                  <div className="text-center bg-slate-900/50 rounded-xl p-2 col-span-2">
                    <p className="text-base font-bold text-green-400">{formatCurrency(c.totalSpent)}</p>
                    <p className="text-xs text-slate-500">Total Spent</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500">
                  {c.phone && <p>📞 {c.phone}</p>}
                  {c.lastVisit && <p>🕐 Last visit {fromNow(c.lastVisit)}</p>}
                  <p>📅 Since {formatDate(c.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
          {meta && meta.totalPages > 1 && (
            <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
