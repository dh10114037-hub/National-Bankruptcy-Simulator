/**
 * AI 顾问系统
 * 基于《AI 顾问系统 Prompt.txt》设计
 *
 * 架构：
 * - 本地模拟模式（离线）：根据游戏状态动态生成顾问建议，无需 API
 * - 接口兼容模式：预留 callAdvisorAPI() 接口，可替换为真实大模型调用
 *
 * 核心特性：
 * 1. 用通俗语言解释金融机制（生活化描述）
 * 2. 轮流覆盖 5 个知识点（通胀/信用/汇率/债务/挤兑）
 * 3. 根据游戏状态动态生成建议
 * 4. 错误决策后的强化学习提示
 * 5. 投机者顾问风格：冷血资本顾问
 */

import type { AdvisorTip, KnowledgeTopic } from '../types/versus';
import type { VersusCountry, VersusMarket } from '../types/versus';

// ────────────────────────────────────────────────────────────────
// 金融知识库（通俗化表达）
// ────────────────────────────────────────────────────────────────
const KNOWLEDGE_BASE: Record<KnowledgeTopic, { title: string; explain: string }> = {
  inflation: {
    title: '通货膨胀',
    explain: '市场上的钱变多了，但东西没变多，所以东西越来越贵——你的钱变"薄"了。',
  },
  credit: {
    title: '国家信用',
    explain: '信用就是别人愿不愿意借钱给你。信用下降，意味着没人相信你能还债，利率暴涨。',
  },
  exchange_rate: {
    title: '汇率',
    explain: '汇率是你的钱在国际上"值多少"。汇率跌，进口变贵，外资出逃，通胀随之而来。',
  },
  debt: {
    title: '债务危机',
    explain: '借的钱越来越多，大家开始怀疑你还不起——这时候借钱成本会猛涨，形成恶性循环。',
  },
  bank_run: {
    title: '银行挤兑',
    explain: '大家同时去银行取钱，银行根本没那么多现金——一旦挤兑开始，极难平息，可能引发金融崩溃。',
  },
};

// 知识点轮播顺序
const TOPIC_ROTATION: KnowledgeTopic[] = [
  'inflation', 'credit', 'exchange_rate', 'debt', 'bank_run'
];

// ────────────────────────────────────────────────────────────────
// Prompt 模板（保留，可直接传给大模型 API）
// ────────────────────────────────────────────────────────────────
export const SAVIOR_ADVISOR_PROMPT = `
你是一个"经济顾问"，正在帮助玩家理解一场国家金融危机。

你的目标：
1. 用通俗语言解释当前情况（不要使用专业术语）
2. 给出建议（但不要100%正确）
3. 告诉玩家每个选择的潜在风险
4. 每次必须讲清楚一个金融知识点

要求：
- 用生活化语言（例如"钱变不值钱了"代替"通货膨胀"）
- 控制在100字以内
- 语气像一个冷静但现实的顾问

当前游戏状态：
{{game_state}}

最近事件：
{{recent_events}}

可选行动：
{{available_actions}}

请按以下 JSON 格式回复：
{
  "summary": "当前局势一句话总结",
  "advice": "我的建议",
  "risk_warning": "风险警告",
  "explanation": "本回合金融知识点"
}
`.trim();

export const SPECULATOR_ADVISOR_PROMPT = `
你是一个冷血资本顾问，只关心赚钱。

目标：
- 帮助玩家利用市场恐慌套利
- 鼓励高风险高收益操作
- 判断当前最佳攻击时机

当前市场状态：
{{game_state}}

请按以下 JSON 格式回复：
{
  "summary": "市场机会判断",
  "advice": "推荐操作",
  "risk_warning": "爆仓风险提示",
  "explanation": "金融知识点（从投机者视角）"
}
`.trim();

// ────────────────────────────────────────────────────────────────
// 本地模拟：根据游戏状态动态生成顾问提示
// ────────────────────────────────────────────────────────────────

interface LocalAdvisorInput {
  role:           'savior' | 'speculator';
  country?:       VersusCountry;
  market?:        VersusMarket;
  specCash?:      number;
  specTotalValue?: number;
  recentEvents?:  string[];
  policyOptions?: string[];
  turnIndex:      number;   // 用于知识点轮播
  lastPolicyId?:  string;   // 用于错误决策强化
  lastDelta?:     Partial<VersusCountry>;
}

export function generateLocalAdvisorTip(input: LocalAdvisorInput): AdvisorTip {
  const topic = TOPIC_ROTATION[input.turnIndex % TOPIC_ROTATION.length];
  const knowledge = KNOWLEDGE_BASE[topic];

  if (input.role === 'savior') {
    return generateSaviorTip(input, topic, knowledge);
  } else {
    return generateSpeculatorTip(input, topic, knowledge);
  }
}

