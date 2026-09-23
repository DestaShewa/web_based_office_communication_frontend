import React, { useEffect, useRef } from 'react';
import { Edit2, Forward, Trash2, CheckCircle2, Reply } from 'lucide-react';
import useChatStore from '../../../store/chatStore';

export default function MessageActionMenu({ message, position, onClose, isMe }) {
  const menuRef = useRef(null);
  const { 
    setEditingMessage, 
    toggleSelection, 
    setSelectionMode,
    setReplyingTo 
  } = useChatStore();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAction = (action, e) => {
    switch (action) {
      case 'edit':
        setEditingMessage(message);
        break;
      case 'reply':
        setReplyingTo(message);
        break;
      case 'forward':
        window.dispatchEvent(new CustomEvent('open-forward-modal', { detail: [message.customId || message._id] }));
        break;
      case 'select':
        setSelectionMode(true);
        toggleSelection(message.customId || message._id);
        break;
      case 'delete':
        window.dispatchEvent(new CustomEvent('open-delete-confirm', { 
          detail: { 
            message, 
            triggerRect: e?.currentTarget?.getBoundingClientRect() || menuRef.current?.getBoundingClientRect() 
          }
        }));
        break;
      default:
        break;
    }
    onClose();
  };

  const isText = message.messageType === 'text';

  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  return (
    <div 
      ref={menuRef}
      className={`fixed z-[100] bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl p-1.5 min-w-[190px] animate-in duration-200 motion-reduce:animate-none 
        ${isMobile 
          ? 'bottom-2 left-2 right-2 rounded-[2rem] fade-in slide-in-from-bottom-5' 
          : 'rounded-2xl fade-in zoom-in-95'
        }`}
      style={!isMobile ? { 
        top: position.y, 
        left: position.x,
        transform: `translate(${
          position.x + 190 > window.innerWidth ? '-100%' : '0'
        }, ${
          position.y + 260 > window.innerHeight ? '-100%' : '0'
        })`
      } : {}}
    >
      <div className="flex flex-col gap-1">
        {isMobile && (
          <div className="w-10 h-1 bg-gray-100 rounded-full mx-auto my-2 mb-3" />
        )}
        <button 
          onClick={() => handleAction('reply')}
          className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 text-gray-700 hover:text-primary rounded-xl transition-all text-[13px] font-semibold group"
        >
          <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-primary/10 transition-colors">
            <Reply size={16} />
          </div>
          Reply
        </button>

        {isMe && isText && (
          <button 
            onClick={() => handleAction('edit')}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 text-gray-700 hover:text-primary rounded-xl transition-all text-[13px] font-semibold group"
          >
            <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-primary/10 transition-colors">
              <Edit2 size={16} />
            </div>
            Edit Message
          </button>
        )}
        
        <button 
          onClick={() => handleAction('forward')}
          className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 text-gray-700 hover:text-primary rounded-xl transition-all text-[13px] font-semibold group"
        >
          <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-primary/10 transition-colors">
            <Forward size={16} />
          </div>
          Forward
        </button>

        <button 
          onClick={() => handleAction('select')}
          className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 text-gray-700 hover:text-primary rounded-xl transition-all text-[13px] font-semibold group"
        >
          <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-primary/10 transition-colors">
            <CheckCircle2 size={16} />
          </div>
          Select
        </button>

        <div className="h-px bg-gray-100 my-1 mx-2" />

        <button 
          onClick={(e) => handleAction('delete', e)}
          className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 text-red-500 rounded-xl transition-all text-[13px] font-semibold group"
        >
          <div className="p-1.5 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors text-red-600">
            <Trash2 size={16} />
          </div>
          Delete
        </button>
      </div>
    </div>
  );
}
