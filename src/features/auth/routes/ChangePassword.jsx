import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ChangePasswordForm from '../components/ChangePasswordForm';

export default function ChangePassword() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-gray-600 bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl shadow-sm hover:bg-white hover:text-primary transition-all group z-20"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
