import React from 'react';
import { X, Forward, Trash2, CheckSquare } from 'lucide-react';
import useChatStore from '../../../store/chatStore';

export default function SelectionToolbar() {
  const { 
    selectedMessages, 
    clearSelection 
  } = useChatStore();

  if (selectedMessages.size === 0) return null;

  const handleForward = () => {
    window.dispatchEvent(new CustomEvent('open-forward-modal', { 
      detail: Array.from(selectedMessages) 
    }));
  };

  const handleDelete = (e) => {
    window.dispatchEvent(new CustomEvent('open-delete-confirm-bulk', { 
      detail: { 
        ids: Array.from(selectedMessages),
        triggerRect: e.currentTarget.getBoundingClientRect()
      }
    }));
  };

  return (
    <div className="absolute top-0 left-0 right-0 h-16 md:h-20 bg-primary z-[30] flex items-center justify-between px-4 md:px-8 animate-in slide-in-from-top duration-300 shadow-lg">
      <div className="flex items-center gap-4 text-white">
        <button 
          onClick={clearSelection}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
        <div className="flex items-center gap-2">
          <CheckSquare size={20} className="text-accent" />
          <span className="font-black text-lg">{selectedMessages.size} selected</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={handleForward}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all active:scale-95"
        >
          <Forward size={20} />
          <span className="hidden sm:inline">Forward</span>
        </button>
        
        <button 
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-red-900/20"
        >
          <Trash2 size={20} />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </div>
  );
}
