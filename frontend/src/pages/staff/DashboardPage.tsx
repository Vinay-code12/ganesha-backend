import { useAuthStore } from '../../context/authStore';
import { useTodayOrders, useTodayBookings } from '../../hooks';
import { Card, StatusBadge, Skeleton } from '../../components/ui';
import { ShoppingBag, CalendarDays, Clock, Users } from 'lucide-react';
import { formatCurrency, formatTime } from '../../utils';
import type { Order, Booking } from '../../types';

export default function StaffDashboard() {
  const { user } = useAuthStore();
  const { data: ordersData, isLoading: ordersLoading } = useTodayOrders();
  const { data: bookingsData, isLoading: bookingsLoading } = useTodayBookings();

  const todayOrders: Order[] = ordersData?.data?.orders || [];
  const todayBookings: Booking[] = bookingsData?.data?.bookings || [];

  const activeOrders = todayOrders.filter(o => !['delivered','cancelled'].includes(o.status));
  const pendingBookings = todayBookings.filter(b => b.status === 'confirmed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-slate-400 text-sm mt-1">Here's what's happening today</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Orders", value: todayOrders.length, icon: <ShoppingBag className="w-5 h-5" />, color: 'text-orange-400', bg: 'bg-orange-500/10', loading: ordersLoading },
          { label: 'Active Orders', value: activeOrders.length, icon: <Clock className="w-5 h-5" />, color: 'text-yellow-400', bg: 'bg-yellow-500/10', loading: ordersLoading },
          { label: "Today's Bookings", value: todayBookings.length, icon: <CalendarDays className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10', loading: bookingsLoading },
          { label: 'Expected Guests', value: todayBookings.reduce((sum, b) => sum + b.guests, 0), icon: <Users className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/10', loading: bookingsLoading },
        ].map(s => (
          <Card key={s.label}>
            {s.loading ? <Skeleton className="h-16" /> : (
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${s.bg} ${s.color}`}>{s.icon}</div>
                <div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Orders */}
        <Card>
          <h3 className="text-base font-semibold text-slate-100 mb-4">Active Orders</h3>
          {ordersLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : activeOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.slice(0, 6).map(o => (
                <div key={o._id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="font-mono text-sm font-semibold text-orange-400">{o.orderNumber}</p>
                    <p className="text-xs text-slate-500">Table {o.tableNumber} · {o.items.length} item(s)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{formatCurrency(o.totalAmount)}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Today's Bookings */}
        <Card>
          <h3 className="text-base font-semibold text-slate-100 mb-4">Today's Reservations</h3>
          {bookingsLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : pendingBookings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No upcoming bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBookings.slice(0, 6).map(b => (
                <div key={b._id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="font-medium text-sm text-slate-200">{b.guestName}</p>
                    <p className="text-xs text-slate-500">{b.timeSlot} · {b.guests} guests</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
