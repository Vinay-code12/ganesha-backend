import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Settings, Lock, Bell, Shield } from 'lucide-react';
import { authApi } from '../../api/services';
import { Card, Button, Input } from '../../components/ui';
import { useAuthStore } from '../../context/authStore';
import toast from 'react-hot-toast';

export default function SuperAdminSettingsPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [tab, setTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  const profileMutation = useMutation({
    mutationFn: (data: typeof profile) => authApi.updateProfile(data),
    onSuccess: () => toast.success('Profile updated'),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Update failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Password change failed'),
  });

  const handlePasswordChange = () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    passwordMutation.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <Settings className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <Card>
          <h3 className="text-base font-semibold text-slate-100 mb-6">Profile Information</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold text-2xl">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-100">{user?.name}</p>
                <p className="text-sm text-slate-400">{user?.email}</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 bg-red-400/10 text-red-400 text-xs rounded-full">
                  <Shield className="w-3 h-3" />Super Admin
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full Name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
              <Input label="Email Address" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => profileMutation.mutate(profile)} loading={profileMutation.isPending}>
                Save Changes
              </Button>
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
            <Button onClick={handlePasswordChange} loading={passwordMutation.isPending}>
              Update Password
            </Button>
          </div>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card>
          <h3 className="text-base font-semibold text-slate-100 mb-6">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { label: 'New Restaurant Registrations', desc: 'Get notified when a new restaurant joins' },
              { label: 'Payment Alerts', desc: 'Alerts for failed or suspicious payments' },
              { label: 'System Alerts', desc: 'Critical system performance notifications' },
              { label: 'Weekly Reports', desc: 'Platform performance summary every week' },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-200">{n.label}</p>
                  <p className="text-xs text-slate-500">{n.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
            <div className="flex justify-end">
              <Button onClick={() => toast.success('Preferences saved')}>Save Preferences</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
