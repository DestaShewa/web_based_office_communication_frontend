import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyMeetings,
  getDepartmentMeetings,
  getFacultyMeetings,
  getOfficeMeetings,
  getUniversityMeetings,
  getAllMeetings
} from '../api/getMeetings';
import { updateMeetingStatus } from '../api/meetingMutations';
import { getFaculties } from '../../faculties/api/getFaculties';
import { getDepartments } from '../../departments/api/getDepartments';
import MeetingFormModal from './MeetingFormModal';
import {
  Search, Plus, MapPin, Calendar, Clock,
  Users, MoreVertical, Loader2, Filter,
  CheckCircle, XCircle, AlertCircle, ClipboardList,
  Building2, User, UserPlus, ChevronRight, Bell
} from 'lucide-react';
import * as HoverCard from '@radix-ui/react-hover-card';
import useAuthStore from '../../../store/authStore';
import ActionMenu from '../../../components/ActionMenu';
import { getAvatarUrl } from '../../messages/utils/statusUtils';

export default function MeetingTable({ view = 'all' }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [page, setPage] = useState(1);
  const [triggerRect, setTriggerRect] = useState(null);

  // Clear highlight after 5 seconds
  useEffect(() => {
    if (highlightId) {
      const timer = setTimeout(() => {
        searchParams.delete('highlight');
        setSearchParams(searchParams, { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightId, searchParams, setSearchParams]);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  const [facultyFilter, setFacultyFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Oversight Data
  const { data: facultiesData } = useQuery({
    queryKey: ['faculties'],
    queryFn: () => getFaculties({ limit: 100 }),
    enabled: ['director'].includes(user?.role),
  });

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => getDepartments({ limit: 100 }),
    enabled: ['director', 'dean'].includes(user?.role),
  });

  const faculties = facultiesData?.data?.faculties || [];
  const departments = deptsData?.data?.departments || [];

  // Main Meetings Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ['meetings', view, page, limit, debouncedSearch, facultyFilter, deptFilter],
    queryFn: () => {
      const params = { page, limit, search: debouncedSearch };

      if (view === 'mine') return getMyMeetings(params);

      // Hierarchical Oversight
      if (user?.role === 'director') {
        if (deptFilter) return getDepartmentMeetings(deptFilter, params);
        if (facultyFilter) return getFacultyMeetings(facultyFilter, params);
        return getAllMeetings(params);
      }

      if (user?.role === 'dean') {
        if (deptFilter) return getDepartmentMeetings(deptFilter, params);
        return getFacultyMeetings(user?.faculty?._id || user?.faculty, params);
      }

      if (user?.role === 'coordinator') {
        if (user.office) return getOfficeMeetings(user.office?._id || user.office, params);
        return getDepartmentMeetings(user?.department?._id || user?.department, params);
      }

      return getMyMeetings(params); // Fallback
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateMeetingStatus({ id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });

  const meetings = data?.data?.meetings || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const showActionsColumn = meetings.some(m => {
    const organizerId = m.organizer?.customId || m.organizer;
    return organizerId === user?.customId;
  });

  const ScopeBadge = ({ scope, faculty, department, office }) => {
    const config = {
      university: { icon: <Building2 size={12} />, label: 'University', color: 'text-primary bg-primary/5 border-primary/20' },
      faculty: { icon: <Users size={12} />, label: faculty?.name || 'Faculty', color: 'text-blue-600 bg-blue-50 border-blue-100' },
      department: { icon: <User size={12} />, label: department?.name || 'Department', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
      office: { icon: <Building2 size={12} />, label: office?.name || 'Office', color: 'text-amber-600 bg-amber-50 border-amber-100' }
    };
    const { icon, label, color } = config[scope] || config.department;

    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest w-fit shadow-sm ${color}`}>
        {icon}
        <span className="truncate max-w-[120px]">{label}</span>
      </div>
    );
  };

  const StakeholderPreview = ({ organizer, participants }) => {
    const list = Array.isArray(participants) ? participants : [];
    const totalCount = list.length;

    return (
      <HoverCard.Root openDelay={150} closeDelay={100}>
        <HoverCard.Trigger asChild>
          <div className="flex items-center gap-2 cursor-help group/stk w-fit">
            <div className="flex -space-x-2.5">
              {organizer && (
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border-2 border-white shadow-sm overflow-hidden ring-1 ring-primary/20 z-10">
                  {organizer.profilePhoto
                    ? <img src={getAvatarUrl(organizer.profilePhoto)} alt="" className="w-full h-full object-cover" />
                    : organizer.name?.charAt(0) || 'O'}
                </div>
              )}
              {list.slice(0, 2).map((u, i) => (
                <div key={i} className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-[10px] font-black text-accent border-2 border-white shadow-sm overflow-hidden ring-1 ring-accent/20">
                  {u.profilePhoto
                    ? <img src={getAvatarUrl(u.profilePhoto)} alt="" className="w-full h-full object-cover" />
                    : u.name?.charAt(0) || 'P'}
                </div>
              ))}
              {totalCount > 2 && (
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 border-2 border-white shadow-sm">
                  +{totalCount - 2}
                </div>
              )}
            </div>
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter group-hover/stk:text-primary transition-colors">
              {totalCount === 0 ? 'No participants' : totalCount === 1 ? '1 member' : `${totalCount} members`}
            </span>
          </div>
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Content
            className="z-[100] w-80 bg-white p-5 rounded-[2rem] shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 backdrop-blur-xl"
            sideOffset={8}
            align="start"
          >
            <div className="space-y-5">
              {organizer && (
                <div className="pb-4 border-b border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Organizer</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border-2 border-white shadow-md overflow-hidden">
                      {organizer.profilePhoto
                        ? <img src={getAvatarUrl(organizer.profilePhoto)} alt="" className="w-full h-full object-cover" />
                        : organizer.name?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <p className="text-sm font-black text-primary leading-tight">{organizer.name}</p>
                      <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-1.5">{organizer.role}</p>
                    </div>
                  </div>
                </div>
              )}
              {list.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                    Attendees ({list.length})
                  </p>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar-premium">
                    {list.map((u, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group/it">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-[11px] font-black text-accent border-2 border-white shadow-sm overflow-hidden shrink-0 group-hover/it:shadow-md transition-all">
                          {u.profilePhoto
                            ? <img src={getAvatarUrl(u.profilePhoto)} alt="" className="w-full h-full object-cover" />
                            : u.name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-800 truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-tighter">{u.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <HoverCard.Arrow className="fill-white" />
          </HoverCard.Content>
        </HoverCard.Portal>
      </HoverCard.Root>
    );
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
      {/* Search and Filters */}
      <div className="p-8 border-b border-gray-50 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search meeting title or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-transparent rounded-[1.25rem] focus:outline-none focus:bg-white focus:border-primary/20 text-sm font-medium transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-3">
            {faculties.length > 0 && ['director'].includes(user?.role) && (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm group hover:border-primary/20 transition-all">
                <Building2 size={14} className="text-gray-400" />
                <select
                  value={facultyFilter}
                  onChange={(e) => { setFacultyFilter(e.target.value); setPage(1); setDeptFilter(''); }}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-primary outline-none cursor-pointer"
                >
                  <option value="">All Faculties</option>
                  {faculties.map(f => <option key={f.customId} value={f.customId}>{f.name}</option>)}
                </select>
              </div>
            )}

            {departments.length > 0 && ['director', 'dean'].includes(user?.role) && (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm group hover:border-primary/20 transition-all">
                <User size={14} className="text-gray-400" />
                <select
                  value={deptFilter}
                  onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-primary outline-none cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {departments
                    .filter(d => !facultyFilter || d.faculty === facultyFilter || d.faculty?._id === facultyFilter)
                    .map(d => <option key={d.customId} value={d.customId}>{d.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {(user?.role === 'director' || user?.role === 'dean' || user?.role === 'coordinator') && (
          <button
            onClick={(e) => {
              setTriggerRect(e.currentTarget.getBoundingClientRect());
              setIsFormOpen(true);
            }}
            className="whitespace-nowrap flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-[1.25rem] hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all text-xs font-black uppercase tracking-widest w-full lg:w-auto justify-center"
          >
            <Plus size={20} />
            Schedule Meeting
          </button>
        )}
      </div>

      {/* Table Content */}
      {/* Table/Card View Container */}
      <div className="min-h-[450px]">
        {/* Desktop Table View */}
        <table className="w-full text-left border-collapse hidden md:table">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              <th className="py-6 px-8">Agenda</th>
              <th className="py-6 px-8 text-center italic">Description</th>
              <th className="py-6 px-8">Scope</th>
              <th className="py-6 px-8">Date & Time</th>
              <th className="py-6 px-8">Attendees</th>
              <th className="py-6 px-8">Status</th>
              {showActionsColumn && <th className="py-6 px-8 text-right pr-12">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan="7" className="py-32 text-center items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Building2 size={16} className="text-primary/40" />
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading...</p>
                </div>
              </td></tr>
            ) : isError ? (
              <tr><td colSpan="7" className="py-32 text-center text-red-500 font-medium">System fault: Unable to retrieve meeting sequences.</td></tr>
            ) : meetings.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-32">
                  <div className="flex flex-col items-center justify-center opacity-30 filter grayscale">
                    <Calendar size={64} className="text-gray-300 mb-6" />
                    <h3 className="text-xl font-black text-primary mb-2 uppercase tracking-[0.1em]">No Meetings Scheduled</h3>
                    <p className="text-xs text-gray-500 font-bold max-w-xs text-center italic">No meetings scheduled yet.</p>
                  </div>
                </td>
              </tr>
            ) : (
              meetings.map((m) => (
                <tr
                  key={m._id}
                  className={`group transition-all duration-300 ${
                    (highlightId && (String(highlightId) === String(m.customId) || String(highlightId) === String(m._id)))
                      ? 'item-highlight'
                      : 'hover:bg-gray-50/80'
                  }`}
                >
                  <td className="py-7 px-8 max-w-[250px]">
                    <div className="min-w-0">
                      <p className="text-[13px] font-black text-primary mb-2 truncate group-hover:text-accent transition-colors">{m.title}</p>
                      <div className="flex items-center gap-2">
                        <div className="p-1 px-2 bg-gray-100 rounded-md">
                          <MapPin size={10} className="text-gray-400" />
                        </div>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest truncate">{m.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-7 px-8 text-center italic">
                    <HoverCard.Root openDelay={200}>
                      <HoverCard.Trigger asChild>
                        <p className="text-[12px] text-gray-500 max-w-[150px] truncate mx-auto cursor-help hover:text-primary transition-colors">
                          {m.description || 'No specialized narrative.'}
                        </p>
                      </HoverCard.Trigger>
                      <HoverCard.Portal>
                        <HoverCard.Content
                          className="z-[100] w-80 bg-white p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95"
                          sideOffset={5}
                        >
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                              <div className="p-3 bg-primary/5 text-primary rounded-2xl shadow-sm">
                                <Bell size={20} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-black text-primary truncate leading-none uppercase tracking-tight">{m.title}</h4>
                                <p className="text-[9px] text-gray-400 font-bold mt-1.5 uppercase tracking-widest">Meeting Brief</p>
                              </div>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto pr-3 custom-scrollbar-premium text-left">
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words font-medium antialiased">
                                {m.description || 'No specialized narrative provided.'}
                              </p>
                            </div>
                          </div>
                          <HoverCard.Arrow className="fill-white" />
                        </HoverCard.Content>
                      </HoverCard.Portal>
                    </HoverCard.Root>
                  </td>
                  <td className="py-7 px-8">
                    <ScopeBadge scope={m.scope} faculty={m.faculty} department={m.department} office={m.office} />
                  </td>
                  <td className="py-7 px-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Calendar size={14} className="text-primary" />
                        <span className="text-[11px] font-black text-gray-700 uppercase">{new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-3 opacity-60">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-10px font-black text-gray-500">
                          {m.time ? (() => {
                            const [h, min] = m.time.split(':');
                            const hrs = parseInt(h);
                            const ampm = hrs >= 12 ? 'PM' : 'AM';
                            const h12 = hrs % 12 || 12;
                            return `${h12}:${min} ${ampm}`;
                          })() : 'TBD'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-7 px-8">
                    <StakeholderPreview organizer={m.organizer} participants={m.attendees || []} />
                  </td>
                  <td className="py-7 px-8">
                    <div className={`px-4 py-2 rounded-2xl border text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-sm ${getStatusStyle(m.status)}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'scheduled' ? 'bg-blue-500 animate-pulse' : m.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      {m.status}
                    </div>
                  </td>
                  {showActionsColumn && (
                    <td className="py-7 px-8 text-right pr-12">
                      <div className="flex items-center justify-end gap-2">
                        {(m.organizer?.customId === user?.customId || m.organizer === user?.customId) && (
                          <ActionMenu
                            actions={[
                              ...(m.status === 'scheduled' ? [
                                {
                                  label: 'Mark Completed',
                                  icon: <CheckCircle size={16} />,
                                  onClick: () => statusMutation.mutate({ id: m.customId || m._id, status: 'completed' })
                                },
                                {
                                  label: 'Cancel Meeting',
                                  icon: <XCircle size={16} />,
                                  variant: 'danger',
                                  onClick: () => statusMutation.mutate({ id: m.customId || m._id, status: 'cancelled' })
                                }
                              ] : [])
                            ]}
                          />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {isLoading ? (
            <div className="py-24 text-center">
               <div className="w-10 h-10 border-4 border-gray-100 border-t-primary rounded-full animate-spin mx-auto"></div>
            </div>
          ) : isError ? (
            <div className="py-20 text-center text-red-500 font-bold text-xs uppercase">Error loading meetings</div>
          ) : meetings.length === 0 ? (
            <div className="py-20 text-center px-6 opacity-30 flex flex-col items-center gap-2">
               <Calendar size={48} />
               <p className="text-[10px] font-black uppercase tracking-widest text-primary">No meetings found</p>
            </div>
          ) : (
            meetings.map((m) => (
              <div 
                key={m._id}
                className={`p-5 flex flex-col gap-4 group transition-all ${
                  (highlightId && (String(highlightId) === String(m.customId) || String(highlightId) === String(m._id))) 
                    ? 'item-highlight rounded-2xl shadow-lg active:scale-[0.98]' 
                    : 'active:bg-gray-50 transition-colors'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <p className="text-sm font-black text-primary truncate leading-tight group-hover:text-accent transition-colors">{m.title}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                       <MapPin size={10} className="shrink-0" />
                       <span className="truncate">{m.location}</span>
                    </div>
                  </div>
                  {(m.organizer?.customId === user?.customId || m.organizer === user?.customId) && (
                    <ActionMenu
                      actions={[
                        ...(m.status === 'scheduled' ? [
                          {
                            label: 'Complete',
                            icon: <CheckCircle size={16} />,
                            onClick: () => statusMutation.mutate({ id: m.customId || m._id, status: 'completed' })
                          },
                          {
                            label: 'Cancel',
                            icon: <XCircle size={16} />,
                            variant: 'danger',
                            onClick: () => statusMutation.mutate({ id: m.customId || m._id, status: 'cancelled' })
                          }
                        ] : [])
                      ]}
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                   <ScopeBadge scope={m.scope} faculty={m.faculty} department={m.department} office={m.office} />
                   <div className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tighter flex items-center gap-1.5 shadow-sm ${getStatusStyle(m.status)}`}>
                      <div className={`w-1 h-1 rounded-full ${m.status === 'scheduled' ? 'bg-blue-500 animate-pulse' : m.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      {m.status}
                   </div>
                </div>

                {m.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50/50 p-2.5 rounded-xl italic font-medium leading-relaxed">
                    {m.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-50">
                   <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-gray-700 uppercase">{new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                         <span className="text-[9px] font-bold text-gray-400">
                           {m.time ? (() => {
                             const [h, min] = m.time.split(':');
                             const hrs = parseInt(h);
                             const ampm = hrs >= 12 ? 'PM' : 'AM';
                             const h12 = hrs % 12 || 12;
                             return `${h12}:${min} ${ampm}`;
                           })() : 'TBD'}
                         </span>
                      </div>
                   </div>
                   <StakeholderPreview organizer={m.organizer} participants={m.attendees || []} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination Container */}
      <div className="px-10 py-8 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
        <div className="flex flex-col">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Scheduled Meetings</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Page {page} of {totalPages} • Total {total} Meetings</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="w-12 h-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl hover:border-primary/20 hover:text-primary disabled:opacity-30 disabled:hover:border-gray-100 disabled:hover:text-gray-400 transition-all shadow-sm active:scale-90"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div className="w-12 h-12 flex items-center justify-center bg-primary text-white text-xs font-black rounded-2xl shadow-lg shadow-primary/30">
            {page}
          </div>
          <button
            disabled={page === totalPages || total === 0}
            onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="w-12 h-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl hover:border-primary/20 hover:text-primary disabled:opacity-30 disabled:hover:border-gray-100 disabled:hover:text-gray-400 transition-all shadow-sm active:scale-90"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <MeetingFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        triggerRect={triggerRect}
      />
    </div>
  );
}
