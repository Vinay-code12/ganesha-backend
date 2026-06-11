import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CalendarDays, Clock, Users, Phone, Mail } from 'lucide-react';
import { useBookings, useTodayBookings } from '../../hooks';
import { bookingApi } from '../../api/services';
import { Button, StatusBadge, Card, Skeleton, EmptyState, Pagination, Modal, Input, Select, Textarea } from '../../components/ui';
import { formatDate, formatTime } from '../../utils';
import { useAuthStore } from '../../context/authStore';
import toast from 'react-hot-toast';
import type { Booking } from '../../types';

const STATUS_ACTIONS: Record<string, { label: string; next: string; color: string }[]> = {
  pending:   [{ label: 'Confirm', next: 'confirmed', color: 'bg-green-500 hover:bg-green-600' }, { label: 'Cancel', next: 'cancelled', color: 'bg-red-500 hover:bg-red-600' }],
  confirmed: [{ label: 'Seat', next: 'seated', color: 'bg-blue-500 hover:bg-blue-600' }, { label: 'Cancel', next: 'cancelled', color: 'bg-red-500 hover:bg-red-600' }],
  seated:    [{ label: 'Complete', next: 'completed', color: 'bg-purple-500 hover:bg-purple-600' }],
  completed: [],
  cancelled: [],
  no_show:   [],
};

function CreateBookingModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    guestName: '', guestEmail: '', guestPhone: '',
    bookingDate: '', timeSlot: '', guests: 2, tableNumber: '', notes: '',
  });

  const mutation = useMutation({
    mutationFn: (data: typeof form) => bookingApi.create({ ...data, restaurantId: user?.restaurantId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['today-bookings'] });
      toast.success('Booking created');
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create booking'),
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Modal title="New Reservation" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Guest Name" value={form.guestName} onChange={e => set('guestName', e.target.value)} placeholder="John Doe" />
          <Input label="Phone" value={form.guestPhone} onChange={e => set('guestPhone', e.target.value)} placeholder="+1 555-0000" />
          <Input label="Email" type="email" value={form.guestEmail} onChange={e => set('guestEmail', e.target.value)} placeholder="guest@email.com" />
          <Input label="Guests" type="number" value={form.guests} onChange={e => set('guests', +e.target.value)} min={1} max={20} />
          <Input label="Date" type="date" value={form.bookingDate} onChange={e => set('bookingDate', e.target.value)} />
          <Input label="Time Slot" value={form.timeSlot} onChange={e => set('timeSlot', e.target.value)} placeholder="7:00 PM" />
          <Input label="Table Number" value={form.tableNumber} onChange={e => set('tableNumber', e.target.value)} placeholder="T-12" />
        </div>
        <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Special requests, allergies..." rows={2} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate(form)} loading={mutation.isPending}>Create Booking</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function BookingsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<'list' | 'today'>('today');
  const qc = useQueryClient();

  const { data: todayData, isLoading: todayLoading } = useTodayBookings();
  const { data: allData, isLoading: allLoading } = useBookings({ search, status, page, limit: 10 });

  const todayBookings: Booking[] = todayData?.data?.bookings || [];
  const allBookings: Booking[] = allData?.data?.bookings || [];
  const meta = allData?.data?.pagination;

  const statusMutation = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => bookingApi.updateStatus(id, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['today-bookings'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Update failed'),
  });

  const bookings = view === 'today' ? todayBookings : allBookings;
  const isLoading = view === 'today' ? todayLoading : allLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reservations</h1>
          <p className="text-slate-400 text-sm mt-1">Manage table bookings and walk-ins</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>New Booking</Button>
      </div>

      {/* View toggle + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl">
          {(['today', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${view === v ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {v === 'today' ? "Today's" : 'All'} Bookings
            </button>
          ))}
        </div>
        {view === 'list' && (
          <>
            <div className="relative flex-1">
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search guest name, phone..."
                className="w-full pl-4 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-orange-500">
              <option value="">All Statuses</option>
              {['pending','confirmed','seated','completed','cancelled','no_show'].map(s => (
                <option key={s} value={s}>{s.replace('_',' ')}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Stats bar for today */}
      {view === 'today' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', val: todayBookings.length, color: 'text-slate-300' },
            { label: 'Confirmed', val: todayBookings.filter(b => b.status === 'confirmed').length, color: 'text-green-400' },
            { label: 'Seated', val: todayBookings.filter(b => b.status === 'seated').length, color: 'text-blue-400' },
            { label: 'Pending', val: todayBookings.filter(b => b.status === 'pending').length, color: 'text-yellow-400' },
          ].map(s => (
            <Card key={s.label} className="text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Bookings Grid / List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : bookings.length === 0 ? (
        <Card><EmptyState icon={<CalendarDays />} title="No bookings" description="No reservations for this period" /></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {bookings.map(b => {
              const actions = STATUS_ACTIONS[b.status] || [];
              return (
                <div key={b._id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-4 hover:border-slate-600 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-100">{b.guestName}</p>
                      <p className="text-xs font-mono text-orange-400">{b.bookingNumber}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" />{formatDate(b.bookingDate)}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 shrink-0" />{b.timeSlot}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users className="w-3.5 h-3.5 shrink-0" />{b.guests} guests
                    </div>
                    {b.tableNumber && (
                      <div className="text-slate-400">Table {b.tableNumber}</div>
                    )}
                    <div className="flex items-center gap-1.5 text-slate-400 col-span-2">
                      <Phone className="w-3.5 h-3.5 shrink-0" />{b.guestPhone}
                    </div>
                  </div>
                  {b.notes && <p className="text-xs text-slate-500 bg-slate-900/50 rounded-lg p-2 italic">"{b.notes}"</p>}
                  {actions.length > 0 && (
                    <div className="flex gap-2 pt-1">
                      {actions.map(a => (
                        <button key={a.next} onClick={() => statusMutation.mutate({ id: b._id, s: a.next })}
                          className={`flex-1 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors ${a.color}`}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {view === 'list' && meta && meta.totalPages > 1 && (
            <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      {showCreate && <CreateBookingModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
