import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAnnouncement, updateAnnouncement } from '../api/announcementMutations';
import { getDepartments } from '../../departments/api/getDepartments';
import { getFaculties } from '../../faculties/api/getFaculties';
import { getOffices } from '../../offices/api/getOffices';
import { X, Bell, Type, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import useAuthStore from '../../../store/authStore';

/**
 * Modern anchored form popup for creating or editing announcements.
 */
export default function AnnouncementFormModal({ isOpen, onClose, triggerRect = null, initialData = null }) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const facultyId = (user?.faculty && typeof user.faculty === 'object') ? user.faculty.customId : user?.faculty;
  const [position, setPosition] = useState({ opacity: 0, scale: 0.95 });
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetType: 'global',
    targetId: '',
  });

  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePoster = () => {
    setPosterFile(null);
    setPosterPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

  // Default target type based on role OR initialData
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title || '',
          content: initialData.content || '',
          targetType: initialData.targetType || 'global',
          targetId: initialData.targetId || initialData.faculty?.customId || initialData.department?.customId || '',
        });
        if (initialData.poster) setPosterPreview(initialData.poster);
      } else {
        // Reset to defaults
        if (user?.role === 'coordinator') {
          if (user.office) {
            setFormData({ title: '', content: '', targetType: 'office', targetId: user.office });
          } else {
            setFormData({ title: '', content: '', targetType: 'department', targetId: user.department });
          }
        } else if (user?.role === 'dean') {
          setFormData({ title: '', content: '', targetType: 'faculty', targetId: facultyId });
        } else {
          setFormData({ title: '', content: '', targetType: 'global', targetId: '' });
        }
        setPosterFile(null);
        setPosterPreview(null);
      }
    }
  }, [isOpen, user, initialData, facultyId]);

  const { data: facultiesData } = useQuery({
    queryKey: ['faculties', { limit: 100 }],
    queryFn: () => getFaculties({ limit: 100 }),
    enabled: isOpen && formData.targetType === 'faculty',
  });
  const faculties = facultiesData?.data || [];

  const { data: deptsData } = useQuery({
    queryKey: ['departments', { limit: 100, faculty: user?.role === 'dean' ? facultyId : undefined }],
    queryFn: () => getDepartments({ limit: 100, faculty: user?.role === 'dean' ? facultyId : undefined }),
    enabled: isOpen && formData.targetType === 'department',
  });
  const departments = deptsData?.data?.departments || [];

  const { data: officesData } = useQuery({
    queryKey: ['offices', { limit: 100 }],
    queryFn: () => getOffices({ limit: 100 }),
    enabled: isOpen && formData.targetType === 'office',
  });
  const offices = officesData?.data?.offices || [];

  const mutation = useMutation({
    mutationFn: (data) => {
      if (initialData) {
        return updateAnnouncement({ id: initialData.customId || initialData._id, data });
      }
      return createAnnouncement(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      resetForm();
      onClose();
    },
  });

  const resetForm = () => {
    setFormData({ title: '', content: '', targetType: 'global', targetId: '' });
    setPosterFile(null);
    setPosterPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('content', formData.content);
    data.append('targetType', formData.targetType);
    
    let finalTargetId = formData.targetId;
    if (user?.role === 'coordinator') {
      finalTargetId = user.office || user.department;
    }
    if (user?.role === 'dean' && formData.targetType === 'faculty') finalTargetId = facultyId;

    if (formData.targetType !== 'global' && finalTargetId) {
      data.append('targetId', finalTargetId);
    }

    if (posterFile) {
      data.append('poster', posterFile);
    }

    mutation.mutate(data);
  };

  if (!isOpen) return null;

  const canTargetGlobal = ['admin', 'director'].includes(user?.role);
  const canTargetFaculty = ['admin', 'director', 'dean'].includes(user?.role);
  const canTargetDepartment = ['admin', 'director', 'dean', 'coordinator'].includes(user?.role);
  const canTargetOffice = ['admin', 'director', 'coordinator'].includes(user?.role);

  return (
    <div 
      className={`fixed inset-0 z-50 ${!triggerRect ? 'bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6' : ''}`}
      onClick={onClose}
    >
      <div 
        ref={triggerRect ? menuRef : null}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-gray-100 ${triggerRect ? 'fixed' : ''}`}
        style={triggerRect ? { 
           ...position,
           transform: `scale(${position.scale || 1})`,
           transformOrigin: position.transformOrigin 
        } : undefined}
      >
        <div className="flex justify-between items-center p-5 pb-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Bell size={20} />
            </div>
            <h3 className="text-lg font-black text-primary uppercase tracking-tight">
              {initialData ? 'Update Broadcast' : 'New Broadcast'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-all p-1.5 hover:bg-red-50 rounded-full">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar-premium">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Announce as</label>
              <div className="relative">
                <Type className="absolute left-3 top-3.5 text-gray-300" size={16} />
                <textarea 
                  required
                  rows="2"
                  placeholder="The Title of Announcement"
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-accent outline-none font-bold text-sm resize-none transition-all"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
            </div>

            {user?.role !== 'coordinator' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Audience Scope</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-accent outline-none text-xs font-black uppercase disabled:opacity-50 transition-all"
                    value={formData.targetType}
                    onChange={e => setFormData({...formData, targetType: e.target.value, targetId: ''})}
                    disabled={user?.role === 'coordinator' || !!initialData}
                  >
                    {canTargetGlobal && <option value="global">🌐 Institutional</option>}
                    {canTargetFaculty && <option value="faculty">🛡️ Faculty Level</option>}
                    {canTargetDepartment && <option value="department">🏢 Department</option>}
                    {canTargetOffice && <option value="office">🏢 Office Level</option>}
                  </select>
                </div>

                {formData.targetType === 'faculty' && (
                  <div className="space-y-1.5 animate-in slide-in-from-right-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Faculty</label>
                    <select 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-accent outline-none text-xs font-black uppercase transition-all"
                      value={formData.targetId}
                      onChange={e => setFormData({...formData, targetId: e.target.value})}
                      disabled={user?.role === 'dean' || !!initialData}
                    >
                      {user?.role === 'dean' ? (
                        <option value={facultyId}>Current Faculty</option>
                      ) : (
                        <>
                          <option value="">Choose Faculty...</option>
                          {faculties.map(f => <option key={f._id} value={f.customId}>{f.name}</option>)}
                        </>
                      )}
                    </select>
                  </div>
                )}

                {formData.targetType === 'department' && (
                  <div className="space-y-1.5 animate-in slide-in-from-right-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Department</label>
                    <select 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-accent outline-none text-xs font-black uppercase transition-all"
                      value={user?.role === 'coordinator' ? user.department : formData.targetId}
                      onChange={e => setFormData({...formData, targetId: e.target.value})}
                      disabled={user?.role === 'coordinator' || !!initialData}
                    >
                      {user?.role === 'coordinator' ? (
                        <option value={user.department}>Standard Department</option>
                      ) : (
                        <>
                          <option value="">Choose Department...</option>
                          {departments.map(d => <option key={d._id} value={d.customId}>{d.name}</option>)}
                        </>
                      )}
                    </select>
                  </div>
                )}

                {formData.targetType === 'office' && (
                  <div className="space-y-1.5 animate-in slide-in-from-right-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Office</label>
                    <select 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-accent outline-none text-xs font-black uppercase transition-all"
                      value={user?.role === 'coordinator' ? user.office : formData.targetId}
                      onChange={e => setFormData({...formData, targetId: e.target.value})}
                      disabled={user?.role === 'coordinator' || !!initialData}
                    >
                      {user?.role === 'coordinator' ? (
                        <option value={user.office}>Current Office</option>
                      ) : (
                        <>
                          <option value="">Choose Office...</option>
                          {offices.map(o => <option key={o._id} value={o.customId}>{o.name}</option>)}
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Poster Upload Section */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Optional Poster (Image)</label>
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group ${
                   posterPreview ? 'border-accent bg-accent/5' : 'border-gray-100 bg-gray-50 hover:bg-gray-100/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {posterPreview ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-sm">
                    <img src={posterPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removePoster(); }}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-white rounded-xl shadow-sm text-gray-400 group-hover:text-accent group-hover:scale-110 transition-all">
                      <ImageIcon size={24} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Click to upload poster</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Content Details</label>
              <textarea 
                required
                rows="4"
                placeholder="Broadcast details..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-accent outline-none resize-none text-sm font-medium leading-relaxed transition-all"
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
              />
            </div>
          </div>

          {mutation.isError && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-[10px] font-bold flex items-center gap-2">
              <AlertCircle size={14} />
              {mutation.error.response?.data?.message || mutation.error.message || 'Failed to process request.'}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 px-4 rounded-xl border border-gray-100 text-gray-400 font-bold hover:bg-gray-50 transition-all text-[10px] uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={mutation.isPending}
              className="flex-[1.5] py-3 px-4 rounded-xl bg-primary text-white font-bold hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 text-[10px] flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              {mutation.isPending ? <Loader2 className="animate-spin" size={14} /> : initialData ? 'Update Alert' : 'Post Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
