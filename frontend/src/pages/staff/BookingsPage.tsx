import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock, Users, Phone } from 'lucide-react';
import { useTodayBookings, useBookings } from '../../hooks';
import { bookingApi } from '../../api/services';
import { StatusBadge, Card, Skeleton, EmptyState, Pagination } from '../../components/ui';
import { formatDate } from '../../utils';
import toast from 'react-hot-toast';
import type { Booking } from '../../types';

const STATUS_ACTIONS: Record<string, { label: string; next: string; color: string }[]> = {
  pending:   [{ label: 'Confirm', next: 'confirmed', color: 'bg-green-500 hover:bg-green-600' }],
  confirmed: [{ label: 'Seat', next: 'seated', color: 'bg-blue-500 hover:bg-blue-600' }, { label: 'No Show', next: 'no_show', color: 'bg-slate-600 hover:bg-slate-500' }],
  seated:    [{ label: 'Complete', next: 'completed', color: 'bg-purple-500 hover:bg-purple-600' }],
  completed: [], cancelled: [], no_show: [],
};

export default function StaffBookingsPage() {
  const [view, setView] = useState<'today' | 'all'>('today');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data: todayData, isLoading: todayLoading } = useTodayBookings();
  const { data: allData, isLoading: allLoading } = useBookings({ page, limit: 12 });

  const bookings: Booking[] = view === 'today'
    ? (todayData?.data?.bookings || [])
    : (allData?.data?.bookings || []);
  const isLoading = view === 'today' ? todayLoading : allLoading;
  const meta = allData?.data?.pagination;

  const statusMutation = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => bookingApi.updateStatus(id, s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['today-bookings'] });
      toast.success('Updated');
    },
    onError: () => toast.error('Failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Reservations</h1>
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl">
          {(['today','all'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === v ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {v === 'today' ? 'Today' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : bookings.length === 0 ? (
        <Card><EmptyState icon={<CalendarDays />} title="No bookings" description="No reservations for this period" /></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {bookings.map(b => {
              const actions = STATUS_ACTIONS[b.status] || [];
              return (
                <div key={b._id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 space-y-3 hover:border-slate-600 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-100">{b.guestName}</p>
                      <p className="text-xs font-mono text-orange-400">{b.bookingNumber}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-sm text-slate-400">
                    <div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{formatDate(b.bookingDate)}</div>
                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{b.timeSlot}</div>
                    <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{b.guests} guests</div>
                    <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{b.guestPhone}</div>
                  </div>
                  {b.notes && <p className="text-xs text-slate-500 italic bg-slate-900/40 rounded-lg p-2">"{b.notes}"</p>}
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
          {view === 'all' && meta && meta.totalPages > 1 && (
            <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
