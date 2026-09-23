import React from 'react';
import MeetingTable from '../components/MeetingTable';

export default function DirectorMeetings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Team Meetings</h2>
        <p className="text-gray-500">Schedule and track meetings across the institution.</p>
      </div>
      <MeetingTable view="all" />
    </div>
  );
}
