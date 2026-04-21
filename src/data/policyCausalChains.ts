/**
 * 政策因果链数据
 * 每个政策 → 一组有序节点，展示"政策 → 中间过程 → 最终影响"的全链路
 *
 * type:
 *   'positive' → 绿色（有益效果）
 *   'negative' → 红色（有害效果）
 *   'warning'  → 黄色（风险警示）
 *   'neutral'  → 灰色（中性说明）
 */

export type ChainNodeType = 'positive' | 'negative' | 'warning' | 'neutral';

export interface ChainNode {
  label: string;       // 节点主文本
  sub?: string;        // 补充说明（小字）
  type: ChainNodeType;
  icon?: string;
}

export interface PolicyCausalChain {
  policyId: string;
  policyName: string;
  policyIcon: string;
  nodes: ChainNode[];
}

export const POLICY_CAUSAL_CHAINS: Record<string, PolicyCausalChain> = {

  // ─── 提高税收 ───────────────────────────────────────────────
  tax_increase: {
    policyId: 'tax_increase',
    policyName: '提高税收',
    policyIcon: '💹',
    nodes: [
      { label: '政府宣布加税法令', type: 'neutral', icon: '📋', sub: '企业税 & 个人所得税全面上调' },
      { label: '财政收入短期增加', type: 'positive', icon: '💰', sub: '外汇储备 +10' },
      { label: '企业利润压缩', type: 'warning', icon: '⚠️', sub: '部分外资开始观望' },
      { label: '民众可支配收入下降', type: 'negative', icon: '😤', sub: '民心 −8，街头不满情绪上升' },
    ],
  },

  // ─── 增发货币 ───────────────────────────────────────────────
  print_money: {
    policyId: 'print_money',
    policyName: '增发货币',
    policyIcon: '🖨️',
    nodes: [
      { label: '央行开动印钞机', type: 'neutral', icon: '🏦', sub: '大规模量化宽松政策' },
      { label: '流动性注入市场', type: 'positive', icon: '💵', sub: '外汇储备账面 +15' },
      { label: '通货膨胀预期飙升', type: 'warning', icon: '🔥', sub: '国际评级机构开始下调展望' },
      { label: '国家信用评级下降', type: 'negative', icon: '📉', sub: '信用 −10，投机者嗅到机会' },
    ],
  },

  // ─── 削减福利 ───────────────────────────────────────────────
  cut_welfare: {
    policyId: 'cut_welfare',
    policyName: '削减福利',
    policyIcon: '✂️',
    nodes: [
      { label: '宣布削减社会福利支出', type: 'neutral', icon: '📢', sub: '医疗、教育补贴全面削减' },
      { label: '政府账面开支减少', type: 'positive', icon: '💰', sub: '外汇储备 +12' },
      { label: '底层民众生活恶化', type: 'warning', icon: '😡', sub: '媒体抗议声浪迅速升温' },
      { label: '民心大幅下跌', type: 'negative', icon: '💔', sub: '民心 −12，社会不稳定风险剧增' },
    ],
  },

  // ─── 申请IMF援助 ────────────────────────────────────────────
  imf_bailout: {
    policyId: 'imf_bailout',
    policyName: '申请IMF援助',
    policyIcon: '🏛️',
    nodes: [
      { label: '向IMF提交紧急救助申请', type: 'neutral', icon: '📨', sub: '接受条件性贷款条款' },
      { label: '国际资金注入', type: 'positive', icon: '💰', sub: '外汇储备 +25，解燃眉之急' },
      { label: '国际信用获得背书', type: 'positive', icon: '✅', sub: '信用评级微升 +5' },
      { label: '主权政策受限', type: 'warning', icon: '🔒', sub: 'IMF附加条件限制财政自主权' },
      { label: '舆论批评"卖国求援"', type: 'negative', icon: '📰', sub: '民心 −10，政治压力上升' },
    ],
  },

  // ─── 紧急加息 ───────────────────────────────────────────────
  raise_interest: {
    policyId: 'raise_interest',
    policyName: '紧急加息',
    policyIcon: '📊',
    nodes: [
      { label: '央行宣布大幅加息', type: 'neutral', icon: '🏦', sub: '基准利率一次性上调' },
      { label: '外资受高利率吸引回流', type: 'positive', icon: '💱', sub: '外汇储备 +8' },
      { label: '国际评级机构正面回应', type: 'positive', icon: '⭐', sub: '信用评级 +8' },
      { label: '国内融资成本上升', type: 'warning', icon: '🏠', sub: '房贷压力上升，内需有所萎缩' },
      { label: '民众消费能力下降', type: 'negative', icon: '😞', sub: '民心 −6' },
    ],
  },

  // ─── 资本管制 ───────────────────────────────────────────────
  capital_control: {
    policyId: 'capital_control',
    policyName: '资本管制',
    policyIcon: '🚧',
    nodes: [
      { label: '宣布资本流动管制令', type: 'neutral', icon: '📋', sub: '限制外汇自由兑换与转移' },
      { label: '阻止外汇储备继续外流', type: 'positive', icon: '🛡️', sub: '外汇储备 +5（减少流失）' },
      { label: '外资对投资环境产生疑虑', type: 'warning', icon: '⚠️', sub: '外商直接投资意愿下降' },
      { label: '信用评级被国际机构调降', type: 'negative', icon: '📉', sub: '信用 −15，黑市汇率开始出现' },
      { label: '民众信心动摇', type: 'negative', icon: '😰', sub: '民心 −8，恐慌性囤积外汇' },
    ],
  },

  // ─── 紧急国债 ───────────────────────────────────────────────
  emergency_bond: {
    policyId: 'emergency_bond',
    policyName: '发行紧急国债',
    policyIcon: '📜',
    nodes: [
      { label: '财政部紧急发行高息国债', type: 'neutral', icon: '📋', sub: '面向国内外投资者公开发行' },
      { label: '短期融资到位', type: 'positive', icon: '💰', sub: '外汇储备 +20' },
      { label: '国债利率高企吸引部分买家', type: 'positive', icon: '📈', sub: '信用评级小幅改善 +3' },
      { label: '政府债务总量增加', type: 'warning', icon: '⚠️', sub: '未来每回合偿债压力上升' },
      { label: '民众担忧政府违约', type: 'negative', icon: '😟', sub: '民心 −5' },
    ],
  },

  // ─── 经济改革 ───────────────────────────────────────────────
  economic_reform: {
    policyId: 'economic_reform',
    policyName: '推行经济改革',
    policyIcon: '🔧',
    nodes: [
      { label: '政府宣布系统性经济改革', type: 'neutral', icon: '📢', sub: '放开管制 + 引入市场竞争' },
      { label: '国际市场正面解读', type: 'positive', icon: '🌐', sub: '信用评级 +12，外资开始观望' },
      { label: '短期阵痛期开始', type: 'warning', icon: '🔄', sub: '改革伴随就业结构调整' },
      { label: '保守派与改革派冲突', type: 'warning', icon: '⚔️', sub: '政策推进阻力较大' },
      { label: '民众短期利益受影响', type: 'negative', icon: '😤', sub: '民心 −10，需要时间见效' },
    ],
  },

  // ─── 领导人讲话 ─────────────────────────────────────────────
  public_speech: {
    policyId: 'public_speech',
    policyName: '领导人公开讲话',
    policyIcon: '🎤',
    nodes: [
      { label: '领导人发表电视讲话', type: 'neutral', icon: '📺', sub: '向全国承诺经济稳定' },
      { label: '短期舆论情绪稳定', type: 'positive', icon: '😊', sub: '民心 +10，恐慌情绪暂时平息' },
      { label: '外资短暂观望', type: 'positive', icon: '👀', sub: '信用短期维稳 +5' },
      { label: '治标不治本', type: 'warning', icon: '⏰', sub: '效果仅持续1-2回合' },
      { label: '若未兑现承诺信任崩塌', type: 'negative', icon: '❌', sub: '下次讲话效果减半' },
    ],
  },

  // ─── 出售国有资产 ───────────────────────────────────────────
  sell_assets: {
    policyId: 'sell_assets',
    policyName: '出售国有资产',
    policyIcon: '🏗️',
    nodes: [
      { label: '宣布国有资产私有化出售', type: 'neutral', icon: '📋', sub: '港口、矿山、国有企业股权' },
      { label: '获得大量外汇收入', type: 'positive', icon: '💰', sub: '外汇储备 +30' },
      { label: '国际投资者反应积极', type: 'positive', icon: '📈', sub: '信用评级 +5' },
      { label: '丧失战略性国有资产', type: 'warning', icon: '⚠️', sub: '未来国家控制力永久下降' },
      { label: '民众愤怒"贱卖国产"', type: 'negative', icon: '😡', sub: '民心 −15，抗议声浪高涨' },
    ],
  },
};
