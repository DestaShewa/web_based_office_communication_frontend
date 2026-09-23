import React from 'react';
import AnnouncementTable from '../components/AnnouncementTable';

export default function DeanAnnouncements() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Announcements</h2>
        <p className="text-gray-500">View important institutional broadcasts.</p>
      </div>
      <AnnouncementTable />
    </div>
  );
}
