import React from 'react';
import LoginForm from '../components/LoginForm';
import { Calendar, Bell, ShieldCheck, Laptop, LayoutGrid } from 'lucide-react';

const EXTERNAL_LINKS = [
  { icon: <Calendar size={24} />, label: "Academic Calendar", link: "https://smis.amu.edu.et/pages/academic_calender" },
  { icon: <Bell size={24} />, label: "Registrar Announcements", link: "https://smis.amu.edu.et/pages/announcement" },
  { icon: <ShieldCheck size={24} />, label: "Verify Graduation Status", link: "https://smis.amu.edu.et/pages/check_graduate" },
  { icon: <Laptop size={24} />, label: "AMU eLearning Portal", link: "https://online.amu.edu.et/" },
  { icon: <LayoutGrid size={24} />, label: "eSHE Portal", link: "https://courses.amu.edu.et/" },
];

export default function Login() {
  return (
    <div className="flex-1 flex flex-col p-6 lg:p-12">
      {/* Hero Content Section */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-between gap-12 max-w-7xl mx-auto w-full mb-12">

        {/* Left: Branding */}
        <div className="lg:w-2/3 text-white">
          <div className="flex items-center gap-6 mb-8">
            <div className="p-1.5 bg-white rounded-full shadow-2xl">
              <img src="/logo.png" alt="AMU Logo" className="h-24 w-24 sm:h-32 sm:w-32" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6 leading-tight drop-shadow-lg">
            Arba Minch Institute of Technology <br className="hidden sm:block" />
            <span className="text-blue-200">Communication System (AMITCS)</span>
          </h1>

          <p className="text-blue-50 text-sm sm:text-base max-w-xl font-medium leading-relaxed opacity-90 drop-shadow">
            This is our official institutional communication portal for academic staff, and administration to access integrated services offered by the institute.
          </p>
        </div>

        {/* Right: Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-white/[0.02] backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/10 p-8 sm:p-10">
            <div className="mb-8 border-b border-white/10 pb-4 text-center lg:text-left">
              <h2 className="text-xl font-bold text-white tracking-tight mb-1 uppercase">Login to AMITCS</h2>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>

      {/* External Links Section */}
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {EXTERNAL_LINKS.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              className="group bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-white/40 shadow-lg hover:shadow-2xl hover:bg-white transition-all duration-300 flex flex-col items-center text-center gap-3 active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-primary group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                {item.icon}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 group-hover:text-primary leading-tight">
                {item.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
