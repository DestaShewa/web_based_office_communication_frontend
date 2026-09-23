import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { changePasswordRequest } from '../api/authApi';
import useAuthStore from '../../../store/authStore';
import { Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

import PasswordStrengthMeter from './PasswordStrengthMeter';

export default function ChangePasswordForm() {
  const navigate = useNavigate();
  const { user, setPasswordStrength } = useAuthStore();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const mutation = useMutation({
    mutationFn: changePasswordRequest,
    onSuccess: () => {
      setPasswordStrength(false);
      setMsg({ type: 'success', text: 'Password changed successfully! Redirecting...' });
      setTimeout(() => {
        const dashboardPath = user?.role === 'admin' ? '/admin' : `/${user?.role}`;
        navigate(dashboardPath);
      }, 2000);
    },
    onError: (error) => {
      setMsg({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password. Please try again.' 
      });
    }
  });

  const isStrong = (pass) => {
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    return pass.length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    mutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    });
  };

  return (
    <div className="w-full max-w-md bg-white/[0.02] backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/10 p-8 sm:p-10">
      <div className="mb-8 text-center border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight uppercase">
          Change Password
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex rounded-lg border border-white/20 overflow-hidden group focus-within:ring-2 focus-within:ring-white/20 transition-all relative">
          <div className="bg-white/[0.05] p-3.5 text-white/70 flex items-center justify-center min-w-[50px]">
            <Lock size={18} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            placeholder="Current Password"
            className="flex-1 bg-white/5 pl-4 pr-12 py-3 text-white placeholder:text-white/40 outline-none font-medium text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex rounded-lg border border-white/20 overflow-hidden group focus-within:ring-2 focus-within:ring-white/20 transition-all relative">
            <div className="bg-white/[0.05] p-3.5 text-white/70 flex items-center justify-center min-w-[50px]">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="New Password"
              className="flex-1 bg-white/5 pl-4 pr-12 py-3 text-white placeholder:text-white/40 outline-none font-medium text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <PasswordStrengthMeter password={formData.newPassword} />
        </div>

        <div className="flex rounded-lg border border-white/20 overflow-hidden group focus-within:ring-2 focus-within:ring-white/20 transition-all relative">
          <div className="bg-white/[0.05] p-3.5 text-white/70 flex items-center justify-center min-w-[50px]">
            <Lock size={18} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Confirm New Password"
            className="flex-1 bg-white/5 pl-4 pr-12 py-3 text-white placeholder:text-white/40 outline-none font-medium text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {msg.text && (
          <div className={`p-3 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95 duration-200 ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {msg.type === 'error' ? <AlertCircle size={16} className="shrink-0" /> : <CheckCircle size={16} className="shrink-0" />}
            <p className="text-[10px] font-black uppercase tracking-tight">{msg.text}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full flex items-center justify-center gap-3 bg-[#4d31ff] text-white py-3 rounded-lg hover:shadow-xl active:scale-[0.98] transition-all font-black uppercase tracking-widest text-[11px] disabled:opacity-50 mt-4"
        >
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
        </button>
      </form>

      <div className="mt-12 pt-6 border-t border-gray-100 opacity-75 text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
        AMITCS Security Enforcement
      </div>
    </div>
  );
}
