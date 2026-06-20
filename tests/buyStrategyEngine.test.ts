import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateBuyStrategy, getConcretePatterns, getPositionPhases, type StrategyInput } from '../src/utils/buyStrategyEngine.ts';

const base: StrategyInput = { marketBackground: 'BULL_TREND', positionPhase: 'PULLBACK', concretePattern: 'SHALLOW_PULLBACK' };
const evaluate = (changes: Partial<StrategyInput>) => evaluateBuyStrategy({ ...base, ...changes });

test('上涨趋势浅回调可买 H1', () => {
  const result = evaluate({});
  assert.equal(result.decision, 'BUY');
  assert.equal(result.entryType, 'H1');
  assert.equal(result.riskHint, 'none');
});

test('EMA21 回踩只等 H2', () => {
  const result = evaluate({ concretePattern: 'EMA21_TOUCH' });
  assert.equal(result.decision, 'BUY');
  assert.equal(result.entryType, 'H2');
});

test('高位加速不新开仓', () => {
  const result = evaluate({ positionPhase: 'ACCELERATION', concretePattern: 'NONE' });
  assert.equal(result.decision, 'WATCH');
  assert.equal(result.entryType, 'NONE');
  assert.equal(result.riskHint, 'overheating');
});

test('楼形整理标记分歧', () => {
  const result = evaluate({ positionPhase: 'CONSOLIDATION', concretePattern: 'WEDGE' });
  assert.equal(result.decision, 'WATCH');
  assert.equal(result.riskHint, 'divergence');
});

test('下降趋势反弹不买', () => {
  const result = evaluate({ marketBackground: 'BEAR_TREND', positionPhase: 'BOUNCE', concretePattern: 'BOUNCE_TO_RESISTANCE' });
  assert.equal(result.decision, 'DO_NOT_BUY');
  assert.equal(result.entryType, 'NONE');
});

test('下降趋势只保留反转突破回踩例外', () => {
  const result = evaluate({ marketBackground: 'BEAR_TREND', positionPhase: 'REVERSAL_TRY', concretePattern: 'REVERSAL_BREAKOUT_RETEST' });
  assert.equal(result.decision, 'WATCH');
  assert.equal(result.entryType, 'REVERSAL_BREAKOUT_PULLBACK');
});

test('区间中部不买', () => {
  const result = evaluate({ marketBackground: 'TRADING_RANGE', positionPhase: 'MIDDLE', concretePattern: 'NONE' });
  assert.equal(result.decision, 'DO_NOT_BUY');
});

test('区间下沿阳线反包可买', () => {
  const result = evaluate({ marketBackground: 'TRADING_RANGE', positionPhase: 'LOWER_EDGE', concretePattern: 'BULL_ENGULF_LOWER_EDGE' });
  assert.equal(result.decision, 'BUY');
  assert.equal(result.entryType, 'LOWER_EDGE_BULL_ENGULF');
});

test('区间上沿突破回踩可买', () => {
  const result = evaluate({ marketBackground: 'TRADING_RANGE', positionPhase: 'UPPER_EDGE', concretePattern: 'BREAKOUT_PULLBACK' });
  assert.equal(result.decision, 'BUY');
  assert.equal(result.entryType, 'BREAKOUT_PULLBACK');
});

test('背景与阶段选项正确联动', () => {
  assert.deepEqual(getPositionPhases('BEAR_TREND').map((item) => item.value), ['BOUNCE', 'REVERSAL_TRY']);
  assert.deepEqual(getConcretePatterns('LOWER_EDGE').map((item) => item.value), ['DOUBLE_BOTTOM', 'FAILED_BREAKDOWN_RECLAIM', 'BULL_ENGULF_LOWER_EDGE']);
});
