import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getMyTasks } from '../../tasks/api/getTasks';
import { getMyMeetings } from '../../meetings/api/getMeetings';
import { getRecentAnnouncements } from '../api/getOverview';
import { 
  ListChecks, Calendar, Megaphone, Loader2, ArrowRight,
  ChevronRight, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';

const timeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function StaffOverview() {
  const navigate = useNavigate();

  const { data: myTasksData, isLoading: taskLoading } = useQuery({
    queryKey: ['my-tasks-overview'],
    queryFn: () => getMyTasks({ limit: 5, status: 'pending' }),
  });

  const { data: myMeetingsData, isLoading: mtgLoading } = useQuery({
    queryKey: ['my-meetings-overview'],
    queryFn: () => getMyMeetings({ limit: 5 }),
  });

  const { data: annData, isLoading: annLoading } = useQuery({
    queryKey: ['recent-announcements'],
    queryFn: getRecentAnnouncements,
  });

  const tasks = myTasksData?.data?.tasks || [];
  const meetings = myMeetingsData?.data?.meetings || [];
  const announcements = annData?.data?.announcements || annData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Staff Dashboard</h2>
        <p className="text-gray-500">Welcome to your personal portal. An overview of your active workflow.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Tasks Widget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2"><ListChecks size={20} className="text-orange-500" /> Pending Tasks</h3>
            <button onClick={() => navigate('/staff/tasks')} className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1 transition-colors">
              View All <ChevronRight size={14} />
            </button>
          </div>

          {taskLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
          ) : tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task._id} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3 border border-gray-100">
                  <Clock size={16} className={new Date(task.dueDate) < new Date() ? 'text-red-500 mt-0.5' : 'text-blue-500 mt-0.5'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary truncate">{task.title}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                     task.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                     task.priority === 'high' ? 'bg-amber-100 text-amber-600' :
                     'bg-gray-200 text-gray-600'
                  }`}>
                    {task.priority || 'Normal'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-8 text-gray-400">
               <CheckCircle size={32} className="mx-auto mb-2 text-green-200" />
               <p className="text-sm font-medium">You have no pending tasks!</p>
             </div>
          )}
        </div>

        {/* Upcoming Meetings Widget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2"><Calendar size={20} className="text-green-500" /> My Schedule</h3>
            <button onClick={() => navigate('/staff/meetings')} className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1 transition-colors">
              View All <ChevronRight size={14} />
            </button>
          </div>

          {mtgLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
          ) : meetings.length > 0 ? (
            <div className="space-y-3">
              {meetings.slice(0, 5).map((mtg) => (
                <div key={mtg._id} className="flex items-start gap-4 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
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
            <div className="text-center py-8 text-gray-400">
               <Calendar size={32} className="mx-auto mb-2 opacity-30" />
               <p className="text-sm font-medium">No upcoming meetings</p>
            </div>
          )}
        </div>

      </div>

      {/* Announcements Full-Width */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2"><Megaphone size={20} className="text-amber-500" /> Recent Announcements</h3>
          <button onClick={() => navigate('/staff/announcements')} className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1 transition-colors">
            View All <ChevronRight size={14} />
          </button>
        </div>

        {annLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
        ) : announcements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.slice(0, 3).map((ann) => (
              <div key={ann._id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-primary line-clamp-2">{ann.title}</p>
                    <span className={`shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      ann.priority === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {ann.priority || 'Normal'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-3 mb-4">{ann.content || ann.body || ann.message}</p>
                </div>
                <div className="text-[10px] text-gray-400 font-medium">
                  Posted {timeAgo(ann.createdAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
             <Megaphone size={32} className="mx-auto mb-2 opacity-30" />
             <p className="text-sm font-medium">No recent announcements</p>
          </div>
        )}
      </div>

    </div>
  );
}
