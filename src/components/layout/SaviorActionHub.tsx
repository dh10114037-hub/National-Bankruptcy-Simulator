/**
 * SaviorActionHub - 拯救者模式 H5 入口面板
 *
 * 信息结构优化版：
 * - 顶部：核心国家数据（外储/民心/信用）
 * - 状态卡下方：风险提示 + AI建议
 * - 操作入口区前：简化的等待提示
 * - 操作入口区：决策/情报/数据/风险
 */

import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { EventPanel } from '../EventPanel';
import { DecisionPanel } from '../DecisionPanel';
import { DataPanel } from '../DataPanel';
import { AdvisorPanel } from '../AdvisorPanel';
import { RiskSourcePanel } from '../RiskSourcePanel';

interface ActionEntry {
  id: 'decision' | 'intel' | 'data' | 'risk';
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  height: '50%' | '80%' | '100%';
}

interface SaviorActionHubProps {
  gameState: any;
  currentEvent: any;
  currentPolicies: any[];
  log: any[];
  hasChosen: boolean;
  turnPhase: string;
  trendHistory: any[];
  lastSpeculatorAction: any;
  lastSpeculatorEffects: any;
  crisisLevel: number;
  lastDelta: any;
  marketFlash: any;
  recommendedPolicyId: string | null;
  onChoose: (policy: any) => void;
  onNextRound: () => void;
  onBack: () => void;
}

// ── 状态卡组件 ────────────────────────────────────────
interface StatusCardProps {
  label: string;
  value: number;
  max: number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'red';
  showWarning?: boolean;
}

