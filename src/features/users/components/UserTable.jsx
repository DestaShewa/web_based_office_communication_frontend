import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers } from '../api/getUsers';
import { updateUserRole, deactivateUser, activateUser, deleteUserPermanently, resetUserPassword } from '../api/userMutations';
import UserFormModal from './UserFormModal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { Search, Plus, Edit, Trash2, Ban, UserCheck, Loader2, Key } from 'lucide-react';
import { toast } from 'sonner';
import ActionMenu from '../../../components/ActionMenu';
import useAuthStore from '../../../store/authStore';
import { getAvatarUrl } from '../../messages/utils/statusUtils';

export default function UserTable({ view = 'all', departmentId = null }) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  // Filter & Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Debounce search state to prevent rapid API calls
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [modalTriggerRect, setModalTriggerRect] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', confirmColor: 'danger', triggerRect: null });

  // Queries
  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', page, limit, debouncedSearch, roleFilter, departmentId],
    queryFn: () => getUsers({ page, limit, search: debouncedSearch, role: roleFilter, department: departmentId }),
  });

  const users = data?.data?.users || data?.data || [];
  const total = data?.data?.total || users.length || 0;
  const totalPages = data?.data?.totalPages || 1;

  // Mutations (Using React Query v5 syntax for invalidateQueries)
  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => updateUserRole({ id, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User role updated successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update role')
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User account deactivated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to deactivate')
  });
  
  const activateMutation = useMutation({
    mutationFn: (id) => activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User account reactivated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reactivate')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUserPermanently(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User permanently deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete user')
  });

  const resetMutation = useMutation({
    mutationFn: (id) => resetUserPassword(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Password reset. New password sent via email.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reset password')
  });

  const handleOpenModal = (user = null, rect = null) => {
    setEditingUser(user);
    setModalTriggerRect(rect);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
             <div className="relative w-full sm:w-72">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search name, email, or exact \u0022ID\u0022..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
               />
             </div>
             
              <select 
                value={roleFilter} 
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="w-full sm:w-40 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm text-gray-600 bg-white"
              >
                <option value="">All Roles</option>
                <option value="admin">Admins</option>
                <option value="director">Directors</option>
                <option value="dean">Deans</option>
                <option value="coordinator">Coordinators</option>
                <option value="staff">Staff</option>
              </select>
           </div>

          {view === 'all' && currentUser?.role === 'admin' && (
            <button 
               onClick={(e) => handleOpenModal(null, e.currentTarget.getBoundingClientRect())} 
               className="whitespace-nowrap flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
            >
              <Plus size={18} /> Add New User
            </button>
          )}
        </div>

        {/* Table/Card View */}
        <div className="min-h-[400px]">
          {/* Desktop Table View */}
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Info</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">System Role</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                {view === 'all' && currentUser?.role === 'admin' && (
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="4" className="py-12 text-center text-primary"><Loader2 size={32} className="animate-spin mx-auto"/></td></tr>
              ) : isError ? (
                <tr><td colSpan="4" className="py-8 text-center text-red-500">Failed to load users. Verify connection.</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="4" className="py-12 text-center text-gray-500 font-medium bg-gray-50/50">No users found matching the given criteria.</td></tr>
              ) : (
                users.map((user) => {
                  const uId = user._id; // Force standard MongoDB _id to match backend backend lookup safely just in case customId is failing routing checks
                  const isUserActive = user.isActive !== false; // Fallback to active if undefined (though the backend now explicitly sends it)
                  return (
                    <tr key={uId} className={`hover:bg-gray-50 transition-colors ${!isUserActive && 'opacity-60'}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm uppercase shrink-0 overflow-hidden ${isUserActive ? 'bg-accent/20 text-accent' : 'bg-gray-200 text-gray-400'}`}>
                            {user.profilePhoto ? (
                              <img src={getAvatarUrl(user.profilePhoto)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              user.name?.charAt(0) || 'U'
                            )}
                          </div>
                          <div className="truncate py-1 tracking-tight">
                            <p className={`text-sm font-bold truncate leading-none ${isUserActive ? 'text-primary' : 'text-gray-500 line-through'}`}>{user.name}</p>
                            <p className="text-xs text-gray-500 truncate mt-1">{user.email}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{user.customId || uId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        {view === 'all' && currentUser?.role === 'admin' ? (
                          <select 
                            value={user.role}
                            disabled={roleMutation.isPending || !isUserActive}
                            title={!isUserActive ? "Cannot change role of a deactivated user." : ""}
                            onChange={(e) => roleMutation.mutate({ id: uId, role: e.target.value })}
                            className={`text-[10px] font-bold uppercase rounded-full px-2.5 py-1 outline-none transition-colors border shadow-sm ${
                              !isUserActive ? 'border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed opacity-50' : 
                              user.role === 'admin' ? 'border-purple-200 text-purple-700 bg-purple-50 cursor-pointer hover:bg-purple-100' : 
                              user.role === 'director' ? 'border-indigo-200 text-indigo-700 bg-indigo-50 cursor-pointer hover:bg-indigo-100' : 
                              user.role === 'dean' ? 'border-blue-200 text-blue-700 bg-blue-50 cursor-pointer hover:bg-blue-100' : 
                              user.role === 'coordinator' ? 'border-teal-200 text-teal-700 bg-teal-50 cursor-pointer hover:bg-teal-100' : 
                              'border-gray-200 text-gray-700 bg-gray-50 cursor-pointer hover:bg-gray-100'
                            }`}
                          >
                            <option value="staff">Staff</option>
                            <option value="coordinator">Coordinator</option>
                            <option value="dean">Dean</option>
                            <option value="director">Director</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                            user.role === 'admin' ? 'border-purple-200 text-purple-700 bg-purple-50' : 
                            user.role === 'director' ? 'border-indigo-200 text-indigo-700 bg-indigo-50' : 
                            user.role === 'dean' ? 'border-blue-200 text-blue-700 bg-blue-50' : 
                            user.role === 'coordinator' ? 'border-teal-200 text-teal-700 bg-teal-50' : 
                            'border-gray-200 text-gray-700 bg-gray-50'
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        {isUserActive ? (
                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 border border-green-200 shadow-sm"><UserCheck size={12} className="mr-1"/> Active</span>
                        ) : (
                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 border border-red-200 shadow-sm"><Ban size={12} className="mr-1"/> Inactive</span>
                        )}
                      </td>
                        <td className="py-5 px-6 text-right">
                          <ActionMenu 
                            actions={[
                              { 
                                label: 'Edit Member', 
                                icon: <Edit size={16} />, 
                                onClick: (rect) => handleOpenModal(user, rect) 
                              },
                              isUserActive ? {
                                label: 'Deactivate Account',
                                icon: <Ban size={16} />,
                                variant: 'danger',
                                onClick: (rect) => setConfirmState({
                                  isOpen: true,
                                  title: 'Deactivate User',
                                  message: `Soft deactivate ${user.name}? They will lose login access but their data is preserved.`,
                                  onConfirm: () => deactivateMutation.mutate(uId),
                                  confirmText: 'Deactivate',
                                  confirmColor: 'danger',
                                  triggerRect: rect
                                })
                              } : {
                                label: 'Reactivate Account',
                                icon: <UserCheck size={16} />,
                                onClick: (rect) => setConfirmState({
                                  isOpen: true,
                                  title: 'Reactivate User',
                                  message: `Reactivate ${user.name}? They will regain immediate system access.`,
                                  onConfirm: () => activateMutation.mutate(uId),
                                  confirmText: 'Reactivate',
                                  confirmColor: 'primary',
                                  triggerRect: rect
                                })
                              },
                              {
                                label: 'Delete Permanently',
                                icon: <Trash2 size={16} />,
                                variant: 'danger',
                                onClick: (rect) => setConfirmState({
                                  isOpen: true,
                                  title: 'PERMANENT DELETE',
                                  message: `CRITICAL: Are you sure you want to permanently delete ${user.name}? This action is irreversible and will remove all associated user records.`,
                                  onConfirm: () => deleteMutation.mutate(uId),
                                  confirmText: 'Delete Forever',
                                  confirmColor: 'danger',
                                  triggerRect: rect
                                })
                              }
                            ]}
                          />
                        </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {isLoading ? (
              <div className="py-12 text-center text-primary"><Loader2 size={32} className="animate-spin mx-auto"/></div>
            ) : isError ? (
              <div className="py-8 text-center text-red-500">Failed to load users.</div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-gray-500 font-medium bg-gray-50/50">No users found.</div>
            ) : (
              users.map((user) => {
                const uId = user._id;
                const isUserActive = user.isActive !== false;
                return (
                  <div key={uId} className={`p-4 flex flex-col gap-3 transition-colors ${!isUserActive && 'opacity-60 bg-gray-50/30'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm uppercase shrink-0 overflow-hidden ${isUserActive ? 'bg-accent/20 text-accent' : 'bg-gray-200 text-gray-400'}`}>
                          {user.profilePhoto ? (
                            <img src={getAvatarUrl(user.profilePhoto)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            user.name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div className="truncate tracking-tight">
                          <p className={`text-sm font-bold truncate leading-tight ${isUserActive ? 'text-primary' : 'text-gray-500 line-through'}`}>{user.name}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="shrink-0 pt-1">
                        <ActionMenu 
                          actions={[
                            { 
                              label: 'Edit Member', 
                              icon: <Edit size={16} />, 
                              onClick: (rect) => handleOpenModal(user, rect) 
                            },
                            isUserActive ? {
                              label: 'Deactivate Account',
                              icon: <Ban size={16} />,
                              variant: 'danger',
                              onClick: (rect) => setConfirmState({
                                isOpen: true,
                                title: 'Deactivate User',
                                message: `Soft deactivate ${user.name}?`,
                                onConfirm: () => deactivateMutation.mutate(uId),
                                confirmText: 'Deactivate',
                                confirmColor: 'danger',
                                triggerRect: rect
                              })
                            } : {
                              label: 'Reactivate Account',
                              icon: <UserCheck size={16} />,
                              onClick: (rect) => setConfirmState({
                                isOpen: true,
                                title: 'Reactivate User',
                                message: `Reactivate ${user.name}?`,
                                onConfirm: () => activateMutation.mutate(uId),
                                confirmText: 'Reactivate',
                                confirmColor: 'primary',
                                triggerRect: rect
                              })
                            },
                            {
                              label: 'Delete Permanently',
                              icon: <Trash2 size={16} />,
                              variant: 'danger',
                              onClick: (rect) => setConfirmState({
                                isOpen: true,
                                title: 'PERMANENT DELETE',
                                message: `Irreversible delete for ${user.name}.`,
                                onConfirm: () => deleteMutation.mutate(uId),
                                confirmText: 'Delete Forever',
                                confirmColor: 'danger',
                                triggerRect: rect
                              })
                            }
                          ]}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        {view === 'all' && currentUser?.role === 'admin' ? (
                          <div className="relative">
                             <select 
                                value={user.role}
                                disabled={roleMutation.isPending || !isUserActive}
                                onChange={(e) => roleMutation.mutate({ id: uId, role: e.target.value })}
                                className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 outline-none tracking-tight border shadow-xs ${
                                  !isUserActive ? 'border-gray-100 text-gray-400 bg-gray-50 opacity-50' : 
                                  user.role === 'admin' ? 'border-purple-200 text-purple-700 bg-purple-50' : 
                                  user.role === 'director' ? 'border-indigo-200 text-indigo-700 bg-indigo-50' : 
                                  user.role === 'dean' ? 'border-blue-200 text-blue-700 bg-blue-50' : 
                                  user.role === 'coordinator' ? 'border-teal-200 text-teal-700 bg-teal-50' : 
                                  'border-gray-200 text-gray-700 bg-gray-50'
                                }`}
                              >
                                <option value="staff">Staff</option>
                                <option value="coordinator">Coordinator</option>
                                <option value="dean">Dean</option>
                                <option value="director">Director</option>
                                <option value="admin">Admin</option>
                              </select>
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                            user.role === 'admin' ? 'border-purple-100 text-purple-600 bg-purple-50' : 'border-gray-100 text-gray-600 bg-gray-50'
                          }`}>
                            {user.role}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-mono">ID: {user.customId || uId.slice(-6)}</span>
                      </div>

                      {isUserActive ? (
                        <span className="flex items-center text-[10px] font-bold uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                          <UserCheck size={10} className="mr-1"/> Active
                        </span>
                      ) : (
                        <span className="flex items-center text-[10px] font-bold uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                          <Ban size={10} className="mr-1"/> Inactive
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-gray-50/30">
          <p>Showing page {page} of {totalPages} ({total} total)</p>
          <div className="flex items-center gap-2 font-medium">
             <select value={limit} onChange={(e) => {setLimit(Number(e.target.value)); setPage(1);}} className="border border-gray-200 rounded px-2 py-1 bg-white outline-none">
               <option value="5">5 / pg</option>
               <option value="10">10 / pg</option>
               <option value="50">50 / pg</option>
             </select>
             <button 
               onClick={() => setPage(p => Math.max(1, p - 1))} 
               disabled={page === 1}
               className="px-3 py-1.5 border border-gray-200 rounded hover:bg-white disabled:opacity-50 transition-colors"
             >
               Prev
             </button>
             <button 
               onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
               disabled={page >= totalPages || users.length === 0}
               className="px-3 py-1.5 border border-gray-200 rounded hover:bg-white disabled:opacity-50 transition-colors"
             >
               Next
             </button>
          </div>
        </div>
      </div>

      <UserFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={editingUser} 
        triggerRect={modalTriggerRect}
      />

      <ConfirmDialog 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={() => {
          if (confirmState.onConfirm) confirmState.onConfirm();
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        confirmText={confirmState.confirmText}
        confirmColor={confirmState.confirmColor}
        triggerRect={confirmState.triggerRect}
      />
    </>
  );
}
