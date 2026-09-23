import React, { useState, useLayoutEffect, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnnouncementReadStatus } from '../api/getAnnouncements';
import { X, CheckCircle2, Loader2, UserCheck, SearchX } from 'lucide-react';
import { getAvatarUrl } from '../../messages/utils/statusUtils';

/**
 * Minimal and clean anchored popup to visualize who has acknowledged an announcement.
 */
export default function ReadStatusModal({ isOpen, onClose, announcementId, triggerRect = null }) {
  const [position, setPosition] = useState({ opacity: 0, scale: 0.95 });
  const menuRef = useRef(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['announcement-read-status', announcementId],
    queryFn: () => getAnnouncementReadStatus(announcementId),
    enabled: !!announcementId && isOpen,
    refetchInterval: 5000,
  });

  const calculatePosition = useCallback(() => {
    if (!triggerRect || !menuRef.current) return;

    const PADDING = 16;
    const SPACING = 8;
    const menuRect = menuRef.current.getBoundingClientRect();
    
    let left = triggerRect.left;
    let top = triggerRect.top - menuRect.height - SPACING; 
    
    let originY = 'bottom';
    let originX = 'left';

    if (left + menuRect.width + PADDING > window.innerWidth) {
      left = triggerRect.right - menuRect.width;
      originX = 'right';
    }

    if (top < PADDING) {
      top = triggerRect.bottom + SPACING;
      originY = 'top';
    }
    
    if (left < PADDING) {
      left = PADDING;
      originX = 'left';
    }

    if (top + menuRect.height + PADDING > window.innerHeight) {
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

  if (!isOpen) return null;

  const statusInfo = data?.data?.statusInfo;
  const readBy = statusInfo?.readBy || [];
  const sortedReaders = [...readBy].sort((a, b) => new Date(b.readAt) - new Date(a.readAt));

  return (
    <>
      {/* Dynamic Backdrop - Only blur if not anchored */}
      <div 
        className={`fixed inset-0 z-[60] ${!triggerRect ? 'bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center p-4' : ''}`}
        onClick={onClose}
      >
        <div 
          ref={triggerRect ? menuRef : null}
          onClick={(e) => e.stopPropagation()}
          className={`bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[60vh] animate-in zoom-in-95 duration-200 ${triggerRect ? 'fixed' : ''}`}
          style={triggerRect ? { 
            ...position,
            transform: `scale(${position.scale || 1})`,
            transformOrigin: position.transformOrigin 
          } : undefined}
        >
          
          {/* Simple Header */}
          <div className="flex justify-between items-center p-4 sm:p-6 pb-2 sm:pb-3">
            <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
              <UserCheck size={16} className="sm:size-[18px] text-accent" />
              Readers
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-red-500 transition-all p-1.5 hover:bg-red-50 rounded-full active:scale-95"
            >
              <X size={18} className="sm:size-[20px]" />
            </button>
          </div>

          {/* Reader List */}
          <div className="flex-1 overflow-y-auto p-4 pt-0 custom-scrollbar-premium">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-40">
                <Loader2 className="animate-spin text-primary mb-2" size={24} />
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Syncing...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-10 text-red-300">
                <SearchX size={24} />
              </div>
            ) : sortedReaders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                 <p className="text-[10px] font-black uppercase tracking-widest">No reads</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedReaders.map((entry, idx) => (
                  <div 
                    key={entry.user?.customId || idx} 
                    className="flex items-center justify-between p-2 sm:p-2.5 hover:bg-gray-50 rounded-xl sm:rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/5 flex items-center justify-center border border-gray-50 overflow-hidden shrink-0">
                        {entry.user?.profilePhoto ? (
                          <img 
                            src={getAvatarUrl(entry.user.profilePhoto)} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-[9px] sm:text-[10px] font-extrabold text-primary opacity-60">
                            {entry.user?.name?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-xs font-bold text-gray-700 truncate group-hover:text-primary">
                          {entry.user?.name || 'Unknown'}
                        </p>
                        <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                          {entry.user?.role || 'Staff'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                         <p className="text-[8px] sm:text-[9px] text-gray-500 font-extrabold">
                           {new Date(entry.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                         </p>
                      </div>
                      <CheckCircle2 size={10} className="sm:size-[12px] text-green-500 opacity-40 group-hover:opacity-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-2 bg-gradient-to-t from-gray-50 to-transparent"></div>
        </div>
      </div>
    </>
  );
}
