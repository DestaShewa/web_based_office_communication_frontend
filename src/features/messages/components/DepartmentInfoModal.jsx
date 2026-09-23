import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { X, Users, Loader2 } from 'lucide-react';
import useChatStore from '../../../store/chatStore';
import { getDepartmentMembers } from '../../departments/api/departmentApi';
import { getAvatarUrl, getStatusColor } from '../utils/statusUtils';

export default function DepartmentInfoModal({ department, onClose, triggerRect }) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { onlineUsers, userStatuses } = useChatStore();
  
  const [position, setPosition] = useState({ opacity: 0, scale: 0.95, transformOrigin: 'top left' });
  const menuRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRect || !menuRef.current) return;

    const PADDING = 16;
    const SPACING = 8;
    const menuRect = menuRef.current.getBoundingClientRect();
    
    let left = triggerRect.left;
    let top = triggerRect.bottom + SPACING;
    
    let originY = 'top';
    let originX = 'left';

    if (left + menuRect.width + PADDING > window.innerWidth) {
      left = triggerRect.right - menuRect.width;
      originX = 'right';
    }

    if (top + menuRect.height + PADDING > window.innerHeight) {
      top = triggerRect.top - menuRect.height - SPACING;
      originY = 'bottom';
    }
    
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
  }, [calculatePosition, triggerRect]);

  useEffect(() => {
    let mounted = true;
    const fetchMembers = async () => {
      try {
        const data = await getDepartmentMembers(department.customId);
        if (mounted) {
          setMembers(data.members || []);
        }
      } catch (err) {
        console.error('Failed to load members', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    
    fetchMembers();

    return () => { mounted = false; };
  }, [department.customId]);

  const departmentOnlineCount = members.filter(m => onlineUsers.includes(m.customId)).length;

  return (
    <>
      <div className="fixed inset-0 z-[300]" onClick={onClose}></div>
      
      <div 
        ref={menuRef}
        className="fixed z-[301] w-full max-w-[320px] rounded-[1.5rem] bg-white shadow-2xl overflow-hidden flex flex-col border border-gray-100 transition-all duration-200 ease-out"
        style={{
           ...position,
           transform: `${position.transform || ''} scale(${position.scale})`,
           maxHeight: 'calc(100vh - 32px)',
           transformOrigin: position.transformOrigin
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto w-full max-h-[70vh] custom-scrollbar">
          
          {/* Header */}
          <div className="bg-gray-50/80 pt-8 pb-6 px-6 flex flex-col items-center justify-center relative border-b border-gray-100">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-primary transition-colors p-1">
              <X size={22} />
            </button>
            
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center text-gray-400 mb-4 border-4 border-white shadow-xl">
               <Users size={36} strokeWidth={1.5} />
               <span className="text-[10px] font-black uppercase mt-1 tracking-widest opacity-80">Group</span>
            </div>
            
            <h2 className="text-[19px] font-black text-primary text-center leading-tight mb-2 max-w-[90%]">{department.name}</h2>
            <div className="flex gap-3 text-[11px] font-black tracking-[0.1em] uppercase">
              <span className="text-gray-500">{members.length || 0} Members</span>
              <span className="text-gray-300">•</span>
              <span className="text-green-500">{departmentOnlineCount} Online</span>
            </div>
          </div>

          {/* Members List */}
          <div className="p-3 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 px-2">Group Members</p>
            
            {isLoading ? (
              <div className="flex justify-center p-8">
                 <Loader2 size={24} className="animate-spin text-accent" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-gray-400 text-sm font-medium text-center p-4">No members found</p>
            ) : (
              <div className="flex flex-col gap-1">
                {members.map(member => {
                  const isOnline = onlineUsers.includes(member.customId);
                  
                  return (
                    <div key={member.customId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary/5 transition-colors group cursor-default">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400 overflow-hidden text-sm">
                          {member.profilePhoto ? (
                            <img src={getAvatarUrl(member.profilePhoto)} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            member.name?.charAt(0)
                          )}
                        </div>
                        {isOnline && (
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${getStatusColor(userStatuses[member.customId] || member.status, true, 'bg')} border-2 border-white rounded-full shadow-sm`}></span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-primary text-[13.5px] font-bold truncate group-hover:text-accent transition-colors">{member.name}</p>
                        <p className="text-gray-400 text-[11px] truncate capitalize font-medium opacity-80">{member.role}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
