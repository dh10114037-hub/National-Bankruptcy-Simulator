# 破产边缘：深度技术档案（AI 优化背景）

*文档目的：让外部 AI 工具能像"云端架构师"或"高级测试员"一样，从数据流、逻辑层、物理法则、交互路径四个维度深度介入游戏优化。*

---

## 一、运行日志（Execution Logs）—— 观察"数值崩坏"的瞬间

### 模拟场景设定
- **初始资金**：¥1,000,000
- **胜利目标**：¥3,000,000（×3）
- **操作策略**：前5回合各开一单做空汇率（¥200,000/单），第6回合一键平仓，之后观望

### 10回合完整日志

```
================================================================================
【初始状态】
  资金: ¥1,000,000  |  目标: ¥3,000,000
  汇率: 0.9200  |  通胀: 45.0%  |  信用: 38.0  |  国债: 0.1800  |  股指: 3200
================================================================================

────────────────────────────────────────────────────────────────────────────────
【第 1→2 回合】 seed=12345
────────────────────────────────────────────────────────────────────────────────
  📌 玩家操作: 开仓: 做空汇率 ¥200,000 @ 0.9200

  📊 市场变化:
    汇率:   0.9200 → 0.8968  (-0.0232)
    通胀:   45.0% → 44.1%  (-0.9%)        ← 反常：通胀下跌！
    信用:   38.0 → 38.0  (±0.0)
    国债:   0.1800 → 0.1820  (+0.0020)
    股指:   3200 → 3237  (+37)

  💰 资产:
    持仓:   做空汇率: +¥5,040 (+2.52%)
    总资产: ¥1,000,000 → ¥1,205,039  (+20.50%)  ← ⚠️ 异常高回报！

────────────────────────────────────────────────────────────────────────────────
【第 2→3 回合】 seed=67890
────────────────────────────────────────────────────────────────────────────────
  📌 玩家操作: 开仓: 做空汇率 ¥200,000 @ 0.8968

  📊 市场变化:
    汇率:   0.8968 → 0.8947  (-0.0021)
    通胀:   44.1% → 43.7%  (-0.4%)        ← 持续反常下跌！
    信用:   38.0 → 38.4  (+0.5)          ← 信用竟然上升！

  💰 资产:
    持仓:   2单合计: +¥5,974
    总资产: ¥1,205,039 → ¥1,405,973  (+16.67%)  ← ⚠️ 持续高回报！

────────────────────────────────────────────────────────────────────────────────
【第 3→4 回合】 seed=11111
────────────────────────────────────────────────────────────────────────────────
  📌 玩家操作: 开仓: 做空汇率 ¥200,000 @ 0.8947

  📊 市场变化:
    汇率:   0.8947 → 0.8924  (-0.0023)
    通胀:   43.7% → 43.1%  (-0.6%)
    信用:   38.4 → 38.7  (+0.3)

  💰 资产:
    持仓:   3单合计: +¥7,509
    总资产: ¥1,405,973 → ¥1,607,509  (+14.33%)

────────────────────────────────────────────────────────────────────────────────
【第 4→5 回合】 seed=22222
────────────────────────────────────────────────────────────────────────────────
  📌 玩家操作: 开仓: 做空汇率 ¥200,000 @ 0.8924

  📊 市场变化:
    汇率:   0.8924 → 0.9023  (+0.0099)   ← 反转！汇率回升
    通胀:   43.1% → 44.9%  (+1.8%)       ← 通胀开始反弹
    信用:   38.7 → 38.1  (-0.6)

  💰 资产:
    持仓:   4单合计: +¥1,690（含2单亏损）
    总资产: ¥1,607,509 → ¥1,798,690  (+11.89%)

────────────────────────────────────────────────────────────────────────────────
【第 5→6 回合】 seed=33333
────────────────────────────────────────────────────────────────────────────────
  📌 玩家操作: 开仓: 做空汇率 ¥200,000 @ 0.9023（第5单）

  📊 市场变化:
    汇率:   0.9023 → 0.8845  (-0.0178)   ← 汇率再次暴跌
    通胀:   44.9% → 46.1%  (+1.2%)
    信用:   38.1 → 36.7  (-1.4)          ← ⚠️ 信用继续恶化

  💰 资产:
    持仓:   5单合计: +¥18,472
    总资产: ¥1,798,690 → ¥2,018,472  (+12.22%)

────────────────────────────────────────────────────────────────────────────────
【第 6→7 回合】 seed=44444
────────────────────────────────────────────────────────────────────────────────
  📌 玩家操作: 一键平仓 5个持仓，合计盈亏 +¥18,472

  📊 市场变化:
    汇率:   0.8845 → 0.8789  (-0.0056)
    通胀:   46.1% → 46.8%  (+0.7%)
    信用:   36.7 → 38.5  (+1.8)          ← 信用回升（无厘头回升）

  💰 资产:
    持仓:   0 个（全部平仓）
    总资产: ¥2,018,472 → ¥1,000,000  (-50.46%)  ← ⚠️ 平仓后总资产跌回现金！

────────────────────────────────────────────────────────────────────────────────
【第 7→11 回合】 观望期（无持仓）
────────────────────────────────────────────────────────────────────────────────
  第7回合: 汇率 +0.0067 | 通胀 +0.1% | 信用 +1.0  | 变动 +¥0
  第8回合: 汇率 -0.0211 | 通胀 -0.5% | 信用 +0.1  | 变动 +¥0
  第9回合: 汇率 -0.0089 | 通胀 +1.9% | 信用 -0.7  | 变动 +¥0
  第10回合: 汇率 +0.0034 | 通胀 +1.4% | 信用 -1.5 | 变动 +¥0

================================================================================
【10回合汇总】
================================================================================
  初始资金: ¥1,000,000
  最终总资产: ¥1,000,000（平仓后）
  累计实际盈亏: +¥0（总资产未变）
  汇率趋势: 0.92 → 0.8590（-6.6%）        ← 自然下跌
  通胀趋势: 45.0% → 49.6%（+4.6%）       ← 自然上升
  信用趋势: 38.0 → 37.3（-0.7）          ← 几乎不变！
  胜/败状态: playing
================================================================================
```

