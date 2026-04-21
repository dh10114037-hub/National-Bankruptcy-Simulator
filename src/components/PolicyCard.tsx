import type { Policy } from '../types/game';

interface PolicyCardProps {
  policy: Policy;
  onClick: () => void;
  disabled?: boolean;
}

// 推荐标签配置
const RECOMMENDATION_CONFIG = {
  survival: { label: '🔥 紧急救援', className: 'bg-red-100 text-red-700 border-red-200' },
  balanced: { label: '⚖️ 均衡之选', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  growth: { label: '📈 长期发展', className: 'bg-green-100 text-green-700 border-green-200' },
  negative: { label: '⚠️ 高风险', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  safe: { label: '🛡️ 安全保底', className: 'bg-blue-50 text-blue-600 border-blue-200' },
};

export function PolicyCard({ policy, onClick, disabled }: PolicyCardProps) {
  const effectLines = Object.entries(policy.effects).map(([key, val]) => {
    const names: Record<string, string> = {
      foreign_reserves: '外储',
      public_support: '民心',
      credit_rating: '信用',
    };
    const sign = (val as number) > 0 ? '+' : '';
    const color = (val as number) > 0 ? 'text-emerald-600' : 'text-red-500';
    return (
      <span key={key} className={`${color} text-xs font-mono`}>
        {names[key]}{sign}{val as number}
      </span>
    );
  });

  // 获取推荐标签
  const recConfig = policy.recommendation ? RECOMMENDATION_CONFIG[policy.recommendation] : null;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group w-full text-left rounded-xl border p-4 transition-all duration-200
        ${disabled
          ? 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md cursor-pointer active:scale-[0.98]'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl group-hover:scale-110 transition-transform">{policy.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="font-bold text-gray-900 text-sm">{policy.name}</div>
            {recConfig && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap ${recConfig.className}`}>
                {recConfig.label}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs leading-relaxed mb-2">{policy.description}</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {effectLines}
          </div>
          <div className="text-gray-400 text-xs italic border-t border-gray-100 pt-2">
            💬 {policy.tradeoff}
          </div>
        </div>
      </div>
    </button>
  );
}
