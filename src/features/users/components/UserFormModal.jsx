import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser, updateUser } from '../api/userMutations';
import { getDepartments } from '../../departments/api/getDepartments';
import { getFaculties } from '../../faculties/api/getFaculties';
import { getOffices } from '../../offices/api/getOffices';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UserFormModal({ isOpen, onClose, user = null, triggerRect = null }) {
  const queryClient = useQueryClient();
  const isEdit = !!user;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff',
    department: '',
    faculty: '',
    office: ''
  });

  const { data: deptData, isLoading: isLoadingDepts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => getDepartments({ limit: 100 }),
  });

  const { data: facData, isLoading: isLoadingFacs } = useQuery({
    queryKey: ['faculties'],
    queryFn: () => getFaculties({ limit: 100 }),
  });

  const { data: offData, isLoading: isLoadingOffs } = useQuery({
    queryKey: ['offices'],
    queryFn: () => getOffices({ limit: 100 }),
    enabled: isOpen
  });

  const departments = deptData?.data?.departments || deptData?.data || [];
  const faculties = facData?.data?.faculties || facData?.data || [];
  const offices = offData?.data?.offices || offData?.data || [];

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

  // Hydrate form on edit
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'staff',
        department: user.department?.customId || user.department || '',
        faculty: user.faculty?.customId || user.faculty || '',
        office: user.office?.customId || user.office || ''
      });
    } else {
      setFormData({ name: '', email: '', role: 'staff', department: '', faculty: '', office: '' });
    }
  }, [user, isOpen]);

  const mutation = useMutation({
    mutationFn: (data) => {
      return isEdit ? updateUser({ id: user.customId || user._id, data }) : createUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      if (isEdit) {
        toast.success(`User profile updated successfully.`);
      } else {
        toast.success(`Account Created: ${formData.name}`, {
          description: `A system-generated password was sent to ${formData.email}. The user will be required to change it upon first login.`,
          duration: 6000,
        });
      }
      
      onClose();
    },
    onError: (error) => {
      setErrorMsg(error.response?.data?.message || 'Failed to save user.');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const payload = { ...formData };
    
    // Clean up payloads based on role
    if (['admin', 'director'].includes(payload.role)) {
      delete payload.department;
      delete payload.faculty;
      delete payload.office;
    } else if (payload.role === 'dean') {
      delete payload.department;
      delete payload.office;
    } else {
      // For coordinator/staff, we keep what's filled (dept OR office)
      if (payload.office) delete payload.faculty;
      if (payload.department) delete payload.faculty;
    }

    mutation.mutate(payload);
  };

  const showFaculty = formData.role === 'dean';
  const showDept = ['coordinator', 'staff'].includes(formData.role);

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
          <h3 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit User' : 'Create New User'}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input 
                type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input 
                type="email" 
                required 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={isEdit && user?.hasLoggedIn}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {isEdit && user?.hasLoggedIn && (
                <p className="text-[10px] text-amber-600 mt-1 italic font-medium">
                  Email is locked because the user has already activated their account.
                </p>
              )}
            </div>

            {!isEdit && (
              <div className="p-3 bg-blue-50 text-blue-700 text-[10px] rounded-lg border border-blue-100 flex items-start gap-2 italic">
                <span>Temporary password will be sent via email.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">System Role</label>
                <select 
                  value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value, department: '', faculty: ''})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm"
                >
                  <option value="staff">Staff</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="dean">Dean</option>
                  <option value="director">Director</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>

              {showFaculty && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Faculty Assignment</label>
                  <select 
                    required={showFaculty}
                    value={formData.faculty} onChange={(e) => setFormData({...formData, faculty: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm disabled:opacity-50"
                    disabled={isLoadingFacs}
                  >
                    <option value="">Select Faculty</option>
                    {faculties.map(fac => (
                      <option key={fac._id || fac.customId} value={fac.customId}>{fac.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {showDept && (
                <div className="space-y-4 col-span-full">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dept Assignment</label>
                      <select 
                        required={showDept && !formData.office}
                        value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value, office: ''})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm disabled:opacity-50"
                        disabled={isLoadingDepts || !!formData.office}
                      >
                        <option value="">Select Dept</option>
                        {departments.map(dept => (
                          <option key={dept._id || dept.customId} value={dept.customId}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-center pt-6 text-gray-400 font-bold text-xs">
                      OR
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Office Assignment</label>
                    <select 
                      required={showDept && !formData.department}
                      value={formData.office} onChange={(e) => setFormData({...formData, office: e.target.value, department: ''})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm disabled:opacity-50"
                      disabled={isLoadingOffs || !!formData.department}
                    >
                      <option value="">Select Office</option>
                      {offices.map(off => (
                        <option key={off._id || off.customId} value={off.customId}>{off.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1 italic">Standalone offices (Finance, HR, etc.)</p>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-auto">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm">
            Cancel
          </button>
          <button form="user-form" type="submit" disabled={mutation.isPending} className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2">
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}
