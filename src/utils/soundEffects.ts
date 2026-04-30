/**
 * 音效与震动反馈 — Web Audio API + Vibration API
 *
 * 无需外部音频文件，使用合成音效：
 * - 开仓成功：短促上升音
 * - 平仓盈利：清脆金币声
 * - 平仓亏损：低沉下降音
 * - 操控成功：冲击音效
 * - 操控失败：失败提示音
 * - 事件触发：警报/提示音
 * - 回合结束：结算音效
 *
 * 使用方式：
 *   import { playSound } from './soundEffects';
 *   playSound('open_position');
 *   playSound('close_profit');
 *   playSound('manipulation_success');
 *
 * 震动：
 *   import { vibrate } from './soundEffects';
 *   vibrate('success');  // 短震
 *   vibrate('warning'); // 长震
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

// ─── 合成音效函数 ────────────────────────────────────────────

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', gain = 0.3, startDelay = 0) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + startDelay);

    gainNode.gain.setValueAtTime(gain, ctx.currentTime + startDelay);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);

    osc.start(ctx.currentTime + startDelay);
    osc.stop(ctx.currentTime + startDelay + duration + 0.05);
  } catch {
    // AudioContext 可能不可用，静默忽略
  }
}

function playChord(frequencies: number[], duration: number, type: OscillatorType = 'sine', gain = 0.2) {
  frequencies.forEach((f, i) => playTone(f, duration, type, gain, i * 0.03));
}

// ─── 音效类型定义 ────────────────────────────────────────────

export type SoundType =
  | 'open_position'      // 开仓
  | 'close_profit'       // 平仓盈利
  | 'close_loss'         // 平仓亏损
  | 'manipulation_success' // 操控成功
  | 'manipulation_fail'  // 操控失败
  | 'event_trigger'      // 事件触发
  | 'turn_end'           // 回合结束
  | 'intel_purchased'    // 购买情报
  | 'warning'            // 警告/危机
  | 'victory'            // 胜利
  | 'defeat'             // 失败
  | 'coin'               // 金币声（通用奖励）;

// ─── 音效映射 ────────────────────────────────────────────────

const SOUND_MAP: Record<SoundType, () => void> = {
  open_position: () => {
    // 短促上升音
    playTone(400, 0.1, 'sine', 0.25);
    playTone(600, 0.15, 'sine', 0.2, 0.05);
  },

  close_profit: () => {
    // 明亮金币声
    playChord([523, 659, 784], 0.3, 'triangle', 0.15);
    setTimeout(() => playTone(1047, 0.2, 'sine', 0.12), 100);
  },

  close_loss: () => {
    // 低沉下降音
    playTone(300, 0.3, 'sawtooth', 0.15);
    playTone(200, 0.4, 'sawtooth', 0.1, 0.1);
  },

  manipulation_success: () => {
    // 冲击音效
    playTone(150, 0.15, 'square', 0.2);
    playTone(200, 0.2, 'square', 0.15, 0.05);
    playTone(100, 0.25, 'square', 0.1, 0.1);
  },

  manipulation_fail: () => {
    // 失败提示音
    playTone(200, 0.2, 'square', 0.15);
    playTone(150, 0.25, 'square', 0.1, 0.15);
  },

  event_trigger: () => {
    // 警报提示音
    playTone(880, 0.15, 'square', 0.2);
    playTone(660, 0.15, 'square', 0.18, 0.2);
  },

  turn_end: () => {
    // 结算音效
    playChord([440, 554, 659], 0.4, 'sine', 0.1);
  },

  intel_purchased: () => {
    // 情报购买音
    playTone(800, 0.08, 'sine', 0.2);
    playTone(1000, 0.12, 'sine', 0.15, 0.08);
  },

  warning: () => {
    // 警告音
    playTone(600, 0.3, 'square', 0.25);
    playTone(400, 0.3, 'square', 0.2, 0.25);
  },

  victory: () => {
    // 胜利音
    playChord([523, 659, 784, 1047], 0.5, 'triangle', 0.12);
    setTimeout(() => playChord([659, 784, 1047], 0.4, 'triangle', 0.1), 200);
  },

  defeat: () => {
    // 失败音
    playTone(400, 0.5, 'sawtooth', 0.15);
    playTone(300, 0.6, 'sawtooth', 0.1, 0.3);
  },

  coin: () => {
    // 金币声
    playTone(1200, 0.05, 'sine', 0.2);
    playTone(1600, 0.08, 'sine', 0.15, 0.05);
  },
};

// ─── 公开 API ────────────────────────────────────────────────

/**
 * 播放音效
 * @param type 音效类型
 * @param volume 音量 0-1，默认1
 */
export function playSound(type: SoundType, volume = 1) {
  // 用户交互后才能播放音频（浏览器策略）
  if (getAudioContext().state === 'suspended') {
    getAudioContext().resume();
  }
  SOUND_MAP[type]?.();
}

/**
 * 震动反馈
 * @param type 'success' | 'warning' | 'error' | 'light'
 */
export function vibrate(type: 'success' | 'warning' | 'error' | 'light' = 'light') {
  if (!navigator.vibrate) return;
  switch (type) {
    case 'success':
      navigator.vibrate([50, 30, 50]);
      break;
    case 'warning':
      navigator.vibrate([100, 50, 100, 50, 100]);
      break;
    case 'error':
      navigator.vibrate([200]);
      break;
    case 'light':
    default:
      navigator.vibrate(30);
  }
}