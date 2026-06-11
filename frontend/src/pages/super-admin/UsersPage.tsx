import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, ShieldCheck, Store, UserCog } from 'lucide-react';
import { userApi } from '../../api/services';
import { Card, Skeleton, EmptyState, Pagination, Avatar } from '../../components/ui';
import { formatDate } from '../../utils';

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  super_admin: { label: 'Super Admin', color: 'text-red-400 bg-red-400/10', icon: <ShieldCheck className="w-3 h-3" /> },
  restaurant_admin: { label: 'Restaurant Admin', color: 'text-blue-400 bg-blue-400/10', icon: <Store className="w-3 h-3" /> },
  staff: { label: 'Staff', color: 'text-green-400 bg-green-400/10', icon: <UserCog className="w-3 h-3" /> },
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['users', { search, role, page }],
    queryFn: () => userApi.getAll({ search, role, page, limit: 15 }),
  });

  const users = data?.data?.users || [];
  const meta = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Users</h1>
        <p className="text-slate-400 text-sm mt-1">All platform users and their roles</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500" />
          </div>
          <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-orange-500">
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="restaurant_admin">Restaurant Admin</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </Card>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {['User','Email','Role','Restaurant','Joined'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
                    ))}</tr>
                  ))
                : users.length === 0
                ? <tr><td colSpan={5} className="py-16">
                    <EmptyState icon={<Users />} title="No users found" description="Users will appear here" />
                  </td></tr>
                : users.map((u: any) => {
                  const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.staff;
                  return (
                    <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size="sm" />
                          <span className="font-medium text-slate-100">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${rc.color}`}>
                          {rc.icon}{rc.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {u.restaurantId?.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(u.createdAt)}</td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-800">
            <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
