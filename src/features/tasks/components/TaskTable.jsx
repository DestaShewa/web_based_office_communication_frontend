import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getTasks } from '../api/getTasks';
import { updateTaskStatus, deleteTask } from '../api/taskMutations';
import TaskFormModal from './TaskFormModal';
import TaskCommentModal from './TaskCommentModal';
import { getFaculties } from '../../faculties/api/getFaculties';
import { getDepartments } from '../../departments/api/getDepartments';
import ConfirmDialog from '../../../components/ConfirmDialog';
import {
  Search, Plus, MoreVertical, Loader2, Calendar,
  User, Building2, CheckCircle, Clock, AlertCircle,
  Trash2, MessageCircle, UserPlus, Filter, FileText, Bell
} from 'lucide-react';
import * as HoverCard from '@radix-ui/react-hover-card';
import { getMyTasks, getDepartmentTasks, getAssignedByMeTasks, getMembersTasks } from '../api/getTasks';
import useAuthStore from '../../../store/authStore';
import ActionMenu from '../../../components/ActionMenu';
import { getAvatarUrl } from '../../messages/utils/statusUtils';

export default function TaskTable({ view = 'all' }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [modalTriggerRect, setModalTriggerRect] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, rect: null });

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

  const { data: facultiesData } = useQuery({
    queryKey: ['faculties'],
    queryFn: () => getFaculties({ limit: 100 }),
    enabled: user?.role === 'admin' || user?.role === 'director',
  });

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => getDepartments({ limit: 100 }),
    enabled: user?.role === 'admin' || user?.role === 'director',
  });

  const faculties = Array.isArray(facultiesData?.data?.faculties)
    ? facultiesData.data.faculties
    : Array.isArray(facultiesData?.data) ? facultiesData.data : [];

  const departments = Array.isArray(deptsData?.data?.departments)
    ? deptsData.data.departments
    : Array.isArray(deptsData?.data) ? deptsData.data : [];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tasks', view, page, limit, debouncedSearch, statusFilter, priorityFilter, roleFilter, facultyFilter, deptFilter],
    queryFn: () => {
      const params = {
        page, limit,
        search: debouncedSearch,
        status: statusFilter,
        priority: priorityFilter,
        roleType: roleFilter,
        faculty: facultyFilter,
        department: deptFilter
      };
      if (view === 'mine') return getMyTasks(params);
      if (view === 'department') return getDepartmentTasks(user?.department?._id || user?.department, params);
      if (view === 'assigned_by_me') return getAssignedByMeTasks(params);
      if (view === 'members') return getMembersTasks(params);
      return getTasks(params);
    },
  });

  const rawTasks = Array.isArray(data?.data?.tasks)
    ? data.data.tasks
    : Array.isArray(data?.data) ? data.data : [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  const tasks = rawTasks;

  const statusMutation = useMutation({
    mutationFn: updateTaskStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTask(id, user),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200 shadow-sm';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200 shadow-sm';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 shadow-sm';
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 font-black tracking-tighter';
      case 'high': return 'text-orange-600 font-black tracking-tighter';
      case 'medium': return 'text-blue-600 font-black tracking-tighter';
      default: return 'text-gray-400 font-black tracking-tighter';
    }
  };

  const StakeholderPreview = ({ assigner, assignees }) => {
    const validAssignees = (assignees || []).filter(Boolean);
    const totalCount = validAssignees.length;

    return (
      <HoverCard.Root openDelay={150} closeDelay={100}>
        <HoverCard.Trigger asChild>
          <div className="flex items-center gap-2 cursor-help group/stk w-fit">
            {/* Stacked mini avatars */}
            <div className="flex -space-x-2.5">
              {assigner && (
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border-2 border-white shadow-sm overflow-hidden ring-1 ring-primary/20">
                  {assigner.profilePhoto
                    ? <img src={getAvatarUrl(assigner.profilePhoto)} alt="" className="w-full h-full object-cover" />
                    : assigner.name?.charAt(0) || 'A'}
                </div>
              )}
              {validAssignees.slice(0, 2).map((u, i) => (
                <div key={i} className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-[10px] font-black text-accent border-2 border-white shadow-sm overflow-hidden ring-1 ring-accent/20">
                  {u.profilePhoto
                    ? <img src={getAvatarUrl(u.profilePhoto)} alt="" className="w-full h-full object-cover" />
                    : u.name?.charAt(0) || 'U'}
                </div>
              ))}
              {totalCount > 2 && (
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500 border-2 border-white shadow-sm">
                  +{totalCount - 2}
                </div>
              )}
            </div>
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter group-hover/stk:text-primary transition-colors">
              {validAssignees.length === 0 && assigner
                ? assigner.name?.split(' ')[0]
                : validAssignees.length === 1
                  ? validAssignees[0]?.name?.split(' ')[0]
                  : `${validAssignees.length} members`}
            </span>
          </div>
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Content
            className="z-[75] w-80 bg-white p-5 rounded-[2rem] shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
            sideOffset={8}
            align="start"
          >
            <div className="space-y-5">
              {/* Assigner */}
              {assigner && (
                <div className="pb-4 border-b border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Assigner</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border-2 border-white shadow-md overflow-hidden">
                      {assigner.profilePhoto
                        ? <img src={getAvatarUrl(assigner.profilePhoto)} alt="" className="w-full h-full object-cover" />
                        : assigner.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-black text-primary leading-tight">{assigner.name}</p>
                      <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-1.5">{assigner.role}</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Assignees */}
              {validAssignees.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                    Assigned to ({validAssignees.length})
                  </p>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar-premium">
                    {validAssignees.map((u, i) => (
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
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-6 bg-gray-50/20">
          <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-auto">
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search across title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent text-sm font-medium transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm group">
                <Filter size={14} className="text-gray-400 group-hover:text-accent transition-colors" />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-600 outline-none cursor-pointer"
                >
                  <option value="">Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm group">
                <AlertCircle size={14} className="text-gray-400 group-hover:text-primary transition-colors" />
                <select
                  value={priorityFilter}
                  onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-600 outline-none cursor-pointer"
                >
                  <option value="">Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {(['admin', 'coordinator', 'dean', 'director'].includes(user?.role)) && view !== 'mine' && view !== 'members' && (
            <button
              onClick={(e) => {
                setModalTriggerRect(e.currentTarget.getBoundingClientRect());
                setActiveTask(null);
                setIsFormOpen(true);
              }}
              className="whitespace-nowrap flex items-center gap-3 bg-primary text-white px-6 py-3 rounded-2xl hover:shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all text-xs font-black uppercase tracking-widest w-full lg:w-auto justify-center"
            >
              <Plus size={20} /> Assign New Task
            </button>
          )}
        </div>

        {/* Table/Card View Container */}
        <div className="min-h-[450px]">
          {/* Desktop Table View */}
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <th className="py-5 px-6 font-semibold">Task</th>
                <th className="py-5 px-6 font-semibold text-center italic">Details</th>
                <th className="py-5 px-6 font-semibold">Stakeholders</th>
                <th className="py-5 px-6 font-semibold">Timeline & Priority</th>
                <th className="py-5 px-6 font-semibold">Status</th>
                <th className="py-5 px-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="6" className="py-32 text-center opacity-40"><Loader2 className="animate-spin mx-auto text-primary" size={36} /></td></tr>
              ) : isError ? (
                <tr><td colSpan="6" className="py-32 text-center text-red-500 font-bold uppercase tracking-widest">System Error: Failed to secure task feed.</td></tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-32 text-center">
                    <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-5 duration-1000 opacity-20 filter grayscale">
                      <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-gray-100">
                        <CheckCircle size={56} className="text-gray-300" />
                      </div>
                      <h3 className="text-xl font-black text-primary mb-2 uppercase tracking-[0.1em]">No Tasks Found</h3>
                      <p className="text-xs text-gray-500 font-bold max-w-xs mx-auto italic">
                        {view === 'mine' ? "No duties currently synchronized to your profile." :
                          view === 'department' ? 'No departmental operations logged at this time.' :
                            view === 'assigned_by_me' ? "You haven't initiated any task sequences yet." :
                              view === 'members' ? 'No active member tasks detected in the scope.' :
                                'Filtered protocol returned zero matches.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const assignees = task.assigneesData || [];
                  const rawAssignees = task.assignees || [];
                  const isMultipleAssignee = rawAssignees.length > 1;

                  const completedCount = rawAssignees.filter(a => a.status === 'completed').length;
                  const totalCount = rawAssignees.length || 1;
                  const progressPercent = Math.round((completedCount / totalCount) * 100);
                  const isOverdue = task.status === 'overdue' || (new Date(task.dueDate) < new Date() && task.status !== 'completed');
                  return (
                    <tr 
                      key={task.customId || task._id} 
                      className={`transition-all border-l-4 border-transparent group ${
                        (highlightId && (String(highlightId) === String(task.customId) || String(highlightId) === String(task._id)))
                          ? 'item-highlight'
                          : 'hover:bg-gray-50/50 hover:border-primary'
                      }`}
                    >
                      <td className="py-5 px-6 max-w-[250px]">
                        <div className="min-w-0">
                          <p className="text-[13px] font-black text-primary mb-1 truncate group-hover:text-accent transition-colors">{task.title}</p>
                          <div className="flex items-center gap-1.5 opacity-50">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{task.customId}</p>
                          </div>
                          {task.memoId && (
                            <div className="flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-accent/10 text-accent rounded-md border border-accent/20 w-fit">
                              <FileText size={10} />
                              <span className="text-[8px] font-black uppercase tracking-tighter">Source: {task.memoId}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <HoverCard.Root openDelay={200} closeDelay={100}>
                          <HoverCard.Trigger asChild>
                            <span className="inline-flex items-center gap-2 cursor-help border-b border-gray-200 text-gray-400 hover:text-primary transition-all text-[11px] font-black uppercase tracking-tighter py-1">
                              <FileText size={16} />
                              Details
                            </span>
                          </HoverCard.Trigger>
                          <HoverCard.Portal>
                            <HoverCard.Content
                              className="z-[80] w-[400px] bg-white p-6 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-gray-50 animate-in fade-in zoom-in-95 backdrop-blur-3xl selection:bg-accent/20"
                              sideOffset={8}
                            >
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                                  <div className="p-3 bg-primary/5 text-primary rounded-2xl shadow-sm">
                                    <Bell size={20} />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-black text-primary truncate leading-none uppercase tracking-tight">{task.title}</h4>
                                    <p className="text-[9px] text-gray-400 font-bold mt-1.5 uppercase tracking-widest">Instruction Set</p>
                                  </div>
                                </div>
                                <div className="max-h-[350px] overflow-y-auto pr-3 custom-scrollbar-premium text-left">
                                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words font-medium antialiased">
                                    {task.description || 'No specialized instructions provided.'}
                                  </p>
                                </div>
                              </div>
                              <HoverCard.Arrow className="fill-white" />
                            </HoverCard.Content>
                          </HoverCard.Portal>
                        </HoverCard.Root>
                      </td>
                      <td className="py-5 px-6">
                        {['admin', 'director', 'dean', 'coordinator'].includes(user?.role) ? (
                          <StakeholderPreview
                            assigner={task.assignerData}
                            assignees={assignees}
                          />
                        ) : (() => {
                          const uid = (user?.customId || user?._id)?.toString();
                          const isAssigneeOfTask = view === 'mine' ||
                            rawAssignees.some(a => a.user?.toString() === uid);

                          return isAssigneeOfTask ? (
                            <StakeholderPreview
                              assigner={task.assignerData}
                              assignees={[]}
                            />
                          ) : (
                            <StakeholderPreview
                              assigner={null}
                              assignees={assignees}
                            />
                          );
                        })()}
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-2">
                          <div className={`flex items-center gap-2 text-[11px] font-black uppercase p-1.5 rounded-lg w-fit ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'bg-red-50 text-red-500 shadow-sm border border-red-100 ring-4 ring-red-500/10' : 'text-gray-500 bg-gray-50 border border-gray-100 shadow-sm'}`}>
                            <Calendar size={12} className={new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'animate-pulse' : ''} />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                          <div className={`text-[10px] uppercase font-black tracking-[0.2em] ml-1 opacity-80 ${getPriorityStyle(task.priority)}`}>
                            {task.priority || 'medium'}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        {(() => {
                          const userId = user?.customId || user?._id;
                          const myEntry = task.assignees?.find(a => a.user === userId);
                          const isAssignee = !!myEntry;

                          if (isAssignee) {
                            return (
                              <select
                                value={myEntry.status || 'pending'}
                                disabled={isOverdue}
                                title={isOverdue ? "Deadline exceeded: Status can no longer be modified." : "Update status"}
                                onChange={(e) => statusMutation.mutate({ taskId: task.customId || task._id, status: e.target.value })}
                                className={`text-[10px] font-black uppercase tracking-widest py-2 px-3 rounded-xl border outline-none cursor-pointer transition-all hover:shadow-md focus:ring-4 focus:ring-primary/10 ${getStatusStyle(myEntry.status)} ${isOverdue ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            );
                          }

                          if (isMultipleAssignee) {
                            return (
                              <div className="flex flex-col gap-2 min-w-[150px]">
                                <div className="flex justify-between items-center px-1">
                                  <span className="text-[9px] font-black text-primary uppercase tracking-widest opacity-60">Aggregate Rank</span>
                                  <span className="text-[10px] font-black text-accent">{progressPercent}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                                  <div
                                    className="h-full bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_100%] animate-[shimmer_2s_infinite_linear] transition-all duration-1000 ease-out rounded-full shadow-sm"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                                <p className="text-[9px] text-gray-400 font-bold text-right px-1 tracking-tighter">
                                  {completedCount} of {totalCount} Completed
                                </p>
                              </div>
                            );
                          }

                          const singleStatus = task.assignees?.[0]?.status || 'pending';
                          return (
                            <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${getStatusStyle(singleStatus)}`}>
                              {singleStatus.replace('_', ' ')}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-5 px-6 text-right">
                        {(() => {
                          const uid = user?.customId || user?._id?.toString?.();
                          const taskAssigner = task.assigner?.toString?.() || task.assigner;
                          const isTaskAssigner = uid && taskAssigner && (
                            taskAssigner === uid ||
                            taskAssigner === user?._id?.toString?.()
                          );
                          const canDelete = user?.role === 'admin' ||
                            user?.role === 'director' ||
                            isTaskAssigner;

                          const canReassignAction = (user?.role === 'admin' || user?.role === 'director') ||
                            (user?.role === 'coordinator' && isTaskAssigner) ||
                            (user?.role === 'dean' && task.faculty === (user?.faculty?.customId || user?.faculty));

                          return (
                            <ActionMenu
                              actions={[
                                {
                                  label: 'View Discussion',
                                  icon: <MessageCircle size={17} />,
                                  onClick: (rect) => {
                                    setModalTriggerRect(rect);
                                    setActiveTask(task);
                                    setIsCommentOpen(true);
                                  }
                                },
                                ...((['admin', 'coordinator', 'dean', 'director'].includes(user?.role)) ? [
                                  ...(canReassignAction ? [{
                                    label: 'Reassign',
                                    icon: <UserPlus size={17} />,
                                    onClick: (rect) => {
                                      setModalTriggerRect(rect);
                                      setActiveTask(task);
                                      setIsFormOpen(true);
                                    }
                                  }] : []),
                                  ...((user?.role === 'admin' || user?.role === 'director') ? [{
                                    label: 'Executive Intervention',
                                    icon: <AlertCircle size={17} />,
                                    onClick: (rect) => {
                                      setModalTriggerRect(rect);
                                      setActiveTask({ ...task, isIntervention: true });
                                      setIsFormOpen(true);
                                    }
                                  }] : []),
                                  ...(canDelete ? [{
                                    label: 'Delete Task',
                                    icon: <Trash2 size={17} />,
                                    variant: 'danger',
                                    onClick: (rect) => setConfirmState({
                                      isOpen: true,
                                      title: 'Delete Task',
                                      message: 'Are you sure you want to permanently delete this task? This action cannot be undone.',
                                      onConfirm: async () => { deleteMutation.mutate(task.customId || task._id); },
                                      confirmText: 'Delete',
                                      confirmColor: 'danger',
                                      rect
                                    })
                                  }] : [])
                                ] : [])
                              ]}
                            />
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {isLoading ? (
              <div className="py-24 text-center opacity-40"><Loader2 className="animate-spin mx-auto text-primary" size={32} /></div>
            ) : isError ? (
              <div className="py-20 text-center text-red-500 font-bold uppercase tracking-widest text-[10px]">Error loading tasks</div>
            ) : tasks.length === 0 ? (
              <div className="py-20 text-center px-6">
                <p className="text-sm font-bold text-gray-300 uppercase">No tasks found</p>
              </div>
            ) : (
              tasks.map((task) => {
                const assignees = task.assigneesData || [];
                const rawAssignees = task.assignees || [];
                const isOverdue = task.status === 'overdue' || (new Date(task.dueDate) < new Date() && task.status !== 'completed');
                
                return (
                  <div 
                    key={task.customId || task._id} 
                    className={`p-4 flex flex-col gap-3 transition-all ${
                      (highlightId && (String(highlightId) === String(task.customId) || String(highlightId) === String(task._id)))
                        ? 'item-highlight rounded-xl'
                        : isOverdue ? 'bg-red-50/30' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-primary truncate leading-tight mb-1">{task.title}</p>
                        <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-black uppercase tracking-tighter ${getPriorityStyle(task.priority)}`}>{task.priority}</span>
                           <span className="text-[10px] text-gray-400 font-mono">{task.customId}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            setModalTriggerRect(e.currentTarget.getBoundingClientRect());
                            setActiveTask(task);
                            setIsCommentOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-accent hover:bg-accent/5 rounded-full transition-all border border-gray-100"
                        >
                          <MessageCircle size={18} />
                        </button>
                        <ActionMenu
                          actions={[
                             {
                               label: 'Details',
                               icon: <FileText size={17} />,
                               onClick: () => {
                                 setActiveTask(task);
                                 // We don't have a specific Details modal, but we could use the form or comments
                                 setIsCommentOpen(true);
                               }
                             },
                             ...((['admin', 'coordinator', 'dean', 'director'].includes(user?.role)) ? [
                               {
                                 label: 'Edit/Reassign',
                                 icon: <UserPlus size={17} />,
                                 onClick: (rect) => {
                                   setModalTriggerRect(rect);
                                   setActiveTask(task);
                                   setIsFormOpen(true);
                                 }
                               },
                               {
                                 label: 'Delete Task',
                                 icon: <Trash2 size={17} />,
                                 variant: 'danger',
                                 onClick: (rect) => setConfirmState({
                                   isOpen: true,
                                   title: 'Delete Task',
                                   message: 'Permanently delete this task?',
                                   onConfirm: async () => { deleteMutation.mutate(task.customId || task._id); },
                                   confirmText: 'Delete',
                                   confirmColor: 'danger',
                                   rect
                                 })
                               }
                             ] : [])
                          ]}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                       <StakeholderPreview 
                          assigner={task.assignerData} 
                          assignees={assignees} 
                       />
                       
                       <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase p-1.5 rounded-lg border ${isOverdue ? 'bg-red-50 text-red-500 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                          <Calendar size={12} />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                       </div>
                    </div>

                    <div className="mt-1">
                      {(() => {
                        const userId = user?.customId || user?._id;
                        const myEntry = task.assignees?.find(a => a.user === userId);
                        
                        if (myEntry) {
                          return (
                            <select
                              value={myEntry.status || 'pending'}
                              disabled={isOverdue}
                              onChange={(e) => statusMutation.mutate({ taskId: task.customId || task._id, status: e.target.value })}
                              className={`w-full text-[11px] font-black uppercase tracking-widest py-2.5 px-4 rounded-xl border outline-none shadow-sm transition-all ${getStatusStyle(myEntry.status)} ${isOverdue ? 'opacity-50 grayscale' : ''}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          );
                        }

                        const singleStatus = task.assignees?.[0]?.status || 'pending';
                        return (
                          <div className={`w-full text-center py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(singleStatus)}`}>
                            {singleStatus.replace('_', ' ')}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="p-5 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50/40 gap-4">
          <p>Page {page} of {totalPages} • Total {total} Records</p>
          <div className="flex items-center gap-3">
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="px-3 py-2 border border-gray-100 rounded-xl bg-white outline-none focus:ring-2 focus:ring-accent text-[10px] font-black shadow-sm"
            >
              <option value="10">10 / PG</option>
              <option value="25">25 / PG</option>
              <option value="50">50 / PG</option>
            </select>
            <div className="flex items-center gap-2 lowercase font-normal italic">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-6 py-2 border border-gray-100 rounded-2xl bg-white hover:bg-gray-50 disabled:opacity-30 transition-all font-black uppercase tracking-widest shadow-sm"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || tasks.length === 0}
                className="px-6 py-2 border border-gray-100 rounded-2xl bg-white hover:bg-gray-50 disabled:opacity-30 transition-all font-black uppercase tracking-widest shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <TaskFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setActiveTask(null); setModalTriggerRect(null); }}
        task={activeTask}
        triggerRect={modalTriggerRect}
      />

      <TaskCommentModal
        isOpen={isCommentOpen}
        onClose={() => { setIsCommentOpen(false); setActiveTask(null); setModalTriggerRect(null); }}
        task={activeTask}
        triggerRect={modalTriggerRect}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false, rect: null }))}
        onConfirm={() => {
          if (confirmState.onConfirm) confirmState.onConfirm();
          setConfirmState(prev => ({ ...prev, isOpen: false, rect: null }));
        }}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText || 'Confirm'}
        confirmColor={confirmState.confirmColor || 'danger'}
        triggerRect={confirmState.rect}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
