import { create } from 'zustand';

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  onlineUsers: [], // Array of userIds
  userStatuses: {}, // Map of user customId -> mood string (Available, Busy, etc.)
  typingUsers: {}, // userId -> { type, receiver }
  globalUnreadCount: 0, // Single source of truth for the sidebar badge
  
  isSelectionMode: false,
  selectedMessages: new Set(),
  editingMessage: null,
  replyingTo: null, // message object

  setConversations: (conversations) => {
    // Synchronize statuses from conversations into the real-time status store
    const userStatuses = { ...get().userStatuses };
    conversations.forEach(conv => {
      if (conv.partner?.customId && conv.partner.status) {
        userStatuses[conv.partner.customId] = conv.partner.status;
      }
    });
    // Recompute globalUnreadCount from fresh server data
    const globalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    set({ conversations, userStatuses, globalUnreadCount });
  },

  // Directly set global unread count (used on initial load)
  setGlobalUnreadCount: (count) => set({ globalUnreadCount: count }),
  
  setActiveConversation: (partner) => set({ 
    activeConversation: partner,
    isSelectionMode: false,
    selectedMessages: new Set(),
    editingMessage: null,
    replyingTo: null,
  }),

  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => {
    // Check if message already exists (deduplication)
    const existingIndex = state.messages.findIndex(m => 
      (m.customId && m.customId === message.customId) || 
      (m._id && m._id === message._id)
    );

    if (existingIndex !== -1) {
      // If server version arrives, replace the optimistic one to get real IDs/timestamps
      const newMessages = [...state.messages];
      newMessages[existingIndex] = { ...newMessages[existingIndex], ...message, status: 'sent' };
      return { messages: newMessages };
    }

    // Only add message to current view if it belongs to active conversation
    const conv = state.activeConversation;
    if (!conv) return state;

    let isActive = false;

    if (conv.type === 'department' || message.type === 'department') {
      // For department messages: receiver in DB is MongoDB _id, but conv.customId is the dept customId.
      // We trust that if the message type is 'department' and the active conv is dept type with
      // the same customId as what was sent originally, the message belongs here.
      // The sender's optimistic update already has conv.customId; for incoming messages from others
      // we match by checking conv.type and the message.type.
      isActive = conv.type === 'department' && message.type === 'department';
    } else {
      isActive = (
        message.sender?.customId === conv.customId || 
        message.sender === conv.customId ||
        message.receiver?.customId === conv.customId ||
        message.receiver === conv.customId
      );
    }
       
    if (isActive) {
      return { messages: [...state.messages, { ...message, status: message.status || 'sent' }] };
    }
    return state;
  }),

  updateMessage: (tempId, updatedData) => set((state) => ({
    messages: state.messages.map(m => 
      (m.customId === tempId || m._id === tempId) ? { ...m, ...updatedData } : m
    )
  })),

  deleteMessageLocal: (messageId) => set((state) => ({
    messages: state.messages.filter(m => m.customId !== messageId && m._id !== messageId)
  })),

  handleMessageDeleted: (messageId, deletedForEveryone, userId) => set((state) => {
    // 1. Update the active messages view
    let newMessages = state.messages;
    if (deletedForEveryone) {
      newMessages = state.messages.map(m => 
        (m.customId === messageId || m._id === messageId) 
          ? { ...m, isDeletedForEveryone: true, content: '' } 
          : m
      );
    } else {
      newMessages = state.messages.filter(m => m.customId !== messageId && m._id !== messageId);
    }

    // 2. Update the sidebar conversations list if the deleted message is the last message
    const newConversations = state.conversations.map(conv => {
      const isLastMsgMatch = conv.lastMessage?.customId === messageId || 
                             conv.lastMessage?._id === messageId;
                             
      if (isLastMsgMatch) {
        if (deletedForEveryone) {
          return { 
            ...conv, 
            lastMessage: { ...conv.lastMessage, isDeletedForEveryone: true, content: '' } 
          };
        } else {
          // If personal delete, clear the last message preview
          return { ...conv, lastMessage: null };
        }
      }
      return conv;
    });

    return { 
      messages: newMessages, 
      conversations: newConversations 
    };
  }),

  // Selection Actions
  setSelectionMode: (active) => set({ 
    isSelectionMode: active, 
    selectedMessages: new Set(),
    editingMessage: null 
  }),

  toggleSelection: (messageId) => set((state) => {
    const newSelected = new Set(state.selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    return { 
      selectedMessages: newSelected,
      isSelectionMode: newSelected.size > 0 
    };
  }),

  clearSelection: () => set({ isSelectionMode: false, selectedMessages: new Set() }),

  // Editing Actions
  setEditingMessage: (message) => set({ 
    editingMessage: message,
    isSelectionMode: false,
    selectedMessages: new Set()
  }),

  finishEditing: () => set({ editingMessage: null }),

  // Reply Actions
  setReplyingTo: (message) => set({ 
    replyingTo: message,
    editingMessage: null,
    isSelectionMode: false,
    selectedMessages: new Set()
  }),

  cancelReply: () => set({ replyingTo: null }),

  updateMessageStatus: (messageId, status) => set((state) => ({
    messages: state.messages.map(m => 
      (m._id === messageId || m.customId === messageId) ? { ...m, status } : m
    )
  })),

  markAllAsRead: (partnerId) => set((state) => {
    // Find how many unread messages we are clearing for this partner
    const clearedCount = state.conversations.find(
      conv => conv.partner.customId === partnerId
    )?.unreadCount || 0;

    const newGlobal = Math.max(0, state.globalUnreadCount - clearedCount);

    return {
      messages: state.messages.map(m => 
        (m.sender?.customId === partnerId || m.sender === partnerId) ? { ...m, isRead: true, status: 'read' } : m
      ),
      conversations: state.conversations.map(conv => 
        conv.partner.customId === partnerId ? { ...conv, unreadCount: 0 } : conv
      ),
      globalUnreadCount: newGlobal,
    };
  }),

  setOnlineUsers: (users) => set({ onlineUsers: users }),
  
  updateUserStatus: (userId, status) => set((state) => {
    const isOnline = status === 'online';
    const newOnlineUsers = isOnline 
      ? [...new Set([...state.onlineUsers, userId])]
      : state.onlineUsers.filter(id => id !== userId);
    return { onlineUsers: newOnlineUsers };
  }),

  setUserMoodStatus: (userId, moodStatus) => set((state) => {
    // 1. Update the flat mapping for instant cross-component reactivity
    const newUserStatuses = { ...state.userStatuses, [userId]: moodStatus };
    
    // 2. Also update the partner status in the conversations list for deep consistency
    const newConversations = state.conversations.map(conv => {
      if (conv.partner?.customId === userId) {
        return { ...conv, partner: { ...conv.partner, status: moodStatus } };
      }
      return conv;
    });

    // 3. Update active conversation if it's the current user being updated
    let newActive = state.activeConversation;
    if (state.activeConversation?.customId === userId) {
      newActive = { ...state.activeConversation, status: moodStatus };
    }

    return { 
      userStatuses: newUserStatuses, 
      conversations: newConversations,
      activeConversation: newActive
    };
  }),
  
  updateUserProfile: (userId, profileData) => set((state) => {
    // 1. Update the partner info in the conversations list
    const newConversations = state.conversations.map(conv => {
      if (conv.partner?.customId === userId) {
        return { 
          ...conv, 
          partner: { ...conv.partner, ...profileData } 
        };
      }
      return conv;
    });

    // 2. Update active conversation if it matches the updated user
    let newActive = state.activeConversation;
    if (state.activeConversation?.customId === userId) {
      newActive = { ...state.activeConversation, ...profileData };
    }

    return { 
      conversations: newConversations,
      activeConversation: newActive
    };
  }),

  setTyping: (userId, isTyping, context) => set((state) => {
    const newTyping = { ...state.typingUsers };
    if (isTyping) {
      newTyping[userId] = context;
    } else {
      delete newTyping[userId];
    }
    return { typingUsers: newTyping };
  }),

  updateConversationLastMessage: (message, currentUserId) => set((state) => {
    let didIncrement = false;

    // Extract IDs once — used both in the map and in the fallback below
    const senderId = message.sender?.customId || message.sender;
    const receiverId = message.receiver?.customId || message.receiver;
    const isMeSender = senderId === currentUserId;

    const updatedConversations = state.conversations.map(conv => {
      const isPartner = conv.partner.customId === senderId || 
                        conv.partner.customId === receiverId;
                        
      if (isPartner) {
        const isActiveContext = state.activeConversation?.customId === conv.partner.customId;
        
        let newUnreadCount = conv.unreadCount || 0;
        
        if (!isMeSender && !isActiveContext) {
          newUnreadCount += 1;
          didIncrement = true;
        }

        return {
          ...conv,
          lastMessage: message,
          unreadCount: newUnreadCount
        };
      }
      return conv;
    });

    // CRITICAL FALLBACK: if conversations list was empty or the partner was not found
    // (user is on Dashboard and has never opened the chat page this session),
    // still increment the global badge as long as we're not the sender.
    if (!isMeSender && !didIncrement) {
      const isActiveContext = state.activeConversation?.customId === senderId;
      if (!isActiveContext) {
        didIncrement = true;
      }
    }

    return { 
      conversations: updatedConversations,
      globalUnreadCount: didIncrement ? state.globalUnreadCount + 1 : state.globalUnreadCount,
    };
  })
}));

export default useChatStore;
