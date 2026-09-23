import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOffice, updateOffice } from '../api/officeMutations';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OfficeFormModal({ isOpen, onClose, office = null, triggerRect = null }) {
  const queryClient = useQueryClient();
  const isEdit = !!office;

  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    description: '',
    coordinator: ''
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
    let top = triggerRect.top - menuRect.height - SPACING; 
    
    let originY = 'bottom';
    let originX = 'left';

    if (left + menuRect.width + PADDING > window.innerWidth) {
      left = triggerRect.right - menuRect.width;
      originX = 'right';
    }

    if (top < PADDING) {
      top = triggerRect.bottom + SPACING;
      originY = 'top';
    }
    
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
    if (office) {
      setFormData({
        name: office.name || '',
        abbreviation: office.abbreviation || '',
        description: office.description || '',
        coordinator: office.coordinator?.customId || (typeof office.coordinator === 'string' ? office.coordinator : '')
      });
    } else {
      setFormData({ name: '', abbreviation: '', description: '', coordinator: '' });
    }
  }, [office, isOpen]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateOffice({ id: office.customId || office._id, ...data }) : createOffice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      toast.success(isEdit ? 'Office updated successfully' : 'Office created successfully');
      onClose();
    },
    onError: (error) => {
      setErrorMsg(error.response?.data?.message || 'Failed to save office.');
      toast.error('An error occurred during submission.');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const payload = { ...formData };
    if (isEdit && !payload.coordinator) delete payload.coordinator;
    mutation.mutate(payload);
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
          <h3 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Office' : 'Create New Office'}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <form id="office-form" onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Office Name</label>
              <input
                type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isEdit}
                placeholder="e.g., Finance Office"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white disabled:opacity-60 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea
                required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Abbreviation</label>
              <input
                type="text" required value={formData.abbreviation} onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                maxLength={10} placeholder="e.g., FIN"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white uppercase"
              />
            </div>

            {isEdit && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Office Coordinator (ID)</label>
                <input
                  type="text" placeholder="COORD-ID" value={formData.coordinator} onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current.</p>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-auto">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm">
            Cancel
          </button>
          <button form="office-form" type="submit" disabled={mutation.isPending} className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2">
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Office'}
          </button>
        </div>
      </div>
    </div>
  );
}
