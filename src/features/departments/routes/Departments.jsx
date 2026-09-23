import React from 'react';
import DepartmentTable from '../components/DepartmentTable';

export default function Departments() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Department Management</h2>
        <p className="text-gray-500">Organize company structures and base departments.</p>
      </div>
      <DepartmentTable />
    </div>
  );
}
