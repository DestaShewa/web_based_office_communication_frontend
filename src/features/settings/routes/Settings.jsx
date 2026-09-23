import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '../api/getSettings';
import { Loader2, ShieldAlert, ShieldCheck, CheckCircle, AlertCircle, Power, PowerOff } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Track the server-side state to detect changes
  const serverState = data?.data?.settings?.maintenanceMode ?? false;

  useEffect(() => {
    if (data?.data?.settings) {
      setMaintenanceMode(data.data.settings.maintenanceMode ?? false);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      const isNowOn = res?.data?.settings?.maintenanceMode;
      setStatusMsg({ 
        type: 'success', 
        text: isNowOn ? 'Maintenance mode enabled. Non-admin users are locked out.' : 'Maintenance mode disabled. System is back online.' 
      });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    },
    onError: (error) => {
      setStatusMsg({ type: 'error', text: error.response?.data?.message || 'Failed to update system settings' });
    }
  });

  const handleEnable = (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });
    updateMutation.mutate({ maintenanceMode: true });
  };

  const handleDisable = () => {
    setStatusMsg({ type: '', text: '' });
    updateMutation.mutate({ maintenanceMode: false });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">System Settings</h2>
        <p className="text-gray-500">Configure global application behavior and maintenance rules.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {isLoading ? (
           <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
        ) : serverState ? (
          /* ─── Maintenance is ACTIVE ─── */
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <ShieldAlert size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-800">Maintenance Mode is Active</h3>
                  <p className="text-xs text-red-600/80 mt-0.5">All non-admin users are currently locked out of the system.</p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-wider animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span> Live
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
              <button 
                type="button"
                onClick={handleDisable}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <PowerOff size={18} />} 
                {updateMutation.isPending ? 'Disabling...' : 'Disable Maintenance Mode'}
              </button>
              {statusMsg.text && (
                <span className={`text-sm font-bold flex items-center gap-1.5 ${statusMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {statusMsg.text}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* ─── Maintenance is INACTIVE ─── */
          <form className="space-y-6" onSubmit={handleEnable}>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary">System is Online</h3>
                  <p className="text-xs text-gray-500 mt-0.5">All users have normal access to the platform.</p>
                </div>
              </div>

              <label className="flex items-start gap-3 mt-4 pt-4 border-t border-gray-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 mt-0.5" 
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                />
                <div>
                  <span className="text-sm font-bold text-red-800 flex items-center gap-2"><ShieldAlert size={16}/> Enable Maintenance Mode</span>
                  <p className="text-xs text-red-600/80 mt-1">Locks out all non-admin users from accessing standard API routes and kicks active sessions.</p>
                </div>
              </label>
            </div>
            
            <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
              <button 
                type="submit"
                disabled={updateMutation.isPending || !maintenanceMode}
                className="flex items-center gap-2 bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Power size={18} />} 
                {updateMutation.isPending ? 'Enabling...' : 'Activate Maintenance Mode'}
              </button>
              {statusMsg.text && (
                <span className={`text-sm font-bold flex items-center gap-1.5 ${statusMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {statusMsg.text}
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
