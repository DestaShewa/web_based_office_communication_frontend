import React from 'react';
import AnnouncementTable from '../components/AnnouncementTable';

export default function Announcements() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">System Announcements</h2>
        <p className="text-gray-500">Broadcast messages across the entire organization.</p>
      </div>
      <AnnouncementTable />
    </div>
  );
}
