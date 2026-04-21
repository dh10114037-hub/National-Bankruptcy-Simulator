import type { LogEntry } from '../types/game';

interface LogPanelProps {
  log: LogEntry[];
}

function formatDelta(val: number | undefined): React.ReactNode {
  if (val === undefined || val === 0) return null;
  const sign = val > 0 ? '+' : '';
  const color = val > 0 ? 'text-emerald-600' : 'text-red-500';
  return <span className={`${color} font-mono text-xs`}>{sign}{val}</span>;
}

export function LogPanel({ log }: LogPanelProps) {
  if (log.length === 0) {
    return (
      <div className="text-center text-gray-600 text-sm py-6">
        还没有历史记录，开始游戏吧
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
      {log.map((entry, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-gray-500 font-medium">第 {entry.turn} 月</span>
            {entry.speculatorAction && (
              <span className="text-red-500 text-xs">{entry.speculatorAction}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-700 mb-1">
            <span>{entry.eventIcon}</span>
            <span className="text-amber-700">{entry.event}</span>
            <span className="text-gray-400">→</span>
            <span>{entry.policyIcon}</span>
            <span className="text-blue-600">{entry.policy}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500">
            <span>外储 {formatDelta(entry.netChange.foreign_reserves)}</span>
            <span>民心 {formatDelta(entry.netChange.public_support)}</span>
            <span>信用 {formatDelta(entry.netChange.credit_rating)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
