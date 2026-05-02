/**
 * SpecActionHub - H5操作入口面板
 *
 * H5端替代原来的纵向堆叠布局
 * 将复杂模块（交易/操控/情报）改为入口按钮
 * 点击后通过BottomSheet展示详细内容
 *
 * 布局：
 * 1. 操作入口区（4个入口按钮）
 * 2. 当前机会摘要
 * 3. 结束回合按钮
 */

import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { IntelPanel } from '../speculator/IntelPanel';
import { TradingTerminal } from '../speculator/TradingTerminal';
import { ManipulationPanel } from '../speculator/ManipulationPanel';
import { OpportunityPanel } from '../speculator/OpportunityPanel';
import type { MarketState, Intel, ManipulationAction } from '../../types/speculator';

interface SpecActionHubProps {
  market: MarketState;
  intels: Intel[];
  manipulations: ManipulationAction[];
  assets: { cash: number; positions: any[] };
  govLog: any[];
  turn: number;
  maxTurns: number;
  cash: number;
  hasActiveStory: boolean;
  storyTriggeredCount: number;
  onBuyIntel: (id: string) => void;
  onBribeIntel: (id: string) => void;
  onTrade: (type: string, subtype: string) => void;
  onClose: (positionId: string) => void;
  onTriggerManipulation: (id: string) => void;
  onNextTurn: () => void;
}

type PanelType = 'intel' | 'trading' | 'manipulation' | 'opportunity' | null;

interface ActionButtonProps {
  icon: string;
  title: string;
  badge?: string;
  description: string;
  onClick: () => void;
  color: 'blue' | 'green' | 'red' | 'amber';
}

