import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreVertical, Building2, Phone, Mail, CheckCircle, XCircle, Clock, Trash2, Edit2, KeyRound } from 'lucide-react';
import { restaurantApi } from '../../api/services';
import { Button, StatusBadge, Card, Skeleton, EmptyState, Pagination, Modal, Input, Select } from '../../components/ui';
import { formatDate } from '../../utils';
import toast from 'react-hot-toast';
import type { Restaurant } from '../../types';

const PLAN_OPTIONS = [
  { value: 'starter', label: 'Starter' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];

type RestaurantFormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  cuisine: string;
  subscriptionPlan: string;
  status: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};

type CreatedCredentials = {
  restaurantName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};

function RestaurantFormModal({
  restaurant,
  onClose,
  onCreated,
}: {
  restaurant?: Restaurant | null;
  onClose: () => void;
  onCreated?: (credentials: CreatedCredentials) => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!restaurant;
  const [form, setForm] = useState<RestaurantFormState>({
    name: restaurant?.name || '',
    email: restaurant?.email || '',
    phone: restaurant?.phone || '',
    address: restaurant?.address || '',
    cuisine: restaurant?.cuisine || 'Multi-cuisine',
    subscriptionPlan: restaurant?.subscriptionPlan || 'starter',
    status: restaurant?.status || 'active',
    adminName: restaurant?.adminId?.name || '',
    adminEmail: restaurant?.adminId?.email || '',
    adminPassword: '',
  });

  const mutation = useMutation({
    mutationFn: (data: RestaurantFormState) => {
      const { adminName, adminEmail, adminPassword, ...restaurantPayload } = data;
      return isEdit
        ? restaurantApi.update(restaurant!._id, restaurantPayload)
        : restaurantApi.create({ ...restaurantPayload, adminName, adminEmail, adminPassword });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurants'] });
      toast.success(isEdit ? 'Restaurant updated' : 'Restaurant created');
      if (!isEdit) {
        onCreated?.({
          restaurantName: form.name,
          adminName: form.adminName,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
        });
      }
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Operation failed'),
  });

  const setField = (field: keyof RestaurantFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error('Please fill in all restaurant details');
      return;
    }
    if (!isEdit && (!form.adminName.trim() || !form.adminEmail.trim() || form.adminPassword.length < 6)) {
      toast.error('Please add admin login details with a password of at least 6 characters');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Modal isOpen title={isEdit ? 'Edit Restaurant' : 'Add Restaurant'} onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Restaurant Name" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. The Grand Bistro" />
          <Input label="Restaurant Email" type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="contact@restaurant.com" />
          <Input label="Phone" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+1 555-0000" />
          <Input label="Cuisine" value={form.cuisine} onChange={e => setField('cuisine', e.target.value)} placeholder="Italian, Indian, Cafe..." />
          <Select label="Plan" value={form.subscriptionPlan} onChange={e => setField('subscriptionPlan', e.target.value)} options={PLAN_OPTIONS} />
        </div>
        <Input label="Address" value={form.address} onChange={e => setField('address', e.target.value)} placeholder="123 Main St, City" />
        {!isEdit && (
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <KeyRound className="w-4 h-4 text-orange-400" />
              Restaurant Admin Login
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Admin Name" value={form.adminName} onChange={e => setField('adminName', e.target.value)} placeholder="Restaurant owner or manager" />
              <Input label="Admin Email" type="email" value={form.adminEmail} onChange={e => setField('adminEmail', e.target.value)} placeholder="admin@restaurant.com" />
              <Input label="Password" type="password" value={form.adminPassword} onChange={e => setField('adminPassword', e.target.value)} placeholder="Min 6 characters" className="sm:col-span-2" />
            </div>
          </div>
        )}
        {isEdit && (
          <Select label="Status" value={form.status} onChange={e => setField('status', e.target.value)} options={STATUS_OPTIONS} />
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Create Restaurant'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <CheckCircle className="w-4 h-4 text-green-400" />,
  suspended: <XCircle className="w-4 h-4 text-red-400" />,
  inactive: <Clock className="w-4 h-4 text-slate-400" />,
};

export default function RestaurantsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Restaurant | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['restaurants', { search, status, plan, page }],
    queryFn: () => restaurantApi.getAll({ search, status, subscriptionPlan: plan, page, limit: 10 }),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => restaurantApi.updateStatus(id, s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['restaurants'] }); toast.success('Status updated'); },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => restaurantApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['restaurants'] }); toast.success('Restaurant deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const restaurants: Restaurant[] = data?.data?.data || [];
  const meta = data?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Restaurants</h1>
          <p className="text-slate-400 text-sm mt-1">Manage all restaurants on the platform</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
          Add Restaurant
        </Button>
      </div>

      {createdCredentials && (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">Restaurant admin login created</p>
              <div className="mt-2 grid gap-1 text-sm text-slate-400">
                <span>Restaurant: <span className="text-slate-200">{createdCredentials.restaurantName}</span></span>
                <span>Email: <span className="text-slate-200">{createdCredentials.adminEmail}</span></span>
                <span>Password: <span className="font-mono text-orange-300">{createdCredentials.adminPassword}</span></span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCreatedCredentials(null)}>Dismiss</Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search restaurants..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-orange-500">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={plan} onChange={e => { setPlan(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-orange-500">
            <option value="">All Plans</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Restaurant</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Contact</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Plan</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Created</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : restaurants.length === 0
                ? (
                  <tr><td colSpan={6} className="py-16">
                    <EmptyState icon={<Building2 />} title="No restaurants found" description="Add your first restaurant to get started" />
                  </td></tr>
                )
                : restaurants.map(r => (
                  <tr key={r._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold text-sm">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-100">{r.name}</p>
                          <p className="text-xs text-slate-500">{r.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                          <Mail className="w-3.5 h-3.5" />{r.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                          <Phone className="w-3.5 h-3.5" />{r.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        r.subscriptionPlan === 'enterprise' ? 'bg-purple-500/15 text-purple-400' :
                        r.subscriptionPlan === 'professional' ? 'bg-blue-500/15 text-blue-400' :
                        'bg-slate-500/15 text-slate-400'
                      }`}>
                        {r.subscriptionPlan?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {STATUS_ICONS[r.status]}
                        <StatusBadge status={r.status} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{formatDate(r.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button onClick={() => setActionMenu(actionMenu === r._id ? null : r._id)}
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {actionMenu === r._id && (
                          <div className="absolute right-0 top-8 z-20 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1">
                            <button onClick={() => { setEditTarget(r); setActionMenu(null); }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                              <Edit2 className="w-3.5 h-3.5" />Edit Restaurant
                            </button>
                            {r.status === 'active'
                              ? <button onClick={() => { suspendMutation.mutate({ id: r._id, s: 'suspended' }); setActionMenu(null); }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-yellow-400 hover:bg-slate-700">
                                  <XCircle className="w-3.5 h-3.5" />Suspend
                                </button>
                              : <button onClick={() => { suspendMutation.mutate({ id: r._id, s: 'active' }); setActionMenu(null); }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-400 hover:bg-slate-700">
                                  <CheckCircle className="w-3.5 h-3.5" />Activate
                                </button>
                            }
                            <div className="border-t border-slate-700 my-1" />
                            <button onClick={() => { if (confirm('Delete this restaurant?')) { deleteMutation.mutate(r._id); setActionMenu(null); } }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-700">
                              <Trash2 className="w-3.5 h-3.5" />Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-800">
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {(showForm || editTarget) && (
        <RestaurantFormModal
          restaurant={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onCreated={setCreatedCredentials}
        />
      )}
    </div>
  );
}
