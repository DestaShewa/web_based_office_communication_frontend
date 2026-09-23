import React from 'react';
import UserTable from '../components/UserTable';
import { Users as UsersIcon } from 'lucide-react';

export default function Users() {
  return (
    <div className="space-y-6 font-roboto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">System User Control</h2>
          <p className="text-gray-500 text-sm">Oversee institutional accounts and assigned roles.</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg self-start">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold bg-white text-primary shadow-sm">
            <UsersIcon size={16} /> Directory
          </div>
        </div>
      </div>

      <UserTable />
    </div>
  );
}
