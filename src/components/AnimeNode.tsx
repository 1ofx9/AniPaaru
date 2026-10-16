import { memo, useLayoutEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { Check } from 'lucide-react';
import type { AnimeNodeData } from '../types/anime';
import { formatMediaType, formatEpisodeCount } from '../utils/formatters';
import { Tooltip } from './Tooltip';

interface AnimeNodeProps {
  id: string;
  data: AnimeNodeData;
  selected?: boolean;
}

export const AnimeNode = memo(({ id, data, selected }: AnimeNodeProps) => {
  const updateNodeInternals = useUpdateNodeInternals();

  useLayoutEffect(() => {
    updateNodeInternals(id);
  }, [id, data.viewMode, updateNodeInternals]);

  const isCompleted = data.watchStatus === 'COMPLETED';
  const isCurrent = data.watchStatus === 'CURRENT';
  const isPlanning = data.watchStatus === 'PLANNING';
  const isNextUp = data.isNextUp;

  const displayTitle = data.title?.english || data.title?.romaji || 'Unknown Title';
  const formattedFormat = formatMediaType(data.format);
  const episodesText =
    isCurrent && typeof data.userProgress === 'number'
      ? `${data.userProgress}/${data.episodes || '?'} EPS`
      : formatEpisodeCount(data.episodes, data.status);
  const scoreFormatted = data.averageScore ? `${(data.averageScore / 10).toFixed(1)}★` : null;

  if (data.viewMode === 'compact') {
    return (
      <div
        className={`relative group flex items-center w-50 h-11.5 rounded-lg px-2 py-1 transition-all duration-200
          bg-white dark:bg-[#09090b]/90 backdrop-blur-md border text-zinc-900 dark:text-zinc-100 shadow-sm dark:shadow-md select-none cursor-pointer
          ${
            selected || data.isHighlighted
              ? 'opacity-100'
              : data.isDimmed
              ? 'opacity-45 hover:opacity-95'
              : 'opacity-100'
          }
          ${
            selected
              ? 'border-zinc-950 dark:border-white ring-2 ring-zinc-950/20 dark:ring-white/40 shadow-md'
              : data.isHighlighted
              ? 'border-[#7c3aed] dark:border-[#c4b5fd] ring-2 ring-[#8b5cf6]/50 shadow-[0_0_15px_rgba(139,92,246,0.25)]'
              : isNextUp
              ? 'border-[#7c3aed] dark:border-[#c4b5fd]/70 shadow-[0_2px_12px_-2px_rgba(124,58,237,0.25)]'
              : isCurrent
              ? 'border-[#d97706] dark:border-[#fde68a]/70 shadow-[0_2px_12px_-2px_rgba(217,119,6,0.2)]'
              : isPlanning
              ? 'border-[#0284c7] dark:border-[#bae6fd]/50'
              : isCompleted
              ? 'border-zinc-300 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-[#09090b]/80'
              : 'border-zinc-300/90 dark:border-zinc-800/80 hover:border-zinc-500 dark:hover:border-zinc-600'
          }
        `}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-1.5! h-1.5! bg-zinc-400! dark:bg-zinc-600! border-0!"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-1.5! h-1.5! bg-zinc-400! dark:bg-zinc-600! border-0!"
        />

        <div className="relative shrink-0 w-7 h-9.5 rounded overflow-hidden bg-zinc-100 dark:bg-zinc-900 mr-2 border border-zinc-300/80 dark:border-white/5">
          {data.coverImage?.medium || data.coverImage?.large ? (
            <img
              src={data.coverImage.medium || data.coverImage.large}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-[7px] font-mono">
              —
            </div>
          )}
          {isCompleted && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[0.5px] flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-[#a7f3d0] stroke-[2.5]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
          <Tooltip content={displayTitle} side="top" delayMs={250} wrapperClassName="min-w-0 max-w-full">
            <h4 className="text-[11px] font-semibold truncate leading-tight text-zinc-950 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors">
              {displayTitle}
            </h4>
          </Tooltip>
          <div className="flex items-center gap-1.5 font-mono text-[8.5px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-none">
            <span className="font-semibold text-zinc-800 dark:text-zinc-300 uppercase">
              {formattedFormat}
            </span>
            <span>·</span>
            <span>{episodesText}</span>
            {scoreFormatted && (
              <>
                <span>·</span>
                <span className="text-zinc-700 dark:text-zinc-300">{scoreFormatted}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative group flex items-center w-65 h-20 rounded-xl px-2.5 py-2 transition-all duration-200
        bg-white dark:bg-[#09090b]/90 backdrop-blur-md border text-zinc-900 dark:text-zinc-100 shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-xl select-none cursor-pointer
        ${
          selected || data.isHighlighted
            ? 'opacity-100'
            : data.isDimmed
            ? 'opacity-45 hover:opacity-95'
            : 'opacity-100'
        }
        ${
          selected
            ? 'border-zinc-950 dark:border-white ring-2 ring-zinc-950/20 dark:ring-white/40 shadow-lg'
            : data.isHighlighted
            ? 'border-[#7c3aed] dark:border-[#c4b5fd] ring-2 ring-[#8b5cf6]/50 shadow-[0_0_20px_rgba(139,92,246,0.25)]'
            : isNextUp
            ? 'border-[#7c3aed] dark:border-[#c4b5fd]/70 shadow-[0_4px_20px_-2px_rgba(124,58,237,0.25)] dark:shadow-[0_0_20px_-4px_rgba(196,181,253,0.18)]'
            : isCurrent
            ? 'border-[#d97706] dark:border-[#fde68a]/70 shadow-[0_4px_20px_-2px_rgba(217,119,6,0.2)] dark:shadow-[0_0_15px_-4px_rgba(253,230,138,0.14)]'
            : isPlanning
            ? 'border-[#0284c7] dark:border-[#bae6fd]/50 shadow-[0_4px_16px_-2px_rgba(2,132,199,0.18)] dark:shadow-none'
            : isCompleted
            ? 'border-zinc-300 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-[#09090b]/80'
            : 'border-zinc-300/90 dark:border-zinc-800/80 hover:border-zinc-500 dark:hover:border-zinc-600'
        }
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-1.5! h-1.5! bg-zinc-400! dark:bg-zinc-600! border-0!"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-1.5! h-1.5! bg-zinc-400! dark:bg-zinc-600! border-0!"
      />

      <div className="relative shrink-0 w-10 h-14 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 mr-2.5 border border-zinc-300/80 dark:border-white/5">
        {data.coverImage?.medium || data.coverImage?.large ? (
          <img
            src={data.coverImage.medium || data.coverImage.large}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-[8px] font-mono">
            —
          </div>
        )}

        {isCompleted && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[0.5px] flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-[#a7f3d0] stroke-[2.5]" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 leading-none">
          <span className="font-semibold text-zinc-900 dark:text-zinc-300">
            {formattedFormat}
          </span>
          <span className="text-zinc-400 dark:text-zinc-600">//</span>
          <span className="text-zinc-600 dark:text-zinc-400">
            {episodesText}
          </span>
          {scoreFormatted && (
            <span className="text-zinc-800 dark:text-zinc-300 ml-auto font-mono font-medium">
              {scoreFormatted}
            </span>
          )}
        </div>

        <div className="min-w-0 my-0.5">
          <Tooltip content={displayTitle} side="top" delayMs={250} wrapperClassName="min-w-0 max-w-full">
            <h4 className="text-[11.5px] font-semibold truncate leading-tight text-zinc-950 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors">
              {displayTitle}
            </h4>
          </Tooltip>
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-zinc-200/80 dark:border-white/5 leading-none">
          <div className="flex items-center gap-1.5 uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            {isNextUp ? (
              <span className="flex items-center gap-1 font-semibold text-purple-950 dark:text-zinc-100">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] dark:bg-[#c4b5fd]" />
                Next Up
              </span>
            ) : isCurrent ? (
              <span className="flex items-center gap-1 font-medium text-amber-950 dark:text-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] dark:bg-[#fde68a]" />
                Watching
                {typeof data.userProgress === 'number' && (
                  <span className="text-zinc-600 dark:text-zinc-400 font-mono text-[9px] font-normal lowercase">
                    ({data.userProgress}/{data.episodes || '?'})
                  </span>
                )}
              </span>
            ) : isPlanning ? (
              <span className="flex items-center gap-1 font-medium text-sky-950 dark:text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] dark:bg-[#bae6fd]" />
                Planning
              </span>
            ) : isCompleted ? (
              <span className="flex items-center gap-1 font-medium text-emerald-950 dark:text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] dark:bg-[#a7f3d0]" />
                Completed
              </span>
            ) : (
              <span className="text-zinc-500 dark:text-zinc-500 font-medium">Unwatched</span>
            )}
          </div>

          {data.seasonYear && (
            <span className="text-zinc-400 dark:text-zinc-500 font-mono">
              {data.seasonYear}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

AnimeNode.displayName = 'AnimeNode';
