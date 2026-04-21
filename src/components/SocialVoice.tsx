import { useState, useEffect, useCallback } from 'react';

const VOICES_CRISIS = [
  '👨‍👩‍👧 "我们存的钱取不出来了！"',
  '👴 "物价太高，我活不下去了…"',
  '👩 "医院说我们的社保没了？！"',
  '👦 "爸爸失业了，我们要搬家吗？"',
  '🧑‍💼 "公司账户被冻结，我们垮了…"',
  '👩‍⚕️ "医院断药，我们怎么办？"',
  '🧓 "养老金发不出来了吗？"',
  '👨 "街上的人越来越多，感觉要出大事…"',
];

const VOICES_TENSE = [
  '👩‍🏫 "学费又涨了，孩子读不起书了"',
  '🧑 "加息了，我的房贷还不上了"',
  '👨‍🔧 "工厂停工，我们这个月没收入"',
  '👩‍💼 "政府说会好转，但我不相信了"',
];

const VOICES_NORMAL = [
  '🏪 "今天生意还好，但心里不安"',
  '👩 "新闻说经济在改善，但感觉不到"',
  '🧑‍🤝‍🧑 "朋友说要把积蓄换成外币…"',
];

interface SocialVoiceProps {
  crisisLevel: number;
}

export function SocialVoiceToast({ crisisLevel }: SocialVoiceProps) {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');
  const [exiting, setExiting] = useState(false);

  const pickVoice = useCallback(() => {
    if (crisisLevel >= 60) return VOICES_CRISIS[Math.floor(Math.random() * VOICES_CRISIS.length)];
    if (crisisLevel >= 30) return VOICES_TENSE[Math.floor(Math.random() * VOICES_TENSE.length)];
    return VOICES_NORMAL[Math.floor(Math.random() * VOICES_NORMAL.length)];
  }, [crisisLevel]);

  useEffect(() => {
    if (crisisLevel < 10) return;

    // Show interval: more frequent when crisis is high
    const interval = crisisLevel >= 60 ? 4000 : crisisLevel >= 30 ? 7000 : 12000;

    const timer = setInterval(() => {
      setText(pickVoice());
      setVisible(true);
      setExiting(false);

      // Hide after 3.5s
      setTimeout(() => {
        setExiting(true);
        setTimeout(() => setVisible(false), 400);
      }, 3500);
    }, interval);

    return () => clearInterval(timer);
  }, [crisisLevel, pickVoice]);

  if (!visible) return null;

  return (
    <div className={`
      fixed bottom-6 left-1/2 -translate-x-1/2 z-50
      max-w-sm w-[90vw]
      rounded-xl border border-gray-200 bg-white
      shadow-lg px-4 py-3
      text-sm text-gray-700
      ${exiting ? 'voice-out' : 'voice-in'}
    `}>
      <div className="flex items-start gap-2">
        <span className="text-gray-400 text-xs mt-0.5 flex-shrink-0">民声</span>
        <span className="leading-relaxed">{text}</span>
      </div>
    </div>
  );
}
