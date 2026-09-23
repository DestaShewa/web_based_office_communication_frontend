import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ChevronDown, Globe, Mail, Phone, Info } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col font-roboto bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="AMU Logo" className="h-10 w-10 rounded-full object-contain" />
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-primary leading-tight">
              Arba Minch Institute of Technology
            </h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Communication System (AMITCS)
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-4">
          <div className="relative group">
            <button className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              <span className="text-[10px] transform rotate-90">▲</span>
              Extras
            </button>
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              <div className="flex flex-col py-1">
                <a href="https://courses.amu.edu.et/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  eSHE Portal
                </a>
                <a href="https://online.amu.edu.et/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  eLearning Portal
                </a>
                <a href="https://www.office.com/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  Office 365
                </a>
                <a href="https://outlook.office.com/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  Check Email
                </a>
                <a href="https://www.amu.edu.et/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  AMU Website
                </a>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content with Background */}
      <main className="flex-1 relative flex flex-col">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
          style={{ backgroundImage: "url('/bg.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 px-6 text-right">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Copyright © {new Date().getFullYear()} Arba Minch Institute of Technology
        </p>
      </footer>
    </div>
  );
}
