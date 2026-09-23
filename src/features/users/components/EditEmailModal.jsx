import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestEmailChange, verifyEmailChange } from '../api/userMutations';
import { X, Mail, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../../../store/authStore';

export default function EditEmailModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(1); // 1: Request, 2: Verify
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setNewEmail('');
      setOtp('');
      setErrorMsg('');
    }
  }, [isOpen]);

  const requestMutation = useMutation({
    mutationFn: (email) => requestEmailChange(email),
    onSuccess: () => {
      setStep(2);
      setErrorMsg('');
      toast.success('Verification code sent!', {
        description: `Please check your new email address: ${newEmail}`
      });
    },
    onError: (error) => {
      setErrorMsg(error.response?.data?.message || 'Failed to request email change.');
    }
  });

  const verifyMutation = useMutation({
    mutationFn: (code) => verifyEmailChange(code),
    onSuccess: (data) => {
      setUser(data.data.user);
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      toast.success('Email address updated successfully!');
      onClose();
    },
    onError: (error) => {
      setErrorMsg(error.response?.data?.message || 'Invalid verification code.');
    }
  });

  if (!isOpen) return null;

  const handleRequest = (e) => {
    e.preventDefault();
    if (newEmail === user.email) {
      setErrorMsg('Please enter a different email address.');
      return;
    }
    requestMutation.mutate(newEmail);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    verifyMutation.mutate(otp);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
          <h3 className="text-xl font-bold text-gray-900">Edit Email Address</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
              {errorMsg}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                <div className="flex gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg text-white h-fit shadow-sm">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Current Email</p>
                    <p className="text-xs text-blue-700 mt-0.5">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required 
                    placeholder="Enter your new official email"
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
                <p className="text-[10px] text-gray-500 mt-2 italic">
                  We'll send a verification code to this new address to confirm ownership.
                </p>
              </div>

              <button 
                type="submit" 
                disabled={requestMutation.isPending}
                className="w-full py-3 px-4 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 group"
              >
                {requestMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Send Verification Code
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4 text-center">
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center text-success mb-4 shadow-inner">
                  <ShieldCheck size={32} />
                </div>
                <h4 className="font-bold text-gray-900">Verify Your New Email</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
                  Enter the 6-digit code sent to <span className="text-primary font-medium">{newEmail}</span>
                </p>
              </div>

              <div>
                <input 
                  type="text" 
                  required 
                  maxLength={6}
                  placeholder="000000"
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-3xl font-mono tracking-[0.5em] py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-success focus:ring-4 focus:ring-success/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={verifyMutation.isPending}
                  className="w-full py-3 px-4 bg-success text-white rounded-lg font-bold hover:bg-success/90 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {verifyMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : 'Complete Email Change'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Didn't get the code? Try again
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
