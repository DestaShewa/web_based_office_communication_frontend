import React, { useState, useLayoutEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, Users, Loader2, Check } from 'lucide-react';
import { getUsers } from '../../users/api/getUsers';
import { createGroup } from '../api/getMessages';
import useAuthStore from '../../../store/authStore';
import { getAvatarUrl } from '../utils/statusUtils';

export default function CreateGroupModal({ onClose, triggerRect, onSuccess }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [position, setPosition] = useState({ opacity: 0, scale: 0.95 });
  const menuRef = useRef(null);

  const isDean = user?.role === 'dean';
  const isCoordinator = user?.role === 'coordinator';

  const userFacultyId = typeof user?.faculty === 'object' ? user?.faculty?.customId : user?.faculty;
  const userDeptId = typeof user?.department === 'object' ? user?.department?.customId : user?.department;

  const calculatePosition = useCallback(() => {
    if (!triggerRect || !menuRef.current) return;

    const PADDING = 24;
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

    // Vertical flip
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
      padding: PADDING,
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

  // Fetch users based on role
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', 'group-creation', userFacultyId, userDeptId],
    queryFn: () => getUsers({
      faculty: isDean ? userFacultyId : undefined,
      department: isCoordinator ? userDeptId : undefined,
      limit: 100,
      purpose: 'messaging'
    }),
  });

  const mutation = useMutation({
    mutationFn: createGroup,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['v1', 'conversations']);
      queryClient.invalidateQueries(['groups', 'my-groups']);
      if (onSuccess) onSuccess(data?.data?.group || data);
      onClose();
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to create group');
    }
  });

  const users = usersData?.data?.users || [];
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    u.customId !== user?.customId
  );

  const toggleMember = (customId) => {
    setSelectedMembers(prev => 
      prev.includes(customId) 
        ? prev.filter(id => id !== customId) 
        : [...prev, customId]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim()) return alert('Please enter a group name');
    if (selectedMembers.length === 0) return alert('Please select at least one member');

    mutation.mutate({
      name: groupName,
      members: selectedMembers
    });
  };

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
    <div className="fixed inset-0 z-[500] overflow-hidden pointer-events-none">
      <div className="fixed inset-0 pointer-events-auto" onClick={onClose} />
      
      <div 
        ref={menuRef}
        className="fixed bg-white w-full max-w-[360px] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-visible flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
        style={{
          top: position.top,
          left: position.left,
          opacity: position.opacity,
          transform: `scale(${position.scale})`,
          transformOrigin: position.transformOrigin,
          maxHeight: position.top ? `calc(100vh - ${position.top}px - ${position.padding || 24}px)` : '85vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow tail */}
        <div 
            className="absolute w-3 h-3 bg-white border-inherit border-l border-t z-[-1]"
            style={getArrowStyle()}
        />

        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-primary leading-tight">Create Group</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              {isDean ? user?.faculty?.name : user?.department?.name}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-6 pb-6 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Group Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Group Name</label>
            <input 
              type="text" 
              placeholder="Enter group name..." 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* User Search & List */}
          <div className="space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Members ({selectedMembers.length})
              </label>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Search staff..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-accent outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-1 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                  <Loader2 className="animate-spin mb-1" size={20} />
                  <p className="text-[10px] font-bold uppercase tracking-tighter">Loading...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center py-8 text-gray-300 text-[10px] font-bold uppercase">No results</p>
              ) : (
                filteredUsers.map(u => {
                  const isSelected = selectedMembers.includes(u.customId);
                  const uDeptId = typeof u.department === 'object' ? u.department?.customId : u.department;
                  const isSameDept = isDean && userDeptId && uDeptId === userDeptId;

                  return (
                    <button
                      key={u.customId}
                      onClick={() => toggleMember(u.customId)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl transition-all text-left group border ${
                        isSelected 
                          ? 'bg-accent/5 border-accent/20' 
                          : isSameDept
                            ? 'bg-amber-50/50 border-amber-100 hover:bg-amber-50'
                            : 'hover:bg-primary/5 border-transparent'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden border ${
                          isSelected ? 'border-accent' : isSameDept ? 'border-amber-200' : 'border-gray-100'
                        }`}>
                          {u.profilePhoto ? <img src={getAvatarUrl(u.profilePhoto)} alt="" className="w-full h-full object-cover" /> : u.name.charAt(0)}
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white rounded-full flex items-center justify-center shadow-sm">
                            <Check size={10} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-accent' : 'text-primary'}`}>{u.name}</p>
                          {isSameDept && (
                            <span className="text-[7px] bg-amber-100 text-amber-700 px-1 rounded-full font-black uppercase tracking-tighter shrink-0">Same Dept</span>
                          )}
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase truncate tracking-tighter">{u.role}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
          <button 
            onClick={onClose}
            className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={mutation.isPending || !groupName.trim() || selectedMembers.length === 0}
            className="flex-[2] py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 size={12} className="animate-spin" />}
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
