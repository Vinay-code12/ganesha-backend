import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { Settings, Lock, Store, Clock } from 'lucide-react';
import { restaurantApi, authApi } from '../../api/services';
import { Card, Button, Input, Select } from '../../components/ui';
import { useAuthStore } from '../../context/authStore';
import toast from 'react-hot-toast';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export default function RestaurantSettingsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'restaurant' | 'hours' | 'security'>('restaurant');

  const { data: restData } = useQuery({
    queryKey: ['restaurant', user?.restaurantId],
    queryFn: () => restaurantApi.getOne(user!.restaurantId!),
    enabled: !!user?.restaurantId,
  });

  const restaurant = restData?.data;

  const [restForm, setRestForm] = useState<any>(null);
  const [hours, setHours] = useState<any>(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Populate once data arrives
  if (restaurant && !restForm) {
    setRestForm({
      name: restaurant.name || '',
      email: restaurant.email || '',
      phone: restaurant.phone || '',
      address: restaurant.address || '',
      settings: {
        currency: restaurant.settings?.currency || 'USD',
        timezone: restaurant.settings?.timezone || 'America/New_York',
        taxRate: restaurant.settings?.taxRate || 0,
      },
    });
    setHours(restaurant.settings?.openingHours || DAYS.reduce((acc, d) => ({
      ...acc, [d]: { open: '09:00', close: '22:00', isClosed: false }
    }), {}));
  }

  const updateMutation = useMutation({
    mutationFn: (data: any) => restaurantApi.update(user!.restaurantId!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['restaurant'] }); toast.success('Settings saved'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: any) => authApi.changePassword(data),
    onSuccess: () => { toast.success('Password changed'); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleSaveHours = () => {
    updateMutation.mutate({ settings: { ...restForm?.settings, openingHours: hours } });
  };

  const tabs = [
    { id: 'restaurant', label: 'Restaurant', icon: <Store className="w-4 h-4" /> },
    { id: 'hours', label: 'Opening Hours', icon: <Clock className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
  ] as const;

  if (!restForm) return <div className="animate-pulse h-64 bg-slate-800 rounded-2xl" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure your restaurant profile and preferences</p>
      </div>

      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'restaurant' && (
        <Card>
          <h3 className="text-base font-semibold text-slate-100 mb-6">Restaurant Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Restaurant Name" value={restForm.name} onChange={e => setRestForm((p: any) => ({ ...p, name: e.target.value }))} />
              <Input label="Email" type="email" value={restForm.email} onChange={e => setRestForm((p: any) => ({ ...p, email: e.target.value }))} />
              <Input label="Phone" value={restForm.phone} onChange={e => setRestForm((p: any) => ({ ...p, phone: e.target.value }))} />
              <Input label="Tax Rate (%)" type="number" value={restForm.settings.taxRate}
                onChange={e => setRestForm((p: any) => ({ ...p, settings: { ...p.settings, taxRate: +e.target.value } }))} step={0.1} min={0} max={30} />
              <Select label="Currency" value={restForm.settings.currency}
                onChange={e => setRestForm((p: any) => ({ ...p, settings: { ...p.settings, currency: e.target.value } }))}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD ($)</option>
              </Select>
              <Select label="Timezone" value={restForm.settings.timezone}
                onChange={e => setRestForm((p: any) => ({ ...p, settings: { ...p.settings, timezone: e.target.value } }))}>
                {['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Tokyo','Asia/Kolkata'].map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </Select>
            </div>
            <Input label="Address" value={restForm.address} onChange={e => setRestForm((p: any) => ({ ...p, address: e.target.value }))} />
            <div className="flex justify-end">
              <Button onClick={() => updateMutation.mutate(restForm)} loading={updateMutation.isPending}>Save Changes</Button>
            </div>
          </div>
        </Card>
      )}

      {tab === 'hours' && hours && (
        <Card>
          <h3 className="text-base font-semibold text-slate-100 mb-6">Opening Hours</h3>
          <div className="space-y-3">
            {DAYS.map(day => (
              <div key={day} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl">
                <div className="w-24 shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!hours[day]?.isClosed}
                      onChange={e => setHours((h: any) => ({ ...h, [day]: { ...h[day], isClosed: !e.target.checked } }))}
                      className="w-4 h-4 accent-orange-500 rounded" />
                    <span className="text-sm font-medium text-slate-200 capitalize">{day}</span>
                  </label>
                </div>
                {!hours[day]?.isClosed ? (
                  <div className="flex items-center gap-3 flex-1">
                    <input type="time" value={hours[day]?.open || '09:00'}
                      onChange={e => setHours((h: any) => ({ ...h, [day]: { ...h[day], open: e.target.value } }))}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500" />
                    <span className="text-slate-500 text-sm">to</span>
                    <input type="time" value={hours[day]?.close || '22:00'}
                      onChange={e => setHours((h: any) => ({ ...h, [day]: { ...h[day], close: e.target.value } }))}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                ) : (
                  <span className="text-sm text-slate-500 italic">Closed</span>
                )}
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveHours} loading={updateMutation.isPending}>Save Hours</Button>
            </div>
          </div>
        </Card>
      )}

      {tab === 'security' && (
        <Card>
          <h3 className="text-base font-semibold text-slate-100 mb-6">Change Password</h3>
          <div className="space-y-4 max-w-md">
            <Input label="Current Password" type="password" value={passwords.currentPassword}
              onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} />
            <Input label="New Password" type="password" value={passwords.newPassword}
              onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} />
            <Input label="Confirm New Password" type="password" value={passwords.confirmPassword}
              onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} />
            <Button onClick={() => {
              if (passwords.newPassword !== passwords.confirmPassword) { toast.error('Passwords do not match'); return; }
              passwordMutation.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
            }} loading={passwordMutation.isPending}>
              Update Password
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
