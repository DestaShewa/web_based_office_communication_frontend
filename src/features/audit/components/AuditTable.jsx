import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/getAuditLogs';
import { Search, Filter, ShieldAlert, Loader2, Calendar } from 'lucide-react';

export default function AuditTable() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Basic & Advanced Filters
  const [search, setSearch] = useState('');
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-logs', page, limit, debouncedSearch, actor, action, targetType, fromDate, toDate],
    queryFn: () => getAuditLogs({ 
      page, limit, search: debouncedSearch, actor, action, targetType, from: fromDate, to: toDate 
    }),
  });

  const logs = data?.data?.logs || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  // Formatting helpers
  const formatAction = (act) => {
    if (typeof act !== 'string') return 'UNKNOWN_ACTION';
    return act.replace(/_/g, ' ');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search IPs, actions, or exact target IDs..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`whitespace-nowrap flex items-center gap-2 border px-4 py-2 rounded-md transition-colors text-sm font-medium w-full sm:w-auto justify-center ${showFilters ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <Filter size={18} />
          {showFilters ? 'Hide Filters' : 'Advanced Filters'}
        </button>
      </div>

      {/* Expandable Filters Section */}
      {showFilters && (
        <div className="p-5 bg-gray-50/50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 shadow-inner">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Actor (Custom ID)</label>
            <input type="text" placeholder="e.g. HR-MGR-001" value={actor} onChange={(e) => {setActor(e.target.value); setPage(1);}} className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Action Type</label>
            <select value={action} onChange={(e) => {setAction(e.target.value); setPage(1);}} className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white text-sm outline-none focus:border-accent">
              <option value="">All Actions</option>
              <optgroup label="Auth">
                <option value="USER_LOGGED_IN">Login (Success)</option>
                <option value="FAILED_LOGIN_ATTEMPT">Login (Failed)</option>
                <option value="USER_LOGGED_OUT">Logout</option>
                <option value="PASSWORD_CHANGED">Password Changed</option>
                <option value="PASSWORD_RESET_BY_ADMIN">Password Reset (Admin)</option>
                <option value="UNAUTHORIZED_ACCESS_ATTEMPT">Unauthorized Access</option>
              </optgroup>
              <optgroup label="Users">
                <option value="USER_CREATED">User Created</option>
                <option value="USER_UPDATED">User Updated</option>
                <option value="USER_ROLE_UPDATED">Role Updated</option>
                <option value="USER_DEACTIVATED">User Deactivated</option>
                <option value="USER_ACTIVATED">User Activated</option>
                <option value="USER_DELETED">User Deleted</option>
              </optgroup>
              <optgroup label="Tasks">
                <option value="TASK_CREATED">Task Created</option>
                <option value="TASK_STATUS_UPDATED">Task Status Updated</option>
                <option value="TASK_REASSIGNED">Task Reassigned</option>
                <option value="TASK_DELETED">Task Deleted</option>
              </optgroup>
              <optgroup label="Departments">
                <option value="DEPARTMENT_CREATED">Dept Created</option>
                <option value="DEPARTMENT_UPDATED">Dept Updated</option>
                <option value="DEPARTMENT_DELETED">Dept Deleted</option>
              </optgroup>
              <optgroup label="Meetings">
                <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
                <option value="MEETING_CANCELLED">Meeting Cancelled</option>
              </optgroup>
              <optgroup label="System">
                <option value="SYSTEM_CONFIG_UPDATED">Config Updated</option>
                <option value="ANNOUNCEMENT_CREATED">Announcement Created</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Target Model Type</label>
            <select value={targetType} onChange={(e) => {setTargetType(e.target.value); setPage(1);}} className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white text-sm outline-none focus:border-accent">
              <option value="">All Models</option>
              <option value="User">User</option>
              <option value="Department">Department</option>
              <option value="Task">Task</option>
              <option value="SystemConfig">SystemConfig</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"><Calendar size={12}/> From Date</label>
            <input type="date" value={fromDate} onChange={(e) => {setFromDate(e.target.value); setPage(1);}} className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-accent" />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"><Calendar size={12}/> To Date</label>
            <input type="date" value={toDate} onChange={(e) => {setToDate(e.target.value); setPage(1);}} className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-accent" />
          </div>
        </div>
      )}

      {/* Table/Card View Container */}
      <div className="min-h-[400px]">
        {/* Desktop Table View */}
        <table className="w-full text-left border-collapse hidden md:table">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action Timestamp</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit Action Flag</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actor / Invoker</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Model Target</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Client IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan="5" className="py-12 text-center text-primary"><Loader2 size={32} className="animate-spin mx-auto"/></td></tr>
            ) : isError ? (
              <tr><td colSpan="5" className="py-8 text-center text-red-500">Failed to load system audit logs.</td></tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-20 text-center text-gray-500">
                   <div className="flex flex-col items-center justify-center opacity-40">
                      <ShieldAlert size={48} className="mb-2" />
                      <p className="text-sm font-medium">No audit events found matching the given filters.</p>
                   </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="text-sm font-semibold text-primary">{new Date(log.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(log.createdAt).toLocaleTimeString()}</p>
                  </td>
                  <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase border ${
                        log.action?.includes('FAILED') || log.action?.includes('DELETED') ? 'border-red-200 text-red-700 bg-red-50' :
                        log.action?.includes('CREATED') ? 'border-green-200 text-green-700 bg-green-50' : 
                        log.action?.includes('UPDATED') ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-gray-200 text-gray-700 bg-gray-50'
                      }`}>
                        {formatAction(log.actionType || log.action || 'UNKNOWN')}
                      </span>
                  </td>
                   <td className="py-4 px-6">
                     {(() => {
                        const actorObj = (log.actorData && typeof log.actorData === 'object') ? log.actorData : 
                                         (log.actor && typeof log.actor === 'object') ? log.actor : null;
                        
                        if (actorObj) {
                          return (
                            <div className="truncate">
                              <p className="text-sm font-bold text-primary truncate leading-none">{String(actorObj.name || 'System')}</p>
                              <p className="text-[10px] text-gray-400 font-mono mt-1">{String(actorObj.customId || '---')}</p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="truncate">
                            <p className="text-sm font-bold text-gray-500 italic truncate leading-none">System / Auto</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-1">{typeof log.actor === 'string' ? log.actor : '---'}</p>
                          </div>
                        );
                     })()}
                   </td>
                   <td className="py-4 px-6">
                      <p className="text-sm font-bold text-gray-700">{String(log.targetType || 'Global')}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-[150px]" title={String(log.targetId || '')}>{String(log.targetId || 'N/A')}</p>
                   </td>
                   <td className="py-4 px-6 text-sm text-gray-500 text-right font-mono">
                      {String(log.ipAddress || '---')}
                   </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {isLoading ? (
            <div className="py-12 text-center text-primary"><Loader2 size={32} className="animate-spin mx-auto"/></div>
          ) : isError ? (
            <div className="py-8 text-center text-red-500">Error loading audit logs.</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No audit events found.</div>
          ) : (
            logs.map((log) => {
              const actorObj = (log.actorData && typeof log.actorData === 'object') ? log.actorData : 
                               (log.actor && typeof log.actor === 'object') ? log.actor : null;
              return (
                <div key={log._id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black text-primary uppercase tracking-tighter">{new Date(log.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{new Date(log.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border h-fit shrink-0 ${
                      log.action?.includes('FAILED') || log.action?.includes('DELETED') ? 'border-red-200 text-red-700 bg-red-50' :
                      log.action?.includes('CREATED') ? 'border-green-200 text-green-700 bg-green-50' : 
                      log.action?.includes('UPDATED') ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-gray-200 text-gray-700 bg-gray-50'
                    }`}>
                      {formatAction(log.actionType || log.action || 'UNKNOWN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-1">
                    <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Actor</span>
                       {actorObj ? (
                         <div className="truncate">
                           <p className="text-xs font-bold text-primary truncate leading-tight">{actorObj.name || 'System'}</p>
                           <p className="text-[10px] text-gray-400 font-mono mt-0.5">{actorObj.customId || '---'}</p>
                         </div>
                       ) : (
                         <p className="text-xs font-bold text-gray-500 italic">System / Auto</p>
                       )}
                    </div>
                    <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Target</span>
                       <p className="text-xs font-bold text-gray-700 truncate">{log.targetType || 'Global'}</p>
                       <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{log.targetId || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-50 mt-1">
                     <span className="text-[10px] text-gray-400 font-mono">IP: {log.ipAddress || '---'}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
      
      {/* Pagination Footer */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-gray-50/30">
        <p>Showing page {page} of {totalPages} ({total} audit events)</p>
        <div className="flex items-center gap-2 font-medium">
            <select value={limit} onChange={(e) => {setLimit(Number(e.target.value)); setPage(1);}} className="border border-gray-200 rounded px-2 py-1 bg-white outline-none">
              <option value="10">10 / pg</option>
              <option value="25">25 / pg</option>
              <option value="50">50 / pg</option>
              <option value="100">100 / pg</option>
            </select>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded hover:bg-white disabled:opacity-50 transition-colors"
            >
              Prev
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page >= totalPages || logs.length === 0}
              className="px-3 py-1.5 border border-gray-200 rounded hover:bg-white disabled:opacity-50 transition-colors"
            >
              Next
            </button>
        </div>
      </div>
    </div>
  );
}
