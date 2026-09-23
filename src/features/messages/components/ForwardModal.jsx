import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Send, X, Users, User, Check, Loader2 } from 'lucide-react';
import useChatStore from '../../../store/chatStore';
import apiClient from '../../../lib/axios';
import { toast } from 'sonner';
import { getAvatarUrl } from '../utils/statusUtils';

export default function ForwardModal({ messageIds, onClose }) {
  const { conversations, onlineUsers, userStatuses } = useChatStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReceivers, setSelectedReceivers] = useState(new Set());
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' or 'directory'

  useEffect(() => {
    const fetchDirectory = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/users?limit=100&purpose=messaging');
        if (response.data?.data?.users) {
          setDirectoryUsers(response.data.data.users);
        }
      } catch (err) {
        console.error('Failed to fetch directory:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDirectory();
  }, []);

  const recentPartners = conversations.map(c => c.partner).filter(p => !!p);
  
  const filteredItems = (activeTab === 'recent' ? recentPartners : directoryUsers).filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleReceiver = (id) => {
    const newSelected = new Set(selectedReceivers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedReceivers(newSelected);
  };

  const handleForward = async () => {
    if (selectedReceivers.size === 0) return;
    setIsSending(true);
    try {
      await apiClient.post('/messages/forward', {
        messageIds,
        receiverIds: Array.from(selectedReceivers)
      });
      toast.success(`Successfully forwarded to ${selectedReceivers.size} recipient(s)`);
      onClose();
    } catch (err) {
      console.error('Forward failed:', err);
      toast.error('Failed to forward messages. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-[360px] md:max-w-[400px] rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[75vh] md:h-[65vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header container */}
        <div className="shrink-0 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] relative z-10">
          <div className="flex items-center px-5 pt-5 pb-2">
            <h2 className="text-base sm:text-[17px] font-black text-primary flex-1 px-1 uppercase tracking-tight">Forward</h2>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-red-50 rounded-full transition-colors text-gray-300 hover:text-red-500"
            >
              <X size={18} className="sm:size-[20px]" />
            </button>
          </div>

          <div className="px-5 pb-3">
            <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all gap-2">
              <Search className="text-gray-400 shrink-0" size={16} />
              <input 
                type="text" 
                placeholder="Search recipient..."
                className="w-full bg-transparent border-none outline-none py-1 text-[13px] font-bold text-primary placeholder:text-gray-400 placeholder:font-normal"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-2 overflow-x-auto hide-scrollbar">
            {['Recent', 'Directory'].map((tab) => {
              const tabKey = tab.toLowerCase();
              const isActive = activeTab === tabKey;
              return (
                <button 
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`px-4 py-2.5 text-[14px] font-medium whitespace-nowrap relative transition-colors ${
                    isActive ? 'text-accent' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[3px] bg-accent rounded-t-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* List Section */}
        <div className="flex-1 overflow-y-auto w-full custom-scrollbar bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 className="animate-spin text-accent" size={28} />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 select-none">
               <p className="text-[15px] text-gray-500 font-medium">No results found</p>
            </div>
          ) : (
            <div className="py-2">
              {filteredItems.map((item) => {
                const isSelected = selectedReceivers.has(item.customId);
                const isOnline = onlineUsers.includes(item.customId);

                return (
                  <div 
                    key={item.customId}
                    onClick={() => toggleReceiver(item.customId)}
                    className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors w-full group select-none"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white overflow-hidden text-sm bg-gradient-to-br from-primary/80 to-primary">
                        {item.profilePhoto ? (
                          <img src={getAvatarUrl(item.profilePhoto)} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          item.name?.charAt(0)
                        )}
                      </div>
                      
                      {/* Selection Checkmark Overlay */}
                      {isSelected ? (
                        <div className="absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] bg-accent text-white rounded-full flex items-center justify-center border-[2.5px] border-white z-10 animate-in zoom-in">
                          <Check size={12} strokeWidth={3.5} />
                        </div>
                      ) : (
                         isOnline && (
                           <div className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] bg-green-500 rounded-full border-[2.5px] border-white z-10"></div>
                         )
                      )}
                    </div>

                    {/* Text block */}
                    <div className="flex-1 min-w-0 pr-2 pb-0.5">
                      <p className="text-[13px] sm:text-[14px] font-black text-primary truncate leading-snug">{item.name}</p>
                      <p className="text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        {item.role === 'admin' ? 'Administrator' : item.role === 'staff' ? 'Staff' : item.role}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Action/Footer */}
        {selectedReceivers.size > 0 && (
          <div className="shrink-0 p-4 bg-white border-t border-gray-100 animate-in slide-in-from-bottom-2 duration-300">
            <button 
              onClick={handleForward}
              disabled={isSending}
              className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-full font-semibold transition-all active:scale-[0.98] shadow-md disabled:opacity-70 flex items-center justify-center gap-2 text-[15px]"
            >
              {isSending ? (
                <>
                  <Loader2 className="animate-spin text-white" size={20} />
                  <span>Forwarding...</span>
                </>
              ) : (
                <>
                  <span>Forward to {selectedReceivers.size} user{selectedReceivers.size > 1 ? 's' : ''}</span>
                  <Send size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