// ── 拯救者顾问 ─────────────────────────────────────────────────
function generateSaviorTip(
  input: LocalAdvisorInput,
  topic: KnowledgeTopic,
  knowledge: { title: string; explain: string }
): AdvisorTip {
  const c = input.country;
  if (!c) return fallbackTip('savior', topic, knowledge);

  // 局势判断
  const crisis = crisisScore(c);
  let summary = '';
  let advice  = '';
  let risk    = '';

  if (crisis > 70) {
    summary = '形势极度危急——外储快耗尽了，随时可能崩盘。';
    advice  = '现在必须优先补外储，哪怕牺牲民心。IMF援助虽然屈辱，但能续命。';
    risk    = '再拖一回合，外储归零就直接输了。';
  } else if (c.public_support < 35) {
    summary = '民心已到危险线——再跌几格可能爆发社会动荡。';
    advice  = '不要再削减福利或加税了，此时需要稳住民心，适当让步。';
    risk    = '民心归零等于宣告失败，优先级高于外储。';
  } else if (c.credit_rating < 30) {
    summary = '国家信用极低，没人愿意借钱给你了。';
    advice  = '避免增发货币，越印钱信用越差。考虑保守策略，慢慢修复。';
    risk    = '信用太低会导致国债崩盘，还会引发投机者攻击。';
  } else if (c.inflation > 60) {
    summary = '通胀已经失控——钱变不值钱，老百姓怒了。';
    advice  = '停止印钞！紧缩货币是唯一出路，虽然短期外储会降。';
    risk    = '通胀继续升高会同时打击民心和信用。';
  } else {
    summary = '当前局势尚可，但投机者还在暗中操作，不可大意。';
    advice  = '保持三项指标均衡，避免任何一项低于 40。';
    risk    = '如果连续两回合指标都好，胜利条件就快达成了。';
  }

  // 错误决策强化
  const correctionNote = buildCorrectionNote(input.lastPolicyId, input.lastDelta, c);
  if (correctionNote) {
    risk = correctionNote;
  }

  return {
    role:            'savior',
    summary,
    advice,
    risk_warning:    risk,
    explanation:     `📘 今日知识：【${knowledge.title}】${knowledge.explain}`,
    knowledge_topic: topic,
  };
}

// ── 投机者顾问（冷血资本风格）────────────────────────────────
function generateSpeculatorTip(
  input: LocalAdvisorInput,
  topic: KnowledgeTopic,
  knowledge: { title: string; explain: string }
): AdvisorTip {
  const c   = input.country;
  const m   = input.market;
  const pnl = (input.specTotalValue ?? 1_000_000) - 1_000_000;

  let summary = '';
  let advice  = '';
  let risk    = '';

  if (c && c.foreign_reserves < 30) {
    summary = '外储快耗尽了——这是做空货币的黄金窗口。';
    advice  = '现在重仓做空，加上3x杠杆，等政府外储耗尽就是你的收割日。';
    risk    = '如果政府突然获得IMF援助，做空头寸可能爆仓。';
  } else if (c && c.credit_rating < 35) {
    summary = '信用崩了——债券价格要跌，做空国债时机到了。';
    advice  = '买入做空国债仓位，信用越低，国债跌得越惨，你赚得越多。';
    risk    = '政府也许会用激进政策强行拉信用，注意止损。';
  } else if (m && m.exchange_rate < 0.8) {
    summary = '汇率已经很低了——做空获利空间有限，考虑获利了结。';
    advice  = '平掉做空仓位吃利润，等下一轮危机再进场。';
    risk    = '过度贪婪可能遇到政府汇率管制，一夜归零。';
  } else if (pnl < 0) {
    summary = '你目前处于亏损状态——需要一次大反击。';
    advice  = '散布谣言配合做空，双管齐下，制造恐慌是你的优势。';
    risk    = '高杠杆+谣言组合有爆仓风险，量力而行。';
  } else {
    summary = '局势稳定，但危机还没爆发——等待时机。';
    advice  = '先购买情报，了解政府下回合打算，再决定攻击方向。';
    risk    = '切忌无脑攻击，资金是有限的。';
  }

  return {
    role:            'speculator',
    summary,
    advice,
    risk_warning:    risk,
    explanation:     `💀 冷知识：【${knowledge.title}（投机者视角）】${knowledge.explain}`,
    knowledge_topic: topic,
  };
}

// ────────────────────────────────────────────────────────────────
// 错误决策强化学习
// ────────────────────────────────────────────────────────────────
function buildCorrectionNote(
  lastPolicyId: string | undefined,
  lastDelta: Partial<VersusCountry> | undefined,
  _current: VersusCountry
): string | null {
  if (!lastPolicyId || !lastDelta) return null;

  // 检测决策是否导致指标恶化
  const gotWorse =
    (lastDelta.foreign_reserves ?? 0) < -10 ||
    (lastDelta.public_support   ?? 0) < -10 ||
    (lastDelta.credit_rating    ?? 0) < -10;

  if (!gotWorse) return null;

  const REASONS: Record<string, string> = {
    print_money:  '增发货币导致信用下跌，市场认为你在乱印钞——债主开始跑路。',
    cut_welfare:  '削减福利虽补了外储，但民心代价太大，下次要避免连续使用。',
    tax_increase: '加税在危机时期会压制消费，民心下降超过预期。',
    imf_bailout:  'IMF援助是把双刃剑——外储回来了，但民心和主权都在付代价。',
  };

  const reason = REASONS[lastPolicyId] ?? '上回合决策导致某项指标明显恶化。';
  return `⚠ 上回合复盘：${reason}`;
}

