import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, reassignTask, interveneTask } from '../api/taskMutations';
import { getUsers } from '../../users/api/getUsers';
import { getFaculties } from '../../faculties/api/getFaculties';
import { getDepartments } from '../../departments/api/getDepartments';
import { X, ClipboardList, Type, Calendar, AlertCircle, Loader2, ListChecks } from 'lucide-react';
import useAuthStore from '../../../store/authStore';

/**
 * Modern anchored task form popup.
 * Supports both creating new tasks and reassigning existing ones.
 */
export default function TaskFormModal({ isOpen, onClose, task = null, triggerRect = null, memoData = null }) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [position, setPosition] = useState({ opacity: 0, scale: 0.95 });
  const menuRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: [],
    dueDate: '',
    priority: 'medium',
    faculty: '',
    department: '',
    office: '',
    memoId: '',
  });

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
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignee: task.assignees?.map(a => a.user?._id || a.user) || [],
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        priority: task.priority || 'medium',
        faculty: task.faculty?._id || task.faculty || '',
        department: task.department?._id || task.department || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        assignee: [],
        dueDate: '',
        priority: 'medium',
        faculty: (user?.role === 'dean' || user?.role === 'coordinator')
          ? (user?.faculty?.customId || user?.faculty)
          : '',
        department: (user?.role === 'coordinator' && !user?.office)
          ? (user?.department?.customId || user?.department)
          : '',
        office: (user?.role === 'coordinator' && user?.office)
          ? (user?.office?.customId || user?.office)
          : '',
        memoId: '',
      });
    }

    // Auto-populate from memo if provided
    if (memoData && !task) {
      setFormData(prev => ({
        ...prev,
        title: memoData.title || prev.title,
        description: memoData.description || prev.description,
        priority: memoData.priority || prev.priority,
        memoId: memoData.memoId || '',
      }));
    }
  }, [task, isOpen, memoData]);

  const { data: facultiesData } = useQuery({
    queryKey: ['faculties'],
    queryFn: () => getFaculties({ limit: 100 }),
    enabled: isOpen
  });
  const faculties = Array.isArray(facultiesData?.data?.faculties)
    ? facultiesData.data.faculties
    : Array.isArray(facultiesData?.data) ? facultiesData.data : [];

  const { data: deptsData } = useQuery({
    queryKey: ['departments', formData.faculty],
    queryFn: () => getDepartments({ faculty: formData.faculty, limit: 100 }),
    enabled: isOpen && !!formData.faculty
  });
  const departments = Array.isArray(deptsData?.data?.departments)
    ? deptsData.data.departments
    : Array.isArray(deptsData?.data) ? deptsData.data : [];

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'assignment', formData.department, formData.faculty],
    queryFn: () => getUsers({
      department: formData.department || undefined,
      faculty: formData.faculty || undefined,
      office: formData.office || undefined,
      purpose: 'task_assignment',
      excludeSelf: true
    }),
    enabled: isOpen
  });
  const users = Array.isArray(usersData?.data?.users)
    ? usersData.data.users
    : Array.isArray(usersData?.data) ? usersData.data : [];

  const mutation = useMutation({
    mutationFn: (data) =>
      task?.isIntervention
        ? interveneTask({ taskId: task._id || task.customId, dueDate: data.dueDate, priority: data.priority })
        : task
          ? reassignTask({ taskId: task._id || task.customId, newAssigneeId: data.assignee })
          : createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Proactive validation check
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const selectedDate = new Date(formData.dueDate);
    
    if (selectedDate < now) {
      toast.error('Selected deadline cannot be in the past.');
      return;
    }

    mutation.mutate(formData);
  };

  const toggleAssignee = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignee: prev.assignee.includes(userId)
        ? prev.assignee.filter(id => id !== userId)
        : [...prev.assignee, userId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-all ${!triggerRect ? 'bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4' : ''}`}
      onClick={onClose}
    >
      <div
        ref={triggerRect ? menuRef : null}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-100 ${triggerRect ? 'fixed' : ''}`}
        style={triggerRect ? {
          ...position,
          transform: `scale(${position.scale || 1})`,
          transformOrigin: position.transformOrigin
        } : undefined}
      >
        <div className="flex justify-between items-center p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-2xl shadow-sm">
              <ClipboardList size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-primary uppercase tracking-tight leading-none">
                {task ? 'Reassign Task' : 'New Task Assignment'}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar-premium">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                <div className="relative group">
                  <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-accent transition-colors" size={16} />
                  <input
                    required
                    disabled={!!task}
                    placeholder="type title..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none font-bold text-sm transition-all"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deadline</label>
                <div className="relative group">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-accent transition-colors" size={16} />
                  <input
                    required
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none font-bold text-sm transition-all uppercase"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
              <textarea
                required
                disabled={!!task}
                rows="3"
                placeholder="task description..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none resize-none font-medium text-sm leading-relaxed transition-all"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority</label>
              <select
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none text-xs font-black uppercase transition-all"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>

            {user?.role !== 'coordinator' && (
              <div className="space-y-4 pt-4 border-t border-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Faculty</label>
                    <select
                      disabled={user?.role === 'dean'}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none text-xs font-black uppercase transition-all disabled:opacity-60"
                      value={formData.faculty}
                      onChange={e => setFormData({ ...formData, faculty: e.target.value, department: '' })}
                    >
                      <option value="">All Faculties</option>
                      {faculties.map(f => <option key={f._id} value={f.customId}>{f.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Department</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none text-xs font-black uppercase transition-all"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      disabled={!formData.faculty}
                    >
                      <option value="">All Departments</option>
                      {departments.map(d => <option key={d._id} value={d.customId}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5 h-full">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                Member Selection
                <span className="text-accent lowercase font-normal italic">({formData.assignee.length} selected)</span>
              </label>
              <div className="border border-gray-100 rounded-2xl bg-gray-50/50 p-3 max-h-[180px] overflow-y-auto space-y-2 custom-scrollbar-premium">
                {usersLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary opacity-30" size={20} /></div>
                ) : users.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 italic text-xs uppercase tracking-tight">No members found matching filters.</div>
                ) : (
                  users.map(u => (
                    <label
                      key={u._id}
                      className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${formData.assignee.includes(u.customId || u._id)
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-transparent hover:bg-white'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.assignee.includes(u.customId || u._id)}
                        onChange={() => toggleAssignee(u.customId || u._id)}
                        className="w-4 h-4 rounded-md border-gray-300 text-primary focus:ring-primary transition-all cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-700 truncate capitalize">{u.name}</p>
                        <p className="text-[9px] text-accent font-black uppercase tracking-tighter">{u.role}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {mutation.isError && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <p>{mutation.error.response?.data?.message || 'Submission failed. Please check inputs.'}</p>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-2xl border border-gray-100 text-gray-400 font-black hover:bg-gray-50 transition-all text-xs uppercase tracking-[0.2em]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || formData.assignee.length === 0}
              className="flex-[1.5] py-4 px-6 rounded-2xl bg-primary text-white font-black hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-3 uppercase tracking-[0.2em]"
            >
              {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <ListChecks size={18} />
                  {task ? 'Confirm Shift' : 'Initiate Task'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
