import React from 'react';
import TaskTable from '../components/TaskTable';

export default function StaffTasks() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">My Assigned Tasks</h2>
        <p className="text-gray-500">Manage and update tasks assigned directly to you.</p>
      </div>
      <TaskTable view="mine" />
    </div>
  );
}
