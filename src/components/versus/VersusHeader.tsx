/**
 * 双人对抗 - 顶部共享状态栏（浅色主题，H5 响应式）
 */

import type { VersusCountry, VersusMarket } from '../../types/versus';

interface Props {
  country:     VersusCountry;
  market:      VersusMarket;
  turn:        number;
  maxTurns:    number;
  phase:       string;
  crisisLevel: number;
  onBack?:     () => void;
}

const PHASE_LABEL: Record<string, { text: string; color: string; icon: string }> = {
  intel:        { text: '情报阶段',   color: 'text-blue-600',   icon: '🔍' },
  spec_action:  { text: '投机者行动', color: 'text-amber-600',  icon: '💸' },
  savior_action:{ text: '拯救者决策', color: 'text-emerald-600',icon: '🏛' },
  settlement:   { text: '市场结算中', color: 'text-orange-600', icon: '⚙️' },
  feedback:     { text: '结算反馈',   color: 'text-purple-600', icon: '📊' },
  game_over:    { text: '游戏结束',   color: 'text-gray-500',   icon: '🏁' },
};

function StatBar({
  label, value, icon
}: { label: string; value: number; color: string; icon: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const barColor =
    pct > 60 ? 'bg-emerald-500' :
    pct > 30 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex-1 min-w-[70px] sm:min-w-[90px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] sm:text-xs text-gray-500">{icon} {label}</span>
        <span className={`text-[10px] sm:text-xs font-mono font-bold ${
          pct > 60 ? 'text-emerald-600' : pct > 30 ? 'text-amber-600' : 'text-red-600'
        }`}>{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function VersusHeader({ country, market, turn, maxTurns, phase, crisisLevel, onBack }: Props) {
  const phaseInfo = PHASE_LABEL[phase] ?? PHASE_LABEL.intel;
  const dangerZone = crisisLevel >= 70;
  const turnPct = (turn / maxTurns) * 100;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6">

        {/* 第一行：返回 + 阶段 + 危机 + 回合（H5 压缩） */}
        <div className="flex items-center gap-2 py-2 border-b border-gray-100 overflow-x-auto">
          {/* 返回按钮 */}
          {onBack && (
            <button
              onClick={onBack}
              className="shrink-0 px-2 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs transition-all hover:bg-gray-200"
            >
              ←
            </button>
          )}

          {/* 阶段提示 */}
          <div className={`flex items-center gap-1 text-xs sm:text-sm font-bold ${phaseInfo.color}`}>
            <span>{phaseInfo.icon}</span>
            <span className="hidden xs:inline">{phaseInfo.text}</span>
          </div>

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* 危机等级（H5 简化） */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline text-xs text-gray-400">危机</span>
            <div className="w-16 sm:w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  crisisLevel >= 70 ? 'bg-red-500' :
                  crisisLevel >= 40 ? 'bg-yellow-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${crisisLevel}%` }}
              />
            </div>
            <span className={`text-xs font-mono font-bold ${
              crisisLevel >= 70 ? 'text-red-600' :
              crisisLevel >= 40 ? 'text-amber-600' : 'text-emerald-600'
            }`}>{crisisLevel}%</span>
          </div>

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* 回合 */}
          <div className="shrink-0 flex items-center gap-1.5">
            <span className="text-xs text-gray-400">第 {turn}/{maxTurns}</span>
            <div className="w-14 sm:w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  turnPct > 80 ? 'bg-red-500' : turnPct > 50 ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${turnPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 第二行：国家四指标 + 市场指标（H5 横向滚动） */}
        <div className="flex items-center gap-3 sm:gap-6 py-2 overflow-x-auto">
          {/* 四指标（H5 压缩为更窄的 min-width） */}
          <div className="flex items-center gap-2 sm:gap-4 flex-nowrap">
            <StatBar label="外汇储备" value={country.foreign_reserves} color="blue"    icon="💰" />
            <StatBar label="民众支持" value={country.public_support}   color="green"   icon="👥" />
            <StatBar label="国家信用" value={country.credit_rating}    color="purple"  icon="🏦" />
            {/* 通胀 - 单独放右侧不参与 flex */}
          </div>

          {/* 通胀（单独拎出来对齐） */}
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs text-gray-500">🔥 通胀</span>
              <span className={`text-[10px] sm:text-xs font-mono font-bold ${
                country.inflation > 60 ? 'text-red-600' :
                country.inflation > 35 ? 'text-amber-600' : 'text-gray-600'
              }`}>{Math.round(country.inflation)}%</span>
            </div>
            <div className="h-1.5 w-14 sm:w-24 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  country.inflation > 60 ? 'bg-red-500' :
                  country.inflation > 35 ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, country.inflation)}%` }}
              />
            </div>
          </div>

          <div className="w-px h-8 bg-gray-200 shrink-0" />

          {/* 市场指标（H5 横向滚动） */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div className="text-center shrink-0">
              <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5">汇率</div>
              <div className={`font-mono text-xs sm:text-sm font-bold ${
                market.exchange_rate < 0.7 ? 'text-red-600' :
                market.exchange_rate < 0.9 ? 'text-amber-600' : 'text-gray-700'
              }`}>{market.exchange_rate.toFixed(2)}</div>
            </div>
            <div className="text-center shrink-0">
              <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5">国债</div>
              <div className={`font-mono text-xs sm:text-sm font-bold ${
                market.bond_price < 0.5 ? 'text-red-600' :
                market.bond_price < 0.7 ? 'text-amber-600' : 'text-gray-700'
              }`}>{market.bond_price.toFixed(3)}</div>
            </div>
            <div className="text-center shrink-0">
              <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5">波动率</div>
              <div className={`font-mono text-xs sm:text-sm font-bold ${
                market.volatility > 0.7 ? 'text-red-600' :
                market.volatility > 0.4 ? 'text-amber-600' : 'text-gray-700'
              }`}>{(market.volatility * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
