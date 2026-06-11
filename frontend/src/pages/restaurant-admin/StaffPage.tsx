import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserCog, Trash2, Mail, Phone } from 'lucide-react';
import { useStaff, useAddStaff } from '../../hooks';
import { staffApi } from '../../api/services';
import { Button, Card, Skeleton, EmptyState, Modal, Input, Select, Avatar } from '../../components/ui';
import { formatDate } from '../../utils';
import toast from 'react-hot-toast';
import type { Staff } from '../../types';

function AddStaffModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', position: '', role: 'staff' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data: typeof form) => staffApi.add(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Staff member added'); onClose(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add staff'),
  });

  return (
    <Modal title="Add Staff Member" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" />
          <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@restaurant.com" />
          <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555-0000" />
          <Input label="Password" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" />
          <Input label="Position" value={form.position} onChange={e => set('position', e.target.value)} placeholder="e.g. Head Chef, Waiter" />
          <Select label="Role" value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="staff">Staff</option>
            <option value="restaurant_admin">Admin</option>
          </Select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate(form)} loading={mutation.isPending}>Add Member</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function StaffPage() {
  const [showAdd, setShowAdd] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useStaff();
  const staffList: Staff[] = data?.data?.staff || [];

  const removeMutation = useMutation({
    mutationFn: (id: string) => staffApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Staff removed'); },
    onError: () => toast.error('Failed to remove staff'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Staff</h1>
          <p className="text-slate-400 text-sm mt-1">{staffList.length} team members</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>Add Staff</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : staffList.length === 0 ? (
        <Card><EmptyState icon={<UserCog />} title="No staff members" description="Add your first team member to get started" /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map(s => {
            const user = (s.userId as any);
            return (
              <div key={s._id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={user?.name || 'S'} size="md" />
                    <div>
                      <p className="font-semibold text-slate-100">{user?.name}</p>
                      <p className="text-xs text-orange-400 font-medium">{s.position || user?.role}</p>
                    </div>
                  </div>
                  <button onClick={() => { if (confirm('Remove this staff member?')) removeMutation.mutate(s._id); }}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {user?.email && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail className="w-3.5 h-3.5" /><span className="truncate">{user.email}</span>
                    </div>
                  )}
                  {user?.phone && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-3.5 h-3.5" />{user.phone}
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    s.isActive ? 'bg-green-500/10 text-green-400' : 'bg-slate-600/30 text-slate-500'
                  }`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-slate-600">{formatDate(s.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddStaffModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
