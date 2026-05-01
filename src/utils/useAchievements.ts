/**
 * 成就系统 Hook — 检查解锁并持久化存储
 *
 * 使用方式：
 *   const { achievements, checkAndUnlock, showNewAchievement, dismissNewAchievement } = useAchievements();
 *
 * 在关键时机调用 checkAndUnlock(ctx) 检查成就
 * showNewAchievement 返回新解锁的成就（用于弹窗展示）
 */

import { useState, useEffect, useCallback } from 'react';
import { ACHIEVEMENTS, type Achievement, type AchievementContext, type UnlockedAchievement } from '../data/achievements';
import { detectStrategy, type StrategyType } from '../engine/speculatorEngine';

const STORAGE_KEY = 'nation_collapse_achievements';

function loadUnlocked(): UnlockedAchievement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UnlockedAchievement[]) : [];
  } catch {
    return [];
  }
}

function saveUnlocked(items: UnlockedAchievement[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // 存储失败，静默忽略
  }
}

export function useAchievements() {
  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>(() => loadUnlocked());
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  // 持久化
  useEffect(() => {
    saveUnlocked(unlocked);
  }, [unlocked]);

  // 获取已解锁的成就数量
  const unlockedCount = unlocked.length;
  const totalCount = ACHIEVEMENTS.length;

  // 检查成就并解锁
  const checkAndUnlock = useCallback((ctx: AchievementContext): Achievement[] => {
    const newlyUnlocked: Achievement[] = [];
    const now = new Date().toISOString();

    const unlockedIds = new Set(unlocked.map(u => u.id));

    for (const achievement of ACHIEVEMENTS) {
      // 已解锁则跳过
      if (unlockedIds.has(achievement.id)) continue;
      // 模式不匹配则跳过
      if (achievement.mode !== 'all' && achievement.mode !== ctx.mode) continue;
      // 不满足条件则跳过
      if (!achievement.check(ctx)) continue;

      // 满足条件，解锁
      newlyUnlocked.push(achievement);
      unlockedIds.add(achievement.id);
    }

    if (newlyUnlocked.length > 0) {
      const newRecords: UnlockedAchievement[] = newlyUnlocked.map(a => ({
        id: a.id,
        unlockedAt: now,
      }));
      setUnlocked(prev => [...prev, ...newRecords]);

      // 展示第一个新成就（避免一次弹太多）
      setNewAchievement(newlyUnlocked[0]);
    }

    return newlyUnlocked;
  }, [unlocked]);

  const dismissNewAchievement = useCallback(() => {
    setNewAchievement(null);
  }, []);

  // 获取某模式的成就列表（含解锁状态）
  const getAchievementsForMode = useCallback((mode: 'speculator' | 'savior' | 'versus') => {
    const unlockedIds = new Set(unlocked.map(u => u.id));
    return ACHIEVEMENTS
      .filter(a => a.mode === 'all' || a.mode === mode)
      .map(a => ({
        ...a,
        isUnlocked: unlockedIds.has(a.id),
        unlockedAt: unlocked.find(u => u.id === a.id)?.unlockedAt,
      }));
  }, [unlocked]);

  return {
    unlockedCount,
    totalCount,
    newAchievement,
    checkAndUnlock,
    dismissNewAchievement,
    getAchievementsForMode,
  };
}
