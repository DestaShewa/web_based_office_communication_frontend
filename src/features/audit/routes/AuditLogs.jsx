import React from 'react';
import AuditTable from '../components/AuditTable';

export default function AuditLogs() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">System Audit Logs</h2>
        <p className="text-gray-500">Immutable trail of administrative and systemic mutations.</p>
      </div>
      <AuditTable />
    </div>
  );
}