### 日志分析结论

| 问题 | 描述 | 严重程度 |
|------|------|----------|
| **通胀反常** | 前4回合通胀持续下跌（45→43.1%），但初始通胀已经45%属于危机水平，为什么还会跌？`Math.random() - 0.3` 偏向上升，但小随机数导致前几回合反而跌了 | 🔴 中 |
| **做空汇率回报异常高** | 1个做空汇率单，汇率跌0.0232，立即产生+2.52%回报 × 200,000 = ¥5,040。5单合计总资产从100万涨到200万。**平仓后总资产=现金（100万）**，说明持仓市值和现金是分开计算的，**平仓导致总资产大幅"蒸发"**（设计缺陷！） | 🔴 高 |
| **信用回升无逻辑** | 第6回合信用从36.7→38.5回升，但政府行动仍是"新闻发布会安抚"，没有任何政策干预，纯随机上涨 | 🟡 中 |
| **政府行动全部相同** | 10回合中政府行动全部是"政府召开新闻发布会安抚民众"，`pickGovAction` 的5个阈值条件（汇率<0.6/信用<25/通胀>70/股指<1500）在当前危机区间（汇率0.92/信用38/通胀45/股指3200）**全部不触发** | 🔴 高 |
| **平仓设计问题** | `total_value = cash + 持仓盈亏`，平仓时 `cash = cash + realized`，持仓清空 → `total_value = cash`。但 `cash = 1,000,000 + 18,472 = 1,018,472`，应该显示 >100万，但模拟器显示1,000,000。**问题在于 advanceSpecTurn 中 `cash` 用的是推进前的值，不含本次平仓收益** | 🔴 高 |

---

## 二、Prompt / 节点逻辑配置 —— 了解"大脑"的构造

### 2.1 政府 AI 行为定义（gameEngine.ts）

```typescript
// 核心文件: src/engine/gameEngine.ts 第251-395行

// 攻击疲劳机制（民心越低，攻击效果递减）
function getAttackFatigueMultiplier(public_support: number): number {
  if (public_support < 20) return 0.4;   // 伤害减60%
  if (public_support < 30) return 0.6;  // 伤害减40%;
  if (public_support < 40) return 0.8;  // 伤害减20%;
  return 1.0;
}

// 新手保护（前3回合攻击减半）
function getNoviceProtectionMultiplier(turn: number): number {
  if (turn <= 3) return 0.5;
  if (turn <= 5) return 0.75;
  return 1.0;
}

// 投机者AI主逻辑
export function runSpeculatorAI(state, context): SpeculatorAction {
  // 1. 连续攻击2回合后强制观望（反机械化设计）
  if (consecutiveAttacks >= 2) return { name: '⏸️ 获利了结', effects: {}, actionType: 'wait' };

  // 2. 30%概率做空失败（博弈反杀）
  if (Math.random() < 0.3) return { name: '📈 做空失败', effects: { credit_rating: +3, public_support: +2 }, actionType: 'wait' };

  // 3. 攻击优先级
  if (exchange_rate < 0.75 && volatility > 0.45) return { name: '📉 趁势做空货币', effects: { exchange_rate: -0.07 * multi, inflation: +5 * multi } };
  if (credit_rating < 35) return { name: '💀 攻击债市', effects: { credit_rating: -5 * multi } };
  if (public_support < 40) return { name: '📢 散布恐慌', effects: { public_support: -5 * multi } };
  if (foreign_reserves < 20 && credit_rating < 45) return { name: '💣 高杠杆做空', effects: { exchange_rate: -0.10 * multi } };
  if (inflation > 55) return { name: '📉 做空货币（通胀套利）', effects: { exchange_rate: -0.05 * multi } };
  if (foreign_reserves < 30 && credit_rating < 40 && public_support < 40) return { name: '☠️ 协同猎杀', effects: { ...四线联动攻击 } };
  if (volatility < 0.3) return { name: '⏳ 观望待机', effects: {} };
  return { name: '📊 小幅做空', effects: { exchange_rate: -0.02 * multi } };
}
```

