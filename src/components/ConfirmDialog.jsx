import React, { useState, useLayoutEffect, useCallback, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onCancel, onConfirm, title, message, confirmText = 'Confirm', confirmColor = 'danger', triggerRect = null }) {
  if (!isOpen) return null;

  // Handle both prop names for backwards compatibility
  const handleClose = onCancel || onClose;

  // Map shorthand color variants to Tailwind classes
  const colorMap = {
    danger: 'bg-red-600 hover:bg-red-700',
    primary: 'bg-primary hover:bg-primary/90',
    success: 'bg-green-600 hover:bg-green-700',
    default: 'bg-gray-600 hover:bg-gray-700'
  };

  const buttonClasses = colorMap[confirmColor] || confirmColor; // fallback to raw string just in case

  const [position, setPosition] = useState({ opacity: 0, scale: 0.95 });
  const menuRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRect || !menuRef.current) return;

    const PADDING = 16;
    const SPACING = 8;
    const menuRect = menuRef.current.getBoundingClientRect();
    
    let left = triggerRect.left;
    let top = triggerRect.top - menuRect.height - SPACING; // Default slightly ABOVE trigger
    
    let originY = 'bottom';
    let originX = 'left';

    // HORIZONTAL OVERFLOW: If it overflows the RIGHT side, align Right-to-Right
    if (left + menuRect.width + PADDING > window.innerWidth) {
      left = triggerRect.right - menuRect.width;
      originX = 'right';
    }

    // VERTICAL OVERFLOW: If it overflows the TOP, flip to render BELOW the trigger
    if (top < PADDING) {
      top = triggerRect.bottom + SPACING;
      originY = 'top';
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
    } else if (top + menuRect.height + PADDING > window.innerHeight) {
      top = window.innerHeight - menuRect.height - PADDING;
      originY = 'bottom';
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
    if (!isOpen || !triggerRect) return;

    calculatePosition();

    const resizeObserver = new ResizeObserver(() => calculatePosition());
    if (menuRef.current) resizeObserver.observe(menuRef.current);
    
    window.addEventListener('resize', calculatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen, triggerRect, calculatePosition]);

  return (
    <>
      {/* Dynamic Backdrop */}
      <div 
        className={`fixed inset-0 z-[60] ${!triggerRect ? 'bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200' : ''}`}
        onClick={handleClose}
      >
        {/* The Modal Card */}
        <div 
          ref={triggerRect ? menuRef : null}
          onClick={(e) => e.stopPropagation()}
          className={`bg-white rounded-2xl shadow-2xl w-full max-w-[320px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 ${triggerRect ? 'fixed' : ''}`}
          style={triggerRect ? { 
             ...position,
             transform: `${position.transform || ''} scale(${position.scale || 1})`,
             transformOrigin: position.transformOrigin 
          } : undefined}
        >
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              confirmColor === 'primary' ? 'bg-primary/10 text-primary' : 
              confirmColor === 'success' ? 'bg-green-100 text-green-600' :
              'bg-red-100 text-red-600'
            }`}>
              <AlertTriangle size={20} />
            </div>
            <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <X size={16} />
            </button>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{title}</h3>
          <p className="text-[12.5px] text-gray-500 leading-relaxed font-medium">{message}</p>
        </div>

        <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 mt-auto">
          <button 
            onClick={handleClose} 
            className="flex-1 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              handleClose();
            }} 
            className={`flex-1 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white rounded-xl transition-colors shadow-sm ${buttonClasses}`}
          >
            {confirmText}
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
