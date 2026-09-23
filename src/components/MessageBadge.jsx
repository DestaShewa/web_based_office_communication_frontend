import useChatStore from '../store/chatStore';

/**
 * MessageBadge reads globalUnreadCount directly from Zustand.
 * This is always live — updated synchronously by socket events —
 * so the badge reflects reality instantly on every page without
 * any HTTP round-trip or React Query observer dependency.
 */
export default function MessageBadge() {
  const globalUnreadCount = useChatStore((state) => state.globalUnreadCount);

  if (globalUnreadCount <= 0) return null;

  return (
    <span className="ml-auto inline-flex items-center justify-center bg-accent text-white font-bold text-[10px] px-1.5 py-0.5 min-w-[20px] rounded-full shadow-sm animate-in zoom-in duration-300">
      {globalUnreadCount > 99 ? '99+' : globalUnreadCount}
    </span>
  );
}
