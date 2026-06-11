import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { analyticsApi } from '../../api/services';
import { useAuthStore } from '../../context/authStore';
import { Card, StatCard, Skeleton } from '../../components/ui';
import { formatCurrency } from '../../utils';
import { TrendingUp, ShoppingBag, Users, DollarSign } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.name === 'Revenue' ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const PERIODS = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '1 Year', value: '1y' },
];

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState('30d');

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['restaurant-dashboard', user?.restaurantId],
    queryFn: () => analyticsApi.getRestaurantDashboard(user!.restaurantId!),
    enabled: !!user?.restaurantId,
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-analytics', user?.restaurantId, period],
    queryFn: () => analyticsApi.getSalesAnalytics(user!.restaurantId!, { period }),
    enabled: !!user?.restaurantId,
  });

  const d = dashData?.data;
  const s = salesData?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Sales analytics and performance metrics</p>
        </div>
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p.value ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          : <>
            <StatCard title="Total Revenue" value={formatCurrency(d?.totalRevenue || 0)} icon={<DollarSign />} trend={d?.revenueGrowth} color="green" />
            <StatCard title="Total Orders" value={(d?.totalOrders || 0).toLocaleString()} icon={<ShoppingBag />} trend={d?.ordersGrowth} color="orange" />
            <StatCard title="Total Bookings" value={(d?.totalBookings || 0).toLocaleString()} icon={<Users />} color="blue" />
            <StatCard title="Avg Order Value" value={formatCurrency(d?.avgOrderValue || 0)} icon={<TrendingUp />} color="purple" />
          </>
        }
      </div>

      {/* Revenue Over Time */}
      <Card>
        <h3 className="text-base font-semibold text-slate-100 mb-6">Revenue & Orders Over Time</h3>
        {salesLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={s?.dailyRevenue || []}>
              <defs>
                <linearGradient id="revGradR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f97316" strokeWidth={2} fill="url(#revGradR)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Menu Items */}
        <Card>
          <h3 className="text-base font-semibold text-slate-100 mb-4">Top Selling Items</h3>
          {dashLoading ? <Skeleton className="h-48 w-full rounded-xl" /> : (
            <div className="space-y-3">
              {(d?.topMenuItems || []).slice(0, 6).map((item: any, i: number) => (
                <div key={item._id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-600 w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{item.name}</p>
                    <div className="h-1.5 bg-slate-700 rounded-full mt-1">
                      <div className="h-1.5 bg-orange-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (item.quantity / ((d?.topMenuItems[0]?.quantity) || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-100">{item.quantity} sold</p>
                    <p className="text-xs text-slate-500">{formatCurrency(item.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Orders by Status */}
        <Card>
          <h3 className="text-base font-semibold text-slate-100 mb-4">Orders by Status</h3>
          {salesLoading ? <Skeleton className="h-48 w-full rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={s?.ordersByStatus || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="status" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Orders" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Payment Methods */}
      {s?.revenueByPayment && (
        <Card>
          <h3 className="text-base font-semibold text-slate-100 mb-4">Revenue by Payment Method</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {s.revenueByPayment.map((p: any) => (
              <div key={p.method} className="bg-slate-800/50 rounded-xl p-4 text-center">
                <p className="text-lg font-bold text-slate-100">{formatCurrency(p.total)}</p>
                <p className="text-xs text-slate-500 mt-1 capitalize">{p.method.replace('_', ' ')}</p>
                <p className="text-xs text-orange-400 mt-0.5">{p.count} orders</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
