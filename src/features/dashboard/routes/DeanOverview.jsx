import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getSystemOverview, getTaskAnalytics, getRecentAnnouncements, getUpcomingMeetings } from '../api/getOverview';
import { 
  Users, ListChecks, Calendar, Loader2, 
  Bell, CheckCircle, AlertTriangle, ArrowRight, Megaphone, ChevronRight, BarChart3
} from 'lucide-react';

/* ─── Stat Card ──────────────────────────────── */
const StatCard = ({ title, value, icon, colorClass, isLoading, subtitle, breakdown }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-md group">
    <div className="flex items-center gap-4">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white ${colorClass} shadow-lg shadow-${colorClass}/20 group-hover:scale-110 transition-transform shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.15em]">{title}</p>
        <h3 className="text-3xl font-bold text-primary mt-0.5">
          {isLoading ? <Loader2 size={24} className="animate-spin text-gray-300 mt-1" /> : value}
        </h3>
        {subtitle && <p className="text-[10px] text-gray-400 mt-0.5 font-medium truncate">{subtitle}</p>}
      </div>
    </div>

    {breakdown && !isLoading && Object.keys(breakdown).length > 0 && (
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-4 border-t border-gray-50">
        {Object.entries(breakdown).map(([role, count]) => (
          <div key={role} className="flex items-center justify-between group/role">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover/role:text-primary transition-colors">
              {role.replace('_', ' ')}
            </span>
            <span className="text-[11px] font-black text-primary px-2 py-0.5 bg-gray-50 rounded-md group-hover/role:bg-gray-100 transition-all">
              {count}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

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
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

/* ─── Main Component ─────────────────────────── */
export default function DeanOverview() {
  const navigate = useNavigate();

  // 1. System Overview Stats
  const { data: overviewData, isLoading, isError } = useQuery({
    queryKey: ['faculty-overview'],
    queryFn: getSystemOverview,
    refetchInterval: 60000,
    retry: 1,
  });

  // 2. Task Analytics (breakdown by status)
  const { data: taskData, isLoading: taskLoading } = useQuery({
    queryKey: ['task-analytics-faculty'],
    queryFn: getTaskAnalytics,
    refetchInterval: 120000,
    retry: 1,
  });

  // 3. Recent Announcements
  const { data: announcementData, isLoading: annLoading } = useQuery({
    queryKey: ['recent-announcements-faculty'],
    queryFn: getRecentAnnouncements,
    retry: 1,
  });

  // 4. Upcoming Meetings
  const { data: meetingData, isLoading: mtgLoading } = useQuery({
    queryKey: ['upcoming-meetings-faculty'],
    queryFn: getUpcomingMeetings,
    retry: 1,
  });

  const overview = overviewData?.data || { totalUsers: 0, activeTasks: 0, upcomingMeetings: 0 };
  const taskStats = taskData?.data || { pending: 0, in_progress: 0, completed: 0, overdue: 0, total: 0, completionRate: '0%' };
  const announcements = announcementData?.data?.announcements || announcementData?.data || [];
  const meetings = meetingData?.data?.meetings || meetingData?.data || [];

  const completionPct = parseInt(taskStats.completionRate) || 0;

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-primary">Dean Dashboard</h2>
        <p className="text-gray-500">Faculty-level oversight and performance analytics.</p>
      </div>

      {isError && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-2">
          <AlertTriangle size={16} />
          Failed to load live analytics. The backend server might be unreachable.
        </div>
      )}

      {/* ─── Stat Cards ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Faculty Personnel" value={overview.totalUsers} isLoading={isLoading} icon={<Users size={24} />} colorClass="bg-blue-600" subtitle="Total staff in faculty" breakdown={overview.roleBreakdown} />
        <StatCard title="Active Tasks" value={overview.activeTasks} isLoading={isLoading} icon={<ListChecks size={24} />} colorClass="bg-orange-500" subtitle={`${taskStats.overdue} overdue items`} />
        <StatCard title="Faculty Meetings" value={overview.upcomingMeetings} isLoading={isLoading} icon={<Calendar size={24} />} colorClass="bg-green-600" subtitle="Scheduled this week" />
      </div>

      {/* ─── Task Analytics + Upcoming Meetings ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2"><BarChart3 size={20} className="text-orange-500" /> Task Progress</h3>
          </div>
          
          {taskLoading ? (
            <div className="flex-1 flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
          ) : (
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              <div>
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
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Active</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
                    <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Done</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Overdue</p>
                  </div>
                </div>
              </div>

              <button onClick={() => navigate('/dean/tasks')} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-primary bg-gray-50 hover:bg-gray-100 py-2.5 rounded-lg transition-colors mt-2">
                Manage Tasks <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2"><Calendar size={20} className="text-green-500" /> Faculty Agenda</h3>
            <button onClick={() => navigate('/dean/meetings')} className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1 transition-colors">
              View Calendar <ChevronRight size={14} />
            </button>
          </div>

          {mtgLoading ? (
            <div className="flex-1 flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
          ) : (Array.isArray(meetings) && meetings.length > 0) ? (
            <div className="space-y-3">
              {meetings.slice(0, 5).map((mtg, idx) => (
                <div key={mtg.customId || idx} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-12 h-12 rounded-lg bg-green-50 flex flex-col items-center justify-center text-green-600 font-bold shrink-0">
                    <span className="text-xs uppercase">{new Date(mtg.date).toLocaleDateString('en', { month: 'short' })}</span>
                    <span className="text-lg leading-none">{new Date(mtg.date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-bold text-primary truncate group-hover:text-accent transition-colors">{mtg.title || mtg.agenda}</p>
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        mtg.status === 'scheduled' ? 'bg-blue-100 text-blue-600' :
                        mtg.status === 'in_progress' ? 'bg-amber-100 text-amber-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>{mtg.status || 'scheduled'}</span>
                      {mtg.participants && <span className="text-[10px] text-gray-400">{mtg.participants.length} delegates</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-300">
              <Calendar size={40} className="text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-400">No meetings scheduled</p>
              <p className="text-xs text-gray-300 mt-1">Check back later for faculty gatherings.</p>
            </div>
          )}
        </div>
      </div>


      {/* ─── Communication ────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2"><Megaphone size={20} className="text-amber-500" /> Faculty Announcements</h3>
            <button onClick={() => navigate('/dean/announcements')} className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1 transition-colors">
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
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{ann.content || ann.body || ann.message}</p>
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
                         {ann.createdBy?.name?.charAt(0) || ann.author?.name?.charAt(0) || 'F'}
                      </div>
                      <span>{ann.createdBy?.name || ann.author?.name || 'Faculty Office'}</span>
                    </div>
                    <span>·</span>
                    <span>{timeAgo(ann.createdAt)}</span>
                    {ann.targetAudience && (
                      <>
                        <span>·</span>
                        <span className="text-secondary font-bold uppercase tracking-wider">{ann.targetAudience}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <Bell size={40} className="text-gray-200 mb-3" />
              <p className="text-sm font-bold text-gray-400">Quiet Channels</p>
              <p className="text-xs text-gray-300 mt-1 uppercase tracking-widest font-medium">No recent faculty broadcasts.</p>
            </div>
          )}
        </div>
      </div>
  );
}

