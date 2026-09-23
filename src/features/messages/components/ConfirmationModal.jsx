import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Trash2, UserMinus } from 'lucide-react';

export default function ConfirmationModal({ 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel, 
  type = 'danger',
  icon: Icon
}) {
  const isDanger = type === 'danger';

  return createPortal(
    <div 
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[340px] rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100"
      >
        <div className="p-6 sm:p-8 flex flex-col items-center text-center">
          {/* Header Icon */}
          <div className="mb-6 relative">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDanger ? 'bg-red-50 text-red-500' : 'bg-primary/5 text-primary'}`}>
               {Icon ? <Icon size={32} /> : (isDanger ? <Trash2 size={32} /> : <AlertCircle size={32} />)}
            </div>
            <button 
              onClick={onCancel}
              className="absolute -top-4 -right-8 p-2 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <h3 className="text-[19px] font-black text-primary mb-2 leading-tight">
            {title}
          </h3>
          <p className="text-[13px] text-gray-500 font-medium leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex flex-col w-full gap-2.5">
            <button
              onClick={onConfirm}
              className={`w-full py-3.5 rounded-2xl text-[14px] font-black transition-all active:scale-[0.98] shadow-lg ${
                isDanger 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' 
                  : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
              }`}
            >
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3.5 text-gray-400 text-[14px] font-bold hover:text-primary hover:bg-gray-50 rounded-2xl transition-all"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
