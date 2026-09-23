import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Inbox, 
  Send as SendIcon, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  MoreVertical,
  ChevronRight,
  Filter,
  FileText
} from 'lucide-react';
import { getInbox, getOutbox, markAsRead, deleteMemo } from '../api/memoApi';
import CreateMemoModal from '../components/CreateMemoModal';
import MemoDetail from '../components/MemoDetail';
import { toast } from 'sonner';
import useAuthStore from '../../../store/authStore';
import ActionMenu from '../../../components/ActionMenu';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { Edit3, Trash2, ExternalLink } from 'lucide-react';

export default function MemoPortal() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [memos, setMemos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMemoId, setSelectedMemoId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingMemo, setEditingMemo] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, memoId: null });
  const [confirmTriggerRect, setConfirmTriggerRect] = useState(null);
  const [createTriggerRect, setCreateTriggerRect] = useState(null);

  // Handle deep-linking from notifications
  useEffect(() => {
    const memoId = searchParams.get('id');
    if (memoId) {
      setSelectedMemoId(memoId);
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('id');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const canCreateMemo = ['director', 'dean', 'coordinator'].includes(user?.role);

  const fetchMemos = async () => {
    setIsLoading(true);
    try {
      const data = activeTab === 'inbox' ? await getInbox() : await getOutbox();
      setMemos(data);
    } catch (err) {
      toast.error('Failed to load memos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemos();
  }, [activeTab]);

  const handleMemoClick = (memo) => {
    setSelectedMemoId(memo.customId);
  };

  const filteredMemos = memos.filter(m => 
    m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.customId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteMemo = async (memoId) => {
    try {
      await deleteMemo(memoId);
      toast.success('Memo deleted successfully');
      fetchMemos();
    } catch (err) {
      toast.error('Failed to delete memo');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Official Memos</h1>
            <p className="text-sm text-gray-500 font-medium">Manage inter-office formal communications and workflows.</p>
          </div>
          {canCreateMemo && (
            <button 
              onClick={(e) => {
                setCreateTriggerRect(e.currentTarget.getBoundingClientRect());
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              New Memo
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col max-w-7xl mx-auto w-full p-8 gap-8">
        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('inbox')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'inbox' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Inbox size={16} />
              Inbox
            </button>
            <button 
              onClick={() => setActiveTab('outbox')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'outbox' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <SendIcon size={16} />
              Outbox
            </button>
          </div>

          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by subject or ID..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Memo List */}
        <div className="flex-1 overflow-y-auto bg-white rounded-3xl border border-gray-100 shadow-sm">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : filteredMemos.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {filteredMemos.map((memo) => (
                <div 
                  key={memo._id}
                  onClick={() => handleMemoClick(memo)}
                  className="group flex items-center gap-6 px-6 py-5 hover:bg-gray-50 cursor-pointer transition-all border-l-4 border-transparent hover:border-primary"
                >
                  <div className={`p-3 rounded-2xl ${
                    memo.priority === 'urgent' ? 'bg-red-50 text-red-500' :
                    memo.priority === 'normal' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-400'
                  }`}>
                    <FileText size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">{memo.customId}</span>
                      <PriorityBadge priority={memo.priority} />
                      <StatusBadge status={memo.status} />
                    </div>
                    <h3 className={`text-base font-bold truncate ${memo.status === 'dispatched' && activeTab === 'inbox' ? 'text-gray-900' : 'text-gray-600'}`}>
                      {memo.subject}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500 font-medium">
                        {activeTab === 'inbox' 
                          ? `From: ${memo.senderData?.name || 'System'} (${memo.senderOfficeData?.name || memo.senderOffice})` 
                          : `To Office: ${memo.recipientOfficeData?.name || memo.recipientOffice}`}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <Clock size={12} />
                        {new Date(memo.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <ActionMenu 
                      actions={[
                        {
                          label: 'View Details',
                          icon: <ExternalLink size={16} />,
                          onClick: () => handleMemoClick(memo)
                        },
                        ...(activeTab === 'outbox' && memo.status === 'draft' ? [{
                          label: 'Edit Draft',
                          icon: <Edit3 size={16} />,
                          onClick: () => setEditingMemo(memo)
                        }] : []),
                        ...(activeTab === 'outbox' ? [{
                          label: 'Delete Memo',
                          icon: <Trash2 size={16} />,
                          variant: 'danger',
                          onClick: (rect) => {
                            setConfirmTriggerRect(rect);
                            setConfirmState({ isOpen: true, memoId: memo.customId });
                          }
                        }] : [])
                      ]}
                    />
                    <ChevronRight className="text-gray-300" size={20} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="bg-gray-50 p-6 rounded-full mb-4">
                <Inbox size={48} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No memos found</h3>
              <p className="text-gray-500 text-sm max-w-xs mt-1">
                {searchQuery ? "Try adjusting your search criteria." : "Official communications will appear here."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {(showCreateModal || editingMemo) && (
        <CreateMemoModal 
          memo={editingMemo}
          triggerRect={createTriggerRect}
          onClose={() => {
            setShowCreateModal(false);
            setEditingMemo(null);
            setCreateTriggerRect(null);
          }} 
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingMemo(null);
            setCreateTriggerRect(null);
            fetchMemos();
          }}
        />
      )}

      <ConfirmDialog 
        isOpen={confirmState.isOpen}
        triggerRect={confirmTriggerRect}
        onClose={() => {
          setConfirmState({ isOpen: false, memoId: null });
          setConfirmTriggerRect(null);
        }}
        onConfirm={() => {
          handleDeleteMemo(confirmState.memoId);
          setConfirmState({ isOpen: false, memoId: null });
          setConfirmTriggerRect(null);
        }}
        title="Delete Memo"
        message="Are you sure you want to permanently delete this memo? This action cannot be undone."
        confirmText="Delete"
        confirmColor="danger"
      />

      {selectedMemoId && (
        <MemoDetail 
          memoId={selectedMemoId}
          onClose={() => setSelectedMemoId(null)}
          onStatusChange={fetchMemos}
        />
      )}
    </div>
  );
}

const PriorityBadge = ({ priority }) => {
  const styles = {
    urgent: 'bg-red-500 text-white shadow-sm',
    normal: 'bg-blue-500 text-white shadow-sm',
    low: 'bg-gray-200 text-gray-600'
  };
  return (
    <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${styles[priority]}`}>
      {priority}
    </span>
  );
};

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
