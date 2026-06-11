import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Building2, ShoppingBag, DollarSign, Users } from 'lucide-react';
import { analyticsApi } from '../../api/services';
import { Card, StatCard, Skeleton } from '../../components/ui';
import { formatCurrency } from '../../utils';

const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.name.toLowerCase().includes('revenue') ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function SuperAdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-analytics'],
    queryFn: () => analyticsApi.getSuperAdminDashboard(),
  });

  const d = data?.data;

  const planData = d?.subscriptionBreakdown ? [
    { name: 'Basic', value: d.subscriptionBreakdown.basic || 0 },
    { name: 'Pro', value: d.subscriptionBreakdown.pro || 0 },
    { name: 'Enterprise', value: d.subscriptionBreakdown.enterprise || 0 },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Platform Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Comprehensive platform performance overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          : <>
            <StatCard title="Total Revenue" value={formatCurrency(d?.totalRevenue || 0)} icon={<DollarSign />} trend={12} color="green" />
            <StatCard title="Total Restaurants" value={d?.totalRestaurants || 0} icon={<Building2 />} color="orange" />
            <StatCard title="Total Orders" value={(d?.totalOrders || 0).toLocaleString()} icon={<ShoppingBag />} trend={8} color="blue" />
            <StatCard title="Total Users" value={(d?.totalUsers || 0).toLocaleString()} icon={<Users />} color="purple" />
          </>
        }
      </div>

      {/* Revenue Chart */}
      <Card>
        <h3 className="text-base font-semibold text-slate-100 mb-6">Monthly Revenue</h3>
        {isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={d?.monthlyRevenue || []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f97316" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders vs Bookings */}
        <Card>
          <h3 className="text-base font-semibold text-slate-100 mb-6">Orders & Bookings</h3>
          {isLoading ? <Skeleton className="h-56 w-full rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d?.monthlyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="orders" name="Orders" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bookings" name="Bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Subscription Pie */}
        <Card>
          <h3 className="text-base font-semibold text-slate-100 mb-6">Subscription Plans</h3>
          {isLoading ? <Skeleton className="h-56 w-full rounded-xl" /> : (
            <div className="flex items-center justify-around">
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie data={planData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {planData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {planData.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-sm text-slate-300">{p.name}</span>
                    <span className="text-sm font-semibold text-slate-100 ml-2">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Top Restaurants */}
      <Card>
        <h3 className="text-base font-semibold text-slate-100 mb-4">Top Restaurants by Revenue</h3>
        {isLoading ? <Skeleton className="h-48 w-full rounded-xl" /> : (
          <div className="space-y-3">
            {(d?.topRestaurants || []).map((r: any, i: number) => (
              <div key={r._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 transition-colors">
                <span className="text-lg font-bold text-slate-600 w-6">#{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold text-xs">
                  {r.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-100">{formatCurrency(r.revenue)}</p>
                  <div className="h-1.5 bg-slate-700 rounded-full mt-1.5 w-24">
                    <div className="h-1.5 bg-orange-500 rounded-full"
                      style={{ width: `${Math.min(100, (r.revenue / (d?.topRestaurants[0]?.revenue || 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
