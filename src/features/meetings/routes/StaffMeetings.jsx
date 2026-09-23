import React from 'react';
import MeetingTable from '../components/MeetingTable';

export default function StaffMeetings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Meetings</h2>
        <p className="text-gray-500">View meetings you are scheduled to attend.</p>
      </div>
      <MeetingTable view="mine" />
    </div>
  );
}
