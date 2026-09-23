import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Maximize2 } from 'lucide-react';

export default function ImageLightbox({ src, fileName, onClose }) {
  if (!src) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute top-4 right-4 flex items-center gap-4 z-10">
        <a
          href={src}
          download={fileName}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
          title="Download Image"
          onClick={(e) => e.stopPropagation()}
        >
          <Download size={20} />
        </a>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90 shadow-lg"
        >
          <X size={24} />
        </button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12 md:p-16 pointer-events-none">
        <div className="relative group max-w-full max-h-full pointer-events-auto">
          <img
            src={src}
            alt={fileName}
            crossOrigin="anonymous"
            className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 text-white/50 text-[11px] font-medium tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity">
            {fileName}
          </div>
        </div>
      </div>
      
      {/* Background click to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>,
    document.body
  );
}