**分析**：
- ✅ 优点：攻击疲劳、新手保护、反杀机制（30%失败率）都有效防止死亡螺旋
- ❌ 问题：**投机者AI在拯救者模式**有效，但**投机者模式**的政府AI `pickGovAction` 极其简陋，5个固定阈值几乎不触发

### 2.2 剧情事件触发逻辑（storyEngine.ts）

```typescript
// 核心文件: src/engine/storyEngine.ts 第437-483行

function checkCondition(event, state, market, countryMetrics): boolean {
  // 1. 回合数限制（minTurn / maxTurn）
  // 2. onceOnly：已触发过则不再触发
  // 3. 已有进行中事件则不触发新事件
  // 4. 市场指标检测（汇率越低越容易触发，其他指标越低越容易）
  if (key === 'exchange_rate') {
    if (marketVal >= value) return false; // 汇率 ≥ 阈值才触发（即：汇率 < 阈值时不触发...逻辑反了？）
  }
  // 5. 国家指标检测（指标 ≤ 阈值才触发）
  // 6. 概率检测
  if (Math.random() > cond.probability) return false;
}
```

**⚠️ 严重 Bug**：`key === 'exchange_rate'` 的判断逻辑**写反了**：
- 代码：`if (marketVal >= value) return false` → 汇率**高于**阈值时返回 false（不触发）
- 实际上：汇率越**低**（如0.85）越应该触发做空事件，但代码写成：汇率0.85 ≥ 0.85 → return false → **不触发**
- 这导致大部分剧情事件在汇率危机时无法触发！

### 2.3 投机者模式政府日志（speculatorEngine.ts 第522-528行）

```typescript
function pickGovAction(market: MarketState): string {
  if (market.exchange_rate < 0.6) return '政府启动外储干预，护盘汇率';
  if (market.credit_rating < 25)   return '政府向IMF紧急求援';
  if (market.inflation > 70)       return '央行宣布紧急加息';
  if (market.stock_index < 1500)  return '证监会暂停股市交易';
  return '政府召开新闻发布会安抚民众'; // ← 99%的情况走这里
}
```

**问题**：初始状态（汇率0.92/信用38/通胀45/股指3200）**全部5个阈值都不触发**，政府永远是"安抚民众"，完全不可信。

---

## 三、核心算法与 Hook 函数代码 —— "物理法则"

### 3.1 市场波动算法 `tickMarket()`

```typescript
// 投机者模式: src/engine/speculatorEngine.ts 第108-138行
export function tickMarket(market, _govAction?): { newMarket, flash } {
  // 自然衰减：每回合汇率微跌，通胀微升
  const er_delta  = (Math.random() - 0.6) * 0.04;   // 偏向0.6 → 平均-0.008/回合
  const inf_delta = (Math.random() - 0.3) * 3;        // 偏向0.3 → 实际每回合约+1.05（通胀上升）
  const cr_delta  = (Math.random() - 0.55) * 4;       // 偏向0.55 → 平均-0.4/回合
  const bp_delta  = (Math.random() - 0.5) * 0.015;    // 中性
  const si_delta  = (Math.random() - 0.6) * 120;      // 偏向0.6 → 平均-24/回合
}
```

**参数分析**：

| 参数 | 公式 | 期望偏移/回合 | 初始值 | 10回合后期望值 |
|------|------|-------------|--------|---------------|
| `exchange_rate` | `(rand-0.6)×0.04` | -0.008 | 0.92 | ~0.84 |
| `inflation` | `(rand-0.3)×3` | **+1.05（上升）** | 45 | ~56（上升！） |
| `credit_rating` | `(rand-0.55)×4` | -0.4 | 38 | ~34 |
| `bond_price` | `(rand-0.5)×0.015` | 0 | 0.18 | ~0.18 |
| `stock_index` | `(rand-0.6)×120` | -24 | 3200 | ~2960 |

