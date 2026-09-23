import React from 'react';
import TaskTable from '../components/TaskTable';

export default function Tasks() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">System Tasks</h2>
        <p className="text-gray-500">Monitor and manage global tasks across all departments.</p>
      </div>
      <TaskTable />
    </div>
  );
}
