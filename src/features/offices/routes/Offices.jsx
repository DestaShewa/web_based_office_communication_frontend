import React from 'react';
import OfficeTable from '../components/OfficeTable';

export default function Offices() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Office Management</h2>
        <p className="text-gray-500">Manage standalone administrative units like Finance, Registrar, and HR.</p>
      </div>
      <OfficeTable />
    </div>
  );
}
