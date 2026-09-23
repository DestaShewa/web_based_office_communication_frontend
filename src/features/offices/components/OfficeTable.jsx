import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOffices } from '../api/getOffices';
import { changeOfficeStatus, deleteOffice } from '../api/officeMutations';
import OfficeFormModal from './OfficeFormModal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { Search, Plus, Edit, Building2, Loader2, CheckCircle, Ban, Trash2 } from 'lucide-react';
import ActionMenu from '../../../components/ActionMenu';
import { toast } from 'sonner';
import * as HoverCard from '@radix-ui/react-hover-card';

export default function OfficeTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [modalTriggerRect, setModalTriggerRect] = useState(null);
  const [confirmState, setConfirmState] = useState({ 
    isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', confirmColor: 'danger', triggerRect: null
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['offices', page, limit, debouncedSearch],
    queryFn: () => getOffices({ page, limit, search: debouncedSearch }),
  });

  const offices = data?.data?.offices || data?.data || [];
  const total = data?.data?.total || offices.length || 0;
  const totalPages = data?.data?.totalPages || Math.ceil(total / limit) || 1;

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => changeOfficeStatus({ id, isActive }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      toast.success(`Office ${vars.isActive ? 'activated' : 'deactivated'} successfully`);
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteOffice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      toast.success('Office deleted successfully');
      setConfirmState(prev => ({ ...prev, isOpen: false }));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete office');
    }
  });

  const handleOpenModal = (office = null, rect = null) => {
    setEditingOffice(office);
    setModalTriggerRect(rect);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Search offices..." 
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
          </div>
           <button 
              onClick={(e) => handleOpenModal(null, e.currentTarget.getBoundingClientRect())} 
              className="whitespace-nowrap flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
           >
             <Plus size={18} /> Add Office
           </button>
        </div>

        <div className="min-h-[400px]">
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                 <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Office Name & ID</th>
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
                <tr><td colSpan="5" className="py-8 text-center text-red-500">Failed to load offices.</td></tr>
              ) : offices.length === 0 ? (
                <tr><td colSpan="5" className="py-12 text-center text-gray-500 font-medium bg-gray-50/50">No offices found.</td></tr>
              ) : (
                offices.map((off) => {
                  const isActive = off.isActive !== false;
                  return (
                    <tr key={off._id} className={`hover:bg-gray-50 transition-colors ${!isActive && 'opacity-60'}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-md flex items-center justify-center font-bold text-sm shrink-0 ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-400'}`}>
                            <Building2 size={20} />
                          </div>
                          <div className="truncate py-1 tracking-tight">
                            <p className={`text-sm font-bold truncate flex items-center gap-2 leading-none ${isActive ? 'text-primary' : 'text-gray-500 line-through'}`}>
                              {off.name} 
                              <span className="bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-widest">{off.abbreviation}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono mt-1">{off.customId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        <HoverCard.Root openDelay={200}>
                          <HoverCard.Trigger asChild>
                            <span className="cursor-help border-b border-dotted border-gray-400 block max-w-[200px] truncate">
                              {off.description || <span className="text-gray-400 italic">No description</span>}
                            </span>
                          </HoverCard.Trigger>
                          <HoverCard.Portal>
                            <HoverCard.Content className="z-50 w-80 bg-white p-4 rounded-xl shadow-xl border border-gray-100">
                              <p className="text-sm text-gray-600 leading-relaxed">{off.description}</p>
                            </HoverCard.Content>
                          </HoverCard.Portal>
                        </HoverCard.Root>
                      </td>
                       <td className="py-4 px-6">
                        {off.coordinator ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                              {off.coordinator.name?.charAt(0)}
                            </div>
                            <div className="truncate tracking-tight">
                              <p className="text-sm font-bold text-primary truncate leading-none">{off.coordinator.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{off.coordinator.customId}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        {isActive ? (
                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 border border-green-200 shadow-sm"><CheckCircle size={12} className="mr-1"/> Active</span>
                        ) : (
                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 border border-red-200 shadow-sm"><Ban size={12} className="mr-1"/> Inactive</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                         <ActionMenu 
                          actions={[
                            {
                              label: 'Edit Office',
                              icon: <Edit size={16} />,
                              onClick: (rect) => handleOpenModal(off, rect)
                            },
                            {
                              label: !isActive ? 'Activate' : 'Deactivate',
                              icon: !isActive ? <CheckCircle size={16} /> : <Ban size={16} />,
                              variant: !isActive ? 'success' : 'danger',
                              onClick: (rect) => setConfirmState({
                                isOpen: true,
                                title: `${!isActive ? 'Activate' : 'Deactivate'} Office`,
                                message: `Are you sure you want to ${!isActive ? 'activate' : 'deactivate'} ${off.name}?`,
                                onConfirm: () => statusMutation.mutate({ id: off.customId, isActive: !isActive }),
                                confirmText: !isActive ? 'Activate' : 'Deactivate',
                                confirmColor: !isActive ? 'success' : 'danger',
                                triggerRect: rect
                              })
                            },
                            {
                              label: 'Delete Permanently',
                              icon: <Trash2 size={16} />,
                              variant: 'danger',
                              onClick: (rect) => setConfirmState({
                                isOpen: true,
                                title: 'Delete Office',
                                message: `Are you sure you want to permanently delete ${off.name}? This action cannot be undone.`,
                                onConfirm: () => deleteMutation.mutate(off.customId),
                                confirmText: 'Delete',
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
        </div>
      </div>

       <OfficeFormModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        office={editingOffice} triggerRect={modalTriggerRect}
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
