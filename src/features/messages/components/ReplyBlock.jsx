import React from 'react';
import { ImageIcon, Mic, FileText, Trash2 } from 'lucide-react';

export default function ReplyBlock({ replyTo, isMe, onScrollToOriginal }) {
  if (!replyTo) return null;

  const isObject = typeof replyTo === 'object' && replyTo !== null;
  const senderName = isObject ? replyTo.senderName : 'User';
  const contentPreview = isObject ? replyTo.contentPreview : 'Message';

  const isDeleted = contentPreview === 'This message was deleted';
  
  const getPreviewIcon = () => {
    if (isDeleted) return <Trash2 size={10} />;
    if (contentPreview === 'Photo') return <ImageIcon size={10} />;
    if (contentPreview === 'Voice Message') return <Mic size={10} />;
    return null;
  };

  return (
    <div 
      onClick={onScrollToOriginal}
      className={`mb-2 p-2 rounded-r-xl border-l-[3px] flex flex-col gap-0.5 min-w-[120px] max-w-full cursor-pointer hover:bg-black/10 transition-colors ${
        isMe 
          ? 'bg-white/10 border-white/50 text-white/90' 
          : 'bg-gray-100/50 border-accent text-primary/80'
      }`}
    >
      <span className={`text-[10px] font-black uppercase tracking-tighter ${isMe ? 'text-accent' : 'text-accent'}`}>
        {isDeleted ? "System" : senderName}
      </span>
      <div className="flex items-center gap-1.5 min-w-0">
        {!isDeleted && getPreviewIcon()}
        <p className={`text-[11px] truncate ${isDeleted ? 'italic text-red-500/70' : 'italic opacity-80'} leading-tight font-medium`}>
          {contentPreview}
        </p>
      </div>
    </div>
  );
}
