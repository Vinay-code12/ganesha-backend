import React from 'react';
import { Building2, ShoppingBag, DollarSign, Calendar, TrendingUp, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useSuperAdminDashboard } from '../../hooks';
import { StatCard, CardSkeleton, Card, StatusBadge } from '../../components/ui';
import { formatCurrency, getPlanColor, capitalize } from '../../utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981'];

const SuperAdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useSuperAdminDashboard();

  const revenueData = stats?.revenueByMonth?.map(item => ({
    month: MONTHS[(item._id.month || 1) - 1],
    revenue: item.revenue,
    orders: item.orders,
  })) || [];

  const planData = stats?.restaurantsByPlan?.map(p => ({
    name: capitalize(p._id || 'unknown'),
    value: p.count,
  })) || [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
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
        <StatCard
          title="Total Restaurants"
          value={stats?.totalRestaurants || 0}
          subtitle={`${stats?.activeRestaurants || 0} active`}
          icon={<Building2 size={22} />}
          color="brand"
        />
        <StatCard
          title="Today's Orders"
          value={stats?.totalOrdersToday || 0}
          subtitle="across all restaurants"
          icon={<ShoppingBag size={22} />}
          color="blue"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          subtitle="this month"
          icon={<DollarSign size={22} />}
          color="green"
        />
        <StatCard
          title="Monthly Bookings"
          value={stats?.totalBookings || 0}
          subtitle="this month"
          icon={<Calendar size={22} />}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Platform Revenue</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monthly revenue across all restaurants</p>
            </div>
            <TrendingUp size={18} className="text-brand-600" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="url(#revenueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Subscription Plans</h3>
            <Award size={18} className="text-purple-500" />
          </div>
          {planData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={planData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {planData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {planData.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{p.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No subscription data</p>
          )}
        </Card>
      </div>

      {/* Top Restaurants */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Top Performing Restaurants</h3>
          <Award size={18} className="text-brand-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3 pr-4">#</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Restaurant</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Plan</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase pb-3">Orders</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase pb-3">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {stats?.topRestaurants?.map((r, i) => (
                <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 pr-4 text-sm font-bold text-gray-400">#{i + 1}</td>
                  <td className="py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{r.restaurant?.name}</p>
                      <p className="text-xs text-gray-500">{r.restaurant?.email}</p>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getPlanColor(r.restaurant?.subscriptionPlan)}`}>
                      {capitalize(r.restaurant?.subscriptionPlan || '')}
                    </span>
                  </td>
                  <td className="py-3 text-right text-sm font-medium text-gray-900 dark:text-white">{r.orderCount?.toLocaleString()}</td>
                  <td className="py-3 text-right text-sm font-bold text-brand-600">{formatCurrency(r.totalRevenue)}</td>
                </tr>
              ))}
              {!stats?.topRestaurants?.length && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-400">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;
