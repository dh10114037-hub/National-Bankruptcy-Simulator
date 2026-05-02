import { useState, useMemo } from 'react';
import type { MarketState, PositionType, TradeOrder, Position } from '../../types/speculator';
import { TRADABLE_ASSET_POOL, type TradableAsset } from '../../data/expandablePool';

interface Props {
  market: MarketState;
  positions: Position[];
  cash: number;
  govLog: string[];
  turn: number;  // 当前回合
  onTrade: (order: TradeOrder) => void;
  onClose: (posId: string) => void;
}

// ─── 根据市场状态判断资产推荐度 ──────────────────────────────
type AssetRating = 'hot' | 'neutral' | 'avoid';

function rateAsset(assetId: string, market: MarketState): AssetRating {
  const { exchange_rate, inflation, credit_rating, bond_price, stock_index } = market;

  const currencyLow = exchange_rate < 0.85;
  const inflationHigh = inflation > 25;
  const creditLow = credit_rating < 55;
  const bondLow = bond_price < 0.65;
  const stockLow = stock_index < 1800;

  // 强烈推荐（与当前最危险危机高度匹配）
  const hotWhenCurrencyLow = ['short_currency', 'long_forex_usd', 'forex_eur', 'forex_gold_standard', 'gold'];
  const hotWhenInflation    = ['gold', 'oil', 'wheat', 'copper', 'vix_options'];
  const hotWhenCreditLow    = ['credit_default_swap', 'short_bank_system', 'corp_bond_hightield'];
  const hotWhenBondLow      = ['credit_default_swap', 'short_bank_system', 'vix_options'];
  const hotWhenStockLow     = ['short_stock', 'vix_options', 'short_bank_system', 'gold'];

  // 不建议（危机下相反操作）
  const avoidWhenCurrencyLow = ['gov_bond_1y', 'gov_bond_5y', 'gov_bond_10y', 'stock_index', 'tech_sector'];
  const avoidWhenCreditLow   = ['gov_bond_5y', 'gov_bond_10y', 'stock_index', 'bank_sector'];
  const avoidWhenStockLow    = ['stock_index', 'tech_sector', 'bank_sector', 'energy_sector'];

  if (
    (currencyLow && hotWhenCurrencyLow.includes(assetId)) ||
    (inflationHigh && hotWhenInflation.includes(assetId)) ||
    (creditLow && hotWhenCreditLow.includes(assetId)) ||
    (bondLow && hotWhenBondLow.includes(assetId)) ||
    (stockLow && hotWhenStockLow.includes(assetId))
  ) return 'hot';

  if (
    (currencyLow && avoidWhenCurrencyLow.includes(assetId)) ||
    (creditLow && avoidWhenCreditLow.includes(assetId)) ||
    (stockLow && avoidWhenStockLow.includes(assetId))
  ) return 'avoid';

  return 'neutral';
}

// 映射资产到 PositionType 和价格key
const ASSET_MAPPING: Record<string, { type: PositionType; price_key: keyof MarketState }> = {
  gov_bond_1y: { type: 'bond', price_key: 'bond_price' },
  gov_bond_5y: { type: 'bond', price_key: 'bond_price' },
  gov_bond_10y: { type: 'bond', price_key: 'bond_price' },
  corp_bond_hightield: { type: 'bond', price_key: 'bond_price' },
  short_currency: { type: 'short_currency', price_key: 'exchange_rate' },
  long_forex_usd: { type: 'short_currency', price_key: 'exchange_rate' },
  forex_eur: { type: 'short_currency', price_key: 'exchange_rate' },
  forex_gold_standard: { type: 'gold', price_key: 'stock_index' },
  stock_index: { type: 'bond', price_key: 'stock_index' },
  short_stock: { type: 'short_currency', price_key: 'stock_index' },
  bank_sector: { type: 'short_bank', price_key: 'stock_index' },
  tech_sector: { type: 'bond', price_key: 'stock_index' },
  energy_sector: { type: 'bond', price_key: 'stock_index' },
  gold: { type: 'gold', price_key: 'stock_index' },
  oil: { type: 'bond', price_key: 'stock_index' },
  wheat: { type: 'bond', price_key: 'stock_index' },
  copper: { type: 'bond', price_key: 'stock_index' },
  vix_options: { type: 'gold', price_key: 'stock_index' },
  credit_default_swap: { type: 'short_bank', price_key: 'bond_price' },
  futures_contango: { type: 'bond', price_key: 'stock_index' },
  crypto_repatriation: { type: 'short_currency', price_key: 'exchange_rate' },
  short_bank_system: { type: 'short_bank', price_key: 'stock_index' },
};

// 风险等级颜色
const RISK_COLORS = {
  1: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600' },
  2: { bg: 'bg-green-50 border-green-200', text: 'text-green-600' },
  3: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-600' },
  4: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-600' },
  5: { bg: 'bg-red-50 border-red-200', text: 'text-red-500' },
};

