import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell, Check, Clock, ShieldAlert, Mail } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs/esm/index.js';
import relativeTime from 'dayjs/esm/plugin/relativeTime/index.js';
import { 
  getMyNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../features/dashboard/api/notifications';
import { getAvatarUrl } from '../features/messages/utils/statusUtils';
import useAuthStore from '../store/authStore';

dayjs.extend(relativeTime);

export default function NotificationDropdown({ unreadCount }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [hoveredNotification, setHoveredNotification] = React.useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => getMyNotifications({ limit: 10 }),
    refetchOnWindowFocus: true,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.data?.notifications || [];
  const { user } = useAuthStore();

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markReadMutation.mutateAsync(notification.customId || notification._id);
    }
    
    if (notification.link) {
      let targetLink = notification.link;
      
      if (notification.type === 'PASSWORD_RESET_REQUEST') {
        targetLink = '/admin/users?tab=requests';
      } else if (targetLink.startsWith('/meetings') && user?.role) {
        const parts = targetLink.split('/');
        const id = parts[parts.length - 1];
        targetLink = `/${user.role}/meetings?highlight=${id}`;
      } else if (targetLink.startsWith('/announcements') && user?.role) {
        targetLink = `/${user.role}${targetLink}`;
      } else if (targetLink.startsWith('/tasks') && user?.role) {
        targetLink = `/${user.role}${targetLink}`;
      }
      
      navigate(targetLink);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'NEW_ANNOUNCEMENT': return <Bell size={16} className="text-blue-500" />;
      case 'PASSWORD_RESET_REQUEST': return <ShieldAlert size={16} className="text-red-500" />;
      case 'MESSAGE_RECEIVED': return <Mail size={16} className="text-green-500" />;
      default: return <Bell size={16} className="text-gray-400" />;
    }
  };

  const getFullIcon = (type) => {
    switch (type) {
      case 'NEW_ANNOUNCEMENT': return <Bell size={24} className="text-blue-500" />;
      case 'PASSWORD_RESET_REQUEST': return <ShieldAlert size={24} className="text-red-500" />;
      case 'MESSAGE_RECEIVED': return <Mail size={24} className="text-green-500" />;
      case 'TASK_ASSIGNED': return <Clock size={24} className="text-orange-500" />;
      default: return <Bell size={24} className="text-primary" />;
    }
  };

  return (
    <DropdownMenu.Root onOpenChange={(open) => !open && setHoveredNotification(null)}>
      <DropdownMenu.Trigger asChild>
        <button className="relative p-2 text-gray-500 hover:text-primary transition-all group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full">
          <Bell size={22} className="group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white border-2 border-white animate-in zoom-in duration-300">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          className="z-50 w-80 sm:w-96 bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-gray-100 animate-in fade-in zoom-in-95 duration-200 origin-top-right mt-2 mr-2"
          align="end"
          sideOffset={5}
          style={{ overflow: 'visible' }}
        >
          {/* Notification Preview Card (Desktop Only) */}
          {hoveredNotification && (
            <div className="hidden lg:block absolute top-0 right-[calc(100%+12px)] w-80 bg-white rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 z-[60]">
              <div className={`h-1.5 w-full bg-gradient-to-r ${
                hoveredNotification.type === 'PASSWORD_RESET_REQUEST' ? 'from-red-500 to-red-400' : 'from-primary to-accent'
              }`} />
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    {getFullIcon(hoveredNotification.type)}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 px-2 py-1 bg-gray-50 rounded-md">
                    {hoveredNotification.type?.replace(/_/g, ' ')}
                  </span>
                </div>

                <h4 className="text-lg font-black text-primary leading-tight mb-3">
                  {hoveredNotification.title}
                </h4>
                
                <p className="text-sm text-gray-600 leading-relaxed font-medium mb-6">
                  {hoveredNotification.message}
                </p>

                <div className="flex items-center justify-between pt-5 border-t border-gray-50">
                   <div className="flex items-center gap-2">
                     {hoveredNotification.sender?.profilePhoto ? (
                       <img src={getAvatarUrl(hoveredNotification.sender.profilePhoto)} className="w-6 h-6 rounded-full border border-gray-100" alt="" />
                     ) : (
                       <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                         {hoveredNotification.sender?.name?.charAt(0) || 'S'}
                       </div>
                     )}
                     <span className="text-[10px] font-bold text-gray-500 truncate max-w-[100px]">
                       {hoveredNotification.sender?.name || 'System'}
                     </span>
                   </div>
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary/40">
                     <Clock size={12} strokeWidth={3} />
                     {dayjs(hoveredNotification.createdAt).fromNow()}
                   </div>
                </div>
              </div>

              <div className="bg-gray-50/50 p-4 text-center">
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                   Institutional Messaging Security
                 </p>
              </div>
            </div>
          )}

          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
            <h3 className="font-bold text-primary flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-black">
                  {unreadCount} NEW
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs font-black text-primary hover:text-accent transition-colors flex items-center gap-1 disabled:opacity-50 uppercase tracking-tighter"
              >
                <Check size={14} strokeWidth={3} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto rounded-b-xl">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm italic">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                   <Bell size={24} />
                </div>
                <p className="text-gray-500 text-sm">All caught up! No notifications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => (
                  <DropdownMenu.Item
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    onMouseEnter={() => setHoveredNotification(notification)}
                    onMouseLeave={() => setHoveredNotification(null)}
                    className={`p-4 flex gap-3 cursor-pointer transition-all outline-none relative group ${
                        !notification.isRead ? 'bg-accent/5 hover:bg-accent/10 border-l-4 border-primary' : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                  >
                    <div className="shrink-0 pt-1">
                      {notification.sender?.profilePhoto ? (
                        <img 
                          src={getAvatarUrl(notification.sender.profilePhoto)} 
                          className="w-10 h-10 rounded-full object-cover shadow-sm bg-gray-100 group-hover:scale-105 transition-transform" 
                          alt="" 
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm transition-transform group-hover:scale-105 ${
                          notification.type === 'PASSWORD_RESET_REQUEST' ? 'bg-red-500' : 'bg-primary'
                        }`}>
                          {getIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-bold truncate ${!notification.isRead ? 'text-primary' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                        <Clock size={10} strokeWidth={3} />
                        {dayjs(notification.createdAt).fromNow()}
                      </div>
                    </div>
                  </DropdownMenu.Item>
                ))}
              </div>
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
