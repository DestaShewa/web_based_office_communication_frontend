import React from 'react';
import { Building2, Hash, Edit } from 'lucide-react';
import ActionMenu from '../../../components/ActionMenu';

export default function InstituteTable({ institutes, onEdit }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table/Card View Container */}
      <div className="min-h-[150px]">
        {/* Desktop Table View */}
        <table className="w-full text-left border-collapse hidden md:table">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Institute Details</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Abbreviation</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Custom ID</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {institutes.map((inst) => (
              <tr key={inst.customId || inst._id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{inst.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 max-w-xs">{inst.description || 'No description provided.'}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="px-2.5 py-1 bg-accent/10 text-accent text-xs font-bold rounded-md border border-accent/20 tracking-wider">
                    {inst.abbreviation}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 font-mono">
                    <Hash size={12} className="text-gray-400" />
                    {inst.customId}
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <ActionMenu 
                    actions={[
                      {
                        label: 'Edit Institute',
                        icon: <Edit size={16} />,
                        onClick: (rect) => onEdit(inst, rect)
                      }
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {institutes.map((inst) => (
            <div key={inst.customId || inst._id} className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg transition-colors">
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{inst.name}</p>
                    <span className="text-[10px] font-black uppercase text-accent tracking-widest">{inst.abbreviation}</span>
                  </div>
                </div>
                <ActionMenu 
                  actions={[
                    {
                      label: 'Edit',
                      icon: <Edit size={16} />,
                      onClick: (rect) => onEdit(inst, rect)
                    }
                  ]}
                />
              </div>

              {inst.description && (
                <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50/50 p-2 rounded-lg italic font-medium">
                  {inst.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                 <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400">
                   <Hash size={10} /> {inst.customId}
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
