import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDepartments } from '../api/getDepartments';
import { changeDepartmentStatus } from '../api/departmentMutations';
import DepartmentFormModal from './DepartmentFormModal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { Search, Plus, Edit, Building, Loader2, CheckCircle, Ban } from 'lucide-react';
import ActionMenu from '../../../components/ActionMenu';
import { toast } from 'sonner';
import * as HoverCard from '@radix-ui/react-hover-card';

export default function DepartmentTable() {
  const queryClient = useQueryClient();

  // Filter & Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  
  // Debounce search state
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [modalTriggerRect, setModalTriggerRect] = useState(null);
  const [confirmState, setConfirmState] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null, 
    confirmText: 'Confirm', 
    confirmColor: 'danger',
    triggerRect: null
  });

  // Queries
  const { data, isLoading, isError } = useQuery({
    queryKey: ['departments', page, limit, debouncedSearch],
    queryFn: () => getDepartments({ page, limit, search: debouncedSearch }),
  });

  const departments = data?.data?.departments || data?.data || [];
  const total = data?.data?.total || departments.length || 0;
  const totalPages = data?.data?.totalPages || 1;

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => changeDepartmentStatus({ id, isActive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(`Department ${variables.isActive ? 'activated' : 'deactivated'} successfully`);
      setConfirmState({ isOpen: false, title: '', message: '', onConfirm: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update department status');
    }
  });

  const handleOpenModal = (dept = null, rect = null) => {
    setEditingDept(dept);
    setModalTriggerRect(rect);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search departments or abbreviations..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
          </div>
           <button 
              onClick={(e) => handleOpenModal(null, e.currentTarget.getBoundingClientRect())} 
              className="whitespace-nowrap flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
           >
             <Plus size={18} /> Add Department
           </button>
        </div>

        {/* Table/Card View Container */}
        <div className="min-h-[400px]">
          {/* Desktop Table View */}
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                 <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dept Name & ID</th>
                 <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                 <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Coordinator</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="5" className="py-12 text-center text-primary"><Loader2 size={32} className="animate-spin mx-auto"/></td></tr>
              ) : isError ? (
                <tr><td colSpan="5" className="py-8 text-center text-red-500">Failed to load system departments.</td></tr>
              ) : departments.length === 0 ? (
                <tr><td colSpan="5" className="py-12 text-center text-gray-500 font-medium bg-gray-50/50">No departments found matching the given criteria.</td></tr>
              ) : (
                departments.map((dept) => {
                  const dId = dept._id; // Base ID for mutation targeting
                  const isDeptActive = dept.isActive !== false;
                  return (
                    <tr key={dId} className={`hover:bg-gray-50 transition-colors ${!isDeptActive && 'opacity-60'}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-md flex items-center justify-center font-bold text-sm shrink-0 ${isDeptActive ? 'bg-secondary/20 text-secondary' : 'bg-gray-200 text-gray-400'}`}>
                            <Building size={20} />
                          </div>
                          <div className="truncate py-1 tracking-tight">
                            <p className={`text-sm font-bold truncate flex items-center gap-2 leading-none ${isDeptActive ? 'text-primary' : 'text-gray-500 line-through'}`}>
                              {dept.name} 
                              <span className="bg-accent/20 text-primary text-[10px] px-1.5 py-0.5 rounded uppercase tracking-widest no-underline">{dept.abbreviation}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono mt-1">{dept.customId || dId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        <HoverCard.Root openDelay={200} closeDelay={100}>
                          <HoverCard.Trigger asChild>
                            <span className="cursor-help border-b border-dotted border-gray-400 block max-w-[200px] truncate">
                              {dept.description || <span className="text-gray-400 italic">No description</span>}
                            </span>
                          </HoverCard.Trigger>
                          <HoverCard.Portal>
                            <HoverCard.Content 
                              className="z-50 w-80 bg-white p-4 rounded-xl shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
                              sideOffset={5}
                            >
                              <div className="flex flex-col gap-2">
                                <h4 className="border-b border-gray-100 pb-2 text-sm font-bold text-primary">{dept.name}</h4>
                                <p className="text-sm text-gray-600 leading-relaxed text-wrap">{dept.description || 'No description provided.'}</p>
                              </div>
                            </HoverCard.Content>
                          </HoverCard.Portal>
                        </HoverCard.Root>
                      </td>
                       <td className="py-4 px-6">
                        {dept.coordinator ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                              {dept.coordinator.name?.charAt(0) || 'C'}
                            </div>
                            <div className="truncate py-1 tracking-tight">
                              <p className="text-sm font-bold text-primary truncate leading-none">{dept.coordinator.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{dept.coordinator.customId}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No Coordinator Assigned</span>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        {isDeptActive ? (
                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 border border-green-200 shadow-sm"><CheckCircle size={12} className="mr-1"/> Active</span>
                        ) : (
                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 border border-red-200 shadow-sm"><Ban size={12} className="mr-1"/> Inactive</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                         <ActionMenu 
                          actions={[
                            {
                              label: 'Edit Meta/Head',
                              icon: <Edit size={16} />,
                              onClick: (rect) => handleOpenModal(dept, rect)
                            },
                            {
                              label: !isDeptActive ? 'Activate' : 'Deactivate',
                              icon: !isDeptActive ? <CheckCircle size={16} /> : <Ban size={16} />,
                              variant: !isDeptActive ? 'success' : 'danger',
                              onClick: (rect) => setConfirmState({
                                isOpen: true,
                                title: `${!isDeptActive ? 'Activate' : 'Deactivate'} Department`,
                                message: !isDeptActive 
                                  ? `Enable access for ${dept.name} and its related users?` 
                                  : `Are you sure you want to deactivate ${dept.name}? This will block login for its coordinator and staff members.`,
                                onConfirm: () => statusMutation.mutate({ id: dId, isActive: !isDeptActive }),
                                confirmText: !isDeptActive ? 'Activate' : 'Deactivate',
                                confirmColor: !isDeptActive ? 'success' : 'danger',
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
              <div className="py-8 text-center text-red-500">Error loading departments.</div>
            ) : departments.length === 0 ? (
              <div className="py-12 text-center text-gray-500 font-medium">No departments found.</div>
            ) : (
              departments.map((dept) => {
                const dId = dept._id;
                const isDeptActive = dept.isActive !== false;
                return (
                  <div key={dId} className={`p-4 flex flex-col gap-3 transition-colors ${!isDeptActive && 'opacity-60 bg-gray-50/30'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                         <div className={`h-10 w-10 rounded-md flex items-center justify-center font-bold text-sm shrink-0 ${isDeptActive ? 'bg-secondary/10 text-secondary' : 'bg-gray-200 text-gray-400'}`}>
                            <Building size={20} />
                         </div>
                         <div className="truncate tracking-tight">
                            <p className="text-sm font-bold text-primary truncate flex items-center gap-2">
                               {dept.name} 
                               <span className="bg-accent/10 text-primary text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter">{dept.abbreviation}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{dept.customId}</p>
                         </div>
                      </div>
                      <ActionMenu 
                        actions={[
                          {
                            label: 'Edit',
                            icon: <Edit size={16} />,
                            onClick: (rect) => handleOpenModal(dept, rect)
                          },
                          {
                            label: !isDeptActive ? 'Activate' : 'Deactivate',
                            icon: !isDeptActive ? <CheckCircle size={16} /> : <Ban size={16} />,
                            variant: !isDeptActive ? 'success' : 'danger',
                            onClick: (rect) => setConfirmState({
                              isOpen: true,
                              title: `${!isDeptActive ? 'Activate' : 'Deactivate'}`,
                              message: `${!isDeptActive ? 'Activate' : 'Deactivate'} ${dept.name}?`,
                              onConfirm: () => statusMutation.mutate({ id: dId, isActive: !isDeptActive }),
                              confirmText: !isDeptActive ? 'Activate' : 'Deactivate',
                              confirmColor: !isDeptActive ? 'success' : 'danger',
                              triggerRect: rect
                            })
                          }
                        ]}
                      />
                    </div>

                    {dept.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50/50 p-2 rounded-lg italic">
                        {dept.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-1">
                       <div className="flex items-center gap-2">
                        {dept.coordinator ? (
                          <div className="flex items-center gap-2">
                             <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] truncate">
                               {dept.coordinator.name?.charAt(0)}
                             </div>
                             <span className="text-[11px] font-bold text-primary truncate max-w-[100px]">{dept.coordinator.name}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No Head</span>
                        )}
                       </div>

                       {isDeptActive ? (
                         <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase">
                           <CheckCircle size={10} /> Active
                         </span>
                       ) : (
                         <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase">
                           <Ban size={10} /> Inactive
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
               disabled={page >= totalPages || departments.length === 0}
               className="px-3 py-1.5 border border-gray-200 rounded hover:bg-white disabled:opacity-50 transition-colors"
             >
               Next
             </button>
          </div>
        </div>
      </div>

       <DepartmentFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        department={editingDept} 
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
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false, triggerRect: null }))}
        confirmText={confirmState.confirmText}
        confirmColor={confirmState.confirmColor}
        triggerRect={confirmState.triggerRect}
      />
    </>
  );
}
