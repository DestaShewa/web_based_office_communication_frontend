import React, { useState } from 'react';
import TaskTable from './TaskTable';
import { ClipboardList, Users, PenSquare } from 'lucide-react';

/**
 * AssignerTaskTabs - Two-section view for assigner roles (Coordinator, Dean, Director).
 *
 * Tab 1: "Assigned by Me"      — tasks where currentUser === assigner
 * Tab 2: "My Members' Tasks"   — tasks in user's hierarchy assigned by others
 */
export default function AssignerTaskTabs({ title, subtitle }) {
  const [activeTab, setActiveTab] = useState('assigned_by_me');

  const tabs = [
    {
      id: 'assigned_by_me',
      label: 'Assigned by Me',
      icon: PenSquare,
      description: 'Tasks you have directly delegated to members.',
      view: 'assigned_by_me',
    },
    {
      id: 'members',
      label: "My Members' Tasks",
      icon: Users,
      description: 'Tasks assigned to your members by others — for oversight.',
      view: 'members',
    },
  ];

  const active = tabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary">{title}</h2>
        <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl w-fit border border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                ${isActive
                  ? 'bg-white text-primary shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-primary hover:bg-white/50'
                }
              `}
            >
              <Icon size={15} className={isActive ? 'text-accent' : 'text-gray-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Context */}
      <div className="flex items-start gap-3 px-4 py-3 bg-accent/5 border border-accent/20 rounded-xl">
        <ClipboardList size={16} className="text-accent mt-0.5 shrink-0" />
        <p className="text-sm text-gray-600">{active.description}</p>
      </div>

      {/* Table */}
      <TaskTable view={active.view} key={active.view} />
    </div>
  );
}
