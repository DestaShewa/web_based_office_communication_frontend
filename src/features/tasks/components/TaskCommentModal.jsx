import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTaskComments, addComment, deleteTaskComment } from '../api/taskMutations';
import { 
  X, Send, Loader2, MessageSquare, Reply, 
  Trash2, CornerDownRight, AlertCircle
} from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import { getAvatarUrl } from '../../messages/utils/statusUtils';
import { toast } from 'sonner';

/**
 * Modern anchored Discussion popup for tasks.
 */
export default function TaskCommentModal({ isOpen, onClose, task, triggerRect = null }) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [position, setPosition] = useState({ opacity: 0, scale: 0.95 });
  const menuRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['task-comments', task?.customId || task?._id],
    queryFn: () => getTaskComments(task?.customId || task?._id),
    enabled: !!task && isOpen,
  });

  const comments = data?.data?.task?.comments || [];

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

  // Mutations
  const commentMutation = useMutation({
    mutationFn: (payload) => addComment({ 
      taskId: task?.customId || task?._id, 
      ...payload 
    }),
    onSuccess: () => {
      setMessage('');
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['task-comments', task?.customId || task?._id] });
    },
    onError: (err) => setErrorMsg(err.response?.data?.message || 'Failed to add comment.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => deleteTaskComment(commentId),
    onSuccess: () => {
      toast.success('Comment deleted');
      queryClient.invalidateQueries({ queryKey: ['task-comments', task?.customId || task?._id] });
    },
    onError: () => toast.error('Failed to delete comment'),
  });

  const uid = currentUser?.customId || currentUser?._id?.toString();
  const isAdmin = currentUser?.role === 'admin';
  const isDirector = currentUser?.role === 'director';
  const isDean = currentUser?.role === 'dean';
  const isCoordinator = currentUser?.role === 'coordinator';
  const isAssigner = task?.assigner === uid;
  const isAssignee = task?.assignees?.some(a => (a.user || a) === uid);

  const canComment = isAdmin || isDirector || isDean || isCoordinator || isAssigner || isAssignee;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !canComment) return;
    commentMutation.mutate({ 
      message, 
      parentCommentId: replyTo?._id 
    });
  };

  const handleContextMenu = (e, comment) => {
    e.preventDefault();
    setConfirmDelete(false);
    setContextMenu({
      id: comment._id || comment.customId,
      comment,
      x: e.clientX,
      y: e.clientY
    });
  };

  const scrollToComment = (parentCommentId) => {
    const element = document.getElementById(`comment-${parentCommentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-accent/10');
      setTimeout(() => element.classList.remove('bg-accent/10'), 2000);
    } else {
      toast.info('Original comment has been deleted or not found');
    }
  };

  useEffect(() => {
    const close = (e) => {
      // Don't close if we're clicking inside the menu
      if (e.target.closest('.action-menu-container')) return;
      setContextMenu(null);
    };
    if (contextMenu) {
      // Small timeout to prevent the current opening click from closing it
      const timer = setTimeout(() => {
        window.addEventListener('mousedown', close);
      }, 10);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('mousedown', close);
      };
    }
  }, [contextMenu]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  if (!isOpen || !task) return null;

  return (
    <div 
      className={`fixed inset-0 z-[60] transition-all ${!triggerRect ? 'bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4' : ''}`}
      onClick={onClose}
    >
      <div 
        ref={triggerRect ? menuRef : null}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-[2rem] shadow-2xl w-full max-w-xl h-[80vh] flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200 border border-gray-100 ${triggerRect ? 'fixed' : ''}`}
        style={triggerRect ? { 
           ...position,
           transform: `scale(${position.scale || 1})`,
           transformOrigin: position.transformOrigin 
        } : undefined}
      >
        
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100/50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="bg-primary/5 p-2 rounded-xl text-primary shadow-sm border border-primary/10">
              <MessageSquare size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] leading-none">Task Discussion</h3>
              <p className="text-[9px] text-gray-400 font-bold truncate max-w-[200px] mt-1 uppercase tracking-tight">
                {task.title}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>


        {/* Discussion Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-5 scroll-smooth bg-[#fafbfc] custom-scrollbar-premium"
        >
          {isLoading ? (
            <div className="h-full flex items-center justify-center opacity-30"><Loader2 className="animate-spin text-primary" size={32} /></div>
          ) : comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-10">
              <MessageSquare size={64} />
              <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Zero Activity</p>
            </div>
          ) : (
            comments.map((comment, index) => {
              const isMe = comment.userId === uid;
              const avatar = getAvatarUrl(comment.authorData?.profilePhoto);
              const showName = index === 0 || comments[index - 1].userId !== comment.userId;
              
              return (
                <div 
                  id={`comment-${comment._id}`}
                  key={comment._id} 
                  className={`flex w-full gap-3 items-end justify-start animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className="shrink-0 mb-1 mr-2.5">
                    <img 
                      src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorData?.name || 'U')}&background=random`} 
                      alt="" 
                      className="w-9 h-9 rounded-xl border-2 border-white shadow-sm object-cover bg-white ring-1 ring-gray-100"
                    />
                  </div>

                  <div className="max-w-[85%] flex flex-col items-start min-w-0">
                    {showName && (
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] ml-1 mb-1 text-primary">
                        {isMe ? 'You' : comment.authorData?.name}
                        {comment.authorData?.role && <span className="ml-2 opacity-50 font-bold">• {comment.authorData.role}</span>}
                      </span>
                    )}

                    <div 
                      onContextMenu={(e) => handleContextMenu(e, comment)}
                      onClick={(e) => {
                        if (window.matchMedia('(max-width: 768px)').matches) {
                          handleContextMenu(e, comment);
                        }
                      }}
                      className={`
                        px-4 py-2.5 rounded-[1.25rem] text-[12.5px] leading-relaxed shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative transition-all min-w-0 group/msg cursor-pointer
                        ${isMe 
                          ? 'bg-primary text-white rounded-bl-none shadow-primary/5' 
                          : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                        }
                        break-words [word-break:break-word] [overflow-wrap:anywhere] whitespace-pre-wrap font-medium active:scale-[0.98] w-full
                      `}
                    >
                      {comment.parentData && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToComment(comment.parentCommentId);
                          }}
                          className={`mb-3 p-2.5 rounded-2xl border-l-[4px] flex flex-col gap-1 min-w-[140px] max-w-full cursor-pointer hover:brightness-95 transition-all ${
                          isMe 
                            ? 'bg-white/10 border-white/40 text-white/90' 
                            : 'bg-gray-50 border-accent text-gray-500'
                        }`}
                        >
                          <span className={`text-[9px] font-black uppercase tracking-tighter ${isMe ? 'text-white' : 'text-accent'}`}>
                            {comment.parentData.authorData?.name || 'User'}
                          </span>
                          <p className="text-[11px] truncate italic opacity-80 leading-tight font-bold">
                            {comment.parentData.comment}
                          </p>
                        </div>
                      )}
                      {comment.comment}
                    </div>

                    <span className="text-[9px] font-black text-gray-400 mt-1.5 px-2 opacity-50 uppercase tracking-tighter">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply Strip */}
        {replyTo && (
          <div className="px-6 py-3 bg-accent/5 border-t border-accent/10 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-1.5 bg-accent/20 rounded-lg text-accent">
                <Reply size={14} />
              </div>
              <p className="text-[11px] text-gray-600 font-bold truncate">
                Replying to <span className="text-accent underline underline-offset-2 tracking-tight capitalize">{replyTo.authorData?.name}</span>
              </p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-all"><X size={14} /></button>
          </div>
        )}

        {/* Input Footer */}
        <div className="p-5 pt-3 border-t border-gray-100/50 bg-white">
          {!canComment ? (
            <div className="text-center py-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100 flex flex-col gap-1 items-center">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Read Only Protocol</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea 
                  ref={inputRef}
                  rows="2"
                  placeholder="Share an update..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                    if (e.key === 'Escape' && replyTo) setReplyTo(null);
                  }}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary text-[13px] transition-all resize-none font-medium custom-scrollbar-premium"
                />
              </div>
              <button 
                disabled={commentMutation.isPending || !message.trim()} 
                type="submit" 
                className={`
                  p-3.5 rounded-xl transition-all shadow-lg
                  ${!message.trim() 
                    ? 'bg-gray-100 text-gray-300 grayscale opacity-50' 
                    : 'bg-primary text-white shadow-primary/10 hover:translate-y-[-1px] active:translate-y-[0]'
                }
                `}
              >
                {commentMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </form>
          )}
          <div className="mt-3 text-center">
             <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">
               {window.matchMedia('(max-width: 768px)').matches ? 'Tap for options' : 'Right-click for options'}
             </p>
          </div>
        </div>

      </div>

      {/* Action Menu (Moved outside transformed container to fix positioning) */}
      {contextMenu && (() => {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        return (
          <div 
            id="task-comment-action-menu"
            className={`fixed z-[100] bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl p-1 min-w-[170px] animate-in duration-200 action-menu-container 
              ${isMobile 
                ? 'bottom-4 left-4 right-4 rounded-[2rem] fade-in slide-in-from-bottom-5' 
                : 'rounded-2xl fade-in zoom-in-95'
              }`}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
            style={!isMobile ? { 
              left: contextMenu.x, 
              top: contextMenu.y,
              transform: `translate(${
                contextMenu.x + 170 > window.innerWidth ? '-100%' : '0'
              }, ${
                contextMenu.y + 200 > window.innerHeight ? '-100%' : '0'
              })`
            } : {}}
          >
            {isMobile && <div className="w-10 h-1 bg-gray-100 rounded-full mx-auto my-2 mb-1" />}
            <div className="flex flex-col gap-0.5">
              <button 
                onClick={() => { setReplyTo(contextMenu.comment); setContextMenu(null); inputRef.current?.focus(); }}
                className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-primary/5 text-gray-700 hover:text-primary rounded-xl transition-all text-[12px] font-semibold group"
              >
                <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-primary/10 transition-colors">
                  <Reply size={14} />
                </div>
                Reply
              </button>
              {(contextMenu.comment.userId === uid || isAdmin) && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!confirmDelete) {
                      setConfirmDelete(true);
                    } else {
                      deleteMutation.mutate(contextMenu.comment._id);
                      setContextMenu(null);
                      setConfirmDelete(false);
                    }
                  }}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-[12px] font-semibold group ${
                    confirmDelete ? 'bg-red-500 text-white hover:bg-red-600' : 'hover:bg-red-50 text-red-500'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    confirmDelete ? 'bg-white/20' : 'bg-red-50 group-hover:bg-red-100 text-red-600'
                  }`}>
                    {confirmDelete ? <AlertCircle size={14} /> : <Trash2 size={14} />}
                  </div>
                  {confirmDelete ? 'Confirm Delete?' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