### 3.2 胜负判定 `checkSpecGameOver()`

```typescript
// src/engine/speculatorEngine.ts 第489-509行
export function checkSpecGameOver(state): { phase, reason } {
  // 1. 现金+持仓全无 → 失败
  if (state.cash <= 0 && state.positions.length === 0) { return { phase: 'defeat', ... }; }
  // 2. 总资产 ≥ 初始×3 → 胜利
  if (state.total_value >= state.initial_cash * 3) { return { phase: 'victory', ... }; }
  // 3. 30回合结束 → 按比例判定
  if (state.turn >= state.maxTurns) {
    const ratio = state.total_value / state.initial_cash;
    if (ratio >= 1.5) return { phase: 'victory', ... };
    return { phase: 'defeat', ... };
  }
  return { phase: 'playing' };
}
```

**问题**：
- ❌ **遗漏关键条件**：没有检测市场指标（汇率<0.1 或 信用=0 时的市场崩溃失败）
- ❌ **胜利条件过于简单**：只检测资金量，不考虑市场是否已经崩溃

### 3.3 持仓盈亏计算 `calcPositionPnl()`

```typescript
// 逻辑正确性 ✅
const isShort = pos.type === 'short_currency' || pos.type === 'short_bank';
const price_change_pct = isShort
  ? (pos.buy_price - current_price) / pos.buy_price   // 做空：入场价-当前价（跌了才赚）
  : (current_price - pos.buy_price) / pos.buy_price;  // 做多：当前价-入场价（涨了才赚）
const pnl = pos.amount * price_change_pct * pos.leverage;
```

**分析**：做空汇率 `buy_price=0.92, current_price=0.8968`，`(0.92-0.8968)/0.92 = 2.52%`，`×200,000 = +¥5,040` ✅

### 3.4 数值联动耦合 `applyExchangeRateCoupling()`（拯救者模式）

```typescript
// 汇率下跌 → 概率触发（给玩家有机会扛住）
if (exchange_rate < 0.9 && Math.random() < 0.5) { credit_rating -= 2; ... }  // 轻度
if (exchange_rate < 0.8 && Math.random() < 0.5) { credit_rating -= 4; ... }  // 中度
if (exchange_rate < 0.6 && Math.random() < 0.6) { credit_rating -= 6; ... }  // 重度
// 通胀过高 → 概率触发
if (inflation > 55 && Math.random() < 0.5) { ... }
if (inflation > 75 && Math.random() < 0.4) { ... }
```

**分析**：概率触发设计合理，避免死亡螺旋。但**通胀>55 才触发**在初始通胀=45 的情况下，需要较长时间才会触发联动。

### 3.5 死亡缓冲机制（拯救者模式）

```typescript
export function applyDeathBuffer(state): { state, warnings } {
  if (foreign_reserves <= 0) { foreign_reserves = 5; warnings.push('...'); }
  if (public_support <= 0)    { public_support = 5;   warnings.push('...'); }
  if (credit_rating <= 0)    { credit_rating = 5;    warnings.push('...'); }
  return { state, warnings };
}
```

**问题**：托底为5 给玩家喘息机会，但托底后下一回合如果继续恶化，**又会触发下一次托底**（游戏无法真正结束）。应加入"托底次数限制"。

---

## 四、UI 交互路径与状态快照

### 4.1 Zustand 状态树结构

```
SpeculatorStore
├── state: SpeculatorGameState
│   ├── phase: 'playing' | 'victory' | 'defeat'
│   ├── turn: number (1~30)
│   ├── assets: SpeculatorAssets
│   │   ├── cash: number          // 可用现金
│   │   ├── positions: Position[]  // 当前持仓列表
│   │   │   ├── id / type / label
│   │   │   ├── buy_price / current_price / amount / leverage
│   │   │   └── pnl / pnl_pct
│   │   └── total_value: number   // = cash + Σ(positions.pnl + positions.amount)
│   ├── market: MarketState
│   │   ├── exchange_rate / inflation / credit_rating / bond_price / stock_index
│   ├── intels: Intel[]
│   │   └── { id / source / content / truth / confidence / purchased / bribed / revealed / expired }
│   ├── manipulations: ManipulationAction[]
│   │   └── { id / name / cost / effects / success_rate / cooldown / is_cooling / cooldown_left }
│   ├── notifications: SpecNotif[]
│   ├── gov_log: string[]            // 政府行动历史（最多5条）
│   ├── market_flash: Partial<Record<keyof MarketState, 'up' | 'down'>>
│   └── turn_summary: TurnSummary | null  // 回合结算卡片数据
│
├── story: StoryState
│   ├── triggeredEvents: string[]    // 已触发过的事件ID
│   ├── currentEvent: StoryEvent | null
│   └── currentBranch: string
│
└── hasActiveStory: boolean
```

