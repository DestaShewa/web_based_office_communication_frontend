import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scheduleMeeting } from '../api/meetingMutations';
import { getUsers } from '../../users/api/getUsers';
import { getDepartments } from '../../departments/api/getDepartments';
import { getFaculties } from '../../faculties/api/getFaculties';
import {
  X, Calendar, Clock, MapPin, Users, Loader2,
  Check, Search, AlertCircle, Info, Plus,
  Building2, User, Globe, ChevronDown
} from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import { getAvatarUrl } from '../../messages/utils/statusUtils';
import { toast } from 'sonner';

export default function MeetingFormModal({ isOpen, onClose, triggerRect = null }) {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [position, setPosition] = useState({ opacity: 0, scale: 0.95 });
  const menuRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    scope: 'department',
    faculty: '',
    department: '',
    office: '',
    attendees: []
  });

  const [userSearch, setUserSearch] = useState('');

  const calculatePosition = useCallback(() => {
    if (!triggerRect || !menuRef.current) return;

    const PADDING = 16;
    const SPACING = 8;
    const menuRect = menuRef.current.getBoundingClientRect();

    let left = triggerRect.left;
    let top = triggerRect.top - menuRect.height - SPACING;

    let originY = 'bottom';
    let originX = 'left';

    if (left + menuRect.width + PADDING > window.innerWidth) {
      left = triggerRect.right - menuRect.width;
      originX = 'right';
    }

    if (top < PADDING) {
      top = triggerRect.bottom + SPACING;
      originY = 'top';
    }

    if (left < PADDING) {
      left = PADDING;
      originX = 'left';
    }

    if (top + menuRect.height + PADDING > window.innerHeight) {
      top = window.innerHeight - menuRect.height - PADDING;
      originY = 'bottom';
    }

    setPosition({
      top,
      left,
      opacity: 1,
      scale: 1,
      transformOrigin: `${originY} ${originX}`
    });
  }, [triggerRect]);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRect) return;
    calculatePosition();

    const resizeObserver = new ResizeObserver(() => calculatePosition());
    if (menuRef.current) resizeObserver.observe(menuRef.current);
    window.addEventListener('resize', calculatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen, triggerRect, calculatePosition]);

  useEffect(() => {
    if (isOpen && currentUser) {
      let defaultScope = 'department';
      if (currentUser.role === 'director') defaultScope = 'university';
      else if (currentUser.role === 'dean') defaultScope = 'faculty';
      else if (currentUser.office) defaultScope = 'office';

      setFormData(prev => ({
        ...prev,
        scope: defaultScope,
        faculty: currentUser.faculty?.customId || currentUser.faculty || '',
        department: currentUser.department?.customId || currentUser.department || '',
        office: currentUser.office?.customId || currentUser.office || ''
      }));
    }
  }, [isOpen, currentUser]);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', {
      search: userSearch,
      limit: 100,
      faculty: (formData.scope === 'faculty' || formData.scope === 'department') ? formData.faculty : undefined,
      department: formData.scope === 'department' ? formData.department : undefined,
      office: formData.scope === 'office' ? formData.office : undefined
    }],
    queryFn: () => getUsers({
      search: userSearch,
      limit: 100,
      purpose: 'task_assignment',
      faculty: (formData.scope === 'faculty' || formData.scope === 'department') ? formData.faculty : undefined,
      department: formData.scope === 'department' ? formData.department : undefined,
      office: formData.scope === 'office' ? formData.office : undefined
    }),
    enabled: isOpen,
  });

  const { data: deptsData } = useQuery({
    queryKey: ['departments', { limit: 100, faculty: formData.faculty }],
    queryFn: () => getDepartments({ limit: 100, faculty: formData.faculty }),
    enabled: isOpen,
  });

  const { data: facultiesData } = useQuery({
    queryKey: ['faculties'],
    queryFn: () => getFaculties({ limit: 100 }),
    enabled: isOpen,
  });

  const allUsers = Array.isArray(usersData?.data?.users) ? usersData.data.users :
    Array.isArray(usersData?.data) ? usersData.data : [];

  const departments = Array.isArray(deptsData?.data?.departments) ? deptsData.data.departments :
    Array.isArray(deptsData?.data) ? deptsData.data : [];

  const faculties = Array.isArray(facultiesData?.data?.faculties) ? facultiesData.data.faculties :
    Array.isArray(facultiesData?.data) ? facultiesData.data : [];

  const mutation = useMutation({
    mutationFn: scheduleMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting scheduled successfully.');
      onClose();
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to schedule meeting.');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '', description: '', date: '', time: '',
      duration: 60, location: '', 
      scope: currentUser?.office ? 'office' : 'department',
      faculty: '', department: '', office: '', attendees: []
    });
    setUserSearch('');
  };

  const toggleAttendee = (userCustomId) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(userCustomId)
        ? prev.attendees.filter(id => id !== userCustomId)
        : [...prev.attendees, userCustomId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Temporal Validation
    const selectedDate = new Date(formData.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error('Cannot schedule a meeting in the past.');
      return;
    }

    // Sanitize payload: remove empty strings for optional context fields
    const payload = {
      ...formData,
      faculty: formData.faculty || undefined,
      department: formData.department || undefined,
      office: formData.office || undefined,
      agenda: formData.description || '', // Map description to agenda as per model
    };

    mutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] transition-all ${!triggerRect ? 'bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4' : ''}`} onClick={onClose}>
      <div 
        ref={triggerRect ? menuRef : null}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col animate-in zoom-in-95 duration-200 ${triggerRect ? 'fixed' : ''}`}
        style={triggerRect ? {
          ...position,
          transform: `scale(${position.scale || 1})`,
          transformOrigin: position.transformOrigin
        } : undefined}
      >

        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-2xl shadow-sm">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-primary uppercase tracking-tight leading-none">
                MEETING SCHEDULING
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar-premium p-6 space-y-6">

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Agenda Title</label>
              <div className="relative group">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={16} />
                <input
                  required
                  type="text"
                  placeholder="Enter agenda title..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold text-sm transition-all"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            {/* Details Grid */}
            <div className={`grid gap-6 pb-6 border-b border-gray-50 ${currentUser?.office ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {/* Scope & Context */}
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Scope</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {currentUser?.office ? (
                        <div className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-primary bg-primary/5 text-primary shadow-sm font-black">
                           <Building2 size={14} />
                           <span className="text-[10px] uppercase tracking-widest leading-none">Office Level</span>
                        </div>
                    ) : (
                      [
                        { id: 'university', label: 'Univ', icon: <Globe size={14} />, role: ['director'] },
                        { id: 'faculty', label: 'Faculty', icon: <Building2 size={14} />, role: ['director', 'dean'] },
                        { id: 'department', label: 'Dept', icon: <User size={14} />, role: ['director', 'dean', 'coordinator'] }
                      ].map(s => {
                        const isAllowed = s.role.includes(currentUser?.role);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            disabled={!isAllowed}
                            onClick={() => setFormData({ ...formData, scope: s.id })}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all ${formData.scope === s.id
                              ? 'border-primary bg-primary/5 text-primary shadow-sm font-black'
                              : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                              } ${!isAllowed ? 'opacity-20 cursor-not-allowed grayscale' : ''}`}
                          >
                            {s.icon}
                            <span className="text-[10px] uppercase tracking-widest leading-none">{s.label}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {formData.scope !== 'university' && !currentUser?.office && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Faculty</label>
                      <select
                        disabled={currentUser?.role === 'dean' || currentUser?.role === 'coordinator'}
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-xs font-black uppercase transition-all disabled:opacity-60"
                        value={formData.faculty}
                        onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                      >
                        <option value="">Select Faculty...</option>
                        {faculties.map(f => <option key={f.customId} value={f.customId}>{f.name}</option>)}
                      </select>
                    </div>
                  )}

                  {formData.scope === 'department' && !currentUser?.office && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Dept</label>
                      <select
                        disabled={currentUser?.role === 'coordinator'}
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-xs font-black uppercase transition-all"
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                      >
                        <option value="">Select Dept...</option>
                        {departments
                          .filter(d => !formData.faculty || d.faculty === formData.faculty || (d.faculty?.customId === formData.faculty))
                          .map(d => <option key={d.customId} value={d.customId}>{d.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Timing & Venue */}
              <div className="space-y-6">
                <div className={`grid gap-4 ${currentUser?.office ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                    <div className="relative group">
                      <input
                        required
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold text-sm transition-all uppercase"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Time</label>
                    <div className="relative group">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={16} />
                      <input
                        required
                        type="time"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold text-sm transition-all"
                        value={formData.time}
                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Venue / Location</label>
                  <div className="relative group">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={16} />
                    <input
                      required
                      type="text"
                      placeholder="Main Hall..."
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold text-sm transition-all"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Attendee Selection */}
            <div className="space-y-1.5 pt-6 border-t border-gray-50">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Attendees <span className="text-red-500 font-black ml-1">(Required)</span></label>
                {formData.attendees.length > 0 && (
                  <span className="text-accent lowercase font-normal italic text-[10px]">
                    ({formData.attendees.length} selected)
                  </span>
                )}
              </div>
              
              <div className="relative group/search mb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/search:text-accent transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Search by name, username..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none font-bold text-sm transition-all"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>

              <div className="border border-gray-100 rounded-2xl bg-gray-50/50 p-3 max-h-[180px] overflow-y-auto space-y-2 custom-scrollbar-premium">
                {usersLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary opacity-30" size={20} /></div>
                ) : allUsers.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 italic text-xs uppercase tracking-tight">No members found.</div>
                ) : (
                  allUsers
                    .filter(u => u.customId !== currentUser?.customId && u.role !== 'admin')
                    .map(u => (
                      <label
                        key={u._id}
                        className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${formData.attendees.includes(u.customId)
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-transparent hover:bg-white'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.attendees.includes(u.customId)}
                          onChange={() => toggleAttendee(u.customId)}
                          className="w-4 h-4 rounded-md border-gray-300 text-primary focus:ring-primary transition-all cursor-pointer"
                        />
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-100 overflow-hidden shrink-0">
                          {u.profilePhoto
                            ? <img src={getAvatarUrl(u.profilePhoto)} className="w-full h-full object-cover" />
                            : <span className="text-[10px] font-black text-primary">{u.name?.charAt(0)}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-700 truncate capitalize">{u.name}</p>
                          <p className="text-[9px] text-accent font-black uppercase tracking-tighter">{u.role}</p>
                        </div>
                      </label>
                    ))
                )}
              </div>
            </div>

            {/* Description/Agenda */}
            <div className="space-y-1.5 pt-6 border-t border-gray-50">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
              <textarea
                rows="3"
                maxLength="5000"
                placeholder="Agenda Description Here..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none resize-none font-medium text-sm leading-relaxed transition-all"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>


          {/* Action Footer */}
          <div className="flex gap-4 p-6 pt-2 border-t border-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-2xl border border-gray-100 text-gray-400 font-black hover:bg-gray-50 transition-all text-xs uppercase tracking-widest active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || formData.attendees.length === 0}
              className="flex-[1.5] py-4 px-6 rounded-2xl bg-primary text-white font-black hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-3 uppercase tracking-widest"
            >
              {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <Calendar size={18} />
                  {formData.attendees.length === 0 ? 'Select Attendees first' : 'Schedule Meeting'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
