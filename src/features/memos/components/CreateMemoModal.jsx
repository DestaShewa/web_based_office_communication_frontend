import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { 
  X, 
  Send, 
  Paperclip, 
  AlertCircle, 
  ChevronDown,
  Building2,
  GraduationCap,
  Save,
  Clock,
  FileText
} from 'lucide-react';
import { createMemo, updateMemo } from '../api/memoApi';
import apiClient from '../../../lib/axios';
import { toast } from 'sonner';
import useAuthStore from '../../../store/authStore';

export default function CreateMemoModal({ onClose, onSuccess, memo, triggerRect }) {
  const { user } = useAuthStore();
  const [offices, setOffices] = useState([]);
  const [isLoadingOffices, setIsLoadingOffices] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [memoIdPreview, setMemoIdPreview] = useState('MEM-xxx');
  
  const [formData, setFormData] = useState({
    recipientOffice: '',
    ccOffices: [],
    subject: '',
    body: '',
    priority: 'normal',
    expectedActionDate: '',
    status: 'dispatched'
  });

  const [position, setPosition] = useState({ opacity: 0, scale: 0.95 });
  const menuRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRect || !menuRef.current) return;

    const PADDING = 20;
    const SPACING = 12;
    const menuWidth = 672; // max-w-2xl is 42rem = 672px
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Get menu height (it's dynamic based on content)
    const menuHeight = menuRef.current.offsetHeight;
    
    let left = triggerRect.left;
    let top = triggerRect.bottom + SPACING; 
    
    let originY = 'top';
    let originX = 'left';

    // Horizontal check
    if (left + menuWidth + PADDING > viewportWidth) {
      left = viewportWidth - menuWidth - PADDING;
      originX = 'right';
    }

    if (left < PADDING) {
      left = PADDING;
      originX = 'left';
    }

    // Vertical check
    // If it goes off the bottom, try showing it above the button
    if (top + menuHeight + PADDING > viewportHeight) {
      const topSpace = triggerRect.top - SPACING - menuHeight;
      if (topSpace > PADDING) {
        top = topSpace;
        originY = 'bottom';
      } else {
        // If it doesn't fit above either, just stick it to the bottom with padding
        top = viewportHeight - menuHeight - PADDING;
        originY = 'bottom';
      }
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
    if (!triggerRect) return;
    calculatePosition();

    const resizeObserver = new ResizeObserver(() => calculatePosition());
    if (menuRef.current) resizeObserver.observe(menuRef.current);
    window.addEventListener('resize', calculatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculatePosition);
    };
  }, [triggerRect, calculatePosition]);

  // Initialize form if editing
  useEffect(() => {
    if (memo) {
      setFormData({
        recipientOffice: typeof memo.recipientOffice === 'object' ? memo.recipientOffice.customId : memo.recipientOffice,
        ccOffices: memo.ccOffices || [],
        subject: memo.subject || '',
        body: memo.body || '',
        priority: memo.priority || 'normal',
        expectedActionDate: memo.expectedActionDate ? new Date(memo.expectedActionDate).toISOString().split('T')[0] : '',
        status: memo.status || 'draft'
      });
      setMemoIdPreview(memo.customId);
    }
  }, [memo]);

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const [deptsRes, facsRes, instsRes, officesRes] = await Promise.all([
          apiClient.get('/departments'),
          apiClient.get('/faculties'),
          apiClient.get('/institutes'),
          apiClient.get('/offices')
        ]);
        
        const depts = (deptsRes.data.data.departments || deptsRes.data.data || []).map(d => ({ 
          id: d.customId, 
          name: d.name, 
          type: 'Department' 
        }));
        const facs = (facsRes.data.data.faculties || facsRes.data.data || []).map(f => ({ 
          id: f.customId, 
          name: f.name, 
          type: 'Faculty' 
        }));
        const insts = (instsRes.data.data.institutes || instsRes.data.data || []).map(i => ({
          id: i.customId,
          name: i.abbreviation || i.name,
          type: 'Institute'
        }));
        const standaloneOffices = (officesRes.data.data.offices || officesRes.data.data || []).map(o => ({
          id: o.customId,
          name: o.name,
          type: 'Office'
        }));
        
        setOffices([...insts, ...standaloneOffices, ...facs, ...depts]);
      } catch (err) {
        toast.error('Failed to load offices');
      } finally {
        setIsLoadingOffices(false);
      }
    };
    fetchOffices();
  }, []);

  const handleSubmit = async (status = 'dispatched') => {
    if (!formData.recipientOffice || !formData.subject || !formData.body) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.expectedActionDate) {
      const selectedDate = new Date(formData.expectedActionDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        toast.error('Expected action date cannot be in the past');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'ccOffices') {
          formData.ccOffices.forEach(cc => payload.append('ccOffices[]', cc));
        } else {
          payload.append(key, formData[key]);
        }
      });
      
      payload.set('status', status);
      selectedFiles.forEach(file => payload.append('attachments', file));

      if (memo) {
        await updateMemo(memo.customId, payload);
      } else {
        await createMemo(payload);
      }
      
      toast.success(status === 'draft' ? 'Draft saved' : 'Memo dispatched successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${memo ? 'update' : 'create'} memo`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOfficeName = (val) => (val && typeof val === 'object') ? val.name : val;
  const senderOfficeName = (() => {
    const unitId = user?.role === 'director' 
      ? 'INST-01' 
      : (user?.role === 'dean' 
          ? (user?.faculty?.customId || user?.faculty) 
          : (user?.office?.customId || user?.office || user?.department?.customId || user?.department));
    
    const matched = offices.find(o => o.id === unitId);
    return matched ? matched.name : (typeof unitId === 'string' ? unitId : 'Institutional Unit');
  })();

  return (
    <div 
      className={`fixed inset-0 z-[60] ${!triggerRect ? 'bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4' : ''}`}
      onClick={onClose}
    >
      <div 
        ref={triggerRect ? menuRef : null}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-gray-100 ${triggerRect ? 'fixed' : ''}`}
        style={triggerRect ? { 
           ...position,
           transform: `scale(${position.scale || 1})`,
           transformOrigin: position.transformOrigin 
        } : undefined}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">
                {memo ? 'Edit Draft' : 'New Memo'}
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              From: <span className="text-primary font-bold">{user?.role === 'director' ? 'The Institute' : (user?.role === 'dean' ? 'Dean\'s Office' : 'Office of Coordinator')} — {senderOfficeName}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Routing Section */}
          <section className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 pb-2">Routing</h3>
             <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-700 ml-1 flex items-center gap-1.5">
                     To (Office) <span className="text-red-500">*</span>
                   </label>
                   <div className="relative">
                      <select 
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 appearance-none transition-all cursor-pointer"
                        value={formData.recipientOffice}
                        onChange={(e) => setFormData({ ...formData, recipientOffice: e.target.value })}
                        disabled={isLoadingOffices}
                      >
                        <option value="">— Select Office —</option>
                        {offices
                          .filter(office => {
                            const userOfficeId = user?.role === 'director' 
                              ? 'INST-01' 
                              : (user?.role === 'dean' 
                                  ? (user?.faculty?.customId || user?.faculty) 
                                  : (user?.office?.customId || user?.office || user?.department?.customId || user?.department));
                            return office.id !== userOfficeId;
                          })
                          .map(office => (
                            <option key={office.id} value={office.id}>
                              {office.type}: {office.name}
                            </option>
                          ))
                        }
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                   </div>
                </div>
              </div>
          </section>

          {/* Content Section */}
          <section className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 pb-2">Content</h3>
             <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 ml-1 flex items-center justify-between">
                    Subject <span className="text-gray-400 font-medium text-[10px]">{formData.subject.length}/100</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Update semester schedule — Q3"
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 placeholder:text-gray-300 transition-all"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 ml-1 flex items-center justify-between">
                    Body <span className="text-gray-400 font-medium text-[10px]">{formData.body.length}/2000</span>
                  </label>
                  <textarea 
                    rows={6}
                    placeholder="Write the full instruction or request here. This text will be auto-filled into any task created from this memo."
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 placeholder:text-gray-300 transition-all resize-none leading-relaxed"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    maxLength={2000}
                  />
                </div>
             </div>
          </section>

          {/* Metadata Section */}
          <section className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 pb-2">Metadata</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 ml-1">Priority *</label>
                  <div className="flex gap-2">
                    {['low', 'normal', 'urgent'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p })}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          formData.priority === p 
                          ? (p === 'urgent' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-primary text-white shadow-lg shadow-primary/20')
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {p === 'urgent' && <AlertCircle size={10} className="inline mr-1 mb-0.5" />}
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 ml-1 flex items-center gap-1.5">
                    Expected action date
                  </label>
                  <div className="relative">
                    <input 
                      type="date"
                      className="w-full pl-5 pr-5 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      value={formData.expectedActionDate}
                      onChange={(e) => setFormData({ ...formData, expectedActionDate: e.target.value })}
                    />
                  </div>
                </div>
             </div>
          </section>

          {/* Attachments Dropzone */}
          <div className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 pb-2">Attachments</h3>
             <input 
               type="file" 
               multiple 
               className="hidden" 
               ref={fileInputRef}
               onChange={(e) => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)])}
             />
             <div 
               onClick={() => fileInputRef.current.click()}
               className="p-8 border-2 border-dashed border-gray-100 rounded-[24px] flex flex-col items-center justify-center gap-2 group hover:border-primary/30 transition-all cursor-pointer"
             >
                <div className="bg-gray-50 p-3 rounded-full text-gray-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                  <Paperclip size={24} />
                </div>
                <p className="text-xs font-bold text-gray-500">Drop files here or click to browse</p>
                <p className="text-[10px] text-gray-400">PDF, DOCX, Images (Max 20MB)</p>
             </div>

             {selectedFiles.length > 0 && (
               <div className="flex flex-wrap gap-3">
                 {selectedFiles.map((file, idx) => (
                   <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 animate-in slide-in-from-bottom-2">
                     <FileText size={14} className="text-primary" />
                     <span className="text-[10px] font-bold text-gray-600 truncate max-w-[120px]">{file.name}</span>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));
                       }}
                       className="p-1 hover:bg-red-50 hover:text-red-500 rounded-md transition-all"
                     >
                       <X size={12} />
                     </button>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button 
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200/50 transition-all"
          >
            <Save size={18} />
            Save draft
          </button>
          
          <div className="flex items-center gap-4">
             {formData.priority === 'urgent' && (
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase animate-pulse">
                 <AlertCircle size={12} />
                 Urgent
               </div>
             )}
             <button 
              onClick={() => handleSubmit('dispatched')}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (memo ? 'Updating...' : 'Sending...') : (memo ? 'Update & Send' : 'Send Memo')}
              <Send size={16} className="mb-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
