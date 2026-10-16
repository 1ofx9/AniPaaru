import React, { useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

interface LegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegendModal: React.FC<LegendModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | PointerEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('pointerdown', handleClickOutside, true);
      return () => document.removeEventListener('pointerdown', handleClickOutside, true);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/80 pointer-events-auto transition-all">
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl relative text-zinc-900 dark:text-zinc-100 flex flex-col gap-5"
      >
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-500 uppercase tracking-widest font-mono font-semibold block">
            Status Indicators
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/3 border border-zinc-200/80 dark:border-white/5 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] dark:bg-[#c4b5fd] shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Next Up</span>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans block mt-0.5">Prerequisites met — start here</span>
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/3 border border-zinc-200/80 dark:border-white/5 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] dark:bg-[#fde68a] shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Watching</span>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans block mt-0.5">In progress on your list</span>
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/3 border border-zinc-200/80 dark:border-white/5 flex items-center gap-3">
              <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#a7f3d0] shrink-0 stroke-[2.5]" />
              <div className="min-w-0">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Completed</span>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans block mt-0.5">Watched (softened opacity)</span>
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/3 border border-zinc-200/80 dark:border-white/5 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] dark:bg-[#bae6fd] shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Planning</span>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans block mt-0.5">Saved to your plan-to-watch</span>
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/3 border border-zinc-200/80 dark:border-white/5 flex items-center gap-3 sm:col-span-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600 shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Unwatched</span>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans block mt-0.5">Not yet started or not in your AniList profile</span>
              </div>
            </div>

          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-white/10">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-500 uppercase tracking-widest font-mono font-semibold block">
            Connections
          </span>
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/3 border border-zinc-200/80 dark:border-white/5">
              <span className="w-7 h-0.5 bg-[#8b5cf6] dark:bg-[#c4b5fd] rounded-full shrink-0" />
              <div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Canonical Sequel</span>
                <span className="text-zinc-600 dark:text-zinc-400 text-[11px] font-sans block mt-0.5">Direct chronological line (main story timeline)</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/3 border border-zinc-200/80 dark:border-white/5">
              <span className="w-7 border-t border-dashed border-[#059669] dark:border-[#a7f3d0] shrink-0" />
              <div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Side Story // Spin-off</span>
                <span className="text-zinc-600 dark:text-zinc-400 text-[11px] font-sans block mt-0.5">Non-linear parallel content, OVAs, or spin-offs</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/3 border border-zinc-200/80 dark:border-white/5">
              <span className="w-7 h-0.5 bg-[#ea580c] dark:bg-[#fed7aa] rounded-full shrink-0" />
              <div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Alternative Setting</span>
                <span className="text-zinc-600 dark:text-zinc-400 text-[11px] font-sans block mt-0.5">Alternative route, reboot, or parallel universe</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