// ────────────────────────────────────────────────────────────────
// 复盘总结（游戏结束时调用）
// ────────────────────────────────────────────────────────────────
export function generatePostMortem(
  winner: 'savior' | 'speculator',
  finalCountry: VersusCountry,
  specFinal: number,
  turns: number
): string {
  if (winner === 'savior') {
    return `✅ 执政总结：
你坚持了 ${turns} 个月，最终稳住了国家。
• 外汇储备：${finalCountry.foreign_reserves.toFixed(0)}
• 民众支持：${finalCountry.public_support.toFixed(0)}
• 国家信用：${finalCountry.credit_rating.toFixed(0)}

关键：在投机者不断施压下，你始终保住了底线。`;
  } else {
    const ratio = (specFinal / 1_000_000).toFixed(2);
    return `💀 失败复盘：
国家在第 ${turns} 月崩溃，投机者最终收益 ${ratio}x。

失败原因可能是：
• 连续使用增发货币 → 通胀失控
• 忽视信用指标 → 无法融资
• 民心过低 → 社会秩序崩溃

📘 记住：危机中没有免费的午餐，每个政策都有代价。`;
  }
}

// ────────────────────────────────────────────────────────────────
// 阿里百炼 (DashScope) API 配置
// ────────────────────────────────────────────────────────────────
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const DEFAULT_MODEL = 'qwen-plus'; // 使用通义千问 Plus 模型

// API Key（可在环境变量中覆盖）
export const ADVISOR_API_KEY = import.meta.env.VITE_ADVISOR_API_KEY || 'sk-82cd03d1eaff4791bbe7201b9c7f4086';

// 是否启用真实 API（false 则回退到本地模拟）
export const USE_REAL_ADVISOR_API = import.meta.env.VITE_USE_REAL_ADVISOR === 'true';

// ────────────────────────────────────────────────────────────────
// 真实 API 接口（阿里百炼）
// ────────────────────────────────────────────────────────────────
export async function callAdvisorAPI(
  prompt: string,
  gameStateJson: string,
  apiKey?: string
): Promise<AdvisorTip | null> {
  // 如果未启用真实 API，回退到本地模拟
  if (!USE_REAL_ADVISOR_API) {
    console.log('[AdvisorAPI] 模拟模式运行，启用真实API请设置 VITE_USE_REAL_ADVISOR=true');
    return null;
  }

  const key = apiKey || ADVISOR_API_KEY;
  
  // 替换 prompt 中的占位符
  const fullPrompt = prompt
    .replace('{{game_state}}', gameStateJson)
    .replace('{{recent_events}}', '')
    .replace('{{available_actions}}', '');

  try {
    console.log('[AdvisorAPI] 正在调用阿里百炼 API...');
    
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { 
            role: 'system', 
            content: '你是一个经济游戏中的AI顾问。始终以JSON格式回复，包含summary、advice、risk_warning、explanation四个字段。语言：中文。' 
          },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AdvisorAPI] API 请求失败:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('[AdvisorAPI] API 返回内容为空');
      return null;
    }

    // 解析 JSON 响应
    // 尝试提取 JSON（可能有 markdown 代码块）
    let jsonStr = content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || jsonStr.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);
    
    return {
      role:            'savior', // 默认，可根据 prompt 内容调整
      summary:         parsed.summary || '正在分析局势...',
      advice:          parsed.advice || '请稍候...',
      risk_warning:    parsed.risk_warning || '暂无风险提示',
      explanation:     parsed.explanation || '暂无知识点',
      knowledge_topic: 'inflation', // 默认
    };
  } catch (error) {
    console.error('[AdvisorAPI] 调用失败:', error);
    return null; // 回退到本地模拟
  }
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
function crisisScore(c: VersusCountry): number {
  return Math.max(
    100 - c.foreign_reserves,
    100 - c.public_support,
    100 - c.credit_rating,
    c.inflation
  );
}

function fallbackTip(
  role: 'savior' | 'speculator',
  topic: KnowledgeTopic,
  knowledge: { title: string; explain: string }
): AdvisorTip {
  return {
    role,
    summary:      '正在分析局势...',
    advice:       '保持冷静，观察市场变化。',
    risk_warning: '请关注所有指标的变化趋势。',
    explanation:  `📘 今日知识：【${knowledge.title}】${knowledge.explain}`,
    knowledge_topic: topic,
  };
}
