import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInstitute, updateInstitute } from '../api/instituteApi';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InstituteFormModal({ isOpen, onClose, institute = null, triggerRect = null }) {
  const queryClient = useQueryClient();
  const isEdit = !!institute;

  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    description: '',
    customId: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  
  const [position, setPosition] = useState({ opacity: 0, scale: 0.95 });
  const menuRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRect || !menuRef.current) return;

    const PADDING = 16;
    const SPACING = 8;
    const menuRect = menuRef.current.getBoundingClientRect();
    
    let left = triggerRect.left;
    let top = triggerRect.top - menuRect.height - SPACING; // Default slightly ABOVE trigger
    
    let originY = 'bottom';
    let originX = 'left';

    // HORIZONTAL OVERFLOW
    if (left + menuRect.width + PADDING > window.innerWidth) {
      left = triggerRect.right - menuRect.width;
      originX = 'right';
    }

    // VERTICAL OVERFLOW: If it overflows the TOP, flip to render BELOW the trigger
    if (top < PADDING) {
      top = triggerRect.bottom + SPACING;
      originY = 'top';
    }
    
    // HARD CLAMPING
    if (left < PADDING) {
      left = PADDING;
      originX = 'left';
    } else if (left + menuRect.width + PADDING > window.innerWidth) {
      left = window.innerWidth - menuRect.width - PADDING;
      originX = 'right';
    }

    if (top < PADDING) {
      top = PADDING;
      originY = 'top';
    } else if (top + menuRect.height + PADDING > window.innerHeight) {
      top = window.innerHeight - menuRect.height - PADDING;
      originY = 'bottom';
    }

    setPosition({ 
      top, 
      left, 
      opacity: 1, 
      scale: 1, 
      transformOrigin: `${originY} ${originX}` 
    });
  }, [triggerRect]);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRect) return;

    calculatePosition();

    const resizeObserver = new ResizeObserver(() => calculatePosition());
    if (menuRef.current) resizeObserver.observe(menuRef.current);
    
    window.addEventListener('resize', calculatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen, triggerRect, calculatePosition]);

  useEffect(() => {
    if (institute) {
      setFormData({
        name: institute.name || '',
        abbreviation: institute.abbreviation || '',
        description: institute.description || '',
        customId: institute.customId || ''
      });
    } else {
      setFormData({ name: '', abbreviation: '', description: '', customId: '' });
    }
  }, [institute, isOpen]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateInstitute({ id: institute.customId || institute._id, data }) : createInstitute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutes'] });
      toast.success(isEdit ? 'Institute updated successfully' : 'Institute created successfully');
      onClose();
    },
    onError: (error) => {
      setErrorMsg(error.response?.data?.message || 'Failed to save institute.');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    mutation.mutate(formData);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 ${!triggerRect ? 'bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200' : ''}`}
      onClick={onClose}
    >
      <div 
        ref={triggerRect ? menuRef : null}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 ${triggerRect ? 'fixed' : ''}`}
        style={triggerRect ? { 
           ...position,
           transform: `${position.transform || ''} scale(${position.scale || 1})`,
           transformOrigin: position.transformOrigin 
        } : undefined}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
          <h3 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Institute' : 'Register New Institute'}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <form id="institute-form" onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Institute Name</label>
              <input 
                type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Arba Minch Institute of Technology"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Abbreviation</label>
                <input 
                  type="text" required value={formData.abbreviation} onChange={(e) => setFormData({...formData, abbreviation: e.target.value})}
                  placeholder="e.g. AMIT"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white uppercase"
                />
              </div>
              {!isEdit && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Custom ID (Optional)</label>
                  <input 
                    type="text" value={formData.customId} onChange={(e) => setFormData({...formData, customId: e.target.value})}
                    placeholder="e.g. AMU-AMIT-2026"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea 
                rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of the institute..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white resize-none"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
            Cancel
          </button>
          <button form="institute-form" type="submit" disabled={mutation.isPending} className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Register Institute'}
          </button>
        </div>
      </div>
    </div>
  );
}
