import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loginRequest } from '../api/authApi';
import useAuthStore from '../../../store/authStore';
import { Loader2, AlertCircle, User, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const navigate = useNavigate();
  const setCredentials = useAuthStore((state) => state.setCredentials);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      const user = data?.data?.user;
      const token = data?.token;
      setCredentials(user, token, data.isPasswordWeak);

      if (data.requiresPasswordChange) {
        navigate('/change-password');
      } else {
        const role = user?.role || 'staff';
        navigate(`/${role}`);
      }
    },
    onError: (error) => {
      setErrorMsg(error.response?.data?.message || 'Invalid credentials. Please try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Required fields are missing.');
      return;
    }
    mutation.mutate({ email, password });
  };

  return (
    <div className="w-full">
      {errorMsg && (
        <div className="mb-6 p-3 bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-xl flex items-center gap-3 text-red-100 animate-in fade-in zoom-in-95 duration-200">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-tight">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div className="flex rounded-lg border border-white/20 overflow-hidden group focus-within:ring-2 focus-within:ring-white/20 transition-all">
          <div className="bg-white/[0.05] p-3.5 text-white/70 flex items-center justify-center min-w-[50px]">
            <User size={18} />
          </div>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-white/[0.05] px-4 py-3 text-white placeholder:text-white/40 outline-none font-medium text-sm"
            placeholder="Email"
            required
            disabled={mutation.isPending}
          />
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex rounded-lg border border-white/20 overflow-hidden group focus-within:ring-2 focus-within:ring-white/20 transition-all relative">
            <div className="bg-white/[0.05] p-3.5 text-white/70 flex items-center justify-center min-w-[50px]">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-white/[0.05] pl-4 pr-12 py-3 text-white placeholder:text-white/40 outline-none font-medium text-sm"
              placeholder="Password"
              required
              disabled={mutation.isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-3 bg-[#4d31ff] text-white py-3 rounded-lg hover:shadow-xl active:scale-[0.98] transition-all font-black uppercase tracking-widest text-[11px] disabled:opacity-50"
          >
            {mutation.isPending ? (
              <><Loader2 className="animate-spin" size={16} /> Validating...</>
            ) : (
              <>Login</>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="w-full flex items-center justify-center gap-3 bg-[#6c757d] text-white py-3 rounded-lg hover:shadow-xl active:scale-[0.98] transition-all font-black uppercase tracking-widest text-[11px]"
          >
            Forgot Password?
          </button>
        </div>
      </form>
    </div>
  );
}
