/**
 * Shared utility for handling user status display and coloring.
 */

export const MOOD_CONFIG = {
  'Available': {
    color: 'green',
    bg: 'bg-green-500',
    text: 'text-green-500',
    headerBg: 'bg-green-50'
  },
  'Busy': {
    color: 'red',
    bg: 'bg-red-500',
    text: 'text-red-500',
    headerBg: 'bg-red-50'
  },
  'Do Not Disturb': {
    color: 'red',
    bg: 'bg-red-500',
    text: 'text-red-500',
    headerBg: 'bg-red-50'
  },
  'In a Meeting': {
    color: 'orange',
    bg: 'bg-orange-500',
    text: 'text-orange-500',
    headerBg: 'bg-orange-50'
  }
};

import useAuthStore from '../../../store/authStore';

import { SOCKET_URL } from '../../../lib/config';

/**
 * Resolves the full URL for a resource (profile photo, voice message, file).
 * Dynamically handles 'localhost' vs Network IP access.
 */
export const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const token = useAuthStore.getState().token;
  
  return `${SOCKET_URL}${cleanPath}?token=${token}`;
};

/**
 * Alias for getFullUrl specifically for avatars (kept for compatibility)
 */
export const getAvatarUrl = (path) => getFullUrl(path);

/**
 * Normalizes mood string to match MOOD_CONFIG keys (case-insensitive)
 */
const normalizeMood = (mood) => {
  if (!mood || mood === 'null') return 'Available';
  
  const normalized = mood.toLowerCase();
  const foundKey = Object.keys(MOOD_CONFIG).find(key => key.toLowerCase() === normalized);
  return foundKey || 'Available';
};

/**
 * Returns the status to display based on online presence.
 */
export const getDisplayStatus = (mood, isOnline) => {
  if (!isOnline) return 'Offline';
  return normalizeMood(mood);
};

/**
 * Returns the color class (bg or text) for a given mood and online state.
 */
export const getStatusColor = (mood, isOnline, type = 'bg') => {
  // IF OFFLINE: Force Gray regardless of mood
  if (!isOnline) return type === 'bg' ? 'bg-gray-300' : 'text-gray-400';
  
  const status = normalizeMood(mood);
  const config = MOOD_CONFIG[status] || MOOD_CONFIG['Available'];
  
  return config[type];
};
