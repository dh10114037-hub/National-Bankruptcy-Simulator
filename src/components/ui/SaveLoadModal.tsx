/**
 * SaveLoadModal — 存档/读档界面
 *
 * 功能：
 * - 查看所有存档槽（3个）
 * - 保存当前进度到指定槽
 * - 读取已有存档继续游戏
 * - 删除存档
 *
 * 布局：
 * - 模态弹层，居中显示
 * - 顶部：标题 + 关闭按钮
 * - 3个存档槽卡片
 * - 每个槽：槽位标签 / 模式图标 / 回合 / 时间 / 关键指标
 * - 底部：空时显示"暂无存档"提示
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listSaves, deleteSave, type SaveSlotMeta, type GameMode } from '../../utils/saveLoad';

interface Props {
  /** 当前模式（用于保存） */
  currentMode?: GameMode;
  /** 是否有可保存的进度 */
  canSave?: boolean;
  /** 当前回合数（保存时需要） */
  currentTurn?: number;
  /** 关键指标（拯救者：危机等级；投机者：总资产） */
  keyMetric?: { label: string; value: string };
  /** 当前模式专属数据 */
  modeExtra?: Record<string, unknown>;
  /** 关闭回调 */
  onClose: () => void;
  /** 读取存档后的回调 */
  onLoad: (mode: GameMode) => void;
  /** 保存后的回调（传入存档槽索引） */
  onSave?: (slot: number) => void;
}

const MODE_CONFIG: Record<GameMode, { icon: string; label: string; color: string }> = {
  savior:     { icon: '🏛', label: '拯救者', color: 'text-blue-600' },
  speculator: { icon: '🦅', label: '投机者', color: 'text-amber-600' },
  versus:    { icon: '⚔️', label: '对抗',   color: 'text-purple-600' },
};

const SLOT_LABELS = ['存档槽 1', '存档槽 2', '存档槽 3'];

function SaveSlotCard({
  meta,
  slot,
  currentMode,
  canSave,
  onSave,
  onLoad,
  onDelete,
}: {
  meta: SaveSlotMeta | null;
  slot: number;
  currentMode?: GameMode;
  canSave?: boolean;
  onSave: () => void;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!meta) {
    // 空槽
    return (
      <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-3 min-h-[100px]">
        <div className="text-3xl text-gray-300">📂</div>
        <div className="text-sm text-gray-400 font-medium">{SLOT_LABELS[slot]} — 空</div>
          {canSave && currentMode && (
            <button
              onClick={() => handleSave(slot)}
              className="px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition-colors"
            >
              保存到此处
            </button>
          )}
      </div>
    );
  }

  const config = MODE_CONFIG[meta.mode];

  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* 槽标题 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className="text-sm font-bold text-gray-800">{SLOT_LABELS[slot]}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 ${config.color}`}>
            {config.label}
          </span>
        </div>
        <span className="text-xs text-gray-400">{meta.savedAtLabel}</span>
      </div>

      {/* 核心数据 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-gray-50">
          <div className="text-[10px] text-gray-400">回合</div>
          <div className="font-mono font-bold text-gray-800">{meta.turn} / 30</div>
        </div>
        {meta.crisisLevel !== undefined && (
          <div className="p-2 rounded-lg bg-gray-50">
            <div className="text-[10px] text-gray-400">危机等级</div>
            <div className={`font-mono font-bold ${
              meta.crisisLevel >= 70 ? 'text-red-600' :
              meta.crisisLevel >= 40 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {meta.crisisLevel}%
            </div>
          </div>
        )}
        {meta.totalValue !== undefined && (
          <div className="p-2 rounded-lg bg-gray-50">
            <div className="text-[10px] text-gray-400">总资产</div>
            <div className="font-mono font-bold text-amber-600">
              ${(meta.totalValue / 1000000).toFixed(2)}M
            </div>
          </div>
        )}
        {meta.foreign_reserves !== undefined && (
          <div className="p-2 rounded-lg bg-gray-50">
            <div className="text-[10px] text-gray-400">外储</div>
            <div className="font-mono font-bold text-blue-600">{meta.foreign_reserves}</div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={onLoad}
          className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
        >
          读取
        </button>
        {confirmDelete ? (
          <div className="flex-1 flex gap-1">
            <button
              onClick={onDelete}
              className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition-colors"
            >
              确认删除
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-bold transition-colors"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 text-xs transition-colors"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}

export function SaveLoadModal({
  currentMode,
  canSave,
  currentTurn = 0,
  keyMetric,
  modeExtra,
  onClose,
  onLoad,
  onSave,
}: Props) {
  const [slots, setSlots] = useState<Array<{ slot: number; meta: SaveSlotMeta | null }>>([]);

  const refreshSlots = () => setSlots(listSaves());

  useEffect(() => {
    refreshSlots();
  }, []);

  const handleSave = (slotIndex: number) => {
    if (!onSave) return;
    onSave(slotIndex);
    setTimeout(refreshSlots, 100);
  };

  const handleLoad = (meta: SaveSlotMeta) => {
    onLoad(meta.mode);
  };

  const handleDelete = (slotIndex: number) => {
    deleteSave(slotIndex);
    refreshSlots();
  };

  const hasAnySaves = slots.some(({ meta }) => meta !== null);

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
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <span className="text-lg">💾</span>
            <h2 className="font-bold text-base text-gray-900">存档 / 读档</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* 说明 */}
          <div className="text-xs text-gray-400 leading-relaxed">
            游戏进度保存在本地浏览器，最多支持 3 个存档槽。
            {canSave && currentMode && (
              <span className="text-blue-600 ml-1">
                当前可保存到空槽，或覆盖已有存档。
              </span>
            )}
          </div>

          {/* 存档槽列表 */}
          <div className="space-y-3">
            {slots.map(({ slot, meta }) => (
              <SaveSlotCard
                key={slot}
                meta={meta}
                slot={slot}
                currentMode={canSave ? currentMode : undefined}
                canSave={canSave}
                onSave={() => handleSave(slot, currentMode!)}
                onLoad={() => meta && handleLoad(meta)}
                onDelete={() => handleDelete(slot)}
              />
            ))}
          </div>

          {/* 无存档提示 */}
          {!hasAnySaves && (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">📂</div>
              <div className="text-sm text-gray-400">暂无存档</div>
              <div className="text-xs text-gray-300 mt-1">开始新游戏后，可以在此保存进度</div>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-6 pb-5 text-center">
          <div className="text-xs text-gray-400">
            💡 存档保存在本地，清除浏览器数据将导致存档丢失
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