function ActionButton({ icon, title, badge, description, onClick, color }: ActionButtonProps) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700 active:bg-blue-100',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700 active:bg-emerald-100',
    red: 'bg-red-50 border-red-200 text-red-700 active:bg-red-100',
    amber: 'bg-amber-50 border-amber-200 text-amber-700 active:bg-amber-100',
  };

  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[140px] p-4 rounded-2xl border-2 ${colorMap[color]} text-left transition-all active:scale-[0.98]`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="font-bold text-sm">{title}</span>
        {badge && (
          <span className="ml-auto text-[10px] bg-white/80 px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div className="text-xs opacity-80">{description}</div>
    </button>
  );
}

export function SpecActionHub({
  market,
  intels,
  manipulations,
  assets,
  govLog,
  turn,
  maxTurns,
  cash,
  hasActiveStory,
  storyTriggeredCount,
  onBuyIntel,
  onBribeIntel,
  onTrade,
  onClose,
  onTriggerManipulation,
  onNextTurn,
}: SpecActionHubProps) {
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  const panelConfig: Record<Exclude<PanelType, null>, { title: string; height: '50%' | '80%' | '100%' }> = {
    intel: { title: '📡 情报网络', height: '80%' },
    trading: { title: '💹 交易终端', height: '80%' },
    manipulation: { title: '⚡ 放大危机', height: '80%' },
    opportunity: { title: '🎯 当前机会', height: '80%' },
  };

  return (
    <>
      {/* ── H5操作入口区域 ── */}
      <div className="space-y-4">
        {/* 操作入口按钮区 */}
        <div className="grid grid-cols-2 gap-3">
          <ActionButton
            icon="📡"
            title="情报"
            badge={intels.filter(i => i.purchased).length > 0 ? `${intels.filter(i => i.purchased).length}条` : undefined}
            description="获取内幕信息"
            onClick={() => setActivePanel('intel')}
            color="blue"
          />
          <ActionButton
            icon="💹"
            title="交易"
            badge={assets.positions.length > 0 ? `${assets.positions.length}仓` : undefined}
            description="做空/做多建仓"
            onClick={() => setActivePanel('trading')}
            color="green"
          />
          <ActionButton
            icon="⚡"
            title="操控"
            description="放大市场危机"
            onClick={() => setActivePanel('manipulation')}
            color="red"
          />
          <ActionButton
            icon="📊"
            title="机会"
            description="AI推荐操作"
            onClick={() => setActivePanel('opportunity')}
            color="amber"
          />
        </div>

        {/* 当前持仓快捷查看（如果有持仓，直接在主界面显示） */}
        {assets.positions.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">💼</span>
                <span className="font-bold text-sm text-gray-800">当前持仓</span>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                  {assets.positions.length} 笔
                </span>
              </div>
              <button
                onClick={() => setActivePanel('trading')}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium"
              >
                查看全部 →
              </button>
            </div>
            <div className="space-y-2">
              {assets.positions.slice(0, 3).map((pos) => (
                <div
                  key={pos.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    pos.pnl >= 0
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 truncate">{pos.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      ${pos.amount.toLocaleString()} · x{pos.leverage}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="text-right">
                      <div className={`font-mono font-bold text-sm ${pos.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {pos.pnl >= 0 ? '+' : ''}{pos.pnl_pct.toFixed(1)}%
                      </div>
                    </div>
                    <button
                      onClick={() => onClose(pos.id)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      平仓
                    </button>
                  </div>
                </div>
              ))}
              {assets.positions.length > 3 && (
                <div className="text-xs text-gray-400 text-center py-1">
                  还有 {assets.positions.length - 3} 笔持仓
                </div>
              )}
            </div>
          </div>
        )}

        {/* 当前机会摘要（卡片形式，更紧凑） */}
        <div className="rounded-2xl border-2 border-amber-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎯</span>
            <span className="font-bold text-sm text-gray-800">当前机会</span>
            <span className="ml-auto text-[10px] font-mono text-gray-400">回合 {turn}/{maxTurns}</span>
          </div>
          <OpportunityPanel
            market={market}
            turn={turn}
            cash={cash}
            maxTurns={maxTurns}
          />
        </div>

        {/* 结束回合按钮 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4" style={{ paddingBottom: `calc(1rem + env(safe-area-inset-bottom))` }}>
          <div className="text-xs text-gray-500 leading-relaxed text-center mb-3">
            ⏳ 确认操作后结束本月
          </div>
          <button
            onClick={onNextTurn}
            disabled={hasActiveStory}
            className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-all shadow-lg shadow-yellow-900/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            结束本月 →
          </button>
          <div className="text-xs text-gray-400 text-center mt-2">
            📖 已触发 {storyTriggeredCount} 个剧情事件
          </div>
        </div>
      </div>

      {/* ── BottomSheet 面板 ── */}

      {/* 情报面板 */}
      <BottomSheet
        isOpen={activePanel === 'intel'}
        onClose={() => setActivePanel(null)}
        title={panelConfig.intel.title}
        height={panelConfig.intel.height}
      >
        <div className="p-4">
          <IntelPanel
            intels={intels}
            cash={cash}
            turn={turn}
            onBuy={onBuyIntel}
            onBribe={onBribeIntel}
          />
        </div>
      </BottomSheet>

      {/* 交易面板 */}
      <BottomSheet
        isOpen={activePanel === 'trading'}
        onClose={() => setActivePanel(null)}
        title={panelConfig.trading.title}
        height={panelConfig.trading.height}
      >
        <div className="p-4">
          <TradingTerminal
            market={market}
            positions={assets.positions}
            cash={cash}
            govLog={govLog}
            turn={turn}
            onTrade={onTrade}
            onClose={onClose}
          />
        </div>
      </BottomSheet>

      {/* 操控面板 */}
      <BottomSheet
        isOpen={activePanel === 'manipulation'}
        onClose={() => setActivePanel(null)}
        title={panelConfig.manipulation.title}
        height={panelConfig.manipulation.height}
      >
        <div className="p-4">
          <ManipulationPanel
            manipulations={manipulations}
            cash={cash}
            turn={turn}
            market={market}
            onTrigger={onTriggerManipulation}
          />
        </div>
      </BottomSheet>

      {/* 机会面板 */}
      <BottomSheet
        isOpen={activePanel === 'opportunity'}
        onClose={() => setActivePanel(null)}
        title={panelConfig.opportunity.title}
        height={panelConfig.opportunity.height}
      >
        <div className="p-4">
          <OpportunityPanel
            market={market}
            turn={turn}
            cash={cash}
            maxTurns={maxTurns}
          />
        </div>
      </BottomSheet>
    </>
  );
}
