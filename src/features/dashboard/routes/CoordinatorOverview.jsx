import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';
import { getTaskAnalytics, getRecentAnnouncements } from '../api/getOverview';
import { getDepartmentMeetings } from '../../meetings/api/getMeetings';
import { 
  BarChart3, Loader2, ArrowRight, ChevronRight, 
  Calendar, Megaphone, Bell
} from 'lucide-react';

/* ─── Task Progress Ring ─────────────────────── */
const ProgressRing = ({ percentage, label, color }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle 
          cx="44" cy="44" r={radius} fill="none" 
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center w-[88px] h-[88px]">
        <span className="text-lg font-bold text-primary">{percentage}%</span>
      </div>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{label}</p>
    </div>
  );
};

const timeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function CoordinatorOverview() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const deptId = user?.department?._id || user?.department;

  // 1. Task Analytics (scoped to department automatically by backend)
  const { data: taskData, isLoading: taskLoading } = useQuery({
    queryKey: ['dept-task-analytics'],
    queryFn: getTaskAnalytics,
    refetchInterval: 120000,
  });

  // 2. Recent Announcements
  const { data: announcementData, isLoading: annLoading } = useQuery({
    queryKey: ['recent-announcements-coord'],
    queryFn: getRecentAnnouncements,
  });

  // 3. Upcoming Department Meetings
  const { data: meetingData, isLoading: mtgLoading } = useQuery({
    queryKey: ['dept-meetings', deptId],
    queryFn: () => getDepartmentMeetings(deptId, { limit: 5 }),
    enabled: !!deptId,
  });

  const taskStats = taskData?.data || { pending: 0, in_progress: 0, completed: 0, overdue: 0, total: 0, completionRate: '0%' };
  const announcements = announcementData?.data?.announcements || announcementData?.data || [];
  const meetings = meetingData?.data?.meetings || [];

  const completionPct = parseInt(taskStats.completionRate) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">{user?.office ? 'Office' : 'Department'} Oversight</h2>
        <p className="text-gray-500">Live analytics and tracking metrics for your {user?.office ? 'office' : 'department'}'s active operations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2"><BarChart3 size={20} className="text-orange-500" /> Task Analytics</h3>
          </div>
          
          {taskLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
          ) : (
            <div className="space-y-5">
              <div className="flex justify-center relative">
                <ProgressRing percentage={completionPct} label="Completion" color="#22c55e" />
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{taskStats.pending}</p>
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Pending</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{taskStats.in_progress}</p>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">In Progress</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
                  <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Completed</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Overdue</p>
                </div>
              </div>

              <button onClick={() => navigate('/coordinator/tasks')} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-primary bg-gray-50 hover:bg-gray-100 py-2.5 rounded-lg transition-colors mt-2">
                Manage Tasks <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          
          {/* Office/Department Meetings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2"><Calendar size={20} className="text-green-500" /> Scheduled Meetings</h3>
              <button onClick={() => navigate('/coordinator/meetings')} className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1 transition-colors">
                Manage Calendar <ChevronRight size={14} />
              </button>
            </div>

            {mtgLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
            ) : meetings.length > 0 ? (
              <div className="space-y-3">
                {meetings.slice(0, 3).map((mtg) => (
                  <div key={mtg._id || mtg.customId} className="flex items-start gap-4 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-green-50 flex flex-col items-center justify-center text-green-600 font-bold shrink-0">
                      <span className="text-xs uppercase">{new Date(mtg.date).toLocaleDateString('en', { month: 'short' })}</span>
                      <span className="text-lg leading-none">{new Date(mtg.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-bold text-primary truncate">{mtg.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {mtg.time ? (() => {
                          const [h, m] = mtg.time.split(':');
                          const hrs = parseInt(h);
                          const ampm = hrs >= 12 ? 'PM' : 'AM';
                          const h12 = hrs % 12 || 12;
                          return `${h12}:${m} ${ampm}`;
                        })() : 'TBD'}
                        {mtg.location && ` • ${mtg.location}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                 <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                 <p className="text-sm font-medium">No upcoming {user?.office ? 'office' : 'department'} meetings</p>
              </div>
            )}
          </div>

          {/* Announcements Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2"><Megaphone size={20} className="text-amber-500" /> Latest Announcements</h3>
              <button onClick={() => navigate('/coordinator/announcements')} className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1 transition-colors">
                View All <ChevronRight size={14} />
              </button>
            </div>

            {annLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
            ) : (Array.isArray(announcements) && announcements.length > 0) ? (
              <div className="space-y-4">
                {announcements.slice(0, 3).map((ann, idx) => (
                  <div key={ann.customId || idx} className="p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50 hover:border-gray-200 group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-primary group-hover:text-accent transition-colors truncate">{ann.title}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{ann.content}</p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg mt-0.5 shadow-sm ${
                        ann.priority === 'urgent' ? 'bg-red-50 text-red-600 border border-red-100' :
                        ann.priority === 'high' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {ann.priority || 'Routine'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase">
                           {(ann.createdByData?.name || ann.createdBy?.name || 'S').charAt(0)}
                        </div>
                        <span>{ann.createdByData?.name || ann.createdBy?.name || 'System'}</span>
                      </div>
                      <span>·</span>
                      <span>{timeAgo(ann.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <Bell size={40} className="text-gray-200 mb-3" />
                <p className="text-sm font-bold text-gray-400">Quiet Channels</p>
                <p className="text-xs text-gray-300 mt-1 uppercase tracking-widest font-medium">No recent broadcasts.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
