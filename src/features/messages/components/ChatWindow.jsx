import React, { useEffect, useRef } from 'react';
import apiClient from '../../../lib/axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChatHistory } from '../api/getMessages';
import { getDepartmentMembers } from '../../departments/api/departmentApi';
import { markAsRead } from '../api/messageMutations';
import useAuthStore from '../../../store/authStore';
import useChatStore from '../../../store/chatStore';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { User, Users, ShieldCheck, Clock, Loader2, ChevronDown, ChevronLeft, Trash2, AlertCircle } from 'lucide-react';
import SelectionToolbar from './SelectionToolbar';
import ForwardModal from './ForwardModal';
import ProfileModal from './ProfileModal';
import DepartmentInfoModal from './DepartmentInfoModal';
import GroupInfoModal from './GroupInfoModal';
import DeleteMessageModal from './DeleteMessageModal';
import { getDisplayStatus, getStatusColor, getAvatarUrl } from '../utils/statusUtils';

export default function ChatWindow() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const { 
    activeConversation, 
    messages, 
    setMessages, 
    onlineUsers, 
    typingUsers,
    isSelectionMode,
    handleMessageDeleted,
    updateMessage,
    userStatuses
  } = useChatStore();
  
  const [forwardData, setForwardData] = React.useState(null);
  const [deleteData, setDeleteData] = React.useState(null);
  const [showProfileInfo, setShowProfileInfo] = React.useState(false);
  const [profileTriggerRect, setProfileTriggerRect] = React.useState(null);
  const [departmentMembers, setDepartmentMembers] = React.useState([]);
  const [groupMembers, setGroupMembers] = React.useState([]);
  
  const scrollRef = useRef(null);
  const lastScrollTop = useRef(0);
  const isAtBottom = useRef(true);

  // Listen for custom events from ActionMenu
  useEffect(() => {
    const openForward = (e) => setForwardData(e.detail);
    const openDelete = (e) => {
      let rect = e.detail.triggerRect;
      if (e.detail.message) {
        const msgId = e.detail.message.customId || e.detail.message._id;
        const msgEl = document.getElementById(`bubble-${msgId}`);
        if (msgEl) rect = msgEl.getBoundingClientRect();
      }
      setDeleteData({ 
        message: e.detail.message, 
        bulk: false, 
        triggerRect: rect ? { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height } : null 
      });
    };
    const openDeleteBulk = (e) => {
      const rect = e.detail.triggerRect;
      setDeleteData({ 
        messages: e.detail.ids, 
        bulk: true, 
        triggerRect: rect ? { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height } : null 
      });
    };

    window.addEventListener('open-forward-modal', openForward);
    window.addEventListener('open-delete-confirm', openDelete);
    window.addEventListener('open-delete-confirm-bulk', openDeleteBulk);

    return () => {
      window.removeEventListener('open-forward-modal', openForward);
      window.removeEventListener('open-delete-confirm', openDelete);
      window.removeEventListener('open-delete-confirm-bulk', openDeleteBulk);
    };
  }, []);

  const handleDeleteConfirm = async (forEveryone) => {
    try {
      if (deleteData.bulk) {
        for (const msgId of deleteData.messages) {
          await apiClient.delete(`/messages/${msgId}?forEveryone=${forEveryone}`);
          handleMessageDeleted(msgId, forEveryone);
        }
      } else {
        const msgId = deleteData.message.customId || deleteData.message._id;
        await apiClient.delete(`/messages/${msgId}?forEveryone=${forEveryone}`);
        handleMessageDeleted(msgId, forEveryone);
      }
      setDeleteData(null);
      if (isSelectionMode) useChatStore.getState().clearSelection();

      // Sync across tabs & and for recipient if everyone
      const socket = require('../../../lib/socket').getSocket();
      if (socket) {
        socket.emit('delete_message_sync', {
          messageId: deleteData.bulk ? null : (deleteData.message.customId || deleteData.message._id),
          messageIds: deleteData.bulk ? deleteData.messages : null,
          deletedForEveryone,
          receiverId: activeConversation.customId,
          type: activeConversation.type || 'direct'
        });
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Smart Scroll Management
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAtBottom.current = isNearBottom;
    lastScrollTop.current = scrollTop;
  };

  // Fetch history when active conversation changes
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['v1', 'chatHistory', activeConversation?.customId, activeConversation?.type],
    queryFn: () => {
      if (activeConversation.type === 'department') {
        return apiClient.get(`/messages/department/${activeConversation.customId}`).then(res => res.data);
      }
      if (activeConversation.type === 'group') {
        return apiClient.get(`/messages/group/${activeConversation.customId}`).then(res => res.data);
      }
      return getChatHistory(activeConversation.customId);
    },
    enabled: !!activeConversation,
    staleTime: 5000,
    retry: false,
  });

  // 1. Sync fetched messages locally
  useEffect(() => {
    if (historyData?.data?.messages) {
      const visibleMessages = historyData.data.messages.filter(m => 
        !m.deletedBy?.includes(currentUser?.customId)
      );
      setMessages(visibleMessages);
    }
  }, [historyData, setMessages, currentUser?.customId]);

  // 2. Instantaneous Unread Badge Clearing on Chat Open
  useEffect(() => {
    if (activeConversation?.customId) {
      // Optimistically clear in Zustand — badge updates instantly on every page
      useChatStore.getState().markAllAsRead(activeConversation.customId);
      
      // Keep the conversations list in sync for the sidebar preview
      queryClient.invalidateQueries({ queryKey: ['v1', 'conversations'] });

      // Persist to backend without blocking
      markAsRead(activeConversation.customId).catch(e => console.error('Silent read sync error', e));
    }
  }, [activeConversation?.customId, queryClient]);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current && isAtBottom.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch department/group members for accurate online count globally
  useEffect(() => {
    let mounted = true;
    if (activeConversation?.type === 'department') {
      getDepartmentMembers(activeConversation.customId).then(data => {
        if (mounted) setDepartmentMembers(data.members || []);
      }).catch(err => console.error('Failed to load dept members', err));
    } else if (activeConversation?.type === 'group') {
      apiClient.get(`/messages/group/${activeConversation.customId}`).then(res => {
        if (mounted && res.data?.data?.group) {
          setGroupMembers(res.data.data.group.membersData || []);
        }
      }).catch(err => console.error('Failed to load group members', err));
    }
    return () => { mounted = false; };
  }, [activeConversation?.customId, activeConversation?.type]);

  if (!activeConversation) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-4 text-gray-400 bg-gray-50/30 select-none">
        <div className="p-8 rounded-full bg-white shadow-xl shadow-gray-200/50 mb-6 group transition-all hover:scale-105 duration-500">
           <User size={80} className="text-gray-200 group-hover:text-primary/10 transition-colors" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Your Conversations</h2>
        <p className="text-sm font-medium text-gray-400 max-w-xs text-center border-t border-gray-100 pt-4">Select a team member or broadcast channel to start communicating.</p>
      </div>
    );
  }

  const isPartnerOnline = onlineUsers.includes(activeConversation.customId);

  // For department chats: find any user currently typing in this dept room
  const deptTypingEntry = activeConversation.type === 'department'
    ? Object.entries(typingUsers).find(([, ctx]) => ctx?.type === 'department')
    : null;
  const isTyping = activeConversation.type === 'department'
    ? deptTypingEntry ? { ...deptTypingEntry[1], userId: deptTypingEntry[0] } : null
    : typingUsers[activeConversation.customId];

  // For department/group chats: count online members
  const departmentOnlineCount = activeConversation?.type === 'department'
    ? departmentMembers.filter(m => onlineUsers.includes(m.customId)).length
    : activeConversation?.type === 'group'
      ? groupMembers.filter(m => onlineUsers.includes(m.customId)).length
      : 0;

  return (
    <div className={`flex-1 flex flex-col h-full bg-white relative z-10 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
      {/* Header / Selection Toolbar */}
      {isSelectionMode ? (
        <SelectionToolbar />
      ) : (
        <header className="h-16 md:h-20 border-b border-gray-100 flex items-center justify-between px-2 md:px-6 bg-white shrink-0 z-20 shadow-sm shadow-gray-100/50">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1 pr-1">
              <button 
                onClick={() => useChatStore.getState().setActiveConversation(null)} 
                className="md:hidden p-2 -ml-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="relative shrink-0">
                {/* Department/Group group: show group icon; DM: show avatar */}
                {activeConversation.type === 'department' || activeConversation.type === 'group' ? (
                  <button
                    onClick={(e) => {
                      setProfileTriggerRect(e.currentTarget.getBoundingClientRect());
                      setShowProfileInfo(true);
                    }}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-all cursor-pointer ${
                      activeConversation.type === 'group' ? 'bg-primary/20 text-primary overflow-hidden' : 'bg-gradient-to-br from-accent/20 to-primary/20 text-accent hover:scale-105 active:scale-95'
                    }`}
                  >
                    {activeConversation.profilePhoto ? <img src={getAvatarUrl(activeConversation.profilePhoto)} alt="" className="w-full h-full object-cover" /> : <Users size={24} />}
                  </button>
                ) : (
                  <button 
                    onClick={(e) => {
                      setProfileTriggerRect(e.currentTarget.getBoundingClientRect());
                      setShowProfileInfo(true);
                    }}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary font-black text-sm md:text-base border-2 border-white shadow-sm overflow-hidden transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    {activeConversation.profilePhoto ? (
                      <img src={getAvatarUrl(activeConversation.profilePhoto)} alt="" className="w-full h-full object-cover" />
                    ) : activeConversation.avatar ? (
                      <img src={activeConversation.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      activeConversation.name?.charAt(0)
                    )}
                  </button>
                )}
                {isPartnerOnline && activeConversation.type !== 'department' && (
                  <span className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(userStatuses[activeConversation.customId] || activeConversation.status, true, 'bg')} border-2 border-white rounded-full pointer-events-none z-20 shadow-sm`}></span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-primary truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">{activeConversation.name}</h3>
                  {activeConversation.role === 'admin' && <ShieldCheck size={14} className="text-accent shrink-0" />}
                  {(activeConversation.type === 'department' || activeConversation.type === 'group') && (
                    <span className="bg-accent/10 text-accent text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase shrink-0">Group</span>
                  )}
                </div>
                <div className="h-5 flex items-center">
                  {isTyping ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        <span className="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1 h-1 bg-accent rounded-full animate-bounce"></span>
                      </div>
                      <p className="text-[11px] text-accent font-black tracking-tight italic">
                        {(activeConversation.type === 'department' || activeConversation.type === 'group') && isTyping.userId
                          ? `someone is ${
                              isTyping.activity === 'recording' ? 'recording...' :
                              isTyping.activity === 'uploading' ? 'uploading...' :
                              'typing...'
                            }`
                          : isTyping.activity === 'recording' ? 'is recording voice...' : 
                            isTyping.activity === 'uploading' ? 'is sending a file...' : 
                            'is typing...'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 truncate">
                      {activeConversation.type === 'department' || activeConversation.type === 'group' ? (
                        <>
                          <span className="text-[11px] font-bold text-accent uppercase tracking-widest">
                            {activeConversation.type === 'department' ? 'Department Group' : 'Staff Group'}
                          </span>
                          {departmentOnlineCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-green-500">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              {departmentOnlineCount} online
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="flex items-center gap-1 shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(userStatuses[activeConversation.customId] || activeConversation.status, isPartnerOnline, 'bg')}`}></span> 
                          <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-tight ${getStatusColor(userStatuses[activeConversation.customId] || activeConversation.status, isPartnerOnline, 'text')} ${isPartnerOnline ? 'bg-gray-100' : 'bg-gray-50 opacity-60'}`}>
                            {getDisplayStatus(userStatuses[activeConversation.customId] || activeConversation.status, isPartnerOnline)}
                          </span>
                        </span>
                      )}
                      <span className="opacity-30 shrink-0 text-gray-300">•</span>
                      <span className="truncate text-gray-400">{activeConversation.type === 'department' ? 'Dept' : activeConversation.role}</span>
                    </p>
                  )}
                </div>
              </div>
          </div>
        </header>
      )}

      {/* Message List */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-2 scroll-smooth"
        style={{
          backgroundColor: 'var(--color-background)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%2394a3b8' fill-opacity='0.1'%3E%3Cpolygon fill-rule='evenodd' points='8 4 12 6 8 8 6 12 4 8 0 6 4 4 6 0 8 4'/%3E%3C/g%3E%3C/svg%3E")`
        }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
             <Loader2 size={32} className="text-accent animate-spin" />
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Encrypting Chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
             <Loader2 size={40} className="mb-4 text-gray-200" />
             <p className="text-sm font-bold uppercase tracking-widest text-gray-400">No messages yet</p>
          </div>
        ) : (
          messages.filter(msg => !msg.isDeletedForEveryone).map((msg, idx, filteredMessages) => {
            const isGroup = activeConversation.type === 'department' || activeConversation.type === 'group';
            const isMe = msg.sender?.customId === currentUser?.customId || msg.sender === currentUser?.customId;
            const prevMsg = filteredMessages[idx - 1];
            const prevSenderId = prevMsg?.sender?.customId || prevMsg?.sender;
            const currSenderId = msg.sender?.customId || msg.sender;
            // Group consecutive messages from same sender
            const isSameSenderAsPrev = prevMsg && prevSenderId === currSenderId;
            // Only show avatars in group chats
            const showAvatar = isGroup;
            const showName = isGroup ? !isSameSenderAsPrev : (!isMe && !isSameSenderAsPrev);
            // Add top margin when switching senders
            const hasNewSenderBlock = !isSameSenderAsPrev;

            return (
              <div key={msg._id || msg.customId || idx} className={hasNewSenderBlock && idx > 0 ? 'mt-3' : ''}>
                <MessageBubble 
                  message={msg} 
                  isMe={isMe}
                  user={currentUser}
                  isDepartment={isGroup}
                  showAvatar={showAvatar}
                  showName={showName}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Chat Input */}
      <ChatInput />

      {/* Overlays */}
      {forwardData && (
        <ForwardModal 
          messageIds={forwardData} 
          onClose={() => setForwardData(null)} 
        />
      )}

      {deleteData && (
        <DeleteMessageModal 
          deleteData={deleteData}
          currentUser={currentUser}
          onClose={() => setDeleteData(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Profile/Group Modal */}
      {showProfileInfo && (
        activeConversation.type === 'department' ? (
          <DepartmentInfoModal 
            department={activeConversation} 
            triggerRect={profileTriggerRect}
            onClose={() => {
              setShowProfileInfo(false);
              setProfileTriggerRect(null);
            }} 
          />
        ) : activeConversation.type === 'group' ? (
          <GroupInfoModal 
            group={activeConversation} 
            triggerRect={profileTriggerRect}
            onClose={() => {
              setShowProfileInfo(false);
              setProfileTriggerRect(null);
            }} 
          />
        ) : (
          <ProfileModal 
            user={activeConversation} 
            triggerRect={profileTriggerRect}
            onClose={() => {
              setShowProfileInfo(false);
              setProfileTriggerRect(null);
            }} 
          />
        )
      )}
    </div>
  );
}
