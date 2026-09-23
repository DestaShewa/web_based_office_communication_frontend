import React from 'react';
import AnnouncementTable from '../components/AnnouncementTable';

export default function CoordinatorAnnouncements() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Corporate Announcements</h2>
        <p className="text-gray-500">Review communications or post mandates across the institution.</p>
      </div>
      <AnnouncementTable />
    </div>
  );
}
