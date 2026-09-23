import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInstitutes } from '../api/instituteApi';
import InstituteTable from '../components/InstituteTable';
import InstituteFormModal from '../components/InstituteFormModal';
import { Plus, Search, Loader2, AlertCircle } from 'lucide-react';


export default function Institutes() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeInst, setActiveInst] = useState(null);
  const [triggerRect, setTriggerRect] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['institutes', search],
    queryFn: () => getInstitutes({ search }),
  });


  const institutes = data?.data?.institutes || data?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Institutes</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the high-level organizations in the system.</p>
        </div>
        <button 
          onClick={(e) => { 
            setActiveInst(null); 
            setTriggerRect(e.currentTarget.getBoundingClientRect());
            setIsModalOpen(true); 
          }}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 font-semibold"
        >
          <Plus size={20} />
          Register Institute
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by name or abbreviation..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white shadow-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={48} className="animate-spin text-primary" />
          <p className="text-gray-500 font-medium font-outfit">Loading institutes...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-100 p-8 rounded-2xl flex flex-col items-center text-center gap-3">
          <AlertCircle size={40} className="text-red-500" />
          <h2 className="text-lg font-bold text-red-900">Connection Failed</h2>
          <p className="text-red-700 max-w-sm">We couldn't reach the server to fetch institute data. Please verify your connection.</p>
        </div>
      ) : institutes.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 p-16 rounded-2xl flex flex-col items-center text-center gap-4">
          <div className="p-4 bg-gray-50 rounded-full">
            <Search size={40} className="text-gray-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">No Institutes Found</h2>
            <p className="text-gray-500 mt-1">Start by registering the first institution in the system.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-primary font-bold hover:underline"
          >
            Add an institute now
          </button>
        </div>
      ) : (
        <InstituteTable 
          institutes={institutes} 
          onEdit={(inst, rect) => { 
            setActiveInst(inst); 
            setTriggerRect(rect);
            setIsModalOpen(true); 
          }}
        />
      )}

      <InstituteFormModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setActiveInst(null); }} 
        institute={activeInst} 
        triggerRect={triggerRect}
      />
    </div>
  );
}
