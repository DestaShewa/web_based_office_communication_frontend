import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFaculties, deleteFaculty } from '../api/facultyApi';
import FacultyTable from '../components/FacultyTable';
import FacultyFormModal from '../components/FacultyFormModal';
import { Plus, Search, Loader2, AlertCircle, GraduationCap } from 'lucide-react';
import ConfirmDialog from '../../../components/ConfirmDialog';

export default function Faculties() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFac, setActiveFac] = useState(null);
  const [modalTriggerRect, setModalTriggerRect] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, fac: null, triggerRect: null });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['faculties', search],
    queryFn: () => getFaculties({ search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFaculty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      setConfirmState({ isOpen: false, fac: null });
    }
  });

  const faculties = data?.data?.faculties || data?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 text-accent rounded-2xl">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-outfit">Faculties</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage academic units and dean assignments.</p>
          </div>
        </div>
        <button 
          onClick={(e) => { 
            setActiveFac(null); 
            setModalTriggerRect(e.currentTarget.getBoundingClientRect());
            setIsModalOpen(true); 
          }}
          className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-xl hover:bg-accent/90 transition-all shadow-md shadow-accent/20 font-semibold"
        >
          <Plus size={20} />
          Add Faculty
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search faculties by name, abbr..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all bg-white shadow-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={48} className="animate-spin text-accent" />
          <p className="text-gray-500 font-medium font-outfit">Loading faculties...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-100 p-8 rounded-2xl flex flex-col items-center text-center gap-3">
          <AlertCircle size={40} className="text-red-500" />
          <h2 className="text-lg font-bold text-red-900">Connection Failed</h2>
          <p className="text-red-700 max-w-sm">Failed to retrieve faculty data. Please try again later.</p>
        </div>
      ) : faculties.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 p-16 rounded-2xl flex flex-col items-center text-center gap-4">
          <div className="p-4 bg-gray-50 rounded-full">
            <GraduationCap size={40} className="text-gray-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">No Faculties Found</h2>
            <p className="text-gray-500 mt-1">Start by adding your first academic faculty.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-accent font-bold hover:underline"
          >
            Create one now
          </button>
        </div>
      ) : (
        <FacultyTable 
          faculties={faculties} 
          onEdit={(fac, rect) => { 
            setActiveFac(fac); 
            setModalTriggerRect(rect);
            setIsModalOpen(true); 
          }}
          onDelete={(fac, rect) => setConfirmState({ isOpen: true, fac, triggerRect: rect })}
        />
      )}

      <FacultyFormModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setActiveFac(null); }} 
        faculty={activeFac} 
        triggerRect={modalTriggerRect}
      />

      <ConfirmDialog 
        isOpen={confirmState.isOpen}
        title={confirmState.fac?.isActive !== false ? "Deactivate Faculty" : "Activate Faculty"}
        message={confirmState.fac?.isActive !== false 
          ? `Are you sure you want to deactivate ${confirmState.fac?.name}? This will block login for all related staff and deans.` 
          : `Enable access for ${confirmState.fac?.name} and its related users?`}
        onConfirm={() => deleteMutation.mutate(confirmState.fac?.customId || confirmState.fac?._id)}
        onCancel={() => setConfirmState({ isOpen: false, fac: null, triggerRect: null })}
        confirmText={confirmState.fac?.isActive !== false ? "Deactivate" : "Activate"}
        confirmColor={confirmState.fac?.isActive !== false ? "danger" : "success"}
        isLoading={deleteMutation.isPending}
        triggerRect={confirmState.triggerRect}
      />
    </div>
  );
}
