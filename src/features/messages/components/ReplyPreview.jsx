import React from 'react';
import { X, ImageIcon, Mic, FileText } from 'lucide-react';

export default function ReplyPreview({ replyingTo, onCancel }) {
  if (!replyingTo) return null;

  const getPreviewContent = () => {
    switch (replyingTo.messageType) {
      case 'text':
        return replyingTo.content;
      case 'image':
        return 'Photo';
      case 'audio':
        return 'Voice Message';
      case 'file':
        return replyingTo.fileInfo?.name || 'File';
        case 'image':
            return 'Photo';
      default:
        return replyingTo.content || 'Message';
    }
  };

  const getPreviewIcon = () => {
    switch (replyingTo.messageType) {
      case 'image':
        return <ImageIcon size={12} className="text-accent" />;
      case 'audio':
        return <Mic size={12} className="text-accent" />;
      case 'file':
        return <FileText size={12} className="text-accent" />;
      default:
        return null;
    }
  };

  return (
    <div className="mb-4 bg-gray-50 border-l-4 border-accent rounded-r-xl px-4 py-3 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300 shadow-sm border-y border-r border-gray-100 group relative">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent/10 px-1.5 py-0.5 rounded leading-none">
            Replying to {replyingTo.sender?.name || 'User'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {getPreviewIcon()}
          <p className="text-sm text-gray-500 truncate font-semibold leading-tight pr-4">
            {getPreviewContent()}
          </p>
        </div>
      </div>
      <button 
        onClick={onCancel}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-4 shrink-0 shadow-sm bg-white border border-gray-100 active:scale-90"
        title="Cancel reply"
      >
        <X size={18} />
      </button>
    </div>
  );
}
