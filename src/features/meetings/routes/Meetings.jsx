import React from 'react';
import MeetingTable from '../components/MeetingTable';

export default function Meetings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Departmental Meetings</h2>
        <p className="text-gray-500">Coordinate and monitor inter-departmental sessions and decisions.</p>
      </div>
      <MeetingTable />
    </div>
  );
}
