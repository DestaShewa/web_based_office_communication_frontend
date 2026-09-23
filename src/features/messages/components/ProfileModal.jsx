import React, { useState, useLayoutEffect, useRef, useCallback } from 'react';
import { X, Edit2, Phone, Info, AtSign, Loader2, Check, Circle, ChevronDown } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import useChatStore from '../../../store/chatStore';
import { updateMe, updateStatus } from '../../users/api/userMutations';
import { getDisplayStatus, getStatusColor, getAvatarUrl, MOOD_CONFIG } from '../utils/statusUtils';

const STATUS_OPTIONS = Object.keys(MOOD_CONFIG).map(label => ({
  label,
  color: MOOD_CONFIG[label].bg
}));

export default function ProfileModal({ user, onClose, triggerRect }) {
  const { user: currentUser, checkAuth } = useAuthStore();
  const { onlineUsers, userStatuses } = useChatStore();
  
  const isMe = user?.customId === currentUser?.customId || user?._id === currentUser?._id;
  const activeUser = isMe ? currentUser : user; 

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [editForm, setEditForm] = useState({
    username: activeUser?.username || '',
    bio: activeUser?.bio || '',
    phoneNumber: activeUser?.phoneNumber || '',
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const isOnline = onlineUsers.includes(activeUser?.customId);
  const currentMood = getDisplayStatus(userStatuses[activeUser?.customId] || activeUser?.status, isOnline);

  const [position, setPosition] = useState({ opacity: 0, scale: 0.95, transformOrigin: 'top left' });
  const menuRef = useRef(null);

  const handlePhotoUpload = async (file) => {
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max size is 5MB.');
      return;
    }

    try {
      setIsUpdatingStatus(true); // Reuse loading state for UI simplicity
      
      // Instant Preview
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);

      const formData = new FormData();
      formData.append('photo', file);

      const { uploadProfilePhoto } = await import('../../users/api/userMutations');
      await uploadProfilePhoto(formData);
      
      // Cleanup preview and Refresh global auth state to propagate new image
      await checkAuth(); 
      setPreviewUrl(null);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload photo. Please try again.');
      setPreviewUrl(null);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const calculatePosition = useCallback(() => {
    if (!triggerRect || !menuRef.current) return;

    const PADDING = 16;
    const SPACING = 8;
    const menuRect = menuRef.current.getBoundingClientRect();
    
    // Default: Align Left Edge to Anchor Left Edge
    let left = triggerRect.left;
    let top = triggerRect.bottom + SPACING;
    
    let originY = 'top';
    let originX = 'left';

    // 1. HORIZONTAL OVERFLOW: If it overflows the RIGHT side, align Right-to-Right
    if (left + menuRect.width + PADDING > window.innerWidth) {
      left = triggerRect.right - menuRect.width;
      originX = 'right';
    }

    // 2. VERTICAL OVERFLOW: If it overflows the BOTTOM, flip to render ABOVE
    if (top + menuRect.height + PADDING > window.innerHeight) {
      top = triggerRect.top - menuRect.height - SPACING;
      originY = 'bottom';
    }
    
    // 3. HARD CLAMPING: Ensure it never breaches the viewport edges regardless of anchor
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

    // Re-calculate if menu size changes or window resizes
    const resizeObserver = new ResizeObserver(() => calculatePosition());
    if (menuRef.current) resizeObserver.observe(menuRef.current);
    
    window.addEventListener('resize', calculatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculatePosition);
    };
  }, [triggerRect, activeUser?.customId, calculatePosition]);

  const handleStatusChange = async (statusLabel) => {
    if (statusLabel === currentMood) {
      setIsStatusMenuOpen(false);
      return;
    }
    
    try {
      setIsUpdatingStatus(true);
      useChatStore.getState().setUserMoodStatus(currentUser.customId, statusLabel);
      await updateStatus(statusLabel);
      await checkAuth();
    } catch (err) {
      console.error('Failed to update status', err);
      useChatStore.getState().setUserMoodStatus(currentUser.customId, currentMood);
    } finally {
      setIsUpdatingStatus(false);
      setIsStatusMenuOpen(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateMe(editForm);
      await checkAuth(); // Refresh local auth user state identically
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile', err);
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Invisible backdrop for closing */}
      <div className="fixed inset-0 z-[300]" onClick={onClose}></div>
      
      {/* Floating Menu Card */}
      <div 
        ref={menuRef}
        className="fixed z-[301] w-full max-w-[265px] rounded-[1.25rem] bg-white shadow-2xl overflow-hidden flex flex-col border border-gray-100 transition-all duration-200 ease-out"
        style={{
           ...position,
           transform: `${position.transform || ''} scale(${position.scale})`,
           maxHeight: 'calc(100vh - 32px)',
           transformOrigin: position.transformOrigin
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Scrollable Container (for small screens) */}
        <div className="overflow-y-auto w-full h-full custom-scrollbar">
          
          {/* Top Actions */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          {isMe && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-gray-500 hover:text-primary bg-white/80 backdrop-blur-md rounded-full transition-colors p-1.5 shadow-sm border border-gray-100"
            >
              <Edit2 size={14} className="sm:size-[16px]" />
            </button>
          )}
          {isMe && isEditing && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="text-white hover:text-white bg-accent hover:bg-accent/90 rounded-full transition-colors p-1.5 shadow-md shadow-accent/20"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin sm:size-[16px]" /> : <Check size={14} className="sm:size-[16px]" />}
            </button>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 bg-white/80 backdrop-blur-md rounded-full transition-colors p-1.5 shadow-sm border border-gray-100">
            <X size={16} className="sm:size-[18px]" />
          </button>
        </div>

        {/* Header Region */}
        <div className="bg-gray-50/80 py-2.5 sm:py-3.5 flex flex-col items-center justify-center relative border-b border-gray-100">
          <input 
            type="file"
            ref={fileInputRef}
            onChange={(e) => handlePhotoUpload(e.target.files[0])}
            accept="image/*"
            className="hidden"
          />
          
          <div 
            onClick={() => isMe && fileInputRef.current?.click()}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-lg sm:text-xl font-bold shadow-lg mt-0.5 mb-1.5 relative group ${isMe ? 'cursor-pointer hover:ring-2 hover:ring-accent/20 transition-all' : ''}`}
          >
            {previewUrl ? (
               <img src={previewUrl} alt="" className="w-full h-full object-cover animate-pulse" />
            ) : activeUser?.profilePhoto ? (
               <img src={getAvatarUrl(activeUser.profilePhoto)} alt="" className="w-full h-full object-cover" />
            ) : (
               activeUser?.name?.charAt(0) || 'U'
            )}
            
            {isOnline && (
              <span className={`absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 w-4 h-4 sm:w-5 sm:h-5 ${getStatusColor(userStatuses[activeUser?.customId] || activeUser?.status, true, 'bg')} border-[3px] sm:border-4 border-white rounded-full shadow-sm z-20`}></span>
            )}

            {/* Profile Photo Edit Overlay */}
            {isMe && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUpdatingStatus ? (
                  <Loader2 size={24} className="text-white animate-spin" />
                ) : (
                  <div className="flex flex-col items-center">
                    <Edit2 size={24} className="text-white mb-1" />
                    <span className="text-[8px] text-white font-black uppercase tracking-widest">Change Photo</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <h2 className="text-[17px] font-black text-primary mb-0.5">{activeUser?.name}</h2>
          <p className={`text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 ${getStatusColor(userStatuses[activeUser?.customId] || activeUser?.status, isOnline, 'text')}`}>
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>

        {/* Details Region */}
        <div className="p-3 sm:p-4 flex flex-col gap-2 bg-white">
          
          {/* Mood Status (Interactive if Me) */}
          <div className="flex gap-3">
            <Circle size={18} className={`${getStatusColor(userStatuses[activeUser?.customId] || activeUser?.status, isOnline, 'text')} shrink-0 mt-1 fill-current opacity-30`} />
            <div className="flex-1 border-b border-gray-100 pb-2">
              <button 
                onClick={() => isMe && setIsStatusMenuOpen(!isStatusMenuOpen)}
                disabled={!isMe || isUpdatingStatus}
                className={`w-full text-left flex items-center justify-between group/status ${isMe ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(userStatuses[activeUser?.customId] || activeUser?.status, isOnline, 'bg')} shadow-sm`}></span>
                  <p className={`text-sm font-bold tracking-wide ${getStatusColor(userStatuses[activeUser?.customId] || activeUser?.status, isOnline, 'text')}`}>
                    {currentMood}
                  </p>
                </div>
                {isMe && <ChevronDown size={14} className={`text-gray-500 transition-transform ${isStatusMenuOpen ? 'rotate-180' : ''}`} />}
              </button>
              
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">
                {isMe ? 'Change Status' : 'Current Status'}
              </p>

              {/* Status Selection Dropdown */}
              {isMe && isStatusMenuOpen && (
                <div className="mt-3 grid grid-cols-1 gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleStatusChange(opt.label)}
                      className={`flex items-center justify-between p-2 rounded-xl transition-colors ${currentMood === opt.label ? 'bg-primary/5' : 'hover:bg-primary/5'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`}></span>
                        <span className={`text-[13px] ${currentMood === opt.label ? 'text-primary font-bold' : 'text-gray-500 font-medium'}`}>{opt.label}</span>
                      </div>
                      {currentMood === opt.label && <Check size={14} className="text-accent" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Phone */}
          <div className="flex gap-3">
            <Phone size={18} className="text-gray-400 shrink-0 mt-1" />
            <div className="flex-1 border-b border-gray-100 pb-2">
              {isEditing ? (
                <input 
                  type="text" 
                  value={editForm.phoneNumber}
                  onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})}
                  placeholder="e.g. +251 91 234 5678"
                  className="w-full bg-transparent text-gray-900 font-bold focus:outline-none placeholder-gray-400 text-sm"
                />
              ) : (
                <p className="text-gray-800 font-bold text-[13.5px] tracking-wide">{activeUser?.phoneNumber || 'No phone number provided'}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Mobile</p>
            </div>
          </div>

          {/* Bio */}
          <div className="flex gap-3">
            <Info size={18} className="text-gray-400 shrink-0 mt-1" />
            <div className="flex-1 border-b border-gray-100 pb-2">
              {isEditing ? (
                <textarea 
                  value={editForm.bio}
                  onChange={e => setEditForm({...editForm, bio: e.target.value})}
                  placeholder="Tell us a little bit about yourself"
                  className="w-full bg-transparent text-gray-900 font-medium focus:outline-none placeholder-gray-400 text-sm resize-none h-16"
                  maxLength={150}
                />
              ) : (
                <p className="text-gray-700 font-medium text-[13.5px] tracking-wide whitespace-pre-wrap leading-relaxed">{activeUser?.bio || 'No bio provided'}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Bio</p>
            </div>
          </div>

          {/* Username */}
          <div className="flex gap-3">
            <AtSign size={18} className="text-gray-400 shrink-0 mt-1" />
            <div className="flex-1 pb-1">
              {isEditing ? (
                <input 
                  type="text" 
                  value={editForm.username}
                  onChange={e => setEditForm({...editForm, username: e.target.value})}
                  placeholder="username"
                  className="w-full bg-transparent text-gray-900 font-bold focus:outline-none placeholder-gray-400 text-sm"
                />
              ) : (
                <p className="text-accent font-bold text-[13.5px] tracking-wide">{activeUser?.username ? `@${activeUser.username}` : 'No username set'}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-1">Username</p>
            </div>
          </div>

        </div>
        </div>
      </div>
    </>
  );
}
