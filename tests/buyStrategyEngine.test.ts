import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateBuyStrategy,
  getEntryTriggers,
  getStrategySummary,
  getTradingScenarios,
  type StrategyInput,
} from '../src/utils/buyStrategyEngine.ts';

const base: StrategyInput = {
  marketBackground: 'STRONG_UP',
  tradingScenario: 'SHALLOW_PULLBACK',
  entryTrigger: 'H1_CONFIRM',
  volumePriceConfirmed: true,
};
const evaluate = (changes: Partial<StrategyInput>) => evaluateBuyStrategy({ ...base, ...changes });

test('强势上涨浅回调确认后触发成立', () => {
  const result = evaluate({});
  assert.equal(result.decision, 'BUY');
  assert.equal(result.entryType, 'H1_CONFIRM');
});

test('量价未确认只能等待', () => {
  assert.equal(evaluate({ volumePriceConfirmed: false }).decision, 'WATCH');
});

test('策略摘要使用触发成立而不是提前判定可买', () => {
  assert.match(getStrategySummary(base), /触发成立$/);
});

test('普通上涨两段式回调禁止H1', () => {
  const triggers = getEntryTriggers('TWO_LEG_PULLBACK').map(item => item.value);
  assert.deepEqual(triggers, ['H2_CONFIRM']);
});

test('平台突破场景只允许放量突破', () => {
  assert.deepEqual(getEntryTriggers('PLATFORM_CONSOLIDATION').map(item => item.value), ['VOLUME_BREAKOUT']);
});

test('突破后首次回踩只允许回踩确认转强', () => {
  assert.deepEqual(getEntryTriggers('FIRST_BREAKOUT_RETEST').map(item => item.value), ['RETEST_TURN_STRONG']);
});

test('区间下沿各场景互不重叠', () => {
  assert.deepEqual(getEntryTriggers('RANGE_LOWER_DOUBLE_BOTTOM').map(item => item.value), ['NECKLINE_BREAK']);
  assert.deepEqual(getEntryTriggers('RANGE_FAILED_BREAKDOWN_ZONE').map(item => item.value), ['FAILED_BREAKDOWN_CONFIRM']);
  assert.deepEqual(getEntryTriggers('RANGE_LOWER_BULL_ENGULF').map(item => item.value), ['BULL_ENGULF_HIGH_BREAK']);
});

test('普通上涨正常回调与深回调使用不同确认', () => {
  assert.deepEqual(getEntryTriggers('TWO_LEG_PULLBACK').map(item => item.value), ['H2_CONFIRM']);
  assert.deepEqual(getEntryTriggers('DEEP_PULLBACK_DOUBLE_BOTTOM').map(item => item.value), ['NECKLINE_BREAK']);
  assert.deepEqual(getEntryTriggers('DEEP_PULLBACK_BREAK_LH_RETEST').map(item => item.value), ['RETEST_TURN_STRONG']);
});

test('区间中部不买', () => {
  const result = evaluate({
    marketBackground: 'TRADING_RANGE',
    tradingScenario: 'RANGE_MIDDLE',
    entryTrigger: 'NONE',
  });
  assert.equal(result.decision, 'DO_NOT_BUY');
});

test('下降趋势三推衰竭在确认后可交易', () => {
  const result = evaluate({
    marketBackground: 'DOWN_TREND',
    tradingScenario: 'DOWN_THREE_PUSH_SUPPORT',
    entryTrigger: 'H2_CONFIRM',
  });
  assert.equal(result.decision, 'BUY');
  assert.match(result.note, /逆势早期交易/);
});

test('突破前LH后的首次回调在确认后可交易', () => {
  const result = evaluate({
    marketBackground: 'DOWN_TREND',
    tradingScenario: 'DOWN_BREAK_LH_FIRST_PULLBACK',
    entryTrigger: 'RETEST_TURN_STRONG',
  });
  assert.equal(result.decision, 'BUY');
});

test('下降趋势普通反弹至压力位放弃', () => {
  const result = evaluate({
    marketBackground: 'DOWN_TREND',
    tradingScenario: 'DOWN_BOUNCE_RESISTANCE',
    entryTrigger: 'NONE',
  });
  assert.equal(result.decision, 'PASS');
});

test('结构不清直接放弃', () => {
  const result = evaluate({
    marketBackground: 'UNCLEAR',
    tradingScenario: 'NO_SCENARIO',
    entryTrigger: 'NONE',
  });
  assert.equal(result.decision, 'PASS');
});

test('五类市场环境正确联动', () => {
  assert.equal(getTradingScenarios('STRONG_UP').length, 4);
  assert.equal(getTradingScenarios('NORMAL_UP').length, 6);
  assert.equal(getTradingScenarios('TRADING_RANGE').length, 7);
  assert.equal(getTradingScenarios('DOWN_TREND').length, 3);
  assert.deepEqual(getTradingScenarios('UNCLEAR').map(item => item.value), ['NO_SCENARIO']);
});
