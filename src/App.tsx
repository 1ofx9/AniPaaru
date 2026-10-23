import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useReactFlow,
  PanOnScrollMode,
} from '@xyflow/react';
import type { NodeMouseHandler, Node, Edge } from '@xyflow/react';
import { AnimeNode } from './components/AnimeNode';
import { AnimeEdge } from './components/AnimeEdge';
import { FloatingNav } from './components/FloatingNav';
import { CanvasControls } from './components/CanvasControls';
import { useFranchise } from './hooks/useFranchise';
import { useAniListUser } from './hooks/useAniListUser';
import { useTheme } from './hooks/useTheme';
import type { AnimeNodeData, GraphFilterOptions, ViewMode } from './types/anime';
import { Loader2, AlertCircle } from 'lucide-react';

const DetailSheet = lazy(() => import('./components/DetailSheet').then((m) => ({ default: m.DetailSheet })));
const LegendModal = lazy(() => import('./components/LegendModal').then((m) => ({ default: m.LegendModal })));

const nodeTypes = {
  animeNode: AnimeNode,
};

const edgeTypes = {
  animeEdge: AnimeEdge,
};

interface CanvasViewProps {
  nodes: Node<AnimeNodeData>[];
  edges: Edge[];
  theme: 'dark' | 'light';
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  isLoading: boolean;
  selectedMediaId: number | null;
  targetFocusNodeId?: number | null;
  onSelectNode: (id: number) => void;
  onResetToEmpty: () => void;
  hasActiveAnime: boolean;
}

