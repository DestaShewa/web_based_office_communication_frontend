import React from 'react';
import AssignerTaskTabs from '../components/AssignerTaskTabs';
import useAuthStore from '../../../store/authStore';

export default function CoordinatorTasks() {
  const { user } = useAuthStore();
  const unitLabel = user?.office ? 'Office' : 'Department';

  return (
    <AssignerTaskTabs
      title={`${unitLabel} Tasks`}
      subtitle={`Task delegation and member oversight across your ${unitLabel.toLowerCase()}.`}
    />
  );
}
