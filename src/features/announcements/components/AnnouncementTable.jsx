import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getMyAnnouncements } from '../api/getAnnouncements';
import { acknowledgeAnnouncement, hideAnnouncement, deleteAnnouncement } from '../api/announcementMutations';
import AnnouncementFormModal from './AnnouncementFormModal';
import ReadStatusModal from './ReadStatusModal';
import { getAvatarUrl, getFullUrl } from '../../messages/utils/statusUtils';
import { 
  Search, Plus, Bell,  
  Loader2,  
  ShieldCheck, Megaphone,
  UserCheck, Building, Globe, CheckCircle2,
  FileText, Trash2, ShieldAlert,
  Filter, Calendar, X, Pencil
} from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import ActionMenu from '../../../components/ActionMenu';
import ConfirmDialog from '../../../components/ConfirmDialog';
import * as HoverCard from '@radix-ui/react-hover-card';

export default function AnnouncementTable() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const hoverTimeouts = useRef({});
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  
  // Pagination & Search States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Filter States
  const [scope, setScope] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal & Popup States
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [modalTriggerRect, setModalTriggerRect] = useState(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(hoverTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  // Clear highlight after 5 seconds
  useEffect(() => {
    if (highlightId) {
      const timer = setTimeout(() => {
        setSearchParams(prev => {
          const params = new URLSearchParams(prev);
          params.delete('highlight');
          return params;
        }, { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightId, setSearchParams]);

  // For delete confirmation
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null, type: null, rect: null });

  // Queries
  const { data, isLoading, isError } = useQuery({
    queryKey: ['announcements', { search: debouncedSearch, page, limit, scope, startDate, endDate }],
    queryFn: () => getMyAnnouncements({ 
      search: debouncedSearch, 
      page, 
      limit, 
      scope: scope || undefined, 
      startDate: startDate || undefined, 
      endDate: endDate || undefined 
    }),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id) => acknowledgeAnnouncement(id),
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['announcements'] });
      const previousData = queryClient.getQueryData(['announcements', { search: debouncedSearch, page, limit, scope, startDate, endDate }]);
      
      if (previousData) {
        queryClient.setQueryData(
          ['announcements', { search: debouncedSearch, page, limit, scope, startDate, endDate }],
          {
            ...previousData,
            data: {
              ...previousData.data,
              announcements: previousData.data.announcements.map(a => 
                (a.customId === id || a._id === id) ? { ...a, isRead: true } : a
              )
            }
          }
        );
      }
      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['announcements', { search: debouncedSearch, page, limit, scope, startDate, endDate }], context.previousData);
      }
    }
  });

  const handleMouseEnter = (announcement) => {
    if (announcement.isRead) return;
    
    // Clear existing timeout if any
    if (hoverTimeouts.current[announcement._id]) {
      clearTimeout(hoverTimeouts.current[announcement._id]);
    }

    // Set new timeout for 800ms of deliberate hovering
    hoverTimeouts.current[announcement._id] = setTimeout(() => {
      acknowledgeMutation.mutate(announcement.customId || announcement._id);
      delete hoverTimeouts.current[announcement._id];
    }, 800);
  };

  const handleMouseLeave = (announcement) => {
    if (hoverTimeouts.current[announcement._id]) {
      clearTimeout(hoverTimeouts.current[announcement._id]);
      delete hoverTimeouts.current[announcement._id];
    }
  };

  const hideMutation = useMutation({
    mutationFn: (id) => hideAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
    },
  });

  const announcements = data?.data?.announcements || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const resetFilters = () => {
    setScope('');
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  const getTargetBadge = (type, targetData) => {
    switch (type) {
      case 'global':
        return (
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-tighter shadow-sm">
            <Globe size={12} />
            Global Level
          </div>
        );
      case 'faculty':
        return (
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full text-[10px] font-black text-orange-600 uppercase tracking-tighter shadow-sm">
            <ShieldCheck size={12} />
            {targetData?.abbreviation || 'Faculty'} Level
          </div>
        );
      case 'department':
        return (
          <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full text-[10px] font-black text-purple-600 uppercase tracking-tighter shadow-sm">
            <Building size={12} />
            {targetData?.abbreviation || 'Dept'} Level
          </div>
        );
      case 'office':
        return (
          <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full text-[10px] font-black text-teal-600 uppercase tracking-tighter shadow-sm">
            <Building size={12} />
            {targetData?.abbreviation || 'Office'} Level
          </div>
        );
      default:
        return null;
    }
  };

  const executeDelete = () => {
    if (confirmConfig.type === 'hide') {
      hideMutation.mutate(confirmConfig.id);
    } else {
      deleteMutation.mutate(confirmConfig.id);
    }
    setConfirmConfig({ isOpen: false, id: null, type: null, rect: null });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Search & Action Header */}
      <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-5 bg-gray-50/30">
        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search title, content, or author..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all text-sm font-medium bg-white"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {['admin', 'director', 'dean', 'coordinator'].includes(user?.role) && (
            <button 
              onClick={(e) => {
                 setModalTriggerRect(e.currentTarget.getBoundingClientRect());
                 setIsFormOpen(true);
              }}
              className="whitespace-nowrap flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all text-sm font-bold justify-center uppercase tracking-widest flex-1 lg:flex-none"
            >
              <Plus size={18} />
              Publish
            </button>
          )}
          
          {(scope || startDate || endDate || search) && (
            <button 
              onClick={resetFilters}
              className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors text-[10px] font-black uppercase tracking-widest px-3 border-l border-gray-200"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Toolbar */}
      <div className="px-6 py-4 bg-white border-b border-gray-50 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filters:</span>
        </div>

        {/* Scope Filter */}
        <div className="flex items-center gap-2 group">
          <Globe size={14} className="text-gray-300 group-hover:text-accent transition-colors" />
          <select 
            value={scope} 
            onChange={(e) => { setScope(e.target.value); setPage(1); }}
            className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer hover:text-accent transition-colors"
          >
            <option value="">All Scopes</option>
            <option value="global">Global Level</option>
            
            {/* Show Faculty/Dept options to Academic users and Leadership */}
            {(['admin', 'director', 'dean'].includes(user?.role) || (user?.department && !user?.office)) && (
              <>
                <option value="faculty">Faculty Level</option>
                <option value="department">Department Level</option>
              </>
            )}

            {/* Show Office option to Office users and Leadership */}
            {(['admin', 'director'].includes(user?.role) || user?.office) && (
              <option value="office">Office Level</option>
            )}
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-4 border-l border-gray-100 pl-6">
           <div className="flex items-center gap-2">
             <Calendar size={14} className="text-gray-300" />
             <input 
               type="date" 
               value={startDate}
               onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
               className="bg-transparent text-[10px] font-bold text-gray-600 outline-none cursor-pointer uppercase tracking-tighter"
               placeholder="Start"
             />
           </div>
           <span className="text-gray-300 text-xs">—</span>
           <div className="flex items-center gap-2">
             <input 
               type="date" 
               value={endDate}
               onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
               className="bg-transparent text-[10px] font-bold text-gray-600 outline-none cursor-pointer uppercase tracking-tighter"
               placeholder="End"
             />
           </div>
        </div>
      </div>

      {/* Table/Card View Container */}
      <div className="min-h-[450px]">
        {/* Desktop Table View */}
        <table className="w-full text-left border-collapse hidden md:table">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              <th className="py-5 px-6 font-semibold">Announcement</th>
              <th className="py-5 px-6 font-semibold text-center italic">Details</th>
              <th className="py-5 px-6 font-semibold">Scope</th>
              <th className="py-5 px-6 font-semibold">Published By</th>
              <th className="py-5 px-6 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan="5" className="py-24 text-center grayscale opacity-50"><Loader2 className="animate-spin mx-auto text-primary" size={36} /></td></tr>
            ) : isError ? (
              <tr><td colSpan="5" className="py-24 text-center text-red-500 font-black uppercase tracking-tighter">System Error: Failed to fetch announcements.</td></tr>
            ) : announcements.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-32 text-center text-gray-400">
                  <div className="opacity-20 flex flex-col items-center">
                    <Megaphone size={64} className="mb-4" />
                    <p className="text-lg font-black uppercase tracking-widest">No results matched.</p>
                    <p className="text-xs mt-2 italic font-normal tracking-normal capitalize">Try adjusting your filters or search terms.</p>
                  </div>
                </td>
              </tr>
            ) : (
              announcements.map((a) => (
                <tr 
                  key={a._id} 
                  onMouseEnter={() => handleMouseEnter(a)}
                  onMouseLeave={() => handleMouseLeave(a)}
                  className={`border-b border-gray-50 transition-all ${
                    (highlightId && (String(highlightId) === String(a.customId) || String(highlightId) === String(a._id))) 
                      ? 'item-highlight' 
                      : 'hover:bg-gray-50/50'
                  }`}
                >
                  <td className="py-4 px-6 max-w-[250px]">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${a.isRead ? 'bg-gray-100 text-gray-400' : 'bg-accent text-white shadow-sm'}`}>
                        {a.isRead ? <CheckCircle2 size={18} /> : <Bell size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold break-words ${a.isRead ? 'text-gray-600' : 'text-primary'}`}>
                          {a.title}
                          {!a.isRead && <span className="ml-2 inline-block w-2 h-2 bg-accent rounded-full animate-pulse"></span>}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <HoverCard.Root openDelay={200} closeDelay={100}>
                      <HoverCard.Trigger asChild>
                        <span className="inline-flex items-center gap-2 cursor-help border-b border-dotted border-gray-400 text-gray-400 hover:text-primary transition-colors text-xs font-semibold py-1">
                          <FileText size={16} />
                          Details
                        </span>
                      </HoverCard.Trigger>
                      <HoverCard.Portal>
                        <HoverCard.Content
                          className="z-50 w-80 bg-white p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 selection:bg-accent/20 outline-none"
                          side="right"
                          sideOffset={10}
                          align="center"
                          collisionPadding={16}
                          avoidCollisions={true}
                          hideWhenDetached={true}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                              <div className="w-8 h-8 bg-primary/5 text-primary rounded-lg flex items-center justify-center shadow-inner">
                                <Megaphone size={14} />
                              </div>
                              <h4 className="text-sm font-bold text-primary truncate flex-1 tracking-tight">{a.title}</h4>
                            </div>
                            
                            <div className="max-h-[400px] overflow-y-auto pr-1 custom-scrollbar-premium">
                              {getFullUrl(a.poster) && (
                                <div className="w-full bg-gray-50 rounded-xl overflow-hidden mb-3.5 mt-0.5 border border-gray-100/50 shadow-sm">
                                  <img 
                                    src={getFullUrl(a.poster)} 
                                    alt={a.title} 
                                    className="w-full max-h-48 object-contain mx-auto" 
                                  />
                                </div>
                              )}
                              <p className="text-[12px] text-gray-500 leading-relaxed whitespace-pre-wrap break-words font-medium">
                                {a.content || 'No content provided.'}
                              </p>
                            </div>
                          </div>
                          <HoverCard.Arrow className="fill-white" />
                        </HoverCard.Content>
                      </HoverCard.Portal>
                    </HoverCard.Root>
                  </td>
                  <td className="py-4 px-6">
                    {getTargetBadge(a.targetType, a.targetData)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary border-2 border-white shadow-sm overflow-hidden shrink-0">
                        {a.createdByData?.profilePhoto ? (
                          <img src={getAvatarUrl(a.createdByData.profilePhoto)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          a.createdByData?.name?.charAt(0) || 'S'
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-700 truncate">{a.createdByData?.name || 'System'}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter truncate">{a.createdByData?.role || 'ADMIN'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ActionMenu
                        actions={[
                          (user?.role === 'admin' || a.createdBy === user?.customId || a.createdBy?.customId === user?.customId) && {
                            label: 'Edit Announcement',
                            icon: <Pencil size={16} />,
                            onClick: (rect) => { 
                               setEditingAnnouncement(a);
                               setModalTriggerRect(rect);
                               setIsFormOpen(true); 
                            }
                          },
                          (user?.role === 'admin' || a.createdBy === user?.customId || a.createdBy?.customId === user?.customId) && {
                            label: 'View Read Status',
                            icon: <UserCheck size={16} />,
                            onClick: (rect) => { 
                               setSelectedAnnouncement(a.customId || a._id); 
                               setModalTriggerRect(rect);
                               setIsStatusOpen(true); 
                            }
                          },
                          // Hide for everyone (Delete from own view)
                          {
                            label: 'Delete',
                            icon: <Trash2 size={16} className="text-red-500" />,
                            onClick: (rect) => setConfirmConfig({ isOpen: true, id: a.customId || a._id, type: 'hide', rect })
                          },
                          // Delete for all (Only author or admin)
                          (user?.role === 'admin' || user?.customId === a.createdBy) && {
                            label: 'Delete All',
                            icon: <ShieldAlert size={16} className="text-red-600" />,
                            onClick: (rect) => setConfirmConfig({ isOpen: true, id: a.customId || a._id, type: 'delete', rect })
                          }
                        ].filter(Boolean)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {isLoading ? (
            <div className="py-24 text-center grayscale opacity-50"><Loader2 className="animate-spin mx-auto text-primary" size={32} /></div>
          ) : isError ? (
            <div className="py-20 text-center text-red-500 font-bold uppercase tracking-widest text-[10px]">Error loading announcements</div>
          ) : announcements.length === 0 ? (
            <div className="py-20 text-center px-6 opacity-40 italic text-sm">No announcements to display</div>
          ) : (
            announcements.map((a) => (
              <div 
                key={a._id}
                onMouseEnter={() => handleMouseEnter(a)}
                onMouseLeave={() => handleMouseLeave(a)}
                className={`p-4 flex flex-col gap-3 transition-all border-l-4 ${
                  (highlightId && (String(highlightId) === String(a.customId) || String(highlightId) === String(a._id)))
                    ? 'item-highlight border-accent'
                    : a.isRead ? 'border-transparent hover:bg-gray-50' : 'border-accent bg-accent/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                       <p className={`text-sm font-bold truncate ${a.isRead ? 'text-gray-600' : 'text-primary'}`}>{a.title}</p>
                       {!a.isRead && <span className="shrink-0 w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(a.createdAt).toLocaleDateString()}</span>
                       {getTargetBadge(a.targetType, a.targetData)}
                    </div>
                  </div>
                  <ActionMenu
                    actions={[
                      (user?.role === 'admin' || a.createdBy === user?.customId || a.createdBy?.customId === user?.customId) && {
                        label: 'Edit Announcement',
                        icon: <Pencil size={16} />,
                        onClick: (rect) => { 
                           setEditingAnnouncement(a);
                           setModalTriggerRect(rect);
                           setIsFormOpen(true); 
                        }
                      },
                      (user?.role === 'admin' || a.createdBy === user?.customId || a.createdBy?.customId === user?.customId) && {
                        label: 'Read Status',
                        icon: <UserCheck size={16} />,
                        onClick: (rect) => { 
                           setSelectedAnnouncement(a.customId || a._id); 
                           setModalTriggerRect(rect);
                           setIsStatusOpen(true); 
                        }
                      },
                      {
                        label: 'Delete',
                        icon: <Trash2 size={16} className="text-red-500" />,
                        onClick: (rect) => setConfirmConfig({ isOpen: true, id: a.customId || a._id, type: 'hide', rect })
                      },
                      (user?.role === 'admin' || user?.customId === a.createdBy) && {
                        label: 'Delete All',
                        icon: <ShieldAlert size={16} className="text-red-600" />,
                        onClick: (rect) => setConfirmConfig({ isOpen: true, id: a.customId || a._id, type: 'delete', rect })
                      }
                    ].filter(Boolean)}
                  />
                </div>

                <div className="py-2 px-3 bg-gray-50/50 rounded-lg text-xs text-gray-600 line-clamp-3 leading-relaxed">
                   {a.content}
                </div>

                <div className="flex items-center justify-between mt-1">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[9px] text-primary border border-white shrink-0 overflow-hidden">
                        {a.createdByData?.profilePhoto 
                          ? <img src={getAvatarUrl(a.createdByData.profilePhoto)} alt="" className="w-full h-full object-cover" />
                          : a.createdByData?.name?.charAt(0) || 'S'}
                      </div>
                      <span className="text-[11px] font-medium text-gray-500 truncate">{a.createdByData?.name || 'System'}</span>
                   </div>
                   {!a.isRead && (
                     <span className="text-[9px] font-black uppercase text-accent tracking-widest flex items-center gap-1">
                       <Megaphone size={10} /> New
                     </span>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 gap-4">
        <p>Page {page} of {totalPages} • {total} Total</p>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
            className="px-2 py-1.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-accent text-[10px] font-black"
          >
            <option value="10">10 / Page</option>
            <option value="25">25 / Page</option>
            <option value="50">50 / Page</option>
          </select>
          <div className="flex items-center gap-2 lowercase font-normal italic">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-1.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 transition-all font-bold shadow-sm"
            >
              Prev
            </button>
            <button
              disabled={page === totalPages || total === 0}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-1.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 transition-all font-bold shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AnnouncementFormModal 
        isOpen={isFormOpen} 
        onClose={() => { setIsFormOpen(false); setEditingAnnouncement(null); setModalTriggerRect(null); }} 
        triggerRect={modalTriggerRect}
        initialData={editingAnnouncement}
      />
      
      {selectedAnnouncement && (
        <ReadStatusModal
          isOpen={isStatusOpen}
          onClose={() => { setIsStatusOpen(false); setSelectedAnnouncement(null); setModalTriggerRect(null); }}
          announcementId={selectedAnnouncement}
          triggerRect={modalTriggerRect}
        />
      )}

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, id: null, type: null, rect: null })}
        onConfirm={executeDelete}
        title={confirmConfig.type === 'hide' ? 'Remove from View' : 'Delete Permanently'}
        message={confirmConfig.type === 'hide'
          ? 'This announcement will be removed from your list, but others will still see it. Continue?'
          : 'This will permanently delete the announcement for EVERYONE. This action cannot be undone. Area you sure?'
        }
        confirmText={confirmConfig.type === 'hide' ? 'Remove' : 'Delete for All'}
        confirmColor={confirmConfig.type === 'hide' ? 'primary' : 'danger'}
        triggerRect={confirmConfig.rect}
        isLoading={hideMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}
