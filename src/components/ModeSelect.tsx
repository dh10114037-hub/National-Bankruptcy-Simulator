import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SaveLoadModal } from './ui/SaveLoadModal';
import { hasAnySave } from '../utils/saveLoad';

interface Props {
  onSelect: (mode: 'savior' | 'speculator' | 'versus') => void;
  /** 从存档加载时的回调 */
  onLoadSave?: (mode: 'savior' | 'speculator' | 'versus') => void;
  /** 保存当前游戏回调 */
  onSaveCurrent?: (slot: number) => void;
  /** 当前游戏模式（非select，表示有正在进行的游戏） */
  currentMode?: 'savior' | 'speculator' | 'versus' | null;
  currentTurn?: number;
}

// ─── 游戏说明弹层 ────────────────────────────────────────────
function HowToPlayModal({ onClose }: { onClose: () => void }) {
  // ESC键关闭支持（低优先级问题1.2.2）
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="bg-slate-900 text-white rounded-t-2xl px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-lg">📘</span>
            <h2 className="font-bold text-base">游戏说明 / How to Play</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭游戏说明"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 text-sm text-gray-700 leading-relaxed">

          {/* 🎮 游戏简介 */}
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <span>🎮</span> 游戏简介
            </h3>
            <p>在这个世界里，一个国家正走向崩溃。</p>
            <p className="mt-1">你可以选择成为：</p>
            <ul className="mt-1 space-y-0.5 list-none">
              <li>• <strong>拯救国家的决策者</strong></li>
              <li>• <strong>利用危机获利的投机者</strong></li>
              <li>• <strong>或与他人展开一场真实对抗</strong></li>
            </ul>
            <p className="mt-2">每一个决策，都会改变经济走向。每一次波动，都是机会或灾难。</p>
            <div className="mt-2 px-3 py-2 bg-slate-100 rounded-lg text-xs text-slate-600 italic">
              👉 这是一个关于"金融、政策与人性"的模拟游戏。
            </div>
          </section>

          {/* 分隔线 */}
          <div className="border-t border-gray-100" />

          {/* 🧩 三种模式 */}
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <span>🧩</span> 三种模式说明
            </h3>

            {/* 模式一：拯救者 */}
            <div className="mb-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🟢</span>
                <h4 className="font-bold text-emerald-800 text-sm">模式一：拯救者（宏观决策）</h4>
              </div>
              <p className="text-xs font-semibold text-emerald-700 mb-1.5">🎯 你的目标：避免国家破产</p>
              <p className="text-xs text-gray-600 mb-2">你将扮演政府决策者，面对：</p>
              <div className="grid grid-cols-2 gap-1 mb-2">
                {['财政赤字', '通货膨胀', '资本外逃', '民众不满'].map((item) => (
                  <div key={item} className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="text-emerald-400">•</span> {item}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">你需要在"经济稳定、国家信用、民众支持"之间做出平衡。</p>
              <div className="mt-2 px-2 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-[11px] text-amber-700">
                  ⚠️ 注意：每一个政策都有代价。短期稳定，可能带来长期风险。
                </p>
              </div>
            </div>

            {/* 模式二：投机者 */}
            <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🔴</span>
                <h4 className="font-bold text-red-800 text-sm">模式二：投机者（危机套利）</h4>
              </div>
              <p className="text-xs font-semibold text-red-700 mb-1.5">🎯 你的目标：从危机中获利</p>
              <p className="text-xs text-gray-600 mb-2">你将扮演资本操盘手：</p>
              <div className="space-y-0.5 mb-2">
                {['发现市场风险', '提前布局交易', '放大市场波动', '在混乱中收割利润'].map((item) => (
                  <div key={item} className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="text-red-400">•</span> {item}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mb-2">你可以：做空货币 · 押注债务违约 · 操控市场情绪</p>
              <div className="mt-2 px-2 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-[11px] text-amber-700">
                  💰 关键在于：发现危机 → 利用危机 → 甚至制造危机
                </p>
              </div>
              <p className="mt-2 text-[11px] text-red-600">
                ⚠️ 但风险始终存在，一步走错，可能爆仓。
              </p>
            </div>

            {/* 模式三：对抗模式 */}
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">⚔️</span>
                <h4 className="font-bold text-purple-800 text-sm">模式三：对抗模式（双人博弈）</h4>
              </div>
              <p className="text-xs font-semibold text-purple-700 mb-1.5">🎯 一场真正的博弈</p>
              <p className="text-xs text-gray-600 mb-2">
                一名玩家扮演"拯救者"，另一名玩家扮演"投机者"。
              </p>
              <div className="space-y-0.5 mb-2">
                {['拯救者试图稳定国家', '投机者试图放大危机', '你们的每一个决策都会互相影响'].map((item) => (
                  <div key={item} className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="text-purple-400">•</span> {item}
                  </div>
                ))}
              </div>
              <div className="mt-2 px-2 py-1.5 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-[11px] text-purple-700">
                  👉 一场信息不对称的较量，一场策略与心理的博弈。谁能掌控局势？
                </p>
              </div>
            </div>
          </section>

          {/* 分隔线 */}
          <div className="border-t border-gray-100" />

          {/* 🧠 教学引导 */}
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <span>🧠</span> 你将在游戏中理解
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                '为什么国家会加息 / 降息',
                '为什么会出现通货膨胀',
                '什么是资本外逃',
                '国家信用为何重要',
              ].map((item) => (
                <div key={item} className="text-xs text-gray-600 bg-slate-50 rounded-lg px-2.5 py-1.5">
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500 italic">
              👉 不需要金融背景，也可以逐步学会
            </p>
          </section>

          {/* 分隔线 */}
          <div className="border-t border-gray-100" />

          {/* 🎯 一句话总结 */}
          <div className="bg-slate-900 text-white rounded-xl px-4 py-3 text-center">
            <p className="text-sm font-medium leading-relaxed">
              一个关于"国家崩溃"的策略游戏<br />
              也是一堂"金融世界"的互动课
            </p>
          </div>

          {/* 🚀 新手建议 */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <h4 className="text-xs font-bold text-blue-700 mb-1.5 flex items-center gap-1">
              🚀 新手建议
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              如果你是第一次玩：
            </p>
            <p className="text-xs text-blue-700 font-semibold mt-0.5">
              👉 从【拯救者模式】开始，跟随AI顾问提示进行决策
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── 模式选择主视图 ──────────────────────────────────────────
export function ModeSelect({ onSelect, onLoadSave, onSaveCurrent, currentMode, currentTurn }: Props) {
  const [showHowTo, setShowHowTo] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [hasSaves, setHasSaves] = useState(false);

  useEffect(() => {
    setHasSaves(hasAnySave());
  }, []);

  const handleSave = (slot: number) => {
    if (onSaveCurrent && currentMode) {
      onSaveCurrent(slot);
      setHasSaves(hasAnySave());
    }
    setShowSaveLoad(false);
  };

  const handleLoad = (mode: 'savior' | 'speculator' | 'versus') => {
    setShowSaveLoad(false);
    onLoadSave?.(mode);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#F5F7FA' }}
    >
      {/* 顶部按钮 */}
      <div className="absolute top-6 right-6 z-10 flex gap-2">
        {/* 存档/读档按钮 */}
        <button
          onClick={() => setShowSaveLoad(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium shadow-sm transition-all"
        >
          <span>💾</span>
          <span>存档</span>
          {hasSaves && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          )}
        </button>
        {/* 游戏说明 */}
        <button
          onClick={() => setShowHowTo(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium shadow-sm transition-all"
        >
          <span>📘</span>
          <span>说明</span>
        </button>
      </div>

      {/* 主内容 */}
      <div className="relative z-10 text-center mb-10">
        {/* 中英游戏名 */}
        <div className="mb-2">
          <div className="text-[11px] text-gray-400 font-mono tracking-[0.35em] uppercase mb-3">
            Financial Strategy Simulator
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none mb-1">
            破产边缘
          </h1>
          <h2 className="text-xl font-bold text-gray-500 tracking-wide">
            Edge of Default
          </h2>
        </div>
        <p className="text-gray-400 text-sm mt-4 font-mono">
          选择你的立场 · Choose Your Side
        </p>
      </div>

      {/* 模式卡片 */}
      <div className="relative z-10 max-w-4xl w-full px-6 space-y-4">
        {/* 上排三个模式 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* 🟢 拯救者 */}
          <button
            onClick={() => onSelect('savior')}
            className="group relative p-5 rounded-2xl border border-emerald-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all text-left shadow-sm"
          >
            {/* 顶部标签 */}
            <div className="absolute top-3 right-3">
              <span className="text-[9px] font-mono text-emerald-500">推荐新手</span>
            </div>

            <div className="text-3xl mb-2">🏛</div>
            <h2 className="text-lg font-bold text-emerald-700 mb-0.5">拯救者</h2>
            <div className="text-[10px] text-emerald-400 font-mono mb-2">SAVIOR MODE</div>
            <p className="text-xs text-gray-500 leading-relaxed">
              扮演政府央行，稳住三大指标，对抗投机者AI。
            </p>
            <div className="mt-3 space-y-0.5 text-[10px] text-gray-400">
              <div>• 回合制政策决策</div>
              <div>• 投机者AI自动攻击</div>
              <div>• 因果链动画解析</div>
            </div>

            {/* 底部悬停高亮 */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* 🔴 投机者 */}
          <button
            onClick={() => onSelect('speculator')}
            className="group relative p-5 rounded-2xl border border-amber-200 bg-white hover:border-amber-400 hover:shadow-md transition-all text-left shadow-sm"
          >
            <div className="absolute top-3 right-3">
              <span className="text-[9px] font-mono text-amber-500">机会驱动</span>
            </div>

            <div className="text-3xl mb-2">🦅</div>
            <h2 className="text-lg font-bold text-amber-700 mb-0.5">投机者</h2>
            <div className="text-[10px] text-amber-500 font-mono mb-2">SPECULATOR MODE</div>
            <p className="text-xs text-gray-500 leading-relaxed">
              主动操控市场，放大危机并套利。
            </p>
            <div className="mt-3 space-y-0.5 text-[10px] text-gray-400">
              <div>• 情报网络</div>
              <div>• 杠杆交易</div>
              <div>• 市场操控</div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* ⚔️ 对抗 */}
          <button
            onClick={() => onSelect('versus')}
            className="group relative p-5 rounded-2xl border border-purple-200 bg-white hover:border-purple-400 hover:shadow-md transition-all text-left shadow-sm"
          >
            <div className="absolute top-3 right-3">
              <span className="text-[9px] font-mono text-purple-500 bg-purple-100 px-1.5 py-0.5 rounded">NEW</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏛</span>
              <span className="text-base font-black text-purple-600">VS</span>
              <span className="text-2xl">🦅</span>
            </div>
            <h2 className="text-lg font-bold text-purple-700 mb-0.5">双人对抗</h2>
            <div className="text-[10px] text-purple-500 font-mono mb-2">VERSUS MODE</div>
            <p className="text-xs text-gray-500 leading-relaxed">
              真实对抗，情报战+政策博弈。
            </p>
            <div className="mt-3 space-y-0.5 text-[10px] text-gray-400">
              <div>• 5阶段轮流决策</div>
              <div>• 行动队列系统</div>
              <div>• AI顾问引导</div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* 底部总结语 */}
        <div className="text-center pt-2">
          <p className="text-gray-400 text-xs font-mono">
            每一个选择都有代价 · 权衡与牺牲是唯一出路
          </p>
        </div>
      </div>

      {/* 存档弹层 */}
      <AnimatePresence>
        {showSaveLoad && (
          <SaveLoadModal
            currentMode={currentMode ?? undefined}
            canSave={currentMode !== undefined && currentMode !== null}
            currentTurn={currentTurn}
            onClose={() => setShowSaveLoad(false)}
            onLoad={handleLoad}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* 说明弹层 */}
      <AnimatePresence>
        {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}
      </AnimatePresence>
    </div>
  );
}
