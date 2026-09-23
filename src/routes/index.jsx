import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../features/auth/routes/Login';
import ForgotPassword from '../features/auth/routes/ForgotPassword';
import ChangePassword from '../features/auth/routes/ChangePassword';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import AdminOverview from '../features/dashboard/routes/AdminOverview';
import Users from '../features/users/routes/Users';
import Departments from '../features/departments/routes/Departments';
import Tasks from '../features/tasks/routes/Tasks';
import Announcements from '../features/announcements/routes/Announcements';
import AuditLogs from '../features/audit/routes/AuditLogs';
import Messages from '../features/messages/routes/Messages';
import Settings from '../features/settings/routes/Settings';
import Meetings from '../features/meetings/routes/Meetings';
import Institutes from '../features/institutes/routes/Institutes';
import Faculties from '../features/faculties/routes/Faculties';
import AuthLayout from '../layouts/AuthLayout';
import MemoPortal from '../features/memos/routes/MemoPortal';
import MemoRedirect from '../components/MemoRedirect';
import Offices from '../features/offices/routes/Offices';

import StaffLayout from '../layouts/StaffLayout';
import StaffOverview from '../features/dashboard/routes/StaffOverview';
import StaffTasks from '../features/tasks/routes/StaffTasks';
import StaffMeetings from '../features/meetings/routes/StaffMeetings';

import CoordinatorLayout from '../layouts/CoordinatorLayout';
import CoordinatorOverview from '../features/dashboard/routes/CoordinatorOverview';
import CoordinatorTasks from '../features/tasks/routes/CoordinatorTasks';
import CoordinatorAnnouncements from '../features/announcements/routes/CoordinatorAnnouncements';
import CoordinatorMeetings from '../features/meetings/routes/CoordinatorMeetings';

import DeanLayout from '../layouts/DeanLayout';
import DeanOverview from '../features/dashboard/routes/DeanOverview';
import DeanTasks from '../features/tasks/routes/DeanTasks';
import DeanAnnouncements from '../features/announcements/routes/DeanAnnouncements';
import DeanMeetings from '../features/meetings/routes/DeanMeetings';

import DirectorLayout from '../layouts/DirectorLayout';
import DirectorOverview from '../features/dashboard/routes/DirectorOverview';
import DirectorTasks from '../features/tasks/routes/DirectorTasks';
import DirectorAnnouncements from '../features/announcements/routes/DirectorAnnouncements';
import DirectorMeetings from '../features/meetings/routes/DirectorMeetings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: 'change-password',
        element: <ChangePassword />,
      },
      {
        path: 'memos/:memoId',
        element: <MemoRedirect />,
      }
    ]
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        path: '',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminOverview /> },
          { path: 'users', element: <Users /> },
          { path: 'institutes', element: <Institutes /> },
          { path: 'faculties', element: <Faculties /> },
          { path: 'departments', element: <Departments /> },
          { path: 'offices', element: <Offices /> },

          { path: 'announcements', element: <Announcements /> },
          { path: 'messages', element: <Messages /> },
          { path: 'audit', element: <AuditLogs /> },
          { path: 'settings', element: <Settings /> },
        ]
      }
    ]
  },
  {
    path: '/staff',
    element: <ProtectedRoute allowedRoles={['staff']} />,
    children: [
      {
        path: '',
        element: <StaffLayout />,
        children: [
          { index: true, element: <StaffOverview /> },
          { path: 'tasks', element: <StaffTasks /> },
          { path: 'announcements', element: <Announcements /> },
          { path: 'meetings', element: <StaffMeetings /> },
          { path: 'messages', element: <Messages /> },
        ]
      }
    ]
  },
  {
    path: '/coordinator',
    element: <ProtectedRoute allowedRoles={['coordinator']} />,
    children: [
      {
        path: '',
        element: <CoordinatorLayout />,
        children: [
          { index: true, element: <CoordinatorOverview /> },
          { path: 'tasks', element: <CoordinatorTasks /> },
          { path: 'announcements', element: <CoordinatorAnnouncements /> },
          { path: 'meetings', element: <CoordinatorMeetings /> },
          { path: 'messages', element: <Messages /> },
          { path: 'memos', element: <MemoPortal /> },
        ]
      }
    ]
  },
  {
    path: '/dean',
    element: <ProtectedRoute allowedRoles={['dean']} />,
    children: [
      {
        path: '',
        element: <DeanLayout />,
        children: [
          { index: true, element: <DeanOverview /> },
          { path: 'tasks', element: <DeanTasks /> },
          { path: 'announcements', element: <DeanAnnouncements /> },
          { path: 'meetings', element: <DeanMeetings /> },
          { path: 'messages', element: <Messages /> },
          { path: 'memos', element: <MemoPortal /> },
        ]
      }
    ]
  },
  {
    path: '/director',
    element: <ProtectedRoute allowedRoles={['director']} />,
    children: [
      {
        path: '',
        element: <DirectorLayout />,
        children: [
          { index: true, element: <DirectorOverview /> },
          { path: 'dashboard', element: <Navigate to="/director" replace /> },
          { path: 'tasks', element: <DirectorTasks /> },
          { path: 'announcements', element: <DirectorAnnouncements /> },
          { path: 'meetings', element: <DirectorMeetings /> },
          { path: 'messages', element: <Messages /> },
          { path: 'memos', element: <MemoPortal /> },
        ]
      }
    ]
  }
]);
