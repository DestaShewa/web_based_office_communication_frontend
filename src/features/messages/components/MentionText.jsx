import React, { useState } from 'react';
import ProfilePopup from './ProfilePopup';

export default function MentionText({ text, isMe }) {
  const [showPopup, setShowPopup] = useState(false);
  const [triggerRect, setTriggerRect] = useState(null);

  const handleClick = (e) => {
    e.stopPropagation();
    setTriggerRect(e.currentTarget.getBoundingClientRect());
    setShowPopup(true);
  };

  // Strip the '@' to get the username query
  const username = text.replace('@', '');

  return (
    <>
      <span 
        onClick={handleClick}
        className={`font-bold cursor-pointer transition-colors px-1 py-0.5 mx-0.5 rounded-md ${
          isMe 
            ? 'bg-white/20 text-white hover:bg-white/30' 
            : 'bg-primary/10 text-primary hover:bg-primary/20'
        }`}
      >
        {text}
      </span>
      {showPopup && (
        <ProfilePopup 
          username={username} 
          triggerRect={triggerRect} 
          onClose={() => setShowPopup(false)} 
        />
      )}
    </>
  );
}
