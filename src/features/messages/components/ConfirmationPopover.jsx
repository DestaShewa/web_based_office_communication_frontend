import React, { useLayoutEffect, useState, useRef, useCallback } from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ConfirmationPopover({ title, message, confirmText, onConfirm, onCancel, triggerRect, variant = 'danger' }) {
  const [position, setPosition] = useState({ top: 0, left: 0, opacity: 0, scale: 0.95 });
  const menuRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRect || !menuRef.current) return;

    const PADDING = 16;
    const SPACING = 8;
    const menuRect = menuRef.current.getBoundingClientRect();
    
    let left = triggerRect.left;
    let top = triggerRect.top - menuRect.height - SPACING; // Default ABOVE trigger
    
    let originY = 'bottom';
    let originX = 'left';

    // Horizontal adjustment
    if (left + menuRect.width + PADDING > window.innerWidth) {
      left = triggerRect.right - menuRect.width;
      originX = 'right';
    }

    // Vertical adjustment
    if (top < PADDING) {
      top = triggerRect.bottom + SPACING;
      originY = 'top';
    }
    
    // Hard clamping
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

    const arrowCenter = triggerRect.left + triggerRect.width / 2;
    let arrowLeft = arrowCenter - left;
    
    // Clamp arrow position within menu bounds
    const arrowPadding = 24;
    if (arrowLeft < arrowPadding) arrowLeft = arrowPadding;
    if (arrowLeft > menuRect.width - arrowPadding) arrowLeft = menuRect.width - arrowPadding;

    setPosition({ 
      top, 
      left, 
      opacity: 1, 
      scale: 1, 
      arrowLeft,
      originY,
      originX,
      transformOrigin: `${originY} ${originX}` 
    });
  }, [triggerRect]);

  useLayoutEffect(() => {
    if (!triggerRect) return;

    calculatePosition();

    const resizeObserver = new ResizeObserver(() => calculatePosition());
    if (menuRef.current) resizeObserver.observe(menuRef.current);
    
    window.addEventListener('resize', calculatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculatePosition);
    };
  }, [triggerRect, calculatePosition]);

  const isDanger = variant === 'danger';

  // Calculate arrow position
  const getArrowStyle = () => {
    if (!triggerRect || !menuRef.current || !position.arrowLeft) return { display: 'none' };
    
    const isBottom = position.originY === 'top';
    
    return {
        left: `${position.arrowLeft}px`,
        [isBottom ? 'top' : 'bottom']: '-6px',
        transform: 'translateX(-50%) rotate(45deg)',
    };
  };

  return (
    <div className="fixed inset-0 z-[400] overflow-hidden pointer-events-none">
        {/* Completely transparent backdrop for clicking away, no blur */}
        <div 
            className="fixed inset-0 pointer-events-auto" 
            onClick={onCancel}
        />
        
        <div 
            ref={menuRef}
            className="fixed w-full max-w-[320px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 overflow-visible flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
            style={{ 
                top: position.top, 
                left: position.left, 
                opacity: position.opacity,
                transform: `scale(${position.scale})`,
                transformOrigin: position.transformOrigin
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Arrow tail */}
            <div 
                className="absolute w-3 h-3 bg-white border-inherit border-l border-t z-[-1]"
                style={getArrowStyle()}
            />

            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
                        <AlertCircle size={20} />
                    </div>
                    <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{title}</h3>
                <p className="text-[12.5px] text-gray-500 leading-relaxed font-medium">{message}</p>
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 mt-auto">
                <button 
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
                >
                    Cancel
                </button>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onConfirm();
                    }}
                    className={`flex-1 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white rounded-xl transition-colors shadow-sm ${
                        isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'
                    }`}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
  );
}
