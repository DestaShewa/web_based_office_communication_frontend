import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { searchUsersByNameOrUsername } from '../api/searchUsers';
import ProfileModal from './ProfileModal';

export default function ProfilePopup({ username, triggerRect, onClose }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const results = await searchUsersByNameOrUsername(username);
        const match = results.find(u => u.username === username);
        if (mounted) {
           if (match) {
             setUser(match);
           } else {
             toast.error('User not found');
             onClose();
           }
        }
      } catch (err) {
        if(mounted) {
          toast.error('Error loading profile');
          onClose();
        }
      } finally {
        if(mounted) setIsLoading(false);
      }
    };
    
    if (username) fetchUser();
    
    return () => { mounted = false; };
  }, [username, onClose]);

  if (isLoading) {
    return (
       <div 
         className="fixed z-50 p-3 bg-white rounded-xl shadow-xl flex items-center gap-3 border border-gray-100 animate-in fade-in" 
         style={{ top: triggerRect?.bottom || '50%', left: triggerRect?.left || '50%' }}
       >
         <Loader2 size={18} className="animate-spin text-primary" />
         <span className="text-sm font-medium text-gray-700">Loading profile...</span>
       </div>
    );
  }

  if (!user) {
    return null; 
  }

  return <ProfileModal user={user} triggerRect={triggerRect} onClose={onClose} />;
}
