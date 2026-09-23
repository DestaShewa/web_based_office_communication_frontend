import React from 'react';
import MeetingTable from '../components/MeetingTable';
import useAuthStore from '../../../store/authStore';

export default function CoordinatorMeetings() {
  const { user } = useAuthStore();
  const unitLabel = user?.office ? 'Office' : 'Department';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">{unitLabel} Meetings</h2>
        <p className="text-gray-500">Schedule meetings across the {unitLabel.toLowerCase()}.</p>
      </div>
      <MeetingTable view={user?.office ? 'office' : 'department'} />
    </div>
  );
}