function CanvasView({
  nodes,
  edges,
  theme,
  viewMode,
  onToggleViewMode,
  isLoading,
  selectedMediaId,
  targetFocusNodeId,
  onSelectNode,
  onResetToEmpty,
  hasActiveAnime,
}: CanvasViewProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  const { fitView, setCenter } = useReactFlow();

  const nodeOffsetX = viewMode === 'compact' ? 100 : 130;
  const nodeOffsetY = viewMode === 'compact' ? 23 : 43;

  useEffect(() => {
    if (!targetFocusNodeId) return;
    const targetNode = nodes.find((n) => n.id === targetFocusNodeId.toString());
    if (targetNode) {
      setCenter(targetNode.position.x + nodeOffsetX, targetNode.position.y + nodeOffsetY, {
        zoom: 1.05,
        duration: 500,
      });
    }
  }, [targetFocusNodeId, nodes, setCenter, nodeOffsetX, nodeOffsetY]);

  const hasFittedInitialRef = useRef(false);
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    if (nodes.length === 0) return;

    const shouldFitInitial = !hasFittedInitialRef.current;
    const shouldFitComplete = wasLoadingRef.current && !isLoading;

    if (shouldFitInitial || shouldFitComplete) {
      if (shouldFitInitial) {
        hasFittedInitialRef.current = true;
      }

      const nextNode = nodes.find((n) => n.data.isNextUp);

      const timer = setTimeout(() => {
        if (shouldFitComplete && nextNode) {
          setCenter(nextNode.position.x + nodeOffsetX, nextNode.position.y + nodeOffsetY, {
            zoom: 0.95,
            duration: 600,
          });
        } else if (shouldFitInitial && nextNode) {
          const isMobile = window.innerWidth < 640;
          setCenter(nextNode.position.x + nodeOffsetX, nextNode.position.y + nodeOffsetY, {
            zoom: isMobile ? 0.75 : 0.95,
            duration: 400,
          });
        } else {
          fitView({
            padding: window.innerWidth < 640 ? 0.2 : 0.12,
            minZoom: 0.5,
            maxZoom: 1.0,
            duration: shouldFitComplete ? 500 : 400,
          });
        }
      }, 80);
      return () => clearTimeout(timer);
    }

    wasLoadingRef.current = isLoading;
  }, [nodes, isLoading, fitView, setCenter, nodeOffsetX, nodeOffsetY]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      onSelectNode(parseInt(node.id, 10));
    },
    [onSelectNode]
  );

  const handleCenterNextUp = useCallback(() => {
    const nextNode = nodes.find((n) => n.data.isNextUp);
    if (nextNode) {
      setCenter(nextNode.position.x + nodeOffsetX, nextNode.position.y + nodeOffsetY, {
        zoom: 0.95,
        duration: 500,
      });
    }
  }, [nodes, setCenter, nodeOffsetX, nodeOffsetY]);

  const hasNextUp = useMemo(() => {
    return nodes.some((n) => n.data.isNextUp);
  }, [nodes]);

  const activeFocusId = hoveredNodeId ?? selectedMediaId;

  const { highlightedNodeIds, highlightedEdgeIds } = useMemo(() => {
    if (!activeFocusId) {
      return { highlightedNodeIds: null, highlightedEdgeIds: null };
    }

    const targetStr = activeFocusId.toString();
    const nodeIds = new Set<string>([targetStr]);
    const edgeIds = new Set<string>();

    for (const edge of edges) {
      if (edge.target === targetStr && !edge.data?.isSequel) {
        nodeIds.add(edge.source);
        edgeIds.add(edge.id);
      }
      if (edge.source === targetStr && !edge.data?.isSequel) {
        nodeIds.add(edge.target);
        edgeIds.add(edge.id);
      }
    }

    const spineSeeds = Array.from(nodeIds);
    for (const seed of spineSeeds) {
      let currBack = seed;
      while (true) {
        const inEdge = edges.find((e) => e.target === currBack && e.data?.isSequel);
        if (inEdge && !nodeIds.has(inEdge.source)) {
          nodeIds.add(inEdge.source);
          edgeIds.add(inEdge.id);
          currBack = inEdge.source;
        } else {
          break;
        }
      }

      let currFwd = seed;
      while (true) {
        const outEdge = edges.find((e) => e.source === currFwd && e.data?.isSequel);
        if (outEdge && !nodeIds.has(outEdge.target)) {
          nodeIds.add(outEdge.target);
          edgeIds.add(outEdge.id);
          currFwd = outEdge.target;
        } else {
          break;
        }
      }
    }

    return { highlightedNodeIds: nodeIds, highlightedEdgeIds: edgeIds };
  }, [activeFocusId, edges]);

  const displayNodes = useMemo(() => {
    if (!highlightedNodeIds) return nodes;
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isHighlighted: highlightedNodeIds.has(node.id),
        isDimmed: !highlightedNodeIds.has(node.id),
      },
    }));
  }, [nodes, highlightedNodeIds]);

  const displayEdges = useMemo(() => {
    if (!highlightedEdgeIds) return edges;
    return edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        isHighlighted: highlightedEdgeIds.has(edge.id),
        isDimmed: !highlightedEdgeIds.has(edge.id),
      },
    }));
  }, [edges, highlightedEdgeIds]);

  return (
    <>
      <div className="w-full h-full canvas-bg-dots">
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={(_, node) => setHoveredNodeId(parseInt(node.id, 10))}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          onPaneClick={() => {
            onSelectNode(0);
            setHoveredNodeId(null);
          }}
          fitView
          fitViewOptions={{
            padding: 0.12,
            minZoom: 0.65,
            maxZoom: 1.25,
          }}
          minZoom={0.25}
          maxZoom={2.0}
          panOnScroll={true}
          panOnScrollMode={PanOnScrollMode.Free}
          zoomOnPinch={true}
          panOnDrag={true}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          defaultEdgeOptions={{
            type: 'animeEdge',
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={theme === 'dark' ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)"}
          />
        </ReactFlow>
      </div>

      {hasActiveAnime && (
        <CanvasControls
          onCenterNextUp={handleCenterNextUp}
          hasNextUp={hasNextUp}
          onResetToEmpty={onResetToEmpty}
          viewMode={viewMode}
          onToggleViewMode={onToggleViewMode}
        />
      )}
    </>
  );
}

export default function App() {
  const { theme, toggleTheme } = useTheme();

  const [filters, setFilters] = useState<GraphFilterOptions>(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      mainStoryOnly: params.get('main') === '1',
      hideSpinOffs: params.get('spinoffs') === '0',
      unwatchedOnly: params.get('unwatched') === '1',
      orderMode: params.get('order') === 'chronological' ? 'chronological' : 'release',
    };
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'compact' ? 'compact' : 'detailed';
  });

  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const {
    userName,
    user,
    userEntries,
    isLoadingUser,
    userError,
    setUserName,
    refreshUser,
    logout,
    clearUserError,
  } = useAniListUser();

  const {
    rootMediaId,
    isLoading,
    progress,
    error,
    nodes,
    edges,
    franchiseStats,
    selectedMediaId,
    selectedMedia,
    loadFranchise,
    clearFranchise,
    setSelectedMediaId,
  } = useFranchise(userEntries, filters, viewMode, theme);

  const [targetFocusNodeId, setTargetFocusNodeId] = useState<number | null>(null);

  const handleFocusNode = useCallback((id: number) => {
    setSelectedMediaId(id);
    setTargetFocusNodeId(id);
    const timer = setTimeout(() => setTargetFocusNodeId(null), 600);
    return () => clearTimeout(timer);
  }, [setSelectedMediaId]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (rootMediaId) {
      url.searchParams.set('id', rootMediaId.toString());
    } else {
      url.searchParams.delete('id');
    }

    if (filters.mainStoryOnly) url.searchParams.set('main', '1');
    else url.searchParams.delete('main');

    if (filters.hideSpinOffs) url.searchParams.set('spinoffs', '0');
    else url.searchParams.delete('spinoffs');

    if (filters.unwatchedOnly) url.searchParams.set('unwatched', '1');
    else url.searchParams.delete('unwatched');

    if (filters.orderMode === 'chronological') url.searchParams.set('order', 'chronological');
    else url.searchParams.delete('order');

    if (viewMode === 'compact') url.searchParams.set('view', 'compact');
    else url.searchParams.delete('view');

    window.history.replaceState({}, '', url.toString());
  }, [rootMediaId, filters, viewMode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#ebebee] dark:bg-black text-zinc-900 dark:text-zinc-100 select-none transition-colors duration-200">
      <FloatingNav
        user={user}
        userName={userName}
        isLoadingUser={isLoadingUser}
        userError={userError}
        onClearUserError={clearUserError}
        onSyncUser={setUserName}
        onRefreshUser={refreshUser}
        onLogoutUser={logout}
        filters={filters}
        onUpdateFilters={(newFilters) =>
          setFilters((prev) => ({ ...prev, ...newFilters }))
        }
        onOpenLegend={() => setIsLegendOpen(true)}
        hasActiveAnime={Boolean(rootMediaId)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSelectFranchise={loadFranchise}
        onClearFranchise={clearFranchise}
        nodes={nodes}
        userEntries={userEntries}
        onFocusNode={handleFocusNode}
      />

      {rootMediaId && franchiseStats && !isLoading && (
        <div className="fixed top-17 sm:top-20 inset-x-0 mx-auto w-fit max-w-[calc(100vw-2rem)] z-20 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/90 dark:bg-zinc-950/70 backdrop-blur-md border border-zinc-200/90 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-xl flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-zinc-600 dark:text-zinc-400 select-none animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="font-semibold text-zinc-950 dark:text-zinc-100 shrink-0">
            {franchiseStats.completedEntries}/{franchiseStats.totalEntries} Watched
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span className="text-[#8b5cf6] dark:text-[#c4b5fd] font-semibold shrink-0">
            {franchiseStats.percentComplete}%
          </span>
          <span className="text-zinc-300 dark:text-zinc-700 hidden xs:inline">·</span>
          <span className="hidden xs:inline truncate">
            {franchiseStats.remainingEpisodes > 0
              ? `${franchiseStats.remainingEpisodes} EPS (~${franchiseStats.remainingHours}h remaining)`
              : 'Complete'}
          </span>
        </div>
      )}

      {rootMediaId && isLoading && progress && (
        <div className="fixed top-20 inset-x-0 mx-auto w-fit z-30 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-white/10 shadow-sm flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 animate-in fade-in duration-150">
          {progress.rateLimitSeconds ? (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
          ) : (
            <Loader2 className="w-3 h-3 text-zinc-400 dark:text-zinc-500 animate-spin shrink-0" />
          )}
          <span className="font-medium text-zinc-900 dark:text-zinc-200">
            {progress.loaded}/{progress.total}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          {progress.rateLimitSeconds ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Rate limited · Resuming in {progress.rateLimitSeconds}s
            </span>
          ) : (
            <span className="max-w-45 sm:max-w-60 truncate text-zinc-500 dark:text-zinc-400">
              {progress.currentTitle}
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="fixed top-20 inset-x-0 mx-auto w-fit max-w-md z-30 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-300 text-xs shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
          <span className="truncate">{error}</span>
          {rootMediaId && (
            <button
              onClick={() => loadFranchise(rootMediaId)}
              className="ml-2 px-2 py-1 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium text-[10px] hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors cursor-pointer shrink-0"
            >
              Retry
            </button>
          )}
          <button
            onClick={clearFranchise}
            className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-[10px] hover:text-black dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <ReactFlowProvider key={`${rootMediaId ?? 'home'}-${viewMode}-${filters.orderMode}`}>
        <CanvasView
          nodes={nodes}
          edges={edges}
          theme={theme}
          viewMode={viewMode}
          onToggleViewMode={() =>
            setViewMode((v) => (v === 'compact' ? 'detailed' : 'compact'))
          }
          isLoading={isLoading}
          selectedMediaId={selectedMediaId}
          targetFocusNodeId={targetFocusNodeId}
          onSelectNode={(id) => setSelectedMediaId(id || null)}
          onResetToEmpty={clearFranchise}
          hasActiveAnime={Boolean(rootMediaId)}
        />
      </ReactFlowProvider>

      <Suspense fallback={null}>
        <DetailSheet
          media={selectedMedia}
          onClose={() => setSelectedMediaId(null)}
        />
        <LegendModal
          isOpen={isLegendOpen}
          onClose={() => setIsLegendOpen(false)}
        />
      </Suspense>
    </div>
  );
}
