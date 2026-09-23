import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConversations } from '../api/getMessages';
import { getUsers } from '../../users/api/getUsers';
import { getDepartments } from '../../departments/api/getDepartments';
import { Search, MessageCircle, Users, MoreVertical, Contact } from 'lucide-react';
import useChatStore from '../../../store/chatStore';
import useAuthStore from '../../../store/authStore';
import ProfileModal from './ProfileModal';
import CreateGroupModal from './CreateGroupModal';
import { getStatusColor, getAvatarUrl } from '../utils/statusUtils';
import { getGroups } from '../api/getMessages';

export default function ChatSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [profileModalUser, setProfileModalUser] = useState(null);
  const [profileModalRect, setProfileModalRect] = useState(null);
  const { 
    conversations, 
    setConversations, 
    activeConversation, 
    setActiveConversation,
    onlineUsers,
    userStatuses
  } = useChatStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'directory'
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [createGroupRect, setCreateGroupRect] = useState(null);

  const isDean = user?.role === 'dean';
  const isDirectorOrAdmin = user?.role === 'director' || user?.role === 'admin';

  // Fetch recent conversations
  const { isLoading: convsLoading } = useQuery({
    queryKey: ['v1', 'conversations'],
    queryFn: async () => {
      const data = await getConversations();
      setConversations(data.data.conversations);
      return data.data.conversations;
    },
    refetchInterval: 30000, // Refresh list every 30s
    retry: false,
  });

  // Fetch users for search OR directory
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', searchTerm, activeTab],
    queryFn: () => getUsers({ 
      search: searchTerm, 
      limit: activeTab === 'directory' ? 50 : 10,
      purpose: 'messaging'
    }),
    enabled: searchTerm.length > 2 || activeTab === 'directory',
  });

  // For Deans: fetch departments in their faculty to show multiple group chats
  const { data: deanDepartmentsData } = useQuery({
    queryKey: ['departments', 'dean-faculty', user?.faculty],
    queryFn: () => getDepartments({ limit: 100 }),
    enabled: isDean && !!user?.faculty,
    select: (data) => {
      const depts = data?.data?.departments || [];
      // Filter to only departments belonging to this dean's faculty
      const facultyId = typeof user?.faculty === 'object' ? user?.faculty?.customId : user?.faculty;
      return depts.filter(d => {
        const dFaculty = typeof d.faculty === 'object' ? d.faculty?.customId : d.faculty;
        return dFaculty === facultyId;
      });
    },
  });

  const deanDepartments = deanDepartmentsData || [];

  // Fetch custom groups
  const { data: groupsData } = useQuery({
    queryKey: ['groups', 'my-groups'],
    queryFn: getGroups,
    refetchInterval: 30000,
  });

  const myGroups = groupsData?.data?.groups || [];

  const searchResults = (usersData?.data?.users || []).filter(
    u => u.customId !== user?.customId && u._id !== user?._id
  );

  return (
    <div className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-gray-100 flex-col h-full bg-white z-20 ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-4 md:p-5 border-b border-gray-50 bg-gray-50/30">
        <h2 className="text-xl md:text-2xl font-bold text-primary mb-3 md:mb-5">Messages</h2>
        
        <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
          <button 
            onClick={() => setActiveTab('chats')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'chats' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <MessageCircle size={14} /> Chats
          </button>
          <button 
            onClick={() => setActiveTab('directory')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'directory' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Users size={14} /> Directory
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search contacts..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {searchTerm.length > 2 ? (
          <div className="p-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest p-2 mb-1">Search Results</p>
            {usersLoading ? (
               <div className="p-4 text-center text-xs text-gray-400">Searching...</div>
            ) : searchResults.length === 0 ? (
               <div className="p-4 text-center text-xs text-gray-400">No users found.</div>
            ) : (
              searchResults.map(user => (
                <button 
                  key={user.customId}
                  onClick={() => { setActiveConversation(user); setSearchTerm(''); }}
                  className="w-full flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl hover:bg-accent/5 transition-all text-left"
                >
                  <div className="relative shrink-0">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setProfileModalRect(e.currentTarget.getBoundingClientRect());
                        setProfileModalUser(user); 
                      }}
                      className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary overflow-hidden border border-transparent hover:border-gray-200 transition-colors"
                    >
                      {user.profilePhoto ? (
                        <img src={getAvatarUrl(user.profilePhoto)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.name?.charAt(0) || 'U'
                      )}
                    </button>
                    {onlineUsers.includes(user.customId) && (
                       <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-primary truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-500 truncate uppercase tracking-tight">{user.role}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : activeTab === 'directory' ? (
          <div className="p-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest p-2 mb-1">All Users</p>
            {usersLoading ? (
               <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <div className="animate-spin mb-2 border-2 border-accent border-t-transparent rounded-full w-6 h-6"></div>
                  <p className="text-xs">Loading directory...</p>
               </div>
            ) : searchResults.length === 0 ? (
               <div className="p-4 text-center text-xs text-gray-400">No users found in directory.</div>
            ) : (
              searchResults.map(user => (
                <div 
                  key={user.customId}
                  onClick={() => setActiveConversation(user)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left mb-1 cursor-pointer border ${
                    activeConversation?.customId === user.customId 
                    ? 'bg-gray-100 border-gray-200 shadow-sm' 
                    : 'hover:bg-gray-50 border-transparent text-primary'
                  }`}
                >
                  <div className="relative shrink-0">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setProfileModalRect(e.currentTarget.getBoundingClientRect());
                        setProfileModalUser(user); 
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden border border-transparent hover:border-gray-200 transition-colors ${
                       activeConversation?.customId === user.customId ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-primary'
                    }`}>
                      {user.profilePhoto ? (
                        <img src={getAvatarUrl(user.profilePhoto)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.name?.charAt(0) || 'U'
                      )}
                    </button>
                    {onlineUsers.includes(user.customId) && (
                      <span className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(userStatuses[user.customId] || user.status, true, 'bg')} border-2 border-white rounded-full pointer-events-none`}></span>
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold truncate text-primary">{user.name}</p>
                    <p className="text-[10px] truncate uppercase tracking-tight text-gray-500">{user.role}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
             <div className="p-2">
             <div className="flex items-center justify-between px-2 mb-2">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-70">Recent Conversations</p>
               {(user?.role === 'dean' || user?.role === 'coordinator') && (
                 <button 
                  onClick={(e) => {
                    setCreateGroupRect(e.currentTarget.getBoundingClientRect());
                    setIsCreateGroupModalOpen(true);
                  }}
                  className="px-2 py-1 hover:bg-accent/10 rounded-lg text-accent transition-all flex items-center gap-1.5 border border-transparent hover:border-accent/20 group"
                  title="Create New Group"
                 >
                   <Users size={12} className="group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-black uppercase tracking-tighter">New Group</span>
                 </button>
               )}
             </div>

             <div className="space-y-1 overflow-y-auto max-h-full custom-scrollbar pr-1">
               {/* Custom Groups Section */}
               {myGroups.length > 0 && (
                 <div className="mb-4">
                   <div className="px-2 mb-1.5 flex items-center gap-2">
                     <div className="h-[1px] flex-1 bg-gray-100"></div>
                     <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Custom Groups</span>
                     <div className="h-[1px] flex-1 bg-gray-100"></div>
                   </div>
                   {myGroups.map(group => (
                     <button
                       key={group.customId}
                       onClick={() => setActiveConversation({
                         customId: group.customId,
                         name: group.name,
                         type: 'group',
                         createdBy: group.createdBy,
                         profilePhoto: group.profilePhoto
                       })}
                       className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left mb-1 group shadow-sm border ${
                         activeConversation?.customId === group.customId
                          ? 'bg-accent/10 border-accent/30' 
                          : 'bg-white hover:bg-gray-50 border-gray-100'
                       }`}
                     >
                       <div className="relative shrink-0">
                         <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold border-2 overflow-hidden ${
                           activeConversation?.customId === group.customId ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-primary/5 border-primary/10 text-primary'
                         }`}>
                           {group.profilePhoto ? <img src={getAvatarUrl(group.profilePhoto)} alt="" className="w-full h-full object-cover" /> : <Users size={20} />}
                         </div>
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-black truncate text-primary leading-tight">{group.name}</p>
                         <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                           {group.members?.length || 0} Members
                         </p>
                       </div>
                     </button>
                   ))}
                 </div>
               )}
               
               {/* Automated Department Rooms Section */}
               {(isDean || user?.department || (user?.departments && user.departments.length > 0)) && (
                 <div className="mb-4">
                    <div className="px-2 mb-1.5 flex items-center gap-2">
                     <div className="h-[1px] flex-1 bg-gray-100"></div>
                     <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Department Rooms</span>
                     <div className="h-[1px] flex-1 bg-gray-100"></div>
                   </div>
                   
                   {isDean ? (
                     deanDepartments.map(dept => (
                       <button
                         key={dept.customId}
                         onClick={() => setActiveConversation({
                           customId: dept.customId,
                           name: `${dept.name} Department`,
                           type: 'department'
                         })}
                         className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left mb-1 group shadow-sm border ${
                           activeConversation?.customId === dept.customId
                            ? 'bg-accent/10 border-accent/30' 
                            : 'bg-white hover:bg-gray-50 border-gray-100'
                         }`}
                       >
                         <div className="relative shrink-0">
                           <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold border-2 ${
                             activeConversation?.customId === dept.customId ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-gray-50 border-gray-100 text-gray-400'
                           }`}>
                             <Users size={20} />
                           </div>
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-black truncate text-primary leading-tight">{dept.name} Room</p>
                           <p className="text-[9px] font-bold uppercase tracking-widest text-accent mt-0.5">Official Channel</p>
                         </div>
                       </button>
                     ))
                   ) : (
                     (() => {
                       const allUserDepts = [];
                       if (user.department) allUserDepts.push(user.department);
                       if (user.departments) allUserDepts.push(...user.departments);
                       
                       const uniqueDepts = [];
                       const seen = new Set();
                       
                       allUserDepts.forEach(d => {
                         const id = d?.customId || d;
                         if (id && !seen.has(id)) {
                           seen.add(id);
                           uniqueDepts.push(d);
                         }
                       });

                       return uniqueDepts.map(dept => {
                         const deptId = dept?.customId || dept;
                         const deptName = dept?.name || (typeof dept === 'string' ? dept : 'Unknown');
                         
                         return (
                           <button 
                             key={deptId}
                             onClick={() => setActiveConversation({ 
                               customId: deptId, 
                               name: `${deptName} Department`, 
                               type: 'department' 
                             })}
                             className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left mb-1 group shadow-sm border ${
                               activeConversation?.customId === deptId
                               ? 'bg-accent/10 border-accent/30' 
                               : 'bg-white hover:bg-gray-50 border-gray-100'
                             }`}
                           >
                             <div className="relative shrink-0">
                               <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold border-2 ${
                                 activeConversation?.customId === deptId ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-gray-50 border-gray-100 text-gray-400'
                               }`}>
                                 <Users size={20} />
                               </div>
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="text-sm font-black truncate text-primary leading-tight">{deptName} Room</p>
                               <p className="text-[9px] font-bold uppercase tracking-widest text-accent mt-0.5">Official Channel</p>
                             </div>
                           </button>
                         );
                       });
                     })()
                   )}
                 </div>
               )}

                {/* Direct Messages Section */}
                <div className="mb-4">
                  <div className="px-2 mb-1.5 flex items-center gap-2">
                    <div className="h-[1px] flex-1 bg-gray-100"></div>
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Direct Messages</span>
                    <div className="h-[1px] flex-1 bg-gray-100"></div>
                  </div>

                  {convsLoading && conversations.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-8 text-gray-200">
                        <div className="animate-spin mb-2 border-2 border-accent border-t-transparent rounded-full w-5 h-5"></div>
                        <p className="text-[10px] font-black uppercase">Loading chats...</p>
                     </div>
                  ) : (conversations.length === 0) ? (
                     <div className="text-center py-8 px-6">
                        <MessageCircle size={24} className="mx-auto text-gray-100 mb-2" />
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">No direct chats yet</p>
                     </div>
                  ) : (
                    conversations
                      .filter(conv => conv.partner && conv.partner.customId !== user?.customId && conv.partner?._id !== user?._id)
                      .map(conv => (
                        <button 
                        key={conv.partner?.customId || conv._id}
                        onClick={() => conv.partner && setActiveConversation(conv.partner)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left mb-1 group border ${
                          activeConversation?.customId === conv.partner?.customId 
                          ? 'bg-gray-100 border-gray-200' 
                          : 'hover:bg-gray-50 border-transparent'
                        }`}
                      >
                        <div className="relative shrink-0">
                         <div
                           onClick={(e) => { 
                             if (!conv.partner) return;
                             e.stopPropagation(); 
                             setProfileModalRect(e.currentTarget.getBoundingClientRect());
                             setProfileModalUser(conv.partner); 
                           }}
                           className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-bold border-2 transition-colors hover:border-gray-300 bg-primary/5 border-transparent text-primary"
                         >
                            {conv.partner?.profilePhoto ? (
                              <img src={getAvatarUrl(conv.partner.profilePhoto)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              conv.partner?.name?.charAt(0) || 'U'
                            )}
                          </div>
                          {conv.partner && onlineUsers.includes(conv.partner.customId) && (
                             <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 ${getStatusColor(userStatuses[conv.partner.customId] || conv.partner.status, true, 'bg')} border-2 border-white rounded-full shadow-sm pointer-events-none`}></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <p className="text-sm font-bold truncate text-primary">
                             {conv.partner?.name}
                            </p>
                            <span className="text-[9px] shrink-0 font-bold text-gray-400 uppercase tracking-tighter">
                              {new Date(conv.lastMessage?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-[11px] truncate max-w-[120px] text-gray-500">
                              {conv.lastMessage?.isDeletedForEveryone ? '' : 
                               conv.lastMessage?.messageType === 'audio' ? '🎤 Voice message' : 
                               conv.lastMessage?.messageType === 'image' ? '📷 Photo' : 
                               conv.lastMessage?.messageType === 'file' ? '📁 File' : 
                               conv.lastMessage?.content}
                            </p>
                            {conv.unreadCount > 0 && activeConversation?.customId !== conv.partner?.customId && (
                               <span className="bg-accent text-white font-black text-[9px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-accent/20">
                                 {conv.unreadCount}
                               </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
             </div>
           </div>
        )}
        {isCreateGroupModalOpen && (
          <CreateGroupModal 
            onClose={() => {
              setIsCreateGroupModalOpen(false);
              setCreateGroupRect(null);
            }} 
            onSuccess={(group) => {
              setActiveConversation({
                customId: group.customId,
                name: group.name,
                type: 'group',
                createdBy: group.createdBy,
                profilePhoto: group.profilePhoto
              });
              setIsCreateGroupModalOpen(false);
            }}
            triggerRect={createGroupRect}
          />
        )}
      </div>

       {/* Profile Modal View */}
       {profileModalUser && (
         <ProfileModal 
           user={profileModalUser} 
           triggerRect={profileModalRect}
           onClose={() => {
             setProfileModalUser(null);
             setProfileModalRect(null);
           }} 
         />
       )}
     </div>
   );
}
