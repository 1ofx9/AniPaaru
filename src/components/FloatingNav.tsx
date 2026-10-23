import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  User,
  Filter,
  HelpCircle,
  X,
  Sun,
  Moon,
  Loader2,
  Star,
  CornerDownLeft,
  ArrowUpDown,
  AlertCircle,
  Home,
  History,
  Trash2,
  Crosshair,
  ExternalLink,
} from 'lucide-react';
import type { Node as FlowNode } from '@xyflow/react';
import { searchAnime } from '../api/anilist';
import type { AnimeNodeData, AniListUser, AniListMedia, GraphFilterOptions, SearchHistoryItem, UserMediaListEntry } from '../types/anime';
import { formatMediaType, formatEpisodeCount } from '../utils/formatters';
import { parseSearchInput } from '../utils/searchParser';
import { Tooltip } from './Tooltip';

interface FloatingNavProps {
  user: AniListUser | null;
  userName: string;
  isLoadingUser: boolean;
  userError?: string | null;
  onClearUserError?: () => void;
  onSyncUser: (name: string) => Promise<boolean> | void;
  onRefreshUser: () => void;
  onLogoutUser: () => void;
  filters: GraphFilterOptions;
  onUpdateFilters: (filters: Partial<GraphFilterOptions>) => void;
  onOpenLegend: () => void;
  hasActiveAnime: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSelectFranchise: (id: number) => void;
  onClearFranchise?: () => void;
  nodes?: FlowNode<AnimeNodeData>[];
  userEntries?: Map<number, UserMediaListEntry> | null;
  onFocusNode?: (id: number) => void;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({
  user,
  userName,
  isLoadingUser,
  userError,
  onClearUserError,
  onSyncUser,
  onRefreshUser,
  onLogoutUser,
  filters,
  onUpdateFilters,
  onOpenLegend,
  hasActiveAnime,
  theme,
  onToggleTheme,
  onSelectFranchise,
  onClearFranchise,
  nodes,
  userEntries,
  onFocusNode,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [inputUsername, setInputUsername] = useState(userName);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AniListMedia[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [recents, setRecents] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('anipaaru_recents');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('anipaaru_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecents = (list: SearchHistoryItem[]) => {
    setRecents(list);
    try {
      localStorage.setItem('anipaaru_recents', JSON.stringify(list));
    } catch {}
  };

  const saveFavorites = (list: SearchHistoryItem[]) => {
    setFavorites(list);
    try {
      localStorage.setItem('anipaaru_favorites', JSON.stringify(list));
    } catch {}
  };

  const addToRecents = (item: SearchHistoryItem) => {
    const filtered = recents.filter((r) => r.id !== item.id);
    const updated = [item, ...filtered].slice(0, 6);
    saveRecents(updated);
  };

  const removeRecent = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    saveRecents(recents.filter((r) => r.id !== id));
  };

  const clearAllRecents = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveRecents([]);
  };

  const toggleFavorite = (item: SearchHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const exists = favorites.some((f) => f.id === item.id);
    if (exists) {
      saveFavorites(favorites.filter((f) => f.id !== item.id));
    } else {
      saveFavorites([item, ...favorites].slice(0, 12));
    }
  };

  const handleSelectAnime = (item: SearchHistoryItem) => {
    addToRecents(item);
    onSelectFranchise(item.id);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
  };

  const filterRef = useRef<HTMLDivElement>(null);
  const userModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  const isPastedRef = useRef(false);
  const searchCacheRef = useRef<Map<string, AniListMedia[]>>(new Map());

  const parsedQuery = useMemo(() => {
    return parseSearchInput(searchQuery);
  }, [searchQuery]);

  const inGraphMatches = useMemo(() => {
    if (!nodes || nodes.length === 0 || !searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    if (q.startsWith('http') || q.includes('.co') || q.includes('.net')) return [];

    return nodes
      .filter((node) => {
        const eng = (node.data.title.english || '').toLowerCase();
        const rom = (node.data.title.romaji || '').toLowerCase();
        const nat = (node.data.title.native || '').toLowerCase();
        return eng.includes(q) || rom.includes(q) || nat.includes(q);
      })
      .slice(0, 4);
  }, [nodes, searchQuery]);

  const selectableItems = useMemo(() => {
    const items: Array<
      | { type: 'graph'; id: number; node: FlowNode<AnimeNodeData> }
      | { type: 'media'; id: number; media: AniListMedia }
    > = [];

    for (const node of inGraphMatches) {
      items.push({ type: 'graph', id: node.data.id, node });
    }

    for (const media of searchResults) {
      if (!inGraphMatches.some((n) => n.data.id === media.id)) {
        items.push({ type: 'media', id: media.id, media });
      }
    }

    return items;
  }, [inGraphMatches, searchResults]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      setSelectedIndex(0);
      return;
    }

    const parsed = parseSearchInput(trimmed);
    const isDirect = parsed.type === 'anilist_url' || parsed.type === 'numeric_id' || parsed.type === 'mal_url';

    // In-memory cache check
    const cacheKey = JSON.stringify(parsed);
    if (searchCacheRef.current.has(cacheKey)) {
      setSearchResults(searchCacheRef.current.get(cacheKey)!);
      setIsSearching(false);
      return;
    }

    // P1: Rate limit guard - require at least 2 characters unless direct ID/URL or inline filters
    if (!isDirect && parsed.cleanText.length < 2 && !parsed.format_in && !parsed.seasonYear) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();
    const delay = isPastedRef.current || isDirect ? 0 : 220;
    isPastedRef.current = false;

    const timeout = setTimeout(async () => {
      try {
        const res = await searchAnime(trimmed, controller.signal);
        searchCacheRef.current.set(cacheKey, res);
        setSearchResults(res);
        setSelectedIndex(0);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Search error:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, delay);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | PointerEvent) {
      const target = event.target as Node;
      if (filterRef.current && !filterRef.current.contains(target)) {
        setIsFilterOpen(false);
      }
      if (userModalRef.current && !userModalRef.current.contains(target)) {
        setIsUserModalOpen(false);
      }
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(target) &&
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(target)
      ) {
        setSearchResults([]);
        setIsSearchFocused(false);
      }
    }

    document.addEventListener('pointerdown', handleClickOutside, true);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearchFocused(false);
      searchInputRef.current?.blur();
      return;
    }

    if (selectableItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % selectableItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + selectableItems.length) % selectableItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = selectableItems[selectedIndex];
      if (target) {
        if (target.type === 'graph') {
          onFocusNode?.(target.id);
          setIsSearchFocused(false);
          setSearchQuery('');
          setSearchResults([]);
          searchInputRef.current?.blur();
        } else {
          handleSelectAnime({
            id: target.media.id,
            title: target.media.title.english || target.media.title.romaji || 'Unknown Title',
            coverImage: target.media.coverImage?.medium || target.media.coverImage?.large,
            format: target.media.format,
            seasonYear: target.media.seasonYear,
          });
        }
      }
    }
  };

  const renderWatchlistBadge = (mediaId: number) => {
    if (!userEntries) return null;
    const entry = userEntries.get(mediaId);
    if (!entry) return null;

    let label = '';
    let colorClasses = '';

    switch (entry.status) {
      case 'COMPLETED':
        label = 'Completed';
        colorClasses = 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20';
        break;
      case 'CURRENT':
        label = entry.progress ? `Watching (${entry.progress} ep)` : 'Watching';
        colorClasses = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
        break;
      case 'PLANNING':
        label = 'Plan to Watch';
        colorClasses = 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20';
        break;
      case 'PAUSED':
        label = 'Paused';
        colorClasses = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20';
        break;
      case 'DROPPED':
        label = 'Dropped';
        colorClasses = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20';
        break;
      default:
        label = entry.status;
        colorClasses = 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/20';
    }

    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono border font-medium ${colorClasses}`}>
        <span>{label}</span>
        {entry.score && entry.score > 0 ? <span>• ★{entry.score}</span> : null}
      </span>
    );
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUsername.trim()) {
      onClearUserError?.();
      const success = await onSyncUser(inputUsername.trim());
      if (success) {
        setIsUserModalOpen(false);
      }
    }
  };

  const hasActiveFilters =
    filters.mainStoryOnly ||
    filters.hideSpinOffs ||
    filters.unwatchedOnly ||
    filters.orderMode === 'chronological';
  const hasSearchResults = searchQuery.trim().length > 0;

  return (
    <>
      <header
        className={`fixed z-40 pointer-events-none left-1/2 -translate-x-1/2 transition-all duration-300 ease-out w-full px-3 sm:px-0 sm:w-fit ${
          hasActiveAnime
            ? 'top-4 sm:top-5 translate-y-0'
            : !hasActiveAnime && isSearchFocused
            ? 'top-8 sm:top-1/2 sm:-translate-y-1/2'
            : 'top-1/2 -translate-y-1/2 flex flex-col items-center justify-center'
        }`}
      >
        <div
          ref={searchWrapperRef}
          className="relative pointer-events-auto flex flex-col items-center w-full sm:w-auto transition-all duration-300"
        >
          {!hasActiveAnime && (
            <div className={`mb-4 sm:mb-6 flex flex-col items-center text-center select-none pointer-events-none transition-all duration-200 ${
              isSearchFocused ? 'opacity-0 h-0 overflow-hidden sm:opacity-100 sm:h-auto' : 'opacity-100'
            }`}>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 dark:text-white font-sans">
                Ani<span className="text-[#8b5cf6] dark:text-[#c4b5fd]">Paaru</span>
              </h1>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono tracking-wider">
                Watch Order &amp; Relations
              </p>
            </div>
          )}

          <div
            className={`relative bg-[#fafafc]/92 dark:bg-zinc-950/40 backdrop-blur-md border border-zinc-300/70 dark:border-white/10 rounded-full flex items-center justify-between transition-all w-full sm:w-auto ${
              hasActiveAnime
                ? 'px-2.5 sm:px-3 py-1.5 gap-1 sm:gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-2xl'
                : 'px-3 sm:px-4 py-2 sm:py-3 min-h-11 sm:min-h-13 gap-1.5 sm:gap-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)]'
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 pl-0.5 sm:pl-1 pr-1 flex-1 min-w-0">
              {hasActiveAnime && onClearFranchise && (
                <Tooltip content="Back to search" side="bottom">
                  <button
                    type="button"
                    onClick={onClearFranchise}
                    className="w-6 h-6 rounded-full text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer mr-0.5 shrink-0"
                  >
                    <Home className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              )}
              <Search
                className={`text-zinc-400 dark:text-zinc-500 shrink-0 ${
                  hasActiveAnime ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-4 h-4 sm:w-4.5 sm:h-4.5'
                }`}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={hasActiveAnime ? "Search, jump, or paste..." : "Search anime, paste link or ID..."}
                value={searchQuery}
                onFocus={() => {
                  setIsSearchFocused(true);
                  setIsFilterOpen(false);
                  setIsUserModalOpen(false);
                }}
                onPaste={() => {
                  isPastedRef.current = true;
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className={`bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none transition-all duration-200 flex-1 min-w-0 ${
                  hasActiveAnime
                    ? 'sm:w-44 sm:focus:w-64'
                    : 'sm:w-60 sm:focus:w-80 text-xs sm:text-base'
                }`}
              />
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 animate-spin shrink-0" />
              ) : searchQuery ? (
                <Tooltip content="Clear search" side="bottom">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setIsSearchFocused(true);
                      searchInputRef.current?.focus();
                    }}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/4 border border-zinc-200 dark:border-white/10 text-[10px] font-mono text-zinc-400 select-none">
                  ⌘K
                </kbd>
              )}
            </div>

            <div className={`w-px bg-zinc-200 dark:bg-white/10 mx-0.5 ${hasActiveAnime ? 'h-4' : 'h-5'}`} />

            <div ref={filterRef}>
              <Tooltip content="Timeline Filters" side="bottom">
                <button
                  onClick={() => {
                    setIsFilterOpen(!isFilterOpen);
                    if (!isFilterOpen) {
                      setIsUserModalOpen(false);
                      setSearchResults([]);
                      setIsSearchFocused(false);
                    }
                  }}
                  className={`relative w-8 h-8 rounded-full border text-xs font-medium flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                    hasActiveFilters
                      ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30 text-[#7c3aed] dark:bg-white/15 dark:border-white/20 dark:text-white'
                      : 'bg-transparent border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/6'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  {hasActiveFilters && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#8b5cf6] dark:bg-[#c4b5fd]" />
                  )}
                </button>
              </Tooltip>

              {isFilterOpen && (
                <div className="absolute right-0 sm:right-3 top-full mt-3 w-56 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl border border-zinc-300/80 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-2.5 z-50 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 pt-2 pb-1 font-semibold block font-sans">
                    Timeline Filters
                  </span>

                  <button
                    type="button"
                    onClick={() => onUpdateFilters({ mainStoryOnly: !filters.mainStoryOnly })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-sans transition-colors cursor-pointer ${
                      filters.mainStoryOnly
                        ? 'bg-[#8b5cf6]/10 text-[#6d28d9] border border-[#8b5cf6]/20 dark:bg-white/15 dark:text-white dark:border-transparent font-medium'
                        : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>Main Story Only</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        filters.mainStoryOnly
                          ? 'bg-[#8b5cf6] dark:bg-[#c4b5fd]'
                          : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateFilters({ hideSpinOffs: !filters.hideSpinOffs })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-sans transition-colors cursor-pointer ${
                      filters.hideSpinOffs
                        ? 'bg-[#059669]/10 text-[#047857] border border-[#059669]/20 dark:bg-white/15 dark:text-white dark:border-transparent font-medium'
                        : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>Hide Spin-offs</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        filters.hideSpinOffs
                          ? 'bg-[#059669] dark:bg-[#a7f3d0]'
                          : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateFilters({ unwatchedOnly: !filters.unwatchedOnly })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-sans transition-colors cursor-pointer ${
                      filters.unwatchedOnly
                        ? 'bg-[#f59e0b]/10 text-[#b45309] border border-[#f59e0b]/20 dark:bg-white/15 dark:text-white dark:border-transparent font-medium'
                        : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>Unwatched Only</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        filters.unwatchedOnly
                          ? 'bg-[#f59e0b] dark:bg-[#fde68a]'
                          : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    />
                  </button>

                  <div className="mt-1 pt-1.5 border-t border-zinc-200 dark:border-white/10">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 py-1 font-semibold block font-sans">
                      Graph Order
                    </span>
                    <div className="grid grid-cols-2 gap-1 px-1 py-1 bg-zinc-100 dark:bg-white/5 rounded-xl">
                      <button
                        type="button"
                        onClick={() => onUpdateFilters({ orderMode: 'release' })}
                        className={`py-1.5 text-[11px] font-sans font-medium rounded-lg transition-colors cursor-pointer ${
                          filters.orderMode === 'release'
                            ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                        }`}
                      >
                        Release
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateFilters({ orderMode: 'chronological' })}
                        className={`py-1.5 text-[11px] font-sans font-medium rounded-lg transition-colors cursor-pointer ${
                          filters.orderMode === 'chronological'
                            ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                        }`}
                      >
                        Chronological
                      </button>
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateFilters({
                          mainStoryOnly: false,
                          hideSpinOffs: false,
                          unwatchedOnly: false,
                          orderMode: 'release',
                        })
                      }
                      className="mt-1 pt-2 border-t border-zinc-200 dark:border-white/10 text-[11px] font-sans text-zinc-500 dark:text-zinc-400 hover:text-[#7c3aed] dark:hover:text-white py-1 text-center w-full cursor-pointer transition-colors"
                    >
                      Reset all filters
                    </button>
                  )}
                </div>
              )}
            </div>

            <div ref={userModalRef}>
              {user ? (
                <div className="flex items-center gap-1.5 bg-black/4 dark:bg-white/4 border border-zinc-200 dark:border-white/5 rounded-full pl-1.5 pr-2 py-0.5 text-xs">
                  {user.avatar?.medium ? (
                    <img
                      src={user.avatar.medium}
                      alt={user.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center text-[9px] font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-zinc-800 dark:text-zinc-200 text-xs max-w-20 truncate font-medium">
                    {user.name}
                  </span>
                  <Tooltip content="Refresh AniList" side="bottom">
                    <button
                      onClick={onRefreshUser}
                      disabled={isLoadingUser}
                      className="text-zinc-400 hover:text-zinc-800 dark:hover:text-white cursor-pointer active:scale-95 transition-transform"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingUser ? 'animate-spin' : ''}`} />
                    </button>
                  </Tooltip>
                  <Tooltip content="Disconnect" side="bottom">
                    <button
                      onClick={onLogoutUser}
                      className="text-zinc-400 hover:text-red-500 cursor-pointer active:scale-95 transition-transform"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Tooltip>
                </div>
              ) : (
                <Tooltip content="Connect AniList" side="bottom">
                  <button
                    onClick={() => {
                      setIsUserModalOpen(!isUserModalOpen);
                      if (!isUserModalOpen) {
                        setIsFilterOpen(false);
                        setSearchResults([]);
                        onClearUserError?.();
                      }
                    }}
                    className={`w-8 h-8 rounded-full border text-xs font-medium flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                      isUserModalOpen
                        ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30 text-[#7c3aed] dark:bg-white/15 dark:border-white/20 dark:text-white'
                        : 'bg-transparent border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/6'
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </button>
                </Tooltip>
              )}

              {isUserModalOpen && !user && (
                <div className="absolute right-0 sm:right-3 top-full mt-3 w-64 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl border border-zinc-300/80 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-3 z-50 flex flex-col gap-2.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-semibold font-sans">
                      Connect AniList
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserModalOpen(false);
                        onClearUserError?.();
                      }}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-white/5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <form onSubmit={handleUserSubmit} className="space-y-2">
                    <input
                      type="text"
                      placeholder="AniList username..."
                      value={inputUsername}
                      onChange={(e) => {
                        setInputUsername(e.target.value);
                        if (userError) onClearUserError?.();
                      }}
                      autoFocus
                      className="w-full px-3 py-2 text-xs bg-zinc-100 dark:bg-white/4 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-xl border border-zinc-200 dark:border-white/10 focus:outline-none focus:border-[#8b5cf6]/50 dark:focus:border-white/20 transition-colors"
                    />

                    {userError && (
                      <div className="p-2 rounded-xl bg-red-500/10 dark:bg-red-500/15 border border-red-500/25 text-red-600 dark:text-red-400 text-[11px] leading-tight flex items-start gap-1.5 font-sans">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{userError}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserModalOpen(false);
                          onClearUserError?.();
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-white/10 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!inputUsername.trim() || isLoadingUser}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 text-xs font-semibold disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {isLoadingUser ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          'Connect'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="hidden sm:block">
              <Tooltip content={theme === 'dark' ? 'Light Mode' : 'Dark Mode'} side="bottom">
                <button
                  onClick={onToggleTheme}
                  className="w-8 h-8 rounded-full bg-transparent hover:bg-black/5 dark:hover:bg-white/6 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </Tooltip>
            </div>

            <Tooltip content="Legend & Guide" side="bottom">
              <button
                onClick={onOpenLegend}
                className="w-8 h-8 rounded-full bg-transparent hover:bg-black/5 dark:hover:bg-white/6 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>

          {(hasSearchResults || (isSearchFocused && (favorites.length > 0 || recents.length > 0))) && (
            <div
              ref={searchDropdownRef}
              className={`${
                hasActiveAnime
                  ? 'absolute left-1/2 -translate-x-1/2 top-full mt-2'
                  : 'relative mt-3'
              } w-[calc(100vw-32px)] sm:w-110 max-w-md bg-[#fafafc]/98 dark:bg-[#0c0c0e]/95 backdrop-blur-xl border border-zinc-300/70 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden z-50 flex flex-col animate-in fade-in zoom-in-95 duration-150`}
            >
              {hasSearchResults ? (
                <>
                  {(parsedQuery.type !== 'text' || parsedQuery.format_in || parsedQuery.seasonYear) && (
                    <div className="px-3 py-1.5 bg-zinc-100/80 dark:bg-white/4 border-b border-zinc-200/60 dark:border-white/5 flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
                      {parsedQuery.type === 'anilist_url' && (
                        <span className="flex items-center gap-1 text-[#8b5cf6] dark:text-[#c4b5fd]">
                          <ExternalLink className="w-3 h-3" /> AniList URL (ID #{parsedQuery.id})
                        </span>
                      )}
                      {parsedQuery.type === 'mal_url' && (
                        <span className="flex items-center gap-1 text-[#8b5cf6] dark:text-[#c4b5fd]">
                          <ExternalLink className="w-3 h-3" /> MyAnimeList URL (ID #{parsedQuery.idMal})
                        </span>
                      )}
                      {parsedQuery.type === 'numeric_id' && (
                        <span className="flex items-center gap-1 text-[#8b5cf6] dark:text-[#c4b5fd]">
                          Direct ID Match: #{parsedQuery.id}
                        </span>
                      )}
                      {parsedQuery.format_in && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-white/10 uppercase font-semibold">
                          Format: {parsedQuery.format_in.join(', ')}
                        </span>
                      )}
                      {parsedQuery.seasonYear && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-white/10">
                          Year: {parsedQuery.seasonYear}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="max-h-85 overflow-y-auto p-2">
                    {isSearching && searchResults.length === 0 && inGraphMatches.length === 0 ? (
                      <div className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 dark:text-zinc-500" />
                        <span>Searching...</span>
                      </div>
                    ) : searchResults.length === 0 && inGraphMatches.length === 0 ? (
                      <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                        No anime found matching "{searchQuery}"
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {inGraphMatches.length > 0 && (
                          <div className="mb-2">
                            <div className="px-2.5 py-1 text-[10px] font-semibold text-[#8b5cf6] dark:text-[#c4b5fd] font-mono uppercase tracking-wider flex items-center gap-1.5">
                              <Crosshair className="w-3 h-3" />
                              In Current Graph (Jump to Node)
                            </div>
                            <div className="space-y-0.5 mt-0.5">
                              {inGraphMatches.map((node, idx) => {
                                const isSelected = selectedIndex === idx;
                                const title = node.data.title.english || node.data.title.romaji;
                                const subTitle =
                                  node.data.title.english &&
                                  node.data.title.romaji &&
                                  node.data.title.english !== node.data.title.romaji
                                    ? node.data.title.romaji
                                    : null;
                                const score = node.data.averageScore ? `${node.data.averageScore}%` : null;

                                return (
                                  <div
                                    key={`node-${node.data.id}`}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    onClick={() => {
                                      onFocusNode?.(node.data.id);
                                      setIsSearchFocused(false);
                                      setSearchQuery('');
                                      setSearchResults([]);
                                      searchInputRef.current?.blur();
                                    }}
                                    className={`p-2 rounded-xl cursor-pointer flex items-center gap-3 transition-colors ${
                                      isSelected
                                        ? 'bg-[#8b5cf6]/10 text-zinc-950 dark:bg-[#8b5cf6]/15 dark:text-white'
                                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/4'
                                    }`}
                                  >
                                    <img
                                      src={typeof node.data.coverImage === 'string' ? node.data.coverImage : (node.data.coverImage?.medium || node.data.coverImage?.large)}
                                      alt=""
                                      className="w-8.5 h-12 object-cover rounded-lg bg-zinc-100 dark:bg-zinc-900 shrink-0 border border-zinc-300/80 dark:border-white/5"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-semibold truncate leading-tight flex items-center gap-1.5">
                                        <span className="truncate">{title}</span>
                                        {renderWatchlistBadge(node.data.id)}
                                      </div>
                                      {subTitle && (
                                        <div className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">
                                          {subTitle}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                                        <span className="uppercase font-semibold text-zinc-800 dark:text-zinc-300">
                                          {formatMediaType(node.data.format)}
                                        </span>
                                        {node.data.seasonYear && <span>• {node.data.seasonYear}</span>}
                                        {node.data.episodes && <span>• {node.data.episodes} EPS</span>}
                                      </div>
                                    </div>

                                    <div className="shrink-0 flex flex-col items-end justify-between self-stretch py-0.5 font-mono text-[10px]">
                                      <div className="h-4 flex items-center pr-1">
                                        {isSelected && (
                                          <span className="flex items-center gap-1 text-[#8b5cf6] dark:text-[#c4b5fd] font-medium animate-in fade-in duration-100">
                                            <span>Jump</span>
                                            <Crosshair className="w-3 h-3" />
                                          </span>
                                        )}
                                      </div>
                                      {score && (
                                        <span className="text-zinc-700 dark:text-zinc-300 flex items-center gap-0.5 pr-1">
                                          <Star className="w-2.5 h-2.5 fill-current text-amber-500 dark:text-zinc-400" />
                                          {score}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {searchResults.length > 0 && (
                          <div>
                            {inGraphMatches.length > 0 && (
                              <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 font-mono uppercase tracking-wider flex items-center gap-1.5">
                                <Search className="w-3 h-3" />
                                All Anime
                              </div>
                            )}
                            <div className="space-y-0.5 mt-0.5">
                              {searchResults.map((item, searchIdx) => {
                                const overallIndex = inGraphMatches.length + searchIdx;
                                const isSelected = overallIndex === selectedIndex;
                                const title = item.title.english || item.title.romaji;
                                const subTitle =
                                  item.title.english &&
                                  item.title.romaji &&
                                  item.title.english !== item.title.romaji
                                    ? item.title.romaji
                                    : null;
                                const score = item.averageScore ? `${item.averageScore}%` : null;

                                return (
                                  <div
                                    key={item.id}
                                    onMouseEnter={() => setSelectedIndex(overallIndex)}
                                    onClick={() => {
                                      handleSelectAnime({
                                        id: item.id,
                                        title: item.title.english || item.title.romaji || 'Unknown Title',
                                        coverImage: item.coverImage?.medium || item.coverImage?.large,
                                        format: item.format,
                                        seasonYear: item.seasonYear,
                                      });
                                    }}
                                    className={`p-2 rounded-xl cursor-pointer flex items-center gap-3 transition-colors ${
                                      isSelected
                                        ? 'bg-zinc-100 text-zinc-950 dark:bg-white/8 dark:text-white'
                                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/4'
                                    }`}
                                  >
                                    <img
                                      src={item.coverImage?.medium || item.coverImage?.large}
                                      alt=""
                                      className="w-8.5 h-12 object-cover rounded-lg bg-zinc-100 dark:bg-zinc-900 shrink-0 border border-zinc-300/80 dark:border-white/5"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-semibold truncate leading-tight flex items-center gap-1.5">
                                        <span className="truncate">{title}</span>
                                        {renderWatchlistBadge(item.id)}
                                      </div>
                                      {subTitle && (
                                        <div className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">
                                          {subTitle}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                                        <span className="uppercase font-semibold text-zinc-800 dark:text-zinc-300">
                                          {formatMediaType(item.format)}
                                        </span>
                                        {item.seasonYear && <span>• {item.seasonYear}</span>}
                                        <span>• {formatEpisodeCount(item.episodes, item.status)}</span>
                                      </div>
                                    </div>

                                    <div className="shrink-0 flex flex-col items-end justify-between self-stretch py-0.5 font-mono text-[10px]">
                                      <div className="h-4 flex items-center pr-1">
                                        {isSelected && (
                                          <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 animate-in fade-in duration-100">
                                            <span>Open</span>
                                            <CornerDownLeft className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
                                          </span>
                                        )}
                                      </div>
                                      {score && (
                                        <span className="text-zinc-700 dark:text-zinc-300 flex items-center gap-0.5 pr-1">
                                          <Star className="w-2.5 h-2.5 fill-current text-amber-500 dark:text-zinc-400" />
                                          {score}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:flex px-4 py-2 bg-zinc-50 dark:bg-black/40 border-t border-zinc-200/80 dark:border-white/5 items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" /> Navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
                          ↵
                        </kbd>{' '}
                        Select
                      </span>
                    </div>
                    <span>ESC to close</span>
                  </div>
                </>
              ) : (
                <div className="max-h-85 overflow-y-auto p-2 space-y-2">
                  {favorites.length > 0 && (
                    <div>
                      <div className="px-2.5 py-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                        <Star className="w-3 h-3 fill-current" />
                        Favorites
                      </div>
                      <div className="space-y-0.5 mt-0.5">
                        {favorites.map((item) => (
                          <div
                            key={`fav-${item.id}`}
                            onClick={() => handleSelectAnime(item)}
                            className="p-1.5 rounded-xl cursor-pointer flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/6 transition-colors group"
                          >
                            <img
                              src={item.coverImage}
                              alt=""
                              className="w-7 h-9.5 object-cover rounded bg-zinc-100 dark:bg-zinc-900 shrink-0 border border-zinc-300/80 dark:border-white/5"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold truncate leading-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <span className="truncate">{item.title}</span>
                                {renderWatchlistBadge(item.id)}
                              </div>
                              <div className="flex items-center gap-1.5 text-[9.5px] text-zinc-500 font-mono mt-0.5">
                                <span className="uppercase font-semibold text-zinc-700 dark:text-zinc-300">
                                  {formatMediaType(item.format)}
                                </span>
                                {item.seasonYear && <span>• {item.seasonYear}</span>}
                              </div>
                            </div>
                            <Tooltip content="Remove from favorites" side="left">
                              <button
                                type="button"
                                onClick={(e) => toggleFavorite(item, e)}
                                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                              >
                                <Star className="w-3.5 h-3.5 fill-current" />
                              </button>
                            </Tooltip>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recents.length > 0 && (
                    <div>
                      <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 font-mono uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <History className="w-3 h-3" />
                          Recent Searches
                        </span>
                        <button
                          type="button"
                          onClick={clearAllRecents}
                          className="text-[9.5px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer font-sans normal-case"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-0.5 mt-0.5">
                        {recents.map((item) => {
                          const isFav = favorites.some((f) => f.id === item.id);
                          return (
                            <div
                              key={`rec-${item.id}`}
                              onClick={() => handleSelectAnime(item)}
                              className="p-1.5 rounded-xl cursor-pointer flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/6 transition-colors group"
                            >
                              <img
                                src={item.coverImage}
                                alt=""
                                className="w-7 h-9.5 object-cover rounded bg-zinc-100 dark:bg-zinc-900 shrink-0 border border-zinc-300/80 dark:border-white/5"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold truncate leading-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                  <span className="truncate">{item.title}</span>
                                  {renderWatchlistBadge(item.id)}
                                </div>
                                <div className="flex items-center gap-1.5 text-[9.5px] text-zinc-500 font-mono mt-0.5">
                                  <span className="uppercase font-semibold text-zinc-700 dark:text-zinc-300">
                                    {formatMediaType(item.format)}
                                  </span>
                                  {item.seasonYear && <span>• {item.seasonYear}</span>}
                                </div>
                              </div>
                              <Tooltip content={isFav ? 'Remove favorite' : 'Add favorite'} side="left">
                                <button
                                  type="button"
                                  onClick={(e) => toggleFavorite(item, e)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isFav
                                      ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                      : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-200 dark:hover:bg-white/10'
                                  }`}
                                >
                                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                                </button>
                              </Tooltip>
                              <Tooltip content="Remove from history" side="left">
                                <button
                                  type="button"
                                  onClick={(e) => removeRecent(item.id, e)}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </Tooltip>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
};
