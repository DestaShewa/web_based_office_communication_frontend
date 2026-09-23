import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

/**
 * A visual indicator for password strength.
 * 
 * @param {string} password - The password to evaluate.
 * @param {boolean} showRequirements - Whether to show the list of requirements.
 */
const PasswordStrengthMeter = ({ password, showRequirements = true }) => {
  const evaluateStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Empty', color: 'bg-gray-200', textColor: 'text-gray-400' };

    let score = 0;
    const reqs = {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass),
    };

    score = Object.values(reqs).filter(Boolean).length;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500', reqs };
    if (score <= 4) return { score, label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600', reqs };
    return { score, label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600', reqs };
  };

  const strength = evaluateStrength(password);

  return (
    <div className="mt-4 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-md ${strength.score >= 5 ? 'bg-green-100 text-green-600' : strength.score >= 3 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
            {strength.score >= 5 ? (
              <ShieldCheck size={16} />
            ) : strength.score >= 3 ? (
              <Shield size={16} />
            ) : (
              <ShieldAlert size={16} />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Security Level</span>
            <span className={`text-xs font-black uppercase tracking-tight ${strength.textColor}`}>{strength.label}</span>
          </div>
        </div>
        <div className="text-right">
            <span className="text-sm font-black text-gray-700">{strength.score}<span className="text-gray-300 text-[10px]">/5</span></span>
        </div>
      </div>

      <div className="flex gap-1.5 h-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-700 ${
              i <= strength.score ? strength.color : 'bg-gray-100'
            }`}
          />
        ))}
      </div>

      {showRequirements && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mb-2">Requirements</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            <RequirementItem met={strength.reqs?.length} text="8+ characters" />
            <RequirementItem met={strength.reqs?.upper} text="Uppercase" />
            <RequirementItem met={strength.reqs?.lower} text="Lowercase" />
            <RequirementItem met={strength.reqs?.number} text="Number" />
            <RequirementItem met={strength.reqs?.special} text="Special Char" />
          </ul>
        </div>
      )}
    </div>
  );
};

const RequirementItem = ({ met, text }) => (
  <li className={`flex items-center gap-2 text-[10px] transition-all duration-300 ${met ? 'text-green-600 font-bold' : 'text-gray-400 font-medium'}`}>
    <div className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all duration-500 ${met ? 'bg-green-500 scale-110' : 'bg-gray-200'}`} />
    {text}
  </li>
);

export default PasswordStrengthMeter;
