import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { toast } from 'sonner';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setStep(2);
      toast.success('Verification code sent. Please check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/verify-reset-otp', { email, otp });
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', { email, otp, password });
      setStep(4);
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/[0.02] backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/10 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="mb-8 text-center border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white tracking-tight uppercase">
            {step === 4 ? 'Success' : 'Forgot Password?'}
          </h2>
        </div>

        {step === 4 ? (
          <div className="text-center space-y-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 mb-2 border border-green-500/30">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-white/70">
              Your password has been updated successfully.
            </p>
            <Link
              to="/login"
              className="w-full flex items-center justify-center bg-[#4d31ff] text-white py-3 rounded-lg hover:shadow-xl active:scale-[0.98] transition-all font-black uppercase tracking-widest text-[11px]"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div className="flex rounded-lg border border-white/20 overflow-hidden group focus-within:ring-2 focus-within:ring-white/20 transition-all">
                  <div className="bg-white/[0.05] p-3.5 text-white/70 flex items-center justify-center min-w-[50px]">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-white/[0.05] px-4 py-3 text-white placeholder:text-white/40 outline-none font-medium text-sm"
                    placeholder="Email"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="w-full flex items-center justify-center gap-3 bg-[#4d31ff] text-white py-3 rounded-lg hover:shadow-xl active:scale-[0.98] transition-all font-black uppercase tracking-widest text-[11px] disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Reset Password"}
                  </button>
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center bg-[#6c757d] text-white py-3 rounded-lg hover:shadow-xl active:scale-[0.98] transition-all font-black uppercase tracking-widest text-[11px]"
                  >
                    Back to Login Page
                  </Link>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <p className="text-[10px] text-center font-black uppercase tracking-widest text-white/50 mb-4">
                  Enter 6-digit code sent to {email}
                </p>
                <div className="flex rounded-lg border border-white/20 overflow-hidden group focus-within:ring-2 focus-within:ring-white/20 transition-all bg-white/[0.05]">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full text-center text-2xl font-black tracking-[0.5em] py-3 text-white outline-none bg-transparent"
                    placeholder="000000"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 bg-[#4d31ff] text-white py-3 rounded-lg hover:shadow-xl active:scale-[0.98] transition-all font-black uppercase tracking-widest text-[11px]"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Verify Identity"}
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-5">
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
                      placeholder="New Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={password} />
                </div>
                <div className="flex rounded-lg border border-white/20 overflow-hidden group focus-within:ring-2 focus-within:ring-white/20 transition-all relative">
                  <div className="bg-white/[0.05] p-3.5 text-white/70 flex items-center justify-center min-w-[50px]">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex-1 bg-white/[0.05] pl-4 pr-12 py-3 text-white placeholder:text-white/40 outline-none font-medium text-sm"
                    placeholder="Confirm New Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 bg-[#4d31ff] text-white py-3 rounded-lg hover:shadow-xl active:scale-[0.98] transition-all font-black uppercase tracking-widest text-[11px]"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Update Password"}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-gray-100 opacity-75 text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
          AMITCS Security Enforcement
        </div>
      </div>
    </div>
  );
}
