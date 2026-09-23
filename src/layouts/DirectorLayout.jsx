import { useState, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, ListChecks,
  Bell, MessageSquare, Menu, X, Calendar, ShieldCheck, Key, FileText, Mail
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import SocketManager from '../components/SocketManager';
import ConfirmDialog from '../components/ConfirmDialog';
import ActionMenu from '../components/ActionMenu';
import ProfileModal from '../features/messages/components/ProfileModal';
import EditEmailModal from '../features/users/components/EditEmailModal';
import { getAvatarUrl } from '../features/messages/utils/statusUtils';
import NotificationBadge from '../components/NotificationBadge';
import MessageBadge from '../components/MessageBadge';
import SecurityReminder from '../components/SecurityReminder';

export default function DirectorLayout() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isEditEmailOpen, setIsEditEmailOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTriggerRect, setProfileTriggerRect] = useState(null);
  const actionMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Overview', path: '/director', icon: <LayoutDashboard size={20} /> },
    { name: 'Tasks', path: '/director/tasks', icon: <ListChecks size={20} /> },
    { name: 'Announcements', path: '/director/announcements', icon: <Bell size={20} /> },
    { name: 'Meetings', path: '/director/meetings', icon: <Calendar size={20} /> },
    { name: 'Messages', path: '/director/messages', icon: <MessageSquare size={20} /> },
    { name: 'Official Memos', path: '/director/memos', icon: <FileText size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-primary font-roboto relative">
      <SocketManager />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white border-r border-gray-200 flex flex-col h-full shadow-lg transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-primary text-white">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AMITCS Logo" className="h-8 w-8 rounded-full object-contain" />
            <h1 className="text-xl font-bold tracking-tight">AMITCS</h1>
          </div>
          <button className="md:hidden text-white hover:text-accent transition-colors" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.path === '/director'}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors font-medium text-sm ${isActive
                  ? 'bg-accent/20 text-primary border-l-4 border-primary shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-primary border-l-4 border-transparent'
                }`
              }
            >
              {link.icon}
              {link.name}
              {link.name === 'Messages' && <MessageBadge />}
            </NavLink>
          ))}
        </nav>

        {/* User Quick Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="truncate w-full pr-2">
            <p className="text-sm font-semibold truncate text-primary">{user?.name || 'Director'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || 'director@amitcs.com'}</p>
          </div>
          <div className="shrink-0" ref={actionMenuRef}>
            <ActionMenu
              actions={[
                {
                  label: 'Edit Email',
                  icon: <Mail size={16} />,
                  onClick: () => setIsEditEmailOpen(true)
                },
                {
                  label: 'Change Password',
                  icon: <Key size={16} />,
                  onClick: () => navigate('/change-password')
                },
                {
                  label: 'Sign Out',
                  icon: <LogOut size={16} />,
                  variant: 'danger',
                  onClick: () => setIsLogoutModalOpen(true)
                }
              ]}
            />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full md:w-0">
        <SecurityReminder />
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 shadow-sm z-10 w-full shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-lg font-bold text-primary truncate leading-tight">
                Director Portal
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-accent uppercase tracking-widest truncate">
                Institutional Oversight
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationBadge />
            <button
              onClick={(e) => {
                setProfileTriggerRect(e.currentTarget.getBoundingClientRect());
                setShowProfileModal(true);
              }}
              className="h-8 w-8 sm:h-9 sm:w-9 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner uppercase shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent transition-all"
            >
              {user?.profilePhoto ? (
                <img src={getAvatarUrl(user.profilePhoto)} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'D'
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative w-full">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        isOpen={isLogoutModalOpen}
        title="Sign Out"
        message="Are you sure you want to end your session? You will need to log back in to access the portal."
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
        confirmText="Sign Out"
        confirmColor="danger"
        triggerRect={actionMenuRef.current?.getBoundingClientRect()}
      />

      <EditEmailModal
        isOpen={isEditEmailOpen}
        onClose={() => setIsEditEmailOpen(false)}
      />

      {showProfileModal && (
        <ProfileModal
          user={user}
          triggerRect={profileTriggerRect}
          onClose={() => {
            setShowProfileModal(false);
            setProfileTriggerRect(null);
          }}
        />
      )}
    </div>
  );
}