function TradeModal({
  asset,
  currentPrice,
  cash,
  onConfirm,
  onCancel,
}: {
  asset: TradableAsset;
  currentPrice: number;
  cash: number;
  onConfirm: (order: TradeOrder) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(asset.min_invest);
  const [leverage, setLeverage] = useState(asset.leverage_available[0] || 1);
  const [showConfirm, setShowConfirm] = useState(false);

  const mapping = ASSET_MAPPING[asset.id] || { type: 'bond', price_key: 'bond_price' };
  const isShort = asset.id.includes('short') || asset.trend === 'bear';
  const maxAmount = Math.floor(cash / 10000) * 10000;
  const expectedProfit = 15 + asset.volatility * 50 * leverage;
  const riskPct = leverage * 25;

  const handleFirstConfirm = () => {
    setShowConfirm(true);
  };

  const handleFinalConfirm = () => {
    onConfirm({
      position_type: mapping.type,
      label: asset.name,
      trade_type: isShort ? 'short' : 'long',
      amount,
      leverage,
      current_price: currentPrice,
      expected_profit_pct: expectedProfit,
      risk_note: asset.description,
    });
  };

  // 交易方向标识（色盲友好）
  const tradeDirection = isShort
    ? { label: '做空', icon: '▼', color: 'text-red-600 bg-red-50 border-red-200' }
    : { label: '做多', icon: '▲', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-[420px] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* 二次确认弹窗 */}
        {showConfirm ? (
          <>
            <div className="px-4 py-3 border-b border-gray-200 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-base">确认交易</div>
              </div>
              <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0 w-8 h-8 flex items-center justify-center">×</button>
            </div>
            <div className="px-4 py-6 space-y-4">
              <div className="text-center">
                <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-bold ${tradeDirection.color}`}>
                  <span>{tradeDirection.icon}</span>
                  <span>{tradeDirection.label}</span>
                </div>
                <div className="mt-2 font-bold text-gray-900">{asset.name}</div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">投入金额</span>
                  <span className="font-mono font-bold text-gray-900">${amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">杠杆倍数</span>
                  <span className="font-mono font-bold text-amber-600">x{leverage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">交易方向</span>
                  <span className={`font-mono font-bold ${tradeDirection.color.split(' ')[0]}`}>
                    {tradeDirection.icon} {tradeDirection.label}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-400 text-center">
                确认后将扣除 ${amount.toLocaleString()} 现金，请确认交易信息无误
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleFinalConfirm}
                  className="flex-1 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm transition-all shadow-lg shadow-amber-500/30"
                >
                  确认开仓
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 标题 */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border text-xs font-bold ${tradeDirection.color}`}>
                    {tradeDirection.icon} {tradeDirection.label}
                  </div>
                </div>
                <div className="font-bold text-gray-900 text-base mt-1">{asset.name}</div>
                {/* 大白话解释 */}
                <div className="mt-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-xs text-amber-700 flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">👉</span>
                    <span className="leading-relaxed">{asset.explain}</span>
                  </div>
                </div>
              </div>
              <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0 w-8 h-8 flex items-center justify-center">×</button>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* 当前价格 */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">当前价格</span>
                <span className="font-mono text-gray-900">${currentPrice.toFixed(2)}</span>
              </div>

              {/* 投入金额 */}
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">投入金额</label>
                <div className="relative">
                  <input
                    type="range"
                    min={asset.min_invest}
                    max={Math.max(maxAmount, asset.min_invest)}
                    step={10000}
                    value={Math.min(amount, Math.max(maxAmount, asset.min_invest))}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full accent-amber-500 h-8"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>${asset.min_invest.toLocaleString()}</span>
                  <span className="font-mono text-amber-600 font-bold text-sm">${amount.toLocaleString()}</span>
                  <span>${maxAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* 杠杆 */}
              <div>
                <label className="text-xs text-gray-500 block mb-2">杠杆倍数</label>
                <div className="grid grid-cols-4 gap-2">
                  {asset.leverage_available.slice(0, 4).map((lv) => (
                    <button
                      key={lv}
                      onClick={() => setLeverage(lv)}
                      className={`py-3 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                        leverage === lv
                          ? 'border-amber-400 bg-amber-100 text-amber-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      x{lv}
                    </button>
                  ))}
                </div>
              </div>

              {/* 预期收益 vs 风险 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs text-emerald-600">若押对</div>
                  <div className="text-lg font-bold text-emerald-700 font-mono flex items-center gap-1">
                    <span>▲</span>
                    <span>+{expectedProfit.toFixed(0)}%</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">波动率 {asset.volatility}</div>
                </div>
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <div className="text-xs text-red-500">最大亏损</div>
                  <div className="text-lg font-bold text-red-600 font-mono flex items-center gap-1">
                    <span>▼</span>
                    <span>-{Math.min(riskPct, 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">风险 {asset.risk_level}/5</div>
                </div>
              </div>

              {/* 确认按钮 */}
              <button
                disabled={amount > cash}
                onClick={handleFirstConfirm}
                className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg"
              >
                确认开仓 −${amount.toLocaleString()}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function TradingTerminal({ market, positions, cash, govLog, turn, onTrade, onClose }: Props) {
  const [tradeTarget, setTradeTarget] = useState<TradableAsset | null>(null);

  // 每回合随机生成6个可用资产
  const availableAssets = useMemo(() => {
    // 基于回合数随机打乱，确保每回合不同
    const seed = turn * 1000 + Math.floor(turn / 3);
    const shuffled = [...TRADABLE_ASSET_POOL].sort((a, b) => {
      const aScore = (a.id.charCodeAt(0) + a.id.charCodeAt(1)) * (seed % 100);
      const bScore = (b.id.charCodeAt(0) + b.id.charCodeAt(1)) * (seed % 100);
      return aScore - bScore;
    });
    return shuffled.slice(0, 6);
  }, [turn]);

  const getPrice = (asset: TradableAsset): number => {
    const mapping = ASSET_MAPPING[asset.id] || { type: 'bond', price_key: 'bond_price' };
    const val = market[mapping.price_key];
    return typeof val === 'number' ? val * asset.base_price : 0;
  };

  const hasPosition = (assetId: string): boolean => {
    const mapping = ASSET_MAPPING[assetId];
    if (!mapping) return false;
    return positions.some((p) => p.type === mapping.type);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* 交易弹窗 */}
      {tradeTarget && (
        <TradeModal
          asset={tradeTarget}
          currentPrice={getPrice(tradeTarget)}
          cash={cash}
          onConfirm={(order) => { onTrade(order); setTradeTarget(null); }}
          onCancel={() => setTradeTarget(null)}
        />
      )}

      {/* 市场价格列表 */}
      <div>
        <div className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-2">📉 市场行情</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: '国债', value: market.bond_price.toFixed(3), sub: '面值=1.000' },
            { label: '汇率', value: market.exchange_rate.toFixed(3), sub: '↓趋势' },
            { label: '股指', value: market.stock_index.toFixed(0), sub: '基准3500' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="p-2 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-500">{label}</div>
              <div className="font-mono font-bold text-gray-900 text-sm">{value}</div>
              <div className="text-xs text-gray-400">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 交易操作区 - 显示大白话解释 + 推荐标注 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">💰 选择交易目标</div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-600 font-medium">⭐推荐</span>
            <span className="text-[10px] text-gray-400">|</span>
            <span className="text-[10px] text-red-400">✗不建议</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {availableAssets.map((asset) => {
            const price = getPrice(asset);
            const pos = hasPosition(asset.id);
            const colors = RISK_COLORS[asset.risk_level];
            const rating = rateAsset(asset.id, market);

            // 根据评级决定卡片样式
            const cardClass = pos
              ? 'border-amber-200 bg-amber-50 hover:bg-amber-100'
              : rating === 'hot'
                ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 shadow-sm ring-1 ring-emerald-200'
                : rating === 'avoid'
                  ? 'border-gray-200 bg-gray-50 opacity-60 hover:opacity-80'
                  : colors.bg + ' hover:opacity-90';

            return (
              <button
                key={asset.id}
                onClick={() => setTradeTarget(asset)}
                className={`relative p-3 rounded-xl border text-left transition-all group ${cardClass}`}
              >
                {/* 推荐/不建议徽章 */}
                {rating === 'hot' && (
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 shadow-sm">
                    推荐
                  </div>
                )}
                {rating === 'avoid' && (
                  <div className="absolute -top-2 -right-2 bg-gray-400 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full z-10">
                    不建议
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm leading-tight transition-colors ${
                      rating === 'hot' ? 'text-emerald-800 group-hover:text-emerald-900' :
                      rating === 'avoid' ? 'text-gray-400' :
                      'text-gray-800 group-hover:text-gray-900'
                    }`}>
                      {asset.name}
                    </div>
                    {/* 大白话解释 hover 时显示 */}
                    <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2 leading-relaxed">
                      {asset.explain}
                    </div>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${colors.text}`}>{asset.risk_level}</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="font-mono text-xs text-gray-500">${price.toFixed(2)}</div>
                  {pos && <span className="text-xs text-amber-600">● 已持仓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 当前持仓列表 */}
      {positions.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-2">💼 当前持仓</div>
          <div className="space-y-2">
            {positions.map((pos) => (
              <div
                key={pos.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  pos.pnl >= 0
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div>
                  <div className="text-sm text-gray-800">{pos.label}</div>
                  <div className="text-xs text-gray-400">投入 ${pos.amount.toLocaleString()} · x{pos.leverage}</div>
                </div>
                <div className="text-right">
                  <div className={`font-mono font-bold text-sm flex items-center gap-0.5 ${pos.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    <span>{pos.pnl >= 0 ? '▲' : '▼'}</span>
                    <span>{pos.pnl >= 0 ? '+' : ''}{pos.pnl_pct.toFixed(1)}%</span>
                  </div>
                  <button
                    onClick={() => onClose(pos.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-0.5"
                  >
                    平仓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 政府动向 */}
      {govLog.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-2">📜 政府动向</div>
          <div className="space-y-1">
            {govLog.slice(0, 3).map((log, i) => (
              <div key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                <span className="text-gray-400 shrink-0">•</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
