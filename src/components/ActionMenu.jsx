import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { useRef } from 'react';

/**
 * Reusable Action Menu (Kebab Menu)
 * Built with Radix DropdownMenu to guarantee portaled dynamic positioning.
 */
export default function ActionMenu({ actions = [] }) {
  const triggerRef = useRef(null);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          ref={triggerRef}
          className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 outline-none flex items-center justify-center cursor-pointer"
          title="Actions"
        >
          <MoreVertical size={18} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          collisionPadding={10}
          className="w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-[99999] min-w-[7rem] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {actions.map((action, idx) => (
            <DropdownMenu.Item
              key={idx}
              disabled={action.disabled}
              onSelect={(e) => {
                if (action.onClick) {
                  const rect = triggerRef.current?.getBoundingClientRect();
                  action.onClick(rect);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-1.5 sm:py-2 text-[13px] sm:text-sm transition-colors cursor-pointer outline-none select-none ${
                action.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
              } ${
                action.variant === 'danger' 
                  ? 'text-red-600 focus:bg-red-50 focus:text-red-700 hover:bg-red-50' 
                  : 'text-gray-700 focus:bg-gray-100 focus:text-primary hover:bg-gray-100'
              }`}
            >
              <div className="shrink-0 flex items-center justify-center w-4 sm:w-5">
                {action.icon && React.cloneElement(action.icon, { size: 14, className: 'sm:size-[16px]' })}
              </div>
              <span className="font-bold sm:font-medium">{action.label}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
