import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getSystemOverview, getRecentAuditLogs, getRecentAnnouncements } from '../api/getOverview';
import { 
  Users, ShieldCheck, Loader2, 
  Bell, Clock, TrendingUp, CheckCircle, AlertTriangle,
  Megaphone, ChevronRight, School
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


/* ─── Action Icon Map for Audit Logs ─────────── */
const getAuditIcon = (action) => {
  if (action?.includes('LOGIN')) return <ShieldCheck size={14} className="text-green-500" />;
  if (action?.includes('CREATE')) return <CheckCircle size={14} className="text-blue-500" />;
  if (action?.includes('DELETE')) return <AlertTriangle size={14} className="text-red-500" />;
  if (action?.includes('UPDATE')) return <TrendingUp size={14} className="text-amber-500" />;
  return <Clock size={14} className="text-gray-400" />;
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
export default function AdminOverview() {
  const navigate = useNavigate();

  // 1. System Overview Stats
  const { data: overviewData, isLoading, isError } = useQuery({
    queryKey: ['system-overview'],
    queryFn: getSystemOverview,
    refetchInterval: 60000,
    retry: 1,
  });


  // 3. Recent Audit Logs
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['recent-audit'],
    queryFn: getRecentAuditLogs,
    refetchInterval: 30000,
    retry: 1,
  });

  // 4. Recent Announcements
  const { data: announcementData, isLoading: annLoading } = useQuery({
    queryKey: ['recent-announcements'],
    queryFn: getRecentAnnouncements,
    retry: 1,
  });


  const overview = overviewData?.data || { totalUsers: 0 };
  const auditLogs = auditData?.data?.logs || [];
  const announcements = announcementData?.data?.announcements || announcementData?.data || [];

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-primary">Overview</h2>
        <p className="text-gray-500">Welcome back. Here's what's happening based on live system analytics.</p>
      </div>

      {isError && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-2">
          <AlertTriangle size={16} />
          Failed to load live analytics. The backend server might be unreachable.
        </div>
      )}

      {/* ─── Stat Cards ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Users" value={overview.totalUsers} isLoading={isLoading} icon={<Users size={24} />} colorClass="bg-blue-600" subtitle="Accounts in system" breakdown={overview.roleBreakdown} />
        <StatCard title="Active Departments" value={overview.activeDepartments || 0} isLoading={isLoading} icon={<ShieldCheck size={24} />} colorClass="bg-indigo-600" subtitle="In operation" />
        <StatCard title="Active Faculties" value={overview.activeFaculties || 0} isLoading={isLoading} icon={<School size={24} />} colorClass="bg-emerald-600" subtitle="Academic units" />
      </div>


      {/* ─── Recent Activity + Announcements ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audit Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2"><ShieldCheck size={20} className="text-indigo-500" /> Recent Activity</h3>
            <button onClick={() => navigate('/admin/audit')} className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1 transition-colors">
              View All <ChevronRight size={14} />
            </button>
          </div>

          {auditLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
          ) : (Array.isArray(auditLogs) && auditLogs.length > 0) ? (
            <div className="space-y-1">
              {auditLogs.slice(0, 7).map((log, idx) => (
                <div key={log.customId || idx} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                    {getAuditIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-medium truncate">
                      <span className="font-bold">{log.actor?.name || log.actor || 'System'}</span>
                      {' '}<span className="text-gray-400">{log.action?.replace(/_/g, ' ').toLowerCase()}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                      {log.targetType && <span className="text-gray-500 font-medium">{log.targetType}</span>}
                      {log.targetId && ` · ${log.targetId}`}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-300 font-medium shrink-0 mt-1">
                    {timeAgo(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <ShieldCheck size={40} className="text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-400">No recent activity</p>
              <p className="text-xs text-gray-300 mt-1">Audit logs will appear as users interact with the system</p>
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2"><Megaphone size={20} className="text-amber-500" /> Announcements</h3>
            <button onClick={() => navigate('/admin/announcements')} className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1 transition-colors">
              View All <ChevronRight size={14} />
            </button>
          </div>

          {annLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={32} /></div>
          ) : (Array.isArray(announcements) && announcements.length > 0) ? (
            <div className="space-y-3">
              {announcements.slice(0, 5).map((ann, idx) => (
                <div key={ann.customId || idx} className="p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-primary truncate">{ann.title}</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ann.content || ann.body || ann.message}</p>
                    </div>
                    <span className={`shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-0.5 ${
                      ann.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                      ann.priority === 'high' ? 'bg-amber-100 text-amber-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {ann.priority || 'Normal'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                    <span className="font-medium">{ann.createdBy?.name || ann.author?.name || 'Admin'}</span>
                    <span>·</span>
                    <span>{timeAgo(ann.createdAt)}</span>
                    {ann.targetAudience && (
                      <>
                        <span>·</span>
                        <span className="text-gray-500 font-medium">{ann.targetAudience}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <Bell size={40} className="text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-400">No announcements</p>
              <p className="text-xs text-gray-300 mt-1">Create an announcement from the Announcements module</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
