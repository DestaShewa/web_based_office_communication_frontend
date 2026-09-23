import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Mic, X, Loader2, Square, Check } from 'lucide-react';
import { getSocket } from '../../../lib/socket';
import useChatStore from '../../../store/chatStore';
import { sendVoiceMessage } from '../api/messageMutations';
import WaveformVisualizer from './WaveformVisualizer';
import { toast } from 'sonner';
import apiClient from '../../../lib/axios';
import useAuthStore from '../../../store/authStore';
import ReplyPreview from './ReplyPreview';
import MentionDropdown from './MentionDropdown';
import { IS_SECURE_CONTEXT } from '../../../lib/config';

export default function ChatInput() {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingStream, setRecordingStream] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  
  const { user: currentUser } = useAuthStore();
  const { 
    activeConversation, 
    addMessage, 
    updateMessage,
    editingMessage,
    finishEditing,
    updateConversationLastMessage,
    replyingTo,
    cancelReply
  } = useChatStore();
  const socket = getSocket();
  const [activity, setActivity] = useState(null); // 'typing', 'recording', 'uploading'
  const [mentionState, setMentionState] = useState({ active: false, query: '', startIndex: -1 });
  const [mentionPosition, setMentionPosition] = useState({ bottom: '100%', left: 0 });

  // Pre-fill input when editing
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || '');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } else {
      setText('');
    }
  }, [editingMessage]);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 160);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [text]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/(?:^|\s)@([\w]*)$/);

    if (match) {
      const leftEstimate = Math.min(cursorPos * 8, 200);
      setMentionPosition({ bottom: '100%', left: `${leftEstimate}px` });
      setMentionState({
        active: true,
        query: match[1],
        startIndex: match.index + (match[0].startsWith(' ') ? 1 : 0)
      });
    } else {
      setMentionState({ active: false, query: '', startIndex: -1 });
    }
  };

  const handleMentionSelect = (username) => {
    if (!username) return;
    const before = text.slice(0, mentionState.startIndex);
    const after = text.slice(textareaRef.current.selectionStart || text.length);
    
    setText(`${before}@${username} ${after}`);
    setMentionState({ active: false, query: '', startIndex: -1 });
    
    if (textareaRef.current) {
        textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (mentionState.active) {
      if (['Enter', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) {
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
        }
        return; 
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
    if (e.key === 'Escape' && editingMessage) {
      finishEditing();
    }
  };

  const emitActivity = (type) => {
    if (!socket || !activeConversation) return;
    setActivity(type);
    socket.emit('typing_start', { 
      receiver: activeConversation.customId,
      type: activeConversation.type || 'direct',
      activity: type
    });
  };

  const stopActivity = () => {
    if (!socket || !activeConversation) return;
    setActivity(null);
    socket.emit('typing_stop', { 
      receiver: activeConversation.customId,
      type: activeConversation.type || 'direct'
    });
  };

  // Activity Indicator (Typing)
  useEffect(() => {
    if (!text.trim() || isRecording || isUploading || editingMessage || !socket || !activeConversation) return;

    emitActivity('typing');

    const timeout = setTimeout(() => {
      stopActivity();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [text, socket, activeConversation, editingMessage]);

  const getReplyPayload = () => {
    if (!replyingTo) return null;
    let contentPreview = replyingTo.content || 'Message';
    if (replyingTo.messageType === 'image') contentPreview = 'Photo';
    if (replyingTo.messageType === 'audio') contentPreview = 'Voice Message';
    if (replyingTo.messageType === 'file') contentPreview = replyingTo.fileInfo?.name || 'File';

    return {
      messageId: replyingTo.customId || replyingTo._id,
      senderName: replyingTo.sender?.name || 'User',
      contentPreview: contentPreview
    };
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || !activeConversation) return;

    const content = text.trim();

    if (editingMessage) {
      const originalId = editingMessage.customId || editingMessage._id;
      try {
        await apiClient.patch(`/messages/${originalId}`, { content });
        updateMessage(originalId, { content, isEdited: true });
        finishEditing();
        setText('');
      } catch (err) {
        console.error('Edit failed:', err);
        toast.error('Failed to update message');
      }
      return;
    }

    const customId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Optimistic UI Update
    const replyPayload = getReplyPayload();
    const optimisticMessage = {
      customId,
      content,
      sender: {
        customId: currentUser.customId,
        name: currentUser.name
      },
      receiver: activeConversation,
      messageType: 'text',
      status: 'sending',
      createdAt: new Date().toISOString(),
      replyTo: replyPayload
    };

    addMessage(optimisticMessage);
    setText('');
    
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Text messages go through Socket.io in this architecture
    socket.emit('send_message', {
      customId,
      receiver: activeConversation.customId,
      content,
      type: activeConversation.type || 'direct',
      replyTo: replyPayload
    });

    stopActivity();
    if (replyingTo) cancelReply();
  };

  const startRecording = async () => {
    if (!IS_SECURE_CONTEXT) {
      toast.error('Voice recording requires a secure context (HTTPS or localhost). Please use a secure connection.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingStream(stream);
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const customId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const localUrl = URL.createObjectURL(audioBlob);

        const replyPayload = getReplyPayload();
        const optimisticMessage = {
          customId,
          sender: currentUser,
          receiver: activeConversation.customId,
          messageType: 'audio',
          type: activeConversation.type || 'direct',
          fileUrl: localUrl,
          duration: recordingTime,
          status: 'sending',
          createdAt: new Date().toISOString(),
          replyTo: replyPayload
        };
        addMessage(optimisticMessage);
        updateConversationLastMessage(optimisticMessage, currentUser?.customId);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        formData.append('receiver', activeConversation.customId);
        formData.append('type', activeConversation.type || 'direct');
        formData.append('duration', recordingTime);
        formData.append('customId', customId);
        if (replyPayload) formData.append('replyTo', JSON.stringify(replyPayload));

        try {
          const response = await sendVoiceMessage(formData);
          // sendVoiceMessage returns response.data (the axios data layer)
          // sendResponse wraps as { status, message, data: { message: {...} } }
          const serverMessage = response?.data?.message;
          if (serverMessage) {
            updateMessage(customId, serverMessage);
            updateConversationLastMessage(serverMessage, currentUser?.customId);
          }
        } catch (error) {
          console.error('Voice send error:', error);
          updateMessage(customId, { status: 'error' });
          toast.error('Failed to send voice message');
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      emitActivity('recording');
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Recording Error:', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Microphone permission denied.');
      } else {
        toast.error('Could not access microphone. Ensure you are using a secure connection (HTTPS).');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      stopActivity();
      if (replyingTo) cancelReply();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    emitActivity('uploading');

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (>10MB)`);
        continue;
      }

      const customId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const localUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

      const replyPayload = getReplyPayload();
      const optimisticMessage = {
        customId,
        sender: currentUser,
        receiver: activeConversation.customId,
        messageType: file.type.startsWith('image/') ? 'image' : 'file',
        type: activeConversation.type || 'direct',
        fileUrl: localUrl,
        fileInfo: { name: file.name, size: file.size, mimeType: file.type },
        status: 'sending',
        createdAt: new Date().toISOString(),
        replyTo: replyPayload
      };
      addMessage(optimisticMessage);
      updateConversationLastMessage(optimisticMessage, currentUser?.customId);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('receiver', activeConversation.customId);
      formData.append('type', activeConversation.type || 'direct');
      formData.append('customId', customId);
      if (replyPayload) formData.append('replyTo', JSON.stringify(replyPayload));

      try {
        const response = await apiClient.post('/messages/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        // apiClient returns { data: { status, message, data: { message: {...} } } }
        const serverMessage = response.data?.data?.message;
        if (serverMessage) {
          updateMessage(customId, serverMessage);
          updateConversationLastMessage(serverMessage, currentUser?.customId);
        }
      } catch (error) {
        console.error('Upload error:', error.response?.data || error.message);
        updateMessage(customId, { status: 'error' });
        toast.error(error.response?.data?.message || 'Failed to upload file');
      }
    }
    setIsUploading(false);
    stopActivity();
    if (replyingTo) cancelReply();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <div className="p-3 md:p-4 border-t border-gray-100 bg-red-50/20 backdrop-blur-md flex items-center justify-between transition-all animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-4 flex-1 min-w-0">
           <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
           <span className="text-sm font-black text-red-600 font-mono tabular-nums">{formatTime(recordingTime)}</span>
           <div className="flex-1 max-w-sm h-8">
             <WaveformVisualizer streamOrAudio={recordingStream} isRecording={true} color="#ef4444" />
           </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
           <button 
             onClick={() => {
                if (mediaRecorderRef.current) mediaRecorderRef.current.onstop = null;
                stopRecording();
                setIsRecording(false);
                setRecordingTime(0);
                setRecordingStream(null);
                if (timerRef.current) clearInterval(timerRef.current);
             }}
             className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-95"
           >
             <X size={22} />
           </button>
           <button 
             onClick={stopRecording}
             className="bg-red-500 text-white p-3 rounded-full shadow-lg shadow-red-500/30 active:scale-95 transition-all hover:bg-red-600 animate-in zoom-in"
           >
             <Square size={20} fill="currentColor" />
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 bg-white/80 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 shrink-0 relative z-30 transition-all duration-300">
      <ReplyPreview replyingTo={replyingTo} onCancel={cancelReply} />

      {editingMessage && (
        <div className="absolute top-0 left-0 right-0 -translate-y-full bg-accent text-white px-6 py-2.5 flex items-center justify-between text-[11px] font-black uppercase tracking-widest animate-in slide-in-from-bottom-2 duration-300 shadow-lg">
           <div className="flex items-center gap-3">
             <Check size={14} className="animate-bounce" />
             Editing Message...
           </div>
           <button 
             onClick={finishEditing} 
             className="p-1 hover:bg-white/20 rounded-full transition-colors flex items-center gap-1 group"
           >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">Cancel</span>
              <X size={16} />
           </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-end gap-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-1 mb-1.5">
          {!editingMessage && (
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-2.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-full transition-all disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={22} className="animate-spin" /> : <Paperclip size={22} />}
            </button>
          )}
        </div>

        <div className="flex-1 bg-gray-50/80 rounded-[24px] px-4 py-1.5 flex items-end gap-2 border border-transparent focus-within:border-gray-200 focus-within:bg-white transition-all shadow-sm min-w-0 relative">
          {mentionState.active && (
            <MentionDropdown 
              query={mentionState.query} 
              position={mentionPosition} 
              onSelect={handleMentionSelect} 
            />
          )}
          <textarea 
            ref={textareaRef}
            rows={1}
            placeholder={editingMessage ? "Update your message..." : "Type message..."}
            className="flex-1 max-h-[160px] py-2.5 bg-transparent border-none focus:ring-0 outline-none text-[15px] font-medium transition-all resize-none overflow-y-auto leading-relaxed text-gray-800"
            value={text}
            onKeyDown={handleKeyDown}
            onChange={handleTextChange}
          />
        </div>

        <div className="mb-1.5 shrink-0 flex items-center">
          {text.trim() || editingMessage ? (
            <button 
              type="submit"
              className={`p-3.5 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center group ${
                editingMessage ? 'bg-accent text-white shadow-accent/20' : 'bg-primary text-white shadow-primary/20 hover:bg-primary-dark'
              }`}
            >
              {editingMessage ? (
                <Check size={22} />
              ) : (
                <Send size={22} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              )}
            </button>
          ) : (
            <button 
              type="button" 
              onClick={startRecording}
              className="bg-primary/10 text-primary p-3.5 rounded-full hover:bg-primary/20 active:scale-90 transition-all shadow-sm shadow-primary/5"
            >
              <Mic size={22} />
            </button>
          )}
        </div>
      </form>
      <input 
        type="file" 
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,image/*,audio/*,video/*"
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload}
      />
    </div>
  );
}
