import React from 'react';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';

export default function Messages() {
  return (
    <div className="flex h-[calc(100vh-7rem)] md:h-[calc(100vh-10rem)] bg-white sm:rounded-2xl shadow-xl sm:border border-gray-100 overflow-hidden w-full max-w-full">
      <ChatSidebar />
      <ChatWindow />
    </div>
  );
}
