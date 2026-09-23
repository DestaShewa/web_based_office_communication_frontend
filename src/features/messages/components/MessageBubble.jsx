import React, { useState } from 'react';
import { Check, CheckCheck, FileText, Download, Image as ImageIcon, FileCode, FileArchive, Maximize2, Forward, CheckCircle2 } from 'lucide-react';
import useChatStore from '../../../store/chatStore';
import useAuthStore from '../../../store/authStore';
import AudioMessage from './AudioMessage';
import ImageLightbox from './ImageLightbox';
import MessageActionMenu from './MessageActionMenu';
import { toast } from 'sonner';
import ReplyBlock from './ReplyBlock';
import MentionText from './MentionText';
import ProfilePopup from './ProfilePopup';
import { getAvatarUrl, getFullUrl } from '../utils/statusUtils';

export default function MessageBubble({ message, isMe, user, isDepartment = false, showAvatar = true, showName = true }) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const isOwn = message.sender?.customId === user?.customId || message.sender === user?.customId;
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const { 
    isSelectionMode, 
    selectedMessages, 
    toggleSelection,
    handleMessageDeleted,
    setReplyingTo 
  } = useChatStore();

  const isSelected = selectedMessages.has(message.customId || message._id);

  const fullFileUrl = getFullUrl(message.fileUrl);
  const [imgError, setImgError] = useState(false);

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (message.isDeletedForEveryone) return;
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowActionMenu(true);
  };

  const handleBubbleClick = (e) => {
    if (isSelectionMode) {
      e.stopPropagation();
      toggleSelection(message.customId || message._id);
      return;
    }

    // On mobile, show action menu on tap for text messages. 
    // For media, we prioritize the existing media actions (lightbox/audio play) 
    // but the bubble itself (outside the media element) still triggers the menu.
    if (window.matchMedia('(max-width: 768px)').matches && !message.isDeletedForEveryone) {
      // Don't trigger if clicking on specific links or interactive elements inside
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('img') || e.target.closest('input') || e.target.closest('textarea')) return;
      
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setShowActionMenu(true);
    }
  };

  const scrollToOriginal = (e) => {
    e.stopPropagation();
    if (!message.replyTo) return;
    
    const targetId = `msg-${message.replyTo?.messageId || message.replyTo}`;
    const element = document.getElementById(targetId);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlight flash
      element.classList.add('highlight-pulse');
      setTimeout(() => {
        element.classList.remove('highlight-pulse');
      }, 2000);
    } else {
      toast.info('Original message not found in recent history');
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('image')) return <ImageIcon className="text-blue-500" />;
    if (mimeType?.includes('pdf')) return <FileText className="text-red-500" />;
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) return <FileArchive className="text-yellow-500" />;
    if (mimeType?.includes('javascript') || mimeType?.includes('json') || mimeType?.includes('html')) return <FileCode className="text-purple-500" />;
    return <FileText className="text-gray-500" />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderTextWithMentions = (text) => {
    if (!text) return null;
    const regex = /(@[a-zA-Z0-9_]+)/g;
    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (part.match(/^@[a-zA-Z0-9_]+$/)) {
        return <MentionText key={index} text={part} isMe={isMe} />;
      }
      return part;
    });
  };

  // Secure download: fetches with auth token then triggers blob download
  const handleSecureDownload = async (e) => {
    e.stopPropagation();
    if (!fullFileUrl) return;
    try {
      const res = await fetch(fullFileUrl);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = message.fileInfo?.name || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Could not download file. Please try again.');
    }
  };

  const [showSenderPopup, setShowSenderPopup] = useState(false);
  const [senderPopupRect, setSenderPopupRect] = useState(null);

  const senderUsername = message.sender?.username;
  const senderName = message.sender?.name || 'Unknown';
  const senderPhoto = message.sender?.profilePhoto;

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    if (!senderUsername) return;
    setSenderPopupRect(e.currentTarget.getBoundingClientRect());
    setShowSenderPopup(true);
  };

  // Group chats always align left, DMs use isMe for right-alignment
  const isLayoutMe = isDepartment ? false : isMe;

  if (message.isDeletedForEveryone) {
    return null;
  }

  return (
    <div 
      id={`msg-${message.customId || message._id}`}
      className={`group/bubble flex w-full items-end gap-2 transition-colors ${
        isSelected ? 'bg-primary/5 -mx-4 px-4' : ''
      } ${
        isLayoutMe ? 'justify-end pr-1 sm:pr-2 mb-0.5' : 'justify-start pl-1 sm:pl-2 mb-0.5'
      } animate-in fade-in slide-in-from-bottom-1 duration-200`}
      onClick={handleBubbleClick}
      onContextMenu={handleContextMenu}
    >
      {isSelectionMode && (
        <div className={`shrink-0 transition-all duration-200 ${isLayoutMe ? 'order-last mr-2' : 'order-first ml-2'}`}>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected ? 'bg-accent border-accent text-white scale-110' : 'border-gray-200 bg-white'
          }`}>
            {isSelected && <CheckCircle2 size={16} />}
          </div>
        </div>
      )}

      {/* AVATAR BLOCK */}
      <div className={`shrink-0 self-end mb-1 ${isLayoutMe ? 'order-last ml-1' : 'mr-1'}`}>
        {showAvatar ? (
          <button
            onClick={handleAvatarClick}
            className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm hover:ring-2 hover:ring-accent transition-all cursor-pointer ${
              isMe ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'
            }`}
            title={senderName}
          >
            {senderPhoto ? (
              <img src={getAvatarUrl(senderPhoto)} alt={senderName} className="w-full h-full object-cover" />
            ) : (
              senderName.charAt(0).toUpperCase()
            )}
          </button>
        ) : isDepartment ? (
          /* Spacer to align messages from same user in group chats */
          <div className="w-8" />
        ) : null}
      </div>

      <div className={`max-w-[88%] md:max-w-[68%] lg:max-w-[58%] flex flex-col min-w-0 ${
        isLayoutMe ? 'items-end' : 'items-start'
      }`}>
        {message.forwardedFrom && !isSelectionMode && (
          <div className={`flex items-center gap-1.5 mb-0.5 opacity-40 ${isLayoutMe ? 'mr-1' : 'ml-1'}`}>
            <Forward size={10} />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Forwarded</span>
          </div>
        )}

        {/* GROUP CHAT: Sender name label */}
        {isDepartment && showName && (
          <button
            onClick={handleAvatarClick}
            className={`text-[11px] font-bold mb-0.5 ml-1 transition-colors truncate max-w-[200px] text-left ${
              isMe ? 'text-accent hover:text-accent/80' : 'text-primary/80 hover:text-primary'
            }`}
          >
            {isMe ? 'You' : senderName}
          </button>
        )}

        <div 
          id={`bubble-${message.customId || message._id}`}
          className={`
          ${message.messageType === 'image' ? 'p-1' : 'px-3.5 py-2 md:px-4 md:py-2.5'} 
          rounded-2xl shadow-sm text-sm font-normal leading-relaxed relative
          ${isMe 
            ? `bg-primary text-white border border-primary-dark/10 ${isDepartment ? 'rounded-bl-none' : 'rounded-br-none'}` 
            : 'bg-white border border-gray-100 text-primary rounded-bl-none'}
          transition-all duration-200 min-w-0
          ${isSelected ? 'ring-2 ring-accent' : ''}
          ${isSelectionMode ? 'cursor-pointer select-none' : ''}
        `}>
          <ReplyBlock 
            replyTo={message.replyTo} 
            isMe={isMe} 
            onScrollToOriginal={scrollToOriginal} 
          />

          <div className="flex flex-col gap-1 min-w-0">
            {message.messageType === 'text' && (
              <p className="whitespace-pre-wrap break-words [word-break:break-word] [overflow-wrap:anywhere] leading-[1.5] text-[13.5px] md:text-[14.5px] w-full">
                {renderTextWithMentions(message.content)}
              </p>
            )}
            
            {message.messageType === 'audio' && (
              <AudioMessage url={message.fileUrl} duration={message.duration} isMe={isOwn} />
            )}

            {message.messageType === 'image' && (
              <div 
                className={`relative group cursor-pointer overflow-hidden rounded-xl bg-black/5 min-w-[200px] ${imgError ? 'bg-gray-100 p-8' : ''}`}
                onClick={(e) => {
                  if (isSelectionMode) return;
                  e.stopPropagation();
                  !imgError && setShowLightbox(true);
                }}
              >
                {imgError ? (
                  <div className="flex flex-col items-center gap-2 text-gray-400 opacity-60">
                    <ImageIcon size={32} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Image not found</span>
                  </div>
                ) : (
                  <>
                    <img 
                      src={fullFileUrl}
                      alt={message.fileInfo?.name} 
                      onError={() => setImgError(true)}
                      crossOrigin="anonymous"
                      className={`max-w-full h-auto max-h-[500px] min-h-[100px] w-auto object-contain transition-all duration-500 group-hover:scale-[1.02] ${
                        message.status === 'sending' ? 'blur-[3px] opacity-60' : ''
                      }`}
                      loading="lazy"
                    />
                    {message.status === 'sending' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                    {!isSelectionMode && (
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 scale-90 group-hover:scale-100 transition-transform shadow-lg">
                          <Maximize2 size={20} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
 
            {message.messageType === 'file' && (
              <div className={`flex flex-col gap-2 rounded-xl p-2 border min-w-[200px] sm:min-w-[240px] max-w-full ${
                isOwn ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'
              }`}>
                {/* Fallback for files that are images but messageType is 'file' */}
                {message.fileInfo?.mimeType?.includes('image') ? (
                  <div className="relative group overflow-hidden rounded-lg bg-black/5 cursor-pointer" onClick={(e) => {
                    if (isSelectionMode) return;
                    e.stopPropagation();
                    setShowLightbox(true);
                  }}>
                    <img 
                      src={fullFileUrl} 
                      alt={message.fileInfo?.name} 
                      crossOrigin="anonymous"
                      className="max-w-full h-auto max-h-60 w-full object-contain mx-auto"
                    />
                    {!isSelectionMode && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="text-white" size={24} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 min-w-0 w-full overflow-hidden">
                    <div className={`p-2 rounded-lg shrink-0 ${isOwn ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                      {getFileIcon(message.fileInfo?.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="text-[13px] font-bold truncate leading-snug mb-0.5" title={message.fileInfo?.name}>
                        {message.fileInfo?.name}
                      </p>
                      <div className="flex items-center gap-1.5 opacity-60">
                        <p className="text-[10px] uppercase font-bold tracking-tight">{formatSize(message.fileInfo?.size)}</p>
                        <span className="w-0.5 h-0.5 bg-current rounded-full opacity-30"></span>
                        <p className="text-[10px] uppercase font-bold tracking-tight">{message.fileInfo?.mimeType?.split('/')[1] || 'file'}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSecureDownload}
                      className={`p-2 rounded-lg hover:bg-black/5 transition-all shrink-0 active:scale-90 ${isOwn ? 'text-white' : 'text-primary'}`}
                      title={`Download ${message.fileInfo?.name}`}
                    >
                      <Download size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-1.5 mt-1 px-1 ${isLayoutMe ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[9px] md:text-[10px] font-medium text-gray-400 opacity-80 flex items-center gap-1.5">
            {message.isEdited && <span className="italic font-bold opacity-60 uppercase tracking-tighter">Edited</span>}
            {time}
          </span>
          {isMe && (
            <span className="flex items-center">
              {message.status === 'sending' ? (
                <div className="w-2.5 h-2.5 border border-gray-400/50 border-t-transparent rounded-full animate-spin"></div>
              ) : message.isRead ? (
                <CheckCheck size={14} className="text-blue-500" />
              ) : (
                <Check size={14} className="text-gray-400" />
              )}
            </span>
          )}
        </div>
      </div>

      {showActionMenu && (
        <MessageActionMenu 
          message={message} 
          position={menuPosition} 
          isMe={isMe}
          onClose={() => setShowActionMenu(false)} 
        />
      )}

      {showLightbox && !imgError && !isSelectionMode && (
        <ImageLightbox 
          src={fullFileUrl} 
          fileName={message.fileInfo?.name || 'Image'} 
          onClose={() => setShowLightbox(false)} 
        />
      )}

      {showSenderPopup && senderUsername && (
        <ProfilePopup
          username={senderUsername}
          triggerRect={senderPopupRect}
          onClose={() => setShowSenderPopup(false)}
        />
      )}
    </div>
  );
}
