import { useQuery } from '@tanstack/react-query';
import { getUnreadNotificationCount } from '../features/dashboard/api/notifications';
import NotificationDropdown from './NotificationDropdown';

export default function NotificationBadge() {
  const { data } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 10000, // Reduced to 10s for more aggressive recovery from socket drops
    staleTime: 5000,
  });

  const unreadCount = data?.data?.count || 0;

  return <NotificationDropdown unreadCount={unreadCount} />;
}
