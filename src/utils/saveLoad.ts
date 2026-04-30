/**
 * 存档/读档工具 — localStorage 持久化
 *
 * 支持：
 * - 拯救者模式存档（gameStore）
 * - 投机者模式存档（speculatorStore）
 * - 多槽位存档（3个槽位）
 */

export type GameMode = 'savior' | 'speculator' | 'versus';

export interface SaveSlotMeta {
  mode: GameMode;
  turn: number;
  savedAt: string;       // ISO 时间字符串
  savedAtLabel: string;  // 友好显示："5分钟前" / "昨天"
  // 拯救者特有
  crisisLevel?: number;
  foreign_reserves?: number;
  // 投机者特有
  totalValue?: number;
  cash?: number;
}

export interface SaveData {
  version: number;        // 数据格式版本，便于未来迁移
  mode: GameMode;
  savedAt: string;        // ISO 时间戳
  turn: number;
  // 模式特有数据
  saviorData?: Record<string, unknown>;
  specData?: Record<string, unknown>;
  versusData?: Record<string, unknown>;
}

// ─── 常量 ────────────────────────────────────────────────────
const STORAGE_KEY_PREFIX = 'nation_collapse_save_';
const CURRENT_VERSION = 1;
const MAX_SLOTS = 3;

// ─── 辅助：生成时间标签 ──────────────────────────────────────
export function getTimeLabel(isoString: string): string {
  const saved = new Date(isoString).getTime();
  const now = Date.now();
  const diffMs = now - saved;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay === 1) return '昨天';
  if (diffDay < 7) return `${diffDay}天前`;
  return new Date(isoString).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// ─── 列出所有存档槽 ──────────────────────────────────────────
export function listSaves(): Array<{ slot: number; meta: SaveSlotMeta | null }> {
  return Array.from({ length: MAX_SLOTS }, (_, i) => {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${i}`);
    if (!raw) return { slot: i, meta: null };
    try {
      const data: SaveData = JSON.parse(raw);
      const meta: SaveSlotMeta = {
        mode: data.mode,
        turn: data.turn,
        savedAt: data.savedAt,
        savedAtLabel: getTimeLabel(data.savedAt),
        ...(data.saviorData as Partial<SaveSlotMeta>),
        ...(data.specData as Partial<SaveSlotMeta>),
      };
      return { slot: i, meta };
    } catch {
      return { slot: i, meta: null };
    }
  });
}

// ─── 获取存档数据 ────────────────────────────────────────────
export function loadSave(slot: number): SaveData | null {
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${slot}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

// ─── 保存游戏（通用入口）─────────────────────────────────────
export function saveGame(
  slot: number,
  mode: GameMode,
  turn: number,
  modeData: Record<string, unknown>
): boolean {
  if (slot < 0 || slot >= MAX_SLOTS) return false;
  const data: SaveData = {
    version: CURRENT_VERSION,
    mode,
    savedAt: new Date().toISOString(),
    turn,
    [`${mode}Data`]: modeData,
  };
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${slot}`, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// ─── 删除存档 ────────────────────────────────────────────────
export function deleteSave(slot: number): void {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${slot}`);
}

// ─── 是否存在任何存档 ────────────────────────────────────────
export function hasAnySave(): boolean {
  return listSaves().some(({ meta }) => meta !== null);
}