function StatusCard({ label, value, max, icon, color, showWarning }: StatusCardProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorMap = {
    blue: { bar: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
    green: { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    purple: { bar: 'bg-purple-500', text: 'text-purple-600', bg: 'bg-purple-50' },
    red: { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
  };

  const colors = colorMap[color];
  const isLow = percentage < 30;

  return (
    <div className={`p-3 rounded-xl ${colors.bg} border border-gray-100`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-sm">{icon}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-lg font-bold ${colors.text}`}>
          {value.toLocaleString()}
        </span>
        <span className="text-xs text-gray-400">/ {max.toLocaleString()}</span>
        {showWarning && isLow && (
          <span className="text-xs text-red-500 font-medium">⚠️</span>
        )}
      </div>
      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colors.bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ── 风险提示组件 ──────────────────────────────────────
interface RiskAlertProps {
  risks: string[];
  /** 危险等级：0=安全，1=警告，2=危险 */
  severity?: number;
}

function RiskAlerts({ risks, severity = 0 }: RiskAlertProps) {
  if (risks.length === 0 && severity === 0) return null;

  // 根据危险等级选择样式
  const severityStyles = [
    'bg-amber-50 border-amber-100 text-amber-600', // 安全/低风险
    'bg-orange-50 border-orange-100 text-orange-600', // 警告
    'bg-red-50 border-red-100 text-red-600', // 危险
  ];
  const style = severityStyles[Math.min(severity, 2)];

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {/* 危险等级指示 */}
      {severity >= 2 && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 border border-red-200 text-xs text-red-700 font-bold animate-pulse">
          🚨 危急
        </span>
      )}
      {severity === 1 && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 border border-orange-200 text-xs text-orange-700 font-medium">
          ⚠️ 警告
        </span>
      )}
      {/* 风险标签 */}
      {risks.map((risk, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${style}`}
        >
          <span>{severity >= 2 ? '⚠️' : '📊'}</span>
          {risk}
        </span>
      ))}
    </div>
  );
}

// ── 政策连用警告组件 ──────────────────────────────────
interface PolicyWarningProps {
  recentPolicies: string[];
  currentPolicies: any[];
}

function PolicyWarnings({ recentPolicies, currentPolicies }: PolicyWarningProps) {
  const warnings: { id: string; message: string; severity: 'warning' | 'danger' }[] = [];

  // 检查当前可选政策是否有连用风险
  for (const policy of currentPolicies) {
    const count = recentPolicies.filter(p => p === policy.id).length;

    if (count >= 2) {
      let message = '';
      switch (policy.id) {
        case 'imf_bailout':
          message = `${policy.name} 已连用${count}次，再用民心将崩溃！`;
          warnings.push({ id: policy.id, message, severity: 'danger' });
          break;
        case 'print_money':
          message = `${policy.name} 已连用${count}次，信用将持续恶化！`;
          warnings.push({ id: policy.id, message, severity: 'danger' });
          break;
        case 'cut_welfare':
          message = `${policy.name} 已连用${count}次，民心将加速崩溃！`;
          warnings.push({ id: policy.id, message, severity: 'danger' });
          break;
        case 'capital_control':
          message = `${policy.name} 已连用${count}次，信用将持续受损！`;
          warnings.push({ id: policy.id, message, severity: 'warning' });
          break;
      }
    }
  }

  if (warnings.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {warnings.map((w, i) => (
        <div
          key={i}
          className={`p-2 rounded-lg text-xs font-medium ${
            w.severity === 'danger'
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-amber-50 border border-amber-200 text-amber-700'
          }`}
        >
          {w.severity === 'danger' ? '🚨' : '⚠️'} {w.message}
        </div>
      ))}
    </div>
  );
}

// ── AI建议组件 ────────────────────────────────────────
interface AISuggestionProps {
  suggestion: string;
  policyName?: string;
}

function AISuggestion({ suggestion, policyName }: AISuggestionProps) {
  return (
    <div className="mt-2 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
      <div className="flex items-start gap-2">
        <span className="text-lg">🤖</span>
        <div className="flex-1">
          <div className="text-xs text-emerald-600 font-medium mb-1">AI建议</div>
          <div className="text-sm text-gray-700">{suggestion}</div>
          {policyName && (
            <div className="mt-1 text-xs text-emerald-600">
              推荐：{policyName}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────
export function SaviorActionHub(props: SaviorActionHubProps) {
  const {
    gameState,
    currentEvent,
    currentPolicies,
    log,
    hasChosen,
    turnPhase,
    trendHistory,
    lastSpeculatorAction,
    lastSpeculatorEffects,
    crisisLevel,
    recommendedPolicyId,
    onChoose,
    onNextRound,
    onBack,
  } = props;

  const [activePanel, setActivePanel] = useState<ActionEntry['id'] | null>(null);

  // 提取核心数据
  const reserves = gameState?.foreign_reserves ?? 0;
  const maxReserves = 100;   // foreign_reserves 满值100
  const support = gameState?.public_support ?? 0;
  const maxSupport = 100;
  const credit = gameState?.credit_rating ?? 0;
  const maxCredit = 100;
  const inflation = gameState?.market?.inflation ?? 0;

  // 风险检测与危险等级
  const risks: string[] = [];
  let severity = 0; // 0=安全，1=警告，2=危险

  if (inflation > 25) risks.push('通胀上升');
  if (reserves < maxReserves * 0.3) {   // < 30
    risks.push('外储告急');
    severity = Math.max(severity, 1);
  }
  if (support < 30) {
    risks.push('民心不稳');
    severity = Math.max(severity, support < 20 ? 2 : 1);
  }
  if (credit < 40) {
    risks.push('信用危机');
    severity = Math.max(severity, 1);
  }
  if (crisisLevel >= 4) {
    risks.push('危机升级');
    severity = Math.max(severity, 2);
  }

  // 投机者攻击预警
  if (support < 40 && support >= 30) {
    risks.push('投机者将攻击');
    severity = Math.max(severity, 1);
  } else if (support < 30) {
    risks.push('投机者猛攻中');
    severity = Math.max(severity, 2);
  }

  // 获取最近使用的政策ID列表
  const recentPolicyIds = log.slice(0, 6).map((entry: any) => entry.policy?.id).filter(Boolean);

  // AI建议
  const recommendedPolicy = currentPolicies.find((p: any) => p.id === recommendedPolicyId);
  const aiSuggestion = getAISuggestion(crisisLevel, reserves, support, credit, inflation, recommendedPolicy);

  // 操作入口配置（按优先级排序）
  const entries: ActionEntry[] = [
    {
      id: 'decision',
      icon: '📋',
      label: '决策中心',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      height: '80%',
    },
    {
      id: 'intel',
      icon: '📡',
      label: '情报网络',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      height: '80%',
    },
    {
      id: 'data',
      icon: '📊',
      label: '数据面板',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      height: '80%',
    },
    {
      id: 'risk',
      icon: '⚠️',
      label: '风险详情',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      height: '80%',
    },
  ];

  const openPanel = (id: ActionEntry['id']) => setActivePanel(id);
  const closePanel = () => setActivePanel(null);
  const panelConfig = entries.find(e => e.id === activePanel);

  // 渲染面板内容
  const renderPanelContent = () => {
    switch (activePanel) {
      case 'decision':
        return (
          <DecisionPanel
            policies={currentPolicies}
            onChoose={onChoose}
            hasChosen={hasChosen}
            onNextRound={onNextRound}
            isWaiting={!currentEvent && !hasChosen}
            turnPhase={turnPhase}
            recommendedPolicyId={recommendedPolicyId}
          />
        );

      case 'intel':
        return (
          <div className="space-y-4 p-4">
            <div className="rounded-xl bg-white border border-gray-200 p-4">
              <h3 className="font-bold text-gray-800 mb-3">📡 当前情报</h3>
              <EventPanel currentEvent={currentEvent} log={log} isRevealing={false} />
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-4">
              <h3 className="font-bold text-gray-800 mb-3">🧠 顾问团队</h3>
              <AdvisorPanel
                gameState={gameState}
                phase={(turnPhase === 'ai_action' || turnPhase === 'next_prompt' ? 'feedback' : turnPhase) as any}
                lastSpeculatorAction={lastSpeculatorAction}
                currentPolicies={currentPolicies}
                recommendedPolicyId={recommendedPolicyId}
              />
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="p-4">
            <DataPanel
              gameState={gameState}
              trendHistory={trendHistory}
              lastSpeculatorAction={lastSpeculatorAction}
              lastSpeculatorEffects={lastSpeculatorEffects}
              marketFlash={props.marketFlash}
            />
          </div>
        );

      case 'risk':
        return (
          <div className="p-4">
            <RiskSourcePanel gameState={gameState} />
          </div>
        );

      default:
        return null;
    }
  };

  const isWaitingDecision = !hasChosen && currentEvent;
  const isWaitingNextRound = hasChosen && currentEvent;

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* ── 顶部状态栏 ───────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="font-bold text-gray-800">🏛️ 拯救者模式</div>
          </div>
          <div className="text-sm font-mono text-gray-500">
            第 {gameState.turn ?? 1} 回合
          </div>
        </div>
      </div>

      {/* ── 主内容区 ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── 一、核心状态卡 ─────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          <StatusCard
            label="外汇储备"
            value={reserves}
            max={maxReserves}
            icon="💰"
            color={reserves < maxReserves * 0.3 ? 'red' : 'blue'}
            showWarning
          />
          <StatusCard
            label="民众支持"
            value={support}
            max={maxSupport}
            icon="👥"
            color={support < 30 ? 'red' : 'green'}
            showWarning
          />
          <StatusCard
            label="国家信用"
            value={credit}
            max={maxCredit}
            icon="🏦"
            color={credit < 40 ? 'red' : 'purple'}
            showWarning
          />
        </div>

        {/* ── 二、风险提示 ───────────────────────────── */}
        <RiskAlerts risks={risks} severity={severity} />

        {/* ── 三、AI建议 ─────────────────────────────── */}
        <AISuggestion
          suggestion={aiSuggestion}
          policyName={recommendedPolicy?.name}
        />

        {/* ── 三.5、政策连用警告 ────────────────────── */}
        {isWaitingDecision && (
          <PolicyWarnings
            recentPolicies={recentPolicyIds}
            currentPolicies={currentPolicies}
          />
        )}

        {/* ── 四、状态提示（一行文字，不占空间）───────── */}
        {isWaitingDecision && (
          <div className="text-center text-sm text-gray-500 py-2">
            🎯 <span className="font-medium">等待决策</span> — 请选择应对方案
          </div>
        )}
        {isWaitingNextRound && (
          <div className="text-center text-sm text-emerald-600 py-2">
            ✅ 决策已提交 — 点击「结束回合」推进剧情
          </div>
        )}
        {!currentEvent && !hasChosen && (
          <div className="text-center text-sm text-gray-400 py-2">
            📖 等待下一回合...
          </div>
        )}

        {/* ── 五、操作入口区 ─────────────────────────── */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
            操作入口
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => openPanel(entry.id)}
                className={`p-3 rounded-xl border ${entry.bgColor} ${entry.borderColor} border-2 transition-all active:scale-95 flex flex-col items-center gap-1`}
              >
                <span className="text-xl">{entry.icon}</span>
                <span className={`text-xs font-medium ${entry.color}`}>
                  {entry.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 六、结束回合按钮 ────────────────────────── */}
        {hasChosen && (
          <button
            onClick={onNextRound}
            className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg active:scale-[0.98] transition-transform"
          >
            结束回合 →
          </button>
        )}

        {/* 底部留白 */}
        <div className="h-4" />
      </div>

      {/* ── 底部弹层 ──────────────────────────────────── */}
      <BottomSheet
        isOpen={activePanel !== null}
        onClose={closePanel}
        title={panelConfig?.label}
        height={panelConfig?.height ?? '80%'}
      >
        {renderPanelContent()}
      </BottomSheet>
    </div>
  );
}

// ── AI建议生成逻辑 ───────────────────────────────────
function getAISuggestion(
  crisisLevel: number,
  reserves: number,
  support: number,
  credit: number,
  inflation: number,
  recommendedPolicy?: any
): string {
  // 如果有推荐的策略，优先使用
  if (recommendedPolicy?.name) {
    return `建议采取「${recommendedPolicy.name}」措施稳定局势`;
  }

  // 根据数据生成建议
  if (crisisLevel >= 4) {
    return '危机升级中，需立即采取强力措施';
  }

  if (reserves < 30) {
    return '外汇储备告急，优先稳定外资';
  }

  if (support < 30) {
    return '民心不稳，建议提升民众福利';
  }

  if (credit < 40) {
    return '信用评级下降，需修复金融市场';
  }

  if (inflation > 25) {
    return '通胀压力上升，考虑收紧货币政策';
  }

  return '当前局势稳定，继续观察市场动向';
}
