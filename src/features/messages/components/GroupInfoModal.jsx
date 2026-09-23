import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { X, Users, Loader2, Trash2, UserMinus, AlertCircle, Camera, UserPlus } from 'lucide-react';
import useChatStore from '../../../store/chatStore';
import useAuthStore from '../../../store/authStore';
import { getGroupChatHistory } from '../api/getMessages';
import { deleteGroup, removeGroupMember, updateGroupPhoto } from '../api/messageMutations';
import { getAvatarUrl, getStatusColor } from '../utils/statusUtils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AddMembersModal from './AddMembersModal';
import ConfirmationPopover from './ConfirmationPopover';


export default function GroupInfoModal({ group, onClose, triggerRect }) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // Now stores triggerRect
  const [confirmRemove, setConfirmRemove] = useState(null); // Now stores { member, rect }
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addMembersRect, setAddMembersRect] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(group);
  const { onlineUsers, userStatuses, setActiveConversation } = useChatStore();
  const fileInputRef = useRef(null);
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  
  const isCreator = group.createdBy === currentUser?.customId;
  
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

  const fetchGroupDetails = useCallback(async () => {
    try {
      const response = await getGroupChatHistory(group.customId);
      if (response?.data?.group) {
        setMembers(response.data.group.membersData || []);
        setCurrentGroup(response.data.group);
      }
    } catch (err) {
      console.error('Failed to load group details', err);
    } finally {
      setIsLoading(false);
    }
  }, [group.customId]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  const handleDeleteGroup = async () => {
    try {
      setIsDeleting(true);
      await deleteGroup(group.customId);
      toast.success('Group deleted successfully');
      setConfirmDelete(null);
      setActiveConversation(null);
      onClose();
      queryClient.invalidateQueries(['groups', 'my-groups']);
      queryClient.invalidateQueries(['v1', 'conversations']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete group');
      setIsDeleting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!confirmRemove) return;
    try {
      await removeGroupMember(group.customId, confirmRemove.member.customId);
      toast.success('Member removed');
      setConfirmRemove(null);
      fetchGroupDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Please select an image file');
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('photo', file);

      const response = await updateGroupPhoto(group.customId, formData);
      
      const updatedGroup = response.data.group;
      const photoUrl = updatedGroup.profilePhoto;
      
      toast.success('Group photo updated');
      queryClient.invalidateQueries(['groups', 'my-groups']);
      queryClient.invalidateQueries(['v1', 'conversations']);
      
      setActiveConversation({
        ...group,
        profilePhoto: photoUrl
      });
      
      fetchGroupDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update photo');
    } finally {
      setIsUploading(false);
    }
  };

  const groupOnlineCount = members.filter(m => onlineUsers.includes(m.customId)).length;

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
          
          <div className="bg-gray-50/80 pt-8 pb-6 px-6 flex flex-col items-center justify-center relative border-b border-gray-100">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-primary transition-colors p-1">
              <X size={22} />
            </button>
            
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col items-center justify-center text-primary mb-4 border-4 border-white shadow-xl relative overflow-hidden group">
               {currentGroup.profilePhoto ? (
                 <img src={getAvatarUrl(currentGroup.profilePhoto)} alt="" className="w-full h-full object-cover" />
               ) : (
                 <>
                   <Users size={36} strokeWidth={1.5} />
                   <span className="text-[10px] font-black uppercase mt-1 tracking-widest opacity-80">Group</span>
                 </>
               )}

               {isCreator && (
                 <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                 >
                   {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                 </button>
               )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handlePhotoUpload} 
            />
            
            <h2 className="text-[19px] font-black text-primary text-center leading-tight mb-2 max-w-[90%]">{group.name}</h2>
            <div className="flex gap-3 text-[11px] font-black tracking-[0.1em] uppercase">
              <span className="text-gray-500">{members.length || 0} Members</span>
              <span className="text-gray-300">•</span>
              <span className="text-green-500">{groupOnlineCount} Online</span>
            </div>
          </div>

          <div className="p-3 bg-white">
            <div className="flex items-center justify-between mb-3 px-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Group Members</p>
              {isCreator && (
                <button 
                  onClick={(e) => {
                    setAddMembersRect(e.currentTarget.getBoundingClientRect());
                    setShowAddMembers(true);
                  }}
                  className="p-1 hover:bg-accent/10 rounded-md text-accent transition-colors flex items-center gap-1 group"
                  title="Add Members"
                >
                  <UserPlus size={14} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-tighter">Add</span>
                </button>
              )}
            </div>
            
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
                  const isMemberCreator = member.customId === group.createdBy;
                  
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
                        <div className="flex items-center gap-1.5">
                          <p className="text-primary text-[13.5px] font-bold truncate group-hover:text-accent transition-colors">{member.name}</p>
                          {isMemberCreator && (
                            <span className="text-[8px] bg-primary/10 text-primary px-1 rounded font-black uppercase">Owner</span>
                          )}
                        </div>
                        <p className="text-gray-400 text-[11px] truncate capitalize font-medium opacity-80">{member.role}</p>
                      </div>

                      {isCreator && !isMemberCreator && (
                        <button
                          onClick={(e) => setConfirmRemove({ 
                            member: member, 
                            rect: e.currentTarget.getBoundingClientRect() 
                          })}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Remove from group"
                        >
                          <UserMinus size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        {isCreator && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
             <button 
              onClick={(e) => setConfirmDelete(e.currentTarget.getBoundingClientRect())}
              disabled={isDeleting}
              className="w-full py-3 bg-red-50 text-red-500 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
             >
               {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
               Delete Group Permanently
             </button>
          </div>
        )}
      </div>
    </div>

      {/* Confirmation Popovers */}
      {confirmDelete && (
        <ConfirmationPopover 
          title="Delete Group Permanently?"
          message={`Are you sure you want to delete "${group.name}"? All message history will be removed and this action cannot be undone.`}
          confirmText="Yes, Delete"
          onConfirm={handleDeleteGroup}
          onCancel={() => setConfirmDelete(null)}
          triggerRect={confirmDelete}
        />
      )}

      {confirmRemove && (
        <ConfirmationPopover 
          title="Remove Member?"
          message={`Are you sure you want to remove ${confirmRemove.member.name} from this group?`}
          confirmText="Remove"
          onConfirm={handleRemoveMember}
          onCancel={() => setConfirmRemove(null)}
          triggerRect={confirmRemove.rect}
        />
      )}

      {showAddMembers && (
        <AddMembersModal 
          groupId={group.customId}
          existingMemberIds={members.map(m => m.customId)}
          onClose={() => {
            setShowAddMembers(false);
            setAddMembersRect(null);
            // Refresh members list
            fetchGroupDetails();
          }}
          triggerRect={addMembersRect}
        />
      )}
    </>
  );
}

