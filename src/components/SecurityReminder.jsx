import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, X } from 'lucide-react';
import useAuthStore from '../store/authStore';

/**
 * A persistent reminder banner shown when the user's password is weak.
 */
const SecurityReminder = () => {
  const navigate = useNavigate();
  const isPasswordWeak = useAuthStore((state) => state.isPasswordWeak);
  const [dismissed, setDismissed] = React.useState(false);

  if (!isPasswordWeak || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 sm:px-8 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-500 sticky top-0 z-50">
      <div className="flex items-center gap-3 min-w-0">
        <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600 shrink-0">
          <ShieldAlert size={18} />
        </div>
        <p className="text-xs sm:text-sm font-medium text-amber-800 truncate">
          <span className="font-bold">Security Alert:</span> Your current password is weak. We recommend updating it to protect your account.
        </p>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate('/change-password')}
          className="flex items-center gap-1 px-3 py-1 bg-amber-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-amber-700 transition-colors shadow-sm active:scale-95"
        >
          Update Now
          <ArrowRight size={14} />
        </button>
        <button 
          onClick={() => setDismissed(true)}
          className="p-1 text-amber-400 hover:text-amber-600 transition-colors"
          title="Dismiss for this session"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default SecurityReminder;
