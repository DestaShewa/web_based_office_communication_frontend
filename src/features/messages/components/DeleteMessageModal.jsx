import React, { useState, useLayoutEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X } from 'lucide-react';

export default function DeleteMessageModal({ deleteData, onClose, onConfirm, currentUser }) {
  const [position, setPosition] = useState({ opacity: 0, scale: 0.95 });
  const menuRef = useRef(null);

  // Fallback to center if no triggerRect
  const triggerRect = deleteData.triggerRect;

  const calculatePosition = useCallback(() => {
    if (!triggerRect || !menuRef.current) return;

    const PADDING = 16;
    const SPACING = 8;
    const menuRect = menuRef.current.getBoundingClientRect();
    
    let left = triggerRect.left;
    let top = triggerRect.bottom + SPACING; // default to drop down
    
    let originY = 'top';
    let originX = 'left';

    // HORIZONTAL SETTING
    if (left + menuRect.width + PADDING > window.innerWidth) {
      left = triggerRect.right - menuRect.width;
      originX = 'right';
    }

    // VERTICAL OVERFLOW: flip to render above
    if (top + menuRect.height + PADDING > window.innerHeight) {
      top = triggerRect.top - menuRect.height - SPACING;
      originY = 'bottom';
    }
    
    // HARD CLAMPING
    if (left < PADDING) {
      left = PADDING;
      originX = 'left';
    } else if (left + menuRect.width + PADDING > window.innerWidth) {
      left = window.innerWidth - menuRect.width - PADDING;
      originX = 'right';
    }

    if (top < PADDING) {
      top = PADDING;
      originY = 'top';
    }

    setPosition({ 
      top, 
      left, 
      opacity: 1, 
      scale: 1, 
      transformOrigin: `${originY} ${originX}` 
    });
  }, [triggerRect]);

  useLayoutEffect(() => {
    if (!triggerRect) {
      setPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 1, scale: 1, transformOrigin: 'center' });
      return;
    }

    calculatePosition();

    const resizeObserver = new ResizeObserver(() => calculatePosition());
    if (menuRef.current) resizeObserver.observe(menuRef.current);
    
    window.addEventListener('resize', calculatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculatePosition);
    };
  }, [triggerRect, calculatePosition]);

  return createPortal(
    <div 
      className={`fixed inset-0 z-[200] ${!triggerRect ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'}`}
      onClick={onClose}
    >
      <div 
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white border border-gray-100 p-5 sm:p-6 rounded-[2rem] w-full max-w-[320px] shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${triggerRect ? 'fixed' : 'absolute'}`}
        style={triggerRect ? { 
           ...position,
           transform: `${position.transform || ''} scale(${position.scale || 1})`,
           transformOrigin: position.transformOrigin 
        } : position}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
             <Trash2 size={24} />
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <h3 className="text-base sm:text-[17px] font-black text-primary mb-1">Delete Message?</h3>
        <p className="text-[11px] sm:text-xs text-gray-500 mb-5 sm:mb-6 font-medium leading-relaxed">This action will permanently remove the selected message history.</p>
        
        <div className="flex flex-col gap-2">
           {(!deleteData.bulk && (deleteData.message?.sender === currentUser?.customId || deleteData.message?.sender?.customId === currentUser?.customId)) && (
             <button 
              onClick={() => onConfirm(true)}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-black transition-all active:scale-95 shadow-md shadow-red-200"
             >
               Delete for Everyone
             </button>
           )}
           <button 
            onClick={() => onConfirm(false)}
            className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-black transition-all active:scale-95"
           >
             Delete for Me
           </button>
            <button 
             onClick={onClose}
             className="w-full py-2.5 sm:py-3 text-gray-400 text-xs sm:text-sm font-bold hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
           >
             Cancel
           </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