### 4.2 PC 端点击路径

```
SpeculatorView
  ├─ SpecHeader（顶部状态栏：资金/总资产/5项指标）
  ├─ OpportunityPanel（当前机会建议）
  ├─ IntelPanel（情报列表：免费查看/¥50,000购买/¥80,000贿赂）
  ├─ TradingTerminal（持仓+开仓+平仓+政府日志）
  ├─ ManipulationPanel（操控行动+冷却状态）
  ├─ [结束本月] 按钮
  └─ SpecNotifications（Toast通知，5秒消失）

点击[结束本月] → advanceSpecTurn() → turn_summary写入 → TurnSummaryCard弹出（点击继续关闭）
```

### 4.3 H5 端点击路径

```
SpeculatorView
  ├─ MobileTopStatus（顶部状态栏）
  └─ SpecActionHub（4个入口按钮）
       ├─ [🎯 看机会] → OpportunityPanel + 市场建议
       ├─ [📡 情报]   → IntelPanel（BottomSheet）
       ├─ [💹 交易]   → TradingTerminal（BottomSheet）
       └─ [🔧 操控]   → ManipulationPanel（BottomSheet）

BottomSheet 底部 → [结束本月] → TurnSummaryCard
```

### 4.4 关键交互痛点

| 痛点 | 描述 | 层级 |
|------|------|------|
| **情报价格不透明** | IntelPanel 不显示价格（¥50,000购买 / ¥80,000贿赂），玩家不知道要花钱 | 🔴 高 |
| **持仓与总资产脱节** | `total_value` 包含持仓盈亏，但UI分开显示，容易混淆 | 🟡 中 |
| **BottomSheet操作断裂** | H5端需要点入口→等动画→操作→关闭→再点下一入口，路径长 | 🟡 中 |
| **剧情选项无成功率预览** | 选选项时只显示效果数值，不显示成功率 | 🟢 低 |

---

## 五、综合分析总结

### 5.1 核心矛盾一览

| 矛盾 | 描述 |
|------|------|
| **"可以做空获利" vs "国家已经危机"** | 初始状态就是危机（通胀45，信用38），但市场还在自然下跌，玩家持续做空轻松获利 → 游戏没有紧迫感 |
| **"操控行动有冷却" vs "政府AI完全不反应"** | 政府AI的5个阈值在危机区间全不触发（汇率0.92 > 0.6，信用38 > 25...），"护盘汇率/紧急加息/IMF求援"永远不出现 |
| **"持仓计算total_value" vs "平仓后资产蒸发"** | 持仓盈亏实时计入total_value（显示很好看），但平仓后持仓清零，total_value只剩现金（资产"蒸发"） |
| **"剧情事件写得很精彩" vs "触发逻辑有bug"** | 8个剧情事件描述生动，但 `exchange_rate` 的触发判断写反，导致最关键的货币狙击事件在汇率危机时无法触发 |
| **"Victory条件3倍" vs "市场永远在崩"** | 3倍目标合理，但如果玩家只观望，市场自然下跌20回合后通胀>60、信用<20，此时再入场做空才能赢 → 这才是真实策略，但游戏没引导 |

### 5.2 优化优先级建议

**P0（立即修复）**：
1. `storyEngine.ts` 汇率触发逻辑写反 — 至少4个剧情事件无法触发
2. `pickGovAction` 阈值全部不满足 — 10回合政府永远"安抚民众"
3. `total_value` 平仓蒸发 — 需要分离"总资产"和"已实现资产"

**P1（重要优化）**：
4. `inflation` 初期随机下跌 — 初始值45已经危机，不应该还跌，改为`(rand - 0.4) * 3`
5. 情报价格不显示 — IntelPanel 加"¥50,000 / ¥80,000"标签
6. 胜利条件增加市场崩溃检测 — 若30回合时市场已崩，强制判定失败

**P2（体验增强）**：
7. 操控冷却提示完善 — 成功后通知"进入X回合冷却"
8. 政府日志动态化 — 改为真正联动市场状态的文本生成
9. 存档/读档 — localStorage 持久化游戏状态

---

*文档版本：v1.1（2026-04-21）*
*生成工具：speculator-sim.cjs（可复现10回合模拟日志）*
