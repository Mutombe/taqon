import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MagnifyingGlass, CircleNotch, Users, CaretLeft, CaretRight,
  Shield, ShieldCheck, ShieldWarning, User, Funnel, X,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import SEO from '../../components/SEO';
import { OrderListSkeleton } from '../../components/Skeletons';
import { useAdminUsers } from '../../hooks/useQueries';

const ROLE_BADGES = {
  customer: { label: 'Customer', class: 'bg-blue-500/10 text-blue-400' },
  technician: { label: 'Technician', class: 'bg-yellow-500/10 text-yellow-400' },
  admin: { label: 'Admin', class: 'bg-taqon-orange/10 text-taqon-orange' },
  superadmin: { label: 'Super Admin', class: 'bg-red-500/10 text-red-400' },
};

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'customer', label: 'Customer' },
  { value: 'technician', label: 'Technician' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Super Admin' },
];

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const queryParams = useMemo(() => {
    const p = { page, page_size: 20 };
    if (search) p.search = search;
    if (roleFilter) p.role = roleFilter;
    if (verifiedFilter) p.is_verified = verifiedFilter;
    return p;
  }, [page, search, roleFilter, verifiedFilter]);

  const { data: usersData, isLoading: loading } = useAdminUsers(queryParams);
  const users = usersData?.results || [];
  const totalCount = usersData?.count || 0;
  const totalPages = Math.ceil(totalCount / 20);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleUpdateUser = async (userId, updates) => {
    setSaving(true);
    try {
      await adminApi.updateUser(userId, updates);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setEditingUser(null);
      toast.success('User updated.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SEO title="User Management" />

      <div className="pb-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link to="/admin/dashboard" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">User Management</h1>
              <p className="text-sm text-gray-400">{totalCount} users</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-taqon-charcoal/40 border border-warm-200 dark:border-white/10 rounded-xl text-sm text-taqon-charcoal dark:text-white placeholder-gray-500 focus:border-taqon-orange/50 focus:outline-none min-h-[44px]"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-white dark:bg-taqon-charcoal/40 border border-warm-200 dark:border-white/10 rounded-xl text-sm text-taqon-charcoal dark:text-white focus:border-taqon-orange/50 focus:outline-none min-h-[44px]"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <select
              value={verifiedFilter}
              onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-white dark:bg-taqon-charcoal/40 border border-warm-200 dark:border-white/10 rounded-xl text-sm text-taqon-charcoal dark:text-white focus:border-taqon-orange/50 focus:outline-none min-h-[44px]"
            >
              <option value="">All Status</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <OrderListSkeleton count={6} />
          ) : users.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-taqon-charcoal/30 rounded-2xl border border-warm-100 dark:border-white/5">
              <Users size={40} className="text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-400">No users found</h3>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-warm-100 dark:border-white/5">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white dark:bg-taqon-charcoal/40 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">User</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Orders</th>
                      <th className="px-4 py-3 text-right">Spent</th>
                      <th className="px-4 py-3 text-left">Joined</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100 dark:divide-white/5">
                    {users.map((u) => {
                      const badge = ROLE_BADGES[u.role] || ROLE_BADGES.customer;
                      return (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-taqon-charcoal dark:text-white">{u.full_name || u.email}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${badge.class}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {u.is_verified ? (
                                <span className="text-green-400" title="Verified"><ShieldCheck size={14} /></span>
                              ) : (
                                <span className="text-gray-600" title="Unverified"><Shield size={14} /></span>
                              )}
                              {!u.is_active && (
                                <span className="text-red-400 text-[10px] font-bold">Disabled</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-300">
                            {u.order_count || 0}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-300">
                            ${parseFloat(u.total_spent || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setEditingUser(u)}
                              className="text-xs text-taqon-orange hover:underline"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-2">
                {users.map((u) => {
                  const badge = ROLE_BADGES[u.role] || ROLE_BADGES.customer;
                  return (
                    <div key={u.id} className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-taqon-charcoal dark:text-white">{u.full_name || u.email}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${badge.class}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span>{u.order_count || 0} orders</span>
                        <span>${parseFloat(u.total_spent || 0).toLocaleString()}</span>
                        <span>{u.is_verified ? 'Verified' : 'Unverified'}</span>
                      </div>
                      <button
                        onClick={() => setEditingUser(u)}
                        className="mt-2 text-xs text-taqon-orange hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 text-gray-400 hover:text-taqon-charcoal dark:text-white disabled:opacity-30"
                  >
                    <CaretLeft size={16} />
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 text-gray-400 hover:text-taqon-charcoal dark:text-white disabled:opacity-30"
                  >
                    <CaretRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Edit Modal */}
          {editingUser && (
            <EditUserModal
              user={editingUser}
              saving={saving}
              onSave={handleUpdateUser}
              onClose={() => setEditingUser(null)}
            />
          )}
        </div>
      </div>
    </>
  );
}

function EditUserModal({ user, saving, onSave, onClose }) {
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.is_active);
  const [isVerified, setIsVerified] = useState(user.is_verified);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updates = {};
    if (role !== user.role) updates.role = role;
    if (isActive !== user.is_active) updates.is_active = isActive;
    if (isVerified !== user.is_verified) updates.is_verified = isVerified;
    if (Object.keys(updates).length === 0) { onClose(); return; }
    onSave(user.id, updates);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-taqon-charcoal rounded-xl border border-warm-200 dark:border-white/10 w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-taqon-charcoal dark:text-white">Edit User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-taqon-charcoal dark:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-taqon-charcoal dark:text-white font-semibold">{user.full_name || user.email}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white focus:border-taqon-orange/50 focus:outline-none"
            >
              <option value="customer">Customer</option>
              <option value="technician">Technician</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Account Active</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-10 h-5 rounded-full transition-colors relative ${isActive ? 'bg-green-500' : 'bg-gray-100 dark:bg-white/10'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Email Verified</span>
            <button
              type="button"
              onClick={() => setIsVerified(!isVerified)}
              className={`w-10 h-5 rounded-full transition-colors relative ${isVerified ? 'bg-green-500' : 'bg-gray-100 dark:bg-white/10'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isVerified ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-400 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-taqon-charcoal dark:text-white bg-taqon-orange rounded-lg hover:bg-taqon-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <CircleNotch size={14} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
