import React from 'react';
import MeetingTable from '../components/MeetingTable';

export default function DeanMeetings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Faculty Meetings</h2>
        <p className="text-gray-500">Schedule meetings across the faculty.</p>
      </div>
      <MeetingTable view="all" />
    </div>
  );
}
