import React from 'react';
import { ShoppingBag, DollarSign, Calendar, Users, TrendingUp, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useRestaurantDashboard } from '../../hooks';
import { StatCard, CardSkeleton, Card, StatusBadge } from '../../components/ui';
import { formatCurrency, capitalize } from '../../utils';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#3b82f6', preparing: '#8b5cf6',
  ready: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444',
};

const RestaurantDashboard: React.FC = () => {
  const { data: stats, isLoading } = useRestaurantDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Orders" value={stats?.todayOrders || 0} subtitle="orders today" icon={<ShoppingBag size={22} />} color="brand" />
        <StatCard title="Today's Revenue" value={formatCurrency(stats?.todayRevenue || 0)} subtitle="today's earnings" icon={<DollarSign size={22} />} color="green" />
        <StatCard title="Today's Bookings" value={stats?.todayBookings || 0} subtitle="table reservations" icon={<Calendar size={22} />} color="blue" />
        <StatCard title="Total Customers" value={stats?.totalCustomers || 0} subtitle="registered customers" icon={<Users size={22} />} color="purple" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
            </div>
            <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
              <TrendingUp size={24} className="text-brand-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500">{stats?.monthlyOrders || 0} orders this month</p>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Order Status Breakdown</p>
          <div className="flex flex-wrap gap-2">
            {stats?.ordersByStatus?.map(s => (
              <div key={s._id} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s._id] || '#94a3b8' }} />
                <span className="text-gray-600 dark:text-gray-400 capitalize">{s._id}: <strong>{s.count}</strong></span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Revenue (Last 30 Days)</h3>
              <p className="text-sm text-gray-500">Daily revenue trend</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats?.revenueByDay || []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-10" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={l => `Date: ${l}`} />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Top items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Top Menu Items</h3>
            <Star size={16} className="text-amber-500" />
          </div>
          <div className="space-y-3">
            {stats?.topMenuItems?.map((item, i) => (
              <div key={item._id} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-brand-50 dark:bg-brand-900/20 rounded-lg flex items-center justify-center text-xs font-bold text-brand-600">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item._id}</p>
                  <p className="text-xs text-gray-500">{item.quantity} sold</p>
                </div>
                <span className="text-sm font-semibold text-brand-600">{formatCurrency(item.revenue)}</span>
              </div>
            ))}
            {!stats?.topMenuItems?.length && (
              <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
