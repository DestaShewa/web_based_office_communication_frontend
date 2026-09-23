import { useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import { initSocket, disconnectSocket } from '../lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { getUnreadCount } from '../features/messages/api/getMessages';

export default function SocketManager() {
  const { token, user } = useAuthStore();
  const { 
    addMessage, 
    updateUserStatus, 
    setOnlineUsers, 
    setTyping,
    updateConversationLastMessage,
    updateUserProfile,
    setGlobalUnreadCount,
  } = useChatStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const socket = initSocket(token);

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      // Seed the globalUnreadCount from the server on every (re)connect
      getUnreadCount()
        .then(res => setGlobalUnreadCount(res?.data?.count || 0))
        .catch(() => {}); // silent — Zustand will still be updated by socket events
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socket.on('presence_update', (data) => {
      updateUserStatus(data.userId, data.status);
    });
    
    socket.on('initial_presence', (onlineUserIds) => {
      setOnlineUsers(onlineUserIds);
    });

    // Messages received from other users
    socket.on('new_message', (message) => {
      // For department messages, the entire room gets the broadcast including sender.
      // We allow them through — addMessage deduplication prevents double-rendering.
      // For direct messages, skip our own (message_sent handles those).
      const isOwnMessage = message.sender?.customId === user?.customId || message.sender === user?.customId;
      if (isOwnMessage && message.type !== 'department') return;

      addMessage(message);
      updateConversationLastMessage(message, user?.customId);
      // globalUnreadCount is updated inside updateConversationLastMessage ↑
      
      // Optional: Browser notification if window not focused
      if (document.hidden) {
        new Notification('New Message', {
           body: `${message.sender?.name || 'Someone'}: ${message.messageType === 'text' ? message.content : 'Voice Message'}`
        });
      }
    });

    // Messages sent by the current user (confirmation from server)
    socket.on('message_sent', (message) => {
      addMessage(message);
      updateConversationLastMessage(message, user?.customId);
    });

    // Socket-level errors from backend
    socket.on('error', (data) => {
      console.error('[SOCKET] Server error:', data.message);
    });

    socket.on('user_activity', (data) => {
      setTyping(data.userId, true, { 
        type: data.type, 
        receiver: data.receiver,
        activity: data.activity 
      });
    });

    socket.on('user_activity_stop', (data) => {
      setTyping(data.userId, false);
    });

    // Handle message status updates (e.g., delivered, read)
    socket.on('status_updated', (data) => {
      useChatStore.getState().updateMessageStatus(data.messageId, data.status);
    });

    // Handle user mood status updates
    socket.on('user_mood_updated', (data) => {
      useChatStore.getState().setUserMoodStatus(data.userId, data.status);
    });

    // Handle bulk read notifications (sender learns their messages were read)
    socket.on('messages_read', (data) => {
      useChatStore.getState().markAllAsRead(data.readerId);
      // globalUnreadCount is updated inside markAllAsRead ↑
    });

    // Handle message edits
    socket.on('message_updated', (updatedMessage) => {
      useChatStore.getState().updateMessage(
        updatedMessage.customId || updatedMessage._id, 
        updatedMessage
      );
    });

    // Handle message deletions
    socket.on('message_deleted', (data) => {
      useChatStore.getState().handleMessageDeleted(
        data.messageId, 
        data.deletedForEveryone,
        data.userId
      );
    });
    
    // Handle profile updates (name, photo, etc.)
    socket.on('profile_updated', (data) => {
      // 1. Update the chat store for immediate UI sync in conversations
      updateUserProfile(data.userId, data.updates);
      
      // 2. Invalidate directory/search queries to ensure they stay fresh
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // 3. Optional: if it's the current user, we might want to update auth store too
      // but usually the user knows they updated their profile.
    });

    // Handle real-time notifications and announcements
    socket.on('new_notification', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('notification_count_update', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
    });

    socket.on('new_announcement', () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
    });
    
    socket.on('announcement_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
    });

    // Cleanup on unmount or token change
    return () => {
      disconnectSocket();
    };
  }, [token]);

  return null; // This component doesn't render anything
}
