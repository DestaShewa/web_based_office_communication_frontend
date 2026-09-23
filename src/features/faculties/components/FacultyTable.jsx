import React from 'react';
import { GraduationCap, Building2, User, Edit, Trash2 } from 'lucide-react';
import ActionMenu from '../../../components/ActionMenu';

export default function FacultyTable({ faculties, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table/Card View Container */}
      <div className="min-h-[200px]">
        {/* Desktop Table View */}
        <table className="w-full text-left border-collapse hidden md:table">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Faculty Details</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dean / Head</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent Institute</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Custom ID</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {faculties.map((fac) => (
              <tr key={fac.customId || fac._id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 text-accent rounded-lg group-hover:bg-accent group-hover:text-white transition-colors">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{fac.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{fac.abbreviation}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  {fac.dean ? (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-bold">
                        {fac.dean.name?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-gray-800">{fac.dean.name}</p>
                        <p className="text-gray-400">{fac.dean.customId}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 italic text-xs">
                      <User size={14} className="opacity-50" />
                      No Dean Assigned
                    </div>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Building2 size={14} className="text-gray-400" />
                    {fac.institute?.name || fac.institute}
                  </div>
                </td>
                <td className="py-4 px-6 text-xs font-mono text-gray-500">
                  {fac.customId}
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    fac.isActive !== false 
                      ? 'bg-green-50 text-green-700 border-green-100' 
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {fac.isActive !== false ? 'ACTIVE' : 'DEACTIVATED'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <ActionMenu 
                    actions={[
                      {
                        label: 'Edit Faculty',
                        icon: <Edit size={16} />,
                        onClick: (rect) => onEdit(fac, rect)
                      },
                      {
                        label: fac.isActive !== false ? 'Deactivate' : 'Activate',
                        icon: <Trash2 size={16} />,
                        variant: fac.isActive !== false ? 'danger' : 'success',
                        onClick: (rect) => onDelete(fac, rect)
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
          {faculties.map((fac) => (
            <div key={fac.customId || fac._id} className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 text-accent rounded-lg">
                    <GraduationCap size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{fac.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">{fac.abbreviation}</p>
                  </div>
                </div>
                <ActionMenu 
                  actions={[
                    {
                      label: 'Edit',
                      icon: <Edit size={16} />,
                      onClick: (rect) => onEdit(fac, rect)
                    },
                    {
                      label: fac.isActive !== false ? 'Deactivate' : 'Activate',
                      icon: <Trash2 size={16} />,
                      variant: fac.isActive !== false ? 'danger' : 'success',
                      onClick: (rect) => onDelete(fac, rect)
                    }
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dean</span>
                   {fac.dean ? (
                     <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[8px] font-bold shrink-0">
                           {fac.dean.name?.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-xs font-medium text-gray-700 truncate">{fac.dean.name}</span>
                     </div>
                   ) : (
                     <span className="text-[10px] text-gray-400 italic">Unassigned</span>
                   )}
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Institute</span>
                   <span className="text-xs text-gray-600 truncate">{fac.institute?.name || fac.institute}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono text-gray-400">ID: {fac.customId}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-widest ${
                  fac.isActive !== false 
                    ? 'bg-green-50 text-green-700 border-green-100' 
                    : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                  {fac.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
