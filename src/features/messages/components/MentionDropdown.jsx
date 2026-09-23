import React, { useEffect, useState, useRef } from 'react';
import { getAvatarUrl } from '../utils/statusUtils';
import { searchUsersByNameOrUsername } from '../api/searchUsers';
import { Loader2 } from 'lucide-react';

export default function MentionDropdown({ query, onSelect, position }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);

  // Debounced search
  useEffect(() => {
    setSelectedIndex(0);
    if (!query || query.length === 0) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchUsersByNameOrUsername(query);
        setUsers(results);
      } catch (err) {
        console.error('Mention search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation listener from parent
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (users.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % users.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        onSelect(users[selectedIndex]?.username);
      }
    };

    // Attach to document to listen to global chat input events while dropdown is open
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [users, selectedIndex, onSelect]);

  // Scroll active item into view
  useEffect(() => {
    if (containerRef.current && users.length > 0) {
      const activeEl = containerRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, users]);

  if (!query || (users.length === 0 && !isLoading)) return null;

  return (
    <div 
      className="absolute z-50 w-64 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2"
      style={{
        bottom: position?.bottom || '100%',
        left: position?.left || 0,
        marginBottom: '10px'
      }}
    >
      {isLoading && users.length === 0 ? (
        <div className="p-4 flex items-center justify-center text-gray-400">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : (
        <ul ref={containerRef} className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
          {users.map((user, index) => (
            <li 
              key={user.customId}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => onSelect(user.username)}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                index === selectedIndex ? 'bg-primary/5' : 'hover:bg-gray-50'
              }`}
            >
              <img 
                src={getAvatarUrl(user.profilePhoto) || '/default-avatar.png'} 
                alt={user.name} 
                className="w-8 h-8 rounded-full object-cover shrink-0" 
                onError={(e) => { e.target.src = '/default-avatar.png'; }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-gray-800 truncate">{user.name}</span>
                <span className="text-xs text-primary font-medium truncate">@{user.username}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
