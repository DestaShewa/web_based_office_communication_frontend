import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  AlertCircle, 
  FileText, 
  User, 
  Building,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  Paperclip
} from 'lucide-react';
import { getMemoDetails } from '../api/memoApi';
import TaskFormModal from '../../tasks/components/TaskFormModal';
import { toast } from 'sonner';
import useAuthStore from '../../../store/authStore';

export default function MemoDetail({ memoId, onClose, onStatusChange }) {
  const [memo, setMemo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTriggerRect, setTaskTriggerRect] = useState(null);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getMemoDetails(memoId);
        setMemo(data);
        
        // Mark as read if opened by recipient for the first time
        const officeId = (val) => (val && typeof val === 'object') ? (val.customId || val.id) : val;
        const currentOfficeId = currentUser?.role === 'director' 
          ? 'INST-01' 
          : (currentUser?.role === 'dean' 
              ? officeId(currentUser?.faculty) 
              : (currentUser?.office ? officeId(currentUser?.office) : officeId(currentUser?.department)));
        
        if (data.status === 'dispatched' && officeId(data.recipientOffice) === currentOfficeId) {
          const { markAsRead } = await import('../api/memoApi');
          await markAsRead(data.customId);
          if (onStatusChange) onStatusChange();
        }
      } catch (err) {
        toast.error('Failed to load memo details');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [memoId, currentUser]);

  if (isLoading) return null;

  const getOfficeId = (val) => {
    if (!val) return null;
    if (typeof val === 'object') return val.customId || val.id || val._id;
    return val;
  };
  
  const userOfficeId = currentUser?.role === 'director' 
    ? 'INST-01' 
    : (currentUser?.role === 'dean' 
        ? getOfficeId(currentUser?.faculty) 
        : (currentUser?.office ? getOfficeId(currentUser?.office) : getOfficeId(currentUser?.department)));
        
  const isRecipient = getOfficeId(memo.recipientOffice) === userOfficeId;
  const canConvertTask = isRecipient && ['read', 'actioned', 'dispatched'].includes(memo.status);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end bg-transparent animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-2xl h-full shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500 pointer-events-auto border-l border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-8 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-primary/5 text-primary rounded-2xl">
                <FileText size={24} />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-gray-400 tracking-widest uppercase">{memo.customId}</span>
                  <StatusBadge status={memo.status} />
                </div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight">{memo.subject}</h2>
             </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-600">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                   <User size={12} /> From
                </p>
                <p className="text-sm font-bold text-gray-800">{memo.senderData?.name || (typeof memo.sender === 'object' ? memo.sender.name : memo.sender)}</p>
                <p className="text-xs text-gray-500 font-medium">{memo.senderOfficeData?.name || (typeof memo.senderOffice === 'object' ? memo.senderOffice.name : memo.senderOffice)}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                   <Building size={12} /> To Office
                </p>
                <p className="text-sm font-bold text-gray-800">{memo.recipientOfficeData?.name || (typeof memo.recipientOffice === 'object' ? memo.recipientOffice.name : memo.recipientOffice)}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                   <Clock size={12} /> Sent Date
                </p>
                <p className="text-sm font-bold text-gray-800">{new Date(memo.createdAt).toLocaleString()}</p>
             </div>
             {memo.expectedActionDate && (
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 text-orange-500">
                     <AlertCircle size={12} /> Expected By
                  </p>
                  <p className="text-sm font-bold text-gray-800">{new Date(memo.expectedActionDate).toLocaleDateString()}</p>
               </div>
             )}
          </div>

          {/* Body */}
          <div className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 pb-2">Message</h3>
             <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100/50">
                <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {memo.body}
                </p>
             </div>
          </div>

          {/* Attachments */}
          {memo.attachments && memo.attachments.length > 0 && (
            <div className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 pb-2">Attachments</h3>
               <div className="grid grid-cols-1 gap-3">
                  {memo.attachments.map((file, idx) => {
                    const fileName = file.split('/').pop() || `Attachment-${idx + 1}`;
                    const fileUrl = `${import.meta.env.VITE_SOCKET_URL}/${file}`;
                    
                    return (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 group hover:border-primary/20 transition-all shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <div className="p-2 bg-gray-50 text-gray-400 group-hover:text-primary group-hover:bg-primary/5 rounded-xl transition-all">
                              <Paperclip size={18} />
                           </div>
                           <span className="text-xs font-bold text-gray-600 truncate">{fileName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <a 
                             href={fileUrl} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                             title="View"
                           >
                             <Eye size={16} />
                           </a>
                           <a 
                             href={fileUrl} 
                             download={fileName}
                             className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                             title="Download"
                             onClick={(e) => {
                               // For cross-origin downloads, we might need a blob fetch
                               // But since we are on the same machine/domain usually, this works
                             }}
                           >
                             <Download size={16} />
                           </a>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}
          {memo.tasks && memo.tasks.length > 0 && (
            <div className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 pb-2">Associated Tasks</h3>
                <div className="space-y-3">
                   {memo.tasks.map(taskId => (
                     <div key={taskId} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                       memo.status === 'resolved' 
                       ? 'bg-green-50 border-green-100 text-green-700' 
                       : 'bg-primary/5 border-primary/10 text-primary'
                     }`}>
                        <div className="flex items-center gap-3">
                           <CheckCircle2 size={18} className={memo.status === 'resolved' ? 'text-green-500' : 'text-primary'} />
                           <span className="text-xs font-black uppercase tracking-widest">{taskId}</span>
                        </div>
                        <ChevronRight size={16} className={memo.status === 'resolved' ? 'text-green-500/40' : 'text-primary/40'} />
                     </div>
                   ))}
                </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-gray-50 border-t border-gray-100">
          {canConvertTask ? (
            <button 
              onClick={(e) => {
                setTaskTriggerRect(e.currentTarget.getBoundingClientRect());
                setShowTaskModal(true);
              }}
              className="w-full flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
            >
              <ClipboardList size={18} />
              Convert to Task
            </button>
          ) : (
            <div className="text-center p-4 bg-white/50 rounded-2xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {memo.status === 'resolved' ? 'This memo has been resolved.' : 'Viewing only mode.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showTaskModal && (
        <TaskFormModal 
          isOpen={showTaskModal} 
          triggerRect={taskTriggerRect}
          onClose={() => {
            setShowTaskModal(false);
            setTaskTriggerRect(null);
          }}
          memoData={{
            memoId: memo.customId,
            title: memo.subject,
            description: memo.body,
            priority: memo.priority === 'urgent' ? 'urgent' : (memo.priority === 'normal' ? 'medium' : 'low')
          }}
        />
      )}
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const styles = {
    dispatched: 'bg-blue-50 text-blue-600 border border-blue-100',
    read: 'bg-purple-50 text-purple-600 border border-purple-100',
    actioned: 'bg-amber-50 text-amber-600 border border-amber-100',
    resolved: 'bg-green-50 text-green-600 border border-green-100',
    draft: 'bg-gray-50 text-gray-600 border border-gray-100'
  };
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${styles[status]}`}>
      {status}
    </span>
  );
};
