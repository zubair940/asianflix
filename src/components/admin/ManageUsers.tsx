import React, { useState, useEffect } from 'react';
import { User } from '../../types.js';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../common/LoadingSpinner.js';
import { Users, Shield, Ban, CheckCircle, Trash2, Clock } from 'lucide-react';

export const ManageUsers: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      showToast(err.message || 'Error fetching user list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (userId: string) => {
    try {
      const res = await adminService.toggleBlockUser(userId);
      showToast(res.message, res.isBlocked ? 'error' : 'success');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isBlocked: res.isBlocked } : u))
      );
    } catch (err: any) {
      showToast(err.message || 'Error toggling user block status', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user account permanently?')) return;
    try {
      await adminService.deleteUser(userId);
      showToast('User account deleted', 'info');
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      showToast(err.message || 'Error deleting user', 'error');
    }
  };

  if (loading) return <LoadingSpinner label="Fetching user list..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-rose-500" /> User Management ({users.length})
        </h3>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3.5">User</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Join Date</th>
              <th className="p-3.5">Watch Time</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                <td className="p-3.5 flex items-center gap-3">
                  <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
                  <div>
                    <span className="font-bold text-white block">{u.name}</span>
                    <span className="text-[11px] text-slate-400">{u.email}</span>
                  </div>
                </td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.role === 'admin'
                        ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-3.5 text-slate-400">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3.5 text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {u.totalWatchMinutes || 0} mins
                </td>
                <td className="p-3.5">
                  {u.isBlocked ? (
                    <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                      <Ban className="w-3.5 h-3.5" /> Blocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Active
                    </span>
                  )}
                </td>
                <td className="p-3.5 text-right space-x-2">
                  {u.role !== 'admin' && (
                    <>
                      <button
                        onClick={() => handleToggleBlock(u.id)}
                        className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                          u.isBlocked
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                        }`}
                      >
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
