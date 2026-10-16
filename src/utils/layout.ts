import dagre from '@dagrejs/dagre';
import type { Edge, Node } from '@xyflow/react';
import type { AnimeNodeData, GraphFilterOptions, ViewMode } from '../types/anime';
import type { RawEdge } from '../api/crawler';

export const NODE_WIDTH = 260;
export const NODE_HEIGHT = 86;
export const COMPACT_NODE_WIDTH = 200;
export const COMPACT_NODE_HEIGHT = 46;

export interface LayoutResult {
  nodes: Node<AnimeNodeData>[];
  edges: Edge[];
}

export function buildDagreLayout(
  mediaMap: Map<number, AnimeNodeData>,
  rawEdges: RawEdge[],
  filters: GraphFilterOptions,
  viewMode: ViewMode = 'detailed',
  theme: 'dark' | 'light' = 'dark'
): LayoutResult {
  let filteredMediaMap = new Map(mediaMap);
  let filteredEdges = [...rawEdges];

  const nodeWidth = viewMode === 'compact' ? COMPACT_NODE_WIDTH : NODE_WIDTH;
  const nodeHeight = viewMode === 'compact' ? COMPACT_NODE_HEIGHT : NODE_HEIGHT;

  if (filters.hideSpinOffs) {
    filteredEdges = filteredEdges.filter(
      (e) => e.type !== 'SPIN_OFF' && e.type !== 'SIDE_STORY'
    );
  }

  if (filters.mainStoryOnly) {
    filteredEdges = filteredEdges.filter(
      (e) => e.type === 'SEQUEL' || e.type === 'PREQUEL'
    );
  }

  const connectedNodeIds = new Set<number>();
  filteredEdges.forEach((e) => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  if (filters.mainStoryOnly || filters.hideSpinOffs) {
    filteredMediaMap.forEach((_, id) => {
      if (!connectedNodeIds.has(id)) {
        if (filteredMediaMap.size > 1) {
          filteredMediaMap.delete(id);
        }
      }
    });
  }

  if (filters.unwatchedOnly) {
    const hasUnwatched = Array.from(filteredMediaMap.values()).some(
      (m) => m.watchStatus !== 'COMPLETED'
    );
    if (hasUnwatched) {
      filteredMediaMap.forEach((media, id) => {
        if (media.watchStatus === 'COMPLETED') {
          filteredMediaMap.delete(id);
        }
      });
      filteredEdges = filteredEdges.filter(
        (e) => filteredMediaMap.has(e.source) && filteredMediaMap.has(e.target)
      );
    }
  }

  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'LR',
    nodesep: viewMode === 'compact' ? 40 : 64,
    ranksep: viewMode === 'compact' ? 100 : 140,
    marginx: 48,
    marginy: 48,
  });

  filteredMediaMap.forEach((media) => {
    g.setNode(media.id.toString(), { width: nodeWidth, height: nodeHeight });
  });

  const validEdges = filteredEdges.filter(
    (e) => filteredMediaMap.has(e.source) && filteredMediaMap.has(e.target)
  );

  validEdges.forEach((edge, index) => {
    try {
      const rawLabel =
        edge.type === 'SEQUEL'
          ? 'Sequel'
          : edge.type === 'SIDE_STORY'
          ? 'Side Story'
          : edge.type === 'SPIN_OFF'
          ? 'Spin-off'
          : edge.type === 'ALTERNATIVE'
          ? 'Alternative'
          : edge.type.replace('_', ' ');

      const labelWidth = Math.max(70, rawLabel.length * 8 + 20);
      const labelHeight = 24;

      let weight = 1;
      let minlen = 1;

      if (filters.orderMode === 'chronological') {
        if (edge.type === 'SEQUEL') {
          weight = 8;
        }
      } else {
        const sourceYear = filteredMediaMap.get(edge.source)?.seasonYear || 0;
        const targetYear = filteredMediaMap.get(edge.target)?.seasonYear || 0;
        if (sourceYear > 0 && targetYear > 0) {
          weight = sourceYear <= targetYear ? 5 : 1;
        } else if (edge.type === 'SEQUEL') {
          weight = 4;
        }
      }

      g.setEdge(
        edge.source.toString(),
        edge.target.toString(),
        { width: labelWidth, height: labelHeight, labelpos: 'c', weight, minlen },
        `e_${index}`
      );
    } catch (err) {
      console.warn('Dagre edge insertion warning:', err);
    }
  });

  try {
    dagre.layout(g);
  } catch (err) {
    console.warn('Dagre layout error fallback:', err);
  }

  const nodes: Node<AnimeNodeData>[] = Array.from(filteredMediaMap.values()).map((media, idx) => {
    const nodeMeta = g.node(media.id.toString());
    const x = nodeMeta && Number.isFinite(nodeMeta.x) ? nodeMeta.x - nodeWidth / 2 : idx * (nodeWidth + 48);
    const y = nodeMeta && Number.isFinite(nodeMeta.y) ? nodeMeta.y - nodeHeight / 2 : 40;

    return {
      id: media.id.toString(),
      type: 'animeNode',
      position: { x, y },
      width: nodeWidth,
      height: nodeHeight,
      measured: {
        width: nodeWidth,
        height: nodeHeight,
      },
      data: {
        ...media,
        viewMode,
      },
    };
  });

  const formattedEdges: Edge[] = validEdges.map((e, index) => {
    const isSequel = e.type === 'SEQUEL';
    const isSpinOff = e.type === 'SPIN_OFF' || e.type === 'SIDE_STORY';
    const isAlternative = e.type === 'ALTERNATIVE';

    const label = e.type === 'SEQUEL' 
      ? 'Sequel' 
      : e.type === 'SIDE_STORY' 
      ? 'Side Story' 
      : e.type === 'SPIN_OFF' 
      ? 'Spin-off' 
      : e.type === 'ALTERNATIVE' 
      ? 'Alternative' 
      : e.type.replace('_', ' ');

    const strokeColor = isSequel 
      ? (theme === 'light' ? '#8b5cf6' : '#c4b5fd')
      : isSpinOff 
      ? (theme === 'light' ? '#059669' : '#a7f3d0')
      : isAlternative 
      ? (theme === 'light' ? '#ea580c' : '#fed7aa')
      : (theme === 'light' ? '#64748b' : '#94a3b8');

    const dagreEdge = g.edge(e.source.toString(), e.target.toString(), `e_${index}`);

    return {
      id: `e-${e.source}-${e.target}-${index}-${viewMode}`,
      source: e.source.toString(),
      target: e.target.toString(),
      type: 'animeEdge',
      animated: isSequel,
      style: {
        stroke: strokeColor,
        strokeWidth: isSequel ? 2 : 1.5,
        strokeDasharray: isSpinOff ? '4,4' : undefined,
        opacity: theme === 'light' ? 0.95 : 0.85,
      },
      data: {
        points: dagreEdge?.points,
        label,
        isSequel,
        isSpinOff,
        isAlternative,
        theme,
      },
    };
  });

  return { nodes, edges: formattedEdges };
}
