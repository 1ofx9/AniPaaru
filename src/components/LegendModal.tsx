import React, { useEffect, useRef } from 'react';
import { X, Check, Search, CornerDownLeft, Filter } from 'lucide-react';
import { Tooltip } from './Tooltip';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/80 pointer-events-auto transition-all backdrop-blur-xs">
      <div
        ref={modalRef}
        className="w-full max-w-xl max-h-[88vh] bg-[#f8f8fa] dark:bg-[#0c0c0e] border border-zinc-200/90 dark:border-white/10 rounded-2xl shadow-2xl relative text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close Button Row */}
        <div className="flex justify-end p-4 pb-0">
          <Tooltip content="Close (Esc)" side="left">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto px-6 pb-6 pt-1 space-y-5 text-xs">
          {/* Status Indicators */}
          <div className="space-y-2.5">
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-mono font-semibold block">
              Watch Status
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
              <div className="px-3.5 py-2.5 rounded-xl bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/80 dark:border-white/5 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] dark:bg-[#c4b5fd] shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Next Up</span>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans block mt-0.5">Prerequisites met — start here</span>
                </div>
              </div>

              <div className="px-3.5 py-2.5 rounded-xl bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/80 dark:border-white/5 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] dark:bg-[#fde68a] shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Watching</span>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans block mt-0.5">In progress on your list</span>
                </div>
              </div>

              <div className="px-3.5 py-2.5 rounded-xl bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/80 dark:border-white/5 flex items-center gap-3">
                <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#a7f3d0] shrink-0 stroke-[2.5]" />
                <div className="min-w-0">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Completed</span>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans block mt-0.5">Watched (softened opacity)</span>
                </div>
              </div>

              <div className="px-3.5 py-2.5 rounded-xl bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/80 dark:border-white/5 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] dark:bg-[#bae6fd] shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Planning</span>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans block mt-0.5">Saved to your plan-to-watch</span>
                </div>
              </div>

              <div className="px-3.5 py-2.5 rounded-xl bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/80 dark:border-white/5 flex items-center gap-3 sm:col-span-2">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Unwatched</span>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans block mt-0.5">Not yet started or not in your profile</span>
                </div>
              </div>
            </div>
          </div>

          {/* Relation Connections */}
          <div className="space-y-2.5 pt-3.5 border-t border-zinc-200/80 dark:border-white/10">
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-mono font-semibold block">
              Timeline Connections
            </span>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/80 dark:border-white/5">
                <span className="w-7 h-0.5 bg-[#8b5cf6] dark:bg-[#c4b5fd] rounded-full shrink-0" />
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Canonical Sequel</span>
                  <span className="text-zinc-600 dark:text-zinc-400 text-[11px] font-sans block mt-0.5">Direct chronological line (main story timeline)</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/80 dark:border-white/5">
                <span className="w-7 border-t border-dashed border-[#059669] dark:border-[#a7f3d0] shrink-0" />
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Side Story • Spin-off</span>
                  <span className="text-zinc-600 dark:text-zinc-400 text-[11px] font-sans block mt-0.5">Parallel stories, OVAs, or spin-offs</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/80 dark:border-white/5">
                <span className="w-7 h-0.5 bg-[#ea580c] dark:bg-[#fed7aa] rounded-full shrink-0" />
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Alternative Setting</span>
                  <span className="text-zinc-600 dark:text-zinc-400 text-[11px] font-sans block mt-0.5">Alternate routes, reboots, or alternate universes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Features */}
          <div className="space-y-2.5 pt-3.5 border-t border-zinc-200/80 dark:border-white/10">
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-mono font-semibold block">
              Search Shortcuts
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/80 dark:border-white/5">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  <Search className="w-3.5 h-3.5 text-[#8b5cf6] dark:text-[#c4b5fd]" />
                  <span>Links &amp; IDs</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                  Paste an AniList or MAL link, or type an ID like <code className="px-1 py-0.2 bg-zinc-200/80 dark:bg-white/10 rounded font-mono text-[10px]">113415</code> to open it directly.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/80 dark:border-white/5">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  <CornerDownLeft className="w-3.5 h-3.5 text-[#8b5cf6] dark:text-[#c4b5fd]" />
                  <span>In-Graph Jump</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                  Type while viewing a series to center and highlight that specific node on the canvas.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/80 dark:border-white/5 sm:col-span-2">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  <Filter className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                  <span>Search Filters</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                  Filter by format (TV, Movie, OVA, ONA, Special) or release year right in the search bar. Try queries like <code className="px-1 py-0.5 bg-zinc-200/80 dark:bg-white/10 rounded font-mono text-[10px]">fate movie</code>, <code className="px-1 py-0.5 bg-zinc-200/80 dark:bg-white/10 rounded font-mono text-[10px]">bleach 2022</code>, or <code className="px-1 py-0.5 bg-zinc-200/80 dark:bg-white/10 rounded font-mono text-[10px]">type:ova</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="space-y-2.5 pt-3.5 border-t border-zinc-200/80 dark:border-white/10">
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-mono font-semibold block">
              Keyboard Navigation
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/60 dark:border-white/5">
                <span className="text-zinc-600 dark:text-zinc-400 font-sans">Search</span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded text-[10px]">⌘K</kbd>
                  <span className="text-zinc-400">or</span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded text-[10px]">/</kbd>
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/60 dark:border-white/5">
                <span className="text-zinc-600 dark:text-zinc-400 font-sans">Navigate</span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded text-[10px]">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded text-[10px]">↓</kbd>
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/60 dark:border-white/5">
                <span className="text-zinc-600 dark:text-zinc-400 font-sans">Select</span>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded text-[10px]">Enter ↵</kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#eeeff2] dark:bg-white/3 border border-zinc-200/60 dark:border-white/5">
                <span className="text-zinc-600 dark:text-zinc-400 font-sans">Dismiss</span>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded text-[10px]">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
