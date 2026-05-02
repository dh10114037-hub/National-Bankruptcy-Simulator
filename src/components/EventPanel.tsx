import { useEffect, useRef } from 'react';
import type { Event, LogEntry } from '../types/game';

interface EventPanelProps {
  currentEvent: Event | null;
  log: LogEntry[];
  isRevealing: boolean;
}

const severityStyle = {
  high:     { border: 'border-red-300',     bg: 'bg-red-50',    badge: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
  medium:   { border: 'border-amber-300',   bg: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  low:      { border: 'border-blue-300',    bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  positive: { border: 'border-emerald-300', bg: 'bg-emerald-50',badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};

const severityLabel = { high: '严重', medium: '中等', low: '轻微', positive: '利好' };

const highlightKeywords: Record<string, string> = {
  '挤兑': 'text-red-400 font-bold',
  '暴乱': 'text-red-400 font-bold',
  '崩溃': 'text-red-400 font-bold',
  '暴跌': 'text-red-400 font-bold',
  '腐败': 'text-amber-400 font-bold',
  '违约': 'text-red-400 font-bold',
  '抗议': 'text-amber-400 font-bold',
};

function highlightText(text: string) {
  const keywords = Object.keys(highlightKeywords);
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let earliestIdx = -1;
    let earliestKw = '';
    for (const kw of keywords) {
      const idx = remaining.indexOf(kw);
      if (idx !== -1 && (earliestIdx === -1 || idx < earliestIdx)) {
        earliestIdx = idx;
        earliestKw = kw;
      }
    }
    if (earliestIdx === -1) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
    if (earliestIdx > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, earliestIdx)}</span>);
    }
    parts.push(
      <span key={key++} className={highlightKeywords[earliestKw]}>
        {earliestKw}
      </span>
    );
    remaining = remaining.slice(earliestIdx + earliestKw.length);
  }
  return parts;
}

function EffectTags({ effects }: { effects: Record<string, number> }) {
  const names: Record<string, string> = {
    foreign_reserves: '外储',
    public_support: '民心',
    credit_rating: '信用',
  };
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {Object.entries(effects).map(([k, v]) => {
        const isPositive = v > 0;
        const color = isPositive
          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
          : 'text-red-600 bg-red-50 border border-red-200';
        return (
          <span key={k} className={`${color} text-xs font-mono px-2 py-0.5 rounded flex items-center gap-1`}>
            <span className="font-bold">{isPositive ? '▲' : '▼'}</span>
            <span>{names[k]} {isPositive ? '+' : ''}{v}</span>
          </span>
        );
      })}
    </div>
  );
}

export function EventPanel({ currentEvent, log, isRevealing }: EventPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top when new event appears
  useEffect(() => {
    if (currentEvent && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentEvent]);

  return (
    <div className="flex flex-col h-full">
      {/* Heading */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-red-500 text-xs animate-pulse">●</span>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest font-mono">
          突发新闻
        </h2>
        <span className="cursor-blink text-green-500 text-xs">_</span>
      </div>

      {/* Current event */}
      {currentEvent ? (
        <div
          className={`
            rounded-xl border p-4 mb-4
            ${isRevealing ? 'slide-in-left' : ''}
            ${severityStyle[currentEvent.severity].border}
            ${severityStyle[currentEvent.severity].bg}
            ${currentEvent.severity === 'high' ? 'border-pulse-red' : ''}
            transition-all
          `}
        >
          <div className="flex items-start gap-3 mb-2">
            <span className="text-2xl flex-shrink-0">{currentEvent.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-gray-900 text-sm">{currentEvent.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${severityStyle[currentEvent.severity].badge}`}>
                  {severityLabel[currentEvent.severity]}
                </span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                {highlightText(currentEvent.description)}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-200/60 pt-2">
            <span className="text-[10px] text-gray-400 font-mono">影响</span>
            <EffectTags effects={currentEvent.effects as Record<string, number>} />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-4 text-center text-gray-400 text-xs">
          等待下月事件...
        </div>
      )}

      {/* History */}
      <div className="flex-1 overflow-hidden">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest font-mono mb-2">
          历史事件
        </h3>
        <div ref={scrollRef} className="space-y-2 overflow-y-auto max-h-64 scrollbar-thin pr-1">
          {log.slice(0, 8).map((entry, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-xs"
            >
              <span className="text-base flex-shrink-0">{entry.eventIcon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-gray-400 font-mono text-[10px]">第{entry.turn}月</span>
                  <span className="text-gray-600 truncate">{entry.event}</span>
                </div>
                <div className="text-gray-400 text-[10px]">
                  → {entry.policyIcon} {entry.policy}
                </div>
              </div>
            </div>
          ))}
          {log.length === 0 && (
            <div className="text-gray-300 text-xs text-center py-4">暂无历史</div>
          )}
        </div>
      </div>
    </div>
  );
}
