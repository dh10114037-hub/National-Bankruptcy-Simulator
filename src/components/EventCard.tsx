import type { Event } from '../types/game';

interface EventCardProps {
  event: Event | null;
}

const severityStyle = {
  high:     'border-red-300 bg-red-50',
  medium:   'border-amber-300 bg-amber-50',
  low:      'border-blue-300 bg-blue-50',
  positive: 'border-emerald-300 bg-emerald-50',
};

const severityLabel = {
  high:     { text: '严重', color: 'text-red-700 bg-red-100' },
  medium:   { text: '中等', color: 'text-amber-700 bg-amber-100' },
  low:      { text: '轻微', color: 'text-blue-700 bg-blue-100' },
  positive: { text: '利好', color: 'text-emerald-700 bg-emerald-100' },
};

export function EventCard({ event }: EventCardProps) {
  if (!event) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-gray-500 text-sm">
        等待下一轮事件...
      </div>
    );
  }

  const style = severityStyle[event.severity];
  const label = severityLabel[event.severity];

  const effectLines = Object.entries(event.effects).map(([key, val]) => {
    const names: Record<string, string> = {
      foreign_reserves: '外汇储备',
      public_support: '民众支持',
      credit_rating: '国家信用',
    };
    const sign = (val as number) > 0 ? '+' : '';
    const color = (val as number) > 0 ? 'text-emerald-600' : 'text-red-500';
    return (
      <span key={key} className={`${color} text-xs font-mono`}>
        {names[key]} {sign}{val as number}
      </span>
    );
  });

  return (
    <div className={`rounded-xl border p-4 ${style} transition-all`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{event.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-base">{event.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${label.color}`}>
                {label.text}
              </span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed mb-3">{event.description}</p>
      <div className="flex flex-wrap gap-2">
        {effectLines}
      </div>
    </div>
  );
}
